import OpenAI from 'openai';
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import mongoose from "mongoose";
import { createContent, findContent, insertMultiContent, updateOneContent } from "@/server/db/mongodb/content/content.query";
import { findTask, insertMultiTask } from '@/server/db/mongodb/task/task.query';
import moment from 'moment';
import { getUserById, updateOneUser } from '@/server/db/mongodb/user/user.query';
import { checkCurrentPlan, scriptLimitsByPlan } from '@/config';
import { createOrUpdateSearchHistory, getSearchQueryByURLOrQuery } from '@/server/db/mongodb/search-history/search-history.query';
import { perplexityWebBrowsingToolFunction } from './tools-helper';

const ObjectId = mongoose.Types.ObjectId;

export const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": `${process.env.NEXT_PUBLIC_APP_URL}`,
        "X-Title": "Klque"
    }
});

// Enhanced type definitions
type SearchType = "general" | "trending_ideas" | "niche_trends" | "url_analysis";

// Optimized prompt builder with better structure
export const buildPrompt = ({ url, query, searchType, dateString }: {
    url?: string | null;
    query: string;
    searchType: SearchType;
    dateString: string;
}): string => {
    if (url) {
        return `Analyze this URL and provide actionable insights:
URL: ${url}
Date: ${dateString}

Return a structured summary with:
• Title, author, publication date
• 3-5 key insights with brief quotes
• Metrics/data points/timelines
• Content creation opportunities (3-5 bullet points)
• Suggested post angles/hooks`;
    }

    const searchPrompt = `Search current web data (${dateString}) for: ${query}

Required output:
1. Latest trends with concrete examples
2. Engagement metrics (views, shares, likes)
3. Platform-specific content ideas (titles, hooks, CTAs)
4. Recent developments with dates
5. Trending hashtags/keywords`;

    return searchType === "general"
        ? `Find current information (${dateString}) about: ${query}\n\nInclude citations.`
        : searchPrompt;
};

// Optimized URL domain extraction
const extractDomain = (url?: string | null): string[] | undefined => {
    if (!url) return undefined;
    try {
        return [new URL(url).hostname];
    } catch {
        return undefined;
    }
};

// Enhanced result formatting with better structure
export const formatSearchResult = ({
    heading,
    content,
    sources = [],
    meta
}: {
    heading: string;
    content: string;
    sources?: string[];
    meta?: { model?: string; requestId?: string };
}): string => {
    const sections = [`**${heading}**\n`, content.trim() || "_No results found._"];

    if (sources.length) {
        sections.push(`\n**Sources:**`);
        sources.slice(0, 8).forEach((url, idx) =>
            sections.push(`${idx + 1}. ${url}`)
        );
    }

    if (meta?.model || meta?.requestId) {
        sections.push(
            `\n*Powered by ${meta.model || 'OpenAI'}${meta.requestId ? ` • ID: ${meta.requestId}` : ''
            }*`
        );
    }

    return sections.join("\n");
};

