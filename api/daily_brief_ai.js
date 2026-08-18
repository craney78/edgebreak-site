/* =========================================
EDGEBREAK — DAILY BRIEF AI RESEARCH
daily_brief_ai.js
========================================= */

import fs from "fs";


/* =========================================
FILES
========================================= */

const INPUT_FILE =
    "daily_brief_candidates.json";

const OUTPUT_FILE =
    "daily_brief_ai_results.json";


/* =========================================
GEMINI
========================================= */

const API_KEY =
    process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
    "gemini-3.6-flash";


/* =========================================
SETTINGS
========================================= */

const MAX_OUTPUT_TOKENS = 6000;


/* =========================================
SYSTEM INSTRUCTION
========================================= */

const SYSTEM_INSTRUCTION = `

You are the market-attention research engine for EdgeBreak.

You will receive a list of NASDAQ stocks that have already
passed EdgeBreak's technical stock scanners and initial
liquidity and industry filters.

DO NOT perform another technical scan.

DO NOT decide whether a stock is a good investment.

DO NOT provide buy, sell or hold recommendations.

DO NOT provide price targets, entry prices or predictions.

Your task is to determine which of the supplied companies
currently have noteworthy or unusual market attention,
activity, news or developments that may justify further
research by the user.

Use current Google Search grounding to research the supplied
companies.

IMPORTANT:

Do not favour a company simply because it is large, famous
or regularly covered by the media.

We are particularly interested in companies where CURRENT
attention or activity appears elevated, unusual or
meaningfully different from what would normally be expected
for that company.

Smaller and lesser-known companies are important.

Do not exclude a company simply because it normally receives
little media coverage.

A previously quiet company experiencing a sudden increase in
attention may be more relevant than a large company that
receives substantial coverage every day.


LOOK FOR:

- unusually high or increasing trading activity
- unusual recent trading volume
- breaking or recent company news
- earnings surprises
- material guidance changes
- significant contracts
- partnerships
- acquisitions or strategic transactions
- FDA or regulatory developments
- clinical trial developments
- important product or technology announcements
- significant SEC filings
- noteworthy analyst developments
- noteworthy institutional developments
- significant management changes
- unusual increases in media or investor attention
- other credible current company-specific catalysts


RECENCY:

Give strongest preference to developments from the last
7 days.

You may consider developments up to 30 days old when they
are clearly still relevant to current market attention.

Older developments should normally not justify inclusion.


IMPORTANT EXCLUSION:

Do not flag a stock solely because:

- its price increased or decreased
- it is near a 52-week high or low
- it outperformed or underperformed the broader market
- it has a technically strong chart
- it recently broke resistance
- it appears to have momentum

EdgeBreak's scanners already analyse price and technical
structure.

There must ALSO be credible evidence of at least one of the
following:

- unusual or materially increased trading activity
- unusual or materially increased market or media attention
- a current company-specific catalyst
- significant company news
- a material corporate, financial, regulatory, clinical or
  strategic development

Price movement may SUPPORT the reason for inclusion.

Price movement alone is NOT sufficient.


POSITIVE AND NEGATIVE DEVELOPMENTS:

Both positive and negative developments may justify further
research.

Do not treat inclusion as an endorsement of the company.


DUPLICATE COMPANIES:

If multiple supplied ticker symbols represent different
share classes of the same company and are responding to the
same underlying development, research the company once and
combine the ticker symbols into one result.

For example:

NWS and NWSA should normally appear as one company result
when the attention relates to the same company development.


ATTENTION LEVEL:

For every included company assign one of:

HIGH
ELEVATED
NOTABLE

These labels describe the apparent level or significance of
CURRENT market attention or company-specific developments.

They are NOT investment ratings.

HIGH:

Use only when there is particularly significant,
unusual or clearly elevated current attention or a major
current development.

ELEVATED:

Use when current attention or developments are meaningfully
above what would normally be expected for the company.

NOTABLE:

Use when there is a credible current development worth
investigating but the attention does not appear unusually
high.


IMPORTANT:

Do not force companies into the results.

Most supplied companies may be omitted.

If there is no sufficiently noteworthy current reason to
include a company, omit it.

Quality is more important than quantity.

Return JSON only.

`;


