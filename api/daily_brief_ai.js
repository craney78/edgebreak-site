/* =========================================
EDGEBREAK DAILY BRIEF AI
/api/daily_brief_ai.js

NEW ARCHITECTURE

STATUS:
Browser asks whether today's completed brief exists.

BATCH:
Browser sends ONE small batch.
Gemini researches only that batch.
Successful batch is immediately cached.

FINALIZE:
When all batches are complete, browser asks API
to combine cached batches into today's brief.

No single request researches the entire candidate list.
========================================= */


export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed."
        });

    }


    try {

        const action =
            String(
                req.body?.action || "status"
            ).trim();


        const briefDate =
            getNewYorkDate();


        console.log(
            `Daily Brief action: ${action} | ${briefDate}`
        );


        /* =====================================
        CHECK ENVIRONMENT
        ===================================== */

        if (
            !process.env.SUPABASE_URL ||
            !process.env.SUPABASE_SERVICE_KEY
        ) {

            return res.status(500).json({
                error:
                    "Daily Brief cache is not configured."
            });

        }


        /* =====================================
        STATUS
        ===================================== */

        if (action === "status") {

            const completeBrief =
                await getCompleteBrief(
                    briefDate
                );


            if (completeBrief) {

                console.log(
                    `Daily Brief COMPLETE CACHE HIT: ${briefDate}`
                );


                return res.status(200).json({

                    success: true,

                    complete: true,

                    cached: true,

                    briefDate:
                        completeBrief.brief_date,

                    generatedAt:
                        completeBrief.generated_at,

                    companiesReviewed:
                        completeBrief.companies_reviewed,

                    companiesIncluded:
                        completeBrief.companies_included,

                    results:
                        Array.isArray(
                            completeBrief.ai_results?.results
                        )
                            ? completeBrief.ai_results.results
                            : []

                });

            }


            const existingBatches =
                await getExistingBatches(
                    briefDate
                );


            return res.status(200).json({

                success: true,

                complete: false,

                cached: false,

                briefDate,

                completedBatches:
                    existingBatches.map(
                        row => row.batch_number
                    )

            });

        }


        /* =====================================
        RESEARCH ONE BATCH
        ===================================== */

        if (action === "batch") {

            if (!process.env.GEMINI_API_KEY) {

                return res.status(500).json({
                    error:
                        "Daily Brief AI is not configured."
                });

            }


            const batchNumber =
                Number(
                    req.body?.batchNumber
                );


            const totalBatches =
                Number(
                    req.body?.totalBatches
                );


            const candidates =
                Array.isArray(
                    req.body?.candidates
                )
                    ? req.body.candidates
                    : [];


            if (
                !Number.isInteger(batchNumber) ||
                batchNumber < 1
            ) {

                return res.status(400).json({
                    error:
                        "Invalid Daily Brief batch number."
                });

            }


            if (
                !Number.isInteger(totalBatches) ||
                totalBatches < 1
            ) {

                return res.status(400).json({
                    error:
                        "Invalid Daily Brief total batch count."
                });

            }


            /* =================================
            HARD LIMIT

            Browser will send five.
            Backend refuses anything excessive.
            ================================= */

            if (
                candidates.length === 0 ||
                candidates.length > 5
            ) {

                return res.status(400).json({
                    error:
                        "Daily Brief batches must contain 1 to 5 companies."
                });

            }


            /* =================================
            CHECK WHETHER THIS BATCH EXISTS
            ================================= */

            const cachedBatch =
                await getCachedBatch(
                    briefDate,
                    batchNumber
                );


            if (cachedBatch) {

                console.log(
                    `Daily Brief Batch ${batchNumber} CACHE HIT`
                );


                return res.status(200).json({

                    success: true,

                    cached: true,

                    briefDate,

                    batchNumber,

                    companiesReviewed:
                        cachedBatch.companies_reviewed,

                    companiesIncluded:
                        cachedBatch.companies_included,

                    results:
                        Array.isArray(
                            cachedBatch.ai_results?.results
                        )
                            ? cachedBatch.ai_results.results
                            : []

                });

            }


            /* =================================
            CLEAN CANDIDATES
            ================================= */

            const cleanCandidates =
                candidates
                    .filter(
                        stock =>
                            stock &&
                            stock.symbol
                    )
                    .map(
                        cleanCandidate
                    );


            if (
                cleanCandidates.length === 0
            ) {

                return res.status(400).json({
                    error:
                        "No valid companies were supplied."
                });

            }


            console.log(
                `Daily Brief Batch ${batchNumber}/${totalBatches}: researching ${cleanCandidates.length} companies`
            );


            /* =================================
            GEMINI

            ONE small request only.
            ================================= */

            const research =
                await researchBatch(
                    cleanCandidates,
                    briefDate,
                    batchNumber
                );


            const cleanedResults =
                cleanResearchResults(
                    research.results,
                    cleanCandidates
                );


            /* =================================
            SAVE IMMEDIATELY

            Once this succeeds, we never need
            Gemini for this batch again today.
            ================================= */

            await saveBatch({

                briefDate,

                batchNumber,

                totalBatches,

                companiesReviewed:
                    cleanCandidates.length,

                companiesIncluded:
                    cleanedResults.length,

                results:
                    cleanedResults

            });


            console.log(
                `Daily Brief Batch ${batchNumber} SAVED`
            );


            return res.status(200).json({

                success: true,

                cached: false,

                briefDate,

                batchNumber,

                companiesReviewed:
                    cleanCandidates.length,

                companiesIncluded:
                    cleanedResults.length,

                results:
                    cleanedResults

            });

        }


        /* =====================================
        FINALIZE
        ===================================== */

        if (action === "finalize") {

            const totalBatches =
                Number(
                    req.body?.totalBatches
                );


            const totalCandidates =
                Number(
                    req.body?.totalCandidates
                );


            if (
                !Number.isInteger(totalBatches) ||
                totalBatches < 1
            ) {

                return res.status(400).json({
                    error:
                        "Invalid Daily Brief batch count."
                });

            }


            const batches =
                await getExistingBatches(
                    briefDate
                );


            /* =================================
            REQUIRE EVERY BATCH

            We do NOT create an incomplete
            Daily Brief and pretend it is done.
            ================================= */

            const completedNumbers =
                new Set(
                    batches.map(
                        row =>
                            Number(
                                row.batch_number
                            )
                    )
                );


            const missingBatches = [];


            for (
                let i = 1;
                i <= totalBatches;
                i++
            ) {

                if (
                    !completedNumbers.has(i)
                ) {

                    missingBatches.push(i);

                }

            }


            if (
                missingBatches.length > 0
            ) {

                return res.status(409).json({

                    error:
                        "Daily Brief research is not yet complete.",

                    missingBatches

                });

            }


            /* =================================
            COMBINE RESULTS
            ================================= */

            const allResults =
                batches
                    .sort(
                        (a, b) =>
                            Number(a.batch_number) -
                            Number(b.batch_number)
                    )
                    .flatMap(
                        row =>
                            Array.isArray(
                                row.ai_results?.results
                            )
                                ? row.ai_results.results
                                : []
                    );


            const finalResults =
                deduplicateResults(
                    allResults
                );


            const companiesReviewed =
                Number.isFinite(
                    totalCandidates
                )
                    ? totalCandidates
                    : batches.reduce(
                        (total, row) =>
                            total +
                            Number(
                                row.companies_reviewed || 0
                            ),
                        0
                    );


            const generatedAt =
                new Date()
                    .toISOString();


            /* =================================
            SAFETY CHECK
            ================================= */

            if (
                containsProhibitedAdvice(
                    finalResults
                )
            ) {

                console.error(
                    "Daily Brief blocked by safety filter."
                );


                return res.status(422).json({
                    error:
                        "Today's Daily Brief could not be displayed."
                });

            }


            /* =================================
            SAVE FINAL BRIEF
            ================================= */

            await saveCompleteBrief({

                briefDate,

                generatedAt,

                companiesReviewed,

                companiesIncluded:
                    finalResults.length,

                results:
                    finalResults

            });


            console.log(
                `Daily Brief COMPLETE: ${briefDate}`
            );


            return res.status(200).json({

                success: true,

                complete: true,

                cached: false,

                briefDate,

                generatedAt,

                companiesReviewed,

                companiesIncluded:
                    finalResults.length,

                results:
                    finalResults

            });

        }


        return res.status(400).json({
            error:
                "Unknown Daily Brief action."
        });


    }
    catch (error) {

        console.error(
            "EdgeBreak Daily Brief Error:",
            error
        );


        return res.status(
            error?.status === 503
                ? 503
                : 500
        ).json({

            error:
                "Daily Brief research is temporarily unavailable."

        });

    }

}


