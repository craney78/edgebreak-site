const BATCH_SIZE = 3;
const TOP_X_FACTOR_CANDIDATES = 12;

// No retries. Each batch gets a longer single window.
// 4 batches x 55s = 220s maximum Gemini wait time.
// The overall research budget is capped at 270s to stay clear of
// the Vercel function limit used by this endpoint.
const GEMINI_TIMEOUT_MS = 55000;
const MAX_RESEARCH_TIME_MS = 270000;
const FUNCTION_SAFETY_MARGIN_MS = 12000;
const MIN_TIME_FOR_NEW_BATCH_MS =
    GEMINI_TIMEOUT_MS + FUNCTION_SAFETY_MARGIN_MS;

const RESEARCH_PROMPT_VERSION =
    "fundamental-supply-catalyst-xfactor-top12-v2";


export default async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
            error: "Daily Brief AI is not configured."
        });
    }

    if (
        !process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_KEY
    ) {
        return res.status(500).json({
            error: "Daily Brief cache is not configured."
        });
    }

    const functionStartedAt = Date.now();

    try {

        const { candidates } = req.body || {};

        if (
            !Array.isArray(candidates) ||
            candidates.length === 0
        ) {
            return res.status(400).json({
                error: "No Daily Brief candidates were provided."
            });
        }

        if (candidates.length > 150) {
            return res.status(400).json({
                error: "Too many Daily Brief candidates were provided."
            });
        }

        const candidateScanDate = String(
            candidates[0]?.scan_date ||
            candidates[0]?.scanDate ||
            candidates[0]?.pre_breakout?.scan_date ||
            candidates[0]?.pre_breakout?.scanDate ||
            candidates[0]?.breakout?.scan_date ||
            candidates[0]?.breakout?.scanDate ||
            ""
        ).trim();

        const suppliedScanDate = String(
            req.body?.scanDate || ""
        ).trim();

        let briefDate;

        if (/^\d{4}-\d{2}-\d{2}$/.test(candidateScanDate)) {
            briefDate = candidateScanDate;

            console.log(
                `EdgeBreak Daily Brief using candidate scanner date: ${briefDate}`
            );
        }
        else if (/^\d{4}-\d{2}-\d{2}$/.test(suppliedScanDate)) {
            briefDate = suppliedScanDate;

            console.log(
                `EdgeBreak Daily Brief using supplied scanner date: ${briefDate}`
            );
        }
        else {
            briefDate = getNewYorkDate();

            console.warn(
                `EdgeBreak Daily Brief scanner date unavailable. Falling back to New York date: ${briefDate}`
            );
        }

        console.log(
            `EdgeBreak Daily Brief session date: ${briefDate}`
        );


        // ====================================================
        // CLEAN CANDIDATES
        // ====================================================

        const cleanCandidates = candidates
            .filter(
                stock =>
                    stock &&
                    stock.symbol
            )
            .map(
                (
                    stock,
                    index
                ) => {

                    const rankValue =
                        stock.final_daily_brief_rank ??
                        stock.finalDailyBriefRank ??
                        stock.daily_brief_rank ??
                        stock.dailyBriefRank ??
                        stock.pre_finra_rank ??
                        stock.preFinraRank ??
                        stock.technical_rank ??
                        stock.technicalRank ??
                        stock.rank_position ??
                        stock.rankPosition;


                    const reasonTags =
                        Array.isArray(
                            stock.x_factor?.reason_tags
                        )
                            ?
                            stock.x_factor.reason_tags
                                .map(
                                    value =>
                                        cleanField(
                                            String(value),
                                            120
                                        )
                                )
                                .filter(Boolean)
                            :
                            [];


                    return {

                        symbol:
                            String(
                                stock.symbol
                            )
                                .trim()
                                .toUpperCase(),

                        technicalRank:
                            Number.isFinite(
                                Number(
                                    rankValue
                                )
                            )
                                ?
                                Number(
                                    rankValue
                                )
                                :
                                index + 1,

                        suppliedOrder:
                            index,

                        scanners:
                            Array.isArray(
                                stock.scanners
                            )
                                ?
                                stock.scanners
                                    .map(
                                        scanner =>
                                            String(
                                                scanner
                                            ).trim()
                                    )
                                    .filter(Boolean)
                                :
                                [],

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

                        },

                        xFactor: {

                            score:
                                Number.isFinite(
                                    Number(
                                        stock.x_factor?.score
                                    )
                                )
                                    ?
                                    Number(
                                        stock.x_factor.score
                                    )
                                    :
                                    null,

                            label:
                                cleanField(
                                    stock.x_factor?.label,
                                    80
                                ),

                            structureTimingState:
                                cleanField(
                                    stock.x_factor
                                        ?.structure_timing_state,
                                    120
                                ),

                            meaningfulActivitySignal:
                                Boolean(
                                    stock.x_factor
                                        ?.meaningful_activity_signal
                                ),

                            finraActivityState:
                                cleanField(
                                    stock.x_factor
                                        ?.finra_activity_state,
                                    80
                                ),

                            finraVolumePercentile:
                                Number.isFinite(
                                    Number(
                                        stock.x_factor
                                            ?.finra_volume_percentile
                                    )
                                )
                                    ?
                                    Number(
                                        stock.x_factor
                                            .finra_volume_percentile
                                    )
                                    :
                                    null,

                            reasonTags

                        }

                    };

                }
            );


        if (cleanCandidates.length === 0) {
            return res.status(400).json({
                error:
                    "No valid Daily Brief candidates were provided."
            });
        }


        // ====================================================
        // REMOVE DUPLICATES + PRESERVE FINAL EDGEBREAK ORDER
        // ====================================================

        const seen =
            new Set();


        const allRankedCandidates =
            cleanCandidates

                .filter(
                    stock => {

                        if (
                            seen.has(
                                stock.symbol
                            )
                        ) {
                            return false;
                        }

                        seen.add(
                            stock.symbol
                        );

                        return true;

                    }
                )

                .sort(
                    (a, b) =>
                        (
                            a.technicalRank -
                            b.technicalRank
                        )
                        ||
                        (
                            a.suppliedOrder -
                            b.suppliedOrder
                        )
                );


        // ====================================================
        // TOP 12 X-FACTOR CANDIDATES ONLY
        // ====================================================

        const rankedCandidates =
            allRankedCandidates.slice(
                0,
                TOP_X_FACTOR_CANDIDATES
            );


        const candidateSignature =
            createCandidateSignature(
                rankedCandidates
            );


        console.log(
            `Daily Brief candidates received: ${allRankedCandidates.length}`
        );

        console.log(
            `Daily Brief top X-Factor candidates selected: ${rankedCandidates.length}`
        );

        console.log(
            `Daily Brief research order: ${rankedCandidates
                .map(
                    stock =>
                        stock.symbol
                )
                .join(", ")}`
        );

        console.log(
            `Daily Brief candidate signature: ${candidateSignature}`
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
                                .ai_results
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
                            .ai_results
                            ?.researchMeta
                        ||
                        null,

                    nasdaqToday:
                        cachedBrief
                            .nasdaq_today
                        ||
                        null,

                    marketConditions:
                        cachedBrief
                            .market_conditions
                        ||
                        null,

                    scannerActivity:
                        cachedBrief
                            .scanner_activity
                        ||
                        null

                });

        }


        console.log(
            `EdgeBreak Daily Brief CACHE MISS: ${briefDate}`
        );


        // ====================================================
        // CREATE BATCHES
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
            `Daily Brief batch size: ${BATCH_SIZE}`
        );

        console.log(
            `Daily Brief batches planned: ${batches.length}`
        );

        console.log(
            `Daily Brief timeout per batch: ${Math.round(
                GEMINI_TIMEOUT_MS /
                1000
            )}s`
        );

        console.log(
            "Daily Brief retry policy: NO RETRIES."
        );


        batches.forEach(
            (
                batch,
                index
            ) => {

                console.log(
                    `Batch ${index + 1}: ${batch
                        .map(
                            stock =>
                                stock.symbol
                        )
                        .join(", ")}`
                );

            }
        );


        // ====================================================
        // RUN GEMINI RESEARCH
        // ====================================================

        const batchResearch =
            [];


        let completedBatches =
            0;

        let failedBatches =
            0;

        let timedOutBatches =
            0;

        let stoppedEarly =
            false;

        let candidatesActuallyResearched =
            0;

        let totalGeminiAttempts =
            0;


        // ====================================================
        // ONE ATTEMPT PER BATCH
        // NO RETRIES
        // ====================================================

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


            const remainingBudget =
                MAX_RESEARCH_TIME_MS -
                elapsed;


            console.log(
                `Elapsed before Batch ${batchNumber}: ${Math.round(
                    elapsed /
                    1000
                )}s`
            );


            if (
                remainingBudget <
                MIN_TIME_FOR_NEW_BATCH_MS
            ) {

                console.warn(
                    `Stopping before Batch ${batchNumber}. Runtime safety margin reached.`
                );

                stoppedEarly =
                    true;

                break;

            }


            console.log(
                `Starting Batch ${batchNumber}/${batches.length}: ${batch
                    .map(
                        stock =>
                            stock.symbol
                    )
                    .join(", ")}`
            );


            totalGeminiAttempts++;


            try {

                const research =
                    await researchBatch(

                        batch,

                        briefDate,

                        batchNumber,

                        functionStartedAt

                    );


                batchResearch.push(
                    research
                );


                completedBatches++;


                candidatesActuallyResearched +=
                    batch.length;


                console.log(
                    `Batch ${batchNumber} complete.`
                );

            }
            catch (batchError) {

                failedBatches++;


                const isTimeout =
                    batchError?.code ===
                    "GEMINI_TIMEOUT";


                if (isTimeout) {

                    timedOutBatches++;

                }


                batchResearch.push({

                    companiesReviewed:
                        0,

                    companiesIncluded:
                        0,

                    results:
                        []

                });


                console.error(
                    `Batch ${batchNumber} failed:`,
                    batchError?.message ||
                    batchError
                );


                if (isTimeout) {

                    console.warn(
                        `Batch ${batchNumber} timed out. No retry. Moving immediately to the next batch.`
                    );

                }
                else {

                    console.warn(
                        `Batch ${batchNumber} will not be retried. Moving immediately to the next batch.`
                    );

                }

            }


            // NO SLEEP
            // NO RETRY DELAY
            // NEXT BATCH STARTS IMMEDIATELY

        }


        // ====================================================
        // COMBINE RESULTS
        // ====================================================

        const combinedRawResults =
            batchResearch.flatMap(
                research =>
                    Array.isArray(
                        research?.results
                    )
                        ?
                        research.results
                        :
                        []
            );


        console.log(
            `Daily Brief raw results returned: ${combinedRawResults.length}`
        );


        const cleanResults =
            cleanResearchResults(
                combinedRawResults,
                rankedCandidates
            );


        const deduplicatedResults =
            deduplicateResults(
                cleanResults
            );


        // ====================================================
        // RESULT ORDER
        // ====================================================

        const attentionPriority = {

            HIGH:
                3,

            ELEVATED:
                2,

            NOTABLE:
                1

        };


        const candidateRankMap =
            new Map();


        rankedCandidates.forEach(
            (
                stock,
                index
            ) => {

                candidateRankMap.set(
                    stock.symbol,
                    index
                );

            }
        );


        const rankedResults =
            [
                ...deduplicatedResults
            ]
                .sort(
                    (
                        a,
                        b
                    ) => {

                        const attentionDifference =
                            (
                                attentionPriority[
                                    b.attentionLevel
                                ]
                                ||
                                0
                            )
                            -
                            (
                                attentionPriority[
                                    a.attentionLevel
                                ]
                                ||
                                0
                            );


                        if (
                            attentionDifference !==
                            0
                        ) {

                            return attentionDifference;

                        }


                        const aRank =
                            Math.min(
                                ...a.symbols.map(
                                    symbol =>
                                        candidateRankMap.has(
                                            symbol
                                        )
                                            ?
                                            candidateRankMap.get(
                                                symbol
                                            )
                                            :
                                            999999
                                )
                            );


                        const bRank =
                            Math.min(
                                ...b.symbols.map(
                                    symbol =>
                                        candidateRankMap.has(
                                            symbol
                                        )
                                            ?
                                            candidateRankMap.get(
                                                symbol
                                            )
                                            :
                                            999999
                                )
                            );


                        return (
                            aRank -
                            bRank
                        );

                    }
                );


        const finalResults =
            rankedResults.slice(
                0,
                TOP_X_FACTOR_CANDIDATES
            );


        console.log(
            `Daily Brief final companies included: ${finalResults.length}`
        );

        console.log(
            `Batches completed: ${completedBatches}`
        );

        console.log(
            `Batches failed: ${failedBatches}`
        );

        console.log(
            `Batches timed out: ${timedOutBatches}`
        );

        console.log(
            `Gemini attempts: ${totalGeminiAttempts}`
        );

        console.log(
            "Retries attempted: 0"
        );

        console.log(
            `Candidates successfully researched: ${candidatesActuallyResearched}/${rankedCandidates.length}`
        );


        if (
            completedBatches ===
            0
        ) {

            throw new Error(
                "No Daily Brief research batches completed successfully."
            );

        }


        // ====================================================
        // RESEARCH METADATA
        // ====================================================

        const aiResults = {

            results:
                finalResults,

            researchMeta: {

                candidateSignature,

                researchPromptVersion:
                    RESEARCH_PROMPT_VERSION,

                candidatesReceived:
                    allRankedCandidates.length,

                candidatesSupplied:
                    rankedCandidates.length,

                candidatesSelectedForResearch:
                    rankedCandidates.length,

                candidatesActuallyResearched,

                candidatesNotResearched:
                    Math.max(
                        0,
                        rankedCandidates.length -
                        candidatesActuallyResearched
                    ),

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

                stoppedEarly,

                batchSize:
                    BATCH_SIZE,

                topCandidateLimit:
                    TOP_X_FACTOR_CANDIDATES,

                requestTimeoutSeconds:
                    Math.round(
                        GEMINI_TIMEOUT_MS /
                        1000
                    ),

                attemptsPerBatch:
                    1,

                retryPolicy:
                    "NO_RETRY_CONTINUE_NEXT_BATCH"

            }

        };


        // ====================================================
        // SAFETY FILTER
        // ====================================================

        const combinedText =
            JSON.stringify(
                aiResults
            );


        const prohibitedPatterns = [

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

            /\byou should enter\b/i,
            /\byou should exit\b/i,

            /\binvestors should enter\b/i,
            /\binvestors should exit\b/i,

            /\bbuy this stock\b/i,
            /\bsell this stock\b/i,

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
                "Daily Brief blocked by safety filter."
            );


            return res
                .status(422)
                .json({
                    error:
                        "The Daily Brief research could not be displayed."
                });

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
                candidatesActuallyResearched,

            companiesIncluded:
                finalResults.length,

            aiResults

        });


        const totalRuntime =
            Date.now() -
            functionStartedAt;


        console.log(
            `EdgeBreak Daily Brief completed in ${Math.round(
                totalRuntime /
                1000
            )} seconds.`
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
                    candidatesActuallyResearched,

                companiesIncluded:
                    finalResults.length,

                results:
                    finalResults,

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
                    "Daily Brief research is temporarily unavailable."
            });

    }

}