/* =========================================
LOAD JSON
========================================= */

function loadJson(filename) {

    try {

        const raw =
            fs.readFileSync(
                filename,
                "utf8"
            );

        return JSON.parse(raw);

    }
    catch (error) {

        console.error(
            `Could not load ${filename}:`,
            error.message
        );

        process.exit(1);

    }

}


/* =========================================
SAVE JSON
========================================= */

function saveJson(filename, data) {

    fs.writeFileSync(
        filename,
        JSON.stringify(
            data,
            null,
            4
        )
    );

}


/* =========================================
CLEAN TEXT
========================================= */

function cleanField(
    value,
    maxLength = 1500
) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }

    return value
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);

}


/* =========================================
PREPARE CANDIDATES

We deliberately send only the information
Gemini actually needs.

Gemini is NOT being asked to analyse the
technical scanner calculations again.
========================================= */

function prepareCandidates(candidates) {

    return candidates
        .filter(
            stock =>
                stock &&
                stock.symbol
        )
        .map(stock => {

            return {

                symbol:
                    String(
                        stock.symbol
                    ).toUpperCase(),

                scanners:
                    Array.isArray(
                        stock.scanners
                    )
                        ? stock.scanners
                        : [],

                company: {

                    name:
                        stock.company?.name ||
                        "",

                    sector:
                        stock.company?.sector ||
                        "",

                    industry:
                        stock.company?.industry ||
                        ""

                }

            };

        });

}


/* =========================================
BUILD USER INSTRUCTION
========================================= */

function buildUserInstruction(
    candidates
) {

    return `

Research the following NASDAQ companies for the EdgeBreak
Daily Brief.

There are ${candidates.length} supplied ticker candidates.

Remember:

These companies have ALREADY passed EdgeBreak's technical
scanners.

Do not perform another technical assessment.

Research CURRENT market attention and company-specific
developments using Google Search grounding.

Only return companies that genuinely satisfy the inclusion
criteria in the system instruction.

Return this exact JSON structure:

{
    "generatedAt": "",
    "companiesReviewed": ${candidates.length},
    "companiesIncluded": 0,
    "results": [
        {
            "symbols": [],
            "companyName": "",
            "scanners": [],
            "attentionLevel": "",
            "headline": "",
            "summary": "",
            "currentDevelopment": "",
            "whyIncluded": "",
            "developmentDate": "",
            "sourceNames": []
        }
    ]
}


FIELD RULES


generatedAt

Use the current date/time if reasonably available.


companiesReviewed

Must equal:

${candidates.length}


companiesIncluded

Must equal the number of objects returned in results.


symbols

An array of ticker symbols.

Normally this contains one ticker.

Combine multiple share classes when they represent the same
company and same underlying development.


companyName

The company's current name.


scanners

Return the scanner labels supplied with the candidate.

If combined share classes appeared in different scanners,
combine the scanner labels without duplicates.


attentionLevel

Must be exactly one of:

HIGH
ELEVATED
NOTABLE


headline

A short factual headline describing why the company is
currently noteworthy.

Do not use promotional language.

Do not make predictions.

Keep this concise.


summary

Approximately one or two concise sentences explaining the
current situation.

This will appear directly on the EdgeBreak Daily Brief.

Do not give investment advice.


currentDevelopment

State the specific current event, catalyst, filing,
announcement, unusual activity or development responsible
for inclusion.

Be factual and specific.


whyIncluded

Briefly explain why the CURRENT attention or development is
noteworthy enough to justify further research.

Do not mention technical chart quality as the primary
reason.


developmentDate

Return the date of the most relevant current development
when it can be established.

Prefer:

YYYY-MM-DD

If a reliable date cannot be determined, return an empty
string.


sourceNames

Return a short array containing the names of the principal
credible sources supporting the inclusion.

Examples could include:

company investor relations
SEC
Reuters
Nasdaq
FDA
major financial news organisations

Do not invent sources.


IMPORTANT FINAL CHECK:

Before including each company ask:

"If I ignored the stock chart and recent price performance,
would there STILL be a current factual reason that makes
this company noteworthy?"

If the answer is NO:

DO NOT INCLUDE IT.

Return JSON only.


CANDIDATES:

${JSON.stringify(
    candidates,
    null,
    2
)}

`;

}


