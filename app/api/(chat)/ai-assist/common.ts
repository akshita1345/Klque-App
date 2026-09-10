import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { perplexityWebBrowsingTool, webBrowsingTool } from './tools';
import mongoose from 'mongoose';
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from '@langchain/core/prompts';
import { createChatConversation } from '@/server/db/mongodb/chat-conversation/chat-conversation.query';
import { aiAssistPrompt, initialPrompt } from './prompt';
import { getUserById, updateOneUser } from '@/server/db/mongodb/user/user.query';
import { AgentPrompts, AgentsEnum, getThePrompt } from './AgentPrompts';
import { langfuseHandler } from '@/server/middleware/middleware';
import { getLastGeneratedScript } from '@/server/services/chat-conversation.service';

declare global {
    var Industry: any;
    var Prompt: any;
}

interface CategoryScores {
    [category: string]: number;
}
const ObjectId = mongoose.Types.ObjectId;

import moment from "moment";
export const formatAiAndHumanMessages = (message: any) => {
    const datetime = moment(message?.timestamp || message?.createdAt).format("MMM-DD-YYYY HH:mm:ss");
    if (['aibot']?.includes(message?.senderId)) {
        let content = message?.message;
        if (message?.generatedDocs?.length) {
            content += `\n\nScripts added into plan:\n\n - ${message?.generatedDocs?.map((doc: any) => `Script Id - (${doc?.scriptId})`).join("\n\n")}`
        }
        return new AIMessage(`[Date: ${datetime}] ${content || ""}`);
    }
    return new HumanMessage(`[Date: ${datetime}] ${message?.message || ""}`);
};

// Function to format chat history for AI and Human messages
export const formatChatHistory = (message: any) => {
    const datetime = moment(message?.timestamp || message?.createdAt).format("MMM-DD-YYYY HH:mm:ss");
    if (['aibot']?.includes(message?.senderId)) {
        let content = message?.message;
        if (message?.generatedDocs?.length) {
            content += `\n\nScripts added into plan:\n\n - ${message?.generatedDocs?.map((doc: any) => `Script Id - (${doc?.scriptId})`).join("\n\n")}`
        } else if (message?.generatedTasks?.length) {
            content = JSON.stringify({
                "type": "TASK_GENERATION",
                "content": content,
                "generatedTasks": message?.generatedTasks?.map((task: any) => { delete task?.isSaved; return task; })
            });
        }
        return new AIMessage(`[Date: ${datetime}] ${content || ""}`);
    }
    return new HumanMessage(`[Date: ${datetime}] ${message?.message || ""}`);
};

// Function to extract generated scripts from chat history
const getGeneratedDocsFromChatHistory = (chatHistory: any) => {
    let generatedDocs = chatHistory?.filter((message: any) => {
        return message?.generatedDocs?.length;
    })?.map((message: any) => {
        return message?.generatedDocs?.map((doc: any) => doc?.scriptId);
    });
    generatedDocs = generatedDocs?.flat();
    return generatedDocs;
}

// Function to handle streaming response for chat
export const createStreamingResponse = (content: string) => {
    const responseStream = new ReadableStream({
        start(controller) {
            controller.enqueue(content);
            controller.close();
        }
    });

    return new NextResponse(responseStream, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

// Function to handle content moderation
const moderationPrompt = new PromptTemplate({
    template: `
You are a content moderation assistant.
Check the following text for any policy violations: hate speech, violence, adult content, or disallowed topics.
Respond ONLY with "VIOLATION" if anything is inappropriate, or "OK" if it is safe.

Text: {text}
`,
    inputVariables: ["text"],
});

const llm = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    modelName: "gpt-4o-mini",
    temperature: 0,
    streaming: false,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
});

// Create the ChatOpenAI instance with the "gpt-4o-mini" model and response formatting
const supervisorLLM = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    modelName: "gpt-4.1",
    temperature: 0,
    streaming: false,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
}).bind({ response_format: { type: "json_object" } });

const moderationChain = new LLMChain({
    llm,
    prompt: moderationPrompt,
});

// Function to handle content moderation
export const handleModeration = async (content: string) => {
    const response = await moderationChain.call({ text: content });
    const answer = response.text.trim().toUpperCase();

    if (answer?.includes("VIOLATION")) {
        console.log("Message flagged:", content);
        return "We received an error processing your request. Could you please rephrase your request.";
    }

    return null; // Safe
};

