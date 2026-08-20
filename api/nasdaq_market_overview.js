// ============================================================
// EDGEBREAK
// NASDAQ END-OF-DAY MARKET OVERVIEW
//
// FILE:
// /api/nasdaq_market_overview.js
//
// PURPOSE:
//
// 1. Get completed-session NASDAQ Composite performance
// 2. Get completed-session NASDAQ-100 performance
// 3. Calculate strongest / weakest market areas over ~1 month
// 4. Use Gemini + Google Search only for:
//      - 3 notable NASDAQ-100 gainers
//      - 3 notable NASDAQ-100 losers
//      - very short reasons for those moves
//      - major market-moving events in the next 7 days
//      - short end-of-day takeaway
// 5. Cache ONE completed overview per US market date in Supabase
//
// IMPORTANT:
//
// - This is END-OF-DAY reporting.
// - It is NOT an intraday market report.
// - It does NOT perform stock discovery.
// - It does NOT provide investment advice.
// - EdgeBreak scanner counts remain separate for now.
// ============================================================


const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;


const SUPABASE_URL =
    process.env.SUPABASE_URL;


const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;


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

        const reportDate =
            getNewYorkReportDate();


        console.log(
            "NASDAQ Market Overview date:",
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
        // MARKET DATA
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
        // GEMINI MARKET RESEARCH
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
                    error.message
                );

            }

        }


        // ====================================================
        // AI FALLBACK
        // ====================================================

        if (
            !aiResearch
        ) {

            aiResearch =
                createAiFallback();

        }


        // ====================================================
        // DETERMINISTIC SESSION SUMMARY
        // ====================================================

        const sessionSummary =
            createSessionSummary(
                marketData
            );


        // ====================================================
        // DETERMINISTIC SECTOR SENTENCES
        // ====================================================

        const strongerAreasSummary =
            createStrongerAreasSummary(
                marketData.strongestAreas
            );


        const weakerAreasSummary =
            createWeakerAreasSummary(
                marketData.weakestAreas
            );


        // ====================================================
        // FINAL OVERVIEW
        //
        // Keep several compatibility fields so the existing
        // front-end does not suddenly lose data while we
        // update the display.
        // ====================================================

        const overview = {

            // ================================================
            // HOW THE NASDAQ FINISHED
            // ================================================

            marketSummary:
                sessionSummary,

            marketTone:
                determineMarketTone(
                    marketData
                ),


            nasdaq:
                marketData.nasdaqComposite,

            nasdaqComposite:
                marketData.nasdaqComposite,

            nasdaq100:
                marketData.nasdaq100,


            // ================================================
            // MONTHLY STRENGTH / WEAKNESS
            // ================================================

            strongerAreasSummary,

            weakerAreasSummary,

            strongestAreas:
                marketData.strongestAreas,

            weakestAreas:
                marketData.weakestAreas,


            // ================================================
            // OLD FRONT-END COMPATIBILITY
            // ================================================

            hotAreas:
                strongerAreasSummary
                    ? [
                        strongerAreasSummary
                    ]
                    : [],

            weakAreas:
                weakerAreasSummary
                    ? [
                        weakerAreasSummary
                    ]
                    : [],


            // ================================================
            // TODAY'S NOTABLE MOVERS
            // ================================================

            notableGainers:
                aiResearch.notableGainers ||
                [],

            notableLosers:
                aiResearch.notableLosers ||
                [],


            // ================================================
            // IMPORTANT EVENTS AHEAD
            // NEXT 7 CALENDAR DAYS ONLY
            // ================================================

            importantEvents:
                aiResearch.importantEvents ||
                [],


            // ================================================
            // OLD FRONT-END COMPATIBILITY
            // ================================================

            watchNext:
                aiResearch.importantEvents ||
                [],


            // ================================================
            // END-OF-DAY TAKEAWAY
            // ================================================

            endOfDayTakeaway:
                aiResearch.endOfDayTakeaway ||
                createFallbackTakeaway(
                    marketData
                ),


            // ================================================
            // RAW MARKET AREA DATA
            // ================================================

            sectors:
                marketData.sectors,


            // ================================================
            // EDGE BREAK SCANNER ACTIVITY
            //
            // Deliberately NOT populated here yet.
            // ================================================

            scannerActivity:
                null,


            generatedAt:
                new Date()
                    .toISOString()

        };


        // ====================================================
        // SAVE CACHE
        // ====================================================

        await saveCachedOverview(
            reportDate,
            overview
        );


        console.log(
            "NASDAQ Market Overview completed:",
            reportDate
        );


        return res
            .status(200)
            .json({

                success: true,

                cached: false,

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


    const year =
        parts.find(
            part =>
                part.type ===
                "year"
        )?.value;


    const month =
        parts.find(
            part =>
                part.type ===
                "month"
        )?.value;


    const day =
        parts.find(
            part =>
                part.type ===
                "day"
        )?.value;


    return (
        `${year}-${month}-${day}`
    );

}


// ============================================================
// YAHOO FINANCE HISTORY
//
// range=1mo gives enough history to:
// - calculate latest completed daily move
// - calculate approximate one-month sector performance
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
            8000
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


        const dailyChange =
            latest.close -
            previous.close;


        const dailyPercentChange =
            previous.close !== 0
                ?
                (
                    dailyChange /
                    previous.close
                ) *
                100
                :
                0;


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
                    dailyChange,
                    2
                ),

            percentChange:
                roundNumber(
                    dailyPercentChange,
                    2
                ),

            monthlyPercentChange:
                roundNumber(
                    monthlyPercentChange,
                    2
                ),

            direction:
                dailyPercentChange > 0
                    ?
                    "UP"
                    :
                    dailyPercentChange < 0
                        ?
                        "DOWN"
                        :
                        "FLAT",

            marketTime:
                latest.timestamp,

            historyCount:
                validRows.length

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
// GET NASDAQ MARKET DATA
// ============================================================

