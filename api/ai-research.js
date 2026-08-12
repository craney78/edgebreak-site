export default async function handler(req, res) {

    /* =========================================
       ONLY ALLOW POST REQUESTS
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

        console.error(
            "OPENAI_API_KEY is not configured"
        );

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


    /* =========================================
       OPENAI REQUEST
    ========================================= */

    try {

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

                    input: `

You are EdgeBreak AI Research.

The user is researching the NASDAQ-listed
company with ticker symbol:

${cleanSymbol}

For this initial connection test only,
return a short factual response containing:

1. The company name.
2. What the company primarily does.
3. One sentence explaining that EdgeBreak AI
   Research is connected successfully.

Do not provide investment advice.
Do not provide buy, sell or hold recommendations.
Do not provide price targets.
Do not make stock-price predictions.

Keep the response under 120 words.

                    `

                })

            }
        );


        /* =====================================
           READ OPENAI RESPONSE
        ===================================== */

        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "OpenAI API error:",
                data
            );

            return res.status(
                response.status
            ).json({

                error:
                    data?.error?.message ||
                    "OpenAI request failed"

            });

        }


        /* =====================================
           EXTRACT TEXT
        ===================================== */

        let researchText = "";


        if (
            Array.isArray(data.output)
        ) {

            for (
                const item of data.output
            ) {

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
                        "output_text"
                    ) {

                        researchText +=
                            content.text || "";

                    }

                }

            }

        }


        /* =====================================
           SEND BACK TO EDGEBREAK
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            research:
                researchText ||
                "EdgeBreak AI connected successfully."

        });


    }
    catch (error) {

        console.error(
            "EdgeBreak AI error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete AI research"

        });

    }

}