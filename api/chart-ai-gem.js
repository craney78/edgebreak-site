/* =========================================
EDGEBREAK — GEMINI CHART ANALYSIS
/api/chart-ai-gem.js
========================================= */

export default async function handler(req, res) {

    /* =====================================
    POST ONLY
    ===================================== */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed."
        });

    }


    try {

        /* =====================================
        API KEY
        ===================================== */

        const apiKey =
            process.env.GEMINI_API_KEY;

        if (!apiKey) {

            console.error(
                "GEMINI_API_KEY is missing."
            );

            return res.status(500).json({
                error:
                    "Chart analysis is temporarily unavailable."
            });

        }


        /* =====================================
        GET IMAGE
        ===================================== */

        const {
            image
        } = req.body || {};


        if (
            !image ||
            typeof image !== "string"
        ) {

            return res.status(400).json({
                error:
                    "No chart image was provided."
            });

        }


        /* =====================================
        VALIDATE DATA URL
        ===================================== */

        const match = image.match(
            /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/
        );


        if (!match) {

            return res.status(400).json({
                error:
                    "Invalid chart image."
            });

        }


        const mimeType = match[1];
        const base64Image = match[2];


        /* =====================================
        BASIC SIZE PROTECTION
        ===================================== */

        const approximateBytes =
            Math.ceil(
                base64Image.length * 0.75
            );


        const MAX_IMAGE_BYTES =
            5 * 1024 * 1024;


        if (
            approximateBytes >
            MAX_IMAGE_BYTES
        ) {

            return res.status(413).json({
                error:
                    "Chart image is too large."
            });

        }


        /* =====================================
        FIXED ANALYSIS INSTRUCTIONS

        User cannot alter these instructions.
        ===================================== */

        const systemInstruction = `

You are a chart observation system.

Analyse ONLY the visible information contained in the supplied stock chart image.

Your task is descriptive technical analysis only.

Focus on:

- visible price trend
- market structure
- support areas
- resistance areas
- consolidation or base structure
- higher lows or lower highs
- breakout or breakdown behaviour already visible
- visible volume behaviour
- unusual recent price movement

Do not provide investment advice.

Do not tell the user to buy, sell, hold, enter, exit, avoid, accumulate or reduce a position.

Do not recommend any trading action.

Do not provide price targets.

Do not predict future prices.

Do not estimate future returns.

Do not state that the stock will rise, fall, rally, crash, explode, moon, outperform or underperform.

Do not assign ratings, scores or recommendations.

Do not describe the stock as a good or bad investment.

Do not infer company fundamentals, news, sentiment, valuation or financial information from the chart.

Do not claim certainty.

If something cannot reasonably be determined from the visible chart, say that it is not clear from the chart.

Use neutral observational language.

Keep the analysis concise.

Return valid JSON only.

`;


        const userInstruction = `

Inspect this stock chart.

Return a concise technical description of what is visibly happening.

Use this exact JSON structure:

{
    "trend": "",
    "structure": "",
    "support": "",
    "resistance": "",
    "volume": "",
    "recentAction": "",
    "summary": ""
}

Each field should normally contain one short sentence.

The summary should be approximately 1 to 3 short sentences.

Do not include markdown.

`;


        /* =====================================
        GEMINI REQUEST
        ===================================== */

        const geminiResponse =
            await fetch(

                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            apiKey

                    },

                    body: JSON.stringify({

                        systemInstruction: {

                            parts: [
                                {
                                    text:
                                        systemInstruction
                                }
                            ]

                        },

                        contents: [

                            {

                                role: "user",

                                parts: [

                                    {
                                        text:
                                            userInstruction
                                    },

                                    {

                                        inlineData: {

                                            mimeType:
                                                mimeType,

                                            data:
                                                base64Image

                                        }

                                    }

                                ]

                            }

                        ],

                        generationConfig: {

                            maxOutputTokens: 650,

                            responseMimeType:
                                "application/json"

                        }

                    })

                }

            );


        /* =====================================
        GEMINI ERROR
        ===================================== */

        if (!geminiResponse.ok) {

            const errorText =
                await geminiResponse.text();

            console.error(
                "Gemini Chart Analysis Error:",
                geminiResponse.status,
                errorText
            );

            return res.status(500).json({
                error:
                    "Chart analysis is temporarily unavailable."
            });

        }


        const geminiData =
            await geminiResponse.json();


        /* =====================================
        EXTRACT RESPONSE
        ===================================== */

        const rawText =
            geminiData
                ?.candidates?.[0]
                ?.content
                ?.parts
                ?.map(part => part.text || "")
                ?.join("")
                ?.trim();


        if (!rawText) {

            console.error(
                "Gemini returned no chart analysis.",
                geminiData
            );

            return res.status(500).json({
                error:
                    "No chart analysis was returned."
            });

        }


        /* =====================================
        PARSE JSON
        ===================================== */

        let analysis;


        try {

            analysis =
                JSON.parse(rawText);

        }
        catch (parseError) {

            console.error(
                "Gemini JSON Parse Error:",
                parseError,
                rawText
            );

            return res.status(500).json({
                error:
                    "Chart analysis could not be processed."
            });

        }


        /* =====================================
        EXPECTED FIELDS ONLY
        ===================================== */

        const cleanAnalysis = {

            trend:
                cleanField(
                    analysis.trend
                ),

            structure:
                cleanField(
                    analysis.structure
                ),

            support:
                cleanField(
                    analysis.support
                ),

            resistance:
                cleanField(
                    analysis.resistance
                ),

            volume:
                cleanField(
                    analysis.volume
                ),

            recentAction:
                cleanField(
                    analysis.recentAction
                ),

            summary:
                cleanField(
                    analysis.summary
                )

        };


        /* =====================================
        SERVER-SIDE SAFETY CHECK
        ===================================== */

        const combinedText =
            Object
                .values(cleanAnalysis)
                .join(" ")
                .toLowerCase();


        const prohibitedPatterns = [

            /\bstrong buy\b/i,

            /\bstrong sell\b/i,

            /\bbuy this\b/i,

            /\bsell this\b/i,

            /\byou should buy\b/i,

            /\byou should sell\b/i,

            /\brecommend buying\b/i,

            /\brecommend selling\b/i,

            /\bprice target\b/i,

            /\btarget price\b/i,

            /\bexpected return\b/i,

            /\bguaranteed return\b/i,

            /\bguaranteed profit\b/i,

            /\bshould enter\b/i,

            /\bshould exit\b/i

        ];


        const unsafe =
            prohibitedPatterns.some(
                pattern =>
                    pattern.test(
                        combinedText
                    )
            );


        if (unsafe) {

            console.error(
                "Gemini response blocked by chart safety filter."
            );

            return res.status(422).json({
                error:
                    "The chart analysis could not be displayed."
            });

        }


        /* =====================================
        SUCCESS
        ===================================== */

        return res.status(200).json({

            success: true,

            provider: "gemini",

            model:
                "gemini-3.6-flash",

            analysis:
                cleanAnalysis

        });


    }
    catch (error) {

        console.error(
            "Gemini Chart Analysis Server Error:",
            error
        );


        return res.status(500).json({

            error:
                "Chart analysis is temporarily unavailable."

        });

    }

}


/* =========================================
CLEAN OUTPUT FIELD
========================================= */

function cleanField(value) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    return value
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 900);

}