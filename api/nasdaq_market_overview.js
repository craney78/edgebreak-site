/* =========================================
EDGEBREAK — NASDAQ END-OF-DAY MARKET OVERVIEW
/api/nasdaq_market_overview.js
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
            error: "NASDAQ Market Overview AI is not configured."
        });
    }

    if (
        !process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_KEY
    ) {
        return res.status(500).json({
            error: "NASDAQ Market Overview cache is not configured."
        });
    }


    try {

        /* =====================================
        U.S. MARKET DATE
        ===================================== */

        const marketDate = getNewYorkDate();

        console.log(
            `NASDAQ Market Overview date: ${marketDate}`
        );


        /* =====================================
        CHECK CACHE
        ===================================== */

        const cachedOverview =
            await getCachedOverview(marketDate);


        if (cachedOverview) {

            console.log(
                `NASDAQ Market Overview CACHE HIT: ${marketDate}`
            );

            return res.status(200).json({
                success: true,
                cached: true,
                marketDate: cachedOverview.market_date,
                generatedAt: cachedOverview.generated_at,
                overview: cachedOverview.overview
            });
        }


        console.log(
            `NASDAQ Market Overview CACHE MISS: ${marketDate}`
        );


        /* =====================================
        CREATE MARKET OVERVIEW
        ===================================== */

        const overview =
            await researchNasdaqMarket(marketDate);


        /* =====================================
        CLEAN RESULT
        ===================================== */

        const safeOverview =
            cleanOverview(overview);


        if (!safeOverview) {
            throw new Error(
                "NASDAQ Market Overview returned invalid research."
            );
        }


        /* =====================================
        SAFETY LANGUAGE FILTER
        ===================================== */

        const combinedText =
            JSON.stringify(safeOverview);


        const prohibitedPatterns = [

            /\bstrong buy\b/i,
            /\bstrong sell\b/i,
            /\byou should buy\b/i,
            /\byou should sell\b/i,
            /\byou should hold\b/i,
            /\brecommend(?:s|ed|ing)? buying\b/i,
            /\brecommend(?:s|ed|ing)? selling\b/i,
            /\bbuy opportunity\b/i,
            /\bsell opportunity\b/i,
            /\bprice target\b/i,
            /\btarget price\b/i,
            /\bguaranteed return\b/i,
            /\bguaranteed profit\b/i,
            /\bmarket will rise\b/i,
            /\bmarket will fall\b/i

        ];


        const unsafe =
            prohibitedPatterns.some(
                pattern =>
                    pattern.test(combinedText)
            );


        if (unsafe) {

            console.error(
                "NASDAQ Market Overview blocked by safety filter."
            );

            return res.status(422).json({
                error:
                    "Today's NASDAQ Market Overview could not be displayed."
            });
        }


        /* =====================================
        SAVE COMPLETED OVERVIEW
        ===================================== */

        const generatedAt =
            new Date().toISOString();


        await saveOverview({
            marketDate,
            generatedAt,
            overview: safeOverview
        });


        /* =====================================
        SUCCESS
        ===================================== */

        return res.status(200).json({

            success: true,

            cached: false,

            marketDate,

            generatedAt,

            overview: safeOverview

        });

    }
    catch (error) {

        console.error(
            "NASDAQ Market Overview Error:",
            error
        );

        return res.status(500).json({
            error:
                "Today's NASDAQ Market Overview is temporarily unavailable."
        });
    }
}


/* =========================================
RESEARCH NASDAQ MARKET
========================================= */