// TOOL 1: Enhanced Web Browsing Tool
export const webBrowsingTool = (userId: string) => {
    return tool(
        async ({ searchQueries }) => {
            console.log("🔍 Web browsing request:", { searchQueries });

            if (!Array.isArray(searchQueries) || searchQueries.length === 0) {
                return "No search queries provided. Please include at least one search query object with url and/or query parameters.";
            }

            // Process all search queries in parallel
            const processSearchQuery = async (searchQuery: { url?: string | null; query?: string; searchType?: SearchType }) => {
                const { url = "", query = "", searchType = "general" } = searchQuery;

                const dateString = new Date().toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric"
                });

                if (!url && !query) {
                    return "Please provide either a URL to analyze or a search query.";
                }

                if (url && url !== "/" || query) {
                    // check if search history exists
                    const searchHistory: any = await getSearchQueryByURLOrQuery(url, !url ? query : null);
                    if (searchHistory) {
                        return formatSearchResult({
                            heading: `📄 Page Analysis (${dateString})`,
                            content: searchHistory?.result || "No results found.",
                            sources: [],
                            meta: searchHistory?.meta || {}
                        });
                    }
                }

                const prompt = buildPrompt({ url: url || "", query: query || "", searchType, dateString });
                const sites = extractDomain(url);

                try {
                    // Primary: Use search-enabled model
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o-mini-search-preview",
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.1,
                    });

                    const content = response.choices?.[0]?.message?.content ?? "";
                    const urls = content.match(/https?:\/\/[^\s\]\)>"']+/g)?.slice(0, 8) ?? [];
                    // save search history
                    createOrUpdateSearchHistory({
                        userId,
                        url,
                        query,
                        tool: "Web_Browsing_Tool",
                        toolInput: { url, query, searchType },
                        result: content,
                        sources: Array.from(new Set(urls)),
                        meta: { model: "gpt-4o-mini-search-preview" }
                    });

                    return formatSearchResult({
                        heading: url
                            ? `📄 Page Analysis (${dateString})`
                            : `🔍 Live Web Results (${dateString})`,
                        content,
                        sources: [],
                        meta: { model: "gpt-4o-mini-search-preview" }
                    });

                } catch (error) {
                    console.error("Search API failed, using fallback:", error);

                    // Fallback: Use standard model with training data
                    const fallbackResponse = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [{
                            role: "user",
                            content: url
                                ? `Based on training data, analyze what users typically find at: ${url}\nInclude a disclaimer about potential outdated information.`
                                : `Using training data only, provide evergreen insights about: ${query}\nNote: This may not include recent developments.`
                        }],
                        temperature: 0.2,
                    });

                    const content = fallbackResponse.choices?.[0]?.message?.content ?? "";
                    return formatSearchResult({
                        heading: `⚠️ Offline Analysis (Training Data Only)`,
                        content: content + "\n\n_⚠️ Disclaimer: Information may be outdated - no live web access._",
                        sources: [],
                        meta: { model: "gpt-4o-offline" }
                    });
                }
            };

            // Execute all search queries in parallel
            const results = await Promise.all(
                searchQueries.map(searchQuery => {
                    // Ensure query is string | undefined, never null
                    const { url, query, searchType = "general" } = searchQuery;
                    return processSearchQuery({ url, query: query ?? undefined, searchType });
                })
            );

            return results.join('\n\n');
        },
        {
            name: "Web_Browsing_Tool",
            description: "Analyze URLs or search the web for current trends, insights, and actionable content ideas with real-time data and proper citations. Make sure to get all search related queries and urls are structured in one array of object with query and url key.",
            schema: z.object({
                searchQueries: z.array(z.object({
                    url: z.string().nullable().optional().describe("Website URL to analyze for content strategy insights"),
                    query: z.string().nullable().optional().describe("Search query for trending topics and current information"),
                    searchType: z.enum(["general", "trending_ideas", "niche_trends", "url_analysis"])
                        .default("general")
                        .describe("Search intent: general info, trending content ideas, niche trends, or URL analysis")
                })).min(1).describe("Array of search query objects to process")
            })
        }
    );
};

// TOOL 2: Enhanced Web Browsing Tool
export const perplexityWebBrowsingTool = (userId: string) => {
    return tool(
        async ({ url = "", query = "", searchType = "general", userId }: { url?: string | null, query?: string, searchType?: SearchType, userId: string }) => {
            const result = await perplexityWebBrowsingToolFunction({ url, query, searchType, userId });
            return `Return the following message to the user verbatim—absolutely no modifications, no summarization, no rephrasing, no formatting changes:
${result}`;
        }
        ,
        {
            name: "Perplexity_Web_Browsing_Tool",
            description: "Analyze URLs or search the web for more details about the provided url using Perplexity Sonar API.",
            schema: z.object({
                url: z.string().nullable().optional().describe("Website URL to analyze for content strategy insights"),
                query: z.string().nullable().optional().describe("Search query for trending topics and current information"),
                searchType: z.enum(["general", "trending_ideas", "niche_trends", "url_analysis"])
                    .default("general")
                    .describe("Search intent: general info, trending content ideas, niche trends, or URL analysis")
            })
        }
    );
};

