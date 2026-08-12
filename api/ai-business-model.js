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
       GET COMPANY DATA
    ========================================= */

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

        /* =====================================
           BUSINESS MODEL RESEARCH
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

Research the current business model of the
NASDAQ-listed company represented by ticker:

${cleanSymbol}

Known company name:

${cleanCompanyName || "Not supplied"}

Use current web research to verify the company
and its business model.

Prefer authoritative sources:

1. Official company website
2. Investor relations website
3. Latest 10-K
4. Latest 10-Q
5. SEC filings

Research ONLY the company's business model.

=========================================
HOW IT MAKES MONEY
=========================================

Explain concisely how the company generates
revenue.

Focus on the actual economic activity of the
business.

Maximum 2 concise sentences.


=========================================
REVENUE SOURCES
=========================================

Identify the company's important revenue
sources, business segments, product categories
or service categories.

Maximum 3 concise sentences.


=========================================
CUSTOMER BASE
=========================================

Identify the main types of customers the
company serves.

Examples may include:

Consumers
Businesses
Government agencies
Hospitals
Pharmaceutical companies
Financial institutions
Manufacturers
Enterprise customers

Do not invent specific customers unless they
are publicly verified.

Maximum 2 concise sentences.


=========================================
RECURRING REVENUE
=========================================

Explain whether the company has identifiable
recurring revenue.

Examples include:

Subscriptions
Software licences
Service contracts
Consumables
Maintenance
Recurring financing income
Long-term contracts

If recurring revenue exists, explain its
general source.

Do NOT invent a percentage of recurring
revenue.

If recurring revenue cannot be reliably
established, return:

Not verified


=========================================
KEY BUSINESS DRIVERS
=========================================

Identify up to 4 factual factors that are
important to how the business generates
revenue.

Examples:

Product sales
Subscription growth
Customer adoption
Contract wins
Loan portfolio growth
Manufacturing volumes
Installed customer base
Consumables
Service revenue

These are business drivers, NOT predictions.


=========================================
IMPORTANT EDGEBREAK RULES
=========================================

Return factual company research only.

Do not provide investment advice.

Do not recommend buying, selling or holding
the stock.

Do not provide price targets.

Do not predict future stock performance.

Do not describe the stock as bullish or
bearish.

Do not judge whether the business model is
good or bad.

Do not include URLs inside returned fields.

Do not include citations inside returned
fields.

Do not include markdown links inside returned
fields.

Do not include source names inside returned
fields.

Do not invent facts.

If information cannot be reliably verified,
return exactly:

Not verified
`,

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_business_model",

                            strict: true,

                            schema: {

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
                                    },

                                    keyBusinessDrivers: {
                                        type: "array",

                                        items: {
                                            type: "string"
                                        },

                                        maxItems: 4
                                    }

                                },

                                required: [
                                    "howItMakesMoney",
                                    "revenueSources",
                                    "customerBase",
                                    "recurringRevenue",
                                    "keyBusinessDrivers"
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


        /* =====================================
           OPENAI ERROR
        ===================================== */

        if (!response.ok) {

            console.error(
                "Business Model API Error:",
                JSON.stringify(data)
            );

            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "Business model request failed"

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

            console.error(
                "No Business Model output:",
                JSON.stringify(data)
            );

            return res.status(500).json({
                error:
                    "No business model research was returned"
            });

        }


        /* =====================================
           PARSE JSON
        ===================================== */

        let businessModel;


        try {

            businessModel =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Business Model JSON Error:",
                outputText
            );

            return res.status(500).json({
                error:
                    "Unable to process business model research"
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


        const drivers =
            Array.isArray(
                businessModel.keyBusinessDrivers
            )

                ? businessModel
                    .keyBusinessDrivers
                    .slice(0, 4)
                    .map(cleanField)
                    .filter(
                        item =>
                            item !== "Not verified"
                    )

                : [];


        /* =====================================
           FINAL SAFE OBJECT
        ===================================== */

        const cleanBusinessModel = {

            howItMakesMoney:
                cleanField(
                    businessModel.howItMakesMoney
                ),

            revenueSources:
                cleanField(
                    businessModel.revenueSources
                ),

            customerBase:
                cleanField(
                    businessModel.customerBase
                ),

            recurringRevenue:
                cleanField(
                    businessModel.recurringRevenue
                ),

            keyBusinessDrivers:
                drivers

        };


        /* =====================================
           RETURN
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            businessModel:
                cleanBusinessModel

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak Business Model Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete business model research"

        });

    }

}