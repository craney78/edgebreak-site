// ============================================================
// EDGEBREAK DAILY BRIEF AI
// ============================================================
//
// PURPOSE:
//
// EdgeBreak has already:
//
// 1. Scanned the NASDAQ
// 2. Culled unsuitable stocks
// 3. Ranked technical structure
// 4. Applied FINRA X-Factor analysis
// 5. Checked multi-venue institutional-style activity
// 6. Locked the final top six
// 7. Applied the Pressure Building Index
//
// Gemini does NOT research, select, remove or rerank stocks.
//
// Gemini only converts EdgeBreak's supplied evidence into
// a short, consistent, plain-English report.
//
// If Gemini fails or times out, EdgeBreak creates a report
// directly from the supplied data so all six still appear.
//
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const BATCH_SIZE = 3;

const TOP_DAILY_BRIEF_CANDIDATES = 6;

// Two batches of three.
// Each batch receives one attempt only.
const GEMINI_TIMEOUT_MS = 32000;

// Keeps the complete endpoint comfortably below the
// normal Vercel execution window.
const MAX_FUNCTION_TIME_MS = 90000;

const FUNCTION_SAFETY_MARGIN_MS = 10000;

const RESEARCH_PROMPT_VERSION =
    "edgebreak-top6-data-writer-v1";


// ============================================================
// MAIN HANDLER
// ============================================================

