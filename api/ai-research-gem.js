/* =========================================
EDGEBREAK — GEMINI AI RESEARCH
/api/ai-research-gem.js

ONE ENDPOINT HANDLES:

quick_research
company_overview
financials
market_attention_news
institutional_activity
sec_filings
========================================= */

const GEMINI_MODEL =
    "gemini-3.6-flash";


export default async function handler(req, res) {

    /* =====================================
    POST ONLY
    ===================================== */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    /* =====================================
    ENVIRONMENT
    ===================================== */

    if (!process.env.GEMINI_API_KEY) {

        return res.status(500).json({
            error: "AI service is not configured"
        });

    }


    /* =====================================
    REQUEST DATA
    ===================================== */

    const {
        symbol,
        companyName,
        researchType
    } = req.body || {};


    if (!symbol) {

        return res.status(400).json({
            error: "Stock symbol is required"
        });

    }


    if (!researchType) {

        return res.status(400).json({
            error: "Research type is required"
        });

    }


    const cleanSymbol =
        String(symbol)
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9.\-]/g, "")
            .slice(0, 15);


    if (!cleanSymbol) {

        return res.status(400).json({
            error: "Invalid stock symbol"
        });

    }


    const cleanCompanyName =
        cleanInput(
            companyName || ""
        );


    /* =====================================
    RESEARCH CONFIGURATION
    ===================================== */

    const configs = {

        quick_research: {

            cacheHours: 168,

            useSearch: false,

            maxOutputTokens: 900,

            responseKey: null,

            schema:
                getQuickResearchSchema(),

            prompt:
                getQuickResearchPrompt(
                    cleanSymbol
                )

        },


        company_overview: {

            cacheHours: 168,

            useSearch: true,

            maxOutputTokens: 1400,

            responseKey:
                "companyOverview",

            schema:
                getCompanyOverviewSchema(),

            prompt:
                getCompanyOverviewPrompt(
                    cleanSymbol,
                    cleanCompanyName
                )

        },


        financials: {

            cacheHours: 24,

            useSearch: true,

            maxOutputTokens: 1800,

            responseKey:
                "financialHighlights",

            schema:
                getFinancialSchema(),

            prompt:
                getFinancialPrompt(
                    cleanSymbol,
                    cleanCompanyName
                )

        },


        market_attention_news: {

            cacheHours: 1,

            useSearch: true,

            maxOutputTokens: 2400,

            responseKey: null,

            schema:
                getMarketAttentionSchema(),

            prompt:
                getMarketAttentionPrompt(
                    cleanSymbol,
                    cleanCompanyName
                )

        },


        institutional_activity: {

            cacheHours: 24,

            useSearch: true,

            maxOutputTokens: 2200,

            responseKey:
                "institutionalActivity",

            schema:
                getInstitutionalSchema(),

            prompt:
                getInstitutionalPrompt(
                    cleanSymbol,
                    cleanCompanyName
                )

        },


        sec_filings: {

            cacheHours: 6,

            useSearch: true,

            maxOutputTokens: 2400,

            responseKey:
                "secFilings",

            schema:
                getSecSchema(),

            prompt:
                getSecPrompt(
                    cleanSymbol,
                    cleanCompanyName
                )

        }

    };


    const config =
        configs[researchType];


    if (!config) {

        return res.status(400).json({
            error: "Invalid research type"
        });

    }


    try {

        /* =====================================
        CACHE

        Quick research is deliberately not
        dependent on the cache being available.

        Current-data modules retain the existing
        Supabase cache architecture.
        ===================================== */

        const canUseCache =
            Boolean(
                process.env.SUPABASE_URL &&
                process.env.SUPABASE_SERVICE_KEY
            );


        if (
            researchType !== "quick_research" &&
            !canUseCache
        ) {

            return res.status(500).json({
                error:
                    "Research cache is not configured"
            });

        }


        /* =====================================
        CHECK CACHE
        ===================================== */

        if (canUseCache) {

            const cached =
                await readCache(
                    cleanSymbol,
                    researchType
                );


            if (cached) {

                console.log(
                    `EdgeBreak Gemini CACHE HIT: ${cleanSymbol} ${researchType}`
                );


                return sendCachedResponse(
                    res,
                    cleanSymbol,
                    researchType,
                    cached
                );

            }


            console.log(
                `EdgeBreak Gemini CACHE MISS: ${cleanSymbol} ${researchType}`
            );

        }


        /* =====================================
        GEMINI
        ===================================== */

        const research =
            await runGemini({

                prompt:
                    config.prompt,

                schema:
                    config.schema,

                useSearch:
                    config.useSearch,

                maxOutputTokens:
                    config.maxOutputTokens

            });


        /* =====================================
        CLEAN / NORMALISE RESULT
        ===================================== */

        const cleanResearch =
            normaliseResearch(
                researchType,
                research
            );


        /* =====================================
        SERVER SAFETY FILTER
        ===================================== */

        if (
            containsProhibitedAdvice(
                cleanResearch
            )
        ) {

            console.error(
                `EdgeBreak Gemini safety filter blocked ${cleanSymbol} ${researchType}`
            );


            return res.status(422).json({
                error:
                    "The research response could not be displayed"
            });

        }


        /* =====================================
        QUICK RESEARCH RESPONSE
        ===================================== */

        if (
            researchType ===
            "quick_research"
        ) {

            return res.status(200).json({

                success: true,

                symbol:
                    cleanSymbol,

                companyName:
                    cleanResearch.companyName,

                industry:
                    cleanResearch.industry,

                research:
                    cleanResearch.summary

            });

        }


        /* =====================================
        BUILD CACHE DATA
        ===================================== */

        let cacheData;


        if (
            researchType ===
            "market_attention_news"
        ) {

            cacheData = {

                marketAttention:
                    cleanResearch.marketAttention,

                recentNews:
                    cleanResearch.recentNews

            };

        }
        else {

            cacheData = {

                [config.responseKey]:
                    cleanResearch

            };

        }


        const expiresAt =
            new Date(
                Date.now() +
                config.cacheHours *
                60 *
                60 *
                1000
            ).toISOString();


        /* =====================================
        SAVE CACHE
        ===================================== */

        if (canUseCache) {

            await saveCache(
                cleanSymbol,
                researchType,
                cacheData,
                expiresAt
            );

        }


        /* =====================================
        RETURN
        ===================================== */

        if (
            researchType ===
            "market_attention_news"
        ) {

            return res.status(200).json({

                success: true,

                cached: false,

                symbol:
                    cleanSymbol,

                marketAttention:
                    cleanResearch.marketAttention,

                recentNews:
                    cleanResearch.recentNews,

                cacheExpiresAt:
                    expiresAt

            });

        }


        return res.status(200).json({

            success: true,

            cached: false,

            symbol:
                cleanSymbol,

            [config.responseKey]:
                cleanResearch,

            cacheExpiresAt:
                expiresAt

        });

    }
    catch (error) {

        console.error(
            `EdgeBreak Gemini Research Error (${researchType}):`,
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete AI research"

        });

    }

}


