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
           INSTITUTIONAL RESEARCH
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

Research CURRENTLY AVAILABLE institutional
ownership information for the NASDAQ-listed
company represented by:

Ticker:
${cleanSymbol}

Known company name:
${cleanCompanyName || "Not supplied"}

First verify the company and ticker.

=========================================
IMPORTANT DATA TIMING
=========================================

Institutional ownership information is based
on regulatory filings and may be delayed.

Do not describe institutional holdings as
real-time.

Use the most recently available reliable
filing information.

Clearly identify the reporting period or
filing date where it can be verified.


=========================================
PREFERRED SOURCES
=========================================

Prefer:

1. SEC filings
2. Official company proxy filings
3. Official investor relations information
4. Reliable institutional ownership data
   derived from regulatory filings

Do not rely on speculative articles or social
media for institutional ownership.


=========================================
INSTITUTIONAL OWNERSHIP
=========================================

Find the approximate percentage of outstanding
shares held by institutions ONLY where a
reliable current figure can be verified.

Example:

72.4%

If the figure cannot be reliably verified,
return:

Not verified


=========================================
MAJOR INSTITUTIONAL HOLDERS
=========================================

Return up to 5 major institutional holders.

For each holder return:

NAME

Institution name only.

SHARES

Latest reported share position where reliably
available.

OWNERSHIP PERCENT

Percentage ownership where reliably available.

REPORTING PERIOD

The relevant filing/reporting period where
available.

If a particular value cannot be verified,
return:

Not verified


=========================================
RECENT INSTITUTIONAL ACTIVITY
=========================================

Summarise up to 4 notable recent disclosed
institutional changes where reliable filing
information is available.

Examples:

Institution increased reported position
Institution reduced reported position
New reported position
Institution exited reported position

For each activity return:

Institution name
Change
Reporting period

Do NOT infer buying or selling from incomplete
information.

Do NOT describe a position change as current
trading activity.

These are disclosed filing changes.


=========================================
OWNERSHIP CONCENTRATION
=========================================

Provide a short factual description of
institutional ownership concentration.

For example:

"Several large asset managers are among the
company's largest reported shareholders."

Do not classify concentration as good or bad.

Do not invent a concentration percentage.


=========================================
INSTITUTIONAL SUMMARY
=========================================

Provide a maximum 3-sentence factual summary.

Explain:

- the general institutional ownership picture
- notable major holders
- recent disclosed changes if available

Make clear that institutional ownership data
reflects reported filings and may lag current
positions.


=========================================
IMPORTANT EDGEBREAK RULES
=========================================

Return factual research only.

Do not provide investment advice.

Do not recommend buying, selling or holding.

Do not describe institutional ownership as
bullish or bearish.

Do not claim institutional accumulation
unless supported by EdgeBreak's own scanner
data supplied separately.

Do not claim institutions are currently
buying based solely on historical filings.

Do not predict stock performance.

Do not provide price targets.

Do not invent institutional holders.

Do not invent share counts.

Do not invent ownership percentages.

Do not invent position changes.

Do not include URLs inside returned fields.

Do not include citations inside returned
fields.

Do not include markdown links inside returned
fields.

Do not include source names inside returned
fields.

If information cannot be reliably verified,
return exactly:

Not verified
`,

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_institutional_activity",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    institutionalOwnership: {
                                        type: "string"
                                    },

                                    reportingPeriod: {
                                        type: "string"
                                    },

                                    ownershipConcentration: {
                                        type: "string"
                                    },

                                    institutionalSummary: {
                                        type: "string"
                                    },

                                    majorHolders: {

                                        type: "array",

                                        maxItems: 5,

                                        items: {

                                            type: "object",

                                            properties: {

                                                name: {
                                                    type: "string"
                                                },

                                                shares: {
                                                    type: "string"
                                                },

                                                ownershipPercent: {
                                                    type: "string"
                                                },

                                                reportingPeriod: {
                                                    type: "string"
                                                }

                                            },

                                            required: [
                                                "name",
                                                "shares",
                                                "ownershipPercent",
                                                "reportingPeriod"
                                            ],

                                            additionalProperties:
                                                false

                                        }

                                    },

                                    recentActivity: {

                                        type: "array",

                                        maxItems: 4,

                                        items: {

                                            type: "object",

                                            properties: {

                                                institution: {
                                                    type: "string"
                                                },

                                                change: {
                                                    type: "string"
                                                },

                                                reportingPeriod: {
                                                    type: "string"
                                                }

                                            },

                                            required: [
                                                "institution",
                                                "change",
                                                "reportingPeriod"
                                            ],

                                            additionalProperties:
                                                false

                                        }

                                    }

                                },

                                required: [
                                    "institutionalOwnership",
                                    "reportingPeriod",
                                    "ownershipConcentration",
                                    "institutionalSummary",
                                    "majorHolders",
                                    "recentActivity"
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
                "Institutional API Error:",
                JSON.stringify(data)
            );


            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "Institutional research request failed"

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
                    "No institutional research was returned"

            });

        }


        /* =====================================
           PARSE JSON
        ===================================== */

        let institutional;


        try {

            institutional =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Institutional JSON Parse Error:",
                outputText
            );


            return res.status(500).json({

                error:
                    "Unable to process institutional research"

            });

        }


        /* =====================================
           CLEAN FIELD
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
           CLEAN MAJOR HOLDERS
        ===================================== */

        const majorHolders =
            Array.isArray(
                institutional.majorHolders
            )

                ? institutional.majorHolders
                    .slice(0, 5)
                    .map(holder => ({

                        name:
                            cleanField(
                                holder.name
                            ),

                        shares:
                            cleanField(
                                holder.shares
                            ),

                        ownershipPercent:
                            cleanField(
                                holder.ownershipPercent
                            ),

                        reportingPeriod:
                            cleanField(
                                holder.reportingPeriod
                            )

                    }))

                : [];


        /* =====================================
           CLEAN RECENT ACTIVITY
        ===================================== */

        const recentActivity =
            Array.isArray(
                institutional.recentActivity
            )

                ? institutional.recentActivity
                    .slice(0, 4)
                    .map(activity => ({

                        institution:
                            cleanField(
                                activity.institution
                            ),

                        change:
                            cleanField(
                                activity.change
                            ),

                        reportingPeriod:
                            cleanField(
                                activity.reportingPeriod
                            )

                    }))

                : [];


        /* =====================================
           FINAL SAFE OBJECT
        ===================================== */

        const cleanInstitutional = {

            institutionalOwnership:
                cleanField(
                    institutional
                        .institutionalOwnership
                ),

            reportingPeriod:
                cleanField(
                    institutional.reportingPeriod
                ),

            ownershipConcentration:
                cleanField(
                    institutional
                        .ownershipConcentration
                ),

            institutionalSummary:
                cleanField(
                    institutional
                        .institutionalSummary
                ),

            majorHolders:
                majorHolders,

            recentActivity:
                recentActivity

        };


        /* =====================================
           RETURN
        ===================================== */

        return res.status(200).json({

            success: true,

            symbol:
                cleanSymbol,

            institutionalActivity:
                cleanInstitutional

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak Institutional Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete institutional research"

        });

    }

}