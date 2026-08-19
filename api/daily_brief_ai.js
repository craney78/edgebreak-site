/* =========================================
EDGEBREAK DAILY BRIEF AI
/api/daily_brief_ai.js

BACKGROUND INTERACTIONS VERSION

ACTIONS:

status
- Return completed Daily Brief if cached.
- Otherwise return current research status.

start
- Start ONE Gemini background research job.
- Save interaction ID to Supabase.
- Return immediately.

check
- Ask Google for interaction status.
- If still running, return status.
- If complete, extract/validate result.
- Save completed Daily Brief to Supabase.
========================================= */


const GEMINI_BASE =
    "https://generativelanguage.googleapis.com/v1beta";

const API_REVISION =
    "2026-05-20";


export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed."
        });

    }


    if (
        !process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_KEY
    ) {

        return res.status(500).json({
            error:
                "Daily Brief cache is not configured."
        });

    }


    try {

        const action =
            String(
                req.body?.action || "status"
            )
                .trim()
                .toLowerCase();


        const briefDate =
            getNewYorkDate();


        console.log(
            `Daily Brief ${action}: ${briefDate}`
        );


        /* =====================================
        STATUS
        ===================================== */

        if (action === "status") {

            const row =
                await getDailyBriefRow(
                    briefDate
                );


            if (
                row?.status === "complete" &&
                row?.ai_results
            ) {

                return res.status(200).json({

                    success: true,

                    complete: true,

                    cached: true,

                    researchStatus:
                        "completed",

                    briefDate:
                        row.brief_date,

                    generatedAt:
                        row.generated_at,

                    companiesReviewed:
                        row.companies_reviewed,

                    companiesIncluded:
                        row.companies_included,

                    results:
                        Array.isArray(
                            row.ai_results?.results
                        )
                            ? row.ai_results.results
                            : [],

                    usage:
                        row.usage_data || null

                });

            }


            if (
                row?.interaction_id &&
                row?.research_status
            ) {

                return res.status(200).json({

                    success: true,

                    complete: false,

                    cached: false,

                    briefDate,

                    researchStatus:
                        row.research_status,

                    interactionExists:
                        true,

                    researchStartedAt:
                        row.research_started_at || null

                });

            }


            return res.status(200).json({

                success: true,

                complete: false,

                cached: false,

                briefDate,

                researchStatus:
                    "not_started",

                interactionExists:
                    false

            });

        }


        /* =====================================
        START BACKGROUND RESEARCH
        ===================================== */

        if (action === "start") {

            if (!process.env.GEMINI_API_KEY) {

                return res.status(500).json({
                    error:
                        "Daily Brief AI is not configured."
                });

            }


            const candidates =
                cleanCandidates(
                    req.body?.candidates
                );


            if (
                candidates.length === 0
            ) {

                return res.status(400).json({
                    error:
                        "No Daily Brief candidates were supplied."
                });

            }


            if (
                candidates.length > 150
            ) {

                return res.status(400).json({
                    error:
                        "Too many Daily Brief candidates were supplied."
                });

            }


            /* =================================
            DON'T START DUPLICATE JOB
            ================================= */

            const existing =
                await getDailyBriefRow(
                    briefDate
                );


            if (
                existing?.status === "complete" &&
                existing?.ai_results
            ) {

                return res.status(200).json({

                    success: true,

                    complete: true,

                    cached: true,

                    researchStatus:
                        "completed",

                    briefDate,

                    generatedAt:
                        existing.generated_at,

                    companiesReviewed:
                        existing.companies_reviewed,

                    companiesIncluded:
                        existing.companies_included,

                    results:
                        existing.ai_results?.results || [],

                    usage:
                        existing.usage_data || null

                });

            }


            if (
                existing?.interaction_id &&
                (
                    existing?.research_status === "queued" ||
                    existing?.research_status === "in_progress" ||
                    existing?.research_status === "requires_action"
                )
            ) {

                console.log(
                    "Daily Brief research already exists."
                );

                return res.status(200).json({

                    success: true,

                    complete: false,

                    started: false,

                    researchStatus:
                        existing.research_status,

                    briefDate

                });

            }


            /* =================================
            BUILD RESEARCH INSTRUCTION
            ================================= */

            const prompt =
                buildResearchPrompt(
                    candidates,
                    briefDate
                );


            console.log(
                `Starting background Daily Brief research for ${candidates.length} candidates.`
            );


            /* =================================
            START GOOGLE BACKGROUND INTERACTION
            ================================= */

            const interactionResponse =
                await fetch(
                    `${GEMINI_BASE}/interactions`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                process.env.GEMINI_API_KEY,

                            "Api-Revision":
                                API_REVISION

                        },

                        body:
                            JSON.stringify({

                                model:
                                    "gemini-3.6-flash",

                                input:
                                    prompt,

                                system_instruction:
                                    buildSystemInstruction(),

                                background:
                                    true,

                                store:
                                    true,

                                tools: [
                                    {
                                        type: "google_search",
                                        search_types: [
                                            "web_search"
                                        ]
                                    }
                                ],

                                response_format: {

                                    type: "text",

                                    mime_type:
                                        "application/json",

                                    schema: {

                                        type: "object",

                                        properties: {

                                            results: {

                                                type: "array",

                                                items: {

                                                    type: "object",

                                                    properties: {

                                                        symbols: {
                                                            type: "array",
                                                            items: {
                                                                type: "string"
                                                            }
                                                        },

                                                        companyName: {
                                                            type: "string"
                                                        },

                                                        scanners: {
                                                            type: "array",
                                                            items: {
                                                                type: "string"
                                                            }
                                                        },

                                                        attentionLevel: {
                                                            type: "string",
                                                            enum: [
                                                                "HIGH",
                                                                "ELEVATED",
                                                                "NOTABLE"
                                                            ]
                                                        },

                                                        headline: {
                                                            type: "string"
                                                        },

                                                        summary: {
                                                            type: "string"
                                                        },

                                                        currentDevelopment: {
                                                            type: "string"
                                                        },

                                                        whyIncluded: {
                                                            type: "string"
                                                        },

                                                        developmentDate: {
                                                            type: "string"
                                                        },

                                                        sourceNames: {
                                                            type: "array",
                                                            items: {
                                                                type: "string"
                                                            }
                                                        }

                                                    },

                                                    required: [
                                                        "symbols",
                                                        "companyName",
                                                        "scanners",
                                                        "attentionLevel",
                                                        "headline",
                                                        "summary",
                                                        "currentDevelopment",
                                                        "whyIncluded",
                                                        "developmentDate",
                                                        "sourceNames"
                                                    ],

                                                    additionalProperties:
                                                        false

                                                }

                                            }

                                        },

                                        required: [
                                            "results"
                                        ],

                                        additionalProperties:
                                            false

                                    }

                                },

                                generation_config: {

                                    max_output_tokens:
                                        16000,

                                    thinking_level:
                                        "medium"

                                }

                            })

                    }
                );


            const interactionText =
                await interactionResponse.text();


            let interaction;


            try {

                interaction =
                    interactionText
                        ? JSON.parse(
                            interactionText
                        )
                        : {};

            }
            catch {

                console.error(
                    "Gemini interaction returned non-JSON:",
                    interactionText
                );


                return res.status(502).json({
                    error:
                        "Gemini returned an invalid research response."
                });

            }


            if (!interactionResponse.ok) {

                console.error(
                    "Gemini interaction start error:",
                    interactionResponse.status,
                    interaction
                );


                return res.status(
                    interactionResponse.status
                ).json({

                    error:
                        interaction?.error?.message ||
                        "Unable to start Daily Brief research."

                });

            }


            if (!interaction?.id) {

                console.error(
                    "Gemini interaction had no ID:",
                    interaction
                );


                return res.status(502).json({
                    error:
                        "Gemini did not return a research job ID."
                });

            }


            console.log(
                `Daily Brief interaction started: ${interaction.id}`
            );


            /* =================================
            SAVE INTERACTION ID
            ================================= */

            await saveResearchJob({

                briefDate,

                interactionId:
                    interaction.id,

                researchStatus:
                    interaction.status ||
                    "in_progress",

                companiesReviewed:
                    candidates.length

            });


            return res.status(202).json({

                success: true,

                complete: false,

                started: true,

                briefDate,

                researchStatus:
                    interaction.status ||
                    "in_progress",

                companiesReviewed:
                    candidates.length

            });

        }


        /* =====================================
        CHECK BACKGROUND RESEARCH
        ===================================== */

        if (action === "check") {

            if (!process.env.GEMINI_API_KEY) {

                return res.status(500).json({
                    error:
                        "Daily Brief AI is not configured."
                });

            }


            const row =
                await getDailyBriefRow(
                    briefDate
                );


            if (
                row?.status === "complete" &&
                row?.ai_results
            ) {

                return res.status(200).json({

                    success: true,

                    complete: true,

                    cached: true,

                    researchStatus:
                        "completed",

                    briefDate,

                    generatedAt:
                        row.generated_at,

                    companiesReviewed:
                        row.companies_reviewed,

                    companiesIncluded:
                        row.companies_included,

                    results:
                        row.ai_results?.results || [],

                    usage:
                        row.usage_data || null

                });

            }


            if (!row?.interaction_id) {

                return res.status(404).json({
                    error:
                        "No Daily Brief research job exists for today."
                });

            }


            /* =================================
            GET INTERACTION FROM GOOGLE
            ================================= */

            const googleResponse =
                await fetch(

                    `${GEMINI_BASE}/interactions/${encodeURIComponent(
                        row.interaction_id
                    )}`,

                    {

                        method: "GET",

                        headers: {

                            "x-goog-api-key":
                                process.env.GEMINI_API_KEY,

                            "Api-Revision":
                                API_REVISION

                        }

                    }

                );


            const googleText =
                await googleResponse.text();


            let interaction;


            try {

                interaction =
                    googleText
                        ? JSON.parse(
                            googleText
                        )
                        : {};

            }
            catch {

                console.error(
                    "Gemini interaction check returned non-JSON:",
                    googleText
                );


                return res.status(502).json({
                    error:
                        "Unable to read Daily Brief research status."
                });

            }


            if (!googleResponse.ok) {

                console.error(
                    "Gemini interaction check error:",
                    googleResponse.status,
                    interaction
                );


                return res.status(
                    googleResponse.status
                ).json({

                    error:
                        interaction?.error?.message ||
                        "Unable to check Daily Brief research."

                });

            }


            const researchStatus =
                String(
                    interaction?.status ||
                    "unknown"
                );


            console.log(
                `Daily Brief interaction status: ${researchStatus}`
            );


            /* =================================
            STILL WORKING
            ================================= */

            if (
                researchStatus === "queued" ||
                researchStatus === "in_progress" ||
                researchStatus === "requires_action"
            ) {

                await updateResearchStatus(
                    briefDate,
                    researchStatus
                );

                return res.status(200).json({

                    success: true,

                    complete: false,

                    briefDate,

                    researchStatus

                });

            }


            /* =================================
            FAILED
            ================================= */

            if (
                researchStatus === "failed" ||
                researchStatus === "cancelled"
            ) {

                const errorMessage =
                    extractInteractionError(
                        interaction
                    );


                console.error(
                    "Daily Brief FAILED interaction:",
                    JSON.stringify(
                        interaction,
                        null,
                        2
                    )
                );


                await saveResearchFailure({

                    briefDate,

                    researchStatus,

                    errorMessage

                });


                console.error(
                    "Daily Brief background research failed:",
                    errorMessage
                );


                return res.status(503).json({

                    error:
                        "Daily Brief research could not be completed.",

                    researchStatus

                });

            }


            /* =================================
            INCOMPLETE
            ================================= */

            if (
                researchStatus === "incomplete"
            ) {

                console.error(
                    "Daily Brief INCOMPLETE interaction:",
                    JSON.stringify(
                        interaction,
                        null,
                        2
                    )
                );


                const incompleteReason =
                    interaction?.incomplete_details?.reason ||
                    interaction?.incompleteDetails?.reason ||
                    interaction?.error?.message ||
                    "Unknown incomplete reason";


                console.error(
                    "Daily Brief incomplete reason:",
                    incompleteReason
                );


                if (interaction?.usage) {

                    console.error(
                        "Daily Brief incomplete usage:",
                        JSON.stringify(
                            interaction.usage,
                            null,
                            2
                        )
                    );

                }


                const partialOutput =
                    extractOutputText(
                        interaction
                    );


                if (partialOutput) {

                    console.error(
                        "Daily Brief partial output:",
                        partialOutput
                    );

                }


                const errorMessage =
                    `Gemini incomplete: ${incompleteReason}`;


                await saveResearchFailure({

                    briefDate,

                    researchStatus,

                    errorMessage

                });


                return res.status(503).json({

                    error:
                        "Daily Brief research returned an incomplete result.",

                    researchStatus,

                    incompleteReason

                });

            }


            /* =================================
            COMPLETED
            ================================= */

            if (
                researchStatus === "completed"
            ) {

                const outputText =
                    extractOutputText(
                        interaction
                    );


                if (!outputText) {

                    console.error(
                        "Completed interaction contained no output text.",
                        interaction
                    );


                    await saveResearchFailure({

                        briefDate,

                        researchStatus:
                            "failed",

                        errorMessage:
                            "Completed interaction contained no output text."

                    });


                    return res.status(502).json({
                        error:
                            "Daily Brief research returned no usable result."
                    });

                }


                /* =============================
                PARSE MODEL JSON
                ============================= */

                let parsed;


                try {

                    parsed =
                        JSON.parse(
                            cleanJsonText(
                                outputText
                            )
                        );

                }
                catch (error) {

                    console.error(
                        "Daily Brief JSON parse error:",
                        outputText
                    );


                    await saveResearchFailure({

                        briefDate,

                        researchStatus:
                            "failed",

                        errorMessage:
                            "Gemini returned invalid JSON."

                    });


                    return res.status(502).json({
                        error:
                            "Daily Brief research returned invalid JSON."
                    });

                }


                /* =============================
                VALIDATE RESULTS
                ============================= */

                const results =
                    cleanResearchResults(
                        parsed?.results
                    );


                if (
                    containsProhibitedAdvice(
                        results
                    )
                ) {

                    await saveResearchFailure({

                        briefDate,

                        researchStatus:
                            "failed",

                        errorMessage:
                            "Output failed Daily Brief safety validation."

                    });


                    return res.status(422).json({
                        error:
                            "Today's Daily Brief could not be displayed."
                    });

                }


                const generatedAt =
                    new Date()
                        .toISOString();


                const companiesReviewed =
                    Number(
                        row.companies_reviewed || 0
                    );


                const usage =
                    interaction?.usage || null;


                console.log(
                    "Daily Brief Gemini usage:",
                    JSON.stringify(
                        usage
                    )
                );


                if (
                    Array.isArray(
                        usage?.grounding_tool_count
                    )
                ) {

                    console.log(
                        "Daily Brief grounding usage:",
                        JSON.stringify(
                            usage.grounding_tool_count
                        )
                    );

                }


                /* =============================
                SAVE FINAL BRIEF
                ============================= */

                await saveCompletedBrief({

                    briefDate,

                    generatedAt,

                    companiesReviewed,

                    companiesIncluded:
                        results.length,

                    results,

                    usage

                });


                console.log(
                    `Daily Brief COMPLETE: ${briefDate} | ${results.length} companies included`
                );


                return res.status(200).json({

                    success: true,

                    complete: true,

                    cached: false,

                    researchStatus:
                        "completed",

                    briefDate,

                    generatedAt,

                    companiesReviewed,

                    companiesIncluded:
                        results.length,

                    results,

                    usage

                });

            }


            return res.status(200).json({

                success: true,

                complete: false,

                briefDate,

                researchStatus

            });

        }


        return res.status(400).json({
            error:
                "Unknown Daily Brief action."
        });


    }
    catch (error) {

        console.error(
            "EdgeBreak Daily Brief Error:",
            error
        );


        return res.status(500).json({

            error:
                "Daily Brief research is temporarily unavailable."

        });

    }

}


