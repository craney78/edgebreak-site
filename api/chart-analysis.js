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
       CHECK OPENAI CONFIGURATION
    ========================================= */

    if (!process.env.OPENAI_API_KEY) {

        console.error(
            "Chart Analysis: OPENAI_API_KEY is missing"
        );

        return res.status(500).json({
            error: "AI service is not configured"
        });

    }


    /* =========================================
       GET CHART IMAGE
    ========================================= */

    const {
        image
    } = req.body || {};


    if (
        !image ||
        typeof image !== "string" ||
        !image.startsWith("data:image/")
    ) {

        return res.status(400).json({
            error: "A valid chart image is required"
        });

    }


    try {

        /* =========================================
           OPENAI CHART ANALYSIS
        ========================================= */

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
                       CHART + INSTRUCTIONS
                    ================================= */

                    input: [

                        {

                            role: "system",

                            content: [

                                {

                                    type: "input_text",

                                    text: `
You are a technical stock chart analysis assistant.

Analyse ONLY the technical information visibly present in the supplied stock chart.

The purpose is to provide concise factual technical observations for market research.

Analyse these areas:

1. Market structure
2. Resistance
3. Support and price structure
4. Volume behaviour
5. Base or consolidation structure
6. Breakout structure
7. A short plain-English chart summary


IMPORTANT ANALYSIS RULES:

Only describe information that can reasonably be observed in the supplied chart.

Do not invent:

- prices
- dates
- resistance levels
- support levels
- volume behaviour
- chart patterns
- technical structures

If something cannot be determined from the chart, return:

"Not clearly visible in the supplied chart."


MARKET STRUCTURE:

Describe the dominant visible price structure.

Examples may include:

- uptrend
- downtrend
- sideways structure
- consolidation
- range
- compression
- transition in structure

Mention higher lows or lower highs only where they are reasonably visible.


RESISTANCE:

Describe visible resistance areas or repeated tests.

Do not invent an exact resistance price if the chart does not make it clearly readable.


SUPPORT:

Describe visible support and relevant price structure.

Mention higher lows, lower lows or repeated support tests where visible.


VOLUME:

Describe only volume behaviour that is visibly shown on the chart.

Examples may include:

- volume contraction
- volume expansion
- increased volume during a price move
- notable volume spike
- relatively stable volume

If volume is not displayed, state that it is not clearly visible.


BASE / CONSOLIDATION:

Describe whether the chart appears to contain a visible base, range, consolidation or compression structure.

Where possible, describe its approximate visual duration without inventing exact dates.


BREAKOUT STRUCTURE:

Describe the current visible relationship between price and resistance.

Examples may include:

- trading below resistance
- testing resistance
- moving through resistance
- trading above a previous resistance area
- no clear breakout structure visible

Do NOT predict whether a breakout will succeed or fail.


CHART SUMMARY:

Provide a concise plain-English summary of the most notable technical characteristics visible in the chart.

The summary should normally contain no more than 2 short sentences.

It should sound natural and useful rather than generic.

For example, it may explain that:

- price has spent an extended period consolidating
- higher lows have developed
- price is testing a resistance area
- price has recently moved above a range
- volume has expanded during the latest move

Only mention characteristics actually visible in the supplied chart.


STRICT SAFETY / PRODUCT RULES:

Do not provide investment advice.

Do not recommend buying.

Do not recommend selling.

Do not recommend holding.

Do not tell the user whether they should trade the stock.

Do not provide a stock score.

Do not provide a setup rating.

Do not provide price targets.

Do not predict future returns.

Do not predict future price movement.

Do not claim that a stock will rise or fall.

Do not describe the stock as a good or bad investment.

Do not use phrases such as:

- strong buy
- buy opportunity
- sell signal
- winning stock
- stock pick
- guaranteed breakout
- likely to rocket
- going to the moon

Do not attribute an opinion, recommendation or prediction to EdgeBreak.

Do not perform web research.

Do not research the company.

Do not discuss:

- company fundamentals
- news
- SEC filings
- social media
- institutional ownership
- analyst ratings


Keep each response field concise.
`

                                }

                            ]

                        },


                        {

                            role: "user",

                            content: [

                                {

                                    type:
                                        "input_text",

                                    text:
                                        "Analyse the technical structure visible in this stock chart."

                                },

                                {

                                    type:
                                        "input_image",

                                    image_url:
                                        image,

                                    /*
                                    Start with LOW detail
                                    to minimise image token cost.

                                    We can increase this later
                                    if chart recognition needs
                                    more detail.
                                    */

                                    detail:
                                        "low"

                                }

                            ]

                        }

                    ],


                    /* =================================
                       STRUCTURED RESPONSE
                    ================================= */

                    text: {

                        format: {

                            type:
                                "json_schema",

                            name:
                                "stock_chart_analysis",

                            strict:
                                true,

                            schema: {

                                type:
                                    "object",

                                properties: {

                                    marketStructure: {
                                        type: "string"
                                    },

                                    resistance: {
                                        type: "string"
                                    },

                                    support: {
                                        type: "string"
                                    },

                                    volume: {
                                        type: "string"
                                    },

                                    base: {
                                        type: "string"
                                    },

                                    breakout: {
                                        type: "string"
                                    },

                                    summary: {
                                        type: "string"
                                    }

                                },

                                required: [

                                    "marketStructure",
                                    "resistance",
                                    "support",
                                    "volume",
                                    "base",
                                    "breakout",
                                    "summary"

                                ],

                                additionalProperties:
                                    false

                            }

                        }

                    },


                    /* =================================
                       COST CONTROL
                    ================================= */

                    max_output_tokens:
                        650

                })

            }
        );


        /* =========================================
           READ OPENAI RESPONSE
        ========================================= */

        const data =
            await response.json();


        /* =========================================
           OPENAI ERROR
        ========================================= */

        if (!response.ok) {

            console.error(
                "Chart Analysis API Error:",
                response.status,
                JSON.stringify(data)
            );


            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "Chart analysis request failed"

                });

        }


        /* =========================================
           EXTRACT FINAL OUTPUT
        ========================================= */

        let outputText = "";


        if (Array.isArray(data.output)) {

            for (const item of data.output) {

                if (
                    item.type !== "message"
                ) {

                    continue;

                }


                if (
                    !Array.isArray(
                        item.content
                    )
                ) {

                    continue;

                }


                for (
                    const content
                    of item.content
                ) {

                    if (
                        content.type ===
                            "output_text" &&
                        typeof content.text ===
                            "string"
                    ) {

                        outputText =
                            content.text.trim();

                    }

                }

            }

        }


        /* =========================================
           NO OUTPUT
        ========================================= */

        if (!outputText) {

            console.error(
                "No final chart analysis output:",
                JSON.stringify(data)
            );


            return res.status(500).json({

                error:
                    "No chart analysis was returned"

            });

        }


        /* =========================================
           PARSE STRUCTURED JSON
        ========================================= */

        let analysis;


        try {

            analysis =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Chart Analysis JSON Parse Error:",
                outputText
            );


            return res.status(500).json({

                error:
                    "Unable to process chart analysis"

            });

        }


        /* =========================================
           CLEAN OUTPUT FIELD
        ========================================= */

        function cleanField(value) {

            if (
                value === null ||
                value === undefined
            ) {

                return (
                    "Not clearly visible " +
                    "in the supplied chart."
                );

            }


            const cleaned =
                String(value)

                    .replace(
                        /\s+/g,
                        " "
                    )

                    .trim();


            if (!cleaned) {

                return (
                    "Not clearly visible " +
                    "in the supplied chart."
                );

            }


            return cleaned;

        }


        /* =========================================
           BUILD SAFE ANALYSIS
        ========================================= */

        const cleanAnalysis = {

            marketStructure:
                cleanField(
                    analysis.marketStructure
                ),

            resistance:
                cleanField(
                    analysis.resistance
                ),

            support:
                cleanField(
                    analysis.support
                ),

            volume:
                cleanField(
                    analysis.volume
                ),

            base:
                cleanField(
                    analysis.base
                ),

            breakout:
                cleanField(
                    analysis.breakout
                ),

            summary:
                cleanField(
                    analysis.summary
                )

        };


        /* =========================================
           RETURN ANALYSIS
        ========================================= */

        return res.status(200).json({

            success:
                true,

            marketStructure:
                cleanAnalysis.marketStructure,

            resistance:
                cleanAnalysis.resistance,

            support:
                cleanAnalysis.support,

            volume:
                cleanAnalysis.volume,

            base:
                cleanAnalysis.base,

            breakout:
                cleanAnalysis.breakout,

            summary:
                cleanAnalysis.summary

        });

    }
    catch (error) {

        console.error(
            "Chart Analysis Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete chart analysis"

        });

    }

}