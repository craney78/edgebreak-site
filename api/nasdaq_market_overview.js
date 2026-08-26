// ============================================================
// EDGEBREAK
// NASDAQ END-OF-DAY MARKET OVERVIEW
//
// FILE:
// /api/nasdaq_market_overview.js
//
// IMPORTANT:
//
// This version is deliberately shaped to work with the
// EXISTING EdgeBreak test-page JavaScript.
//
// DO NOT change the test-page JS for this version.
//
// EXISTING FRONT-END EXPECTS:
//
// data.marketDate
//
// overview.marketSummary
//
// overview.nasdaqComposite:
//     changePercent
//     close
//     summary
//
// overview.nasdaq100:
//     changePercent
//     close
//     summary
//
// overview.strongAreas
// overview.weakAreas
//
// overview.marketDrivers
//
// overview.upcomingEvents
//
// overview.takeaway
//
// Scanner counts remain FRONT-END controlled for now.
//
// ============================================================
// IMPORTANT RELIABILITY CHANGE
// ============================================================
//
// Gemini is OPTIONAL enhancement data.
//
// The deterministic Yahoo market data is the core report.
//
// Gemini is now protected by a hard request timeout.
// If Gemini / Google Search grounding is slow or unavailable:
//
// - the Gemini request is aborted
// - the deterministic overview continues
// - fallback AI fields are used
// - the overview is still cached
// - the endpoint still returns successfully
//
// This prevents a Gemini request from holding the Vercel
// function open until Vercel's 300-second runtime timeout.
// ============================================================


const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;


const SUPABASE_URL =
    process.env.SUPABASE_URL;


const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;


// ============================================================
// REQUEST TIMEOUTS
// ============================================================

const YAHOO_TIMEOUT_MS =
    8000;


// Gemini market overview is deliberately short.
//
// If Google Search grounding cannot complete within this
// window, EdgeBreak continues with deterministic data.

const GEMINI_TIMEOUT_MS =
    25000;


// Only one retry is allowed.
//
// Therefore maximum Gemini waiting time is approximately:
//
// 25 sec attempt
// + 2 sec retry delay
// + 25 sec attempt
//
// rather than allowing the whole function to hang for
// 300 seconds.

const GEMINI_MAX_ATTEMPTS =
    2;