/* =========================================
SYSTEM INSTRUCTION
========================================= */

function buildSystemInstruction() {

    return `

You are the market-attention research engine for EdgeBreak.

The supplied NASDAQ companies have ALREADY passed EdgeBreak's
technical stock scanners and initial deterministic filters.

DO NOT perform another technical stock scan.

DO NOT decide whether a company is a good investment.

DO NOT provide buy, sell or hold recommendations.

DO NOT provide price targets, entry prices, expected returns
or predictions.

Your job is to research the supplied companies using current
Google Search information and identify which currently have
noteworthy or unusual market attention, activity, news or
company-specific developments that justify further research.

IMPORTANT:

Do not favour a company because it is large, famous or
regularly covered by financial media.

Smaller and lesser-known companies are important.

A normally quiet company experiencing a sudden increase in
attention may be more relevant than a major company receiving
its normal level of coverage.

LOOK FOR:

- unusual or increasing trading activity
- unusual recent trading volume
- breaking or recent company news
- earnings surprises
- material guidance changes
- significant contracts
- partnerships
- acquisitions or strategic transactions
- FDA or regulatory developments
- clinical trial developments
- important product or technology announcements
- significant SEC filings
- noteworthy analyst developments
- noteworthy institutional developments
- significant management changes
- unusual increases in media or investor attention
- other credible current company-specific catalysts

RECENCY:

Give strongest preference to developments from the last
7 days.

Developments up to 30 days old may be considered when they
remain clearly relevant to current market attention.

Do not include a company merely because:

- its share price increased or decreased
- it is near a 52-week high
- it broke resistance
- its technical chart looks strong
- it has momentum
- it appeared in an EdgeBreak scanner

The scanners already handled technical structure.

There must be a CURRENT factual reason beyond the technical
setup.

Both positive and negative developments may qualify.

Inclusion is NOT an endorsement.

ATTENTION LEVEL:

Every included company must receive exactly one:

HIGH
ELEVATED
NOTABLE

These labels describe CURRENT attention or significance of a
current development.

They are NOT investment ratings.

HIGH:
Particularly significant or clearly unusual current attention
or a major current development.

ELEVATED:
Current attention or developments meaningfully above what
would normally be expected for that company.

NOTABLE:
A credible current development worth investigating, but
attention does not appear unusually high.

DO NOT force companies into the results.

Most supplied companies may be omitted.

Before including a company ask:

"If I ignored its chart and recent share-price performance,
would there STILL be a current factual reason for this
company to appear in today's research?"

If NO, omit it.

`;

}


