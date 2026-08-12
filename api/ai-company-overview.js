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


    try {

        /* =====================================
           COMPANY OVERVIEW RESEARCH
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

Research the company currently represented by
NASDAQ ticker ${cleanSymbol}.

Known company name:
${companyName || "Not supplied"}

Use current web search to verify company facts.

Prefer authoritative sources:

1. Official company website
2. Investor relations website
3. SEC filings
4. NASDAQ or exchange information

Return factual company information only.

Research ONLY the Company Overview.

Find:

- Industry
- Headquarters
- Chief Executive Officer
- Approximate employee count
- Main products or services
- Main geographic markets

IMPORTANT:

Do not provide investment advice.

Do not provide buy, sell or hold recommendations.

Do not provide price targets.

Do not predict stock performance.

Do not describe the stock as bullish or bearish.

Do not include URLs, citations, markdown links,
footnotes or source names inside the returned fields.

If a fact cannot be reliably verified,
return "Not verified".

Keep each answer concise.

                    `,

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_company_overview",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    industry: {
                                        type: "string"
                                    },

                                    headquarters: {
                                        type: "string"
                                    },

                                    ceo: {
                                        type: "string"
                                    },

                                    employees: {
                                        type: "string"
                                    },

                                    mainProducts: {
                                        type: "string"
                                    },

                                    geographicMarkets: {
                                        type: "string"
                                    }

                                },

                                required: [
                                    "industry",
                                    "headquarters",
                                    "ceo",
                                    "employees",
                                    "mainProducts",
                                    "geographicMarkets"
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


        if (!response.ok) {

            console.error(
                "Company Overview API Error:",
                JSON.stringify(data)
            );

            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "Company overview request failed"

                });

        }


        /* =====================================
           EXTRACT OUTPUT
        ===================================== */

        let outputText = "";


        if (Array.isArray(data.output)) {

            for (const item of data.output) {

                if (!Array.isArray(item.content)) {
                    continue;
                }

                for (const content of item.content) {

                    if (
                        content.type ===
                        "output_text"
                    ) {

                        outputText +=
                            content.text || "";

                    }

                }

            }

        }


        if (!outputText) {

            return res.status(500).json({
                error:
                    "No company overview was returned"
            });

        }


        /* =====================================
           PARSE JSON
        ===================================== */

        let overview;


        try {

            overview =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Company Overview JSON Error:",
                outputText
            );

            return res.status(500).json({
                error:
                    "Unable to process company overview"
            });

        }


        /* =====================================
           RETURN CLEAN DATA
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            companyOverview:
                overview

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak Company Overview Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete company overview"

        });

    }

}