const GEMINI_RETRY_DELAY_MS =
    2000;


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
        req.method !== "POST"
    ) {

        return res
            .status(405)
            .json({
                error:
                    "Method not allowed."
            });

    }


    try {

        // ====================================================
        // REPORT DATE
        // ====================================================
        //
        // IMPORTANT:
        //
        // After the US market closes, today's EdgeBreak scanner
        // run may already be complete even though New York has
        // not yet reached midnight.
        //
        // Prefer the scanner / market date supplied by the
        // front-end.
        //
        // Only fall back to the current New York calendar date
        // when no valid date was supplied.
        // ====================================================

        const requestedReportDate =
            String(
                req.body?.marketDate ||
                req.body?.scanDate ||
                req.body?.date ||
                ""
            )
                .trim();


        const reportDate =
            /^\d{4}-\d{2}-\d{2}$/.test(
                requestedReportDate
            )
                ?
                requestedReportDate
                :
                getNewYorkReportDate();


        console.log(
            "NASDAQ Market Overview requested date:",
            requestedReportDate || "NONE"
        );


        console.log(
            "NASDAQ Market Overview using date:",
            reportDate
        );


        // ====================================================
        // CACHE CHECK
        // ====================================================

        const cached =
            await getCachedOverview(
                reportDate
            );


        if (
            cached
        ) {

            console.log(
                "NASDAQ Market Overview CACHE HIT:",
                reportDate
            );


            return res
                .status(200)
                .json({

                    success: true,

                    cached: true,

                    marketDate:
                        reportDate,

                    date:
                        reportDate,

                    overview:
                        cached

                });

        }


        console.log(
            "NASDAQ Market Overview CACHE MISS:",
            reportDate
        );


        // ====================================================
        // DETERMINISTIC MARKET DATA
        // ====================================================

        console.log(
            "NASDAQ Market Overview market data starting..."
        );


        const marketData =
            await getNasdaqMarketData();


        console.log(
            "NASDAQ Market Overview market data complete."
        );


        console.log(
            "NASDAQ Composite:",
            marketData.nasdaqComposite
        );


        console.log(
            "NASDAQ-100:",
            marketData.nasdaq100
        );


        console.log(
            "Strongest monthly areas:",
            marketData.strongestAreas
        );


        console.log(
            "Weakest monthly areas:",
            marketData.weakestAreas
        );


        // ====================================================
        // OPTIONAL GEMINI RESEARCH
        // ====================================================

        let aiResearch =
            null;


        if (
            GEMINI_API_KEY
        ) {

            try {

                console.log(
                    "NASDAQ Market Overview Gemini research starting..."
                );


                aiResearch =
                    await createMarketResearch(
                        marketData,
                        reportDate
                    );


                console.log(
                    "NASDAQ Market Overview Gemini research complete."
                );

            }
            catch (
                error
            ) {

                console.warn(
                    "NASDAQ Market Overview Gemini research unavailable:",
                    error?.message ||
                    error
                );


                /*
                 * IMPORTANT:
                 *
                 * Gemini failure must NEVER kill the
                 * deterministic market overview.
                 */

                aiResearch =
                    null;

            }

        }
        else {

            console.warn(
                "NASDAQ Market Overview Gemini disabled: GEMINI_API_KEY missing."
            );

        }


        // ====================================================
        // GEMINI FALLBACK
        // ====================================================

        if (
            !aiResearch
        ) {

            console.log(
                "NASDAQ Market Overview using deterministic fallback."
            );


            aiResearch =
                createAiFallback();

        }


        // ====================================================
        // BUILD EXACT FRONT-END STRUCTURE
        // ====================================================

        const overview = {

            // =================================================
            // MAIN SUMMARY
            // =================================================

            marketSummary:
                createMarketSummary(
                    marketData
                ),


            // =================================================
            // NASDAQ COMPOSITE
            // =================================================

            nasdaqComposite: {

                changePercent:
                    formatSignedPercent(
                        marketData
                            .nasdaqComposite
                            .percentChange
                    ),

                close:
                    formatNumber(
                        marketData
                            .nasdaqComposite
                            .close
                    ),

                summary:
                    createIndexSummary(
                        "NASDAQ Composite",
                        marketData
                            .nasdaqComposite
                    )

            },


            // =================================================
            // NASDAQ-100
            // =================================================

            nasdaq100: {

                changePercent:
                    formatSignedPercent(
                        marketData
                            .nasdaq100
                            .percentChange
                    ),

                close:
                    formatNumber(
                        marketData
                            .nasdaq100
                            .close
                    ),

                summary:
                    createIndexSummary(
                        "NASDAQ-100",
                        marketData
                            .nasdaq100
                    )

            },


            // =================================================
            // STRONGER AREAS
            // =================================================

            strongAreas:
                createStrongAreaDisplay(
                    marketData
                        .strongestAreas
                ),


            // =================================================
            // WEAKER AREAS
            // =================================================

            weakAreas:
                createWeakAreaDisplay(
                    marketData
                        .weakestAreas
                ),


            // =================================================
            // TODAY'S NOTABLE MOVERS
            //
            // Existing front-end calls this marketDrivers.
            // =================================================

            marketDrivers:
                createMoverDisplay(
                    aiResearch
                ),


            // =================================================
            // IMPORTANT EVENTS AHEAD
            // =================================================

            upcomingEvents:
                createUpcomingEventDisplay(
                    aiResearch
                        .importantEvents
                ),


            // =================================================
            // END-OF-DAY TAKEAWAY
            // =================================================

            takeaway:
                aiResearch
                    .endOfDayTakeaway ||
                createFallbackTakeaway(
                    marketData
                ),


            // =================================================
            // RAW MARKET DATA
            // =================================================

            rawMarketData: {

                nasdaqComposite:
                    marketData
                        .nasdaqComposite,

                nasdaq100:
                    marketData
                        .nasdaq100,

                strongestAreas:
                    marketData
                        .strongestAreas,

                weakestAreas:
                    marketData
                        .weakestAreas

            },


            generatedAt:
                new Date()
                    .toISOString()

        };


        // ====================================================
        // SAVE ONCE-DAILY CACHE
        // ====================================================

        await saveCachedOverview(
            reportDate,
            overview
        );


        console.log(
            "NASDAQ Market Overview completed:",
            reportDate
        );


        // ====================================================
        // SUCCESS
        // ====================================================

        return res
            .status(200)
            .json({

                success: true,

                cached: false,

                marketDate:
                    reportDate,

                date:
                    reportDate,

                overview

            });

    }
    catch (
        error
    ) {

        console.error(
            "NASDAQ Market Overview Error:",
            error
        );


        return res
            .status(500)
            .json({

                success: false,

                error:
                    error?.message ||
                    "Today's NASDAQ Market Overview is temporarily unavailable."

            });

    }

}


// ============================================================
// NEW YORK REPORT DATE
// ============================================================

