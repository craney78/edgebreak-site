// ============================================================
// EDGEBREAK NASDAQ MARKET OVERVIEW
// api/nasdaq_market_overview.js
//
// PURPOSE:
// Lightweight end-of-day NASDAQ market overview.
//
// Covers:
// 1. NASDAQ Today
// 2. Hot / Weak NASDAQ areas
// 3. What to Watch Next
//
// IMPORTANT:
// EdgeBreak scanner counts are NOT researched by Gemini.
// They come from EdgeBreak's own scanner data.
//
// Results are cached in Supabase once per U.S. market date.
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;


// ============================================================
// HANDLER
// ============================================================

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        // ----------------------------------------------------
        // CHECK ENVIRONMENT VARIABLES
        // ----------------------------------------------------

        if (!GEMINI_API_KEY) {
            throw new Error("Missing GEMINI_API_KEY.");
        }

        if (!SUPABASE_URL) {
            throw new Error("Missing SUPABASE_URL.");
        }

        if (!SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing Supabase service role key.");
        }


        // ----------------------------------------------------
        // DETERMINE U.S. MARKET DATE
        // ----------------------------------------------------

        const marketDate = getNewYorkDate();

        console.log(
            "NASDAQ Market Overview date:",
            marketDate
        );


        // ----------------------------------------------------
        // CHECK CACHE
        // ----------------------------------------------------

        const cached = await getCachedOverview(marketDate);

        if (cached) {

            console.log(
                "NASDAQ Market Overview CACHE HIT:",
                marketDate
            );

            return res.status(200).json({
                success: true,
                cached: true,
                marketDate,
                overview: cached
            });
        }


        console.log(
            "NASDAQ Market Overview CACHE MISS:",
            marketDate
        );


        // ----------------------------------------------------
        // RUN LIGHTWEIGHT AI MARKET RESEARCH
        // ----------------------------------------------------

        console.log(
            "NASDAQ Market Overview AI research starting..."
        );

        const overview = await researchNasdaqMarket(
            marketDate
        );


        // ----------------------------------------------------
        // CACHE RESULT
        // ----------------------------------------------------

        try {

            await saveCachedOverview(
                marketDate,
                overview
            );

            console.log(
                "NASDAQ Market Overview cached:",
                marketDate
            );

        } catch (cacheError) {

            // Don't destroy a successful report just because
            // caching failed.

            console.error(
                "NASDAQ Market Overview cache save failed:",
                cacheError
            );
        }


        // ----------------------------------------------------
        // RETURN RESULT
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,
            cached: false,
            marketDate,
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
                "Today's NASDAQ Market Overview is temporarily unavailable."
        });
    }
}



// ============================================================
// RESEARCH NASDAQ MARKET
// ============================================================