/* =========================================
RESEARCH PROMPT
========================================= */

function buildResearchPrompt(
    candidates,
    briefDate
) {

    return `

Research the following NASDAQ companies for the EdgeBreak
Daily Brief dated ${briefDate}.

There are ${candidates.length} supplied candidates.

They have already passed EdgeBreak's technical scanners.

Research CURRENT company-specific developments and unusual
market attention using Google Search.

Do not technically rescan the stocks.

Do not provide investment advice.

Do not rank companies according to investment attractiveness.

Return ONLY companies that genuinely satisfy the current
attention/development criteria.

Return valid JSON ONLY using exactly this top-level format:

{
    "results": [
        {
            "symbols": ["TICKER"],
            "companyName": "",
            "scanners": [],
            "attentionLevel": "HIGH",
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

symbols:
Only ticker symbols supplied in the candidate data.

companyName:
Current company name.

scanners:
Use the EdgeBreak scanner names supplied for that company.

attentionLevel:
Exactly HIGH, ELEVATED or NOTABLE.

headline:
Short factual headline describing why the company currently
deserves further investigation.

summary:
One or two concise factual sentences.

currentDevelopment:
Describe the specific current event, catalyst, filing,
announcement, unusual activity or material development.

whyIncluded:
Explain briefly why the CURRENT development or attention is
noteworthy.

developmentDate:
YYYY-MM-DD where reliably known. Otherwise "".

sourceNames:
Short list of principal credible sources supporting the
finding.

Do not invent sources.

Do not include markdown.

Do not include commentary outside the JSON.

CANDIDATES:

${JSON.stringify(
    candidates,
    null,
    2
)}

`;

}