/* =========================================
GEMINI REQUEST
========================================= */

async function runGemini({

    prompt,
    schema,
    useSearch,
    maxOutputTokens

}) {

    const body = {

        systemInstruction: {

            parts: [
                {
                    text:
                        getSystemInstruction()
                }
            ]

        },


        contents: [

            {

                role: "user",

                parts: [

                    {
                        text:
                            prompt
                    }

                ]

            }

        ],


        generationConfig: {

            maxOutputTokens:
                maxOutputTokens,

            responseFormat: {

                text: {

                    mimeType:
                        "application/json",

                    schema:
                        schema

                }

            }

        }

    };


    /* =====================================
    GOOGLE SEARCH GROUNDING
    ===================================== */

    if (useSearch) {

        body.tools = [

            {
                googleSearch: {}
            }

        ];

    }


    const response =
        await fetch(

            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "x-goog-api-key":
                        process.env.GEMINI_API_KEY

                },

                body:
                    JSON.stringify(body)

            }

        );


    const responseText =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(responseText);

    }
    catch {

        console.error(
            "Gemini returned non-JSON API response:",
            responseText
        );


        throw new Error(
            "Invalid Gemini API response"
        );

    }


    if (!response.ok) {

        console.error(
            "Gemini Research API Error:",
            response.status,
            JSON.stringify(data)
        );


        throw new Error(
            data?.error?.message ||
            "Gemini research request failed"
        );

    }


    /* =====================================
    EXTRACT MODEL OUTPUT
    ===================================== */

    const rawText =
        data
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
            "Gemini returned no research:",
            JSON.stringify(data)
        );


        throw new Error(
            "No Gemini research returned"
        );

    }


    /* =====================================
    PARSE STRUCTURED OUTPUT
    ===================================== */

    try {

        return JSON.parse(rawText);

    }
    catch (error) {

        console.error(
            "Gemini Research JSON Parse Error:",
            error,
            rawText
        );


        throw new Error(
            "Unable to process Gemini research"
        );

    }

}