/* =========================================
VALIDATE RESULT
========================================= */

function validateResult(result) {

    if (
        !result ||
        typeof result !== "object"
    ) {

        throw new Error(
            "Gemini result is not an object."
        );

    }


    if (
        !Array.isArray(
            result.results
        )
    ) {

        throw new Error(
            "Gemini result does not contain a results array."
        );

    }

}


/* =========================================
CLEAN GEMINI RESULTS
========================================= */

function cleanResults(
    rawResult,
    reviewedCount
) {

    const allowedLevels =
        new Set([
            "HIGH",
            "ELEVATED",
            "NOTABLE"
        ]);


    const results = [];


    for (
        const item of
        rawResult.results
    ) {

        if (
            !item ||
            typeof item !== "object"
        ) {

            continue;

        }


        const symbols =
            Array.isArray(
                item.symbols
            )
                ? item.symbols
                    .map(
                        symbol =>
                            String(symbol)
                                .trim()
                                .toUpperCase()
                    )
                    .filter(Boolean)
                : [];


        if (
            symbols.length === 0
        ) {

            continue;

        }


        const level =
            String(
                item.attentionLevel ||
                ""
            )
                .trim()
                .toUpperCase();


        if (
            !allowedLevels.has(
                level
            )
        ) {

            continue;

        }


        const headline =
            cleanField(
                item.headline,
                220
            );


        const summary =
            cleanField(
                item.summary,
                600
            );


        const currentDevelopment =
            cleanField(
                item.currentDevelopment,
                1000
            );


        const whyIncluded =
            cleanField(
                item.whyIncluded,
                800
            );


        /*
        A result without an actual current
        development is not useful enough
        for the Daily Brief.
        */

        if (
            !headline ||
            !summary ||
            !currentDevelopment
        ) {

            continue;

        }


        const scanners =
            Array.isArray(
                item.scanners
            )
                ? [
                    ...new Set(
                        item.scanners
                            .map(
                                value =>
                                    String(value)
                                        .trim()
                            )
                            .filter(Boolean)
                    )
                ]
                : [];


        const sourceNames =
            Array.isArray(
                item.sourceNames
            )
                ? [
                    ...new Set(
                        item.sourceNames
                            .map(
                                value =>
                                    cleanField(
                                        value,
                                        120
                                    )
                            )
                            .filter(Boolean)
                    )
                ]
                : [];


        results.push({

            symbols,

            companyName:
                cleanField(
                    item.companyName,
                    200
                ),

            scanners,

            attentionLevel:
                level,

            headline,

            summary,

            currentDevelopment,

            whyIncluded,

            developmentDate:
                cleanField(
                    item.developmentDate,
                    40
                ),

            sourceNames

        });

    }


    return {

        generatedAt:
            new Date()
                .toISOString(),

        companiesReviewed:
            reviewedCount,

        companiesIncluded:
            results.length,

        results

    };

}


/* =========================================
SAFETY CHECK
========================================= */

function containsUnsafeLanguage(
    result
) {

    const text =
        JSON.stringify(
            result
        );


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


    return prohibitedPatterns.some(
        pattern =>
            pattern.test(text)
    );

}


/* =========================================
CALL GEMINI
========================================= */

