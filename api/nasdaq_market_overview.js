// ============================================================
// EDGEBREAK NASDAQ MARKET OVERVIEW
// api/nasdaq_market_overview.js
//
// LIGHTWEIGHT END-OF-DAY NASDAQ REPORT
//
// AI covers:
// 1. NASDAQ Today
// 2. Hot NASDAQ areas
// 3. Weak NASDAQ areas
// 4. What to Watch Next
//
// EdgeBreak scanner figures are handled separately using
// EdgeBreak's own scanner data.
//
// Designed to FAIL FAST rather than leave the user waiting.
// ============================================================


// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;


// ============================================================
// SETTINGS
// ============================================================

const GEMINI_MODEL =
    "gemini-3.5-flash";

const GEMINI_TIMEOUT_MS =
    25000;

const GEMINI_MAX_ATTEMPTS =
    2;


// ============================================================
// MAIN HANDLER
// ============================================================

export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            error: "Method not allowed."
        });

    }


    try {

        // ----------------------------------------------------
        // ENV CHECK
        // ----------------------------------------------------

        if (!GEMINI_API_KEY) {

            throw new Error(
                "Missing GEMINI_API_KEY."
            );

        }


        if (!SUPABASE_URL) {

            throw new Error(
                "Missing SUPABASE_URL."
            );

        }


        if (!SUPABASE_SERVICE_ROLE_KEY) {

            throw new Error(
                "Missing Supabase service role key."
            );

        }


        // ----------------------------------------------------
        // MARKET DATE
        // ----------------------------------------------------

        const marketDate =
            getNewYorkDate();


        console.log(
            "NASDAQ Market Overview date:",
            marketDate
        );


        // ----------------------------------------------------
        // CACHE
        // ----------------------------------------------------

        const cached =
            await getCachedOverview(
                marketDate
            );


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
        // AI RESEARCH
        // ----------------------------------------------------

        console.log(
            "NASDAQ Market Overview AI research starting..."
        );


        const overview =
            await researchNasdaqMarket(
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

        }

        catch (cacheError) {

            // A cache problem should NOT destroy
            // a successful AI response.

            console.error(
                "NASDAQ Market Overview cache save failed:",
                cacheError
            );

        }


        // ----------------------------------------------------
        // RETURN
        // ----------------------------------------------------

        console.log(
            "NASDAQ Market Overview complete."
        );


        return res.status(200).json({

            success: true,

            cached: false,

            marketDate,

            overview

        });

    }

    catch (error) {

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
// NASDAQ MARKET RESEARCH
// ============================================================

async function researchNasdaqMarket(
    marketDate
) {

    const prompt = `
Create a SHORT end-of-day NASDAQ market briefing.

REPORT DATE:
${marketDate}

This report is produced AFTER the completed U.S. trading session.

Use current Google Search information when needed to verify facts.

IMPORTANT:

Focus on the NASDAQ.

Do NOT create a broad U.S. market report.

Do NOT research individual stocks except when a major NASDAQ company
has materially influenced the overall NASDAQ session or has an important
upcoming earnings event.

Do NOT provide investment advice.

Do NOT provide buy, sell or hold recommendations.

Do NOT provide price targets.

Do NOT predict future NASDAQ direction.

Do NOT perform technical analysis.

Keep the entire response concise.

We only need four pieces of information.


SECTION 1 — NASDAQ TODAY

Briefly explain how the NASDAQ performed during the completed session.

Include:

- whether it finished higher or lower
- approximate percentage move
- one or two main reasons influencing the session

Maximum approximately 3 sentences.


SECTION 2 — HOT AREAS

Identify up to 3 NASDAQ-relevant sectors, industries or themes
that showed notable strength during the completed session.

Examples include:

semiconductors,
software,
biotechnology,
cybersecurity,
AI infrastructure,
cloud computing,
technology hardware.

For each provide:

- name
- one short reason

Do not force results where evidence is weak.


SECTION 3 — WEAK AREAS

Identify up to 3 NASDAQ-relevant sectors, industries or themes
that showed notable weakness during the completed session.

For each provide:

- name
- one short reason

Do not force results where evidence is weak.


SECTION 4 — WHAT TO WATCH NEXT

Identify up to 3 genuinely important scheduled events during
the next several U.S. trading sessions that could affect
NASDAQ-listed growth and technology companies.

Examples include:

Federal Reserve decisions or minutes,
CPI,
PPI,
employment data,
major technology earnings,
major semiconductor earnings,
other major scheduled economic releases.

For each provide:

- event
- date
- one short explanation of why it matters to the NASDAQ

Do NOT predict the result or market reaction.


RETURN ONLY VALID JSON.

No markdown.

No code fences.

No commentary before or after the JSON.

Use this exact structure:

{
    "marketSummary": "Short NASDAQ end-of-day summary.",
    "nasdaqDirection": "UP",
    "nasdaqPercentChange": "-1.25%",
    "hotAreas": [
        {
            "name": "Area name",
            "reason": "Short factual explanation."
        }
    ],
    "weakAreas": [
        {
            "name": "Area name",
            "reason": "Short factual explanation."
        }
    ],
    "upcomingEvents": [
        {
            "event": "Event name",
            "date": "YYYY-MM-DD",
            "importance": "Short explanation of why it matters."
        }
    ]
}
`;


    // --------------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------------

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


        // Google Search grounding

        tools: [

            {
                google_search: {}
            }

        ],


        generationConfig: {

            temperature: 0.1,

            // This is intentionally small.
            // This report should be SHORT.

            maxOutputTokens: 2200

        }

    };


    // --------------------------------------------------------
    // ATTEMPTS
    // --------------------------------------------------------

    let lastError = null;


    for (
        let attempt = 1;
        attempt <= GEMINI_MAX_ATTEMPTS;
        attempt++
    ) {

        try {

            console.log(
                `NASDAQ Market Overview Gemini attempt ${attempt}/${GEMINI_MAX_ATTEMPTS}`
            );


            const data =
                await callGeminiWithTimeout(
                    requestBody
                );


            const candidate =
                data?.candidates?.[0];


            const finishReason =
                candidate?.finishReason ||
                "UNKNOWN";


            console.log(
                "NASDAQ Market Overview finish reason:",
                finishReason
            );


            // ------------------------------------------------
            // MALFORMED GOOGLE SEARCH
            // ------------------------------------------------

            if (
                finishReason ===
                "MALFORMED_FUNCTION_CALL"
            ) {

                console.warn(
                    "NASDAQ Market Overview grounding call malformed."
                );


                lastError =
                    new Error(
                        "Gemini grounding call malformed."
                    );


                continue;

            }


            // ------------------------------------------------
            // TOKEN LIMIT
            // ------------------------------------------------

            if (
                finishReason ===
                "MAX_TOKENS"
            ) {

                console.warn(
                    "NASDAQ Market Overview reached token limit."
                );


                lastError =
                    new Error(
                        "Gemini reached token limit."
                    );


                continue;

            }


            // ------------------------------------------------
            // GET TEXT
            // ------------------------------------------------

            const text =
                extractGeminiText(
                    data
                );


            if (!text) {

                console.warn(
                    "NASDAQ Market Overview returned no text."
                );


                lastError =
                    new Error(
                        "Gemini returned no text."
                    );


                continue;

            }


            // ------------------------------------------------
            // PARSE RESULT
            // ------------------------------------------------

            const parsed =
                parseOverviewJSON(
                    text
                );


            // ------------------------------------------------
            // SUCCESS
            // ------------------------------------------------

            console.log(
                "NASDAQ Market Overview AI research successful."
            );


            return normaliseOverview(
                parsed
            );

        }

        catch (error) {

            lastError = error;


            console.warn(
                `NASDAQ Market Overview attempt ${attempt} failed:`,
                error.message
            );

        }


        // ----------------------------------------------------
        // SHORT PAUSE BEFORE RETRY
        // ----------------------------------------------------

        if (
            attempt <
            GEMINI_MAX_ATTEMPTS
        ) {

            await sleep(
                1000
            );

        }

    }


    // --------------------------------------------------------
    // ALL ATTEMPTS FAILED
    // --------------------------------------------------------

    throw (
        lastError ||
        new Error(
            "NASDAQ Market Overview research failed."
        )
    );

}



