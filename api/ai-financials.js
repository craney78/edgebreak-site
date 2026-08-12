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


    const cleanCompanyName =
        String(companyName || "")
            .replace(/\(\[.*?\]\(.*?\)\)/g, "")
            .replace(/https?:\/\/\S+/gi, "")
            .replace(/\[[^\]]+\]/g, "")
            .replace(/\s+/g, " ")
            .trim();


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

                    tools: [
                        {
                            type: "web_search"
                        }
                    ],

                    tool_choice: "auto",

                    input: `
You are EdgeBreak AI Research.

Research the CURRENT financial information
for the NASDAQ-listed company represented by:

Ticker: ${cleanSymbol}

Known company name:
${cleanCompanyName || "Not supplied"}

Verify the company before researching its
financial information.

Prefer authoritative sources in this order:

1. Latest company earnings release
2. Official investor relations website
3. Latest 10-Q
4. Latest 10-K
5. SEC filings

Research ONLY Financial Highlights.

Return the following:

LATEST REVENUE
Use the latest reported quarterly revenue.
Include the reporting period.

Example:
$184.2 million — Q2 2026

REVENUE GROWTH
Use year-over-year revenue growth for the
same latest quarter where available.

Example:
+12.4% YoY

EPS
Use the latest reported diluted EPS.
Clearly identify GAAP EPS where possible.

Example:
-$0.18 diluted EPS

CASH
Use the latest reported cash and cash
equivalents figure.

DEBT
Use the latest clearly reported debt figure.
Do not confuse total liabilities with debt.

GROSS MARGIN
Use the latest reported GAAP gross margin
where available.

FREE CASH FLOW
Use the latest reported free cash flow where
the company explicitly reports it or where it
can be reliably verified.

Do not invent free cash flow.

LATEST QUARTER
Provide a maximum 3-sentence factual summary
of the latest reported quarter.

Include important reported developments such
as revenue movement, profitability or loss,
guidance changes, or other material financial
information where relevant.

IMPORTANT:

All figures must include useful context.

Prefer quarterly figures for consistency.

Do not mix annual revenue with quarterly EPS
without clearly identifying the periods.

Do not invent figures.

Do not estimate missing figures.

If a value cannot be reliably verified,
return exactly:

Not verified

Do not include URLs in returned fields.

Do not include citations in returned fields.

Do not include markdown links in returned
fields.

Do not include source names in returned fields.

Do not provide investment advice.

Do not recommend buying, selling or holding.

Do not provide price targets.

Do not predict future stock performance.

Do not describe the stock as bullish or bearish.
`,

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_financial_highlights",

                            strict: true,

                            schema: {

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

                                    grossMargin: {
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
                                    "grossMargin",
                                    "freeCashFlow",
                                    "latestQuarter"
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
                "Financial Highlights API Error:",
                JSON.stringify(data)
            );

            return res
                .status(response.status)
                .json({
                    error:
                        data?.error?.message ||
                        "Financial research request failed"
                });
        }


        /* =====================================
           EXTRACT FINAL MESSAGE ONLY
        ===================================== */

        let outputText = "";


        if (Array.isArray(data.output)) {

            for (const item of data.output) {

                if (item.type !== "message") {
                    continue;
                }

                if (!Array.isArray(item.content)) {
                    continue;
                }

                for (const content of item.content) {

                    if (
                        content.type === "output_text" &&
                        typeof content.text === "string"
                    ) {

                        outputText =
                            content.text.trim();

                    }
                }
            }
        }


        if (!outputText) {

            return res.status(500).json({
                error:
                    "No financial research was returned"
            });
        }


        /* =====================================
           PARSE JSON
        ===================================== */

        let financials;


        try {

            financials =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Financial JSON Parse Error:",
                outputText
            );

            return res.status(500).json({
                error:
                    "Unable to process financial research"
            });
        }


        /* =====================================
           CLEAN FIELDS
        ===================================== */

        function cleanField(value) {

            if (
                value === null ||
                value === undefined
            ) {
                return "Not verified";
            }


            const cleaned =
                String(value)

                    .replace(
                        /https?:\/\/[^\s)]+/gi,
                        ""
                    )

                    .replace(
                        /\[[^\]]+\]\([^)]+\)/g,
                        ""
                    )

                    .replace(
                        /\[[^\]]+\]/g,
                        ""
                    )

                    .replace(
                        /\(\s*\)/g,
                        ""
                    )

                    .replace(
                        /\s+/g,
                        " "
                    )

                    .trim();


            return cleaned ||
                "Not verified";
        }


        const cleanFinancials = {

            revenue:
                cleanField(financials.revenue),

            revenueGrowth:
                cleanField(
                    financials.revenueGrowth
                ),

            eps:
                cleanField(financials.eps),

            cash:
                cleanField(financials.cash),

            debt:
                cleanField(financials.debt),

            grossMargin:
                cleanField(
                    financials.grossMargin
                ),

            freeCashFlow:
                cleanField(
                    financials.freeCashFlow
                ),

            latestQuarter:
                cleanField(
                    financials.latestQuarter
                )
        };


        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            financialHighlights:
                cleanFinancials
        });

    }
    catch (error) {

        console.error(
            "EdgeBreak Financial Highlights Error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to complete financial research"
        });
    }
}