// ============================================================
// GEMINI RESEARCH — ONE ATTEMPT ONLY
// ============================================================

async function researchBatch(

    candidates,

    briefDate,

    batchNumber,

    functionStartedAt

) {

    console.log(
        `Batch ${batchNumber} research starting — single attempt, no retry.`
    );


    const systemInstruction = `

You are the Fundamental + Supply + Catalyst research engine
for EdgeBreak.

You will receive up to three NASDAQ stocks selected from
EdgeBreak's TOP 12 final X-Factor-ranked Daily Brief candidates.

These companies have already passed EdgeBreak's technical
scanners, deterministic filters, technical ranking and
FINRA-derived X-Factor reranking.

Treat the supplied EdgeBreak ranking and X-Factor context as
established input.

DO NOT perform another technical scan.

DO NOT technically rerank the companies.

DO NOT provide buy, sell or hold recommendations.

DO NOT provide price targets, entry prices or predictions.


YOUR JOB:

Use current Google Search grounding to perform a fast,
evidence-disciplined Fundamental + Supply + Catalyst stress test.

Find the STRONGEST AVAILABLE factual evidence that materially
adds to EdgeBreak's existing technical and X-Factor case.


CRITICAL PRIORITY:

DO NOT try to find every metric for every company.

Do not waste time hunting for a missing float figure, short
interest percentage, ownership change, revenue figure or other
secondary metric.

Prioritise the strongest evidence first.

For each company:

1. Look first for a material current company-specific catalyst
   or development.

2. Then look for the strongest readily available evidence in
   fundamentals, financing, share supply, ownership, short
   positioning or balance-sheet condition.

3. Prefer primary and high-quality sources.

4. Once there is enough reliable evidence to decide whether the
   company deserves inclusion, stop chasing weaker metrics.

5. If a metric cannot be established efficiently and reliably,
   treat it as unavailable and move on.

A company does NOT need every research category completed.

Strong evidence is more important than complete metric coverage.


RESEARCH AREAS:

These are categories to consider, NOT a mandatory checklist.

- Current company-specific catalyst or development

- Revenue / profitability trajectory when materially useful

- Float / share-supply structure when readily available

- Short interest when reliable and material

- Publicly reported institutional participation

- Dilution / financing risk

- Balance-sheet condition and cash pressure

- Credible unusual current trading, company, media or investor
  attention beyond price movement alone


X-FACTOR CONTEXT:

EdgeBreak may supply:

- X-Factor score and label

- structure/timing state

- whether a meaningful off-exchange activity signal exists

- off-exchange activity state and historical percentile

- EdgeBreak reason tags

Treat these as EdgeBreak-derived context.

Do NOT reinterpret off-exchange activity as confirmed buying,
selling, accumulation or distribution.

Do NOT attempt to recreate the X-Factor.


EVIDENCE DISCIPLINE:

- Use only lawful, publicly available information.

- Prefer company filings, investor-relations releases, exchange
  or regulator data, and other credible financial sources.

- Never invent a figure, trend, date, source or causal claim.

- If information is unavailable, move on rather than guessing.

- Contradictory or risky evidence must be acknowledged.

- Do not use phrases such as "absolute confidence",
  "guaranteed", "supply seizure", "forced buying" or
  "multi-bagger".


RECENCY:

Give strongest preference to company-specific developments from
the last 7 days.

You may use developments up to 30 days old when still clearly
relevant.

For reported fundamentals, ownership, short interest, dilution
and balance-sheet data, use the latest reliable reported data
even when older than 30 days.


IMPORTANT EXCLUSION:

Do not include a stock solely because:

- its price moved

- it is near a 52-week high or low

- it has a technically strong chart

- it broke resistance

- it has momentum

- it has a high EdgeBreak X-Factor score

There must ALSO be credible factual evidence beyond price and
technical structure.


Both positive and negative developments may justify further
research.

Inclusion is NOT an endorsement.


ATTENTION LEVEL:

Every included company must receive exactly one of:

HIGH

ELEVATED

NOTABLE


These are research-attention labels, not investment ratings.


HIGH:

Particularly significant or clearly unusual current evidence.


ELEVATED:

Evidence is meaningfully stronger or more unusual than normally
expected for that company.


NOTABLE:

Credible current evidence worth investigating, but not unusually
strong.


Do not force companies into the results.

Most supplied companies may be omitted.

Quality is more important than quantity.


Before including a company ask:

"Ignoring price performance and EdgeBreak's technical/X-Factor
ranking, is there strong, credible factual evidence that
materially adds to the research case?"

If NO, omit it.

Keep every returned field concise.

Return JSON only.

`;


    // ========================================================
    // DATA GIVEN TO GEMINI
    // ========================================================

    const candidatesForGemini =
        candidates.map(
            stock => ({

                symbol:
                    stock.symbol,

                finalEdgeBreakRank:
                    stock.technicalRank,

                scanners:
                    stock.scanners,

                company:
                    stock.company,

                xFactor:
                    stock.xFactor

            })
        );


    const userInstruction = `

Research this batch for the EdgeBreak Daily Brief dated
${briefDate}.

This is research batch ${batchNumber}.

Companies supplied in this batch:

${candidates.length}


These companies are already among EdgeBreak's TOP
${TOP_X_FACTOR_CANDIDATES} final X-Factor-ranked candidates.

Do not perform another technical assessment.

Use Google Search grounding.


PRIORITISE THE STRONGEST AVAILABLE EVIDENCE.

Do NOT try to complete every possible metric.

Do NOT spend time chasing unavailable secondary data.


Prioritise:

- a material current catalyst or company-specific development

- the strongest useful recent fundamental evidence

- material dilution, financing or balance-sheet risk

- meaningful share-supply or short-positioning evidence

- meaningful institutional evidence

- unusual current attention supported by credible facts


If one or two strong primary-source facts clearly establish the
research case, use them and move on.

If a metric cannot be reliably found quickly, treat it as
unavailable.

Only include companies that genuinely satisfy the criteria.


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

Array of supplied ticker symbols only.


companyName:

Current company name.


scanners:

Use the scanner labels supplied.


attentionLevel:

Exactly HIGH, ELEVATED or NOTABLE.


headline:

One short factual headline.


summary:

Maximum two concise factual sentences.


currentDevelopment:

One concise sentence describing the strongest current catalyst,
fundamental change, financing/share-supply factor, positioning
factor, risk flag or unusual activity found.


whyIncluded:

One concise sentence explaining why the strongest factual
evidence materially adds to EdgeBreak's existing technical and
X-Factor case.


developmentDate:

Use YYYY-MM-DD when reliably established.

Otherwise return an empty string.


sourceNames:

Principal credible source names only.

Do not invent sources.


FINAL TEST:

Ignoring price performance and EdgeBreak's existing technical
and X-Factor ranking, is there credible factual evidence that
materially adds to the research case?

If NO:

OMIT IT.


CANDIDATES:

${JSON.stringify(
    candidatesForGemini,
    null,
    2
)}

Return JSON only.

`;


    // ========================================================
    // GEMINI REQUEST
    // ========================================================

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

        tools: [
            {
                google_search: {}
            }
        ],

        generationConfig: {

            maxOutputTokens:
                3500,

            responseMimeType:
                "application/json",

            temperature:
                0.15

        }

    };


    // ========================================================
    // TIME BUDGET
    // ========================================================

    const elapsed =
        Date.now() -
        functionStartedAt;


    const remaining =
        MAX_RESEARCH_TIME_MS -
        elapsed;


    if (
        remaining <
        FUNCTION_SAFETY_MARGIN_MS +
        5000
    ) {

        throw new Error(
            `Batch ${batchNumber} cancelled because the runtime safety limit was reached.`
        );

    }


    const allowedTimeout =
        Math.max(

            5000,

            Math.min(

                GEMINI_TIMEOUT_MS,

                remaining -
                FUNCTION_SAFETY_MARGIN_MS

            )

        );


    console.log(
        `Batch ${batchNumber} Gemini single attempt. Timeout: ${Math.round(
            allowedTimeout /
            1000
        )}s`
    );


    // ========================================================
    // GEMINI FETCH
    // ========================================================

    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => {

                console.warn(
                    `Batch ${batchNumber} exceeded ${allowedTimeout}ms. Aborting. No retry.`
                );

                controller.abort();

            },
            allowedTimeout
        );


    const requestStartedAt =
        Date.now();


    let geminiResponse;


    try {

        geminiResponse =
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


        console.log(
            `Batch ${batchNumber} Gemini responded in ${Math.round(
                (
                    Date.now() -
                    requestStartedAt
                )
                /
                1000
            )}s with HTTP ${geminiResponse.status}.`
        );

    }
    catch (fetchError) {

        if (
            fetchError?.name ===
            "AbortError"
        ) {

            const timeoutError =
                new Error(
                    `Batch ${batchNumber} Gemini request timed out.`
                );


            timeoutError.code =
                "GEMINI_TIMEOUT";


            throw timeoutError;

        }


        console.error(
            `Gemini Batch ${batchNumber} network error:`,
            fetchError
        );


        throw fetchError;

    }
    finally {

        clearTimeout(
            timeout
        );

    }


    // ========================================================
    // GEMINI HTTP ERROR
    // ========================================================

    if (!geminiResponse.ok) {

        const errorText =
            await safeReadResponseText(
                geminiResponse
            );


        console.error(
            `Gemini Batch ${batchNumber} Error:`,
            geminiResponse.status,
            errorText
        );


        throw new Error(
            `Batch ${batchNumber} failed. Gemini returned ${geminiResponse.status}.`
        );

    }


    // ========================================================
    // GEMINI RESPONSE
    // ========================================================

    const geminiData =
        await geminiResponse.json();


    const rawText =
        geminiData
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
            `Batch ${batchNumber} returned no research.`
        );

    }


    let research;


    // ========================================================
    // JSON PARSE
    // ========================================================

    try {

        research =
            JSON.parse(
                cleanJsonText(
                    rawText
                )
            );

    }
    catch (error) {

        console.warn(
            `Batch ${batchNumber} JSON parse failed. Attempting recovery...`
        );


        const recoveredResults =
            recoverGeminiResults(
                rawText
            );


        if (
            recoveredResults.length ===
            0
        ) {

            throw new Error(
                `Batch ${batchNumber} returned invalid JSON.`
            );

        }


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
            `Batch ${batchNumber} returned an invalid result.`
        );

    }


    console.log(
        `Batch ${batchNumber} complete: ${research.results.length} included.`
    );


    return research;

}


