/* =========================================
EDGEBREAK — DAILY BRIEF AI RESEARCH
/api/daily_brief_ai.js

FLOW:
1. Check Supabase cache
2. Clean candidates
3. Split candidates into batches of max 20
4. Research each batch sequentially
5. Short pause between batches
6. Recover valid Gemini results if outer JSON is malformed
7. Combine + validate + deduplicate
8. Save ONE Daily Brief to Supabase

RELIABILITY:
- Maximum 20 companies per Gemini batch
- Batches run sequentially, NOT in parallel
- 3 Gemini attempts per batch
- Retry waits increase after temporary errors
- Retries 429 / 500 / 502 / 503 / 504
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
    ENVIRONMENT VARIABLES
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

        const cachedBrief =
            await getCachedBrief(
                briefDate
            );


        if (cachedBrief) {

            console.log(
                `EdgeBreak Daily Brief CACHE HIT: ${briefDate}`
            );


            return res.status(200).json({

                success: true,

                cached: true,

                briefDate:
                    cachedBrief.brief_date,

                generatedAt:
                    cachedBrief.generated_at,

                companiesReviewed:
                    cachedBrief.companies_reviewed,

                companiesIncluded:
                    cachedBrief.companies_included,

                results:
                    Array.isArray(
                        cachedBrief.ai_results?.results
                    )
                        ? cachedBrief.ai_results.results
                        : [],

                nasdaqToday:
                    cachedBrief.nasdaq_today || null,

                marketConditions:
                    cachedBrief.market_conditions || null,

                scannerActivity:
                    cachedBrief.scanner_activity || null

            });

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
        SPLIT INTO MAXIMUM 20-COMPANY BATCHES

        Examples:

        20 stocks
        = 20

        39 stocks
        = 20 + 19

        67 stocks
        = 20 + 20 + 20 + 7

        99 stocks
        = 20 + 20 + 20 + 20 + 19
        ===================================== */

        const BATCH_SIZE = 20;

        const batches = [];


        for (
            let i = 0;
            i < cleanCandidates.length;
            i += BATCH_SIZE
        ) {

            batches.push(
                cleanCandidates.slice(
                    i,
                    i + BATCH_SIZE
                )
            );

        }


        console.log(
            `Daily Brief candidates: ${cleanCandidates.length}`
        );


        console.log(
            `Daily Brief batches required: ${batches.length}`
        );


        batches.forEach(
            (batch, index) => {

                console.log(
                    `Daily Brief Batch ${index + 1}: ${batch.length} companies`
                );

            }
        );


        /* =====================================
        RESEARCH BATCHES SEQUENTIALLY

        IMPORTANT:

        We deliberately DO NOT use Promise.all().

        Google-grounded Gemini requests are
        processed one batch at a time.

        Each batch contains a maximum of
        20 companies.

        After one batch finishes, EdgeBreak
        waits briefly before starting the next.
        ===================================== */

        const batchResearch = [];


        for (
            let index = 0;
            index < batches.length;
            index++
        ) {

            const batch =
                batches[index];


            const batchNumber =
                index + 1;


            console.log(
                `Daily Brief starting Batch ${batchNumber}/${batches.length}...`
            );


            const research =
                await researchBatch(
                    batch,
                    briefDate,
                    batchNumber
                );


            batchResearch.push(
                research
            );


            console.log(
                `Daily Brief Batch ${batchNumber}/${batches.length} finished.`
            );


            /* =================================
            SHORT PAUSE BEFORE NEXT BATCH
            ================================= */

            const hasAnotherBatch =
                index <
                batches.length - 1;


            if (hasAnotherBatch) {

                console.log(
                    `Daily Brief waiting 3 seconds before Batch ${batchNumber + 1}...`
                );


                await sleep(
                    3000
                );

            }

        }


        /* =====================================
        COMBINE RAW RESULTS
        ===================================== */

        const combinedRawResults =
            batchResearch.flatMap(
                research =>
                    Array.isArray(
                        research?.results
                    )
                        ? research.results
                        : []
            );


        console.log(
            `Daily Brief raw results returned: ${combinedRawResults.length}`
        );


        /* =====================================
        CLEAN + VALIDATE RESULTS
        ===================================== */

        const cleanResults =
            cleanResearchResults(
                combinedRawResults,
                cleanCandidates
            );


        /* =====================================
        DEDUPLICATE
        ===================================== */

        const deduplicatedResults =
            deduplicateResults(
                cleanResults
            );


        console.log(
            `Daily Brief companies qualified before cap: ${deduplicatedResults.length}`
        );


        /* =====================================
        RANK + CAP FINAL RESULTS

        HIGH first
        ELEVATED second
        NOTABLE third

        12 is a MAXIMUM only.
        If fewer than 12 qualify, keep them all.
        ===================================== */

        const attentionPriority = {

            HIGH: 3,
            ELEVATED: 2,
            NOTABLE: 1

        };


        const rankedResults =
            [...deduplicatedResults]
                .sort(
                    (a, b) =>
                        (
                            attentionPriority[b.attentionLevel] || 0
                        ) -
                        (
                            attentionPriority[a.attentionLevel] || 0
                        )
                );


        const finalResults =
            rankedResults.slice(
                0,
                12
            );


        console.log(
            `Daily Brief final companies included after 12-stock cap: ${finalResults.length}`
        );


        /* =====================================
        BUILD FINAL AI DATA
        ===================================== */

        const aiResults = {

            results:
                finalResults

        };


        /* =====================================
        SERVER-SIDE SAFETY FILTER

        EdgeBreak may report factual financial
        information, including analyst actions,
        ratings and price targets.

        Block only language where the generated
        research itself gives investment advice,
        a trading instruction, or promises a
        financial result.
        ===================================== */

        const combinedText =
            JSON.stringify(
                aiResults
            );


        const prohibitedPatterns = [

            /* DIRECT BUY / SELL / HOLD ADVICE */

            /\byou should buy\b/i,
            /\byou should sell\b/i,
            /\byou should hold\b/i,

            /\binvestors should buy\b/i,
            /\binvestors should sell\b/i,
            /\binvestors should hold\b/i,

            /\bwe recommend buying\b/i,
            /\bwe recommend selling\b/i,
            /\bwe recommend holding\b/i,

            /\bthis stock is a strong buy\b/i,
            /\bthis stock is a strong sell\b/i,

            /\bthis is a buy opportunity\b/i,
            /\bthis is a sell opportunity\b/i,


            /* DIRECT TRADING INSTRUCTIONS */

            /\byou should enter\b/i,
            /\byou should exit\b/i,

            /\binvestors should enter\b/i,
            /\binvestors should exit\b/i,

            /\bbuy this stock\b/i,
            /\bsell this stock\b/i,


            /* PROMISED / GUARANTEED RESULTS */

            /\bguaranteed return\b/i,
            /\bguaranteed profit\b/i,
            /\bguaranteed gain\b/i,

            /\bwill definitely rise\b/i,
            /\bwill definitely increase\b/i,
            /\bwill definitely gain\b/i,

            /\bguaranteed to rise\b/i,
            /\bguaranteed to increase\b/i,

            /\brisk[- ]free return\b/i,
            /\brisk[- ]free profit\b/i

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
                "Daily Brief blocked by safety filter: direct advice or promised result detected."
            );


            return res.status(422).json({
                error:
                    "The Daily Brief research could not be displayed."
            });

        }


        /* =====================================
        SAVE ONE COMPLETED BRIEF
        ===================================== */

        const generatedAt =
            new Date()
                .toISOString();


        await saveDailyBrief({

            briefDate,

            generatedAt,

            companiesReviewed:
                cleanCandidates.length,

            companiesIncluded:
                finalResults.length,

            aiResults

        });


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
                finalResults.length,

            results:
                finalResults,

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
                "Daily Brief research is temporarily unavailable."

        });

    }

}