/* =========================================
CLEAN CANDIDATES
========================================= */

function cleanCandidates(
    input
) {

    if (!Array.isArray(input)) {

        return [];

    }


    return input
        .filter(
            item =>
                item &&
                item.symbol
        )
        .map(item => ({

            symbol:
                String(
                    item.symbol
                )
                    .trim()
                    .toUpperCase(),

            scanners:
                Array.isArray(
                    item.scanners
                )
                    ? item.scanners
                        .map(
                            value =>
                                cleanField(
                                    value,
                                    100
                                )
                        )
                        .filter(Boolean)
                    : [],

            company: {

                name:
                    cleanField(
                        item.company?.name,
                        200
                    ),

                sector:
                    cleanField(
                        item.company?.sector,
                        150
                    ),

                industry:
                    cleanField(
                        item.company?.industry,
                        150
                    )

            }

        }));

}


/* =========================================
EXTRACT INTERACTION OUTPUT
========================================= */

function extractOutputText(
    interaction
) {

    if (
        typeof interaction?.output_text ===
        "string"
    ) {

        return interaction.output_text.trim();

    }


    const pieces = [];


    if (
        Array.isArray(
            interaction?.steps
        )
    ) {

        for (
            const step of
            interaction.steps
        ) {

            if (
                step?.type !==
                "model_output"
            ) {

                continue;

            }


            if (
                !Array.isArray(
                    step?.content
                )
            ) {

                continue;

            }


            for (
                const block of
                step.content
            ) {

                if (
                    block?.type === "text" &&
                    typeof block?.text ===
                        "string"
                ) {

                    pieces.push(
                        block.text
                    );

                }

            }

        }

    }


    return pieces
        .join("")
        .trim();

}


