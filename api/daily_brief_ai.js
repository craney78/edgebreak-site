/* =========================================
EDGEBREAK — DAILY BRIEF AI RESEARCH
/api/daily_brief_ai.js
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
                    "Daily Brief research is temporarily unavailable."
            });

        }


        /* =====================================
        GET CANDIDATES
        ===================================== */

        const { candidates } =
            req.body || {};


        if (
            !Array.isArray(candidates) ||
            candidates.length === 0
        ) {

            return res.status(400).json({
                error:
                    "No Daily Brief candidates were provided."
            });

        }


        /* =====================================
        SIZE PROTECTION
        ===================================== */

        if (candidates.length > 150) {

            return res.status(400).json({
                error:
                    "Too many Daily Brief candidates were provided."
            });

        }


        /* =====================================
        CLEAN INPUT

        Only send Gemini the information it
        actually needs for company research.

        Scanner technical calculations are
        deliberately NOT sent.
        ===================================== */

        const cleanCandidates =
            candidates
                .filter(
                    stock =>
                        stock &&
                        stock.symbol
                )
                .map(stock => ({

                    symbol:
                        String(
                            stock.symbol
                        )
                            .trim()
                            .toUpperCase(),

                    scanners:
                        Array.isArray(
                            stock.scanners
                        )
                            ? stock.scanners
                                .map(
                                    scanner =>
                                        String(scanner)
                                            .trim()
                                )
                                .filter(Boolean)
                            : [],

                    company: {

                        name:
                            cleanField(
                                stock.company?.name,
                                200
                            ),

                        sector:
                            cleanField(
                                stock.company?.sector,
                                150
                            ),

                        industry:
                            cleanField(
                                stock.company?.industry,
                                150
                            )

                    }

                }));


        if (
            cleanCandidates.length === 0
        ) {

            return res.status(400).json({
                error:
                    "No valid Daily Brief candidates were provided."
            });

        }


        /* =====================================
        SYSTEM INSTRUCTION
        ===================================== */

        const systemInstruction = `

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

Inclusion is NOT an endorsement of the company.


DUPLICATE COMPANIES:

If multiple supplied ticker symbols represent different
share classes of the same company and are responding to the
same underlying development, research the company once and
combine the ticker symbols into one result.

For example, NWS and NWSA should normally appear as one
company result when the attention relates to the same
underlying development.


ATTENTION LEVEL:

Every included company must receive exactly one of:

HIGH
ELEVATED
NOTABLE

These labels describe CURRENT market attention or the
significance of a current company-specific development.

They are NOT investment ratings.

HIGH:

Use only for particularly significant or clearly unusual
current attention or a major current development.

ELEVATED:

Use when current attention or developments appear
meaningfully above what would normally be expected for that
company.

NOTABLE:

Use when there is a credible current development worth
investigating but attention does not appear unusually high.


IMPORTANT:

Do not force companies into the results.

Most supplied companies may be omitted.

Quality is more important than quantity.

Before including each company ask:

"If I ignored the stock chart and recent price performance,
would there STILL be a current factual reason that makes
this company noteworthy?"

If the answer is NO, omit the company.

Return JSON only.

`;


        /* =====================================
        USER INSTRUCTION
        ===================================== */

        const userInstruction = `

Research these NASDAQ companies for the EdgeBreak Daily
Brief.

Companies supplied:

${cleanCandidates.length}

These companies have ALREADY passed EdgeBreak's technical
scanners.

Do not perform another technical assessment.

Research CURRENT market attention and company-specific
developments using Google Search grounding.

Only include companies that genuinely satisfy the criteria
in the system instruction.


RETURN EXACTLY THIS JSON STRUCTURE:

{
    "companiesReviewed": ${cleanCandidates.length},
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


companiesReviewed

Must equal ${cleanCandidates.length}.


companiesIncluded

Must equal the number of objects in results.


symbols

Array of supplied ticker symbols.

Normally one ticker.

Combine share classes when appropriate.


companyName

Current company name.


scanners

Use the scanner labels supplied with the candidate.

If share classes are combined, combine scanner labels
without duplicates.


attentionLevel

Exactly one of:

HIGH
ELEVATED
NOTABLE


headline

A short factual headline describing the current reason for
attention.

No promotional language.

No prediction.


summary

One or two concise sentences explaining the current
situation.

This text may appear directly on the EdgeBreak Daily Brief.

No investment advice.


currentDevelopment

State the specific current event, catalyst, filing,
announcement, unusual activity or material development that
justifies inclusion.

Be factual and specific.


whyIncluded

Briefly explain why the CURRENT attention or development is
noteworthy enough for further research.

Technical chart quality must not be the primary reason.


developmentDate

Use YYYY-MM-DD when the date can reliably be established.

Otherwise return an empty string.


sourceNames

Return a short array of the principal credible sources that
support inclusion.

Do not invent sources.


FINAL TEST FOR EVERY RESULT:

Ignore the stock's chart and recent price performance.

Is there STILL a current factual reason for this company to
appear in the Daily Brief?

If NO:

OMIT IT.


CANDIDATES:

${JSON.stringify(
    cleanCandidates,
    null,
    2
)}

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
                                    }

                                ]

                            }

                        ],


                        /* =====================
                        GOOGLE SEARCH GROUNDING
                        ===================== */

                        tools: [

                            {
                                google_search: {}
                            }

                        ],


                        generationConfig: {

                            maxOutputTokens:
                                6000,

                            responseMimeType:
                                "application/json",

                            temperature:
                                0.2

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
                "Gemini Daily Brief Error:",
                geminiResponse.status,
                errorText
            );


            return res.status(500).json({
                error:
                    "Daily Brief research is temporarily unavailable."
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
                "Gemini returned no Daily Brief research:",
                JSON.stringify(
                    geminiData
                )
            );


            return res.status(500).json({
                error:
                    "No Daily Brief research was returned."
            });

        }


        /* =====================================
        PARSE JSON
        ===================================== */

        let research;


        try {

            research =
                JSON.parse(
                    rawText
                );

        }
        catch (error) {

            console.error(
                "Gemini Daily Brief JSON Parse Error:",
                error,
                rawText
            );


            return res.status(500).json({
                error:
                    "Daily Brief research could not be processed."
            });

        }


        /* =====================================
        VALIDATE RESULTS ARRAY
        ===================================== */

        if (
            !research ||
            !Array.isArray(
                research.results
            )
        ) {

            console.error(
                "Invalid Daily Brief structure:",
                research
            );


            return res.status(500).json({
                error:
                    "Daily Brief research returned an invalid result."
            });

        }


        /* =====================================
        CLEAN RESULTS
        ===================================== */

        const allowedLevels =
            new Set([
                "HIGH",
                "ELEVATED",
                "NOTABLE"
            ]);


        const cleanResults = [];


        for (
            const item of
            research.results
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
                    ? [
                        ...new Set(
                            item.symbols
                                .map(
                                    symbol =>
                                        String(symbol)
                                            .trim()
                                            .toUpperCase()
                                )
                                .filter(Boolean)
                        )
                    ]
                    : [];


            if (
                symbols.length === 0
            ) {

                continue;

            }


            /* =============================
            ONLY ALLOW SUPPLIED SYMBOLS
            ============================= */

            const suppliedSymbols =
                new Set(
                    cleanCandidates.map(
                        stock =>
                            stock.symbol
                    )
                );


            const validSymbols =
                symbols.filter(
                    symbol =>
                        suppliedSymbols.has(
                            symbol
                        )
                );


            if (
                validSymbols.length === 0
            ) {

                continue;

            }


            const attentionLevel =
                String(
                    item.attentionLevel ||
                    ""
                )
                    .trim()
                    .toUpperCase();


            if (
                !allowedLevels.has(
                    attentionLevel
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
                    650
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


            if (
                !headline ||
                !summary ||
                !currentDevelopment ||
                !whyIncluded
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
                                    scanner =>
                                        cleanField(
                                            scanner,
                                            80
                                        )
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
                                    source =>
                                        cleanField(
                                            source,
                                            150
                                        )
                                )
                                .filter(Boolean)
                        )
                    ]
                    : [];


            cleanResults.push({

                symbols:
                    validSymbols,

                companyName:
                    cleanField(
                        item.companyName,
                        200
                    ),

                scanners,

                attentionLevel,

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


        /* =====================================
        FINAL RESPONSE
        ===================================== */

        const finalResearch = {

            generatedAt:
                new Date()
                    .toISOString(),

            companiesReviewed:
                cleanCandidates.length,

            companiesIncluded:
                cleanResults.length,

            results:
                cleanResults

        };


        /* =====================================
        SERVER-SIDE SAFETY FILTER
        ===================================== */

        const combinedText =
            JSON.stringify(
                finalResearch
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


        const unsafe =
            prohibitedPatterns.some(
                pattern =>
                    pattern.test(
                        combinedText
                    )
            );


        if (unsafe) {

            console.error(
                "Gemini Daily Brief response blocked by safety filter."
            );


            return res.status(422).json({
                error:
                    "The Daily Brief research could not be displayed."
            });

        }


        /* =====================================
        SUCCESS
        ===================================== */

        return res
            .status(200)
            .json(
                finalResearch
            );


    }
    catch (error) {

        console.error(
            "Gemini Daily Brief Server Error:",
            error
        );


        return res.status(500).json({

            error:
                "Daily Brief research is temporarily unavailable."

        });

    }

}


/* =========================================
CLEAN OUTPUT
========================================= */

function cleanField(
    value,
    maxLength = 800
) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    return value
        .replace(/\s+/g, " ")
        .trim()
        .slice(
            0,
            maxLength
        );

}