// ============================================================
// GEMINI REQUEST WITH HARD TIMEOUT
// ============================================================

async function callGeminiWithTimeout(
    requestBody
) {

    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => {

                controller.abort();

            },
            GEMINI_TIMEOUT_MS
        );


    try {

        const endpoint =
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


        const response =
            await fetch(
                `${endpoint}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            requestBody
                        ),

                    signal:
                        controller.signal

                }
            );


        const rawText =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(
                    rawText
                );

        }

        catch {

            console.error(
                "NASDAQ Market Overview Gemini non-JSON API response:",
                rawText
            );


            throw new Error(
                "Gemini returned invalid API data."
            );

        }


        if (!response.ok) {

            console.error(
                "Gemini NASDAQ Market Overview API Error:",
                response.status,
                data
            );


            throw new Error(
                `Gemini request failed with status ${response.status}.`
            );

        }


        console.log(
            "NASDAQ Market Overview Gemini request completed."
        );


        return data;

    }

    catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            console.warn(
                `NASDAQ Market Overview Gemini request exceeded ${GEMINI_TIMEOUT_MS / 1000} seconds.`
            );


            throw new Error(
                "Gemini market overview request timed out."
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
// EXTRACT GEMINI TEXT
// ============================================================

function extractGeminiText(
    data
) {

    const candidate =
        data?.candidates?.[0];


    if (!candidate) {

        return "";

    }


    const parts =
        candidate?.content?.parts;


    if (!Array.isArray(parts)) {

        return "";

    }


    return parts

        .filter(
            part =>
                typeof part?.text ===
                "string"
        )

        .map(
            part =>
                part.text
        )

        .join("")

        .trim();

}



// ============================================================
// PARSE GEMINI JSON
// ============================================================

function parseOverviewJSON(
    text
) {

    let cleaned =
        String(text || "")
            .trim();


    // Remove possible markdown fences

    cleaned =
        cleaned
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();


    // Extract JSON object

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
            "NASDAQ Market Overview returned no JSON:",
            cleaned
        );


        throw new Error(
            "NASDAQ Market Overview returned invalid output."
        );

    }


    cleaned =
        cleaned.substring(
            firstBrace,
            lastBrace + 1
        );


    try {

        return JSON.parse(
            cleaned
        );

    }

    catch (error) {

        console.error(
            "NASDAQ Market Overview JSON Parse Error:"
        );


        console.error(
            cleaned
        );


        throw new Error(
            "NASDAQ Market Overview returned invalid JSON."
        );

    }

}



// ============================================================
// NORMALISE OVERVIEW
// ============================================================

function normaliseOverview(
    parsed
) {

    return {

        marketSummary:
            safeString(
                parsed?.marketSummary
            ),

        nasdaqDirection:
            normaliseDirection(
                parsed?.nasdaqDirection
            ),

        nasdaqPercentChange:
            safeString(
                parsed?.nasdaqPercentChange
            ),

        hotAreas:
            normaliseAreas(
                parsed?.hotAreas
            ),

        weakAreas:
            normaliseAreas(
                parsed?.weakAreas
            ),

        upcomingEvents:
            normaliseEvents(
                parsed?.upcomingEvents
            )

    };

}



// ============================================================
// NORMALISE DIRECTION
// ============================================================

function normaliseDirection(
    value
) {

    const direction =
        safeString(
            value
        ).toUpperCase();


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
// NORMALISE AREAS
// ============================================================

function normaliseAreas(
    value
) {

    if (!Array.isArray(value)) {

        return [];

    }


    return value

        .slice(
            0,
            3
        )

        .map(
            item => ({

                name:
                    safeString(
                        item?.name
                    ),

                reason:
                    safeString(
                        item?.reason
                    )

            })
        )

        .filter(
            item =>
                item.name
        );

}



// ============================================================
// NORMALISE UPCOMING EVENTS
// ============================================================

function normaliseEvents(
    value
) {

    if (!Array.isArray(value)) {

        return [];

    }


    return value

        .slice(
            0,
            3
        )

        .map(
            item => ({

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

            })
        )

        .filter(
            item =>
                item.event
        );

}



// ============================================================
// SAFE STRING
// ============================================================

function safeString(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    ).trim();

}



// ============================================================
// NEW YORK DATE
// ============================================================

function getNewYorkDate() {

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


    return formatter.format(
        new Date()
    );

}



// ============================================================
// READ SUPABASE CACHE
// ============================================================

async function getCachedOverview(
    marketDate
) {

    const url =
        `${SUPABASE_URL}/rest/v1/nasdaq_market_overviews` +
        `?market_date=eq.${encodeURIComponent(marketDate)}` +
        `&select=overview` +
        `&limit=1`;


    try {

        const response =
            await fetch(
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
            rows.length === 0
        ) {

            return null;

        }


        return (
            rows[0]?.overview ||
            null
        );

    }

    catch (error) {

        console.error(
            "NASDAQ Market Overview cache read failed:",
            error
        );


        return null;

    }

}



// ============================================================
// SAVE SUPABASE CACHE
// ============================================================

async function saveCachedOverview(
    marketDate,
    overview
) {

    const url =
        `${SUPABASE_URL}/rest/v1/nasdaq_market_overviews`;


    const response =
        await fetch(
            url,
            {

                method:
                    "POST",

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

                body:
                    JSON.stringify({

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

function sleep(
    ms
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}