export default async function handler(
    req,
    res
) {

    res.setHeader(
        "Cache-Control",
        "no-store"
    );


    if (
        req.method !==
        "POST"
    ) {

        return res
            .status(405)
            .json({
                error:
                    "Method not allowed."
            });

    }


    if (
        !process.env.GEMINI_API_KEY
    ) {

        return res
            .status(500)
            .json({
                error:
                    "Daily Brief AI is not configured."
            });

    }


    if (
        !process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_KEY
    ) {

        return res
            .status(500)
            .json({
                error:
                    "Daily Brief cache is not configured."
            });

    }


    const functionStartedAt =
        Date.now();


    try {

        const candidates =
            req.body?.candidates;


        if (
            !Array.isArray(
                candidates
            ) ||
            candidates.length ===
                0
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "No Daily Brief candidates were provided."
                });

        }


        if (
            candidates.length >
            150
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "Too many Daily Brief candidates were provided."
                });

        }


        // ====================================================
        // SCAN DATE
        // ====================================================

        const candidateScanDate =
            cleanDate(
                candidates[0]?.scan_date ||
                candidates[0]?.scanDate ||
                candidates[0]
                    ?.pre_breakout
                    ?.scan_date ||
                candidates[0]
                    ?.pre_breakout
                    ?.scanDate ||
                candidates[0]
                    ?.breakout
                    ?.scan_date ||
                candidates[0]
                    ?.breakout
                    ?.scanDate ||
                ""
            );


        const suppliedScanDate =
            cleanDate(
                req.body?.scanDate ||
                ""
            );


        const briefDate =
            candidateScanDate ||
            suppliedScanDate ||
            getNewYorkDate();


        console.log(
            `EdgeBreak Daily Brief date: ${briefDate}`
        );


        // ====================================================
        // CLEAN AND PRESERVE FINAL EDGEBREAK ORDER
        // ====================================================
        //
        // daily_brief_finra_rerank.py has already placed the
        // final six at the beginning of the JSON array.
        //
        // We preserve that exact order.
        // Gemini is not permitted to change it.
        // ====================================================

        const seenSymbols =
            new Set();


        const cleanCandidates =
            candidates

                .filter(
                    candidate =>
                        candidate &&
                        candidate.symbol
                )

                .map(
                    (
                        candidate,
                        suppliedOrder
                    ) =>
                        normaliseCandidate(
                            candidate,
                            suppliedOrder
                        )
                )

                .filter(
                    candidate => {

                        if (
                            !candidate.symbol ||
                            seenSymbols.has(
                                candidate.symbol
                            )
                        ) {

                            return false;

                        }


                        seenSymbols.add(
                            candidate.symbol
                        );


                        return true;

                    }
                );


        if (
            cleanCandidates.length ===
            0
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "No valid Daily Brief candidates were provided."
                });

        }


        const rankedCandidates =
            cleanCandidates.slice(
                0,
                TOP_DAILY_BRIEF_CANDIDATES
            );


        const candidateSignature =
            createCandidateSignature(
                rankedCandidates
            );


        console.log(
            `Candidates received: ${cleanCandidates.length}`
        );


        console.log(
            `Locked Daily Brief candidates: ${rankedCandidates.length}`
        );


        console.log(
            `Locked order: ${rankedCandidates
                .map(
                    candidate =>
                        candidate.symbol
                )
                .join(", ")}`
        );


        // ====================================================
        // CACHE
        // ====================================================

        const cachedBrief =
            await getCachedBrief(
                briefDate,
                candidateSignature
            );


        if (cachedBrief) {

            console.log(
                `EdgeBreak Daily Brief CACHE HIT: ${briefDate}`
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    cached:
                        true,

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
                            cachedBrief
                                ?.ai_results
                                ?.results
                        )
                            ?
                            cachedBrief
                                .ai_results
                                .results
                            :
                            [],

                    researchMeta:
                        cachedBrief
                            ?.ai_results
                            ?.researchMeta
                        ||
                        null,

                    nasdaqToday:
                        cachedBrief
                            ?.nasdaq_today
                        ||
                        null,

                    marketConditions:
                        cachedBrief
                            ?.market_conditions
                        ||
                        null,

                    scannerActivity:
                        cachedBrief
                            ?.scanner_activity
                        ||
                        null

                });

        }


        console.log(
            `EdgeBreak Daily Brief CACHE MISS: ${briefDate}`
        );


        // ====================================================
        // CREATE BATCHES OF THREE
        // ====================================================

        const batches =
            [];


        for (
            let index = 0;
            index < rankedCandidates.length;
            index += BATCH_SIZE
        ) {

            batches.push(
                rankedCandidates.slice(
                    index,
                    index + BATCH_SIZE
                )
            );

        }


        console.log(
            `Batches planned: ${batches.length}`
        );


        // ====================================================
        // RUN GEMINI REPORT WRITER
        // ====================================================
        //
        // One attempt per batch.
        // No retries.
        //
        // A failed batch immediately receives deterministic
        // EdgeBreak fallback reports.
        // ====================================================

        const reportBySymbol =
            new Map();


        let completedBatches =
            0;

        let failedBatches =
            0;

        let timedOutBatches =
            0;

        let totalGeminiAttempts =
            0;

        let geminiWrittenReports =
            0;

        let fallbackReports =
            0;


        for (
            let index = 0;
            index < batches.length;
            index++
        ) {

            const batch =
                batches[index];

            const batchNumber =
                index + 1;


            const elapsed =
                Date.now() -
                functionStartedAt;


            const remainingTime =
                MAX_FUNCTION_TIME_MS -
                elapsed;


            if (
                remainingTime <
                FUNCTION_SAFETY_MARGIN_MS +
                5000
            ) {

                console.warn(
                    `Runtime safety limit reached before Batch ${batchNumber}. Using EdgeBreak fallback reports.`
                );


                for (
                    const candidate
                    of batch
                ) {

                    reportBySymbol.set(
                        candidate.symbol,
                        buildFallbackReport(
                            candidate,
                            briefDate
                        )
                    );


                    fallbackReports++;

                }


                continue;

            }


            totalGeminiAttempts++;


            console.log(
                `Starting Batch ${batchNumber}: ${batch
                    .map(
                        candidate =>
                            candidate.symbol
                    )
                    .join(", ")}`
            );


            try {

                const rawResults =
                    await writeBatchReports(

                        batch,

                        briefDate,

                        batchNumber,

                        functionStartedAt

                    );


                const cleanedResults =
                    cleanBatchResults(
                        rawResults,
                        batch,
                        briefDate
                    );


                for (
                    const candidate
                    of batch
                ) {

                    const geminiResult =
                        cleanedResults.get(
                            candidate.symbol
                        );


                    if (geminiResult) {

                        reportBySymbol.set(
                            candidate.symbol,
                            geminiResult
                        );


                        geminiWrittenReports++;

                    }
                    else {

                        reportBySymbol.set(
                            candidate.symbol,
                            buildFallbackReport(
                                candidate,
                                briefDate
                            )
                        );


                        fallbackReports++;

                    }

                }


                completedBatches++;


                console.log(
                    `Batch ${batchNumber} complete.`
                );

            }
            catch (error) {

                failedBatches++;


                if (
                    error?.code ===
                    "GEMINI_TIMEOUT"
                ) {

                    timedOutBatches++;

                }


                console.error(
                    `Batch ${batchNumber} failed:`,
                    error?.message ||
                    error
                );


                console.warn(
                    `No retry for Batch ${batchNumber}. EdgeBreak fallback reports will be used.`
                );


                for (
                    const candidate
                    of batch
                ) {

                    reportBySymbol.set(
                        candidate.symbol,
                        buildFallbackReport(
                            candidate,
                            briefDate
                        )
                    );


                    fallbackReports++;

                }

            }

        }


        // ====================================================
        // FINAL RESULTS
        // ====================================================
        //
        // Rebuild results from rankedCandidates so the final
        // output always follows the locked EdgeBreak order.
        // ====================================================

        const finalResults =
            rankedCandidates.map(
                candidate =>
                    reportBySymbol.get(
                        candidate.symbol
                    )
                    ||
                    buildFallbackReport(
                        candidate,
                        briefDate
                    )
            );


        const aiResults = {

            results:
                finalResults,

            researchMeta: {

                candidateSignature,

                researchPromptVersion:
                    RESEARCH_PROMPT_VERSION,

                reportMode:
                    "EDGEBREAK_DATA_WRITER",

                selectionAuthority:
                    "EDGEBREAK",

                rankingAuthority:
                    "EDGEBREAK",

                externalWebSearch:
                    false,

                candidatesReceived:
                    cleanCandidates.length,

                candidatesSupplied:
                    rankedCandidates.length,

                candidatesIncluded:
                    finalResults.length,

                batchesPlanned:
                    batches.length,

                batchesCompleted:
                    completedBatches,

                batchesFailed:
                    failedBatches,

                timedOutBatches,

                retriedBatches:
                    0,

                totalGeminiAttempts,

                geminiWrittenReports,

                fallbackReports,

                batchSize:
                    BATCH_SIZE,

                topCandidateLimit:
                    TOP_DAILY_BRIEF_CANDIDATES,

                requestTimeoutSeconds:
                    Math.round(
                        GEMINI_TIMEOUT_MS /
                        1000
                    ),

                retryPolicy:
                    "NO_RETRY_USE_EDGEBREAK_FALLBACK",

                resultOrder:
                    rankedCandidates.map(
                        candidate =>
                            candidate.symbol
                    )

            }

        };


        // ====================================================
        // SAFETY CHECK
        // ====================================================

        if (
            containsProhibitedAdvice(
                aiResults
            )
        ) {

            console.warn(
                "Unsafe Gemini wording detected. Replacing all reports with EdgeBreak fallback reports."
            );


            aiResults.results =
                rankedCandidates.map(
                    candidate =>
                        buildFallbackReport(
                            candidate,
                            briefDate
                        )
                );


            aiResults
                .researchMeta
                .fallbackReports =
                    rankedCandidates.length;


            aiResults
                .researchMeta
                .geminiWrittenReports =
                    0;

        }


        // ====================================================
        // SAVE
        // ====================================================

        const generatedAt =
            new Date()
                .toISOString();


        await saveDailyBrief({

            briefDate,

            generatedAt,

            companiesReviewed:
                rankedCandidates.length,

            companiesIncluded:
                aiResults.results.length,

            aiResults

        });


        const totalRuntime =
            Date.now() -
            functionStartedAt;


        console.log(
            `Daily Brief complete in ${Math.round(
                totalRuntime /
                1000
            )} seconds.`
        );


        console.log(
            `Gemini reports: ${aiResults.researchMeta.geminiWrittenReports}`
        );


        console.log(
            `Fallback reports: ${aiResults.researchMeta.fallbackReports}`
        );


        // ====================================================
        // RESPONSE
        // ====================================================

        return res
            .status(200)
            .json({

                success:
                    true,

                cached:
                    false,

                briefDate,

                generatedAt,

                companiesReviewed:
                    rankedCandidates.length,

                companiesIncluded:
                    aiResults.results.length,

                results:
                    aiResults.results,

                researchMeta: {

                    ...aiResults
                        .researchMeta,

                    runtimeSeconds:
                        Math.round(
                            totalRuntime /
                            1000
                        )

                },

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


        return res
            .status(500)
            .json({
                error:
                    "Daily Brief reports are temporarily unavailable."
            });

    }

}