/* =========================================
INTERACTION ERROR
========================================= */

function extractInteractionError(
    interaction
) {

    if (
        typeof interaction?.error?.message ===
        "string"
    ) {

        return interaction.error.message;

    }


    return (
        `Gemini interaction ended with status: ` +
        `${interaction?.status || "unknown"}`
    );

}


/* =========================================
CLEAN MODEL RESULTS
========================================= */

function cleanResearchResults(
    results
) {

    if (!Array.isArray(results)) {

        return [];

    }


    const allowed =
        new Set([
            "HIGH",
            "ELEVATED",
            "NOTABLE"
        ]);


    return results
        .map(item => {

            if (
                !item ||
                typeof item !== "object"
            ) {

                return null;

            }


            const symbols =
                Array.isArray(
                    item.symbols
                )
                    ? [
                        ...new Set(
                            item.symbols
                                .map(
                                    value =>
                                        String(value)
                                            .trim()
                                            .toUpperCase()
                                )
                                .filter(Boolean)
                        )
                    ]
                    : [];


            const attentionLevel =
                String(
                    item.attentionLevel || ""
                )
                    .trim()
                    .toUpperCase();


            if (
                symbols.length === 0 ||
                !allowed.has(
                    attentionLevel
                )
            ) {

                return null;

            }


            return {

                symbols,

                companyName:
                    cleanField(
                        item.companyName,
                        200
                    ),

                scanners:
                    Array.isArray(
                        item.scanners
                    )
                        ? item.scanners
                            .map(
                                value =>
                                    cleanField(
                                        value,
                                        100
                                    )
                            )
                            .filter(Boolean)
                        : [],

                attentionLevel,

                headline:
                    cleanField(
                        item.headline,
                        250
                    ),

                summary:
                    cleanField(
                        item.summary,
                        800
                    ),

                currentDevelopment:
                    cleanField(
                        item.currentDevelopment,
                        1200
                    ),

                whyIncluded:
                    cleanField(
                        item.whyIncluded,
                        900
                    ),

                developmentDate:
                    cleanField(
                        item.developmentDate,
                        40
                    ),

                sourceNames:
                    Array.isArray(
                        item.sourceNames
                    )
                        ? item.sourceNames
                            .map(
                                value =>
                                    cleanField(
                                        value,
                                        160
                                    )
                            )
                            .filter(Boolean)
                        : []

            };

        })
        .filter(Boolean);

}