/* =========================================
SYSTEM INSTRUCTION
========================================= */

function getSystemInstruction() {

    return `

You are EdgeBreak AI Research.

EdgeBreak is a factual NASDAQ market research
and education platform.

Your job is to return neutral factual research.

IMPORTANT:

Do not provide investment advice.

Do not recommend buying, selling or holding.

Do not tell a user whether they should enter,
exit, avoid, accumulate, reduce or trade a
security.

Do not provide trading signals.

Do not provide price targets.

Do not estimate expected investment returns.

Do not predict future share-price performance.

Do not describe a security as a good or bad
investment.

Do not classify a stock as bullish or bearish.

Do not assign investment ratings or scores.

Do not exaggerate evidence.

Do not invent facts.

Do not invent financial figures.

Do not invent news.

Do not invent SEC filings.

Do not invent institutional positions.

Do not invent social-media activity.

When current information is requested, use the
provided Google Search grounding capability.

Where information cannot be reliably verified,
return exactly:

Not verified

Do not fill missing current information using
assumptions.

Do not include URLs in returned fields.

Do not include markdown links.

Do not include citations inside returned fields.

Do not include footnotes inside returned fields.

Use concise neutral language.

Return only the requested structured JSON.

`;

}


/* =========================================
QUICK RESEARCH
========================================= */

function getQuickResearchPrompt(
    symbol
) {

    return `

Identify the publicly listed company associated
with NASDAQ ticker:

${symbol}

This is a FAST identification request using
existing model knowledge only.

Do not claim that this information is current
or web verified.

Return:

COMPANY NAME
Official or commonly recognised company name.

INDUSTRY
Primary industry or business area.

SUMMARY
A concise factual explanation of what the
company primarily does.

Approximately 60-100 words maximum.

Do not discuss:

financial statements
detailed earnings
institutional ownership
market attention
social media
technical analysis
SEC filing history
analyst ratings
price targets

If the ticker cannot be identified confidently,
return "Not verified" rather than guessing.

`;

}


function getQuickResearchSchema() {

    return {

        type: "object",

        properties: {

            companyName: {
                type: "string"
            },

            industry: {
                type: "string"
            },

            summary: {
                type: "string"
            }

        },

        required: [
            "companyName",
            "industry",
            "summary"
        ],

        additionalProperties:
            false

    };

}


/* =========================================
COMPANY OVERVIEW
========================================= */

function getCompanyOverviewPrompt(
    symbol,
    companyName
) {

    return `

Research the CURRENT company information for:

NASDAQ ticker:
${symbol}

Known company name:
${companyName || "Not supplied"}

First verify that the ticker and company match.

Use current Google Search research.

Prefer authoritative information including:

official company website
official investor relations information
SEC filings
NASDAQ or exchange information
reputable financial information sources


Return ONLY company overview information.


COMPANY NAME

Return the current verified company name.


INDUSTRY

Return the primary industry or business area.


HEADQUARTERS

Return city plus state or country where
reliably verified.


FOUNDED

Return the founding year where reliably
verified.


EMPLOYEES

Return the most recently available employee
count.

Include reporting context where useful.

Do not estimate.


BUSINESS SUMMARY

Maximum 4 concise factual sentences.

Explain:

what the company does
main products or services
main customer markets
important business segments where relevant


Do not include detailed financial analysis.

Do not include market attention.

Do not include stock-price analysis.

Do not provide investment interpretation.

`;

}


function getCompanyOverviewSchema() {

    return {

        type: "object",

        properties: {

            companyName: {
                type: "string"
            },

            industry: {
                type: "string"
            },

            headquarters: {
                type: "string"
            },

            founded: {
                type: "string"
            },

            employees: {
                type: "string"
            },

            businessSummary: {
                type: "string"
            }

        },

        required: [
            "companyName",
            "industry",
            "headquarters",
            "founded",
            "employees",
            "businessSummary"
        ],

        additionalProperties:
            false

    };

}