function getNewYorkReportDate() {

    const formatter =
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
        );


    const parts =
        formatter.formatToParts(
            new Date()
        );


    const values =
        {};


    for (
        const part of
        parts
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
// YAHOO FINANCE HISTORY
// ============================================================

async function getYahooHistory(
    symbol
) {

    const encodedSymbol =
        encodeURIComponent(
            symbol
        );


    const url =
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}` +
        `?range=1mo&interval=1d&includePrePost=false&events=div%2Csplits`;


    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            YAHOO_TIMEOUT_MS
        );


    try {

        const response =
            await fetch(
                url,
                {

                    method:
                        "GET",

                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 EdgeBreak Market Research",

                        "Accept":
                            "application/json"

                    },

                    signal:
                        controller.signal

                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `Yahoo request failed for ${symbol}: ${response.status}`
            );

        }


        const data =
            await response.json();


        const result =
            data?.chart?.result?.[0];


        if (
            !result
        ) {

            throw new Error(
                `No Yahoo market data returned for ${symbol}.`
            );

        }


        const meta =
            result.meta ||
            {};


        const quote =
            result.indicators
                ?.quote?.[0] ||
            {};


        const timestamps =
            result.timestamp ||
            [];


        const closes =
            quote.close ||
            [];


        const validRows =
            [];


        for (
            let i = 0;
            i < timestamps.length;
            i++
        ) {

            const close =
                Number(
                    closes[i]
                );


            if (
                Number.isFinite(
                    close
                )
            ) {

                validRows.push({

                    timestamp:
                        timestamps[i],

                    close

                });

            }

        }


        if (
            validRows.length < 2
        ) {

            throw new Error(
                `Insufficient Yahoo history for ${symbol}.`
            );

        }


        const latest =
            validRows[
                validRows.length - 1
            ];


        const previous =
            validRows[
                validRows.length - 2
            ];


        const first =
            validRows[0];


        // ====================================================
        // DAILY MOVE
        // ====================================================

        const change =
            latest.close -
            previous.close;


        const percentChange =
            previous.close !== 0
                ?
                (
                    change /
                    previous.close
                ) *
                100
                :
                0;


        // ====================================================
        // APPROXIMATE ONE-MONTH MOVE
        // ====================================================

        const monthlyPercentChange =
            first.close !== 0
                ?
                (
                    (
                        latest.close -
                        first.close
                    ) /
                    first.close
                ) *
                100
                :
                0;


        return {

            symbol,

            name:
                meta.longName ||
                meta.shortName ||
                symbol,

            close:
                roundNumber(
                    latest.close,
                    2
                ),

            previousClose:
                roundNumber(
                    previous.close,
                    2
                ),

            change:
                roundNumber(
                    change,
                    2
                ),

            percentChange:
                roundNumber(
                    percentChange,
                    2
                ),

            monthlyPercentChange:
                roundNumber(
                    monthlyPercentChange,
                    2
                ),

            direction:
                percentChange > 0
                    ?
                    "UP"
                    :
                    percentChange < 0
                        ?
                        "DOWN"
                        :
                        "FLAT",

            marketTime:
                latest.timestamp

        };

    }
    catch (
        error
    ) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                `Yahoo request timed out for ${symbol}.`
            );

        }


        throw error;

    }
    finally {

        clearTimeout(
            timeout
        );

    }

}


// ============================================================
// GET MARKET DATA
// ============================================================

async function getNasdaqMarketData() {

    const compositePromise =
        getYahooHistory(
            "^IXIC"
        );


    const nasdaq100Promise =
        getYahooHistory(
            "^NDX"
        );


    const sectorDefinitions = [

        {
            symbol:
                "XLK",

            name:
                "Technology"
        },

        {
            symbol:
                "SOXX",

            name:
                "Semiconductors"
        },

        {
            symbol:
                "XLC",

            name:
                "Communication Services"
        },

        {
            symbol:
                "XLY",

            name:
                "Consumer Discretionary"
        },

        {
            symbol:
                "XLI",

            name:
                "Industrials"
        },

        {
            symbol:
                "XLV",

            name:
                "Healthcare"
        },

        {
            symbol:
                "XLF",

            name:
                "Financials"
        },

        {
            symbol:
                "XLE",

            name:
                "Energy"
        },

        {
            symbol:
                "XLP",

            name:
                "Consumer Staples"
        },

        {
            symbol:
                "XLU",

            name:
                "Utilities"
        },

        {
            symbol:
                "XLRE",

            name:
                "Real Estate"
        }

    ];


    const sectorPromises =
        sectorDefinitions.map(

            async sector => {

                try {

                    const result =
                        await getYahooHistory(
                            sector.symbol
                        );


                    return {

                        name:
                            sector.name,

                        symbol:
                            sector.symbol,

                        monthlyPercentChange:
                            result
                                .monthlyPercentChange,

                        dailyPercentChange:
                            result
                                .percentChange

                    };

                }
                catch (
                    error
                ) {

                    console.warn(
                        `Market area data unavailable for ${sector.symbol}:`,
                        error.message
                    );


                    return null;

                }

            }

        );


    const [
        nasdaqComposite,
        nasdaq100,
        sectorResults
    ] =
        await Promise.all([

            compositePromise,

            nasdaq100Promise,

            Promise.all(
                sectorPromises
            )

        ]);


    const sectors =
        sectorResults
            .filter(
                Boolean
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.monthlyPercentChange -
                    a.monthlyPercentChange
            );


    const strongestAreas =
        sectors.slice(
            0,
            2
        );


    const weakestAreas =
        [
            ...sectors
        ]
            .sort(
                (
                    a,
                    b
                ) =>
                    a.monthlyPercentChange -
                    b.monthlyPercentChange
            )
            .slice(
                0,
                2
            );


    return {

        nasdaqComposite,

        nasdaq100,

        sectors,

        strongestAreas,

        weakestAreas

    };

}


// ============================================================
// GEMINI MARKET RESEARCH
// ============================================================

async function createMarketResearch(
    marketData,
    reportDate
) {

    // ========================================================
    // SYSTEM INSTRUCTION
    // ========================================================

    const systemInstruction = `

You are preparing a concise end-of-day NASDAQ market intelligence
report for EdgeBreak.

This report describes the COMPLETED US trading session.

Do not provide investment advice.

Do not provide buy, sell or hold recommendations.

Do not provide price targets.

Do not make stock-price predictions.

The NASDAQ index performance and one-month market-area performance
have already been calculated and supplied to you.

Do not recalculate or replace those figures.


YOUR TASK HAS ONLY THREE PARTS.


PART 1 — TODAY'S NOTABLE NASDAQ-100 MOVERS

Using current Google Search grounding, identify:

- 3 notable gainers from the NASDAQ-100 in the completed session
- 3 notable losers from the NASDAQ-100 in the completed session

For each return:

- ticker
- company name
- completed-session percentage move when reliably available
- ONE very short factual sentence explaining the most relevant
  reason for the move

Prefer a clear company-specific catalyst such as:

- earnings
- guidance
- analyst action
- regulatory development
- product announcement
- corporate announcement
- material company news

Do not invent a reason.

If there is no clear company-specific catalyst, state:

"No clear company-specific catalyst identified."

Only use NASDAQ-100 companies.


PART 2 — IMPORTANT EVENTS AHEAD

Look only at the NEXT 7 CALENDAR DAYS after the report date.

Return a maximum of 3 events.

Only include major scheduled events reasonably capable of
materially affecting the NASDAQ or broader US equity market.

Examples:

- Federal Reserve rate decision
- major Federal Reserve / Chair Powell event
- CPI inflation
- PCE inflation
- US employment report
- major GDP release
- exceptionally important mega-cap NASDAQ earnings when clearly
  relevant to the broader market

Do not fill the list with minor economic releases.

If there are no genuinely major market-moving scheduled events,
return an empty array.


PART 3 — END-OF-DAY TAKEAWAY

Write ONE short paragraph.

Maximum 3 concise sentences.

Use the supplied NASDAQ data, one-month market-area information,
notable movers and major upcoming events.

Keep it factual.

Do not provide recommendations.

Do not make predictions.


Return JSON only.

`;


    // ========================================================
    // USER INSTRUCTION
    // ========================================================

    const userInstruction = `

Prepare the EdgeBreak NASDAQ End-of-Day Market Overview for:

${reportDate}


NASDAQ COMPOSITE:

${JSON.stringify(
    marketData.nasdaqComposite,
    null,
    2
)}


NASDAQ-100:

${JSON.stringify(
    marketData.nasdaq100,
    null,
    2
)}


TWO STRONGEST TRACKED MARKET AREAS OVER APPROXIMATELY ONE MONTH:

${JSON.stringify(
    marketData.strongestAreas,
    null,
    2
)}


TWO WEAKEST TRACKED MARKET AREAS OVER APPROXIMATELY ONE MONTH:

${JSON.stringify(
    marketData.weakestAreas,
    null,
    2
)}


The numerical data above has already been calculated.

Do not replace those calculations.


RETURN EXACTLY THIS JSON STRUCTURE:

{
    "notableGainers": [
        {
            "symbol": "",
            "companyName": "",
            "percentChange": null,
            "reason": ""
        }
    ],

    "notableLosers": [
        {
            "symbol": "",
            "companyName": "",
            "percentChange": null,
            "reason": ""
        }
    ],

    "importantEvents": [
        {
            "date": "YYYY-MM-DD",
            "event": ""
        }
    ],

    "endOfDayTakeaway": ""
}


RULES:

notableGainers:
Return no more than 3.

notableLosers:
Return no more than 3.

Only NASDAQ-100 constituents.

reason:
One very short factual sentence.

importantEvents:
Maximum 3.

Only events in the next 7 calendar days.

If none genuinely qualify:
return [].

endOfDayTakeaway:
One short paragraph.
Maximum 3 concise sentences.

Return JSON only.

`;


    // ========================================================
    // REQUEST BODY
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

            /*
             * This report is deliberately tiny.
             *
             * 4000 output tokens was unnecessary and can
             * encourage a much larger generation than needed.
             */

            maxOutputTokens:
                1800,

            responseMimeType:
                "application/json",

            temperature:
                0.1

        }

    };


    // ========================================================
    // GEMINI REQUEST WITH HARD TIMEOUT
    // ========================================================

    for (
        let attempt = 1;
        attempt <= GEMINI_MAX_ATTEMPTS;
        attempt++
    ) {

        console.log(
            `NASDAQ Market Overview Gemini attempt ${attempt}/${GEMINI_MAX_ATTEMPTS}`
        );


        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                () => {

                    console.warn(
                        `NASDAQ Market Overview Gemini attempt ${attempt} exceeded ${GEMINI_TIMEOUT_MS}ms. Aborting.`
                    );


                    controller.abort();

                },
                GEMINI_TIMEOUT_MS
            );


        let geminiResponse;


        try {

            const startedAt =
                Date.now();


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
                                GEMINI_API_KEY

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
                `NASDAQ Market Overview Gemini attempt ${attempt} HTTP response after ${Date.now() - startedAt}ms:`,
                geminiResponse.status
            );

        }
        catch (
            error
        ) {

            // =================================================
            // REQUEST TIMED OUT
            // =================================================

            if (
                error?.name ===
                "AbortError"
            ) {

                console.warn(
                    `NASDAQ Market Overview Gemini attempt ${attempt} timed out.`
                );


                if (
                    attempt <
                    GEMINI_MAX_ATTEMPTS
                ) {

                    console.log(
                        `NASDAQ Market Overview retrying Gemini in ${GEMINI_RETRY_DELAY_MS}ms...`
                    );


                    await sleep(
                        GEMINI_RETRY_DELAY_MS
                    );


                    continue;

                }


                throw new Error(
                    "Gemini market research timed out."
                );

            }


            // =================================================
            // NETWORK / FETCH ERROR
            // =================================================

            console.error(
                `NASDAQ Market Overview Gemini fetch failed on attempt ${attempt}:`,
                error
            );


            if (
                attempt <
                GEMINI_MAX_ATTEMPTS
            ) {

                await sleep(
                    GEMINI_RETRY_DELAY_MS
                );


                continue;

            }


            throw new Error(
                `Gemini market research request failed: ${error?.message || "Unknown fetch error."}`
            );

        }
        finally {

            clearTimeout(
                timeout
            );

        }


        // ====================================================
        // SUCCESS
        // ====================================================

        if (
            geminiResponse.ok
        ) {

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


            if (
                !rawText
            ) {

                console.error(
                    "NASDAQ Market Overview Gemini returned no text."
                );


                if (
                    attempt <
                    GEMINI_MAX_ATTEMPTS
                ) {

                    await sleep(
                        GEMINI_RETRY_DELAY_MS
                    );


                    continue;

                }


                throw new Error(
                    "Gemini returned no market research text."
                );

            }


            // =================================================
            // PARSE JSON
            // =================================================

            let parsed;


            try {

                parsed =
                    JSON.parse(
                        cleanJsonText(
                            rawText
                        )
                    );

            }
            catch (
                error
            ) {

                console.error(
                    "NASDAQ Market Overview Gemini JSON parse failed:"
                );


                console.error(
                    rawText
                );


                if (
                    attempt <
                    GEMINI_MAX_ATTEMPTS
                ) {

                    console.log(
                        "NASDAQ Market Overview retrying after invalid Gemini JSON..."
                    );


                    await sleep(
                        GEMINI_RETRY_DELAY_MS
                    );


                    continue;

                }


                throw new Error(
                    "Gemini returned invalid market research JSON."
                );

            }


            return normalizeMarketResearch(
                parsed,
                reportDate
            );

        }


        // ====================================================
        // NON-200 GEMINI RESPONSE
        // ====================================================

        const errorText =
            await safeReadResponseText(
                geminiResponse
            );


        console.error(
            `NASDAQ Market Overview Gemini Error on attempt ${attempt}:`,
            geminiResponse.status,
            errorText
        );


        // ====================================================
        // RETRY TEMPORARY GEMINI ERRORS
        // ====================================================

        const retryable =
            (
                geminiResponse.status === 429 ||
                geminiResponse.status === 500 ||
                geminiResponse.status === 502 ||
                geminiResponse.status === 503 ||
                geminiResponse.status === 504
            );


        if (
            retryable &&
            attempt <
            GEMINI_MAX_ATTEMPTS
        ) {

            console.log(
                `NASDAQ Market Overview temporary Gemini ${geminiResponse.status}. Retrying in ${GEMINI_RETRY_DELAY_MS}ms...`
            );


            await sleep(
                GEMINI_RETRY_DELAY_MS
            );


            continue;

        }


        throw new Error(
            `Gemini returned ${geminiResponse.status}.`
        );

    }


    throw new Error(
        "Gemini market research failed."
    );

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
    catch (
        error
    ) {

        return (
            "Unable to read Gemini error response."
        );

    }

}


// ============================================================
// NORMALISE GEMINI OUTPUT
// ============================================================

function normalizeMarketResearch(
    data,
    reportDate
) {

    return {

        notableGainers:
            normalizeMovers(
                data?.notableGainers
            ),

        notableLosers:
            normalizeMovers(
                data?.notableLosers
            ),

        importantEvents:
            normalizeEvents(
                data?.importantEvents,
                reportDate
            ),

        endOfDayTakeaway:
            cleanField(
                data?.endOfDayTakeaway,
                900
            )

    };

}


// ============================================================
// NORMALISE MOVERS
// ============================================================

function normalizeMovers(
    value
) {

    if (
        !Array.isArray(
            value
        )
    ) {

        return [];

    }


    return value
        .map(
            item => {

                if (
                    !item ||
                    typeof item !==
                        "object"
                ) {

                    return null;

                }


                const symbol =
                    cleanField(
                        item.symbol,
                        20
                    )
                        .toUpperCase();


                const companyName =
                    cleanField(
                        item.companyName,
                        180
                    );


                const reason =
                    cleanField(
                        item.reason,
                        280
                    );


                const rawPercent =
                    Number(
                        item.percentChange
                    );


                const percentChange =
                    Number.isFinite(
                        rawPercent
                    )
                        ?
                        roundNumber(
                            rawPercent,
                            2
                        )
                        :
                        null;


                if (
                    !symbol
                ) {

                    return null;

                }


                return {

                    symbol,

                    companyName,

                    percentChange,

                    reason:
                        reason ||
                        "No clear company-specific catalyst identified."

                };

            }
        )
        .filter(
            Boolean
        )
        .slice(
            0,
            3
        );

}


// ============================================================
// NORMALISE EVENTS
// ============================================================

function normalizeEvents(
    value,
    reportDate
) {

    if (
        !Array.isArray(
            value
        )
    ) {

        return [];

    }


    const startDate =
        parseDateOnly(
            reportDate
        );


    if (
        !startDate
    ) {

        return [];

    }


    const maxDate =
        new Date(
            startDate.getTime() +
            (
                7 *
                24 *
                60 *
                60 *
                1000
            )
        );


    return value
        .map(
            item => {

                if (
                    !item ||
                    typeof item !==
                        "object"
                ) {

                    return null;

                }


                const date =
                    cleanField(
                        item.date,
                        20
                    );


                const event =
                    cleanField(
                        item.event,
                        280
                    );


                const eventDate =
                    parseDateOnly(
                        date
                    );


                if (
                    !date ||
                    !event ||
                    !eventDate
                ) {

                    return null;

                }


                if (
                    eventDate <=
                        startDate ||
                    eventDate >
                        maxDate
                ) {

                    return null;

                }


                return {

                    date,

                    event

                };

            }
        )
        .filter(
            Boolean
        )
        .slice(
            0,
            3
        );

}


// ============================================================
// MAIN MARKET SUMMARY
// ============================================================

function createMarketSummary(
    marketData
) {

    const composite =
        marketData
            .nasdaqComposite;


    const ndx =
        marketData
            .nasdaq100;


    return (
        `The NASDAQ Composite ${getDirectionWord(composite.percentChange)} ` +
        `${Math.abs(composite.percentChange).toFixed(2)}% to close at ` +
        `${formatNumber(composite.close)}, while the NASDAQ-100 ` +
        `${getDirectionWord(ndx.percentChange)} ` +
        `${Math.abs(ndx.percentChange).toFixed(2)}% to ` +
        `${formatNumber(ndx.close)}.`
    );

}


// ============================================================
// INDEX SUMMARY
// ============================================================

function createIndexSummary(
    indexName,
    data
) {

    if (
        data.percentChange > 0
    ) {

        return (
            `${indexName} finished the completed session higher.`
        );

    }


    if (
        data.percentChange < 0
    ) {

        return (
            `${indexName} finished the completed session lower.`
        );

    }


    return (
        `${indexName} finished the completed session little changed.`
    );

}


// ============================================================
// STRONG AREA DISPLAY
// ============================================================

function createStrongAreaDisplay(
    areas
) {

    if (
        !Array.isArray(
            areas
        ) ||
        areas.length === 0
    ) {

        return [];

    }


    if (
        areas.length === 1
    ) {

        return [

            {
                name:
                    areas[0].name,

                summary:
                    `${areas[0].name} was the strongest tracked market area over approximately the past month.`
            }

        ];

    }


    return [

        {
            name:
                `${areas[0].name} & ${areas[1].name}`,

            summary:
                `${areas[0].name} and ${areas[1].name} were the two strongest tracked market areas over approximately the past month.`
        }

    ];

}


// ============================================================
// WEAK AREA DISPLAY
// ============================================================

function createWeakAreaDisplay(
    areas
) {

    if (
        !Array.isArray(
            areas
        ) ||
        areas.length === 0
    ) {

        return [];

    }


    if (
        areas.length === 1
    ) {

        return [

            {
                name:
                    areas[0].name,

                summary:
                    `${areas[0].name} was the weakest tracked market area over approximately the past month.`
            }

        ];

    }


    return [

        {
            name:
                `${areas[0].name} & ${areas[1].name}`,

            summary:
                `${areas[0].name} and ${areas[1].name} were the two weakest tracked market areas over approximately the past month.`
        }

    ];

}


// ============================================================
// MOVER DISPLAY
// ============================================================

function createMoverDisplay(
    aiResearch
) {

    const gainers =
        Array.isArray(
            aiResearch
                ?.notableGainers
        )
            ?
            aiResearch
                .notableGainers
            :
            [];


    const losers =
        Array.isArray(
            aiResearch
                ?.notableLosers
        )
            ?
            aiResearch
                .notableLosers
            :
            [];


    const display =
        [];


    for (
        const mover of
        gainers
    ) {

        display.push({

            headline:
                buildMoverHeadline(
                    mover,
                    "▲"
                ),

            summary:
                mover.reason ||
                "No clear company-specific catalyst identified."

        });

    }


    for (
        const mover of
        losers
    ) {

        display.push({

            headline:
                buildMoverHeadline(
                    mover,
                    "▼"
                ),

            summary:
                mover.reason ||
                "No clear company-specific catalyst identified."

        });

    }


    return display;

}


// ============================================================
// MOVER HEADLINE
// ============================================================

function buildMoverHeadline(
    mover,
    marker
) {

    const symbol =
        mover.symbol ||
        "";


    const companyName =
        mover.companyName ||
        "";


    const percentage =
        Number.isFinite(
            Number(
                mover.percentChange
            )
        )
            ?
            formatSignedPercent(
                Number(
                    mover.percentChange
                )
            )
            :
            "";


    let headline =
        `${marker} ${symbol}`;


    if (
        percentage
    ) {

        headline +=
            ` ${percentage}`;

    }


    if (
        companyName
    ) {

        headline +=
            ` — ${companyName}`;

    }


    return headline;

}


// ============================================================
// UPCOMING EVENT DISPLAY
// ============================================================

function createUpcomingEventDisplay(
    events
) {

    if (
        !Array.isArray(
            events
        ) ||
        events.length === 0
    ) {

        return [];

    }


    return events
        .slice(
            0,
            3
        )
        .map(
            item => ({

                date:
                    item.date ||
                    "",

                event:
                    item.event ||
                    "",

                whyItMatters:
                    ""

            })
        );

}


// ============================================================
// AI FALLBACK
// ============================================================

function createAiFallback() {

    return {

        notableGainers:
            [],

        notableLosers:
            [],

        importantEvents:
            [],

        endOfDayTakeaway:
            ""

    };

}


// ============================================================
// FALLBACK TAKEAWAY
// ============================================================

function createFallbackTakeaway(
    marketData
) {

    const composite =
        marketData
            .nasdaqComposite;


    const ndx =
        marketData
            .nasdaq100;


    const strongest =
        marketData
            .strongestAreas ||
        [];


    const weakest =
        marketData
            .weakestAreas ||
        [];


    let text =
        (
            `The NASDAQ completed the session with the Composite ` +
            `${getTakeawayDirection(composite.percentChange)} and the ` +
            `NASDAQ-100 ${getTakeawayDirection(ndx.percentChange)}.`
        );


    if (
        strongest.length >= 2 &&
        weakest.length >= 2
    ) {

        text +=
            (
                ` Over approximately the past month, ` +
                `${strongest[0].name} and ${strongest[1].name} ` +
                `have been the strongest tracked areas, while ` +
                `${weakest[0].name} and ${weakest[1].name} ` +
                `have been the weakest.`
            );

    }


    return text;

}


// ============================================================
// CACHE LOOKUP
// ============================================================

async function getCachedOverview(
    reportDate
) {

    if (
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {

        console.warn(
            "NASDAQ Market Overview Supabase cache disabled."
        );


        return null;

    }


    try {

        const url =
            `${SUPABASE_URL}/rest/v1/nasdaq_market_overviews` +
            `?market_date=eq.${encodeURIComponent(reportDate)}` +
            `&select=overview` +
            `&limit=1`;


        const response =
            await fetch(
                url,
                {

                    headers:
                        getSupabaseHeaders()

                }
            );


        if (
            !response.ok
        ) {

            const text =
                await response.text();


            console.warn(
                "NASDAQ Market Overview cache lookup failed:",
                response.status,
                text
            );


            return null;

        }


        const rows =
            await response.json();


        if (
            !Array.isArray(
                rows
            ) ||
            !rows.length
        ) {

            return null;

        }


        return (
            rows[0]?.overview ||
            null
        );

    }
    catch (
        error
    ) {

        console.warn(
            "NASDAQ Market Overview cache lookup error:",
            error.message
        );


        return null;

    }

}


// ============================================================
// SAVE CACHE
// ============================================================

async function saveCachedOverview(
    reportDate,
    overview
) {

    if (
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {

        return;

    }


    try {

        const url =
            `${SUPABASE_URL}/rest/v1/nasdaq_market_overviews` +
            `?on_conflict=market_date`;


        const now =
            new Date()
                .toISOString();


        const response =
            await fetch(
                url,
                {

                    method:
                        "POST",

                    headers: {

                        ...getSupabaseHeaders(),

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "resolution=merge-duplicates,return=minimal"

                    },

                    body:
                        JSON.stringify([

                            {

                                market_date:
                                    reportDate,

                                status:
                                    "ready",

                                overview:
                                    overview,

                                generated_at:
                                    now,

                                updated_at:
                                    now

                            }

                        ])

                }
            );


        if (
            !response.ok
        ) {

            const text =
                await response.text();


            console.warn(
                "NASDAQ Market Overview cache save failed:",
                response.status,
                text
            );


            return;

        }


        console.log(
            "NASDAQ Market Overview CACHE SAVED:",
            reportDate
        );

    }
    catch (
        error
    ) {

        console.warn(
            "NASDAQ Market Overview cache save error:",
            error.message
        );

    }

}


// ============================================================
// SUPABASE HEADERS
// ============================================================

function getSupabaseHeaders() {

    return {

        apikey:
            SUPABASE_SERVICE_ROLE_KEY,

        Authorization:
            `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`

    };

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
        )
            .trim();


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
        lastBrace >
            firstBrace
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
// CLEAN FIELD
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


// ============================================================
// DATE PARSER
// ============================================================

function parseDateOnly(
    value
) {

    if (
        typeof value !==
            "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {

        return null;

    }


    const [
        year,
        month,
        day
    ] =
        value
            .split("-")
            .map(
                Number
            );


    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


// ============================================================
// DIRECTION WORD
// ============================================================

function getDirectionWord(
    percentChange
) {

    const value =
        Number(
            percentChange
        );


    if (
        value > 0
    ) {

        return "rose";

    }


    if (
        value < 0
    ) {

        return "fell";

    }


    return "finished little changed";

}


// ============================================================
// TAKEAWAY DIRECTION
// ============================================================

function getTakeawayDirection(
    percentChange
) {

    const value =
        Number(
            percentChange
        );


    if (
        value > 0
    ) {

        return "finishing higher";

    }


    if (
        value < 0
    ) {

        return "finishing lower";

    }


    return "finishing little changed";

}


// ============================================================
// SLEEP
// ============================================================

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


// ============================================================
// ROUND NUMBER
// ============================================================

function roundNumber(
    value,
    decimals = 2
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

        return 0;

    }


    const multiplier =
        10 **
        decimals;


    return (
        Math.round(
            number *
            multiplier
        ) /
        multiplier
    );

}


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(
    value
) {

    return Number(
        value
    )
        .toLocaleString(
            "en-US",
            {

                maximumFractionDigits:
                    2

            }
        );

}


// ============================================================
// FORMAT SIGNED PERCENT
// ============================================================

function formatSignedPercent(
    value
) {

    const number =
        Number(
            value
        );


    const sign =
        number > 0
            ?
            "+"
            :
            "";


    return (
        `${sign}${number.toFixed(2)}%`
    );

}