// ============================================================
// NORMALISE CANDIDATE
// ============================================================

function normaliseCandidate(
    stock,
    suppliedOrder
) {

    const finalRank =
        firstNumber(

            stock.final_daily_brief_rank,

            stock.finalDailyBriefRank,

            stock.daily_brief_rank,

            stock.dailyBriefRank,

            stock.pre_pressure_rank,

            suppliedOrder + 1

        );


    const technicalScore =
        firstNumber(

            stock.pre_finra_score,

            stock.daily_brief_ranking
                ?.pre_finra_total_score,

            stock.ranking
                ?.total_score,

            stock.total_score

        );


    const finalScore =
        firstNumber(

            stock.final_daily_brief_score,

            stock.daily_brief_ranking
                ?.final_score,

            technicalScore

        );


    const xFactor =
        stock.x_factor &&
        typeof stock.x_factor ===
            "object"
            ?
            stock.x_factor
            :
            {};


    const institutional =
        stock.institutional_footprint &&
        typeof stock.institutional_footprint ===
            "object"
            ?
            stock.institutional_footprint
            :
            {};


    const pressure =
        stock.pressure_building_index &&
        typeof stock.pressure_building_index ===
            "object"
            ?
            stock.pressure_building_index
            :
            {};


    const timingState =
        cleanField(

            pressure.structure_timing_state ||

            institutional
                .structure_timing_state ||

            xFactor
                .structure_timing_state,

            100

        );


    return {

        symbol:
            cleanField(
                String(
                    stock.symbol ||
                    ""
                ).toUpperCase(),
                20
            ),

        finalRank,

        suppliedOrder,

        company: {

            name:
                cleanField(
                    stock.company?.name ||
                    stock.company_name ||
                    stock.name,
                    200
                ),

            sector:
                cleanField(
                    stock.company?.sector ||
                    stock.sector,
                    120
                ),

            industry:
                cleanField(
                    stock.company?.industry ||
                    stock.industry,
                    120
                )

        },

        scanners:
            cleanArray(
                stock.scanners,
                80
            ),

        scores: {

            technical:
                technicalScore,

            final:
                finalScore

        },

        technical: {

            timingState,

            participationState:
                cleanField(

                    stock.participation_state ||

                    stock.technical_context
                        ?.participation_state ||

                    stock.indicator_history
                        ?.participation_state,

                    100

                ),

            obvPriceRelationship:
                cleanField(

                    stock.obv_price_relationship ||

                    stock.technical_context
                        ?.obv_price_relationship ||

                    stock.indicator_history
                        ?.obv_price_relationship,

                    100

                ),

            obvTrend20Day:
                cleanField(

                    stock.obv_trend_20d ||

                    stock.technical_context
                        ?.obv_trend_20d ||

                    stock.indicator_history
                        ?.obv_trend_20d,

                    100

                ),

            obvTrend60Day:
                cleanField(

                    stock.obv_trend_60d ||

                    stock.technical_context
                        ?.obv_trend_60d ||

                    stock.indicator_history
                        ?.obv_trend_60d,

                    100

                ),

            distanceFromResistancePercent:
                firstNumber(

                    stock
                        .distance_from_resistance_percent,

                    stock
                        .technical_context
                        ?.distance_from_resistance_percent,

                    stock
                        .pre_breakout
                        ?.distance_from_resistance_percent,

                    stock
                        .breakout
                        ?.distance_from_resistance_percent,

                    stock
                        .launch_pad
                        ?.distance_from_resistance_percent

                ),

            priceChange20DayPercent:
                firstNumber(

                    stock
                        .price_change_20d_percent,

                    stock
                        .technical_context
                        ?.price_change_20d_percent,

                    stock
                        .indicator_history
                        ?.price_change_20d_percent

                )

        },

        xFactor: {

            score:
                firstNumber(
                    xFactor.score
                ),

            label:
                cleanField(
                    xFactor.label,
                    100
                ),

            boostPoints:
                firstNumber(
                    xFactor.boost_points,
                    0
                ),

            timingState,

            finraActivityState:
                cleanField(
                    xFactor.finra_activity_state,
                    100
                ),

            finraVolumePercentile:
                firstNumber(
                    xFactor.finra_volume_percentile
                ),

            meaningfulActivitySignal:
                Boolean(
                    xFactor
                        .meaningful_activity_signal
                ),

            reasonTags:
                cleanArray(
                    xFactor.reason_tags,
                    120
                )

        },

        institutionalFootprint: {

            analyzed:
                Boolean(
                    institutional.analyzed
                ),

            score:
                firstNumber(
                    institutional.score
                ),

            label:
                cleanField(
                    institutional.label,
                    100
                ),

            boostPoints:
                firstNumber(
                    institutional.boost_points,
                    0
                ),

            meaningfulCrossVenueSignal:
                Boolean(
                    institutional
                        .meaningful_cross_venue_signal
                ),

            currentFinraPercentile:
                firstNumber(

                    institutional
                        .current_finra_percentile,

                    xFactor
                        .finra_volume_percentile

                ),

            currentActivityGatePassed:
                Boolean(
                    institutional
                        .current_activity_gate_passed
                ),

            timingGatePassed:
                institutional
                    .timing_gate_passed ===
                    true,

            multiVenueWeeksLast4:
                firstNumber(
                    institutional
                        .multi_venue_weeks_last_4,
                    0
                ),

            consecutiveMultiVenueWeeks:
                firstNumber(
                    institutional
                        .consecutive_multi_venue_weeks,
                    0
                ),

            strongestUnusualVenueCount:
                firstNumber(

                    institutional
                        .strongest_multi_venue_week
                        ?.unusual_venue_count,

                    0

                ),

            reasonTags:
                cleanArray(
                    institutional.reason_tags,
                    120
                )

        },

        pressureBuildingIndex: {

            analyzed:
                pressure.analyzed ===
                true,

            score:
                firstNumber(
                    pressure.score
                ),

            label:
                cleanField(
                    pressure.label,
                    120
                ),

            confirmationTier:
                cleanField(
                    pressure.confirmation_tier,
                    120
                ),

            boostPoints:
                firstNumber(
                    pressure.boost_points,
                    0
                ),

            eligibleFromFinraEvidence:
                Boolean(
                    pressure
                        .eligible_from_finra_evidence
                ),

            timingGatePassed:
                pressure
                    .timing_gate_passed ===
                    true,

            currentFinraPercentile:
                firstNumber(
                    pressure
                        .current_finra_percentile
                ),

            strongestUnusualVenueCount:
                firstNumber(
                    pressure
                        .strongest_unusual_venue_count,
                    0
                ),

            multiVenueWeeksLast4:
                firstNumber(
                    pressure
                        .multi_venue_weeks_last_4,
                    0
                ),

            consecutiveMultiVenueWeeks:
                firstNumber(
                    pressure
                        .consecutive_multi_venue_weeks,
                    0
                ),

            reasonTags:
                cleanArray(
                    pressure.reason_tags,
                    120
                )

        }

    };

}


