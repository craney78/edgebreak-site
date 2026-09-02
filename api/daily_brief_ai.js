const BATCH_SIZE = 3;
const GEMINI_TIMEOUT_MS = 45000;
const GEMINI_MAX_ATTEMPTS = 2;
const MAX_RESEARCH_TIME_MS = 270000;
const EARLY_STOP_RESULT_COUNT = 12;
const MIN_TIME_FOR_NEW_ATTEMPT_MS = 55000;

const RESEARCH_PROMPT_VERSION =
    "fundamental-supply-catalyst-v1";


export default async function handler(req, res) {

    res.setHeader(
        "Cache-Control",
        "no-store"
    );


    if (req.method !== "POST") {

        return res
            .status(405)
            .json({
                error: "Method not allowed."
            });

    }


    if (!process.env.GEMINI_API_KEY) {

        return res
            .status(500)
            .json({
                error: "Daily Brief AI is not configured."
            });

    }


    if (
        !process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_KEY
    ) {

        return res
            .status(500)
            .json({
                error: "Daily Brief cache is not configured."
            });

    }


    const functionStartedAt =
        Date.now();


    try {

        const {
            candidates
        } =
            req.body || {};


        if (
            !Array.isArray(candidates) ||
            candidates.length === 0
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "No Daily Brief candidates were provided."
                });

        }


        if (candidates.length > 150) {

            return res
                .status(400)
                .json({
                    error:
                        "Too many Daily Brief candidates were provided."
                });

        }


        const candidateScanDate =
            String(
                candidates[0]?.scan_date ||
                candidates[0]?.scanDate ||
                candidates[0]?.pre_breakout?.scan_date ||
                candidates[0]?.pre_breakout?.scanDate ||
                candidates[0]?.breakout?.scan_date ||
                candidates[0]?.breakout?.scanDate ||
                ""
            ).trim();


        const suppliedScanDate =
            String(
                req.body?.scanDate ||
                ""
            ).trim();


        let briefDate;


        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                candidateScanDate
            )
        ) {

            briefDate =
                candidateScanDate;

            console.log(
                `EdgeBreak Daily Brief using candidate scanner date: ${briefDate}`
            );

        }
        else if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                suppliedScanDate
            )
        ) {

            briefDate =
                suppliedScanDate;

            console.log(
                `EdgeBreak Daily Brief using supplied scanner date: ${briefDate}`
            );

        }
        else {

            briefDate =
                getNewYorkDate();

            console.warn(
                `EdgeBreak Daily Brief scanner date unavailable. Falling back to New York date: ${briefDate}`
            );

        }


        console.log(
            `EdgeBreak Daily Brief session date: ${briefDate}`
        );


        const cleanCandidates =
            candidates

                .filter(
                    stock =>
                        stock &&
                        stock.symbol
                )

                .map(
                    (
                        stock,
                        index
                    ) => ({

                        symbol:
                            String(
                                stock.symbol
                            )
                                .trim()
                                .toUpperCase(),

                        technicalRank:
                            Number.isFinite(
                                Number(
                                    stock.final_daily_brief_rank ??
                                    stock.finalDailyBriefRank ??
                                    stock.daily_brief_rank ??
                                    stock.dailyBriefRank ??
                                    stock.pre_finra_rank ??
                                    stock.preFinraRank ??
                                    stock.technical_rank ??
                                    stock.technicalRank ??
                                    stock.rank_position ??
                                    stock.rankPosition
                                )
                            )
                                ?
                                Number(
                                    stock.final_daily_brief_rank ??
                                    stock.finalDailyBriefRank ??
                                    stock.daily_brief_rank ??
                                    stock.dailyBriefRank ??
                                    stock.pre_finra_rank ??
                                    stock.preFinraRank ??
                                    stock.technical_rank ??
                                    stock.technicalRank ??
                                    stock.rank_position ??
                                    stock.rankPosition
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

                        }

                    })
                );


        if (cleanCandidates.length === 0) {

            return res
                .status(400)
                .json({
                    error:
                        "No valid Daily Brief candidates were provided."
                });

        }


        const seenCandidateSymbols =
            new Set();


        const rankedCandidates =
            cleanCandidates

                .filter(stock => {

                    if (
                        seenCandidateSymbols.has(
                            stock.symbol
                        )
                    ) {

                        return false;

                    }


                    seenCandidateSymbols.add(
                        stock.symbol
                    );

                    return true;

                })

                .sort(
                    (a, b) =>
                        (
                            a.technicalRank -
                            b.technicalRank
                        ) ||
                        (
                            a.suppliedOrder -
                            b.suppliedOrder
                        )
                );


        const candidateSignature =
            createCandidateSignature(
                rankedCandidates
            );


        console.log(
            `Daily Brief candidates supplied: ${candidates.length}`
        );

        console.log(
            `Daily Brief unique ranked candidates: ${rankedCandidates.length}`
        );

        console.log(
            `Daily Brief ranked order: ${rankedCandidates.map(stock => stock.symbol).join(", ")}`
        );

        console.log(
            `Daily Brief candidate signature: ${candidateSignature}`
        );


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
                            ?.researchMeta ||
                        null,

                    nasdaqToday:
                        cachedBrief
                            .nasdaq_today ||
                        null,

                    marketConditions:
                        cachedBrief
                            .market_conditions ||
                        null,

                    scannerActivity:
                        cachedBrief
                            .scanner_activity ||
                        null

                });

        }


        console.log(
            `EdgeBreak Daily Brief CACHE MISS: ${briefDate}`
        );


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
            `Daily Brief batches required: ${batches.length}`
        );


        batches.forEach(
            (batch, index) => {

                console.log(
                    `Daily Brief Batch ${index + 1}: ${batch.map(stock => stock.symbol).join(", ")}`
                );

            }
        );


        const batchResearch =
            [];


        let completedBatches =
            0;

        let failedBatches =
            0;

        let stoppedEarly =
            false;

        let candidatesActuallyResearched =
            0;

        let totalGeminiAttempts =
            0;

        let retriedBatches =
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


            const currentRawResults =
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


            const currentCleanResults =
                cleanResearchResults(
                    currentRawResults,
                    rankedCandidates
                );


            const currentDeduplicated =
                deduplicateResults(
                    currentCleanResults
                );


            if (
                currentDeduplicated.length >=
                EARLY_STOP_RESULT_COUNT
            ) {

                console.log(
                    `Daily Brief early-stop threshold reached: ${currentDeduplicated.length} qualified companies.`
                );

                stoppedEarly =
                    true;

                break;

            }


            const elapsed =
                Date.now() -
                functionStartedAt;


            const remainingBudget =
                MAX_RESEARCH_TIME_MS -
                elapsed;


            console.log(
                `Daily Brief elapsed time before Batch ${batchNumber}: ${Math.round(elapsed / 1000)}s`
            );


            if (
                remainingBudget <
                MIN_TIME_FOR_NEW_ATTEMPT_MS
            ) {

                console.warn(
                    `Daily Brief stopping before Batch ${batchNumber}. Runtime safety limit approaching.`
                );

                stoppedEarly =
                    true;

                break;

            }


            console.log(
                `Daily Brief starting Batch ${batchNumber}/${batches.length}...`
            );

            console.log(
                `Daily Brief Batch ${batchNumber} symbols: ${batch.map(stock => stock.symbol).join(", ")}`
            );


            let batchSucceeded =
                false;

            let successfulResearch =
                null;

            let attemptsUsed =
                0;


            for (
                let attempt = 1;
                attempt <= GEMINI_MAX_ATTEMPTS;
                attempt++
            ) {

                const attemptElapsed =
                    Date.now() -
                    functionStartedAt;


                const attemptRemaining =
                    MAX_RESEARCH_TIME_MS -
                    attemptElapsed;


                if (
                    attemptRemaining <
                    MIN_TIME_FOR_NEW_ATTEMPT_MS
                ) {

                    console.warn(
                        `Daily Brief Batch ${batchNumber} Attempt ${attempt} not started because runtime safety limit is approaching.`
                    );

                    break;

                }


                attemptsUsed++;
                totalGeminiAttempts++;


                if (attempt > 1) {

                    console.warn(
                        `Daily Brief Batch ${batchNumber} retrying with Gemini. Attempt ${attempt}/${GEMINI_MAX_ATTEMPTS}.`
                    );

                }


                try {

                    const research =
                        await researchBatch(

                            batch,

                            briefDate,

                            batchNumber,

                            functionStartedAt,

                            attempt

                        );


                    successfulResearch =
                        research;

                    batchSucceeded =
                        true;

                    break;

                }
                catch (batchError) {

                    console.error(
                        `Daily Brief Batch ${batchNumber} Attempt ${attempt}/${GEMINI_MAX_ATTEMPTS} failed:`,
                        batchError?.message ||
                        batchError
                    );


                    if (
                        attempt <
                        GEMINI_MAX_ATTEMPTS
                    ) {

                        const retryElapsed =
                            Date.now() -
                            functionStartedAt;


                        const retryRemaining =
                            MAX_RESEARCH_TIME_MS -
                            retryElapsed;


                        if (
                            retryRemaining >=
                            MIN_TIME_FOR_NEW_ATTEMPT_MS
                        ) {

                            await sleep(750);

                        }

                    }

                }

            }


            if (
                batchSucceeded &&
                successfulResearch
            ) {

                batchResearch.push(
                    successfulResearch
                );

                completedBatches++;

                candidatesActuallyResearched +=
                    batch.length;


                if (attemptsUsed > 1) {

                    retriedBatches++;

                }


                console.log(
                    `Daily Brief Batch ${batchNumber}/${batches.length} finished successfully after ${attemptsUsed} attempt(s).`
                );

                console.log(
                    `Daily Brief successfully researched candidates so far: ${candidatesActuallyResearched}`
                );

            }
            else {

                failedBatches++;


                batchResearch.push({

                    companiesReviewed:
                        0,

                    companiesIncluded:
                        0,

                    results:
                        []

                });


                console.error(
                    `Daily Brief Batch ${batchNumber}/${batches.length} failed after ${attemptsUsed} attempt(s). ${batch.length} candidates were NOT counted as researched.`
                );

            }


            const hasAnotherBatch =
                index <
                batches.length - 1;


            if (hasAnotherBatch) {

                await sleep(500);

            }

        }


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


        console.log(
            `Daily Brief companies qualified before ranking: ${deduplicatedResults.length}`
        );


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
            (stock, index) => {

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
                .sort((a, b) => {

                    const attentionDifference =
                        (
                            attentionPriority[
                                b.attentionLevel
                            ] ||
                            0
                        )
                        -
                        (
                            attentionPriority[
                                a.attentionLevel
                            ] ||
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

                });


        const finalResults =
            rankedResults.slice(
                0,
                12
            );


        console.log(
            `Daily Brief final companies included after 12-stock cap: ${finalResults.length}`
        );

        console.log(
            `Daily Brief batches completed: ${completedBatches}`
        );

        console.log(
            `Daily Brief batches failed: ${failedBatches}`
        );

        console.log(
            `Daily Brief batches retried successfully: ${retriedBatches}`
        );

        console.log(
            `Daily Brief total Gemini attempts: ${totalGeminiAttempts}`
        );

        console.log(
            `Daily Brief stopped early: ${stoppedEarly}`
        );

        console.log(
            `Daily Brief candidates successfully researched: ${candidatesActuallyResearched}/${rankedCandidates.length}`
        );


        if (completedBatches === 0) {

            throw new Error(
                "No Daily Brief research batches completed successfully."
            );

        }


        const aiResults = {

            results:
                finalResults,

            researchMeta: {

                candidateSignature,

                researchPromptVersion:
                    RESEARCH_PROMPT_VERSION,

                candidatesSupplied:
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

                retriedBatches,

                totalGeminiAttempts,

                stoppedEarly,

                batchSize:
                    BATCH_SIZE,

                requestTimeoutSeconds:
                    Math.round(
                        GEMINI_TIMEOUT_MS /
                        1000
                    ),

                attemptsPerBatch:
                    GEMINI_MAX_ATTEMPTS

            }

        };


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
                "Daily Brief blocked by safety filter: direct advice or promised result detected."
            );


            return res
                .status(422)
                .json({
                    error:
                        "The Daily Brief research could not be displayed."
                });

        }


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
            `EdgeBreak Daily Brief completed in ${Math.round(totalRuntime / 1000)} seconds.`
        );


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

                    candidateSignature,

                    researchPromptVersion:
                        RESEARCH_PROMPT_VERSION,

                    candidatesSupplied:
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

                    retriedBatches,

                    totalGeminiAttempts,

                    stoppedEarly,

                    batchSize:
                        BATCH_SIZE,

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