/* =========================================
RESEARCH ONE BATCH
========================================= */

async function researchBatch(
    candidates,
    briefDate,
    batchNumber
) {

    console.log(
        `Daily Brief Batch ${batchNumber} research starting...`
    );


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
combine the ticker symbols into one result when those
symbols are supplied in this batch.


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

Research this group of NASDAQ companies for the EdgeBreak
Daily Brief dated ${briefDate}.

This is research batch ${batchNumber}.

Companies supplied in this batch:

${candidates.length}

These companies have ALREADY passed EdgeBreak's technical
scanners.

Do not perform another technical assessment.

Research CURRENT market attention and company-specific
developments using Google Search grounding.

Only include companies that genuinely satisfy the criteria
in the system instruction.


RETURN EXACTLY THIS JSON STRUCTURE:

{
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


FIELD RULES:

companiesReviewed:
Must equal ${candidates.length}.

companiesIncluded:
Must equal the number of objects in results.

symbols:
Array of supplied ticker symbols.

Do not return ticker symbols that were not supplied.

companyName:
Current company name.

scanners:
Use the scanner labels supplied with the candidate.

attentionLevel:
Exactly one of:

HIGH
ELEVATED
NOTABLE

headline:
Short factual headline describing the current reason for
attention.

No promotional language.

No prediction.

summary:
One or two concise factual sentences explaining the current
situation.

This may appear directly in the EdgeBreak Daily Brief.

No investment advice.

currentDevelopment:
State the specific current event, catalyst, filing,
announcement, unusual activity or material development that
justifies inclusion.

whyIncluded:
Briefly explain why the CURRENT attention or development is
noteworthy enough for further research.

Technical chart quality must not be the primary reason.

developmentDate:
Use YYYY-MM-DD when the date can reliably be established.

Otherwise return an empty string.

sourceNames:
Return a short array of the principal credible sources that
support inclusion.

Do not invent sources.


FINAL TEST FOR EVERY RESULT:

Ignore the stock's chart and recent price performance.

Is there STILL a current factual reason for this company to
appear in today's Daily Brief?

If NO:

OMIT IT.


CANDIDATES:

${JSON.stringify(
    candidates,
    null,
    2
)}

Return JSON only.

`;


    /* =====================================
    GEMINI REQUEST BODY
    ===================================== */

    const requestBody = {

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
                16000,

            responseMimeType:
                "application/json",

            temperature:
                0.2

        }

    };


    /* =====================================
    GEMINI REQUEST

    RETRY POLICY:

    Attempt 1
        ↓ temporary error
    wait 8 seconds

    Attempt 2
        ↓ temporary error
    wait 15 seconds

    Attempt 3

    Temporary errors:
    429
    500
    502
    503
    504
    ===================================== */

    let geminiResponse = null;

    const maxAttempts = 3;

    const retryableStatuses =
        new Set([
            429,
            500,
            502,
            503,
            504
        ]);


    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        console.log(
            `Daily Brief Batch ${batchNumber} Gemini attempt ${attempt}/${maxAttempts}`
        );


        try {

            geminiResponse =
                await fetch(

                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                process.env.GEMINI_API_KEY

                        },

                        body:
                            JSON.stringify(
                                requestBody
                            )

                    }

                );

        }
        catch (fetchError) {

            console.error(
                `Gemini Daily Brief Batch ${batchNumber} network error on attempt ${attempt}:`,
                fetchError
            );


            if (
                attempt < maxAttempts
            ) {

                const delay =
                    attempt === 1
                        ? 8000
                        : 15000;


                console.log(
                    `Daily Brief Batch ${batchNumber} retrying after network error in ${delay / 1000} seconds...`
                );


                await sleep(
                    delay
                );


                continue;

            }


            throw fetchError;

        }


        /* =================================
        SUCCESS
        ================================= */

        if (
            geminiResponse.ok
        ) {

            console.log(
                `Daily Brief Batch ${batchNumber} Gemini request succeeded on attempt ${attempt}.`
            );


            break;

        }


        /* =================================
        READ GEMINI ERROR
        ================================= */

        const errorText =
            await geminiResponse.text();


        console.error(
            `Gemini Daily Brief Batch ${batchNumber} Error on attempt ${attempt}:`,
            geminiResponse.status,
            errorText
        );


        /* =================================
        RETRY TEMPORARY ERRORS
        ================================= */

        const canRetry =
            retryableStatuses.has(
                geminiResponse.status
            ) &&
            attempt < maxAttempts;


        if (canRetry) {

            const delay =
                attempt === 1
                    ? 8000
                    : 15000;


            console.log(
                `Daily Brief Batch ${batchNumber} received temporary Gemini ${geminiResponse.status}. Retrying in ${delay / 1000} seconds...`
            );


            await sleep(
                delay
            );


            continue;

        }


        /* =================================
        NO MORE RETRIES
        ================================= */

        throw new Error(
            `Daily Brief batch ${batchNumber} failed. Gemini returned ${geminiResponse.status}.`
        );

    }


    /* =====================================
    FINAL RESPONSE CHECK
    ===================================== */

    if (
        !geminiResponse ||
        !geminiResponse.ok
    ) {

        throw new Error(
            `Daily Brief batch ${batchNumber} failed.`
        );

    }


    const geminiData =
        await geminiResponse.json();


    /* =====================================
    EXTRACT OUTPUT
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
            `Gemini Daily Brief Batch ${batchNumber} returned no text.`
        );


        throw new Error(
            `Daily Brief batch ${batchNumber} returned no research.`
        );

    }


    /* =====================================
    PARSE / RECOVER JSON
    ===================================== */

    let research;


    try {

        research =
            JSON.parse(
                rawText
            );

    }
    catch (error) {

        console.warn(
            `Daily Brief Batch ${batchNumber} normal JSON parse failed. Attempting recovery...`
        );


        const recoveredResults =
            recoverGeminiResults(
                rawText
            );


        if (
            recoveredResults.length === 0
        ) {

            console.error(
                `Daily Brief Batch ${batchNumber} JSON recovery failed.`
            );


            console.error(
                rawText
            );


            throw new Error(
                `Daily Brief batch ${batchNumber} returned invalid JSON.`
            );

        }


        console.log(
            `Daily Brief Batch ${batchNumber} recovered ` +
            `${recoveredResults.length} complete results.`
        );


        research = {

            companiesReviewed:
                candidates.length,

            companiesIncluded:
                recoveredResults.length,

            results:
                recoveredResults

        };

    }


    if (
        !research ||
        !Array.isArray(
            research.results
        )
    ) {

        throw new Error(
            `Daily Brief batch ${batchNumber} returned an invalid result.`
        );

    }


    console.log(
        `Daily Brief Batch ${batchNumber} complete: ` +
        `${research.results.length} included`
    );


    return research;

}


/* =========================================
RECOVER GEMINI RESULT OBJECTS

Used only when Gemini's complete response
cannot be parsed normally.

Find the "results" array and recover each
complete JSON object independently.

If the final object is truncated, the
complete earlier objects are preserved.
========================================= */

function recoverGeminiResults(
    rawText
) {

    if (
        typeof rawText !== "string" ||
        !rawText.trim()
    ) {

        return [];

    }


    /* =====================================
    FIND RESULTS ARRAY
    ===================================== */

    const resultsKeyIndex =
        rawText.indexOf(
            '"results"'
        );


    if (
        resultsKeyIndex === -1
    ) {

        return [];

    }


    const arrayStart =
        rawText.indexOf(
            "[",
            resultsKeyIndex
        );


    if (
        arrayStart === -1
    ) {

        return [];

    }


    const recovered =
        [];


    let objectStart =
        -1;

    let braceDepth =
        0;

    let insideString =
        false;

    let escaping =
        false;


    /* =====================================
    WALK THROUGH RESULTS ARRAY
    ===================================== */

    for (
        let i = arrayStart + 1;
        i < rawText.length;
        i++
    ) {

        const char =
            rawText[i];


        /* =================================
        CURRENTLY INSIDE STRING
        ================================= */

        if (
            insideString
        ) {

            if (
                escaping
            ) {

                escaping =
                    false;

                continue;

            }


            if (
                char === "\\"
            ) {

                escaping =
                    true;

                continue;

            }


            if (
                char === '"'
            ) {

                insideString =
                    false;

            }


            continue;

        }


        /* =================================
        STRING START
        ================================= */

        if (
            char === '"'
        ) {

            insideString =
                true;

            continue;

        }


        /* =================================
        OBJECT START
        ================================= */

        if (
            char === "{"
        ) {

            if (
                braceDepth === 0
            ) {

                objectStart =
                    i;

            }


            braceDepth++;

            continue;

        }


        /* =================================
        OBJECT END
        ================================= */

        if (
            char === "}"
        ) {

            if (
                braceDepth > 0
            ) {

                braceDepth--;

            }


            if (
                braceDepth === 0 &&
                objectStart !== -1
            ) {

                const objectText =
                    rawText.slice(
                        objectStart,
                        i + 1
                    );


                try {

                    const parsedObject =
                        JSON.parse(
                            objectText
                        );


                    if (
                        parsedObject &&
                        typeof parsedObject ===
                            "object" &&
                        !Array.isArray(
                            parsedObject
                        )
                    ) {

                        recovered.push(
                            parsedObject
                        );

                    }

                }
                catch (objectError) {

                    console.warn(
                        "Skipped one malformed Daily Brief result object during recovery."
                    );

                }


                objectStart =
                    -1;

            }

        }

    }


    return recovered;

}


/* =========================================
CLEAN + VALIDATE RESEARCH RESULTS
========================================= */

function cleanResearchResults(
    rawResults,
    cleanCandidates
) {

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
        rawResults
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


    return cleanResults;

}


/* =========================================
DEDUPLICATE RESULTS
========================================= */

function deduplicateResults(
    results
) {

    const seenSymbols =
        new Set();


    const finalResults = [];


    for (
        const result of
        results
    ) {

        const newSymbols =
            result.symbols.filter(
                symbol =>
                    !seenSymbols.has(
                        symbol
                    )
            );


        if (
            newSymbols.length === 0
        ) {

            continue;

        }


        newSymbols.forEach(
            symbol =>
                seenSymbols.add(
                    symbol
                )
        );


        finalResults.push({

            ...result,

            symbols:
                newSymbols

        });

    }


    return finalResults;

}


/* =========================================
GET CACHED DAILY BRIEF
========================================= */

async function getCachedBrief(
    briefDate
) {

    const cacheUrl =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_briefs` +
        `?brief_date=eq.${encodeURIComponent(briefDate)}` +
        `&status=eq.complete` +
        `&select=*` +
        `&limit=1`;


    try {

        const response =
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


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "Daily Brief Cache Read Error:",
                errorText
            );


            return null;

        }


        const rows =
            await response.json();


        if (
            Array.isArray(rows) &&
            rows.length > 0 &&
            rows[0].ai_results
        ) {

            return rows[0];

        }


        return null;

    }
    catch (error) {

        console.error(
            "Daily Brief Cache Read Error:",
            error
        );


        return null;

    }

}


/* =========================================
SAVE DAILY BRIEF
========================================= */

async function saveDailyBrief({

    briefDate,

    generatedAt,

    companiesReviewed,

    companiesIncluded,

    aiResults

}) {

    const saveUrl =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_briefs` +
        `?on_conflict=brief_date`;


    try {

        const response =
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
                            companiesReviewed,

                        companies_included:
                            companiesIncluded,

                        ai_results:
                            aiResults,

                        generated_at:
                            generatedAt,

                        updated_at:
                            generatedAt

                    })

                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "Daily Brief Cache Save Error:",
                errorText
            );


            /*
            AI research succeeded.

            Do not fail the user request just
            because caching failed.
            */

            return false;

        }


        console.log(
            `EdgeBreak Daily Brief CACHE SAVED: ${briefDate}`
        );


        return true;

    }
    catch (error) {

        console.error(
            "Daily Brief Cache Save Error:",
            error
        );


        return false;

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


    for (
        const part of
        parts
    ) {

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
SLEEP / DELAY
========================================= */

function sleep(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
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