// ============================================================
// GEMINI REPORT WRITER
// ============================================================

async function writeBatchReports(

    candidates,

    briefDate,

    batchNumber,

    functionStartedAt

) {

    const systemInstruction = `

You are the report writer for EdgeBreak.

EdgeBreak has already completed all scanning, filtering,
technical ranking, FINRA off-exchange analysis, multi-venue
institutional-footprint analysis and Pressure Building Index
analysis.

You are NOT a stock selector.

You are NOT an investment adviser.

You are NOT conducting outside research.

You must use only the EdgeBreak evidence supplied in the JSON.

You must not:

- search the internet
- add company news
- add earnings information
- add fundamentals
- invent missing evidence
- remove a supplied company
- combine companies
- reorder companies
- rerank companies
- call a stock a buy, sell or hold
- predict future price movements
- claim that institutional buying is confirmed

Your only job is to explain why EdgeBreak surfaced each stock.

Write for an everyday investor or trader.

Use plain English.

Explain the strongest available evidence without listing every
score mechanically.

Each report should normally be between 60 and 100 words.

Use careful phrases such as:

- possible institutional-scale activity
- institutional-style footprint
- unusual activity across multiple reporting venues
- evidence of pressure building
- activity may indicate participation by larger market players

Never say:

- confirmed institutional buying
- institutions are buying
- guaranteed
- strong buy
- best stock
- price will rise

FINRA information is delayed and does not identify buy or sell
direction.

Return valid JSON only.

`;


    const candidatesForGemini =
        candidates.map(
            candidate => ({

                symbol:
                    candidate.symbol,

                finalEdgeBreakRank:
                    candidate.finalRank,

                company:
                    candidate.company,

                scanners:
                    candidate.scanners,

                technicalScore:
                    candidate.scores
                        .technical,

                finalEdgeBreakScore:
                    candidate.scores
                        .final,

                technicalEvidence:
                    candidate.technical,

                xFactor:
                    candidate.xFactor,

                institutionalFootprint:
                    candidate
                        .institutionalFootprint,

                pressureBuildingIndex:
                    candidate
                        .pressureBuildingIndex,

                requiredAttentionLevel:
                    getAttentionLevel(
                        candidate
                    )

            })
        );


    const userInstruction = `

Write the EdgeBreak quick reports dated ${briefDate}.

This is Batch ${batchNumber}.

You must return exactly one report for every supplied stock.

Keep the supplied order.

Do not omit any stock.

Use only the supplied EdgeBreak data.

For each stock:

1. Identify its technical setup or structure stage.
2. Explain relevant off-exchange activity.
3. Explain any meaningful activity across multiple venues.
4. Explain its Pressure Building Index evidence.
5. State why EdgeBreak surfaced it.
6. Clearly describe institutional behaviour as an inference,
   never as confirmed buying.

If pressure or institutional evidence is weak, say that the
stock was primarily surfaced by its technical structure.

Do not make weak evidence sound strong.

RETURN EXACTLY THIS JSON STRUCTURE:

{
    "results": [
        {
            "symbol": "",
            "headline": "",
            "summary": "",
            "currentDevelopment": "",
            "whyIncluded": ""
        }
    ]
}

FIELD RULES:

symbol:
Use one supplied ticker symbol.

headline:
A short description of the EdgeBreak setup.
Do not use investment-rating language.

summary:
A concise plain-English report using the strongest supplied
technical, FINRA, venue and pressure evidence.

currentDevelopment:
One concise sentence describing the strongest current
EdgeBreak-detected market-data evidence.

whyIncluded:
One concise sentence explaining why the stock remained in the
final EdgeBreak six.

CANDIDATES:

${JSON.stringify(
    candidatesForGemini,
    null,
    2
)}

Return JSON only.

`;


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

                role:
                    "user",

                parts: [
                    {
                        text:
                            userInstruction
                    }
                ]

            }

        ],

        // Deliberately no Google Search tool.
        // Gemini only reads EdgeBreak data.

        generationConfig: {

            maxOutputTokens:
                2200,

            responseMimeType:
                "application/json",

            temperature:
                0.1

        }

    };


    const elapsed =
        Date.now() -
        functionStartedAt;


    const remaining =
        MAX_FUNCTION_TIME_MS -
        elapsed;


    const allowedTimeout =
        Math.max(

            5000,

            Math.min(

                GEMINI_TIMEOUT_MS,

                remaining -
                FUNCTION_SAFETY_MARGIN_MS

            )

        );


    if (
        allowedTimeout <
        5000
    ) {

        throw new Error(
            `Batch ${batchNumber} cancelled because the runtime limit was reached.`
        );

    }


    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            allowedTimeout
        );


    let response;


    try {

        response =
            await fetch(

                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            process.env
                                .GEMINI_API_KEY

                    },

                    body:
                        JSON.stringify(
                            requestBody
                        ),

                    signal:
                        controller.signal

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
                    `Batch ${batchNumber} timed out.`
                );


            timeoutError.code =
                "GEMINI_TIMEOUT";


            throw timeoutError;

        }


        throw error;

    }
    finally {

        clearTimeout(
            timeout
        );

    }


    if (
        !response.ok
    ) {

        const errorText =
            await safeReadResponseText(
                response
            );


        console.error(
            `Gemini Batch ${batchNumber} error:`,
            response.status,
            errorText
        );


        throw new Error(
            `Gemini returned HTTP ${response.status}.`
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
                    part.text ||
                    ""
            )
            ?.join("")
            ?.trim();


    if (!rawText) {

        throw new Error(
            `Batch ${batchNumber} returned no report text.`
        );

    }


    const parsed =
        JSON.parse(
            cleanJsonText(
                rawText
            )
        );


    if (
        !parsed ||
        !Array.isArray(
            parsed.results
        )
    ) {

        throw new Error(
            `Batch ${batchNumber} returned invalid report data.`
        );

    }


    return parsed.results;

}


