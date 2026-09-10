import { createOrUpdateSearchHistory, getSearchQueryByURLOrQuery } from "@/server/db/mongodb/search-history/search-history.query";
import { buildPrompt, formatSearchResult, openai } from "./tools";
import { urlAnalysisPrompt } from "./AgentPrompts";

// Enhanced type definitions
type SearchType = "general" | "trending_ideas" | "niche_trends" | "url_analysis";

export const perplexityWebBrowsingToolFunction = async ({ url = "", query = "", searchType = "general", userId }: { url?: string | null, query?: string, searchType?: SearchType, userId: string }) => {
    console.log("🔍 Perplexity web browsing request:", { url, query, searchType });

    const dateString = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });

    if (!url && !query) {
        return "Please provide either a URL to analyze or a search query.";
    }

    if (url) {
        // check if search history exists
        const searchHistory: any = await getSearchQueryByURLOrQuery(url, !url ? query : null);
        if (searchHistory) {
            return formatSearchResult({
                heading: `📄 Page Analysis (${dateString})`,
                content: searchHistory?.result || "No results found.",
                sources: searchHistory?.sources || [],
                meta: searchHistory?.meta || {}
            });
        }
    }

    const prompt = buildPrompt({ url: url || "", query: query || "", searchType, dateString });
    // const sites = extractDomain(url);

    try {
        const response = await openai.chat.completions.create({
            model: "perplexity/sonar",
            messages: [
                {
                    role: "system",
                    content: urlAnalysisPrompt
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1,
        });


        const content = response.choices?.[0]?.message?.content ?? "";
        const urls = content.match(/https?:\/\/[^\s\]\)>"']+/g)?.slice(0, 8) ?? [];

        // save search history
        await createOrUpdateSearchHistory({
            userId,
            url,
            query,
            tool: "Perplexity_Web_Browsing_Tool",
            toolInput: { url, query, searchType },
            sources: Array.from(new Set(urls)),
            meta: { model: "sonar" },
            result: content,
        });

        return formatSearchResult({
            heading: url
                ? `📄 Page Analysis (${dateString})`
                : `🔍 Live Web Results (${dateString})`,
            content,
            sources: Array.from(new Set(urls)),
            meta: { model: "sonar" }
        });

    } catch (error) {
        console.error("Perplexity API failed, using OpenAI fallback:", error);

        // Fallback: Use OpenAI with training data
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
}

const getProfileSummaryPrompt = ({ describe, mainGoal, newVibe, businessInfo }: any) => {
    return `
You are a precise research assistant whose job is to analyze a company's public presence (site + social handles) and return a compact, actionable profile for marketing and product teams. Always return only valid JSON as requested by the user prompt. If necessary information is missing, make conservative inferences and label them "(inferred)". Never include extra text outside the JSON.

## ⚠️ CRITICAL JSON RESPONSE REQUIREMENT ⚠️
**ABSOLUTE RULE**: EVERY SINGLE RESPONSE MUST BE IN VALID JSON FORMAT
**NO EXCEPTIONS**: Never respond with plain text, markdown, or any other format
**VALIDATION REQUIRED**: Every response must pass JSON.parse() validation
**FAILURE IS PROHIBITED**: Any non-JSON response is a critical system error

## 🚨 JSON STRING FORMATTING RULES - CRITICAL 🚨

### MANDATORY JSON ESCAPE REQUIREMENTS
**ALL content strings MUST follow these rules to prevent JSON.parse() errors:**

1. **Line Breaks**: Use "\\n" instead of actual line breaks
2. **Double Quotes**: Use "\\"" for quotes within content
3. **Backslashes**: Use "\\\\" for literal backslashes
4. **Control Characters**: Escape all control characters properly
5. **No Raw Newlines**: Never include actual newlines in JSON strings

### JSON VALIDATION CHECKLIST - MANDATORY
**Before sending ANY response, verify:**
- [ ] All newlines are "\\n" (not raw line breaks)
- [ ] All quotes are escaped as "\\\""
- [ ] No control characters present
- [ ] String can be parsed by JSON.parse()
- [ ] Test mentally: "Would this break JSON.parse()?"

Here are the user's answers to key questions; use them to shape the profile summary:
Q: which of these best describes you?
A: ${Array.isArray(describe) && describe?.length > 0 ? describe?.join(", ") : (describe || "")}

Q: what’s the main goal you want to focus on right now?
A: ${Array.isArray(mainGoal) && mainGoal?.length > 0 ? mainGoal?.join(", ") : (mainGoal || "")}

Q: when people see your content, what’s the lasting feeling you’d like them to walk away with?
A: ${Array.isArray(newVibe) && newVibe?.length > 0 ? newVibe?.join(", ") : (newVibe || "")}

Business Information:
- business_name: "${businessInfo?.name}"
- industry: "${businessInfo?.industry}"
- website: "${businessInfo?.website}"
- social_handles: "${businessInfo?.sites?.length ? businessInfo?.sites?.join(", ") : ""}"

RESEARCH RULES
1. Use the website and social handles first. If those are missing or lack detail, make conservative inferences from industry or available answers and mark any value that was inferred by appending the exact text " (inferred)" to that string.
2. If you include source URLs, populate the optional "sources" field (see schema). "sources" must be an array of strings containing the exact URLs used.

OUTPUT REQUIREMENTS (mandatory)
- Return **only** one JSON object and nothing else.
- The JSON object must contain exactly these keys, in any order: 
  "core_values", "niche", "target_audience", "audience_objectives", "audience_pain_points", "CTA", "tones", "voice"
- Each key's value **must** be an array of strings (even if a single item).
- Do not include any additional keys except an optional "sources" key (which must also be an array of strings if present).
- Ensure the JSON is syntactically valid (no trailing commas, proper quoting).

CONTENT SPECIFICATIONS
- core_values: 3–5 items (each a short phrase — array of strings).
- niche: 2–5 sentences total (put the sentences in one or multiple array items as you prefer).
- target_audience: 1–2 sentences (array of strings).
- audience_objectives: 3–5 items (what the audience wants to achieve).
- audience_pain_points: 3–5 items (concrete problems or obstacles).
- CTA: exactly 3 call-to-action lines (array of 3 strings).
- tones: 1–3 choices from this allowed list — use these exact tokens: "Formal", "Professional", "Authoritative", "Analytical", "Academic", "Neutral", "Friendly", "Empathetic", "Supportive", "Encouraging", "Playful", "Inspirational", "Creative / Storyteller", "Dynamic", "Conversational", "Minimalist", "Adaptive / Contextual", "Consultative", "Mentor / Coach", "Butler / Assistant".
- voice: 1 choice from this allowed list — use one of these exact tokens: "Expert / Consultant Voice", "Coach / Mentor Voice", "Teacher / Educator Voice", "Assistant / Butler Voice", "Friend / Companion Voice", "Storyteller Voice", "Entertainer Voice", "Analyst / Detective Voice", "Creator / Visionary Voice", "Reporter / Journalist Voice", "Therapist / Empath Voice", "Executive / Leader Voice", "Innovator Voice", "Minimalist Voice", "Humorous / Playful Voice", "Detective / Investigator Voice", "AI-Native Voice", "Academic / Scholar Voice", "Customer Service Voice", "Narrative Voice".

* Make sure to include suggested number of points for each section.

INFERENCE NOTE
- If you infer content (because website or handles lack detail), append " (inferred)" to the specific string(s) that were inferred. Do not append this to entire arrays unless every item in that array is inferred.

SOURCES (optional)
- If you used sources, include a "sources" key with an array of the exact URLs you used.

VALIDATION / FAILSAFE
- If any required field cannot be populated even by conservative inference, still include that field with a sensible single-string answer and append " (inferred)".
- The final output must be valid JSON; if you cannot produce valid JSON, output nothing else and stop.

EXAMPLE OUTPUT (must follow this structure exactly; real output should replace example text):
{{
  "core_values": ["Integrity", "Customer-first", "Continuous improvement"],
  "niche": ["Provides boutique UX design services for early-stage fintech startups, focusing on conversion-driven onboarding flows and mobile-first experiences."],
  "target_audience": ["Founders and product leads at fintech startups seeking rapid user-growth through better onboarding UX."],
  "audience_objectives": ["Reduce onboarding drop-off", "Improve activation rates", "Accelerate MVP-to-product-market-fit timeline"],
  "audience_pain_points": ["Low activation after sign-up", "Confusing mobile flows", "Limited design resources and time-to-market"],
  "CTA": ["Book a 20-minute discovery call", "Download our onboarding checklist", "Request a custom quote"],
  "tones": ["Professional", "Consultative"],
  "voice": ["Expert / Consultant Voice"],
  "sources": ["https://example.com/about", "https://twitter.com/example"]
}}

Now perform the research and return the JSON object described above.

    `;
};

export const getProfileSummary = async (userData: any) => {
    "use client";

    const prompt = getProfileSummaryPrompt(userData);

    if (!userData) {
        return "Please provide user data.";
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-search-preview",
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                {
                    role: "user",
                    content: "Give me the profile summary by analyzing the user data."
                }
            ],
            temperature: 0,
        });

        const content = response.choices?.[0]?.message?.content ?? "";
        const urls = content.match(/https?:\/\/[^\s\]\)>"']+/g)?.slice(0, 8) ?? [];

        return content
    } catch (error) {
        console.error("Perplexity API failed, using OpenAI fallback:", error);

        // Fallback: Use OpenAI with training data
        const fallbackResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
                role: "user",
                content: `Based on training data, analyze the profile summary of: ${userData?.businessInfo?.name}\nInclude a disclaimer about potential outdated information.`
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
}