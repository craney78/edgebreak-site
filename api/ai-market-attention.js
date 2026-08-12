export default async function handler(req, res) {

    /* =========================================
       POST ONLY
    ========================================= */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    /* =========================================
       CHECK API KEY
    ========================================= */

    if (!process.env.OPENAI_API_KEY) {

        return res.status(500).json({
            error: "AI service is not configured"
        });

    }


    /* =========================================
       GET COMPANY DATA
    ========================================= */

    const {
        symbol,
        companyName
    } = req.body || {};


    if (!symbol) {

        return res.status(400).json({
            error: "Stock symbol is required"
        });

    }


    const cleanSymbol =
        String(symbol)
            .trim()
            .toUpperCase();


    /* =========================================
       CLEAN COMPANY NAME
    ========================================= */

    const cleanCompanyName =
        String(companyName || "")
            .replace(/\(\[.*?\]\(.*?\)\)/g, "")
            .replace(/https?:\/\/\S+/gi, "")
            .replace(/\[[^\]]+\]/g, "")
            .replace(/\s+/g, " ")
            .trim();


    try {

        /* =====================================
           MARKET ATTENTION + NEWS RESEARCH

           ONE OPENAI REQUEST
           ONE WEB SEARCH ENABLED RESPONSE
        ===================================== */

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${process.env.OPENAI_API_KEY}`

                },

                body: JSON.stringify({

                    model: "gpt-5-mini",

                    tools: [
                        {
                            type: "web_search"
                        }
                    ],

                    tool_choice: "auto",

                    input: `
You are EdgeBreak AI Research.

Research CURRENT MARKET ATTENTION AND RECENT
COMPANY NEWS for the NASDAQ-listed company
represented by ticker:

${cleanSymbol}

Known company name:

${cleanCompanyName || "Not supplied"}

FIRST:

Verify that the current company being researched
is associated with ticker ${cleanSymbol}.

Then perform ONE combined research task covering:

1. Current Market Attention
2. Recent Company News

Use current web search.

Prioritise authoritative and credible sources:

1. Official company website
2. Official investor relations website
3. SEC filings
4. NASDAQ or exchange information
5. Established financial news organisations
6. Publicly accessible Reddit discussions
7. Publicly accessible social media references
8. Other credible financial media

Focus primarily on information from:

- the past 24 hours
- the past several days
- the past 7 days

Older information may be used only when necessary
to explain a current development.


=========================================
PART 1 — MARKET ATTENTION
=========================================


ATTENTION LEVEL

Classify current market attention as exactly
one of:

HIGH
ELEVATED
MODERATE
LOW
LIMITED
NOT VERIFIED

Use HIGH only where there is strong evidence
of unusually intense current attention.

Use ELEVATED where attention appears clearly
above the company's normal level.

Use MODERATE where there is meaningful current
discussion but no strong evidence of unusually
high attention.

Use LOW or LIMITED where current public
attention appears small.

Use NOT VERIFIED where there is insufficient
evidence to classify attention reliably.


=========================================
WHERE
=========================================

Identify where current attention is appearing.

Examples:

Financial media
Company news
SEC filings
Reddit
X
Other social media

Only mention a platform if current activity
was actually found or reliably supported.

Do not claim activity on X, Reddit or another
social platform merely because the company
is being discussed elsewhere.


=========================================
DISCUSSION CHANGE
=========================================

Look for evidence that mentions or discussion
have increased or decreased compared with
recent normal levels.

Return an exact percentage such as:

+184% vs 7-day average

ONLY if a reliable source provides enough
information to verify that percentage.

Never calculate or invent a percentage from
vague search results.

If an exact comparison cannot be verified,
return exactly:

Not verified


=========================================
NEWS ACTIVITY
=========================================

Classify recent news activity as exactly
one of:

Elevated
Normal
Limited
Not verified

Base this on the amount and recency of
meaningful company-specific news.


=========================================
RELATIVE VOLUME
=========================================

Return a relative trading-volume figure such
as:

2.3x normal

ONLY if reliable current information provides
sufficient trading-volume data to verify it.

Do not estimate trading volume from news,
social discussion or price movement.

If it cannot be verified, return exactly:

Not verified


=========================================
ATTENTION BEGAN
=========================================

Identify approximately when the current
increase in attention began only when the
timing can reasonably be established.

Examples:

Within the past 6 hours
Within the past 24 hours
2 days ago
Following earnings on August 11, 2026

Do not invent an exact starting time.

If it cannot be established, return exactly:

Not verified


=========================================
MAIN TOPICS
=========================================

Return up to 4 concise topics currently
driving attention.

Examples:

Quarterly earnings
Revenue guidance
AI data centres
FDA approval
Acquisition
New contract
SEC filing
Management change

Topics must be supported by current research.

Do not pad the list with generic topics.


=========================================
MARKET ATTENTION SUMMARY
=========================================

Provide a short factual explanation of why
the company is currently receiving its
identified level of attention.

Maximum 3 concise sentences.

Explain the current catalyst or discussion.

Do not provide an opinion on whether the
attention is positive or negative for the
stock.


=========================================
PART 2 — RECENT COMPANY NEWS
=========================================


NEWS LEVEL

Classify the amount of meaningful recent
company news as exactly one of:

HIGH
ELEVATED
NORMAL
LIMITED
NOT VERIFIED

HIGH means multiple significant and very
recent company developments are receiving
substantial coverage.

ELEVATED means there is clearly more meaningful
company-specific news than usual.

NORMAL means there is current company news
but no clear evidence of unusually high
activity.

LIMITED means little meaningful recent
company-specific news was identified.

NOT VERIFIED means recent news activity
cannot be reliably established.


=========================================
RECENT DEVELOPMENTS
=========================================

Identify up to 4 meaningful recent company
developments.

Prioritise material developments such as:

- earnings results
- revenue or guidance updates
- major contracts
- acquisitions
- regulatory developments
- FDA decisions
- product announcements
- major partnerships
- management changes
- material SEC filings
- financing activity
- significant operational developments

Do not include generic stock-price articles
unless they contain a meaningful company
development.

Do not repeat substantially identical news
stories from multiple publications.

For each development return:

DATE

Use a concise date where reliably established.

Example:

August 11, 2026

If the date cannot be reliably verified:

Not verified


CATEGORY

Use a concise category such as:

Earnings
Guidance
Contract
Acquisition
Regulatory
Product
Partnership
Management
SEC Filing
Financing
Operations
Other


HEADLINE

Write a concise factual headline describing
the development.

Do not copy a publisher's headline verbatim.
Summarise it in your own words.


SUMMARY

Provide a concise factual explanation of the
development.

Maximum 2 sentences.

Do not provide investment interpretation.


=========================================
RECENT NEWS SUMMARY
=========================================

Provide a concise factual overview of the
most important recent company developments.

Maximum 3 sentences.

Do not describe developments as good or bad
for investors.

Do not predict their effect on the share
price.


=========================================
IMPORTANT EDGEBREAK RULES
=========================================

Return factual market intelligence only.

Do not provide investment advice.

Do not provide buy, sell or hold
recommendations.

Do not provide price targets.

Do not predict future stock performance.

Do not describe the stock as bullish or
bearish.

Do not recommend that the user trade the
stock.

Do not invent social-media activity.

Do not invent statistics.

Do not invent percentages.

Do not invent volume figures.

Do not invent news events.

Do not include URLs inside returned fields.

Do not include citations inside returned
fields.

Do not include markdown links inside returned
fields.

Do not include source names inside returned
fields.

If information cannot be reliably verified,
return exactly:

Not verified
`,

                    /* =================================
                       STRUCTURED OUTPUT
                    ================================= */

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_market_attention_news",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    /* =================
                                       MARKET ATTENTION
                                    ================= */

                                    marketAttention: {

                                        type: "object",

                                        properties: {

                                            attentionLevel: {

                                                type: "string",

                                                enum: [
                                                    "HIGH",
                                                    "ELEVATED",
                                                    "MODERATE",
                                                    "LOW",
                                                    "LIMITED",
                                                    "NOT VERIFIED"
                                                ]

                                            },

                                            where: {
                                                type: "string"
                                            },

                                            discussionChange: {
                                                type: "string"
                                            },

                                            newsActivity: {

                                                type: "string",

                                                enum: [
                                                    "Elevated",
                                                    "Normal",
                                                    "Limited",
                                                    "Not verified"
                                                ]

                                            },

                                            relativeVolume: {
                                                type: "string"
                                            },

                                            attentionBegan: {
                                                type: "string"
                                            },

                                            mainTopics: {

                                                type: "array",

                                                items: {
                                                    type: "string"
                                                },

                                                maxItems: 4

                                            },

                                            summary: {
                                                type: "string"
                                            }

                                        },

                                        required: [
                                            "attentionLevel",
                                            "where",
                                            "discussionChange",
                                            "newsActivity",
                                            "relativeVolume",
                                            "attentionBegan",
                                            "mainTopics",
                                            "summary"
                                        ],

                                        additionalProperties:
                                            false

                                    },


                                    /* =================
                                       RECENT NEWS
                                    ================= */

                                    recentNews: {

                                        type: "object",

                                        properties: {

                                            newsLevel: {

                                                type: "string",

                                                enum: [
                                                    "HIGH",
                                                    "ELEVATED",
                                                    "NORMAL",
                                                    "LIMITED",
                                                    "NOT VERIFIED"
                                                ]

                                            },

                                            summary: {
                                                type: "string"
                                            },

                                            items: {

                                                type: "array",

                                                maxItems: 4,

                                                items: {

                                                    type: "object",

                                                    properties: {

                                                        date: {
                                                            type: "string"
                                                        },

                                                        category: {
                                                            type: "string"
                                                        },

                                                        headline: {
                                                            type: "string"
                                                        },

                                                        summary: {
                                                            type: "string"
                                                        }

                                                    },

                                                    required: [
                                                        "date",
                                                        "category",
                                                        "headline",
                                                        "summary"
                                                    ],

                                                    additionalProperties:
                                                        false

                                                }

                                            }

                                        },

                                        required: [
                                            "newsLevel",
                                            "summary",
                                            "items"
                                        ],

                                        additionalProperties:
                                            false

                                    }

                                },

                                required: [
                                    "marketAttention",
                                    "recentNews"
                                ],

                                additionalProperties:
                                    false

                            }

                        }

                    }

                })

            }
        );


        const data =
            await response.json();


        /* =====================================
           OPENAI ERROR
        ===================================== */

        if (!response.ok) {

            console.error(
                "Market Attention + News API Error:",
                JSON.stringify(data)
            );


            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "Market research request failed"

                });

        }


        /* =====================================
           EXTRACT FINAL ASSISTANT MESSAGE ONLY
        ===================================== */

        let outputText = "";


        if (Array.isArray(data.output)) {

            for (const item of data.output) {

                /*
                Ignore web-search objects.

                Only accept the final assistant
                message containing structured output.
                */

                if (item.type !== "message") {
                    continue;
                }


                if (!Array.isArray(item.content)) {
                    continue;
                }


                for (const content of item.content) {

                    if (
                        content.type === "output_text" &&
                        typeof content.text === "string"
                    ) {

                        outputText =
                            content.text.trim();

                    }

                }

            }

        }


        if (!outputText) {

            console.error(
                "No Market Attention + News output:",
                JSON.stringify(data)
            );


            return res.status(500).json({

                error:
                    "No market research was returned"

            });

        }


        /* =====================================
           PARSE STRUCTURED JSON
        ===================================== */

        let research;


        try {

            research =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Market Attention + News JSON Parse Error:",
                outputText
            );


            return res.status(500).json({

                error:
                    "Unable to process market research"

            });

        }


        /* =====================================
           CLEAN RETURNED TEXT
        ===================================== */

        function cleanField(value) {

            if (
                value === null ||
                value === undefined
            ) {

                return "Not verified";

            }


            const cleaned =
                String(value)

                    .replace(
                        /https?:\/\/[^\s)]+/gi,
                        ""
                    )

                    .replace(
                        /\[[^\]]+\]\([^)]+\)/g,
                        ""
                    )

                    .replace(
                        /\[[^\]]+\]/g,
                        ""
                    )

                    .replace(
                        /\(\s*\)/g,
                        ""
                    )

                    .replace(
                        /\s+/g,
                        " "
                    )

                    .trim();


            if (!cleaned) {

                return "Not verified";

            }


            return cleaned;

        }


        /* =====================================
           CLEAN MARKET TOPICS
        ===================================== */

        const attention =
            research.marketAttention || {};


        const cleanTopics =
            Array.isArray(attention.mainTopics)

                ? attention.mainTopics

                    .slice(0, 4)

                    .map(cleanField)

                    .filter(
                        topic =>
                            topic !==
                            "Not verified"
                    )

                : [];


        /* =====================================
           CLEAN MARKET ATTENTION
        ===================================== */

        const cleanAttention = {

            attentionLevel:
                cleanField(
                    attention.attentionLevel
                ),

            where:
                cleanField(
                    attention.where
                ),

            discussionChange:
                cleanField(
                    attention.discussionChange
                ),

            newsActivity:
                cleanField(
                    attention.newsActivity
                ),

            relativeVolume:
                cleanField(
                    attention.relativeVolume
                ),

            attentionBegan:
                cleanField(
                    attention.attentionBegan
                ),

            mainTopics:
                cleanTopics,

            summary:
                cleanField(
                    attention.summary
                )

        };


        /* =====================================
           CLEAN RECENT NEWS
        ===================================== */

        const news =
            research.recentNews || {};


        const cleanNewsItems =
            Array.isArray(news.items)

                ? news.items

                    .slice(0, 4)

                    .map(item => ({

                        date:
                            cleanField(
                                item?.date
                            ),

                        category:
                            cleanField(
                                item?.category
                            ),

                        headline:
                            cleanField(
                                item?.headline
                            ),

                        summary:
                            cleanField(
                                item?.summary
                            )

                    }))

                : [];


        const cleanRecentNews = {

            newsLevel:
                cleanField(
                    news.newsLevel
                ),

            summary:
                cleanField(
                    news.summary
                ),

            items:
                cleanNewsItems

        };


        /* =====================================
           RETURN BOTH FROM ONE REQUEST
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            marketAttention:
                cleanAttention,

            recentNews:
                cleanRecentNews

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak Market Attention + News Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete market research"

        });

    }

}