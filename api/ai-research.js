export default async function handler(req, res) {

    /* =========================================
       ONLY ALLOW POST
    ========================================= */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    /* =========================================
       CHECK OPENAI KEY
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
       GET EDGEBREAK DATA
    ========================================= */

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
        String(symbol)
            .trim()
            .toUpperCase();


    /* =========================================
       BUILD EDGEBREAK CONTEXT
    ========================================= */

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

        /* =====================================
           OPENAI + LIVE WEB SEARCH
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

EdgeBreak is a NASDAQ market intelligence,
stock discovery, research and education platform.

You are NOT a financial adviser.

Your job is to research the company represented
by the supplied ticker using current publicly
available web information.

IMPORTANT:

Use web search to verify the ticker and company
identity before writing the response.

Do not guess the company from memory.

Prefer authoritative sources where available,
including:

- official company websites
- investor relations pages
- SEC information
- exchange information
- reputable financial and business media

The EdgeBreak scanner has supplied:

${edgeBreakContext}


RESEARCH RULES

Return factual research only.

Do NOT:

- recommend buying
- recommend selling
- recommend holding
- provide investment ratings
- provide price targets
- predict future stock prices
- call the stock bullish
- call the stock bearish
- score the stock
- tell the user whether the company is a
  good or bad investment

Clearly distinguish verified company facts from
EdgeBreak's proprietary scanner observations.

If information cannot be reliably verified,
say that it could not be verified.

For this stage of development, produce ONLY an
AI Research Summary.

Research the current company represented by
ticker ${cleanSymbol}.

The summary should contain:

1. Verified company name.
2. What the company does.
3. Its primary industry/business area.
4. Important recent company developments if
   they are relevant and verifiable.
5. A concise factual overview useful for
   further company research.

Keep the summary approximately 120-200 words.

Do not include a buy/sell conclusion.

                    `

                })

            }
        );


        /* =====================================
           READ RESPONSE
        ===================================== */

        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "OpenAI API error:",
                JSON.stringify(data)
            );

            return res.status(
                response.status
            ).json({

                error:
                    data?.error?.message ||
                    "OpenAI research request failed"

            });

        }


        /* =====================================
           EXTRACT OUTPUT TEXT
        ===================================== */

        let researchText = "";


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

                        researchText +=
                            content.text || "";

                    }

                }

            }

        }


        /* =====================================
           RETURN TO EDGEBREAK
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol: cleanSymbol,

            research:
                researchText ||
                "No verified research was returned."

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