/* =========================================
GEMINI — RESEARCH ONE SMALL BATCH
========================================= */

async function researchBatch(
    candidates,
    briefDate,
    batchNumber
) {

    const systemInstruction = `

You are the market-attention research engine for EdgeBreak.

You will receive a SMALL list of NASDAQ stocks that have
already passed EdgeBreak's technical scanners and initial
liquidity and industry filters.

DO NOT perform another technical scan.

DO NOT decide whether a stock is a good investment.

DO NOT provide buy, sell or hold recommendations.

DO NOT provide price targets, entry prices or predictions.

Your task is to determine which supplied companies currently
have noteworthy or unusual market attention, activity, news
or developments that may justify further research.

Use current Google Search grounding.

Do not favour a company because it is large or famous.

Smaller and lesser-known companies are important.

A previously quiet company experiencing unusual new attention
may be more relevant than a large company receiving normal
daily coverage.

LOOK FOR:

- unusual or increasing trading activity
- unusual recent trading volume
- breaking or recent company news
- earnings surprises
- material guidance changes
- significant contracts
- partnerships
- acquisitions
- strategic transactions
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

Strongest preference: last 7 days.

Up to 30 days may be considered when clearly relevant to
current attention.

IMPORTANT:

Do NOT include a company solely because its stock price moved,
its chart looks strong, it broke resistance, it has momentum,
or it is near a high.

EdgeBreak has already analysed technical structure.

There must be a separate factual current reason for inclusion.

Before including each company ask:

"If I completely ignored the stock chart and recent price
performance, would there STILL be a current factual reason
this company deserves further research?"

If NO, omit it.

ATTENTION LEVEL:

Every included company receives exactly one:

HIGH
ELEVATED
NOTABLE

These describe current attention.

They are NOT investment ratings.

Do not force companies into the results.

It is completely acceptable for results to be empty.

Return JSON only.

`;


    const prompt = `

Research these NASDAQ companies for the EdgeBreak Daily Brief
dated ${briefDate}.

Batch: ${batchNumber}

Companies:

${JSON.stringify(
    candidates,
    null,
    2
)}

Return exactly this JSON structure:

{
    "results": [
        {
            "symbols": ["TICKER"],
            "companyName": "",
            "scanners": [],
            "attentionLevel": "HIGH",
            "headline": "",
            "summary": "",
            "currentDevelopment": "",
            "whyIncluded": "",
            "developmentDate": "",
            "sourceNames": []
        }
    ]
}

Only use ticker symbols supplied above.

attentionLevel must be:

HIGH
ELEVATED
NOTABLE

headline:
Short factual headline.

summary:
One or two concise factual sentences.

currentDevelopment:
The specific current factual event or development.

whyIncluded:
Why the current development or unusual attention justifies
further investigation.

developmentDate:
YYYY-MM-DD where reliably known, otherwise "".

sourceNames:
Principal credible sources supporting inclusion.

Do not invent sources.

Return JSON only.

`;


    /* =====================================
    TIMEOUT GEMINI BEFORE VERCEL DOES

    Important:
    We would rather abandon ONE batch than
    leave Vercel hanging for five minutes.
    ===================================== */

    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            70000
        );


    let response;


    try {

        response =
            await fetch(

                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",

                {

                    method: "POST",

                    signal:
                        controller.signal,

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            process.env.GEMINI_API_KEY

                    },

                    body:
                        JSON.stringify({

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
                                                prompt
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

                                temperature:
                                    0.1,

                                maxOutputTokens:
                                    1600,

                                responseMimeType:
                                    "application/json"

                            }

                        })

                }

            );

    }
    catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            const timeoutError =
                new Error(
                    `Daily Brief Batch ${batchNumber} timed out.`
                );


            timeoutError.status = 503;

            throw timeoutError;

        }


        throw error;

    }
    finally {

        clearTimeout(
            timeout
        );

    }


    if (!response.ok) {

        const errorText =
            await response.text();


        console.error(
            `Gemini Daily Brief Batch ${batchNumber}:`,
            response.status,
            errorText
        );


        const geminiError =
            new Error(
                `Gemini returned HTTP ${response.status}.`
            );


        geminiError.status =
            response.status;


        throw geminiError;

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
            `Daily Brief Batch ${batchNumber}: Gemini returned no text.`
        );


        const noTextError =
            new Error(
                "Gemini returned no research."
            );


        noTextError.status = 503;

        throw noTextError;

    }


    let parsed;


    try {

        parsed =
            JSON.parse(
                cleanJsonText(
                    rawText
                )
            );

    }
    catch (error) {

        console.error(
            `Daily Brief Batch ${batchNumber} invalid JSON:`,
            rawText
        );


        const jsonError =
            new Error(
                "Gemini returned invalid JSON."
            );


        jsonError.status = 503;

        throw jsonError;

    }


    if (
        !Array.isArray(
            parsed?.results
        )
    ) {

        const invalidError =
            new Error(
                "Gemini returned an invalid Daily Brief result."
            );


        invalidError.status = 503;

        throw invalidError;

    }


    return parsed;

}