async function researchWithGemini(
    candidates
) {

    if (!API_KEY) {

        throw new Error(
            "GEMINI_API_KEY is missing."
        );

    }


    const userInstruction =
        buildUserInstruction(
            candidates
        );


    const response =
        await fetch(

            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "x-goog-api-key":
                        API_KEY

                },

                body: JSON.stringify({

                    systemInstruction: {

                        parts: [
                            {
                                text:
                                    SYSTEM_INSTRUCTION
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
                                }

                            ]

                        }

                    ],


                    /*
                    GOOGLE SEARCH GROUNDING
                    */

                    tools: [

                        {
                            google_search: {}
                        }

                    ],


                    generationConfig: {

                        maxOutputTokens:
                            MAX_OUTPUT_TOKENS,

                        responseMimeType:
                            "application/json",

                        temperature:
                            0.2

                    }

                })

            }

        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            `Gemini API error ${response.status}: ${errorText}`
        );

    }


    const data =
        await response.json();


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
            JSON.stringify(
                data,
                null,
                2
            )
        );


        throw new Error(
            "Gemini returned no research text."
        );

    }


    let parsed;


    try {

        parsed =
            JSON.parse(
                rawText
            );

    }
    catch (error) {

        console.error(
            "RAW GEMINI RESPONSE:"
        );

        console.error(
            rawText
        );


        throw new Error(
            "Gemini returned invalid JSON."
        );

    }


    return parsed;

}


/* =========================================
MAIN
========================================= */

async function main() {

    console.log();
    console.log(
        "==================================="
    );
    console.log(
        "EDGEBREAK DAILY BRIEF AI"
    );
    console.log(
        "==================================="
    );
    console.log();


    /* =====================================
    LOAD CANDIDATES
    ===================================== */

    const rawCandidates =
        loadJson(
            INPUT_FILE
        );


    if (
        !Array.isArray(
            rawCandidates
        )
    ) {

        throw new Error(
            `${INPUT_FILE} must contain an array.`
        );

    }


    const candidates =
        prepareCandidates(
            rawCandidates
        );


    console.log(
        `Candidates loaded : ${candidates.length}`
    );


    if (
        candidates.length === 0
    ) {

        console.log(
            "No candidates to research."
        );

        saveJson(
            OUTPUT_FILE,
            {
                generatedAt:
                    new Date()
                        .toISOString(),

                companiesReviewed:
                    0,

                companiesIncluded:
                    0,

                results:
                    []
            }
        );

        return;

    }


    console.log(
        "Sending candidates to Gemini..."
    );

    console.log(
        "Google Search grounding enabled."
    );

    console.log();


    /* =====================================
    GEMINI RESEARCH
    ===================================== */

    const rawResult =
        await researchWithGemini(
            candidates
        );


    validateResult(
        rawResult
    );


    /* =====================================
    CLEAN OUTPUT
    ===================================== */

    const finalResult =
        cleanResults(
            rawResult,
            candidates.length
        );


    /* =====================================
    SAFETY
    ===================================== */

    if (
        containsUnsafeLanguage(
            finalResult
        )
    ) {

        throw new Error(
            "Gemini response blocked by Daily Brief safety filter."
        );

    }


    /* =====================================
    SAVE
    ===================================== */

    saveJson(
        OUTPUT_FILE,
        finalResult
    );


    /* =====================================
    TERMINAL RESULTS
    ===================================== */

    console.log(
        "==================================="
    );

    console.log(
        "DAILY BRIEF AI RESULTS"
    );

    console.log(
        "==================================="
    );

    console.log();


    console.log(
        `Companies reviewed : ${finalResult.companiesReviewed}`
    );

    console.log(
        `Companies included : ${finalResult.companiesIncluded}`
    );

    console.log();


    for (
        const company of
        finalResult.results
    ) {

        console.log(
            "-----------------------------------"
        );

        console.log(
            `${company.symbols.join("/")} | ${company.attentionLevel}`
        );

        console.log(
            company.companyName
        );

        console.log(
            company.headline
        );

        console.log();

    }


    console.log(
        "-----------------------------------"
    );

    console.log();

    console.log(
        `Saved results to ${OUTPUT_FILE}`
    );

    console.log();

}


/* =========================================
RUN
========================================= */

main()
    .catch(error => {

        console.error();
        console.error(
            "DAILY BRIEF AI FAILED"
        );

        console.error(
            error.message
        );

        console.error();

        process.exit(1);

    });