// TOOL 2: Optimized Script Addition Tool
const ScriptSchema = z.object({
    id: z.string()
        .describe('Unique script identifier, formatted as "SCR" followed immediately by 8 digits (e.g., SCR00001234). Leave empty if new script.'),

    ideaTitle: z.string()
        .min(1)
        .describe('A short, punchy title that captures the main idea of the script in under 4-6 words. Must be specific, attention-grabbing, and directly reflect the core topic.'),

    hook: z.string()
        .min(1)
        .describe('The very first line that grabs attention instantly. It should spark curiosity, address a problem, or provoke emotion within 1–2 sentences.'),

    body: z.string()
        .min(1)
        .describe('The main content section that expands on the hook. Include clear explanations, relevant examples, and actionable tips. Should flow logically toward the conclusion.'),

    conclusion: z.string()
        .min(1)
        .describe('A strong closing that reinforces the main takeaway, benefit, or insight. Should leave a lasting impression in 1–2 impactful sentences.'),

    CTA: z.string()
        .min(1)
        .describe('A direct and engaging call-to-action telling the audience exactly what to do next (e.g., follow, comment, share, visit link). Keep it concise and persuasive.'),

    targetAudience: z.string()
        .min(1)
        .describe('A clear definition of the intended audience for this content (e.g., "Beginner Forex Traders", "Small Business Owners", "Gen Z Gamers"). Be specific.'),

    focus: z.string()
        .min(1)
        .describe('The primary purpose or intent of the content, stated in a short phrase (e.g., "educate on healthy eating", "motivate daily gym habits").'),

    contentPillar: z.string()
        .min(1)
        .describe('The strategic content category or theme this piece belongs to (e.g., "Education", "Inspiration", "Entertainment", "Promotion").'),

    contentType: z.string()
        .min(1)
        .describe('The style or format of content (e.g., "Short-form video", "Carousel post", "Blog article").'),

    platform: z.string()
        .min(1)
        .describe('The platform where this content will be posted (e.g., Instagram, LinkedIn, YouTube, TikTok).'),

    postingDate: z.string()
        .regex(/^\d{2}\/\d{2}\/\d{4}$/)
        .describe('The planned publishing date in strict MM/DD/YYYY format (e.g., 08/15/2025).'),
    captions: z.array(z.string()).min(1).max(3).describe('1-3 platform-ready captions'),
    hashtags: z.array(z.string()).min(5).max(10).describe('5-10 relevant hashtags for discoverability')
});


export const addScriptsToPlan = (userId: string, historyId: string) => {
    return tool(
        async ({ scripts }) => {
            console.log("📝 Adding scripts to plan:", { count: scripts.length, userId });

            try {
                if (!Array.isArray(scripts) || scripts.length === 0) {
                    return "No valid scripts provided. Please include at least one script to add to your plan.";
                }

                const validScripts = [];
                const updatableScripts = [];
                const invalidPostingDates = [];

                for (const script of scripts) {
                    const { id: scriptId, ideaTitle, postingDate, ...rest } = script;

                    if (!moment(postingDate, "MM/DD/YYYY").isAfter(moment())) {
                        invalidPostingDates.push({ scriptId, postingDate });
                    }

                    const newObj = {
                        scriptId,
                        userId,
                        historyId: new ObjectId(historyId),
                        ideaTitle,
                        ...rest,
                        script: rest?.body,
                        cta: rest?.CTA,
                        captions: rest?.captions || [],
                        hashtags: rest?.hashtags || [],
                        postingDate: moment(postingDate, "MM-DD-YYYY").toDate(),
                    };

                    // Check for existing content
                    const existing = await findContent({ scriptId, ideaTitle, historyId });
                    if (existing?.id) {
                        updatableScripts.push({ ...existing?._doc, ...newObj });
                        continue;
                    }

                    validScripts.push(newObj);
                }

                if (invalidPostingDates.length > 0) {
                    return `⚠️ The following scripts have invalid posting dates: ${invalidPostingDates.map(({ scriptId, postingDate }) => `${scriptId} (${postingDate})`).join(', ')}. Please update these dates before adding to your plan.`;
                }

                if (validScripts.length === 0 && updatableScripts.length === 0) {
                    return `✅ All ${scripts.length} script(s) already exist in your plan. Your content library is up to date!`;
                }

                let insertedCount = 0;
                for (const script of validScripts) {
                    const userDetails = await getUserById(userId);
                    const currentPlan = checkCurrentPlan(userDetails?.plan, userDetails, userDetails?.planTime === "year") ? userDetails?.plan : "basic";
                    // Check if user has used all credits
                    if (currentPlan && userDetails?.savedScriptsCount >= scriptLimitsByPlan[currentPlan || "basic"]) {
                        return 'You have used all your saved scripts limit. Please upgrade to add more scripts.';
                    }
                    await createContent(script);
                    await updateOneUser("_id", new ObjectId(userId), { savedScriptsCount: (Number(userDetails?.savedScriptsCount) || 0) + 1 });
                    insertedCount++;
                }

                let updatedCount = 0;
                for (const script of updatableScripts) {
                    const userDetails = await getUserById(userId);
                    const currentPlan = checkCurrentPlan(userDetails?.plan, userDetails, userDetails?.planTime === "year") ? userDetails?.plan : "basic";
                    // Check if user has used all credits
                    if (currentPlan && userDetails?.savedScriptsCount >= scriptLimitsByPlan[currentPlan || "basic"]) {
                        return 'You have used all your saved scripts limit. Please upgrade to add more scripts.';
                    }
                    const { _id, __v, createdAt, updatedAt, ...rest } = script;
                    await updateOneContent("_id", _id, rest);
                    await updateOneUser("_id", new ObjectId(userId), { savedScriptsCount: (Number(userDetails?.savedScriptsCount) || 0) + 1 });
                    updatedCount++;
                }

                let resultMessage = `✅ Successfully added ${insertedCount} script${insertedCount !== 1 ? 's' : ''} to your content plan!`;

                if (updatedCount > 0) {
                    resultMessage += ` (${updatedCount} updated)`;
                }

                return resultMessage;

            } catch (error) {
                console.error('Script addition error:', error);
                return "Failed to add scripts to your plan. Please try again or contact support if the issue persists.";
            }
        },
        {
            name: "Add_Scripts_To_Plan_Tool",
            description: "Add multiple content scripts to user's content plan with duplicate detection and comprehensive validation.",
            schema: z.object({
                scripts: z.array(ScriptSchema)
                    .min(1)
                    .max(50)
                    .describe('A list containing between 1 and 50 complete content scripts, each following the ScriptSchema format. Each script must be fully detailed, ready for direct inclusion in a content plan, and tailored to its specified platform and audience.')
            })
        }
    );
};