/* =========================================
SUPABASE — COMPLETE BRIEF
========================================= */

async function getCompleteBrief(
    briefDate
) {

    const url =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_briefs` +
        `?brief_date=eq.${encodeURIComponent(briefDate)}` +
        `&status=eq.complete` +
        `&select=*` +
        `&limit=1`;


    const response =
        await supabaseFetch(
            url,
            {
                method: "GET"
            }
        );


    if (!response.ok) {

        console.error(
            "Daily Brief complete cache read failed:",
            await response.text()
        );

        return null;

    }


    const rows =
        await response.json();


    return (
        Array.isArray(rows) &&
        rows.length
    )
        ? rows[0]
        : null;

}


/* =========================================
SUPABASE — EXISTING BATCHES
========================================= */

async function getExistingBatches(
    briefDate
) {

    const url =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_brief_batches` +
        `?brief_date=eq.${encodeURIComponent(briefDate)}` +
        `&status=eq.complete` +
        `&select=*` +
        `&order=batch_number.asc`;


    const response =
        await supabaseFetch(
            url,
            {
                method: "GET"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Unable to read Daily Brief batches."
        );

    }


    const rows =
        await response.json();


    return Array.isArray(rows)
        ? rows
        : [];

}


/* =========================================
SUPABASE — ONE BATCH
========================================= */