/* =========================================
FINANCIAL HIGHLIGHTS
========================================= */

function getFinancialPrompt(
    symbol,
    companyName
) {

    return `

Research CURRENT financial information for:

NASDAQ ticker:
${symbol}

Known company name:
${companyName || "Not supplied"}

First verify the company and ticker.

Prefer authoritative information in this order:

latest company earnings release
official investor relations information
latest 10-Q
latest 10-K
SEC filings

Return only Financial Highlights.


LATEST REVENUE

Use latest reported quarterly revenue.

Include reporting period.

Example:

$184.2 million — Q2 2026


REVENUE GROWTH

Use year-over-year revenue growth for the
same latest quarter where reliably available.

Example:

+12.4% YoY


EPS

Use latest reported diluted EPS.

Identify GAAP EPS where possible.


CASH

Use latest reported cash and cash equivalents.


DEBT

Use latest clearly reported debt figure.

Do not confuse total liabilities with debt.


GROSS MARGIN

Use latest reported GAAP gross margin where
available.


FREE CASH FLOW

Use latest reported free cash flow only where
explicitly reported or reliably verifiable.

Do not invent or estimate free cash flow.


LATEST QUARTER

Maximum 3 factual sentences.

Summarise the latest reported quarter,
including relevant reported revenue movement,
profitability or loss, guidance changes or
other material financial developments.

IMPORTANT:

All figures need useful reporting context.

Prefer quarterly figures for consistency.

Do not mix annual revenue with quarterly EPS
without clearly identifying periods.

If a value cannot be reliably verified return:

Not verified

`;

}


function getFinancialSchema() {

    return {

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

    };

}


/* =========================================
MARKET ATTENTION + RECENT NEWS
========================================= */

function getMarketAttentionPrompt(
    symbol,
    companyName
) {

    return `

Research CURRENT MARKET ATTENTION and RECENT
COMPANY NEWS for:

NASDAQ ticker:
${symbol}

Known company name:
${companyName || "Not supplied"}

First verify the company and ticker.

Use current Google Search research.

Focus primarily on:

past 24 hours
past several days
past 7 days

Older information may be used only where
necessary to explain a current development.


=========================================
MARKET ATTENTION
=========================================

ATTENTION LEVEL

Return exactly one of:

HIGH
ELEVATED
MODERATE
LOW
LIMITED
NOT VERIFIED

HIGH:
Strong evidence of unusually intense current
public attention.

ELEVATED:
Attention clearly appears above normal.

MODERATE:
Meaningful current discussion without strong
evidence of unusually high attention.

LOW or LIMITED:
Little current public attention.

NOT VERIFIED:
Insufficient reliable evidence.


WHERE

Identify where current attention is appearing.

Examples:

Financial media
Company news
SEC filings
Reddit
X
Other social media

Mention a platform only where current activity
was actually identified.

Do not assume X or Reddit activity simply
because financial media coverage exists.


DISCUSSION CHANGE

Return an exact percentage comparison ONLY
where a reliable source provides enough
information to verify it.

Example:

+184% vs 7-day average

Never invent or calculate a percentage from
vague search results.

Otherwise:

Not verified


NEWS ACTIVITY

Return exactly one of:

Elevated
Normal
Limited
Not verified


RELATIVE VOLUME

Return a figure such as:

2.3x normal

ONLY where reliable current trading-volume
information supports it.

Do not infer relative volume from price
movement, news or social discussion.

Otherwise:

Not verified


ATTENTION BEGAN

Identify approximately when increased attention
began only where timing can reasonably be
established.

Otherwise:

Not verified


MAIN TOPICS

Return up to 4 concise current topics actually
supported by research.


SUMMARY

Maximum 3 factual sentences explaining why
the company is receiving its identified level
of attention.

Do not classify attention as good or bad for
the stock.


=========================================
RECENT COMPANY NEWS
=========================================

NEWS LEVEL

Return exactly one of:

HIGH
ELEVATED
NORMAL
LIMITED
NOT VERIFIED


RECENT DEVELOPMENTS

Return up to 4 meaningful developments.

Prioritise:

earnings
guidance
major contracts
acquisitions
regulatory developments
FDA decisions
product announcements
major partnerships
management changes
material SEC filings
financing activity
significant operational developments

Do not fill the list with generic share-price
articles.

Do not duplicate the same development from
multiple publishers.


For each development return:

DATE
Concise verified date or "Not verified".

CATEGORY
Concise factual category.

HEADLINE
Original concise factual description.
Do not copy publisher headlines verbatim.

SUMMARY
Maximum 2 factual sentences.


RECENT NEWS SUMMARY

Maximum 3 factual sentences.

Do not describe developments as good or bad
for investors.

Do not predict their effect on the share price.

`;

}