/* =========================================
SAFETY
========================================= */

function containsProhibitedAdvice(
    results
) {

    const text =
        JSON.stringify(
            results
        );


    const patterns = [

        /\bstrong buy\b/i,
        /\bstrong sell\b/i,
        /\byou should buy\b/i,
        /\byou should sell\b/i,
        /\byou should hold\b/i,
        /\bbuy opportunity\b/i,
        /\bsell opportunity\b/i,
        /\bprice target\b/i,
        /\btarget price\b/i,
        /\bexpected return\b/i,
        /\bguaranteed return\b/i,
        /\bguaranteed profit\b/i,
        /\bshould enter\b/i,
        /\bshould exit\b/i

    ];


    return patterns.some(
        pattern =>
            pattern.test(text)
    );

}


/* =========================================
SUPABASE — READ TODAY
========================================= */

async function getDailyBriefRow(
    briefDate
) {

    const url =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_briefs` +
        `?brief_date=eq.${encodeURIComponent(briefDate)}` +
        `&select=*` +
        `&limit=1`;


    const response =
        await supabaseFetch(
            url,
            {
                method: "GET"
            }
        );


    if (!response.ok) {

        console.error(
            "Daily Brief Supabase read error:",
            await response.text()
        );


        throw new Error(
            "Unable to read Daily Brief cache."
        );

    }


    const rows =
        await response.json();


    return (
        Array.isArray(rows) &&
        rows.length > 0
    )
        ? rows[0]
        : null;

}


/* =========================================
SAVE BACKGROUND JOB
========================================= */

async function saveResearchJob({

    briefDate,
    interactionId,
    researchStatus,
    companiesReviewed

}) {

    const now =
        new Date()
            .toISOString();


    await upsertDailyBrief({

        brief_date:
            briefDate,

        status:
            "researching",

        interaction_id:
            interactionId,

        research_status:
            researchStatus,

        research_started_at:
            now,

        research_error:
            null,

        companies_reviewed:
            companiesReviewed,

        companies_included:
            0,

        ai_results:
            null,

        usage_data:
            null,

        generated_at:
            null,

        updated_at:
            now

    });

}


/* =========================================
UPDATE RESEARCH STATUS
========================================= */

async function updateResearchStatus(
    briefDate,
    researchStatus
) {

    await patchDailyBrief(
        briefDate,
        {

            research_status:
                researchStatus,

            updated_at:
                new Date()
                    .toISOString()

        }
    );

}


/* =========================================
SAVE FAILURE
========================================= */

async function saveResearchFailure({

    briefDate,
    researchStatus,
    errorMessage

}) {

    await patchDailyBrief(
        briefDate,
        {

            status:
                "failed",

            research_status:
                researchStatus,

            research_error:
                cleanField(
                    errorMessage,
                    1500
                ),

            updated_at:
                new Date()
                    .toISOString()

        }
    );

}


/* =========================================
SAVE COMPLETED BRIEF
========================================= */

async function saveCompletedBrief({

    briefDate,
    generatedAt,
    companiesReviewed,
    companiesIncluded,
    results,
    usage

}) {

    await patchDailyBrief(
        briefDate,
        {

            status:
                "complete",

            research_status:
                "completed",

            research_error:
                null,

            companies_reviewed:
                companiesReviewed,

            companies_included:
                companiesIncluded,

            ai_results: {
                results
            },

            usage_data:
                usage,

            generated_at:
                generatedAt,

            updated_at:
                generatedAt

        }
    );

}


/* =========================================
UPSERT DAILY BRIEF
========================================= */

async function upsertDailyBrief(
    body
) {

    const url =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_briefs` +
        `?on_conflict=brief_date`;


    const response =
        await supabaseFetch(
            url,
            {

                method: "POST",

                headers: {

                    "Prefer":
                        "resolution=merge-duplicates,return=minimal"

                },

                body:
                    JSON.stringify(
                        body
                    )

            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        console.error(
            "Daily Brief Supabase upsert error:",
            errorText
        );


        throw new Error(
            "Unable to save Daily Brief research job."
        );

    }

}


/* =========================================
PATCH DAILY BRIEF
========================================= */

async function patchDailyBrief(
    briefDate,
    body
) {

    const url =
        `${process.env.SUPABASE_URL}` +
        `/rest/v1/daily_briefs` +
        `?brief_date=eq.${encodeURIComponent(
            briefDate
        )}`;


    const response =
        await supabaseFetch(
            url,
            {

                method: "PATCH",

                headers: {

                    "Prefer":
                        "return=minimal"

                },

                body:
                    JSON.stringify(
                        body
                    )

            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        console.error(
            "Daily Brief Supabase patch error:",
            errorText
        );


        throw new Error(
            "Unable to update Daily Brief."
        );

    }

}


/* =========================================
SUPABASE FETCH
========================================= */

function supabaseFetch(
    url,
    options = {}
) {

    return fetch(
        url,
        {

            ...options,

            headers: {

                "apikey":
                    process.env.SUPABASE_SERVICE_KEY,

                "Authorization":
                    `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,

                "Content-Type":
                    "application/json",

                ...(options.headers || {})

            }

        }
    );

}


/* =========================================
CLEAN JSON
========================================= */

function cleanJsonText(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /^```json\s*/i,
            ""
        )
        .replace(
            /^```\s*/i,
            ""
        )
        .replace(
            /```\s*$/i,
            ""
        )
        .trim();

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


    for (
        const part of
        parts
    ) {

        if (
            part.type !== "literal"
        ) {

            values[
                part.type
            ] = part.value;

        }

    }


    return (
        `${values.year}-` +
        `${values.month}-` +
        `${values.day}`
    );

}


/* =========================================
CLEAN FIELD
========================================= */

function cleanField(
    value,
    maxLength = 800
) {

    if (
        typeof value !== "string"
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