// ============================================================
// CLEAN GEMINI RESULTS
// ============================================================

function cleanBatchResults(

    rawResults,

    batch,

    briefDate

) {

    const candidateMap =
        new Map(
            batch.map(
                candidate => [
                    candidate.symbol,
                    candidate
                ]
            )
        );


    const cleaned =
        new Map();


    for (
        const rawResult
        of rawResults
    ) {

        if (
            !rawResult ||
            typeof rawResult !==
                "object"
        ) {

            continue;

        }


        const symbol =
            cleanField(
                String(
                    rawResult.symbol ||
                    rawResult.symbols?.[0] ||
                    ""
                ).toUpperCase(),
                20
            );


        const candidate =
            candidateMap.get(
                symbol
            );


        if (
            !candidate ||
            cleaned.has(
                symbol
            )
        ) {

            continue;

        }


        const headline =
            cleanField(
                rawResult.headline,
                180
            );


        const summary =
            cleanField(
                rawResult.summary,
                850
            );


        const currentDevelopment =
            cleanField(
                rawResult.currentDevelopment,
                500
            );


        const whyIncluded =
            cleanField(
                rawResult.whyIncluded,
                500
            );


        if (
            !headline ||
            !summary ||
            !currentDevelopment ||
            !whyIncluded
        ) {

            continue;

        }


        const result = {

            symbols: [
                symbol
            ],

            companyName:
                candidate.company.name,

            scanners:
                candidate.scanners,

            attentionLevel:
                getAttentionLevel(
                    candidate
                ),

            headline,

            summary,

            currentDevelopment,

            whyIncluded,

            developmentDate:
                briefDate,

            sourceNames:
                getSourceNames(
                    candidate
                )

        };


        if (
            containsProhibitedAdvice(
                result
            )
        ) {

            continue;

        }


        cleaned.set(
            symbol,
            result
        );

    }


    return cleaned;

}