function getMarketAttentionSchema() {

    return {

        type: "object",

        properties: {

            marketAttention: {

                type: "object",

                properties: {

                    attentionLevel: {

                        type: "string",

                        enum: [
                            "HIGH",
                            "ELEVATED",
                            "MODERATE",
                            "LOW",
                            "LIMITED",
                            "NOT VERIFIED"
                        ]

                    },

                    where: {
                        type: "string"
                    },

                    discussionChange: {
                        type: "string"
                    },

                    newsActivity: {

                        type: "string",

                        enum: [
                            "Elevated",
                            "Normal",
                            "Limited",
                            "Not verified"
                        ]

                    },

                    relativeVolume: {
                        type: "string"
                    },

                    attentionBegan: {
                        type: "string"
                    },

                    mainTopics: {

                        type: "array",

                        maxItems: 4,

                        items: {
                            type: "string"
                        }

                    },

                    summary: {
                        type: "string"
                    }

                },

                required: [
                    "attentionLevel",
                    "where",
                    "discussionChange",
                    "newsActivity",
                    "relativeVolume",
                    "attentionBegan",
                    "mainTopics",
                    "summary"
                ],

                additionalProperties:
                    false

            },


            recentNews: {

                type: "object",

                properties: {

                    newsLevel: {

                        type: "string",

                        enum: [
                            "HIGH",
                            "ELEVATED",
                            "NORMAL",
                            "LIMITED",
                            "NOT VERIFIED"
                        ]

                    },

                    summary: {
                        type: "string"
                    },

                    items: {

                        type: "array",

                        maxItems: 4,

                        items: {

                            type: "object",

                            properties: {

                                date: {
                                    type: "string"
                                },

                                category: {
                                    type: "string"
                                },

                                headline: {
                                    type: "string"
                                },

                                summary: {
                                    type: "string"
                                }

                            },

                            required: [
                                "date",
                                "category",
                                "headline",
                                "summary"
                            ],

                            additionalProperties:
                                false

                        }

                    }

                },

                required: [
                    "newsLevel",
                    "summary",
                    "items"
                ],

                additionalProperties:
                    false

            }

        },

        required: [
            "marketAttention",
            "recentNews"
        ],

        additionalProperties:
            false

    };

}


/* =========================================
INSTITUTIONAL ACTIVITY
========================================= */

function getInstitutionalPrompt(
    symbol,
    companyName
) {

    return `

Research CURRENTLY AVAILABLE institutional
ownership information for:

NASDAQ ticker:
${symbol}

Known company name:
${companyName || "Not supplied"}

First verify the company and ticker.

IMPORTANT:

Institutional ownership information is based
on regulatory filings and may be delayed.

Never describe institutional holdings as
real-time.

Use the most recently available reliable
filing information.

Prefer:

SEC filings
official proxy filings
official investor relations information
reliable ownership information derived from
regulatory filings


INSTITUTIONAL OWNERSHIP

Return approximate institutional ownership
percentage only where reliably verified.

Otherwise:

Not verified


REPORTING PERIOD

Identify the relevant reporting period or
filing date.

Otherwise:

Not verified


MAJOR HOLDERS

Return up to 5 major institutional holders.

For each:

name
latest reported shares
ownership percentage
reporting period

Use "Not verified" for individual values that
cannot be verified.


RECENT ACTIVITY

Return up to 4 notable recently disclosed
position changes where reliable filing data
exists.

For each:

institution
change
reporting period

Examples of factual changes:

Increased reported position
Reduced reported position
New reported position
Exited reported position

Do not infer buying or selling from incomplete
information.

Do not describe historical filing changes as
current trading activity.


OWNERSHIP CONCENTRATION

Short factual description only.

Do not classify concentration as good or bad.


INSTITUTIONAL SUMMARY

Maximum 3 factual sentences.

Explain:

general reported institutional ownership
major holders
notable disclosed changes where available

Make clear that filing data can lag current
positions.

Do not describe institutional ownership as
bullish or bearish.

Do not claim institutional accumulation unless
separate EdgeBreak scanner data establishes it.

`;

}


