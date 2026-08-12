export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
            error: "AI service is not configured"
        });
    }

    const {
        symbol,
        companyName,
        scannerType,
        rank,
        price,
        resistance,
        resistanceTouches,
        higherLows,
        volumeRatio,
        smartMoney,
        launchPad,
        rangePercent
    } = req.body || {};

    if (!symbol) {
        return res.status(400).json({
            error: "Stock symbol is required"
        });
    }

    const cleanSymbol =
        String(symbol).trim().toUpperCase();

    const edgeBreakContext = `
Ticker: ${cleanSymbol}
Known company name: ${companyName || "Not supplied"}
Scanner: ${scannerType || "Not supplied"}
Rank: ${rank || "Not supplied"}
Current price: ${price || "Not supplied"}
Resistance: ${resistance || "Not supplied"}
Resistance touches: ${resistanceTouches || "Not supplied"}
Higher lows: ${higherLows || "Not supplied"}
Volume ratio: ${volumeRatio || "Not supplied"}
Smart Money appearances: ${smartMoney || "Not supplied"}
Launch Pad status: ${launchPad || "Not supplied"}
Range percent: ${rangePercent || "Not supplied"}
    `.trim();

    try {

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
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

EdgeBreak is a NASDAQ market intelligence,
research and education platform.

Research the NASDAQ-listed company represented
by ticker ${cleanSymbol}.

Use current web search to VERIFY the company
identity before producing the report.

Prefer authoritative sources including:

- SEC filings
- official company websites
- investor relations pages
- NASDAQ/exchange information
- reputable financial media

EDGEBREAK SCANNER DATA:

${edgeBreakContext}

IMPORTANT RULES:

Return factual research only.

Do NOT provide:

- buy recommendations
- sell recommendations
- hold recommendations
- investment ratings
- price targets
- stock-price predictions
- bullish/bearish classifications
- investment advice

Do not put URLs, citations, markdown links,
source names or footnotes inside any of the
text fields.

Do not invent information.

If information cannot be verified, use
"Not verified".

Keep the language concise and professional.

Return ONLY the structured JSON requested.
                    `,

                    text: {

                        format: {

                            type: "json_schema",

                            name: "edgebreak_company_research",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    companyName: {
                                        type: "string"
                                    },

                                    symbol: {
                                        type: "string"
                                    },

                                    summary: {
                                        type: "string"
                                    },

                                    companyOverview: {

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

                                        additionalProperties: false

                                    },

                                    businessModel: {

                                        type: "object",

                                        properties: {

                                            howItMakesMoney: {
                                                type: "string"
                                            },

                                            revenueSources: {
                                                type: "string"
                                            },

                                            customerBase: {
                                                type: "string"
                                            },

                                            recurringRevenue: {
                                                type: "string"
                                            }

                                        },

                                        required: [
                                            "howItMakesMoney",
                                            "revenueSources",
                                            "customerBase",
                                            "recurringRevenue"
                                        ],

                                        additionalProperties: false

                                    },

                                    financialHighlights: {

                                        type: "object",

                                        properties: {

                                            revenue: {
                                                type: "string"
                                            },

                                            revenueGrowth: {
                                                type: "string"
                                            },

                                            eps: {
                                                type: "string"
                                            },

                                            cash: {
                                                type: "string"
                                            },

                                            debt: {
                                                type: "string"
                                            },

                                            margins: {
                                                type: "string"
                                            },

                                            freeCashFlow: {
                                                type: "string"
                                            },

                                            latestQuarter: {
                                                type: "string"
                                            }

                                        },

                                        required: [
                                            "revenue",
                                            "revenueGrowth",
                                            "eps",
                                            "cash",
                                            "debt",
                                            "margins",
                                            "freeCashFlow",
                                            "latestQuarter"
                                        ],

                                        additionalProperties: false

                                    },

                                    recentNews: {

                                        type: "array",

                                        items: {

                                            type: "object",

                                            properties: {

                                                headline: {
                                                    type: "string"
                                                },

                                                date: {
                                                    type: "string"
                                                },

                                                summary: {
                                                    type: "string"
                                                }

                                            },

                                            required: [
                                                "headline",
                                                "date",
                                                "summary"
                                            ],

                                            additionalProperties: false

                                        }

                                    }

                                },

                                required: [
                                    "companyName",
                                    "symbol",
                                    "summary",
                                    "companyOverview",
                                    "businessModel",
                                    "financialHighlights",
                                    "recentNews"
                                ],

                                additionalProperties: false

                            }

                        }

                    }

                })

            }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error(
                "OpenAI API error:",
                JSON.stringify(data)
            );

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "OpenAI research request failed"
            });

        }


        /* =====================================
           EXTRACT STRUCTURED JSON
        ===================================== */

        let outputText = "";

        if (Array.isArray(data.output)) {

            for (const item of data.output) {

                if (!Array.isArray(item.content)) {
                    continue;
                }

                for (const content of item.content) {

                    if (content.type === "output_text") {
                        outputText += content.text || "";
                    }

                }

            }

        }

        if (!outputText) {

            return res.status(500).json({
                error:
                    "No research data was returned"
            });

        }


        /* =====================================
           PARSE JSON
        ===================================== */

        let research;

        try {

            research =
                JSON.parse(outputText);

        }
        catch (parseError) {

            console.error(
                "Research JSON parse error:",
                outputText
            );

            return res.status(500).json({
                error:
                    "Unable to process AI research"
            });

        }


        /* =====================================
           RETURN CLEAN DATA
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            companyName:
                research.companyName,

            research:
                research.summary,

            companyOverview:
                research.companyOverview,

            businessModel:
                research.businessModel,

            financialHighlights:
                research.financialHighlights,

            recentNews:
                research.recentNews

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak AI Research Error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to complete EdgeBreak AI research"
        });

    }

}