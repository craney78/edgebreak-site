export default async function handler(req, res) {

    /* =========================================
       POST ONLY
    ========================================= */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    /* =========================================
       CHECK ENVIRONMENT VARIABLES
    ========================================= */

    if (!process.env.OPENAI_API_KEY) {

        return res.status(500).json({
            error: "AI service is not configured"
        });

    }


    if (
        !process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_KEY
    ) {

        return res.status(500).json({
            error: "Research cache is not configured"
        });

    }


    /* =========================================
       GET COMPANY DATA
    ========================================= */

    const {
        symbol,
        companyName
    } = req.body || {};


    if (!symbol) {

        return res.status(400).json({
            error: "Stock symbol is required"
        });

    }


    const cleanSymbol =
        String(symbol)
            .trim()
            .toUpperCase();


    const cleanCompanyName =
        String(companyName || "")
            .replace(/\(\[.*?\]\(.*?\)\)/g, "")
            .replace(/https?:\/\/\S+/gi, "")
            .replace(/\[[^\]]+\]/g, "")
            .replace(/\s+/g, " ")
            .trim();


    /* =========================================
       CACHE SETTINGS
    ========================================= */

    const researchType =
        "company_overview";


    const cacheDays =
        7;


    try {

        /* =====================================
           CHECK SUPABASE CACHE FIRST
        ===================================== */

        const now =
            new Date().toISOString();


        const cacheUrl =
            `${process.env.SUPABASE_URL}` +
            `/rest/v1/ai_research_cache` +
            `?symbol=eq.${encodeURIComponent(cleanSymbol)}` +
            `&research_type=eq.${researchType}` +
            `&expires_at=gt.${encodeURIComponent(now)}` +
            `&select=data,created_at,expires_at` +
            `&limit=1`;


        const cacheResponse =
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


        if (cacheResponse.ok) {

            const cachedRows =
                await cacheResponse.json();


            if (
                Array.isArray(cachedRows) &&
                cachedRows.length > 0 &&
                cachedRows[0].data
            ) {

                const cachedData =
                    cachedRows[0].data;


                console.log(
                    `EdgeBreak AI CACHE HIT: ${cleanSymbol} company_overview`
                );


                return res.status(200).json({

                    success: true,

                    cached: true,

                    symbol:
                        cleanSymbol,

                    companyName:
                        cachedData.companyName,

                    companyOverview:
                        cachedData.companyOverview,

                    cacheCreatedAt:
                        cachedRows[0].created_at,

                    cacheExpiresAt:
                        cachedRows[0].expires_at

                });

            }

        }
        else {

            /*
            Cache failure should NOT stop research.

            If Supabase temporarily fails, EdgeBreak
            can still perform the OpenAI request.
            */

            const cacheError =
                await cacheResponse.text();


            console.error(
                "Company Overview Cache Read Error:",
                cacheError
            );

        }


        console.log(
            `EdgeBreak AI CACHE MISS: ${cleanSymbol} company_overview`
        );


        /* =====================================
           COMPANY OVERVIEW RESEARCH
        ===================================== */

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${process.env.OPENAI_API_KEY}`

                },

                body: JSON.stringify({

                    model: "gpt-5-mini",

                    tools: [
                        {
                            type: "web_search"
                        }
                    ],

                    tool_choice: "auto",

                    input: `
You are EdgeBreak AI Research.

Research the company currently represented by
NASDAQ ticker ${cleanSymbol}.

Known company name:
${cleanCompanyName || "Not supplied"}

Use current web search to verify the company.

Prefer authoritative sources in this order:

1. Official company website
2. Official investor relations website
3. SEC filings
4. NASDAQ or exchange information

Research ONLY the Company Overview.

Return:

- Verified company name
- Industry
- Headquarters
- Chief Executive Officer
- Approximate employee count
- Main products or services
- Main geographic markets

IMPORTANT RULES:

Return factual company information only.

Do not provide investment advice.

Do not provide buy, sell or hold recommendations.

Do not provide price targets.

Do not predict stock performance.

Do not describe the stock as bullish or bearish.

Do not include citations in any field.

Do not include URLs in any field.

Do not include markdown links in any field.

Do not include source names in any field.

Do not include explanatory notes.

Do not include commentary before or after the data.

If a fact cannot be reliably verified,
return exactly "Not verified".

Company name:
Return the current official company name associated
with ticker ${cleanSymbol}.

Industry:
Use a short industry description.

Headquarters:
Return city and state/country only.

CEO:
Return the person's name only.

Employees:
Return the approximate number only where possible.

Main products or services:
Maximum two concise sentences.

Geographic markets:
Maximum two concise sentences.
`,

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "edgebreak_company_overview",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    companyName: {
                                        type: "string"
                                    },

                                    industry: {
                                        type: "string"
                                    },

                                    headquarters: {
                                        type: "string"
                                    },

                                    ceo: {
                                        type: "string"
                                    },

                                    employees: {
                                        type: "string"
                                    },

                                    mainProducts: {
                                        type: "string"
                                    },

                                    geographicMarkets: {
                                        type: "string"
                                    }

                                },

                                required: [
                                    "companyName",
                                    "industry",
                                    "headquarters",
                                    "ceo",
                                    "employees",
                                    "mainProducts",
                                    "geographicMarkets"
                                ],

                                additionalProperties:
                                    false

                            }

                        }

                    }

                })

            }
        );


        const data =
            await response.json();


        /* =====================================
           OPENAI ERROR
        ===================================== */

        if (!response.ok) {

            console.error(
                "Company Overview API Error:",
                JSON.stringify(data)
            );


            return res
                .status(response.status)
                .json({

                    error:
                        data?.error?.message ||
                        "Company overview request failed"

                });

        }


        /* =====================================
           EXTRACT FINAL OUTPUT
        ===================================== */

        let outputText = "";


        if (Array.isArray(data.output)) {

            for (const item of data.output) {

                if (item.type !== "message") {
                    continue;
                }


                if (!Array.isArray(item.content)) {
                    continue;
                }


                for (const content of item.content) {

                    if (
                        content.type === "output_text" &&
                        typeof content.text === "string"
                    ) {

                        outputText =
                            content.text.trim();

                    }

                }

            }

        }


        if (!outputText) {

            console.error(
                "No final company overview output:",
                JSON.stringify(data)
            );


            return res.status(500).json({

                error:
                    "No company overview was returned"

            });

        }


        /* =====================================
           PARSE STRUCTURED JSON
        ===================================== */

        let overview;


        try {

            overview =
                JSON.parse(outputText);

        }
        catch (error) {

            console.error(
                "Company Overview JSON Parse Error:",
                outputText
            );


            return res.status(500).json({

                error:
                    "Unable to process company overview"

            });

        }


        /* =====================================
           CLEAN FIELD
        ===================================== */

        function cleanField(value) {

            if (
                value === null ||
                value === undefined
            ) {

                return "Not verified";

            }


            const cleaned =
                String(value)

                    .replace(
                        /https?:\/\/[^\s)]+/gi,
                        ""
                    )

                    .replace(
                        /\[[^\]]+\]\([^)]+\)/g,
                        ""
                    )

                    .replace(
                        /\[[^\]]+\]/g,
                        ""
                    )

                    .replace(
                        /\(\s*\)/g,
                        ""
                    )

                    .replace(
                        /\s+/g,
                        " "
                    )

                    .trim();


            if (!cleaned) {

                return "Not verified";

            }


            return cleaned;

        }


        /* =====================================
           BUILD SAFE OBJECT
        ===================================== */

        const cleanOverview = {

            companyName:
                cleanField(
                    overview.companyName
                ),

            industry:
                cleanField(
                    overview.industry
                ),

            headquarters:
                cleanField(
                    overview.headquarters
                ),

            ceo:
                cleanField(
                    overview.ceo
                ),

            employees:
                cleanField(
                    overview.employees
                ),

            mainProducts:
                cleanField(
                    overview.mainProducts
                ),

            geographicMarkets:
                cleanField(
                    overview.geographicMarkets
                )

        };


        /* =====================================
           BUILD CACHE DATA
        ===================================== */

        const cacheData = {

            companyName:
                cleanOverview.companyName,

            companyOverview:
                cleanOverview

        };


        const expiresAt =
            new Date(
                Date.now() +
                cacheDays *
                24 *
                60 *
                60 *
                1000
            ).toISOString();


        /* =====================================
           SAVE / UPDATE SUPABASE CACHE
        ===================================== */

        const saveUrl =
            `${process.env.SUPABASE_URL}` +
            `/rest/v1/ai_research_cache` +
            `?on_conflict=symbol,research_type`;


        const saveResponse =
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

                        symbol:
                            cleanSymbol,

                        research_type:
                            researchType,

                        data:
                            cacheData,

                        created_at:
                            new Date().toISOString(),

                        expires_at:
                            expiresAt

                    })

                }
            );


        if (!saveResponse.ok) {

            /*
            Do not fail the user's research just
            because caching failed.
            */

            const saveError =
                await saveResponse.text();


            console.error(
                "Company Overview Cache Save Error:",
                saveError
            );

        }
        else {

            console.log(
                `EdgeBreak AI CACHE SAVED: ${cleanSymbol} company_overview`
            );

        }


        /* =====================================
           RETURN CLEAN DATA
        ===================================== */

        return res.status(200).json({

            success: true,

            cached: false,

            symbol:
                cleanSymbol,

            companyName:
                cleanOverview.companyName,

            companyOverview:
                cleanOverview,

            cacheExpiresAt:
                expiresAt

        });

    }
    catch (error) {

        console.error(
            "EdgeBreak Company Overview Error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete company overview"

        });

    }

}