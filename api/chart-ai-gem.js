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
        GEMINI API KEY
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

        const { image } =
            req.body || {};


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
        VALIDATE IMAGE DATA URL
        ===================================== */

        const match =
            image.match(
                /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/
            );


        if (!match) {

            return res.status(400).json({
                error:
                    "Invalid chart image."
            });

        }


        const mimeType =
            match[1];

        const base64Image =
            match[2];


        /* =====================================
        IMAGE SIZE PROTECTION
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
        SYSTEM INSTRUCTION
        ===================================== */

        const systemInstruction = `

You analyse stock chart images.

Your task is to describe ONLY the technical characteristics
that are reasonably visible in the supplied chart.

This is descriptive market research only.

Do not provide investment advice.

Do not recommend buying, selling or holding a security.

Do not tell the user whether they should enter, exit,
avoid or trade a security.

Do not generate trading signals.

Do not provide stock scores or setup ratings.

Do not provide price targets.

Do not estimate expected returns.

Do not predict future price movement.

Do not predict whether a breakout will succeed or fail.

Do not describe the stock as a good or bad investment.

Do not claim that volume confirms, validates, supports,
proves or causes a breakout or price movement.

When discussing price and volume together, describe them
only as observable events occurring alongside each other.

Do not use promotional language such as:

strong buy
strong sell
buy opportunity
sell opportunity
winning stock
high probability trade
guaranteed breakout
likely winner
going to the moon

Do not infer company fundamentals, news, valuation,
financial results, sentiment or institutional activity.

Analyse only what can reasonably be observed in the chart.

If something cannot clearly be determined from the image,
say:

"Not clearly visible in the supplied chart."

Use neutral, factual language.

Keep every section concise.

Return JSON only.

`;


        /* =====================================
        CHART ANALYSIS INSTRUCTION
        ===================================== */

        const userInstruction = `

Analyse the supplied stock chart.

Return exactly these seven fields:

{
    "marketStructure": "",
    "resistance": "",
    "support": "",
    "volume": "",
    "base": "",
    "breakout": "",
    "summary": ""
}


MARKET STRUCTURE

Describe the dominant visible structure.

Consider:

- uptrend
- downtrend
- sideways movement
- consolidation
- compression
- higher lows
- lower highs
- changes in recent structure


RESISTANCE

Describe visible resistance areas and repeated resistance tests.

Only mention approximate price areas when they are clearly
readable from the chart.

Do not invent exact levels.


SUPPORT

Describe visible support and price structure.

Consider:

- repeated support
- higher lows
- lower lows
- previous resistance acting as support

Only describe what is reasonably visible.


VOLUME

Describe only the visible volume behaviour.

Consider:

- volume contraction
- volume expansion
- notable volume spikes
- changes in volume occurring alongside recent price movement
- relatively stable volume

Describe price and volume only as observations occurring
alongside each other.

Do not state or imply that volume caused, supported,
confirmed, validated or proves a price movement or breakout.

Prefer neutral wording such as:

"Volume expansion is visible alongside the recent upward
price movement."

If volume is not visible, state that clearly.


BASE

Describe any visible base, consolidation or trading range.

Mention approximate duration only when reasonably visible
from the chart.


BREAKOUT

Describe the CURRENT relationship between price and visible
resistance.

For example:

- below resistance
- testing resistance
- moving through resistance
- trading above previous resistance
- returned below previous resistance
- no clear breakout structure visible

Describe only what has already occurred.

Do not predict what will happen next.


SUMMARY

Give a very short plain-English description of the most
important technical characteristics visible in the chart.

Use approximately one or two short sentences.

The summary should sound natural and useful rather than
generic.

It may describe whether the chart currently shows:

- quiet or limited price movement
- developing compression
- an established trend
- an active resistance test
- an unusually large recent move
- significant volume expansion
- a change in recent market structure

If price and volume are discussed together, describe only
what is visibly occurring.

Do not say that volume confirms, validates, supports,
proves or causes a price movement or breakout.

But the summary must remain observational.

Do not tell the user whether the stock is attractive.

Do not tell the user whether they should trade it.

Do not predict its future performance.

Return JSON only.

`;


        /* =====================================
        SEND TO GEMINI
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

                            maxOutputTokens: 1200,

                            responseMimeType:
                                "application/json"

                        }

                    })

                }

            );


        /* =====================================
        GEMINI API ERROR
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
        EXTRACT GEMINI TEXT
        ===================================== */

        const rawText =
            geminiData
                ?.candidates?.[0]
                ?.content
                ?.parts
                ?.map(
                    part =>
                        part.text || ""
                )
                ?.join("")
                ?.trim();


        if (!rawText) {

            console.error(
                "Gemini returned no chart analysis:",
                JSON.stringify(
                    geminiData
                )
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
        catch (error) {

            console.error(
                "Gemini JSON Parse Error:",
                error,
                rawText
            );


            return res.status(500).json({
                error:
                    "Chart analysis could not be processed."
            });

        }


        /* =====================================
        CLEAN EXPECTED FIELDS
        ===================================== */

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


        /* =====================================
        MAKE SURE FIELDS EXIST
        ===================================== */

        const fallback =
            "Not clearly visible in the supplied chart.";


        for (
            const key of
            Object.keys(cleanAnalysis)
        ) {

            if (!cleanAnalysis[key]) {

                cleanAnalysis[key] =
                    key === "summary"
                        ? "No clear chart summary could be determined."
                        : fallback;

            }

        }


        /* =====================================
        SERVER-SIDE SAFETY FILTER
        ===================================== */

        const combinedText =
            Object
                .values(cleanAnalysis)
                .join(" ");


        const prohibitedPatterns = [

            /\bstrong buy\b/i,

            /\bstrong sell\b/i,

            /\byou should buy\b/i,

            /\byou should sell\b/i,

            /\byou should hold\b/i,

            /\brecommend(?:s|ed|ing)? buying\b/i,

            /\brecommend(?:s|ed|ing)? selling\b/i,

            /\bbuy opportunity\b/i,

            /\bsell opportunity\b/i,

            /\bprice target\b/i,

            /\btarget price\b/i,

            /\bexpected return\b/i,

            /\bguaranteed return\b/i,

            /\bguaranteed profit\b/i,

            /\bshould enter\b/i,

            /\bshould exit\b/i,

            /\bwinning stock\b/i,

            /\bhigh probability trade\b/i,

            /\bgoing to the moon\b/i

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
                "Gemini chart response blocked by safety filter."
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
CLEAN OUTPUT
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
        .slice(0, 800);

}