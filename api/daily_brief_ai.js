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


    /* =====================================
    CHECK ENVIRONMENT VARIABLES
    ===================================== */

    if (!process.env.GEMINI_API_KEY) {

        return res.status(500).json({
            error:
                "Daily Brief AI is not configured."
        });

    }


    if (
        !process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_KEY
    ) {

        return res.status(500).json({
            error:
                "Daily Brief cache is not configured."
        });

    }


    try {

        /* =====================================
        US MARKET DATE
        ===================================== */

        const briefDate =
            getNewYorkDate();


        console.log(
            `EdgeBreak Daily Brief date: ${briefDate}`
        );


        /* =====================================
        CHECK SUPABASE CACHE FIRST
        ===================================== */

        const cacheUrl =
            `${process.env.SUPABASE_URL}` +
            `/rest/v1/daily_briefs` +
            `?brief_date=eq.${encodeURIComponent(briefDate)}` +
            `&status=eq.complete` +
            `&select=*` +
            `&limit=1`;


        const cacheResponse =
            await fetch(
                cacheUrl,
                {

                    method: "GET",

                    headers: {

                        "apikey":
                            process.env.SUPABASE_SERVICE_KEY,

                        "Authorization":
                            `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,

                        "Content-Type":
                            "application/json"

                    }

                }
            );


        if (cacheResponse.ok) {

            const cachedRows =
                await cacheResponse.json();


            if (
                Array.isArray(cachedRows) &&
                cachedRows.length > 0 &&
                cachedRows[0].ai_results
            ) {

                const row =
                    cachedRows[0];


                console.log(
                    `EdgeBreak Daily Brief CACHE HIT: ${briefDate}`
                );


                return res.status(200).json({

                    success: true,

                    cached: true,

                    briefDate:
                        row.brief_date,

                    generatedAt:
                        row.generated_at,

                    companiesReviewed:
                        row.companies_reviewed,

                    companiesIncluded:
                        row.companies_included,

                    results:
                        Array.isArray(
                            row.ai_results?.results
                        )
                            ? row.ai_results.results
                            : [],

                    nasdaqToday:
                        row.nasdaq_today || null,

                    marketConditions:
                        row.market_conditions || null,

                    scannerActivity:
                        row.scanner_activity || null

                });

            }

        }
        else {

            const cacheError =
                await cacheResponse.text();


            console.error(
                "Daily Brief Cache Read Error:",
                cacheError
            );

            /*
            Same behaviour as the existing
            EdgeBreak research cache:

            cache failure does not prevent
            the AI request from continuing.
            */

        }


        console.log(
            `EdgeBreak Daily Brief CACHE MISS: ${briefDate}`
        );


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


        if (candidates.length > 150) {

            return res.status(400).json({
                error:
                    "Too many Daily Brief candidates were provided."
            });

        }


        /* =====================================
        CLEAN INPUT
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

Do not favour a company simply because it is large, famous
or regularly covered by the media.

We are particularly interested in companies where CURRENT
attention or activity appears elevated, unusual or
meaningfully different from what would normally be expected
for that company.

Smaller and lesser-known companies are important.

A previously quiet company experiencing a sudden increase
in attention may be more relevant than a large company that
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

There must ALSO be credible evidence of at least one of:

- unusual or materially increased trading activity
- unusual or materially increased market or media attention
- a current company-specific catalyst
- significant company news
- a material corporate, financial, regulatory, clinical or
  strategic development

Price movement may support the reason for inclusion.

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

These describe CURRENT attention or the significance of a
current development.

They are NOT investment ratings.

HIGH:

Particularly significant or clearly unusual current
attention or a major current development.

ELEVATED:

Current attention or developments appear meaningfully above
what would normally be expected for that company.

NOTABLE:

There is a credible current development worth investigating,
but attention does not appear unusually high.


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
Brief dated ${briefDate}.

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


FIELD RULES:

companiesReviewed:
Must equal ${cleanCandidates.length}.

companiesIncluded:
Must equal the number of objects in results.

symbols:
Array of supplied ticker symbols.
Combine share classes when appropriate.

companyName:
Current company name.

scanners:
Use the supplied scanner labels.
Combine labels without duplicates when required.

attentionLevel:
Exactly HIGH, ELEVATED or NOTABLE.

headline:
Short factual headline explaining the current reason for
attention.

summary:
One or two concise factual sentences suitable for direct
display in the EdgeBreak Daily Brief.

currentDevelopment:
The specific current event, catalyst, filing, announcement,
unusual activity or material development justifying
inclusion.

whyIncluded:
Briefly explain why the CURRENT development or attention
warrants further research.

developmentDate:
Use YYYY-MM-DD when reliably established.
Otherwise return an empty string.

sourceNames:
Short array containing the principal credible sources
supporting inclusion.
Do not invent sources.


FINAL TEST FOR EVERY RESULT:

Ignore the stock's chart and recent price performance.

Is there STILL a current factual reason for this company to
appear in today's Daily Brief?

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
                            process.env.GEMINI_API_KEY

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
        GEMINI ERROR
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
        EXTRACT GEMINI OUTPUT
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
                "Daily Brief JSON Parse Error:",
                rawText
            );


            return res.status(500).json({
                error:
                    "Daily Brief research could not be processed."
            });

        }


        if (
            !research ||
            !Array.isArray(
                research.results
            )
        ) {

            return res.status(500).json({
                error:
                    "Daily Brief returned an invalid result."
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


        const suppliedSymbols =
            new Set(
                cleanCandidates.map(
                    stock =>
                        stock.symbol
                )
            );


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
                                .filter(
                                    symbol =>
                                        suppliedSymbols.has(
                                            symbol
                                        )
                                )
                        )
                    ]
                    : [];


            if (
                symbols.length === 0
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

                symbols,

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
        BUILD FINAL AI DATA
        ===================================== */

        const aiResults = {

            results:
                cleanResults

        };


        /* =====================================
        SERVER-SIDE SAFETY FILTER
        ===================================== */

        const combinedText =
            JSON.stringify(
                aiResults
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
                "Daily Brief blocked by safety filter."
            );


            return res.status(422).json({
                error:
                    "The Daily Brief research could not be displayed."
            });

        }


        /* =====================================
        SAVE TO SUPABASE

        Unique brief_date means there can only
        be one cached brief for the US market
        date.
        ===================================== */

        const generatedAt =
            new Date()
                .toISOString();


        const saveUrl =
            `${process.env.SUPABASE_URL}` +
            `/rest/v1/daily_briefs` +
            `?on_conflict=brief_date`;


        const saveResponse =
            await fetch(
                saveUrl,
                {

                    method: "POST",

                    headers: {

                        "apikey":
                            process.env.SUPABASE_SERVICE_KEY,

                        "Authorization":
                            `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "resolution=merge-duplicates,return=minimal"

                    },

                    body: JSON.stringify({

                        brief_date:
                            briefDate,

                        status:
                            "complete",

                        companies_reviewed:
                            cleanCandidates.length,

                        companies_included:
                            cleanResults.length,

                        ai_results:
                            aiResults,

                        generated_at:
                            generatedAt,

                        updated_at:
                            generatedAt

                    })

                }
            );


        if (!saveResponse.ok) {

            const saveError =
                await saveResponse.text();


            console.error(
                "Daily Brief Cache Save Error:",
                saveError
            );

            /*
            Same philosophy as the existing
            EdgeBreak AI cache.

            Gemini research succeeded, so a
            cache failure should not prevent
            this request returning the result.
            */

        }
        else {

            console.log(
                `EdgeBreak Daily Brief CACHE SAVED: ${briefDate}`
            );

        }


        /* =====================================
        SUCCESS
        ===================================== */

        return res.status(200).json({

            success: true,

            cached: false,

            briefDate,

            generatedAt,

            companiesReviewed:
                cleanCandidates.length,

            companiesIncluded:
                cleanResults.length,

            results:
                cleanResults,

            nasdaqToday:
                null,

            marketConditions:
                null,

            scannerActivity:
                null

        });


    }
    catch (error) {

        console.error(
            "EdgeBreak Daily Brief Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to generate today's Daily Brief."

        });

    }

}


/* =========================================
NEW YORK MARKET DATE
========================================= */

function getNewYorkDate() {

    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/New_York",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        )
            .formatToParts(
                new Date()
            );


    const values = {};


    for (const part of parts) {

        if (
            part.type !== "literal"
        ) {

            values[
                part.type
            ] = part.value;

        }

    }


    return (
        `${values.year}-` +
        `${values.month}-` +
        `${values.day}`
    );

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