async function getNasdaqMarketData() {

    // ========================================================
    // INDEXES
    // ========================================================

    const nasdaqCompositePromise =
        getYahooHistory(
            "^IXIC"
        );


    const nasdaq100Promise =
        getYahooHistory(
            "^NDX"
        );


    // ========================================================
    // MARKET AREAS
    //
    // These are liquid ETF proxies used only to rank relative
    // one-month strength / weakness.
    //
    // We keep the existing EdgeBreak market-area concept
    // rather than asking Gemini to determine performance.
    // ========================================================

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
                            result.monthlyPercentChange,

                        dailyPercentChange:
                            result.percentChange

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

            nasdaqCompositePromise,

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
//
// Proven pattern copied from the working Daily Brief:
// - Gemini 3.5 Flash
// - Google Search grounding
// - JSON response
// - one retry for temporary 503
//
// Gemini is NOT asked to calculate index or sector performance.
// ============================================================

async function createMarketResearch(
    marketData,
    reportDate
) {

    // ========================================================
    // SYSTEM INSTRUCTION
    // ========================================================

    const systemInstruction = `

You are preparing a concise END-OF-DAY NASDAQ market intelligence
section for EdgeBreak.

This is NOT investment advice.

Do NOT provide buy, sell or hold recommendations.

Do NOT provide price targets.

Do NOT predict future stock prices.

The supplied index and market-area performance data has already
been calculated.

Do NOT recalculate it.

Your research tasks are deliberately narrow.

TASK 1 — TODAY'S NOTABLE NASDAQ-100 MOVERS

Using current Google Search grounding, identify:

- 3 notable gainers from the NASDAQ-100 for the completed session
- 3 notable losers from the NASDAQ-100 for the completed session

For each company:

- return ticker
- company name
- completed-session percentage move when reliably available
- ONE very short factual reason for the move

The reason should preferably identify a clear company-specific
catalyst such as earnings, guidance, analyst action, company news,
regulatory news, product news or another credible development.

Do not invent a catalyst.

If no clear company-specific reason can be established, say:

"No clear company-specific catalyst identified."


TASK 2 — IMPORTANT EVENTS AHEAD

Look ONLY at the next 7 calendar days after the report date.

Return a maximum of 3 scheduled events.

Only include genuinely major events reasonably capable of
materially affecting the NASDAQ or broader US equity market.

Examples include:

- Federal Reserve interest-rate decisions
- major Federal Reserve / Chair Powell events
- CPI
- PCE inflation
- US employment report
- major GDP releases
- exceptionally important mega-cap NASDAQ earnings when clearly
  capable of affecting the broader market

Do NOT fill the list with minor economic releases.

If no event genuinely qualifies, return an empty array.


TASK 3 — END-OF-DAY TAKEAWAY

Write one short paragraph of no more than 3 concise sentences.

Use the supplied completed-session NASDAQ data, one-month market
area data, notable movers and important events.

Summarise the completed session.

Do not provide predictions or recommendations.

Keep it factual and easy to understand.

Return JSON only.

`;


    // ========================================================
    // USER INSTRUCTION
    // ========================================================

    const userInstruction = `

Prepare the EdgeBreak NASDAQ End-of-Day Market Overview for:

${reportDate}


SUPPLIED COMPLETED-SESSION MARKET DATA:

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


TWO STRONGEST MARKET AREAS OVER APPROXIMATELY ONE MONTH:

${JSON.stringify(
    marketData.strongestAreas,
    null,
    2
)}


TWO WEAKEST MARKET AREAS OVER APPROXIMATELY ONE MONTH:

${JSON.stringify(
    marketData.weakestAreas,
    null,
    2
)}


IMPORTANT:

The numerical market data above is supplied as fact.

Do not replace it with different index or sector calculations.

Use Google Search grounding only for the narrow research tasks
defined in the system instruction.


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
Maximum exactly 3 when reliable data is available.

notableLosers:
Maximum exactly 3 when reliable data is available.

Only use NASDAQ-100 constituents.

Do not return a company outside the NASDAQ-100.

reason:
Maximum one short sentence.

importantEvents:
Maximum 3.

Only events occurring within the next 7 calendar days.

If there are no genuinely major market-moving scheduled events,
return [].

endOfDayTakeaway:
Maximum 3 short sentences.

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

            // Far smaller than Stocks to Investigate.
            // Still enough room for grounded output.

            maxOutputTokens:
                4000,

            responseMimeType:
                "application/json",

            temperature:
                0.1

        }

    };


    // ========================================================
    // GEMINI REQUEST
    // ========================================================

    let geminiResponse =
        null;


    const maxAttempts =
        2;


    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        console.log(
            `NASDAQ Market Overview Gemini attempt ${attempt}/${maxAttempts}`
        );


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
                        )

                }

            );


        if (
            geminiResponse.ok
        ) {

            break;

        }


        const errorText =
            await geminiResponse.text();


        console.error(
            `NASDAQ Market Overview Gemini Error on attempt ${attempt}:`,
            geminiResponse.status,
            errorText
        );


        // ====================================================
        // RETRY TEMPORARY 503 ONCE
        // ====================================================

        if (
            geminiResponse.status ===
                503 &&
            attempt <
                maxAttempts
        ) {

            console.log(
                "NASDAQ Market Overview received temporary Gemini 503. Retrying in 6 seconds..."
            );


            await sleep(
                6000
            );


            continue;

        }


        throw new Error(
            `Gemini returned ${geminiResponse.status}.`
        );

    }


    if (
        !geminiResponse ||
        !geminiResponse.ok
    ) {

        throw new Error(
            "Gemini market research failed."
        );

    }


    // ========================================================
    // PARSE GEMINI RESPONSE
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


    if (
        !rawText
    ) {

        throw new Error(
            "Gemini returned no market research text."
        );

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
    catch (
        error
    ) {

        console.error(
            "NASDAQ Market Overview Gemini JSON parse failed:"
        );


        console.error(
            rawText
        );


        throw new Error(
            "Gemini returned invalid market research JSON."
        );

    }


    return normalizeMarketResearch(
        parsed,
        reportDate
    );

}


// ============================================================
// NORMALISE GEMINI MARKET RESEARCH
// ============================================================

function normalizeMarketResearch(
    data,
    reportDate
) {

    const notableGainers =
        normalizeMovers(
            data?.notableGainers
        );


    const notableLosers =
        normalizeMovers(
            data?.notableLosers
        );


    const importantEvents =
        normalizeEvents(
            data?.importantEvents,
            reportDate
        );


    const endOfDayTakeaway =
        cleanField(
            data?.endOfDayTakeaway,
            900
        );


    return {

        notableGainers,

        notableLosers,

        importantEvents,

        endOfDayTakeaway

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


                const numericPercent =
                    Number(
                        item.percentChange
                    );


                const percentChange =
                    Number.isFinite(
                        numericPercent
                    )
                        ?
                        roundNumber(
                            numericPercent,
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
// SESSION SUMMARY
// ============================================================

function createSessionSummary(
    marketData
) {

    const composite =
        marketData.nasdaqComposite;


    const ndx =
        marketData.nasdaq100;


    const compositeDirection =
        getDirectionWord(
            composite.percentChange
        );


    const ndxDirection =
        getDirectionWord(
            ndx.percentChange
        );


    const compositeMove =
        Math.abs(
            composite.percentChange
        )
            .toFixed(
                2
            );


    const ndxMove =
        Math.abs(
            ndx.percentChange
        )
            .toFixed(
                2
            );


    return (
        `The NASDAQ Composite ${compositeDirection} ${compositeMove}% ` +
        `to close at ${formatNumber(composite.close)}, while the NASDAQ-100 ` +
        `${ndxDirection} ${ndxMove}% to ${formatNumber(ndx.close)}.`
    );

}


// ============================================================
// STRONGER AREAS SUMMARY
// ============================================================

function createStrongerAreasSummary(
    areas
) {

    if (
        !Array.isArray(
            areas
        ) ||
        areas.length === 0
    ) {

        return (
            "No stronger market areas were identified."
        );

    }


    if (
        areas.length === 1
    ) {

        return (
            `${areas[0].name} was the strongest tracked market area over approximately the past month.`
        );

    }


    return (
        `${areas[0].name} and ${areas[1].name} were the two strongest tracked market areas over approximately the past month.`
    );

}


// ============================================================
// WEAKER AREAS SUMMARY
// ============================================================

function createWeakerAreasSummary(
    areas
) {

    if (
        !Array.isArray(
            areas
        ) ||
        areas.length === 0
    ) {

        return (
            "No weaker market areas were identified."
        );

    }


    if (
        areas.length === 1
    ) {

        return (
            `${areas[0].name} was the weakest tracked market area over approximately the past month.`
        );

    }


    return (
        `${areas[0].name} and ${areas[1].name} were the two weakest tracked market areas over approximately the past month.`
    );

}


// ============================================================
// MARKET TONE
// ============================================================

function determineMarketTone(
    marketData
) {

    const composite =
        Number(
            marketData
                ?.nasdaqComposite
                ?.percentChange
        );


    const ndx =
        Number(
            marketData
                ?.nasdaq100
                ?.percentChange
        );


    if (
        composite > 0 &&
        ndx > 0
    ) {

        return "POSITIVE";

    }


    if (
        composite < 0 &&
        ndx < 0
    ) {

        return "NEGATIVE";

    }


    return "MIXED";

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
        marketData.nasdaqComposite;


    const ndx =
        marketData.nasdaq100;


    const strongest =
        marketData
            .strongestAreas ||
        [];


    const weakest =
        marketData
            .weakestAreas ||
        [];


    const direction =
        composite.percentChange > 0
            ?
            "higher"
            :
            composite.percentChange < 0
                ?
                "lower"
                :
                "little changed";


    let text =
        `The NASDAQ finished the completed session ${direction}, with the NASDAQ Composite moving ${formatSignedPercent(composite.percentChange)} and the NASDAQ-100 moving ${formatSignedPercent(ndx.percentChange)}.`;


    if (
        strongest.length >= 2 &&
        weakest.length >= 2
    ) {

        text +=
            ` Over approximately the past month, ${strongest[0].name} and ${strongest[1].name} have been the strongest tracked areas, while ${weakest[0].name} and ${weakest[1].name} have been the weakest.`;

    }


    return text;

}


// ============================================================
// CACHE LOOKUP
//
// TABLE:
// nasdaq_market_overviews
//
// DATE COLUMN:
// market_date
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
// DATE ONLY PARSER
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
// NUMBER HELPERS
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