async function researchNasdaqMarket(marketDate) {

    const prompt = `
You are preparing a SHORT end-of-day NASDAQ market overview
for a stock research platform.

REPORT DATE:
${marketDate}

This is an END-OF-DAY report.

The U.S. trading session for the report date should already
be complete.

Use Google Search grounding to verify current factual
information where necessary.

IMPORTANT:

Research the NASDAQ only.

Do NOT provide a general U.S. stock market report.

Do NOT discuss the Dow Jones unless absolutely necessary
to explain a major market-wide event.

Do NOT discuss the S&P 500 unless absolutely necessary
to explain a major market-wide event.

Do NOT provide investment advice.

Do NOT provide buy, sell or hold recommendations.

Do NOT provide price targets.

Do NOT predict whether the NASDAQ will rise or fall.

Do NOT perform technical analysis on individual stocks.

Keep this report concise.

This is intended to be a quick end-of-day market briefing,
not a detailed research report.


============================================================
SECTION 1 — NASDAQ TODAY
============================================================

Explain how the NASDAQ performed during the completed
U.S. trading session.

Include:

- whether the NASDAQ finished higher or lower
- approximately how much it moved in percentage terms
- the main factors influencing the NASDAQ session

Focus specifically on factors relevant to NASDAQ-listed
and technology/growth companies.

Keep this section to approximately 2-3 sentences.


============================================================
SECTION 2 — HOT AREAS
============================================================

Identify up to THREE NASDAQ-relevant sectors, industries
or market themes that showed notable strength during
the completed session.

Examples may include:

- semiconductors
- software
- biotechnology
- cybersecurity
- AI infrastructure
- cloud computing
- technology hardware

Do not force three results if the evidence does not
support them.

For each area provide:

- name
- one short explanation of why it was strong


============================================================
SECTION 3 — WEAK AREAS
============================================================

Identify up to THREE NASDAQ-relevant sectors, industries
or market themes that showed notable weakness during
the completed session.

Do not force three results if the evidence does not
support them.

For each area provide:

- name
- one short explanation of why it was weak


============================================================
SECTION 4 — WHAT TO WATCH NEXT
============================================================

Identify up to THREE important upcoming events that could
meaningfully affect the NASDAQ during the next several
U.S. trading sessions.

Examples include:

- Federal Reserve decisions or minutes
- CPI
- PPI
- employment reports
- major technology earnings
- major semiconductor earnings
- other significant scheduled economic releases

Only include genuinely important events.

For each event provide:

- event name
- date
- one short explanation of why NASDAQ investors may
  pay attention to it

Do NOT predict the outcome of the event.

Do NOT predict the market reaction.


============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Do not use markdown.

Do not use code fences.

Use exactly this structure:

{
  "marketSummary": "Short NASDAQ end-of-day summary.",
  "nasdaqDirection": "UP or DOWN or FLAT",
  "nasdaqPercentChange": "percentage change",
  "hotAreas": [
    {
      "name": "Sector, industry or theme",
      "reason": "Short explanation"
    }
  ],
  "weakAreas": [
    {
      "name": "Sector, industry or theme",
      "reason": "Short explanation"
    }
  ],
  "upcomingEvents": [
    {
      "event": "Event name",
      "date": "YYYY-MM-DD",
      "importance": "Short explanation"
    }
  ]
}
`;


    // --------------------------------------------------------
    // GEMINI REQUEST
    //
    // IMPORTANT:
    // Google Search grounding is enabled, but we DO NOT tell
    // Gemini to construct a list of search queries.
    // --------------------------------------------------------

    const endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";


    const requestBody = {

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

        tools: [
            {
                google_search: {}
            }
        ],

        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 6000
        }

    };


    // --------------------------------------------------------
    // FIRST ATTEMPT
    // --------------------------------------------------------

    let data = await callGemini(
        endpoint,
        requestBody
    );


    let text = extractGeminiText(data);


    // --------------------------------------------------------
    // RETRY ON MALFORMED SEARCH / EMPTY RESPONSE
    // --------------------------------------------------------

    if (!text) {

        const finishReason =
            data?.candidates?.[0]?.finishReason;

        console.warn(
            "NASDAQ Market Overview first attempt returned no text."
        );

        console.warn(
            "NASDAQ Market Overview finish reason:",
            finishReason
        );


        // Small delay before retry

        await sleep(1500);


        console.log(
            "NASDAQ Market Overview Gemini retry starting..."
        );


        data = await callGemini(
            endpoint,
            requestBody
        );


        text = extractGeminiText(data);
    }


    // --------------------------------------------------------
    // STILL NO TEXT
    // --------------------------------------------------------

    if (!text) {

        console.error(
            "NASDAQ MARKET OVERVIEW FULL GEMINI RESPONSE:",
            JSON.stringify(data, null, 2)
        );

        throw new Error(
            "NASDAQ Market Overview returned no research."
        );
    }


    // --------------------------------------------------------
    // CLEAN RESPONSE
    // --------------------------------------------------------

    let cleaned = text.trim();


    cleaned = cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();


    // --------------------------------------------------------
    // EXTRACT JSON OBJECT
    // --------------------------------------------------------

    const firstBrace =
        cleaned.indexOf("{");

    const lastBrace =
        cleaned.lastIndexOf("}");


    if (
        firstBrace === -1 ||
        lastBrace === -1 ||
        lastBrace <= firstBrace
    ) {

        console.error(
            "NASDAQ Market Overview invalid response:",
            cleaned
        );

        throw new Error(
            "NASDAQ Market Overview returned invalid output."
        );
    }


    cleaned = cleaned.substring(
        firstBrace,
        lastBrace + 1
    );


    // --------------------------------------------------------
    // PARSE JSON
    // --------------------------------------------------------

    let parsed;


    try {

        parsed = JSON.parse(cleaned);

    } catch (parseError) {

        console.error(
            "NASDAQ Market Overview JSON Parse Error:"
        );

        console.error(cleaned);

        throw new Error(
            "NASDAQ Market Overview returned invalid JSON."
        );
    }


    // --------------------------------------------------------
    // NORMALISE RESULT
    // --------------------------------------------------------

    return {

        marketSummary:
            safeString(parsed.marketSummary),

        nasdaqDirection:
            normaliseDirection(
                parsed.nasdaqDirection
            ),

        nasdaqPercentChange:
            safeString(
                parsed.nasdaqPercentChange
            ),

        hotAreas:
            normaliseAreas(
                parsed.hotAreas
            ),

        weakAreas:
            normaliseAreas(
                parsed.weakAreas
            ),

        upcomingEvents:
            normaliseEvents(
                parsed.upcomingEvents
            )

    };
}



