export default async function handler(req, res) {

    /* =========================================
    METHOD CHECK
    ========================================= */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed."
        });

    }


    try {

        /* =========================================
        GET IMAGE
        ========================================= */

        const { image } = req.body || {};


        if (
            !image ||
            typeof image !== "string" ||
            !image.startsWith("data:image/")
        ) {

            return res.status(400).json({
                error: "A valid chart image is required."
            });

        }


        /* =========================================
        OPENAI REQUEST
        ========================================= */

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

                    input: [

                        {
                            role: "system",

                            content: [
                                {
                                    type: "input_text",

                                    text: `
You are a technical stock chart analysis assistant.

Analyse ONLY the technical information that is visibly present in the supplied stock chart.

Your purpose is to describe the chart clearly and concisely for market research.

Focus on:

1. Market structure
2. Resistance
3. Support and price structure
4. Higher lows or lower highs where visible
5. Volume behaviour where visible
6. Base or consolidation structure
7. Breakout structure or current position relative to resistance
8. A very short plain-English chart summary

IMPORTANT RULES:

- Base the analysis only on what can actually be observed in the supplied chart.
- Do not invent prices, dates, volume behaviour, support, resistance or patterns that are not clearly visible.
- If something cannot be determined from the chart, say that it is not clearly visible.
- Do not conduct company research.
- Do not use web research.
- Do not discuss news, financials, SEC filings or social-media activity.
- Do not give investment advice.
- Do not recommend buying, selling or holding.
- Do not provide a stock score or setup rating.
- Do not provide price targets.
- Do not predict future returns or future price movement.
- Do not say a stock is a good or bad investment.
- Do not say the user should or should not trade the stock.
- Do not refer to EdgeBreak as having an opinion, assessment, recommendation or belief.

Technical terminology such as uptrend, downtrend, bullish structure, bearish structure, breakout, consolidation, resistance, support, compression and momentum may be used when it objectively describes what is visible.

Keep every section concise.

Return ONLY valid JSON using exactly this structure:

{
    "marketStructure": "",
    "resistance": "",
    "support": "",
    "volume": "",
    "base": "",
    "breakout": "",
    "summary": ""
}

The summary should normally be no more than 2 or 3 short sentences.

Do not include markdown.
Do not include text before or after the JSON.
`
                                }
                            ]
                        },

                        {
                            role: "user",

                            content: [

                                {
                                    type: "input_text",

                                    text:
                                        "Analyse the technical structure visible in this stock chart."
                                },

                                {
                                    type: "input_image",

                                    image_url: image,

                                    detail: "low"
                                }

                            ]
                        }

                    ],

                    max_output_tokens: 650

                })

            }
        );


        /* =========================================
        OPENAI ERROR
        ========================================= */

        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "OpenAI Chart Analysis Error:",
                response.status,
                errorText
            );


            return res.status(500).json({
                error:
                    "Chart analysis is temporarily unavailable."
            });

        }


        /* =========================================
        READ RESPONSE
        ========================================= */

        const data =
            await response.json();


        let outputText = "";


        if (
            Array.isArray(data.output)
        ) {

            for (const item of data.output) {

                if (
                    item.type === "message" &&
                    Array.isArray(item.content)
                ) {

                    for (const content of item.content) {

                        if (
                            content.type === "output_text"
                        ) {

                            outputText +=
                                content.text || "";

                        }

                    }

                }

            }

        }


        if (!outputText) {

            throw new Error(
                "No chart analysis returned."
            );

        }


        /* =========================================
        PARSE JSON
        ========================================= */

        let analysis;


        try {

            analysis =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Chart JSON Parse Error:",
                outputText
            );


            throw new Error(
                "Invalid chart analysis response."
            );

        }


        /* =========================================
        RETURN ANALYSIS
        ========================================= */

        return res.status(200).json({

            marketStructure:
                analysis.marketStructure || "",

            resistance:
                analysis.resistance || "",

            support:
                analysis.support || "",

            volume:
                analysis.volume || "",

            base:
                analysis.base || "",

            breakout:
                analysis.breakout || "",

            summary:
                analysis.summary || ""

        });


    }
    catch (error) {

        console.error(
            "Chart Analysis Error:",
            error
        );


        return res.status(500).json({
            error:
                "Unable to analyse chart."
        });

    }

}