// TOOL 3: Optimized Task Management Tool
const TaskSchema = z.object({
    title: z.string().describe('Clear task description (5-100 characters)'),
    dueDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).describe('Task deadline in MM/DD/YYYY format'),
    priority: z.enum(['high', 'medium', 'low']).default('medium')
        .describe('Task priority level: high (urgent), medium (normal), low (when time permits)'),
});

const TaskListSchema = z.object({
    id: z.string().regex(/^SCR\d{8}$/).describe('Associated script ID (format: SCR + 8 digits)'),
    tasks: z.array(TaskSchema).min(1).max(20)
        .describe('Array of 1-20 tasks for this script')
});

export const saveTaskListToPlan = (userId: string, historyId: string) => {
    return tool(
        async ({ taskLists }) => {
            console.log("📋 Saving task lists:", { count: taskLists.length, userId });

            try {
                if (!Array.isArray(taskLists) || taskLists.length === 0) {
                    return "No task lists provided. Please include tasks to add to your plan.";
                }

                const newTasks = [];
                let scriptsNotFound = [];
                let duplicatesSkipped = 0;
                let invalidTaskDates = [];

                for (const taskList of taskLists) {
                    const { id: scriptId, tasks } = taskList;

                    // Find associated content script
                    const associatedContent = await findContent({ userId, historyId, scriptId });
                    if (!associatedContent?.id) {
                        scriptsNotFound.push(scriptId);
                        continue;
                    }

                    // Process tasks for this script
                    for (const task of tasks) {
                        const existing = await findTask({
                            userId,
                            contentId: associatedContent.id,
                            title: task.title
                        });

                        if (existing?.id) {
                            duplicatesSkipped++;
                            continue;
                        }

                        if (moment(task.dueDate, "MM-DD-YYYY").isBefore(moment().startOf('day'))) {
                            invalidTaskDates?.push({ date: task.dueDate, title: task.title })
                            continue;
                        }

                        newTasks.push({
                            userId,
                            contentId: associatedContent.id,
                            title: task.title,
                            priority: task.priority,
                            date: moment(task.dueDate, "MM-DD-YYYY").toDate(),
                        });
                    }
                }

                if (invalidTaskDates.length > 0) {
                    return `⚠️ The following tasks have invalid due dates: ${invalidTaskDates.map(({ date, title }) => `${title} (${date})`).join(', ')}. Please update these dates before adding to your plan.`;
                }

                // Handle errors
                if (scriptsNotFound.length > 0) {
                    return `Script(s) not found: ${scriptsNotFound.join(', ')}. Please create the scripts first before adding tasks.`;
                }

                if (newTasks.length === 0) {
                    return `✅ All tasks already exist in your plan! ${duplicatesSkipped > 0 ? `(${duplicatesSkipped} duplicates found)` : ''}`;
                }

                // Insert new tasks
                const inserted = await insertMultiTask(newTasks);

                let resultMessage = `✅ Successfully added ${inserted.length} task${inserted.length !== 1 ? 's' : ''} to your plan!`;
                if (duplicatesSkipped > 0) {
                    resultMessage += ` (${duplicatesSkipped} duplicate${duplicatesSkipped !== 1 ? 's' : ''} skipped)`;
                }

                return resultMessage;

            } catch (error) {
                console.error('Task list save error:', error);
                return "Failed to save tasks to your plan. Please try again or contact support if the issue persists.";
            }
        },
        {
            name: "Save_Task_List_To_Plan_Tool",
            description: "Save task lists associated with content scripts, with duplicate detection and validation for efficient project management.",
            schema: z.object({
                taskLists: z.array(TaskListSchema).min(1).max(20)
                    .describe('Array of 1-20 task lists, each linked to a content script ID')
            })
        }
    );
};