// Helper function to create an agent with a prompt
export const createAgent = async (
    modelName: string,
    tools: any,
    systemMessage: string
) => {
    // Define the dynamic prompt
    const answerPrompt = ChatPromptTemplate.fromMessages([
        ['system', systemMessage],
        new MessagesPlaceholder('chat_history'),
        ['user', '{input}'],
        new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Create the LLM model bound to tools and JSON schema
    let model = new ChatOpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        modelName: modelName,
        temperature: 0,
        configuration: { baseURL: "https://openrouter.ai/api/v1", timeout: 5 * 60 * 1000 },
    });

    // bind tools to the model and explicitly enable parallel tool calls
    const modelWithTools = model.bindTools(tools, { parallel_tool_calls: true });

    // create the tool-calling agent from the model that already has tools bound
    const agent = await createToolCallingAgent({
        llm: modelWithTools,
        tools,
        prompt: answerPrompt,
    });

    // Return the agent executor with parallel tool calling enabled (by virtue of the bound model)
    return new AgentExecutor({
        agent,
        tools,
        verbose: false,
        maxIterations: 3,
    });

};

// Function to create a supervisor agent with a dynamic prompt and tools
export const createSupervisorAgent = async (llm: any, tools: any, systemMessage: any) => {

    const answerPrompt = ChatPromptTemplate.fromMessages([
        ['system', systemMessage],
        new MessagesPlaceholder('chat_history'),
        ['user', '{input}'],
        new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Create the agent with dynamic prompt and tools
    const agent = await createToolCallingAgent({
        llm,
        tools: tools,
        prompt: answerPrompt,
    });

    // Create the agent executor
    const agentExecutor = new AgentExecutor({
        agent,
        tools: tools,
        // verbose: true
    });

    return agentExecutor;
}

// Function to invoke the supervisor agent with question, history, user ID, and history ID
export const invokeSupervisorAgent = async (
    question: any,
    history: any,
    userId: any,
    historyId: any
) => {

    // Fetch user with complete onboarding data
    const userDetails: any = await getUserById(userId);

    // Get personalized data from user's onboarding
    // const personalizedPrompt = await generatePersonalizedPrompt(userDetails);

    const prompt: string = await getThePrompt(AgentPrompts.SUPERVISOR);

    const agent = await createSupervisorAgent(supervisorLLM, [], prompt);

    return agent.invoke(
        { input: question, chat_history: history },
        { callbacks: [langfuseHandler], metadata: { langfuseUserId: userDetails?.email || "" } },
    );
};

// Wrapper for creating an agent with a specific prompt
const createAgentWithPrompt = async (
    prompt: string,
    tools: any,
    modelName: string
) => createAgent(modelName, tools, prompt);

// Creates and configures an agent with user-specific tools
const IDEATE_AI_AGENT = async (modelName: string, userId: string, historyId: string, agentType: AgentsEnum, userDetails: any, chatContext: string, generatedDocs: string[], lastScript?: any) => {
    // Helper function to create agent with consistent configuration
    const createAgentWithConfig = async (promptType: AgentsEnum | string, isInitial = false, tools?: any) => {
        // Base configuration for all agents
        const baseConfig = {
            tools: tools || [],
            modelName
        };
        const personalizedPrompt = await generatePersonalizedPrompt(userDetails, isInitial, chatContext);
        const prompt = getThePrompt(promptType as AgentPrompts, personalizedPrompt, generatedDocs, lastScript);
        return createAgentWithPrompt(prompt, baseConfig.tools, baseConfig.modelName);
    };

    // Map of agent types to their creation functions
    const agentMap = new Map<AgentsEnum | AgentPrompts, () => Promise<AgentExecutor>>([
        [AgentsEnum.WEB_SEARCH_CONTENT_GENERATION, () => createAgentWithConfig(AgentPrompts.WEB_SEARCH_CONTENT_GENERATION, false, [webBrowsingTool(userId), perplexityWebBrowsingTool(userId)])],
        [AgentsEnum.PLAN_MANAGEMENT, () => createAgentWithConfig(AgentPrompts.PLAN_MANAGEMENT)],
        [AgentsEnum.TASK_GENERATION, () => createAgentWithConfig(AgentPrompts.TASK_GENERATION)],
        [AgentsEnum.GENERAL_QUERIES, () => createAgentWithConfig(AgentPrompts.GENERAL_QUERIES, false, [webBrowsingTool(userId)])],
        [AgentPrompts.INITIAL_MESSAGE, () => createAgentWithConfig(AgentPrompts.INITIAL_MESSAGE, true)],
        [AgentPrompts.SCRIPT_GENERATION, () => createAgentWithConfig(AgentPrompts.SCRIPT_GENERATION, false, [webBrowsingTool(userId)])],
    ]);

    console.log("Selected agentType:", agentType);

    const agentCreator = agentMap.get(agentType);
    if (!agentCreator) {
        throw new Error(`Invalid agent type: ${agentType}`);
    }

    return agentCreator();
};

// Helper function to generate a personalized prompt based on user's onboarding data
const generatePersonalizedPrompt = async (userDetails: any, isInitial?: boolean, chatContext?: string) => {
    // If userDetails is null or undefined, return a default prompt
    if (!userDetails) {
        return aiAssistPrompt({});
    }

    // Start with the base AI assist prompt
    const basePrompt = isInitial ? await initialPrompt(userDetails, chatContext as "first_onboarding" | "new_chat" | undefined) : await aiAssistPrompt(userDetails);

    // If user has no onboarding data, return the base prompt
    if (!userDetails?.onboarding) {
        return basePrompt;
    }

    // Extract onboarding data (with default empty objects/arrays to prevent errors)
    const {
        contentType = [],
        goal = '',
        vibe = [],
        platform = [],
        subContent = [],
        niche = []
    } = userDetails.onboarding || {};

    // Build a personalized context section
    let personalizedContext = `
### User's Content Preferences from Onboarding
`;

    // Safe array check function
    const safeArrayJoin = (value: any) => {
        if (!value) return '';
        if (Array.isArray(value)) return value.filter(Boolean).join(', ');
        return String(value);
    };

    // Add available onboarding data, with null/undefined checks
    if (contentType) personalizedContext += `- **Content Type**: ${safeArrayJoin(contentType)}\n`;
    if (goal) personalizedContext += `- **Content Goal**: ${goal}\n`;
    if (vibe) personalizedContext += `- **Content Vibe**: ${safeArrayJoin(vibe)}\n`;

    // Extract website URL and mission description from platform data
    const platformData = Array.isArray(platform) ? platform : [];
    const websiteUrl = platformData.find(item => item.startsWith('websiteUrl:'))?.replace('websiteUrl:', '');
    const missionDescription = platformData.find(item => item.startsWith('missionDescription:'))?.replace('missionDescription:', '');

    // Add website and mission to context
    if (websiteUrl) personalizedContext += `- **Website**: ${websiteUrl}\n`;
    if (missionDescription) personalizedContext += `- **Mission**: ${missionDescription}\n`;

    // Add other platform data (excluding website and mission)
    const otherPlatformData = platformData.filter(item => !item.startsWith('websiteUrl:') && !item.startsWith('missionDescription:'));
    if (otherPlatformData.length > 0) {
        personalizedContext += `- **Preferred Platforms**: ${otherPlatformData.join(', ')}\n`;
    }

    if (subContent) personalizedContext += `- **Sub-Content Details**: ${safeArrayJoin(subContent)}\n`;
    if (niche && Array.isArray(niche) && niche.length > 0) personalizedContext += `- **Content Niche**: ${niche.join(', ')}\n`;

    // Add personalization instructions
    personalizedContext += `
### Personalization Instructions:
- Prioritize content ideas related to the user's stated preferences above
- Adapt your tone to match their preferred vibe
- Focus recommendations on their preferred platforms
- Reference their specific content niche in examples
- Align all suggestions with their content goals
- Use their website and mission statement to inform content strategy
- Ensure content ideas support their overall brand mission
- Analyze their website content and mission to create highly relevant suggestions
- Consider their brand's unique value proposition when generating ideas
`;

    // Insert the personalized context into the base prompt
    return basePrompt + personalizedContext;
};

// Invokes the appropriate agent with input
export const invokeAppropriateAgent = async (
    modelName: string,
    question: string,
    history: any,
    userId: string,
    historyId: string,
    agentReponse: any,
    chatContext: string,
    generatedDocs: string[],
    lastScript?: any
) => {
    // Fetch user with complete onboarding data
    const userDetails: any = await getUserById(userId);

    const agentExecutor = await IDEATE_AI_AGENT(modelName, userId, historyId, agentReponse?.selected_agent, userDetails, chatContext, generatedDocs, lastScript);

    return agentExecutor.invoke(
        {
            input: `Question: ${question}${agentReponse?.routing_reason ? `, Reason: ${agentReponse?.routing_reason}` : ''}${agentReponse?.context?.workflow_state?.LAST_ASSISTANT_MESSAGE ? `, Last Assistant Message: ${agentReponse?.context?.workflow_state?.LAST_ASSISTANT_MESSAGE}` : ''}`,
            // chat_history: [...(history || []), new AIMessage(JSON.stringify(agentReponse))],
            chat_history: history,
        },
        {
            callbacks: [langfuseHandler],
            metadata: { langfuseUserId: userDetails?.email || "" }
        },
    );
};

// Function to create the agent, execute the chat, and return a response without blocking the AI response time
export const executeAgent = async ({
    message,
    chatHistory,
    userId,
    historyId,
    isInitialPrompt,
    fullChatHistory,
    isFirstQuery,
    isScriptGeneration
}: {
    message: string;
    chatHistory: any[];
    userId: any;
    historyId: any;
    isInitialPrompt: boolean;
    fullChatHistory: any[];
    isFirstQuery: boolean;
    isScriptGeneration: boolean;
}) => {
    try {
        let agentReponse: any = {};

        const chatContext = isFirstQuery ? "first_onboarding" : isInitialPrompt ? "new_chat" : "general_queries";
        if (!isInitialPrompt && !isScriptGeneration) {
            try {
                const supervisorAgentOutput = await invokeSupervisorAgent(message, chatHistory, userId, historyId);
                agentReponse = JSON.parse(supervisorAgentOutput?.output);
            } catch (error) {
                console.error("Error in supervisor agent:", error);
            }
        } else {
            agentReponse = {
                selected_agent: AgentPrompts.INITIAL_MESSAGE,
            }
        }

        if (!agentReponse?.selected_agent) {
            agentReponse = {
                selected_agent: AgentPrompts.GENERAL_QUERIES,
            }
        }

        if (isScriptGeneration) {
            agentReponse.selected_agent = AgentPrompts.SCRIPT_GENERATION;
        }
        console.log("🚀 ~ common.ts:412 ~ executeAgent ~ agentReponse:", JSON.stringify(agentReponse, null, 2));

        const formattedChatHistory = await Promise.all(fullChatHistory.map(formatChatHistory));
        const generatedDocs = getGeneratedDocsFromChatHistory(fullChatHistory);
        const lastScript = await getLastGeneratedScript(userId);
        const result: any = await invokeAppropriateAgent("gpt-4.1", message, formattedChatHistory, userId, historyId, agentReponse, chatContext, generatedDocs, lastScript);
        console.log("🚀 ~ common.ts:414 ~ executeAgent ~ result:", result?.output);

        let response = result?.output, responseMessage = result?.output;
        try {
            // Check if the output is already a valid JSON string
            if (typeof result.output === 'string') {
                // Try to parse as JSON
                response = JSON.parse(result.output);
                responseMessage = response?.content;
            }
        } catch (error: any) {
            if (!result.output.includes('"type":') && !result.output.includes("'type':")) {
                responseMessage = result.output;
            } else {
                console.log("🚀 ~ route.ts:142 ~ handler ~ error:", error?.message);
                // Set a custom understandable message for parse errors
                responseMessage = "I couldn't process that response correctly. Could you please try again or rephrase your question?";
            }
        }

        // Prepare the message data for immediate return (before DB operations)
        const messageData: any = {
            userId: new ObjectId(userId),
            message: response,
            responseMessage: responseMessage,
            senderId: "aibot",
            timestamp: new Date().toISOString(),
            historyId: historyId,
            ...(typeof response === "object" ? {
                generatedScriptIds: response?.generatedScriptIds || [],
                generatedTasks: response?.generatedTasks || [],
                selectPostingDates: response?.selectPostingDates || [],
                isScriptResponse: response?.isScriptResponse || false,
                generatedIdeas: response?.generatedIdeas || [],
            } : {})
        }
        const newMessage = await createChatConversation({ ...messageData, message: responseMessage });

        // Perform database operations asynchronously in the background to avoid blocking
        // This ensures the LLM response is available as soon as possible
        const processDatabaseOperations = async () => {
            try {
                const userDetails = await getUserById(userId);

                if (userDetails?.isLastReplyQue) {
                    await updateOneUser("_id", new ObjectId(userId), {
                        isLastReplyQue: false,
                        isLastReplyIdeaScript: false
                    });
                }
            } catch (dbError) {
                console.error("Database operation error (non-blocking):", dbError);
            }
        };

        // Execute database operations in the background without waiting for them
        processDatabaseOperations().catch(error => {
            console.error("Error in background database operations:", error);
        });

        // Return the response immediately without waiting for database operations
        return { ...messageData, id: newMessage?._id };
    } catch (error) {
        console.error("Error executing agent:", error);
        return {
            userId: new ObjectId(userId),
            message: "Sorry about that — we hit a little snag. Please try again in a moment",
            senderId: "aibot",
            timestamp: new Date().toISOString(),
            isQuestion: false,
            isIdeaScript: false,
            historyId: historyId
        };
    }
};