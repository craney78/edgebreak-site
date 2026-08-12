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


    /*
    Remove URLs or citations accidentally
    passed from another AI response.
    */

    const cleanCompanyName =
        String(companyName || "")
            .replace(/\(\[.*?\]\(.*?\)\)/g, "")
            .replace(/https?:\/\/\S+/gi, "")
            .replace(/\[[^\]]+\]/g, "")
            .replace(/\s+/g, " ")
            .trim();


    try {

        /* =====================================
           MARKET ATTENTION RESEARCH
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

Research CURRENT MARKET ATTENTION for the
NASDAQ-listed company represented by ticker:

${cleanSymbol}

Known company name:

${cleanCompanyName || "Not supplied"}

Your job is to determine whether this company
is currently receiving unusual or notable
attention across publicly accessible sources.

Research recent information, prioritising:

1. Current financial news
2. Recent company announcements
3. Investor relations releases
4. SEC filings
5. Publicly accessible Reddit discussions
6. Publicly accessible social media references
7. Other credible financial media

Focus especially on activity from:

- the past 24 hours
- the past several days
- the past 7 days

Compare recent activity with the company's
normal level of public attention where this
can reasonably be established.

=========================================
ATTENTION LEVEL
=========================================

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

Use ELEVATED where attention is clearly above
the company's normal level.

Use MODERATE where there is meaningful current
discussion but no strong evidence of unusual
attention.

Use LOW or LIMITED where current public
attention appears small.

Use NOT VERIFIED where there is insufficient
evidence to classify attention reliably.


=========================================
WHERE
=========================================

Identify where the current attention is
appearing.

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

IMPORTANT:

Return an exact percentage such as:

+184% vs 7-day average

ONLY if a reliable source provides enough
information to verify that percentage.

NEVER calculate or invent a percentage from
vague search results.

If an exact comparison cannot be verified,
return:

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

ONLY if a reliable current source provides
sufficient trading-volume information to
verify it.

Do not estimate trading volume from news,
social discussion or price movement.

If it cannot be verified, return:

Not verified


=========================================
ATTENTION BEGAN
=========================================

Identify approximately when the current
increase in attention began ONLY when the
timing can reasonably be established.

Examples:

Within the past 6 hours
Within the past 24 hours
2 days ago
Following earnings on August 11, 2026

Do not invent an exact starting time.

If it cannot be established, return:

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
SUMMARY
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

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_market_attention",

                            strict: true,

                            schema: {

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
                "Market Attention API Error:",
                JSON.stringify(data)
            );

            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "Market attention request failed"

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
                Only accept final assistant message.
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
                "No Market Attention output:",
                JSON.stringify(data)
            );

            return res.status(500).json({
                error:
                    "No market attention research was returned"
            });

        }


        /* =====================================
           PARSE STRUCTURED JSON
        ===================================== */

        let attention;


        try {

            attention =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Market Attention JSON Parse Error:",
                outputText
            );

            return res.status(500).json({
                error:
                    "Unable to process market attention research"
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


            let cleaned =
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
           CLEAN TOPICS
        ===================================== */

        const cleanTopics =
            Array.isArray(attention.mainTopics)

                ? attention.mainTopics
                    .slice(0, 4)
                    .map(cleanField)
                    .filter(
                        topic =>
                            topic !== "Not verified"
                    )

                : [];


        /* =====================================
           FINAL SAFE OBJECT
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
           RETURN CLEAN DATA
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            marketAttention:
                cleanAttention

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak Market Attention Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete market attention research"

        });

    }

}