// ============================================================
// EDGEBREAK FALLBACK REPORT
// ============================================================

function buildFallbackReport(
    candidate,
    briefDate
) {

    const symbol =
        candidate.symbol;


    const timingLabel =
        formatLabel(
            candidate
                .technical
                .timingState
        );


    const pressure =
        candidate
            .pressureBuildingIndex;


    const institutional =
        candidate
            .institutionalFootprint;


    const xFactor =
        candidate
            .xFactor;


    const setupDescription =
        getSetupDescription(
            candidate
                .technical
                .timingState
        );


    const evidenceSentences =
        [];


    evidenceSentences.push(
        `${symbol} was surfaced by EdgeBreak through ${setupDescription}.`
    );


    if (
        Number.isFinite(
            xFactor.finraVolumePercentile
        )
    ) {

        evidenceSentences.push(
            `Its current FINRA off-exchange activity ranks around the ${formatNumber(
                xFactor.finraVolumePercentile
            )} percentile of its available history.`
        );

    }


    if (
        institutional
            .meaningfulCrossVenueSignal &&
        institutional
            .strongestUnusualVenueCount >=
            2
    ) {

        evidenceSentences.push(
            `EdgeBreak also detected unusual activity across ${formatNumber(
                institutional
                    .strongestUnusualVenueCount
            )} reporting venues, with multi-venue evidence appearing in ${formatNumber(
                institutional
                    .multiVenueWeeksLast4
            )} of the last four analysed weeks.`
        );

    }
    else {

        evidenceSentences.push(
            "Current multi-venue evidence did not independently qualify for an institutional-footprint boost."
        );

    }


    if (
        pressure.analyzed &&
        Number.isFinite(
            pressure.score
        )
    ) {

        if (
            pressure.confirmationTier ===
            "ACTIVE_PRESSURE_BUILD"
        ) {

            evidenceSentences.push(
                `Its Pressure Building Index scored ${formatNumber(
                    pressure.score
                )}, indicating that the qualifying activity has persisted alongside an acceptable chart structure.`
            );

        }
        else if (
            pressure.confirmationTier ===
            "RECENT_PRESSURE_EVIDENCE"
        ) {

            evidenceSentences.push(
                `Its Pressure Building Index scored ${formatNumber(
                    pressure.score
                )}, although the evidence remains recent or incomplete rather than fully confirmed by EdgeBreak's rules.`
            );

        }
        else {

            evidenceSentences.push(
                `Its Pressure Building Index scored ${formatNumber(
                    pressure.score
                )}, but did not establish a current qualified pressure-building signal.`
            );

        }

    }


    evidenceSentences.push(
        "This is an inference from delayed market data and does not confirm institutional buying or identify an investment firm."
    );


    const headline =
        pressure.confirmationTier ===
        "ACTIVE_PRESSURE_BUILD"
            ?
            `${timingLabel || "Constructive Setup"} With Pressure Evidence`
            :
            `${timingLabel || "Technical Setup"} Surfaced by EdgeBreak`;


    const currentDevelopment =
        buildCurrentEvidenceSentence(
            candidate
        );


    const whyIncluded =
        buildWhyIncludedSentence(
            candidate
        );


    return {

        symbols: [
            symbol
        ],

        companyName:
            candidate.company.name,

        scanners:
            candidate.scanners,

        attentionLevel:
            getAttentionLevel(
                candidate
            ),

        headline,

        summary:
            evidenceSentences.join(
                " "
            ),

        currentDevelopment,

        whyIncluded,

        developmentDate:
            briefDate,

        sourceNames:
            getSourceNames(
                candidate
            )

    };

}


// ============================================================
// CURRENT EVIDENCE SENTENCE
// ============================================================

function buildCurrentEvidenceSentence(
    candidate
) {

    const pressure =
        candidate
            .pressureBuildingIndex;


    const institutional =
        candidate
            .institutionalFootprint;


    if (
        pressure
            .confirmationTier ===
            "ACTIVE_PRESSURE_BUILD"
    ) {

        return (
            `EdgeBreak recorded a Pressure Building Index of ` +
            `${formatNumber(
                pressure.score
            )}, supported by ` +
            `${formatNumber(
                pressure
                    .strongestUnusualVenueCount
            )} unusual reporting venues and ` +
            `${formatNumber(
                pressure
                    .multiVenueWeeksLast4
            )} multi-venue weeks.`
        );

    }


    if (
        institutional
            .meaningfulCrossVenueSignal
    ) {

        return (
            `EdgeBreak detected a possible institutional-style footprint across ` +
            `${formatNumber(
                institutional
                    .strongestUnusualVenueCount
            )} reporting venues.`
        );

    }


    return (
        "The stock remained in the final six primarily because of its EdgeBreak technical ranking and chart structure."
    );

}


// ============================================================
// WHY INCLUDED SENTENCE
// ============================================================

