// ============================================================
// EDGEBREAK
// NASDAQ END-OF-DAY MARKET OVERVIEW
//
// FILE:
// /api/nasdaq_market_overview.js
//
// PURPOSE:
// 1. Get NASDAQ end-of-day market data directly
// 2. Get major NASDAQ sector/industry ETF performance directly
// 3. Give Gemini the facts instead of asking Gemini to search for them
// 4. Produce a SHORT end-of-day NASDAQ market summary
// 5. Cache the completed overview in Supabase
//
// IMPORTANT:
// This function DOES NOT perform stock discovery.
// The heavy Stocks to Investigate research remains separate.
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;


// ============================================================
// MAIN HANDLER
// ============================================================

export default async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    try {

        const reportDate = getNewYorkReportDate();

        console.log(
            "NASDAQ Market Overview date:",
            reportDate
        );


        // ====================================================
        // CHECK CACHE
        // ====================================================

        const cached = await getCachedOverview(reportDate);

        if (cached) {

            console.log(
                "NASDAQ Market Overview CACHE HIT:",
                reportDate
            );

            return res.status(200).json({
                success: true,
                cached: true,
                date: reportDate,
                overview: cached
            });
        }


        console.log(
            "NASDAQ Market Overview CACHE MISS:",
            reportDate
        );


        // ====================================================
        // GET MARKET DATA DIRECTLY
        // ====================================================

        console.log(
            "NASDAQ Market Overview market data starting..."
        );

        const marketData = await getNasdaqMarketData();

        console.log(
            "NASDAQ Market Overview market data complete."
        );

        console.log(
            "NASDAQ:",
            marketData.nasdaq
        );


        // ====================================================
        // CREATE SHORT AI SUMMARY
        // ====================================================

        let aiSummary = null;

        if (GEMINI_API_KEY) {

            try {

                console.log(
                    "NASDAQ Market Overview AI summary starting..."
                );

                aiSummary = await createMarketSummary(
                    marketData,
                    reportDate
                );

                console.log(
                    "NASDAQ Market Overview AI summary complete."
                );

            } catch (error) {

                // ------------------------------------------------
                // IMPORTANT:
                // Gemini failure must NOT destroy the whole report.
                // ------------------------------------------------

                console.warn(
                    "NASDAQ Market Overview AI summary unavailable:",
                    error.message
                );
            }
        }


        // ====================================================
        // FALLBACK SUMMARY
        // ====================================================

        if (!aiSummary) {

            aiSummary = createFallbackSummary(
                marketData
            );
        }


        // ====================================================
        // FINAL RESULT
        // ====================================================

        const overview = {

            marketSummary:
                aiSummary.marketSummary || "",

            marketTone:
                aiSummary.marketTone || "MIXED",

            hotAreas:
                aiSummary.hotAreas || [],

            weakAreas:
                aiSummary.weakAreas || [],

            watchNext:
                aiSummary.watchNext || [],

            nasdaq: marketData.nasdaq,

            sectors: marketData.sectors,

            generatedAt:
                new Date().toISOString()
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


        return res.status(200).json({

            success: true,

            cached: false,

            date: reportDate,

            overview
        });


    } catch (error) {

        console.error(
            "NASDAQ Market Overview Error:",
            error
        );

        return res.status(500).json({

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
                timeZone: "America/New_York",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );

    const parts =
        formatter.formatToParts(
            new Date()
        );

    const year =
        parts.find(
            part => part.type === "year"
        )?.value;

    const month =
        parts.find(
            part => part.type === "month"
        )?.value;

    const day =
        parts.find(
            part => part.type === "day"
        )?.value;

    return `${year}-${month}-${day}`;
}


// ============================================================
// YAHOO FINANCE CHART
// ============================================================

async function getYahooChart(symbol) {

    const encodedSymbol =
        encodeURIComponent(symbol);

    const url =
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}` +
        `?range=5d&interval=1d&includePrePost=false&events=div%2Csplits`;

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            8000
        );

    try {

        const response =
            await fetch(
                url,
                {
                    method: "GET",

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


        if (!response.ok) {

            throw new Error(
                `Yahoo request failed for ${symbol}: ${response.status}`
            );
        }


        const data =
            await response.json();


        const result =
            data?.chart?.result?.[0];


        if (!result) {

            throw new Error(
                `No Yahoo market data returned for ${symbol}.`
            );
        }


        const meta =
            result.meta || {};


        const quote =
            result.indicators
                ?.quote?.[0] || {};


        const timestamps =
            result.timestamp || [];


        const closes =
            quote.close || [];


        const validRows = [];


        for (
            let i = 0;
            i < timestamps.length;
            i++
        ) {

            const close =
                Number(closes[i]);

            if (
                Number.isFinite(close)
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


        const change =
            latest.close -
            previous.close;


        const percentChange =
            previous.close !== 0
                ? (
                    change /
                    previous.close
                ) * 100
                : 0;


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

            direction:
                percentChange > 0
                    ? "UP"
                    : percentChange < 0
                        ? "DOWN"
                        : "FLAT",

            marketTime:
                latest.timestamp
        };


    } finally {

        clearTimeout(timeout);
    }
}


// ============================================================
// GET NASDAQ MARKET DATA
// ============================================================

async function getNasdaqMarketData() {

    // --------------------------------------------------------
    // NASDAQ Composite
    // --------------------------------------------------------

    const nasdaqPromise =
        getYahooChart("^IXIC");


    // --------------------------------------------------------
    // NASDAQ-heavy sector / industry ETFs
    //
    // These are being used as simple market-area proxies.
    // They are NOT presented as NASDAQ sector indexes.
    // --------------------------------------------------------

    const sectorDefinitions = [

        {
            symbol: "XLK",
            name: "Technology"
        },

        {
            symbol: "SOXX",
            name: "Semiconductors"
        },

        {
            symbol: "XLC",
            name: "Communication Services"
        },

        {
            symbol: "XLY",
            name: "Consumer Discretionary"
        },

        {
            symbol: "XLI",
            name: "Industrials"
        },

        {
            symbol: "XLV",
            name: "Healthcare"
        },

        {
            symbol: "XLF",
            name: "Financials"
        },

        {
            symbol: "XLE",
            name: "Energy"
        }
    ];


    const sectorPromises =
        sectorDefinitions.map(
            async sector => {

                try {

                    const result =
                        await getYahooChart(
                            sector.symbol
                        );

                    return {

                        name:
                            sector.name,

                        symbol:
                            sector.symbol,

                        percentChange:
                            result.percentChange,

                        direction:
                            result.direction
                    };

                } catch (error) {

                    console.warn(
                        `Market area data unavailable for ${sector.symbol}:`,
                        error.message
                    );

                    return null;
                }
            }
        );


    const [
        nasdaq,
        sectorResults
    ] =
        await Promise.all([

            nasdaqPromise,

            Promise.all(
                sectorPromises
            )
        ]);


    const sectors =
        sectorResults
            .filter(Boolean)
            .sort(
                (
                    a,
                    b
                ) =>
                    b.percentChange -
                    a.percentChange
            );


    return {

        nasdaq,

        sectors
    };
}


// ============================================================
// GEMINI
// ============================================================

async function createMarketSummary(
    marketData,
    reportDate
) {

    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => controller.abort(),
            12000
        );


    try {

        const prompt = `
You are preparing a SHORT end-of-day NASDAQ market overview for EdgeBreak.

REPORT DATE:
${reportDate}

IMPORTANT:

You are NOT performing stock research.

You are NOT searching the web.

You are NOT giving investment advice.

Use ONLY the market data supplied below.

This is an END-OF-DAY report.

The user wants to understand quickly:

1. How the NASDAQ performed overall.
2. Which market areas were strongest.
3. Which market areas were weakest.
4. What the general NASDAQ tone looked like.

Keep this concise.

Do not discuss individual stocks.

Do not provide predictions.

Do not provide buy, sell or hold recommendations.

Do not invent economic events or future events because no economic-calendar data has been supplied to you.

MARKET DATA:

${JSON.stringify(
    marketData,
    null,
    2
)}

Return ONLY valid JSON.

Use exactly this structure:

{
  "marketSummary": "2-3 concise sentences describing the NASDAQ session.",
  "marketTone": "POSITIVE | MIXED | NEGATIVE",
  "hotAreas": [
    "Short factual observation",
    "Short factual observation"
  ],
  "weakAreas": [
    "Short factual observation",
    "Short factual observation"
  ],
  "watchNext": [
    "Monitor whether today's strongest areas continue to show relative strength.",
    "Monitor whether today's weaker areas stabilise or remain under pressure."
  ]
}
`;


        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";


        const response =
            await fetch(
                url,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            GEMINI_API_KEY
                    },

                    body:
                        JSON.stringify({

                            contents: [

                                {
                                    role: "user",

                                    parts: [

                                        {
                                            text: prompt
                                        }
                                    ]
                                }
                            ],

                            generationConfig: {

                                temperature:
                                    0.1,

                                maxOutputTokens:
                                    600,

                                responseMimeType:
                                    "application/json"
                            }
                        }),

                    signal:
                        controller.signal
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                `Gemini returned ${response.status}: ${errorText.slice(0, 300)}`
            );
        }


        const data =
            await response.json();


        const text =
            data?.candidates?.[0]
                ?.content?.parts
                ?.map(
                    part =>
                        part.text || ""
                )
                .join("")
                .trim();


        if (!text) {

            throw new Error(
                "Gemini returned no summary text."
            );
        }


        const cleaned =
            cleanJsonText(text);


        const parsed =
            JSON.parse(cleaned);


        return normalizeAiSummary(
            parsed
        );


    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                "Gemini summary timed out."
            );
        }


        throw error;


    } finally {

        clearTimeout(timeout);
    }
}


// ============================================================
// NORMALISE GEMINI OUTPUT
// ============================================================

function normalizeAiSummary(data) {

    const validTone =
        [
            "POSITIVE",
            "MIXED",
            "NEGATIVE"
        ];


    let tone =
        String(
            data?.marketTone ||
            "MIXED"
        )
            .trim()
            .toUpperCase();


    if (
        !validTone.includes(tone)
    ) {

        tone =
            "MIXED";
    }


    return {

        marketSummary:
            String(
                data?.marketSummary ||
                ""
            ).trim(),

        marketTone:
            tone,

        hotAreas:
            normalizeStringArray(
                data?.hotAreas
            ),

        weakAreas:
            normalizeStringArray(
                data?.weakAreas
            ),

        watchNext:
            normalizeStringArray(
                data?.watchNext
            )
    };
}


// ============================================================
// FALLBACK SUMMARY
//
// This means the page STILL WORKS even if Gemini is down.
// ============================================================

function createFallbackSummary(
    marketData
) {

    const nasdaq =
        marketData.nasdaq;


    const sectors =
        marketData.sectors || [];


    let tone =
        "MIXED";


    if (
        nasdaq.percentChange >= 0.5
    ) {

        tone =
            "POSITIVE";

    } else if (
        nasdaq.percentChange <= -0.5
    ) {

        tone =
            "NEGATIVE";
    }


    const directionText =
        nasdaq.percentChange > 0
            ? "rose"
            : nasdaq.percentChange < 0
                ? "fell"
                : "finished little changed";


    const absoluteMove =
        Math.abs(
            nasdaq.percentChange
        ).toFixed(2);


    const marketSummary =
        nasdaq.percentChange === 0
            ?
            `The NASDAQ Composite finished the session little changed at ${formatNumber(nasdaq.close)}. Market-area performance was mixed across the session.`
            :
            `The NASDAQ Composite ${directionText} ${absoluteMove}% to close at ${formatNumber(nasdaq.close)}. Performance across major market areas showed a mix of relative strength and weakness.`;


    const strongest =
        sectors
            .filter(
                item =>
                    item.percentChange > 0
            )
            .slice(
                0,
                3
            );


    const weakest =
        [...sectors]
            .sort(
                (
                    a,
                    b
                ) =>
                    a.percentChange -
                    b.percentChange
            )
            .filter(
                item =>
                    item.percentChange < 0
            )
            .slice(
                0,
                3
            );


    const hotAreas =
        strongest.length
            ?
            strongest.map(
                item =>
                    `${item.name} finished ${formatSignedPercent(item.percentChange)}.`
            )
            :
            [
                "No major tracked market area finished meaningfully higher."
            ];


    const weakAreas =
        weakest.length
            ?
            weakest.map(
                item =>
                    `${item.name} finished ${formatSignedPercent(item.percentChange)}.`
            )
            :
            [
                "No major tracked market area finished meaningfully lower."
            ];


    return {

        marketSummary,

        marketTone:
            tone,

        hotAreas,

        weakAreas,

        watchNext: [

            "Watch whether the strongest areas from today's session continue to show relative strength.",

            "Watch whether today's weaker areas stabilise or remain under pressure in the next session."
        ]
    };
}


// ============================================================
// CACHE
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
            `?report_date=eq.${encodeURIComponent(reportDate)}` +
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


        if (!response.ok) {

            console.warn(
                "NASDAQ Market Overview cache lookup failed:",
                response.status
            );

            return null;
        }


        const rows =
            await response.json();


        if (
            !Array.isArray(rows) ||
            !rows.length
        ) {

            return null;
        }


        return (
            rows[0]?.overview ||
            null
        );


    } catch (error) {

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
            `?on_conflict=report_date`;


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
                                report_date:
                                    reportDate,

                                overview,

                                updated_at:
                                    new Date()
                                        .toISOString()
                            }
                        ])
                }
            );


        if (!response.ok) {

            const text =
                await response.text();

            console.warn(
                "NASDAQ Market Overview cache save failed:",
                response.status,
                text
            );
        }


    } catch (error) {

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

function cleanJsonText(text) {

    let cleaned =
        String(text || "")
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
        cleaned.indexOf("{");


    const lastBrace =
        cleaned.lastIndexOf("}");


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
// ARRAY NORMALISER
// ============================================================

function normalizeStringArray(value) {

    if (
        !Array.isArray(value)
    ) {

        return [];
    }


    return value
        .map(
            item =>
                String(item || "")
                    .trim()
        )
        .filter(Boolean)
        .slice(
            0,
            4
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
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return 0;
    }


    const multiplier =
        10 ** decimals;


    return (
        Math.round(
            number *
            multiplier
        ) /
        multiplier
    );
}


function formatNumber(value) {

    return Number(value)
        .toLocaleString(
            "en-US",
            {
                maximumFractionDigits:
                    2
            }
        );
}


function formatSignedPercent(value) {

    const number =
        Number(value);


    const sign =
        number > 0
            ? "+"
            : "";


    return (
        `${sign}${number.toFixed(2)}%`
    );
}