async function researchBatch(

    candidates,

    briefDate,

    batchNumber,

    functionStartedAt,

    attemptNumber

) {

    console.log(
        `Daily Brief Batch ${batchNumber} research starting — Attempt ${attemptNumber}/${GEMINI_MAX_ATTEMPTS}...`
    );


    const systemInstruction = `

You are the Fundamental + Supply + Catalyst research engine
for EdgeBreak.

You will receive a small group of NASDAQ stocks that have
already passed EdgeBreak's technical stock scanners,
deterministic ranking, liquidity filters, industry filters
and FINRA-derived X-Factor reranking.

The companies are supplied in final EdgeBreak ranking order.

EdgeBreak has already assessed technical structure and
off-exchange participation. Treat that ranking as established
input. Do not override it or attempt to rerank the companies
technically.

DO NOT perform another technical scan.

DO NOT decide whether a stock is a good investment.

DO NOT provide buy, sell or hold recommendations.

DO NOT provide price targets, entry prices or predictions.

Your task is to investigate whether each supplied company has
credible additional evidence in its fundamentals, share-supply
structure, ownership or short positioning, balance sheet, or
current company-specific developments that strengthens the
case for further research beyond the technical chart alone.

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


RESEARCH FRAMEWORK:

Investigate every supplied company across the following areas.
Use the latest reliable public information available.

1. CURRENT CATALYST

Look for credible company-specific developments such as recent
earnings or guidance, significant contracts, partnerships,
acquisitions, strategic transactions, FDA or regulatory events,
clinical results, product announcements, material SEC filings,
analyst developments, management changes or other meaningful
current events.

2. REVENUE TRAJECTORY

Review approximately the latest four reported quarters when
reliable figures are available. Determine whether revenue is
accelerating, stable, inconsistent or deteriorating. Do not
describe ordinary seasonality as acceleration without evidence.

3. PROFITABILITY TRAJECTORY

Review recent net income, operating income or operating-loss
performance. For an unprofitable company, determine whether
losses are improving or worsening. Do not reject a company only
because it is currently unprofitable.

4. FLOAT / SHARE-SUPPLY STRUCTURE

Find reliable public-float or tradable-share information where
available. Determine whether supply is relatively constrained,
moderate or very large compared with the company's normal
liquidity and activity. Low float is a risk factor as well as a
possible source of responsiveness; never present it as
automatically positive.

5. SHORT-INTEREST PRESSURE

Find current short interest and preferably short interest as a
percentage of float. Determine whether it appears materially
elevated, moderate or insignificant. Do not predict a short
squeeze.

6. INSTITUTIONAL PARTICIPATION

Look for the latest publicly reported institutional ownership
and meaningful recent changes in holdings. Distinguish reported
ownership from speculation. Do not call public institutional
filings insider information.

7. DILUTION / ADDITIONAL SHARE-SUPPLY RISK

Check for recent offerings, ATM programs, shelf registrations,
warrants, convertibles or material increases in shares
outstanding. Treat meaningful financing or dilution risk as an
important negative flag.

8. BALANCE-SHEET / FINANCING CONDITION

Especially for smaller companies, assess available cash, debt,
cash burn and obvious near-term financing pressure using the
latest reliable filings or reports.

9. UNUSUAL CURRENT ATTENTION

Look for credible evidence of unusually high or increasing
trading activity, unusual recent volume, or a material increase
in media or investor attention. Price movement alone is not
evidence.

EVIDENCE DISCIPLINE:

- Use only lawful, publicly available information.
- Prefer company filings, investor-relations releases, exchange
  or regulator data, and other credible financial sources.
- Never invent a figure, trend, date, source or causal claim.
- If a metric cannot be reliably established, treat it as
  unavailable rather than guessing.
- A company does not need every metric to be available.
- Contradictory, deteriorating or risky evidence must be
  acknowledged and may justify omission.
- Do not use phrases such as "absolute confidence", "guaranteed",
  "supply seizure", "forced buying" or "multi-bagger".


RECENCY:

Give strongest preference to company-specific developments
from the last 7 days.

You may consider developments up to 30 days old when they
are clearly still relevant to current market attention.

For revenue, profitability, float, short interest, institutional
ownership, dilution and balance-sheet analysis, use the latest
reliable reported data even when the underlying filing is older
than 30 days. Make clear that these are reported fundamentals or
positioning data, not breaking news.

Older company events should normally not justify inclusion by
themselves.


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

There must ALSO be credible evidence from at least one of:

- improving or unusually strong recent business performance
- meaningful share-supply, short-interest or institutional
  positioning characteristics
- a current company-specific catalyst or significant news
- a material corporate, financial, regulatory, clinical or
  strategic development
- unusual or materially increased trading, market or media
  attention

Stronger inclusion normally requires more than one useful piece
of evidence, or one clearly material current development.

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

These labels describe the strength and significance of the
additional factual evidence found beyond EdgeBreak's existing
technical and participation ranking.

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

"Ignoring recent price performance alone, is there credible
current evidence in the company's fundamentals, share-supply
structure, ownership or short positioning, balance sheet,
corporate developments or market participation that materially
adds to the EdgeBreak technical case?"

If the answer is NO, omit the company.

Keep every returned field concise.

Return JSON only.

`;


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
                    stock.company

            })
        );


    const userInstruction = `

Research this group of NASDAQ companies for the EdgeBreak
Daily Brief dated ${briefDate}.

This is research batch ${batchNumber}.

Companies supplied in this batch:

${candidates.length}

These companies have ALREADY passed EdgeBreak's technical
scanners and deterministic filtering.

Do not perform another technical assessment.

Perform the Fundamental + Supply + Catalyst stress test from
the system instruction using Google Search grounding.

For each company, investigate:

- current catalyst
- recent revenue trajectory
- recent profitability trajectory
- float / share-supply structure
- short interest, preferably as a percentage of float
- publicly reported institutional participation or change
- dilution and additional share-supply risk
- balance-sheet and financing condition
- unusual current trading, media or investor attention

Use unavailable information as unavailable. Never guess.

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
One short factual headline.

summary:
Maximum two concise factual sentences.

currentDevelopment:
One concise factual sentence describing the strongest current
catalyst, fundamental change, share-supply factor, positioning
factor, risk flag or unusual activity found.

whyIncluded:
One concise sentence explaining which combination of factual
evidence strengthens the case for further research beyond the
technical chart alone. Mention a material risk flag when one is
central to the assessment.

developmentDate:
Use YYYY-MM-DD when reliably established.

Otherwise return an empty string.

sourceNames:
Return only the principal credible source names.

Do not invent sources.


FINAL TEST FOR EVERY RESULT:

Ignoring recent price performance alone, is there credible
current evidence in the company's fundamentals, share-supply
structure, ownership or short positioning, balance sheet,
corporate developments or market participation that materially
adds to the EdgeBreak technical case?

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
                4000,

            responseMimeType:
                "application/json",

            temperature:
                0.15

        }

    };


    const overallElapsed =
        Date.now() -
        functionStartedAt;


    const overallRemaining =
        MAX_RESEARCH_TIME_MS -
        overallElapsed;


    if (overallRemaining < 15000) {

        throw new Error(
            `Daily Brief Batch ${batchNumber} cancelled because runtime safety limit was reached.`
        );

    }


    console.log(
        `Daily Brief Batch ${batchNumber} Gemini attempt ${attemptNumber}/${GEMINI_MAX_ATTEMPTS}`
    );


    const controller =
        new AbortController();


    const allowedTimeout =
        Math.max(

            5000,

            Math.min(

                GEMINI_TIMEOUT_MS,

                overallRemaining -
                10000

            )

        );


    const requestStartedAt =
        Date.now();


    const timeout =
        setTimeout(
            () => {

                console.warn(
                    `Daily Brief Batch ${batchNumber} Attempt ${attemptNumber} Gemini request exceeded ${allowedTimeout}ms. Aborting.`
                );

                controller.abort();

            },
            allowedTimeout
        );


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
                            process.env.GEMINI_API_KEY

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
            `Daily Brief Batch ${batchNumber} Attempt ${attemptNumber} Gemini responded in ${Math.round((Date.now() - requestStartedAt) / 1000)}s with HTTP ${geminiResponse.status}.`
        );

    }
    catch (fetchError) {

        if (
            fetchError?.name ===
            "AbortError"
        ) {

            console.warn(
                `Daily Brief Batch ${batchNumber} Attempt ${attemptNumber} timed out after ${Math.round(allowedTimeout / 1000)} seconds.`
            );


            throw new Error(
                `Daily Brief Batch ${batchNumber} Gemini request timed out.`
            );

        }


        console.error(
            `Gemini Daily Brief Batch ${batchNumber} Attempt ${attemptNumber} network error:`,
            fetchError
        );


        throw fetchError;

    }
    finally {

        clearTimeout(
            timeout
        );

    }


    if (!geminiResponse.ok) {

        const errorText =
            await safeReadResponseText(
                geminiResponse
            );


        console.error(
            `Gemini Daily Brief Batch ${batchNumber} Attempt ${attemptNumber} Error:`,
            geminiResponse.status,
            errorText
        );


        throw new Error(
            `Daily Brief Batch ${batchNumber} failed. Gemini returned ${geminiResponse.status}.`
        );

    }


    console.log(
        `Daily Brief Batch ${batchNumber} Attempt ${attemptNumber} Gemini request succeeded.`
    );


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

        console.warn(
            `Gemini Daily Brief Batch ${batchNumber} Attempt ${attemptNumber} returned no text.`
        );


        throw new Error(
            `Daily Brief Batch ${batchNumber} returned no research.`
        );

    }


    let research;


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
            `Daily Brief Batch ${batchNumber} normal JSON parse failed. Attempting recovery...`
        );


        const recoveredResults =
            recoverGeminiResults(
                rawText
            );


        if (recoveredResults.length === 0) {

            console.error(
                `Daily Brief Batch ${batchNumber} JSON recovery failed.`
            );


            throw new Error(
                `Daily Brief Batch ${batchNumber} returned invalid JSON.`
            );

        }


        console.log(
            `Daily Brief Batch ${batchNumber} recovered ${recoveredResults.length} complete results.`
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
            `Daily Brief Batch ${batchNumber} returned an invalid result.`
        );

    }


    console.log(
        `Daily Brief Batch ${batchNumber} complete: ${research.results.length} included`
    );


    return research;

}


async function safeReadResponseText(
    response
) {

    try {

        return await response.text();

    }
    catch (error) {

        return (
            "Unable to read Gemini error response."
        );

    }

}


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


function recoverGeminiResults(
    rawText
) {

    if (
        typeof rawText !== "string" ||
        !rawText.trim()
    ) {

        return [];

    }


    const resultsKeyIndex =
        rawText.indexOf(
            '"results"'
        );


    if (resultsKeyIndex === -1) {

        return [];

    }


    const arrayStart =
        rawText.indexOf(
            "[",
            resultsKeyIndex
        );


    if (arrayStart === -1) {

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
        let index = arrayStart + 1;
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


            if (character === "\\") {

                escaping =
                    true;

                continue;

            }


            if (character === '"') {

                insideString =
                    false;

            }


            continue;

        }


        if (character === '"') {

            insideString =
                true;

            continue;

        }


        if (character === "{") {

            if (braceDepth === 0) {

                objectStart =
                    index;

            }


            braceDepth++;

            continue;

        }


        if (character === "}") {

            if (braceDepth > 0) {

                braceDepth--;

            }


            if (
                braceDepth === 0 &&
                objectStart !== -1
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
                        typeof parsedObject === "object" &&
                        !Array.isArray(parsedObject)
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


    for (const item of rawResults) {

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


        if (symbols.length === 0) {

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


function deduplicateResults(
    results
) {

    const seenSymbols =
        new Set();


    const finalResults =
        [];


    for (const result of results) {

        const newSymbols =
            result.symbols.filter(
                symbol =>
                    !seenSymbols.has(
                        symbol
                    )
            );


        if (newSymbols.length === 0) {

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


function createCandidateSignature(
    rankedCandidates
) {

    const rankedSymbols =
        rankedCandidates

            .map(
                stock =>
                    stock.symbol
            )

            .filter(Boolean)

            .join("|");


    return (
        `${RESEARCH_PROMPT_VERSION}:` +
        rankedSymbols
    );

}


async function getCachedBrief(

    briefDate,

    candidateSignature

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
            Array.isArray(rows) &&
            rows.length > 0 &&
            rows[0].ai_results
        ) {

            const cachedSignature =
                String(
                    rows[0]
                        ?.ai_results
                        ?.researchMeta
                        ?.candidateSignature ||
                    ""
                ).trim();


            if (
                cachedSignature !==
                candidateSignature
            ) {

                console.log(
                    `EdgeBreak Daily Brief cache ignored because the final candidate list or research prompt changed: ${briefDate}`
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


    for (const part of parts) {

        if (part.type !== "literal") {

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


function cleanField(

    value,

    maxLength = 800

) {

    if (typeof value !== "string") {

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