async function researchNasdaqMarket(marketDate) {

    console.log(
        "NASDAQ Market Overview AI research starting..."
    );


    /* =====================================
    SYSTEM INSTRUCTION
    ===================================== */

    const systemInstruction = `

You are the end-of-day NASDAQ market research engine
for EdgeBreak.

Your task is to produce a SHORT factual overview of the
COMPLETED U.S. trading session.

This is END-OF-DAY reporting.

The U.S. market session has already closed.

Do NOT write as though the market is currently trading.

Use language such as:

- finished
- closed
- ended
- gained
- declined
- led
- lagged
- strengthened
- weakened

Do NOT use language such as:

- is currently trading
- is rising
- is falling
- currently leading
- currently lagging


SCOPE:

NASDAQ only.

Focus on:

- NASDAQ Composite
- NASDAQ-100
- NASDAQ-relevant sectors and industries
- major developments that influenced the completed session
- important scheduled events AFTER today's close that may
  be relevant to upcoming NASDAQ trading sessions


THIS IS NOT:

- individual stock research
- technical stock analysis
- investment advice
- market prediction
- a trading signal


MARKET PERFORMANCE:

Briefly explain how the NASDAQ Composite and NASDAQ-100
finished the completed session.

Use factual closing performance where reliably available.

Do not invent index figures.


STRONG AND WEAK AREAS:

Identify no more than THREE NASDAQ-relevant sectors or
industries that showed notable strength during the
completed session.

Identify no more than THREE NASDAQ-relevant sectors or
industries that showed notable weakness.

Examples may include:

- semiconductors
- software
- biotechnology
- internet
- cybersecurity
- communication services
- consumer technology
- renewable energy
- financial technology

Only include areas where current evidence supports the
assessment.

Do not force three results if fewer are genuinely notable.


MARKET DRIVERS:

Identify no more than THREE important developments that
help explain the completed NASDAQ session.

Examples may include:

- economic data
- Federal Reserve developments
- Treasury yield movements
- inflation developments
- employment data
- major technology earnings
- semiconductor developments
- geopolitical developments
- broad risk sentiment

Focus on developments relevant to the NASDAQ overall.

Do not turn this into a general news summary.


UPCOMING EVENTS:

Identify no more than THREE important scheduled events
occurring AFTER the completed market session.

These should be events that could reasonably be relevant
to NASDAQ market conditions during upcoming sessions.

Examples:

- CPI
- PPI
- employment reports
- Federal Reserve decisions
- Federal Reserve speeches
- major technology earnings
- major semiconductor earnings
- other significant scheduled economic events

For each event:

State what the event is.

State the date.

Briefly explain WHY NASDAQ market participants may pay
attention to it.

Do NOT predict how the NASDAQ will respond.

Do NOT say the event will cause the market to rise or fall.


TAKEAWAY:

Finish with a maximum TWO-SENTENCE factual end-of-day
takeaway.

Summarize:

- the character of the completed NASDAQ session
- the most important area to watch going into upcoming
  sessions

Do not make predictions.


SAFETY:

Do NOT provide:

- buy recommendations
- sell recommendations
- hold recommendations
- price targets
- index targets
- predictions
- expected returns
- trading instructions

Return JSON only.

`;


    /* =====================================
    USER INSTRUCTION
    ===================================== */

    const userInstruction = `

Prepare the EdgeBreak NASDAQ End-of-Day Market Overview
for the completed U.S. market session dated:

${marketDate}

Use current Google Search grounding.

Keep the entire response concise.

This is intended to be a quick market briefing displayed
above EdgeBreak's detailed stock research.

Do NOT research every NASDAQ company.

Do NOT provide a long market report.

Do NOT provide investment advice.

Do NOT predict future market direction.


RETURN EXACTLY THIS JSON STRUCTURE:

{
    "marketSummary": "",
    "nasdaqComposite": {
        "close": "",
        "changePercent": "",
        "summary": ""
    },
    "nasdaq100": {
        "close": "",
        "changePercent": "",
        "summary": ""
    },
    "strongAreas": [
        {
            "name": "",
            "summary": ""
        }
    ],
    "weakAreas": [
        {
            "name": "",
            "summary": ""
        }
    ],
    "marketDrivers": [
        {
            "headline": "",
            "summary": ""
        }
    ],
    "upcomingEvents": [
        {
            "date": "",
            "event": "",
            "whyItMatters": ""
        }
    ],
    "takeaway": ""
}


STRICT LENGTH RULES:

marketSummary:
Maximum 3 sentences.

nasdaqComposite.summary:
Maximum 1 sentence.

nasdaq100.summary:
Maximum 1 sentence.

strongAreas:
Maximum 3 objects.

Each summary:
Maximum 1 sentence.

weakAreas:
Maximum 3 objects.

Each summary:
Maximum 1 sentence.

marketDrivers:
Maximum 3 objects.

Each summary:
Maximum 2 short sentences.

upcomingEvents:
Maximum 3 objects.

Each whyItMatters:
Maximum 2 short sentences.

takeaway:
Maximum 2 sentences.


IMPORTANT:

If a precise closing value or percentage cannot be
reliably verified, return an empty string rather than
inventing a figure.

Return JSON only.

`;


    /* =====================================
    GEMINI REQUEST
    ===================================== */

    const geminiResponse =
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

                            maxOutputTokens: 2000,

                            responseMimeType:
                                "application/json",

                            temperature: 0.1

                        }

                    })

            }

        );


    /* =====================================
    GEMINI HTTP ERROR
    ===================================== */

    if (!geminiResponse.ok) {

        const errorText =
            await geminiResponse.text();

        console.error(
            "Gemini NASDAQ Market Overview Error:",
            geminiResponse.status,
            errorText
        );

        throw new Error(
            `NASDAQ Market Overview Gemini request failed (${geminiResponse.status}).`
        );
    }


    /* =====================================
    READ GEMINI RESPONSE
    ===================================== */

    const geminiData =
        await geminiResponse.json();


    /*
    IMPORTANT DIAGNOSTIC

    If Gemini returns HTTP 200 but no normal
    text output, this prints the complete response
    to Vercel so we can see exactly what Gemini did.
    */

    console.log(
        "NASDAQ MARKET OVERVIEW FULL GEMINI RESPONSE:",
        JSON.stringify(
            geminiData,
            null,
            2
        )
    );


    /* =====================================
    EXTRACT OUTPUT
    ===================================== */

    const candidate =
        geminiData?.candidates?.[0];


    console.log(
        "NASDAQ Market Overview finish reason:",
        candidate?.finishReason || "NONE"
    );


    const rawText =
        candidate
            ?.content
            ?.parts
            ?.map(
                part =>
                    typeof part?.text === "string"
                        ? part.text
                        : ""
            )
            ?.join("")
            ?.trim();


    /* =====================================
    NO TEXT RETURNED
    ===================================== */

    if (!rawText) {

        console.error(
            "NASDAQ Market Overview returned no text."
        );

        console.error(
            "NASDAQ Market Overview candidate:",
            JSON.stringify(
                candidate,
                null,
                2
            )
        );

        console.error(
            "NASDAQ Market Overview prompt feedback:",
            JSON.stringify(
                geminiData?.promptFeedback || null,
                null,
                2
            )
        );

        throw new Error(
            "NASDAQ Market Overview returned no research."
        );
    }


    console.log(
        "NASDAQ Market Overview raw text received. Characters:",
        rawText.length
    );


    /* =====================================
    PARSE JSON
    ===================================== */

    let overview;


    try {

        /*
        FIRST ATTEMPT
        */

        try {

            overview =
                JSON.parse(rawText);

        }
        catch (directParseError) {

            /*
            SECOND ATTEMPT

            Remove markdown code fences.
            */

            let cleanedText =
                rawText
                    .replace(
                        /^```(?:json)?\s*/i,
                        ""
                    )
                    .replace(
                        /\s*```$/i,
                        ""
                    )
                    .trim();


            /*
            Isolate outer JSON object.
            */

            const firstBrace =
                cleanedText.indexOf("{");

            const lastBrace =
                cleanedText.lastIndexOf("}");


            if (
                firstBrace === -1 ||
                lastBrace === -1 ||
                lastBrace <= firstBrace
            ) {
                throw directParseError;
            }


            cleanedText =
                cleanedText.slice(
                    firstBrace,
                    lastBrace + 1
                );


            overview =
                JSON.parse(cleanedText);

        }

    }
    catch (error) {

        console.error(
            "NASDAQ Market Overview JSON Parse Error:",
            error
        );

        console.error(
            "NASDAQ Market Overview RAW Gemini Response:",
            rawText
        );

        throw new Error(
            "NASDAQ Market Overview returned invalid JSON."
        );
    }


    console.log(
        "NASDAQ Market Overview JSON parsed successfully."
    );

    console.log(
        "NASDAQ Market Overview AI research complete."
    );


    return overview;
}