function getInstitutionalSchema() {

    return {

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

    };

}


/* =========================================
SEC FILINGS
========================================= */

function getSecPrompt(
    symbol,
    companyName
) {

    return `

Research recent SEC filings for:

NASDAQ ticker:
${symbol}

Known company name:
${companyName || "Not supplied"}

First verify the company and ticker.

Prefer SEC EDGAR information as the primary
source.

Official investor relations information may
be used as a secondary source.


LATEST ANNUAL FILING

Normally Form 10-K.

Return:

form
filing date
fiscal period
short factual description


LATEST QUARTERLY FILING

Normally Form 10-Q.

Return:

form
filing date
fiscal period
short factual description


RECENT MATERIAL FILINGS

Return up to 5 recent material filings.

Prioritise:

8-K
10-K
10-Q
S-1
S-3
DEF 14A
13D
13G

For each return:

form
date
plain-English title
concise factual summary

Do not speculate about market impact.


INSIDER FILINGS

Check for relevant recent Form 4 disclosures.

Return up to 4.

For each:

insider
role
date
transaction

Distinguish where reliably possible:

open-market purchase
open-market sale
option exercise
grant or award
tax withholding
other transaction

Do not describe every Form 4 as insider buying
or insider selling.

If transaction details cannot be reliably
verified return:

Not verified


FILING SUMMARY

Maximum 3 factual sentences describing recent
regulatory filing activity.

Do not classify filing activity as positive,
negative, bullish or bearish.

Do not infer investor sentiment.

`;

}