function buildWhyIncludedSentence(
    candidate
) {

    const parts =
        [];


    if (
        candidate
            .technical
            .timingState
    ) {

        parts.push(
            formatLabel(
                candidate
                    .technical
                    .timingState
            )
        );

    }


    if (
        candidate
            .institutionalFootprint
            .boostPoints >
        0
    ) {

        parts.push(
            "qualifying multi-venue activity"
        );

    }


    if (
        candidate
            .xFactor
            .boostPoints >
        0
    ) {

        parts.push(
            "supportive off-exchange activity"
        );

    }


    if (
        candidate
            .pressureBuildingIndex
            .boostPoints >
        0
    ) {

        parts.push(
            "confirmed pressure-building evidence"
        );

    }


    if (
        parts.length ===
        0
    ) {

        parts.push(
            "its technical score and final EdgeBreak position"
        );

    }


    return (
        `${candidate.symbol} remained in the final EdgeBreak six because of ` +
        `${joinNaturalLanguage(
            parts
        )}.`
    );

}


// ============================================================
// SETUP DESCRIPTION
// ============================================================

function getSetupDescription(
    timingState
) {

    const descriptions = {

        EARLY_CONSTRUCTIVE:
            "an early constructive setup showing improving chart structure",

        CONSTRUCTIVE_BASE:
            "a constructive base or consolidation structure",

        CONSTRUCTIVE_BREAKOUT:
            "a constructive breakout developing from an established structure",

        ADVANCED_TREND:
            "an established upward trend with supporting structure",

        CHOPPY_FLAT:
            "a technically ranked but currently choppy structure",

        POST_MOVE_ACTIVITY:
            "a technically ranked setup where notable activity followed an earlier price move",

        EXTENDED_BREAKOUT:
            "an advanced breakout structure",

        WEAK_STRUCTURE:
            "a setup with limited structural confirmation",

        INSUFFICIENT_FINRA_HISTORY:
            "a technical setup with limited FINRA history"

    };


    return (
        descriptions[
            String(
                timingState ||
                ""
            ).toUpperCase()
        ]
        ||
        "a high-ranking technical setup"
    );

}


// ============================================================
// ATTENTION LEVEL
// ============================================================
//
// These labels describe strength of supplied EdgeBreak evidence.
// They are not investment ratings.
//
// ============================================================

function getAttentionLevel(
    candidate
) {

    const pressure =
        candidate
            .pressureBuildingIndex;


    if (
        pressure
            .confirmationTier ===
            "ACTIVE_PRESSURE_BUILD" &&
        Number(
            pressure.score
        ) >=
        85
    ) {

        return "HIGH";

    }


    if (
        pressure
            .confirmationTier ===
            "ACTIVE_PRESSURE_BUILD" ||
        candidate
            .institutionalFootprint
            .boostPoints >
            0 ||
        candidate
            .xFactor
            .boostPoints >
            0
    ) {

        return "ELEVATED";

    }


    return "NOTABLE";

}


// ============================================================
// SOURCE NAMES
// ============================================================

function getSourceNames(
    candidate
) {

    const sources = [
        "EdgeBreak Technical Scanner"
    ];


    if (
        candidate.xFactor.score !==
        null
    ) {

        sources.push(
            "FINRA Off-Exchange Data"
        );

    }


    if (
        candidate
            .institutionalFootprint
            .analyzed
    ) {

        sources.push(
            "EdgeBreak Multi-Venue Analysis"
        );

    }


    if (
        candidate
            .pressureBuildingIndex
            .analyzed
    ) {

        sources.push(
            "EdgeBreak Pressure Building Index"
        );

    }


    return sources;

}


// ============================================================
// CANDIDATE SIGNATURE
// ============================================================

function createCandidateSignature(
    candidates
) {

    const signature =
        candidates.map(
            candidate => [

                candidate.symbol,

                candidate.finalRank,

                candidate.scores.final,

                candidate.xFactor.score,

                candidate.xFactor.label,

                candidate
                    .institutionalFootprint
                    .score,

                candidate
                    .institutionalFootprint
                    .boostPoints,

                candidate
                    .pressureBuildingIndex
                    .score,

                candidate
                    .pressureBuildingIndex
                    .label,

                candidate
                    .pressureBuildingIndex
                    .boostPoints

            ].join(":")
        )
            .join("|");


    return (
        `${RESEARCH_PROMPT_VERSION}:` +
        signature
    );

}


// ============================================================
// CACHE READ
// ============================================================

async function getCachedBrief(

    briefDate,

    candidateSignature

) {

    const cacheUrl =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_briefs` +
        `?brief_date=eq.${encodeURIComponent(
            briefDate
        )}` +
        `&status=eq.complete` +
        `&select=*` +
        `&limit=1`;


    try {

        const response =
            await fetch(

                cacheUrl,

                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            process.env
                                .SUPABASE_SERVICE_KEY,

                        "Authorization":
                            `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,

                        "Content-Type":
                            "application/json"

                    }

                }

            );


        if (
            !response.ok
        ) {

            console.error(
                "Daily Brief cache read failed:",
                await safeReadResponseText(
                    response
                )
            );


            return null;

        }


        const rows =
            await response.json();


        if (
            !Array.isArray(
                rows
            ) ||
            rows.length ===
                0 ||
            !rows[0]?.ai_results
        ) {

            return null;

        }


        const cachedSignature =
            String(
                rows[0]
                    ?.ai_results
                    ?.researchMeta
                    ?.candidateSignature
                ||
                ""
            ).trim();


        if (
            cachedSignature !==
            candidateSignature
        ) {

            console.log(
                "Cached brief ignored because the final six or supplied evidence changed."
            );


            return null;

        }


        return rows[0];

    }
    catch (error) {

        console.error(
            "Daily Brief cache read error:",
            error
        );


        return null;

    }

}


