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
           SEC FILINGS RESEARCH
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

Research recent SEC filings for the
NASDAQ-listed company represented by:

Ticker:
${cleanSymbol}

Known company name:
${cleanCompanyName || "Not supplied"}

First verify the company and ticker.

=========================================
PRIMARY SOURCE
=========================================

Prefer SEC EDGAR filings as the primary
source.

Official company investor relations
information may be used as a secondary
source where appropriate.

Do not rely on social media, blogs or
speculative articles for SEC filing facts.


=========================================
LATEST ANNUAL FILING
=========================================

Identify the latest available annual filing.

Normally this will be Form 10-K.

Return:

- Form type
- Filing date
- Fiscal period where verified
- Short factual description

Do not analyse whether the filing is positive
or negative.


=========================================
LATEST QUARTERLY FILING
=========================================

Identify the latest available quarterly
filing.

Normally this will be Form 10-Q.

Return:

- Form type
- Filing date
- Fiscal period where verified
- Short factual description


=========================================
RECENT MATERIAL FILINGS
=========================================

Identify up to 5 recent material filings.

Prioritise filings such as:

- 8-K
- 10-K
- 10-Q
- S-1
- S-3
- DEF 14A
- 13D
- 13G

For each filing return:

FORM
The SEC form type.

DATE
The filing date.

TITLE
A short plain-English title describing what
the filing concerns.

SUMMARY
A concise factual explanation of the filing.

Do not simply repeat the form name as the
title.

Do not speculate about market impact.


=========================================
INSIDER FILINGS
=========================================

Check for recent relevant Form 4 filings.

Return up to 4 recent Form 4 disclosures.

For each return:

INSIDER
Name of reporting person where verified.

ROLE
Position or relationship to the company where
verified.

DATE
Filing date.

TRANSACTION
Concise factual description of the disclosed
transaction where reliably verified.

Be careful to distinguish:

- open-market purchases
- open-market sales
- option exercises
- grants or awards
- tax withholding
- other transactions

Do not describe every Form 4 transaction as
insider buying or insider selling.

If transaction details cannot be reliably
verified, say "Not verified".


=========================================
FILING SUMMARY
=========================================

Provide a concise maximum 3-sentence summary
of the recent regulatory filing picture.

Describe only factual filing activity.

Examples of appropriate observations:

"The company filed its latest quarterly
report on..."

"Recent 8-K filings concerned..."

"Recent Form 4 disclosures included..."

Do NOT classify the filing picture as
positive, negative, bullish or bearish.


=========================================
EDGEBREAK RULES
=========================================

Factual research only.

Do not provide investment advice.

Do not recommend buying, selling or holding.

Do not provide price targets.

Do not predict stock performance.

Do not classify filings as bullish or bearish.

Do not infer investor sentiment.

Do not infer institutional accumulation.

Do not exaggerate routine SEC filings.

Do not invent filings.

Do not invent filing dates.

Do not invent insider transactions.

Do not include URLs inside returned fields.

Do not include citations inside returned
fields.

Do not include markdown links inside returned
fields.

Do not include source names inside returned
fields.

If a fact cannot be reliably verified,
return exactly:

Not verified
`,

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_sec_filings",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    latestAnnual: {

                                        type: "object",

                                        properties: {

                                            form: {
                                                type: "string"
                                            },

                                            filingDate: {
                                                type: "string"
                                            },

                                            fiscalPeriod: {
                                                type: "string"
                                            },

                                            summary: {
                                                type: "string"
                                            }

                                        },

                                        required: [
                                            "form",
                                            "filingDate",
                                            "fiscalPeriod",
                                            "summary"
                                        ],

                                        additionalProperties:
                                            false

                                    },


                                    latestQuarterly: {

                                        type: "object",

                                        properties: {

                                            form: {
                                                type: "string"
                                            },

                                            filingDate: {
                                                type: "string"
                                            },

                                            fiscalPeriod: {
                                                type: "string"
                                            },

                                            summary: {
                                                type: "string"
                                            }

                                        },

                                        required: [
                                            "form",
                                            "filingDate",
                                            "fiscalPeriod",
                                            "summary"
                                        ],

                                        additionalProperties:
                                            false

                                    },


                                    recentFilings: {

                                        type: "array",

                                        maxItems: 5,

                                        items: {

                                            type: "object",

                                            properties: {

                                                form: {
                                                    type: "string"
                                                },

                                                date: {
                                                    type: "string"
                                                },

                                                title: {
                                                    type: "string"
                                                },

                                                summary: {
                                                    type: "string"
                                                }

                                            },

                                            required: [
                                                "form",
                                                "date",
                                                "title",
                                                "summary"
                                            ],

                                            additionalProperties:
                                                false

                                        }

                                    },


                                    insiderFilings: {

                                        type: "array",

                                        maxItems: 4,

                                        items: {

                                            type: "object",

                                            properties: {

                                                insider: {
                                                    type: "string"
                                                },

                                                role: {
                                                    type: "string"
                                                },

                                                date: {
                                                    type: "string"
                                                },

                                                transaction: {
                                                    type: "string"
                                                }

                                            },

                                            required: [
                                                "insider",
                                                "role",
                                                "date",
                                                "transaction"
                                            ],

                                            additionalProperties:
                                                false

                                        }

                                    },


                                    filingSummary: {
                                        type: "string"
                                    }

                                },

                                required: [
                                    "latestAnnual",
                                    "latestQuarterly",
                                    "recentFilings",
                                    "insiderFilings",
                                    "filingSummary"
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
                "SEC Filings API Error:",
                JSON.stringify(data)
            );


            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "SEC filings research failed"

                });

        }


        /* =====================================
           EXTRACT FINAL MESSAGE
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
                    "No SEC filing research was returned"
            });

        }


        /* =====================================
           PARSE JSON
        ===================================== */

        let filings;


        try {

            filings =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "SEC Filings JSON Parse Error:",
                outputText
            );


            return res.status(500).json({
                error:
                    "Unable to process SEC filing research"
            });

        }


        /* =====================================
           CLEAN RETURNED TEXT
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


        /* =====================================
           CLEAN ANNUAL
        ===================================== */

        const latestAnnual = {

            form:
                cleanField(
                    filings.latestAnnual?.form
                ),

            filingDate:
                cleanField(
                    filings.latestAnnual?.filingDate
                ),

            fiscalPeriod:
                cleanField(
                    filings.latestAnnual?.fiscalPeriod
                ),

            summary:
                cleanField(
                    filings.latestAnnual?.summary
                )

        };


        /* =====================================
           CLEAN QUARTERLY
        ===================================== */

        const latestQuarterly = {

            form:
                cleanField(
                    filings.latestQuarterly?.form
                ),

            filingDate:
                cleanField(
                    filings.latestQuarterly?.filingDate
                ),

            fiscalPeriod:
                cleanField(
                    filings.latestQuarterly?.fiscalPeriod
                ),

            summary:
                cleanField(
                    filings.latestQuarterly?.summary
                )

        };


        /* =====================================
           CLEAN RECENT FILINGS
        ===================================== */

        const recentFilings =
            Array.isArray(filings.recentFilings)

                ? filings.recentFilings
                    .slice(0, 5)
                    .map(item => ({

                        form:
                            cleanField(item.form),

                        date:
                            cleanField(item.date),

                        title:
                            cleanField(item.title),

                        summary:
                            cleanField(item.summary)

                    }))

                : [];


        /* =====================================
           CLEAN INSIDER FILINGS
        ===================================== */

        const insiderFilings =
            Array.isArray(filings.insiderFilings)

                ? filings.insiderFilings
                    .slice(0, 4)
                    .map(item => ({

                        insider:
                            cleanField(item.insider),

                        role:
                            cleanField(item.role),

                        date:
                            cleanField(item.date),

                        transaction:
                            cleanField(
                                item.transaction
                            )

                    }))

                : [];


        /* =====================================
           RETURN CLEAN DATA
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            secFilings: {

                latestAnnual,

                latestQuarterly,

                recentFilings,

                insiderFilings,

                filingSummary:
                    cleanField(
                        filings.filingSummary
                    )

            }

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak SEC Filings Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete SEC filing research"

        });

    }

}