/* =========================================
CLEAN OVERVIEW
========================================= */

function cleanOverview(overview) {

    if (
        !overview ||
        typeof overview !== "object"
    ) {
        return null;
    }


    const nasdaqComposite = {

        close:
            cleanField(
                overview.nasdaqComposite?.close,
                40
            ),

        changePercent:
            cleanField(
                overview.nasdaqComposite?.changePercent,
                30
            ),

        summary:
            cleanField(
                overview.nasdaqComposite?.summary,
                300
            )

    };


    const nasdaq100 = {

        close:
            cleanField(
                overview.nasdaq100?.close,
                40
            ),

        changePercent:
            cleanField(
                overview.nasdaq100?.changePercent,
                30
            ),

        summary:
            cleanField(
                overview.nasdaq100?.summary,
                300
            )

    };


    const strongAreas =
        Array.isArray(overview.strongAreas)
            ? overview.strongAreas
                .slice(0, 3)
                .map(
                    item => ({

                        name:
                            cleanField(
                                item?.name,
                                100
                            ),

                        summary:
                            cleanField(
                                item?.summary,
                                300
                            )

                    })
                )
                .filter(
                    item =>
                        item.name &&
                        item.summary
                )
            : [];


    const weakAreas =
        Array.isArray(overview.weakAreas)
            ? overview.weakAreas
                .slice(0, 3)
                .map(
                    item => ({

                        name:
                            cleanField(
                                item?.name,
                                100
                            ),

                        summary:
                            cleanField(
                                item?.summary,
                                300
                            )

                    })
                )
                .filter(
                    item =>
                        item.name &&
                        item.summary
                )
            : [];


    const marketDrivers =
        Array.isArray(overview.marketDrivers)
            ? overview.marketDrivers
                .slice(0, 3)
                .map(
                    item => ({

                        headline:
                            cleanField(
                                item?.headline,
                                180
                            ),

                        summary:
                            cleanField(
                                item?.summary,
                                500
                            )

                    })
                )
                .filter(
                    item =>
                        item.headline &&
                        item.summary
                )
            : [];


    const upcomingEvents =
        Array.isArray(overview.upcomingEvents)
            ? overview.upcomingEvents
                .slice(0, 3)
                .map(
                    item => ({

                        date:
                            cleanField(
                                item?.date,
                                60
                            ),

                        event:
                            cleanField(
                                item?.event,
                                180
                            ),

                        whyItMatters:
                            cleanField(
                                item?.whyItMatters,
                                500
                            )

                    })
                )
                .filter(
                    item =>
                        item.event &&
                        item.whyItMatters
                )
            : [];


    return {

        marketSummary:
            cleanField(
                overview.marketSummary,
                900
            ),

        nasdaqComposite,

        nasdaq100,

        strongAreas,

        weakAreas,

        marketDrivers,

        upcomingEvents,

        takeaway:
            cleanField(
                overview.takeaway,
                700
            )

    };
}