// ============================================================
// SAFE RESPONSE TEXT
// ============================================================

async function safeReadResponseText(
    response
) {

    try {

        return await response.text();

    }
    catch {

        return (
            "Unable to read Gemini error response."
        );

    }

}


// ============================================================
// CLEAN JSON
// ============================================================

function cleanJsonText(
    text
) {

    let cleaned =
        String(
            text ||
            ""
        ).trim();


    cleaned =
        cleaned.replace(
            /^```json\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /^```\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /\s*```$/,
            ""
        );


    const firstBrace =
        cleaned.indexOf(
            "{"
        );


    const lastBrace =
        cleaned.lastIndexOf(
            "}"
        );


    if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
    ) {

        cleaned =
            cleaned.slice(
                firstBrace,
                lastBrace + 1
            );

    }


    return cleaned;

}


// ============================================================
// RECOVER PARTIAL GEMINI JSON
// ============================================================

function recoverGeminiResults(
    rawText
) {

    if (
        typeof rawText !==
            "string" ||
        !rawText.trim()
    ) {

        return [];

    }


    const resultsKeyIndex =
        rawText.indexOf(
            '"results"'
        );


    if (
        resultsKeyIndex ===
        -1
    ) {

        return [];

    }


    const arrayStart =
        rawText.indexOf(
            "[",
            resultsKeyIndex
        );


    if (
        arrayStart ===
        -1
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


    for (
        let index =
            arrayStart + 1;
        index < rawText.length;
        index++
    ) {

        const character =
            rawText[index];


        if (insideString) {

            if (escaping) {

                escaping =
                    false;

                continue;

            }


            if (
                character ===
                "\\"
            ) {

                escaping =
                    true;

                continue;

            }


            if (
                character ===
                '"'
            ) {

                insideString =
                    false;

            }


            continue;

        }


        if (
            character ===
            '"'
        ) {

            insideString =
                true;

            continue;

        }


        if (
            character ===
            "{"
        ) {

            if (
                braceDepth ===
                0
            ) {

                objectStart =
                    index;

            }


            braceDepth++;

            continue;

        }


        if (
            character ===
            "}"
        ) {

            if (
                braceDepth >
                0
            ) {

                braceDepth--;

            }


            if (
                braceDepth ===
                0 &&
                objectStart !==
                -1
            ) {

                const objectText =
                    rawText.slice(
                        objectStart,
                        index + 1
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
                catch {

                    console.warn(
                        "Skipped one malformed Daily Brief result during recovery."
                    );

                }


                objectStart =
                    -1;

            }

        }

    }


    return recovered;

}


// ============================================================
// CLEAN RESEARCH RESULTS
// ============================================================

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


    const cleanResults =
        [];


    for (
        const item
        of rawResults
    ) {

        if (
            !item ||
            typeof item !==
                "object"
        ) {

            continue;

        }


        const symbols =
            Array.isArray(
                item.symbols
            )
                ?
                [
                    ...new Set(

                        item.symbols

                            .map(
                                symbol =>
                                    String(
                                        symbol
                                    )
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
                :
                [];


        if (
            symbols.length ===
            0
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
                ?
                [
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
                :
                [];


        const sourceNames =
            Array.isArray(
                item.sourceNames
            )
                ?
                [
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
                :
                [];


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


// ============================================================
// DEDUPLICATE
// ============================================================

function deduplicateResults(
    results
) {

    const seenSymbols =
        new Set();


    const finalResults =
        [];


    for (
        const result
        of results
    ) {

        const newSymbols =
            result.symbols.filter(
                symbol =>
                    !seenSymbols.has(
                        symbol
                    )
            );


        if (
            newSymbols.length ===
            0
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


// ============================================================
// CANDIDATE SIGNATURE
// ============================================================
//
// Includes:
// symbol
// final EdgeBreak rank
// X-Factor score
// X-Factor label
//
// So changing the X-Factor ranking invalidates an old cache.
//

function createCandidateSignature(
    rankedCandidates
) {

    const signatureBody =
        rankedCandidates

            .map(
                stock => {

                    const xScore =
                        stock.xFactor
                            ?.score
                        ??
                        "";


                    const xLabel =
                        stock.xFactor
                            ?.label
                        ??
                        "";


                    return [

                        stock.symbol,

                        stock.technicalRank,

                        xScore,

                        xLabel

                    ].join(":");

                }
            )

            .join("|");


    return (
        `${RESEARCH_PROMPT_VERSION}:` +
        signatureBody
    );

}


// ============================================================
// GET CACHE
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
            Array.isArray(
                rows
            ) &&
            rows.length > 0 &&
            rows[0].ai_results
        ) {

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
                    `Daily Brief cache ignored because candidate order, X-Factor context or prompt changed: ${briefDate}`
                );


                return null;

            }


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


// ============================================================
// SAVE CACHE
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


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "Daily Brief Cache Save Error:",
                errorText
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
            "Daily Brief Cache Save Error:",
            error
        );


        return false;

    }

}


// ============================================================
// NEW YORK DATE
// ============================================================

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
// CLEAN TEXT FIELD
// ============================================================

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