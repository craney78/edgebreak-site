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


    const cleanCompanyName =
        String(companyName || "")
            .replace(/\(\[.*?\]\(.*?\)\)/g, "")
            .replace(/https?:\/\/\S+/gi, "")
            .replace(/\[[^\]]+\]/g, "")
            .replace(/\s+/g, " ")
            .trim();


    try {

        /* =====================================
           RECENT NEWS RESEARCH
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

Research CURRENT and RECENT NEWS for the
NASDAQ-listed company represented by:

Ticker:
${cleanSymbol}

Known company name:
${cleanCompanyName || "Not supplied"}

First verify that the news relates to the
correct company and ticker.

=========================================
RESEARCH PERIOD
=========================================

Prioritise material developments from:

1. The past 24 hours
2. The past 7 days
3. The past 30 days

Only go further back where an older event
remains materially relevant to understanding
the company's current situation.

=========================================
PREFERRED SOURCES
=========================================

Prefer:

1. Official company announcements
2. Investor relations releases
3. SEC filings
4. Major financial news organisations
5. Reputable industry publications

Do not treat low-quality aggregation pages,
automatically generated articles or promotional
content as important company news.

=========================================
WHAT COUNTS AS IMPORTANT NEWS
=========================================

Prioritise developments such as:

- Earnings results
- Revenue or earnings guidance
- Major product launches
- FDA or regulatory decisions
- Major customer contracts
- Partnerships
- Acquisitions
- Divestitures
- Capital raising
- Debt financing
- Management changes
- Material SEC filings
- Legal or regulatory developments
- Major operational developments

Do NOT fill the list merely to reach five
items.

If only two genuinely material recent
developments exist, return two.

=========================================
EACH NEWS ITEM
=========================================

For each item return:

DATE

Use a concise date where it can be verified.

Example:

August 10, 2026

HEADLINE

Write a concise factual headline describing
the development.

Do not copy a publisher headline verbatim
unless necessary.

SUMMARY

Explain what happened in no more than
2 concise sentences.

CATEGORY

Classify the development as exactly one of:

Earnings
Guidance
Product
Regulatory
Partnership
Acquisition
Financing
Management
Contract
SEC Filing
Legal
Operations
Other

=========================================
OVERALL NEWS ACTIVITY
=========================================

Classify the company's current news activity
as exactly one of:

HIGH
ELEVATED
NORMAL
LIMITED

HIGH should be reserved for companies with
multiple significant very recent developments.

ELEVATED means there is more meaningful
company-specific news than would normally
be expected.

NORMAL means ordinary company news activity.

LIMITED means little meaningful recent news
was identified.

=========================================
NEWS SUMMARY
=========================================

Provide a maximum 3-sentence factual overview
of the most important current developments.

Explain what is currently driving company news.

Do not interpret whether the news is good or
bad for the stock.

=========================================
IMPORTANT EDGEBREAK RULES
=========================================

Return factual research only.

Do not provide investment advice.

Do not provide buy, sell or hold
recommendations.

Do not provide price targets.

Do not predict future stock performance.

Do not describe developments as bullish or
bearish.

Do not exaggerate the importance of news.

Do not invent news.

Do not invent dates.

Do not include URLs inside returned fields.

Do not include citations inside returned
fields.

Do not include markdown links inside returned
fields.

Do not include source names inside returned
fields.

If a specific fact cannot be verified,
use:

Not verified
`,

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_recent_news",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    newsActivity: {

                                        type: "string",

                                        enum: [
                                            "HIGH",
                                            "ELEVATED",
                                            "NORMAL",
                                            "LIMITED"
                                        ]

                                    },

                                    newsSummary: {
                                        type: "string"
                                    },

                                    newsItems: {

                                        type: "array",

                                        maxItems: 5,

                                        items: {

                                            type: "object",

                                            properties: {

                                                date: {
                                                    type: "string"
                                                },

                                                headline: {
                                                    type: "string"
                                                },

                                                summary: {
                                                    type: "string"
                                                },

                                                category: {

                                                    type: "string",

                                                    enum: [
                                                        "Earnings",
                                                        "Guidance",
                                                        "Product",
                                                        "Regulatory",
                                                        "Partnership",
                                                        "Acquisition",
                                                        "Financing",
                                                        "Management",
                                                        "Contract",
                                                        "SEC Filing",
                                                        "Legal",
                                                        "Operations",
                                                        "Other"
                                                    ]

                                                }

                                            },

                                            required: [
                                                "date",
                                                "headline",
                                                "summary",
                                                "category"
                                            ],

                                            additionalProperties:
                                                false

                                        }

                                    }

                                },

                                required: [
                                    "newsActivity",
                                    "newsSummary",
                                    "newsItems"
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
                "Recent News API Error:",
                JSON.stringify(data)
            );


            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "Recent news request failed"

                });

        }


        /* =====================================
           EXTRACT FINAL MESSAGE ONLY
        ===================================== */

        let outputText = "";


        if (Array.isArray(data.output)) {

            for (const item of data.output) {

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

            return res.status(500).json({

                error:
                    "No recent news research was returned"

            });

        }


        /* =====================================
           PARSE JSON
        ===================================== */

        let news;


        try {

            news =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Recent News JSON Parse Error:",
                outputText
            );


            return res.status(500).json({

                error:
                    "Unable to process recent news research"

            });

        }


        /* =====================================
           CLEAN FIELD
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


            return cleaned ||
                "Not verified";

        }


        /* =====================================
           CLEAN NEWS ITEMS
        ===================================== */

        const cleanNewsItems =
            Array.isArray(news.newsItems)

                ? news.newsItems
                    .slice(0, 5)
                    .map(item => ({

                        date:
                            cleanField(
                                item.date
                            ),

                        headline:
                            cleanField(
                                item.headline
                            ),

                        summary:
                            cleanField(
                                item.summary
                            ),

                        category:
                            cleanField(
                                item.category
                            )

                    }))

                : [];


        /* =====================================
           FINAL SAFE OBJECT
        ===================================== */

        const cleanNews = {

            newsActivity:
                cleanField(
                    news.newsActivity
                ),

            newsSummary:
                cleanField(
                    news.newsSummary
                ),

            newsItems:
                cleanNewsItems

        };


        /* =====================================
           RETURN
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            recentNews:
                cleanNews

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak Recent News Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete recent news research"

        });

    }

}