async function getCachedBatch(
    briefDate,
    batchNumber
) {

    const url =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_brief_batches` +
        `?brief_date=eq.${encodeURIComponent(briefDate)}` +
        `&batch_number=eq.${batchNumber}` +
        `&status=eq.complete` +
        `&select=*` +
        `&limit=1`;


    const response =
        await supabaseFetch(
            url,
            {
                method: "GET"
            }
        );


    if (!response.ok) {

        return null;

    }


    const rows =
        await response.json();


    return (
        Array.isArray(rows) &&
        rows.length
    )
        ? rows[0]
        : null;

}


/* =========================================
SAVE ONE BATCH
========================================= */

async function saveBatch({

    briefDate,
    batchNumber,
    totalBatches,
    companiesReviewed,
    companiesIncluded,
    results

}) {

    const now =
        new Date()
            .toISOString();


    const url =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_brief_batches` +
        `?on_conflict=brief_date,batch_number`;


    const response =
        await supabaseFetch(
            url,
            {

                method: "POST",

                headers: {

                    "Prefer":
                        "resolution=merge-duplicates,return=minimal"

                },

                body:
                    JSON.stringify({

                        brief_date:
                            briefDate,

                        batch_number:
                            batchNumber,

                        total_batches:
                            totalBatches,

                        status:
                            "complete",

                        companies_reviewed:
                            companiesReviewed,

                        companies_included:
                            companiesIncluded,

                        ai_results: {
                            results
                        },

                        generated_at:
                            now,

                        updated_at:
                            now

                    })

            }
        );


    if (!response.ok) {

        const text =
            await response.text();


        console.error(
            "Daily Brief batch save failed:",
            text
        );


        throw new Error(
            "Daily Brief batch could not be cached."
        );

    }

}


/* =========================================
SAVE COMPLETE DAILY BRIEF
========================================= */

async function saveCompleteBrief({

    briefDate,
    generatedAt,
    companiesReviewed,
    companiesIncluded,
    results

}) {

    const url =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_briefs` +
        `?on_conflict=brief_date`;


    const response =
        await supabaseFetch(
            url,
            {

                method: "POST",

                headers: {

                    "Prefer":
                        "resolution=merge-duplicates,return=minimal"

                },

                body:
                    JSON.stringify({

                        brief_date:
                            briefDate,

                        status:
                            "complete",

                        companies_reviewed:
                            companiesReviewed,

                        companies_included:
                            companiesIncluded,

                        ai_results: {
                            results
                        },

                        generated_at:
                            generatedAt,

                        updated_at:
                            generatedAt

                    })

            }
        );


    if (!response.ok) {

        console.error(
            "Daily Brief final cache save failed:",
            await response.text()
        );


        throw new Error(
            "Daily Brief could not be finalized."
        );

    }

}


/* =========================================
SUPABASE FETCH
========================================= */

function supabaseFetch(
    url,
    options = {}
) {

    return fetch(
        url,
        {

            ...options,

            headers: {

                "apikey":
                    process.env.SUPABASE_SERVICE_KEY,

                "Authorization":
                    `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,

                "Content-Type":
                    "application/json",

                ...(options.headers || {})

            }

        }
    );

}


