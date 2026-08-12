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

           IMPORTANT:
           No web search is used here.

           This endpoint is intentionally kept
           lightweight so the AI panel can open
           quickly.

           Current web research is handled by
           the dedicated EdgeBreak AI endpoints.
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


                    /* =================================
                       PROMPT
                    ================================= */

                    input: `

You are EdgeBreak AI Research.

Identify the publicly listed company associated
with NASDAQ ticker ${cleanSymbol} using your
existing knowledge.

This is a FAST company identification request.

Do not perform detailed company research.

Do NOT research or discuss:

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

1. Company name.
2. Primary industry or business area.
3. A concise factual summary explaining what
   the company primarily does.

The summary should be approximately 60-100 words.

IMPORTANT:

This initial response is for quick identification
and orientation only.

Dedicated EdgeBreak AI research modules separately
perform current web research for company information,
financial information, news, market attention,
institutional activity and SEC filings.

Do not claim that information is current or
web-verified in this response.

If you are not sufficiently confident that the
ticker can be identified, return "Not verified"
rather than guessing.

Do not provide investment advice.

Do not provide buy, sell or hold recommendations.

Do not provide price targets.

Do not predict stock performance.

Do not describe the stock as bullish or bearish.

Do not include URLs.

Do not include citations.

Do not include markdown links.

Do not include footnotes.

Do not include source names.

Keep the response factual and concise.

                    `,


                    /* =================================
                       STRUCTURED OUTPUT
                    ================================= */

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


        /* =====================================
           CHECK OUTPUT
        ===================================== */

        if (!outputText) {

            console.error(
                "EdgeBreak AI returned no output:",
                JSON.stringify(data)
            );


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
           VALIDATE RESULT
        ===================================== */

        const companyName =
            research?.companyName ||
            "Not verified";


        const industry =
            research?.industry ||
            "Not verified";


        const summary =
            research?.summary ||
            "Company information could not be verified.";


        /* =====================================
           RETURN TO EDGEBREAK

           Keep these property names unchanged
           because the existing frontend uses:
           
           data.companyName
           data.industry
           data.research
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            companyName:
                companyName,

            industry:
                industry,

            research:
                summary

        });

    }
    catch (error) {

        /* =====================================
           SERVER ERROR
        ===================================== */

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