// ============================================================
// CACHE SAVE
// ============================================================

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

                    method:
                        "POST",

                    headers: {

                        "apikey":
                            process.env
                                .SUPABASE_SERVICE_KEY,

                        "Authorization":
                            `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,

                        "Content-Type":
                            "application/json",

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

                            ai_results:
                                aiResults,

                            generated_at:
                                generatedAt,

                            updated_at:
                                generatedAt

                        })

                }

            );


        if (
            !response.ok
        ) {

            console.error(
                "Daily Brief cache save failed:",
                await safeReadResponseText(
                    response
                )
            );


            return false;

        }


        console.log(
            `EdgeBreak Daily Brief CACHE SAVED: ${briefDate}`
        );


        return true;

    }
    catch (error) {

        console.error(
            "Daily Brief cache save error:",
            error
        );


        return false;

    }

}


// ============================================================
// SAFETY FILTER
// ============================================================

function containsProhibitedAdvice(
    value
) {

    const text =
        JSON.stringify(
            value
        );


    const prohibitedPatterns = [

        /\byou should buy\b/i,
        /\byou should sell\b/i,
        /\byou should hold\b/i,

        /\binvestors should buy\b/i,
        /\binvestors should sell\b/i,
        /\binvestors should hold\b/i,

        /\bstrong buy\b/i,
        /\bstrong sell\b/i,

        /\bbuy this stock\b/i,
        /\bsell this stock\b/i,

        /\bguaranteed\b/i,

        /\bwill definitely rise\b/i,
        /\bwill definitely increase\b/i,

        /\bconfirmed institutional buying\b/i,
        /\binstitutions are buying\b/i,

        /\brisk[- ]free\b/i

    ];


    return prohibitedPatterns.some(
        pattern =>
            pattern.test(
                text
            )
    );

}


// ============================================================
// JSON CLEANER
// ============================================================

function cleanJsonText(
    value
) {

    let text =
        String(
            value ||
            ""
        ).trim();


    text =
        text.replace(
            /^```json\s*/i,
            ""
        );


    text =
        text.replace(
            /^```\s*/i,
            ""
        );


    text =
        text.replace(
            /\s*```$/,
            ""
        );


    const firstBrace =
        text.indexOf(
            "{"
        );


    const lastBrace =
        text.lastIndexOf(
            "}"
        );


    if (
        firstBrace !==
            -1 &&
        lastBrace >
            firstBrace
    ) {

        text =
            text.slice(
                firstBrace,
                lastBrace + 1
            );

    }


    return text;

}


// ============================================================
// SAFE ERROR RESPONSE
// ============================================================

async function safeReadResponseText(
    response
) {

    try {

        return await response.text();

    }
    catch {

        return (
            "Unable to read response."
        );

    }

}


// ============================================================
// DATE HELPERS
// ============================================================

function cleanDate(
    value
) {

    const date =
        String(
            value ||
            ""
        ).trim();


    return /^\d{4}-\d{2}-\d{2}$/.test(
        date
    )
        ?
        date
        :
        "";

}


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


    const values =
        {};


    for (
        const part
        of parts
    ) {

        if (
            part.type !==
            "literal"
        ) {

            values[
                part.type
            ] =
                part.value;

        }

    }


    return (
        `${values.year}-` +
        `${values.month}-` +
        `${values.day}`
    );

}


// ============================================================
// GENERAL HELPERS
// ============================================================

function firstNumber(
    ...values
) {

    for (
        const value
        of values
    ) {

        if (
            value ===
                null ||
            value ===
                undefined ||
            value ===
                ""
        ) {

            continue;

        }


        const number =
            Number(
                value
            );


        if (
            Number.isFinite(
                number
            )
        ) {

            return number;

        }

    }


    return null;

}


function cleanField(

    value,

    maxLength = 800

) {

    if (
        value ===
        null ||
        value ===
        undefined
    ) {

        return "";

    }


    return String(
        value
    )

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


function cleanArray(

    value,

    itemLength = 120

) {

    if (
        !Array.isArray(
            value
        )
    ) {

        return [];

    }


    return [
        ...new Set(

            value

                .map(
                    item =>
                        cleanField(
                            item,
                            itemLength
                        )
                )

                .filter(Boolean)

        )
    ];

}


function formatLabel(
    value
) {

    const text =
        cleanField(
            value,
            100
        );


    if (!text) {

        return "";

    }


    return text

        .toLowerCase()

        .split("_")

        .filter(Boolean)

        .map(
            word =>
                word.charAt(0)
                    .toUpperCase()
                +
                word.slice(1)
        )

        .join(" ");

}


function formatNumber(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "0";

    }


    return Number.isInteger(
        number
    )
        ?
        String(
            number
        )
        :
        number.toFixed(
            1
        );

}


function joinNaturalLanguage(
    values
) {

    const cleanValues =
        values.filter(
            Boolean
        );


    if (
        cleanValues.length ===
        0
    ) {

        return (
            "its EdgeBreak ranking"
        );

    }


    if (
        cleanValues.length ===
        1
    ) {

        return cleanValues[0];

    }


    if (
        cleanValues.length ===
        2
    ) {

        return (
            `${cleanValues[0]} and ` +
            `${cleanValues[1]}`
        );

    }


    return (
        cleanValues
            .slice(
                0,
                -1
            )
            .join(", ")
        +
        ` and ${cleanValues[
            cleanValues.length - 1
        ]}`
    );

}