/* =========================================
CLEAN CANDIDATE
========================================= */

function cleanCandidate(
    stock
) {

    return {

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
                            cleanField(
                                scanner,
                                80
                            )
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

    };

}


/* =========================================
CLEAN AI RESULTS
========================================= */

function cleanResearchResults(
    results,
    candidates
) {

    if (
        !Array.isArray(results)
    ) {

        return [];

    }


    const supplied =
        new Set(
            candidates.map(
                candidate =>
                    candidate.symbol
            )
        );


    const allowedAttention =
        new Set([
            "HIGH",
            "ELEVATED",
            "NOTABLE"
        ]);


    return results
        .map(item => {

            const symbols =
                Array.isArray(
                    item?.symbols
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
                                        supplied.has(symbol)
                                )
                        )
                    ]
                    : [];


            const attentionLevel =
                String(
                    item?.attentionLevel || ""
                )
                    .trim()
                    .toUpperCase();


            if (
                symbols.length === 0 ||
                !allowedAttention.has(
                    attentionLevel
                )
            ) {

                return null;

            }


            return {

                symbols,

                companyName:
                    cleanField(
                        item.companyName,
                        200
                    ),

                scanners:
                    Array.isArray(
                        item.scanners
                    )
                        ? item.scanners
                            .map(
                                value =>
                                    cleanField(
                                        value,
                                        80
                                    )
                            )
                            .filter(Boolean)
                        : [],

                attentionLevel,

                headline:
                    cleanField(
                        item.headline,
                        250
                    ),

                summary:
                    cleanField(
                        item.summary,
                        700
                    ),

                currentDevelopment:
                    cleanField(
                        item.currentDevelopment,
                        1000
                    ),

                whyIncluded:
                    cleanField(
                        item.whyIncluded,
                        800
                    ),

                developmentDate:
                    cleanField(
                        item.developmentDate,
                        40
                    ),

                sourceNames:
                    Array.isArray(
                        item.sourceNames
                    )
                        ? item.sourceNames
                            .map(
                                value =>
                                    cleanField(
                                        value,
                                        150
                                    )
                            )
                            .filter(Boolean)
                        : []

            };

        })
        .filter(Boolean);

}


/* =========================================
DEDUPLICATE
========================================= */

function deduplicateResults(
    results
) {

    const seen =
        new Set();


    return results.filter(
        item => {

            const key =
                Array.isArray(
                    item.symbols
                )
                    ? item.symbols
                        .slice()
                        .sort()
                        .join("|")
                    : "";


            if (
                !key ||
                seen.has(key)
            ) {

                return false;

            }


            seen.add(key);

            return true;

        }
    );

}


/* =========================================
SAFETY FILTER
========================================= */

function containsProhibitedAdvice(
    results
) {

    const text =
        JSON.stringify(
            results
        );


    const patterns = [

        /\bstrong buy\b/i,
        /\bstrong sell\b/i,
        /\byou should buy\b/i,
        /\byou should sell\b/i,
        /\byou should hold\b/i,
        /\bbuy opportunity\b/i,
        /\bsell opportunity\b/i,
        /\bprice target\b/i,
        /\btarget price\b/i,
        /\bexpected return\b/i,
        /\bguaranteed profit\b/i

    ];


    return patterns.some(
        pattern =>
            pattern.test(text)
    );

}


/* =========================================
CLEAN POSSIBLE JSON WRAPPER
========================================= */

function cleanJsonText(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /^```json\s*/i,
            ""
        )
        .replace(
            /^```\s*/i,
            ""
        )
        .replace(
            /```\s*$/i,
            ""
        )
        .trim();

}


/* =========================================
NEW YORK DATE
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


    parts.forEach(
        part => {

            if (
                part.type !==
                "literal"
            ) {

                values[
                    part.type
                ] = part.value;

            }

        }
    );


    return (
        `${values.year}-` +
        `${values.month}-` +
        `${values.day}`
    );

}


/* =========================================
CLEAN FIELD
========================================= */

function cleanField(
    value,
    maxLength = 800
) {

    if (
        typeof value !==
        "string"
    ) {

        return "";

    }


    return value
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .slice(
            0,
            maxLength
        );

}