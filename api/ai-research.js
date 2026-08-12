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
       GET SYMBOL
    ========================================= */

    const {
        symbol
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
           FAST COMPANY RESEARCH
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

Research NASDAQ ticker ${cleanSymbol}.

FIRST:
Use web search to verify the current company
associated with ticker ${cleanSymbol}.

Prefer:

1. SEC
2. Official company website
3. Official investor relations website
4. NASDAQ or exchange information

This is a FAST company identification request.

Do NOT research:

- financial statements
- detailed earnings
- institutional ownership
- social media
- market attention
- technical analysis
- SEC filing history
- analyst ratings
- price targets

Return only:

1. Current verified company name.
2. Primary industry/business area.
3. A concise factual 80-120 word summary
   explaining what the company does.

Do not provide investment advice.

Do not provide buy, sell or hold recommendations.

Do not predict the stock price.

Do not describe the stock as bullish or bearish.

Do not include URLs, citations, markdown links,
footnotes or source names in the summary.

If the ticker cannot be reliably verified,
state this rather than guessing.

                    `,

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_quick_research",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    companyName: {
                                        type: "string"
                                    },

                                    industry: {
                                        type: "string"
                                    },

                                    summary: {
                                        type: "string"
                                    }

                                },

                                required: [
                                    "companyName",
                                    "industry",
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


        /* =====================================
           OPENAI RESPONSE
        ===================================== */

        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "OpenAI API Error:",
                JSON.stringify(data)
            );

            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "AI research request failed"

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
                    "No AI research was returned"

            });

        }


        /* =====================================
           PARSE STRUCTURED DATA
        ===================================== */

        let research;


        try {

            research =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "AI JSON Parse Error:",
                outputText
            );

            return res.status(500).json({

                error:
                    "Unable to process AI research"

            });

        }


        /* =====================================
           RETURN TO EDGEBREAK
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            companyName:
                research.companyName,

            industry:
                research.industry,

            research:
                research.summary

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak AI Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete EdgeBreak AI research"

        });

    }

}