// ============================================================
// CALL GEMINI
// ============================================================

async function callGemini(
    endpoint,
    requestBody
) {

    const response = await fetch(
        `${endpoint}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(
                requestBody
            )
        }
    );


    const rawText =
        await response.text();


    let data;


    try {

        data = JSON.parse(rawText);

    } catch {

        console.error(
            "NASDAQ Market Overview Gemini non-JSON response:",
            rawText
        );

        throw new Error(
            "Gemini returned an invalid API response."
        );
    }


    if (!response.ok) {

        console.error(
            "Gemini NASDAQ Market Overview Error:",
            response.status,
            data
        );

        throw new Error(
            `Gemini request failed: ${response.status}`
        );
    }


    console.log(
        "NASDAQ Market Overview Gemini request completed."
    );


    return data;
}



// ============================================================
// EXTRACT GEMINI TEXT
// ============================================================

function extractGeminiText(data) {

    const candidate =
        data?.candidates?.[0];


    if (!candidate) {
        return "";
    }


    console.log(
        "NASDAQ Market Overview finish reason:",
        candidate.finishReason || "UNKNOWN"
    );


    const parts =
        candidate?.content?.parts;


    if (!Array.isArray(parts)) {
        return "";
    }


    const text = parts
        .filter(
            part =>
                typeof part?.text === "string"
        )
        .map(
            part => part.text
        )
        .join("")
        .trim();


    return text;
}



// ============================================================
// NORMALISE DIRECTION
// ============================================================

function normaliseDirection(value) {

    const direction =
        safeString(value)
            .toUpperCase();


    if (
        direction === "UP" ||
        direction === "DOWN" ||
        direction === "FLAT"
    ) {
        return direction;
    }


    return "FLAT";
}



// ============================================================
// NORMALISE HOT / WEAK AREAS
// ============================================================

function normaliseAreas(value) {

    if (!Array.isArray(value)) {
        return [];
    }


    return value
        .slice(0, 3)
        .map(item => ({

            name:
                safeString(
                    item?.name
                ),

            reason:
                safeString(
                    item?.reason
                )

        }))
        .filter(
            item => item.name
        );
}



// ============================================================
// NORMALISE UPCOMING EVENTS
// ============================================================

function normaliseEvents(value) {

    if (!Array.isArray(value)) {
        return [];
    }


    return value
        .slice(0, 3)
        .map(item => ({

            event:
                safeString(
                    item?.event
                ),

            date:
                safeString(
                    item?.date
                ),

            importance:
                safeString(
                    item?.importance
                )

        }))
        .filter(
            item => item.event
        );
}



// ============================================================
// SAFE STRING
// ============================================================

function safeString(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value).trim();
}



// ============================================================
// GET NEW YORK DATE
// ============================================================

function getNewYorkDate() {

    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/New_York",

                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );


    return formatter.format(
        new Date()
    );
}



// ============================================================
// SUPABASE CACHE
// ============================================================

async function getCachedOverview(
    marketDate
) {

    const url =
        `${SUPABASE_URL}/rest/v1/nasdaq_market_overviews` +
        `?market_date=eq.${encodeURIComponent(marketDate)}` +
        `&select=overview` +
        `&limit=1`;


    const response = await fetch(
        url,
        {
            headers: {
                apikey:
                    SUPABASE_SERVICE_ROLE_KEY,

                Authorization:
                    `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "NASDAQ Market Overview cache read error:",
            errorText
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


    return rows[0]?.overview || null;
}



// ============================================================
// SAVE CACHE
// ============================================================

async function saveCachedOverview(
    marketDate,
    overview
) {

    const url =
        `${SUPABASE_URL}/rest/v1/nasdaq_market_overviews`;


    const response = await fetch(
        url,
        {
            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                apikey:
                    SUPABASE_SERVICE_ROLE_KEY,

                Authorization:
                    `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

                Prefer:
                    "resolution=merge-duplicates"
            },

            body: JSON.stringify({
                market_date:
                    marketDate,

                overview:
                    overview
            })
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `Supabase cache save failed: ${errorText}`
        );
    }
}



// ============================================================
// SLEEP
// ============================================================

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}