/* =========================================
GET CACHED OVERVIEW
========================================= */

async function getCachedOverview(marketDate) {

    const cacheUrl =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/nasdaq_market_overviews` +
        `?market_date=eq.${encodeURIComponent(marketDate)}` +
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
                "NASDAQ Market Overview Cache Read Error:",
                errorText
            );

            return null;
        }


        const rows =
            await response.json();


        if (
            Array.isArray(rows) &&
            rows.length > 0 &&
            rows[0].overview
        ) {
            return rows[0];
        }


        return null;

    }
    catch (error) {

        console.error(
            "NASDAQ Market Overview Cache Read Error:",
            error
        );

        return null;
    }
}


/* =========================================
SAVE OVERVIEW
========================================= */

async function saveOverview({

    marketDate,
    generatedAt,
    overview

}) {

    const saveUrl =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/nasdaq_market_overviews` +
        `?on_conflict=market_date`;


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

                    body:
                        JSON.stringify({

                            market_date:
                                marketDate,

                            status:
                                "complete",

                            overview,

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
                "NASDAQ Market Overview Cache Save Error:",
                errorText
            );

            return false;
        }


        console.log(
            `NASDAQ Market Overview CACHE SAVED: ${marketDate}`
        );

        return true;

    }
    catch (error) {

        console.error(
            "NASDAQ Market Overview Cache Save Error:",
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


    for (const part of parts) {

        if (part.type !== "literal") {

            values[part.type] =
                part.value;

        }
    }


    return (
        `${values.year}-` +
        `${values.month}-` +
        `${values.day}`
    );
}


/* =========================================
CLEAN OUTPUT
========================================= */

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