function getSecSchema() {

    const filingObject = {

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

    };


    return {

        type: "object",

        properties: {

            latestAnnual:
                filingObject,

            latestQuarterly:
                filingObject,

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

    };

}


/* =========================================
NORMALISE RESEARCH
========================================= */

function normaliseResearch(
    researchType,
    data
) {

    switch (researchType) {

        case "quick_research":

            return {

                companyName:
                    cleanField(
                        data?.companyName
                    ),

                industry:
                    cleanField(
                        data?.industry
                    ),

                summary:
                    cleanField(
                        data?.summary
                    )

            };


        case "company_overview":

            return {

                companyName:
                    cleanField(
                        data?.companyName
                    ),

                industry:
                    cleanField(
                        data?.industry
                    ),

                headquarters:
                    cleanField(
                        data?.headquarters
                    ),

                founded:
                    cleanField(
                        data?.founded
                    ),

                employees:
                    cleanField(
                        data?.employees
                    ),

                businessSummary:
                    cleanField(
                        data?.businessSummary
                    )

            };


        case "financials":

            return {

                revenue:
                    cleanField(
                        data?.revenue
                    ),

                revenueGrowth:
                    cleanField(
                        data?.revenueGrowth
                    ),

                eps:
                    cleanField(
                        data?.eps
                    ),

                cash:
                    cleanField(
                        data?.cash
                    ),

                debt:
                    cleanField(
                        data?.debt
                    ),

                grossMargin:
                    cleanField(
                        data?.grossMargin
                    ),

                freeCashFlow:
                    cleanField(
                        data?.freeCashFlow
                    ),

                latestQuarter:
                    cleanField(
                        data?.latestQuarter
                    )

            };


        case "market_attention_news":

            return normaliseMarketAttention(
                data
            );


        case "institutional_activity":

            return normaliseInstitutional(
                data
            );


        case "sec_filings":

            return normaliseSec(
                data
            );


        default:

            return {};

    }

}


/* =========================================
NORMALISE MARKET ATTENTION
========================================= */

function normaliseMarketAttention(data) {

    const attention =
        data?.marketAttention || {};


    const news =
        data?.recentNews || {};


    const topics =
        Array.isArray(
            attention.mainTopics
        )

            ? attention.mainTopics
                .slice(0, 4)
                .map(cleanField)
                .filter(
                    item =>
                        item !== "Not verified"
                )

            : [];


    const newsItems =
        Array.isArray(news.items)

            ? news.items
                .slice(0, 4)
                .map(item => ({

                    date:
                        cleanField(
                            item?.date
                        ),

                    category:
                        cleanField(
                            item?.category
                        ),

                    headline:
                        cleanField(
                            item?.headline
                        ),

                    summary:
                        cleanField(
                            item?.summary
                        )

                }))

            : [];


    return {

        marketAttention: {

            attentionLevel:
                cleanField(
                    attention.attentionLevel
                ),

            where:
                cleanField(
                    attention.where
                ),

            discussionChange:
                cleanField(
                    attention.discussionChange
                ),

            newsActivity:
                cleanField(
                    attention.newsActivity
                ),

            relativeVolume:
                cleanField(
                    attention.relativeVolume
                ),

            attentionBegan:
                cleanField(
                    attention.attentionBegan
                ),

            mainTopics:
                topics,

            summary:
                cleanField(
                    attention.summary
                )

        },


        recentNews: {

            newsLevel:
                cleanField(
                    news.newsLevel
                ),

            summary:
                cleanField(
                    news.summary
                ),

            items:
                newsItems

        }

    };

}


/* =========================================
NORMALISE INSTITUTIONAL
========================================= */

function normaliseInstitutional(data) {

    const majorHolders =
        Array.isArray(data?.majorHolders)

            ? data.majorHolders
                .slice(0, 5)
                .map(holder => ({

                    name:
                        cleanField(
                            holder?.name
                        ),

                    shares:
                        cleanField(
                            holder?.shares
                        ),

                    ownershipPercent:
                        cleanField(
                            holder?.ownershipPercent
                        ),

                    reportingPeriod:
                        cleanField(
                            holder?.reportingPeriod
                        )

                }))

            : [];


    const recentActivity =
        Array.isArray(data?.recentActivity)

            ? data.recentActivity
                .slice(0, 4)
                .map(activity => ({

                    institution:
                        cleanField(
                            activity?.institution
                        ),

                    change:
                        cleanField(
                            activity?.change
                        ),

                    reportingPeriod:
                        cleanField(
                            activity?.reportingPeriod
                        )

                }))

            : [];


    return {

        institutionalOwnership:
            cleanField(
                data?.institutionalOwnership
            ),

        reportingPeriod:
            cleanField(
                data?.reportingPeriod
            ),

        ownershipConcentration:
            cleanField(
                data?.ownershipConcentration
            ),

        institutionalSummary:
            cleanField(
                data?.institutionalSummary
            ),

        majorHolders:
            majorHolders,

        recentActivity:
            recentActivity

    };

}


/* =========================================
NORMALISE SEC
========================================= */

function normaliseSec(data) {

    const cleanMainFiling =
        item => ({

            form:
                cleanField(
                    item?.form
                ),

            filingDate:
                cleanField(
                    item?.filingDate
                ),

            fiscalPeriod:
                cleanField(
                    item?.fiscalPeriod
                ),

            summary:
                cleanField(
                    item?.summary
                )

        });


    const recentFilings =
        Array.isArray(data?.recentFilings)

            ? data.recentFilings
                .slice(0, 5)
                .map(item => ({

                    form:
                        cleanField(
                            item?.form
                        ),

                    date:
                        cleanField(
                            item?.date
                        ),

                    title:
                        cleanField(
                            item?.title
                        ),

                    summary:
                        cleanField(
                            item?.summary
                        )

                }))

            : [];


    const insiderFilings =
        Array.isArray(data?.insiderFilings)

            ? data.insiderFilings
                .slice(0, 4)
                .map(item => ({

                    insider:
                        cleanField(
                            item?.insider
                        ),

                    role:
                        cleanField(
                            item?.role
                        ),

                    date:
                        cleanField(
                            item?.date
                        ),

                    transaction:
                        cleanField(
                            item?.transaction
                        )

                }))

            : [];


    return {

        latestAnnual:
            cleanMainFiling(
                data?.latestAnnual
            ),

        latestQuarterly:
            cleanMainFiling(
                data?.latestQuarterly
            ),

        recentFilings:
            recentFilings,

        insiderFilings:
            insiderFilings,

        filingSummary:
            cleanField(
                data?.filingSummary
            )

    };

}


/* =========================================
SUPABASE CACHE READ
========================================= */

async function readCache(
    symbol,
    researchType
) {

    const now =
        new Date().toISOString();


    const cacheUrl =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/ai_research_cache` +
        `?symbol=eq.${encodeURIComponent(symbol)}` +
        `&research_type=eq.${encodeURIComponent(researchType)}` +
        `&expires_at=gt.${encodeURIComponent(now)}` +
        `&select=data,created_at,expires_at` +
        `&limit=1`;


    try {

        const response =
            await fetch(
                cacheUrl,
                {

                    method: "GET",

                    headers:
                        getSupabaseHeaders()

                }
            );


        if (!response.ok) {

            console.error(
                "Gemini Cache Read Error:",
                await response.text()
            );

            return null;

        }


        const rows =
            await response.json();


        if (
            Array.isArray(rows) &&
            rows.length > 0 &&
            rows[0]?.data
        ) {

            return rows[0];

        }


        return null;

    }
    catch (error) {

        console.error(
            "Gemini Cache Read Exception:",
            error
        );


        return null;

    }

}


/* =========================================
SUPABASE CACHE SAVE
========================================= */

async function saveCache(
    symbol,
    researchType,
    data,
    expiresAt
) {

    const saveUrl =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/ai_research_cache` +
        `?on_conflict=symbol,research_type`;


    try {

        const response =
            await fetch(
                saveUrl,
                {

                    method: "POST",

                    headers: {

                        ...getSupabaseHeaders(),

                        "Prefer":
                            "resolution=merge-duplicates,return=minimal"

                    },

                    body:
                        JSON.stringify({

                            symbol:
                                symbol,

                            research_type:
                                researchType,

                            data:
                                data,

                            created_at:
                                new Date().toISOString(),

                            expires_at:
                                expiresAt

                        })

                }
            );


        if (!response.ok) {

            console.error(
                "Gemini Cache Save Error:",
                await response.text()
            );


            return;

        }


        console.log(
            `EdgeBreak Gemini CACHE SAVED: ${symbol} ${researchType}`
        );

    }
    catch (error) {

        console.error(
            "Gemini Cache Save Exception:",
            error
        );

    }

}


/* =========================================
CACHED RESPONSE
========================================= */

function sendCachedResponse(
    res,
    symbol,
    researchType,
    cached
) {

    const data =
        cached.data || {};


    const common = {

        success: true,

        cached: true,

        symbol:
            symbol,

        cacheCreatedAt:
            cached.created_at,

        cacheExpiresAt:
            cached.expires_at

    };


    switch (researchType) {

        case "company_overview":

            return res.status(200).json({

                ...common,

                companyOverview:
                    data.companyOverview

            });


        case "financials":

            return res.status(200).json({

                ...common,

                financialHighlights:
                    data.financialHighlights

            });


        case "market_attention_news":

            return res.status(200).json({

                ...common,

                marketAttention:
                    data.marketAttention,

                recentNews:
                    data.recentNews

            });


        case "institutional_activity":

            return res.status(200).json({

                ...common,

                institutionalActivity:
                    data.institutionalActivity

            });


        case "sec_filings":

            return res.status(200).json({

                ...common,

                secFilings:
                    data.secFilings

            });


        default:

            return res.status(500).json({
                error:
                    "Invalid cached research response"
            });

    }

}


/* =========================================
SUPABASE HEADERS
========================================= */

function getSupabaseHeaders() {

    return {

        "apikey":
            process.env.SUPABASE_SERVICE_KEY,

        "Authorization":
            `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,

        "Content-Type":
            "application/json"

    };

}


/* =========================================
INPUT CLEANING
========================================= */

function cleanInput(value) {

    return String(value || "")

        .replace(
            /\(\[.*?\]\(.*?\)\)/g,
            ""
        )

        .replace(
            /https?:\/\/\S+/gi,
            ""
        )

        .replace(
            /\[[^\]]+\]/g,
            ""
        )

        .replace(
            /[\r\n\t]+/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        .slice(0, 200);

}


/* =========================================
OUTPUT CLEANING
========================================= */

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

            .trim()

            .slice(0, 1600);


    return cleaned ||
        "Not verified";

}


/* =========================================
SERVER-SIDE ADVICE FILTER
========================================= */

function containsProhibitedAdvice(
    value
) {

    let text;


    try {

        text =
            JSON.stringify(value);

    }
    catch {

        return true;

    }


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

        /\bhigh probability trade\b/i,

        /\bguaranteed breakout\b/i,

        /\bgoing to the moon\b/i

    ];


    return prohibitedPatterns.some(
        pattern =>
            pattern.test(text)
    );

}