import json
import os
from datetime import datetime, timezone, timedelta

import requests


# ============================================================
# EDGEBREAK FINRA OFF-EXCHANGE HISTORY BUILDER
# ============================================================
#
# IMPORTANT PIPELINE RULE:
#
# This file DOES NOT feed or alter the scanners.
#
# It runs only AFTER the existing Daily Brief:
#
#     scanner results
#         ↓
#     hard culls
#         ↓
#     technical / indicator / persistence ranking
#         ↓
#     daily_brief_candidates.json
#
# THEN this FINRA builder runs.
#
# Existing scanner flow stays untouched:
#
#     scanner source data
#         ↓
#     Breakout Scanner
#     Pre-Breakout Scanner
#     Launch Pad Scanner
#         ↓
#     existing scanner JSON files
#         ↓
#     website
#
# FINRA layer:
#
#     daily_brief_candidates.json
#         ↓
#     this FINRA builder
#         ↓
#     finra_off_exchange_history.json
#         ↓
#     X-Factor reranker
#
# FINRA can analyse stocks already selected by EdgeBreak.
#
# It DOES NOT rescue stocks that failed the existing cull.
#
# It DOES NOT change the scanner ranking in this file.
#
# The reranking happens later in a separate X-Factor stage.
#
#
# IMPORTANT:
#
# FINRA off-exchange activity measures trading ACTIVITY only.
#
# It does NOT tell us:
#
#     whether trades were buys
#     whether trades were sells
#     whether institutions were accumulating
#     whether institutions were distributing
#
# ============================================================


# ============================================================
# FILES
# ============================================================

CANDIDATES_FILE = (
    "daily_brief_candidates.json"
)

OUTPUT_FILE = (
    "finra_off_exchange_history.json"
)


# ============================================================
# FINRA CREDENTIALS
# ============================================================
#
# Preferred:
#
# Use Windows environment variables:
#
#     FINRA_CLIENT_ID
#     FINRA_CLIENT_SECRET
#
# If you are still using hard-coded credentials locally,
# paste your existing values into the fallback strings below.
#
# Do NOT publish or commit your credentials.
#
# ============================================================

FINRA_CLIENT_ID = os.getenv(
    "FINRA_CLIENT_ID",
    "b3a3be63faac4ea18d57"
)

FINRA_CLIENT_SECRET = os.getenv(
    "FINRA_CLIENT_SECRET",
    "Rileymaceynoah123"
)


# ============================================================
# FINRA URLS
# ============================================================

FINRA_TOKEN_URL = (
    "https://ews.fip.finra.org/"
    "fip/rest/ews/oauth2/access_token"
    "?grant_type=client_credentials"
)

FINRA_WEEKLY_URL = (
    "https://api.finra.org/"
    "data/group/otcMarket/name/weeklySummary"
)


# ============================================================
# HISTORY SETTINGS
# ============================================================
#
# Query slightly more than one year.
#
# Latest 48 weekly observations are used for:
#
#     12 x 4-week blocks
#
# ============================================================

QUERY_LOOKBACK_DAYS = 370

BLOCK_SIZE_WEEKS = 4

TARGET_WEEK_COUNT = 48


# ============================================================
# ACTIVITY INDEX SETTINGS
# ============================================================
#
# Activity Index:
#
#     100 = normal 12-month activity
#
# Examples:
#
#      50 = half normal
#      75 = 25% below normal
#     125 = 25% above normal
#     150 = 50% above normal
#     200 = double normal
#
# ============================================================

VERY_LOW_INDEX = 60

LOW_INDEX = 80

ELEVATED_INDEX = 120

VERY_ELEVATED_INDEX = 150


# ============================================================
# NUMBER HELPERS
# ============================================================

def safe_int(
    value,
    default=0
):

    try:

        if value is None:

            return default

        return int(
            float(
                value
            )
        )

    except (
        TypeError,
        ValueError
    ):

        return default


def safe_float(
    value,
    default=0.0
):

    try:

        if value is None:

            return default

        return float(
            value
        )

    except (
        TypeError,
        ValueError
    ):

        return default


def average(
    values
):

    valid = []


    for value in values:

        number = safe_float(
            value,
            None
        )


        if number is not None:

            valid.append(
                number
            )


    if not valid:

        return None


    return sum(
        valid
    ) / len(
        valid
    )


# ============================================================
# PERCENTAGE DIFFERENCE
# ============================================================

def percentage_difference(
    current,
    baseline
):

    current = safe_float(
        current,
        None
    )


    baseline = safe_float(
        baseline,
        None
    )


    if (
        current is None
        or
        baseline is None
        or
        baseline == 0
    ):

        return None


    return round(

        (
            (
                current
                -
                baseline
            )
            /
            baseline
        )
        *
        100,

        2

    )


# ============================================================
# PERCENTILE RANK
# ============================================================

def percentile_rank(
    values,
    current
):

    if not values:

        return None


    current = safe_float(
        current,
        None
    )


    if current is None:

        return None


    clean_values = []


    for value in values:

        number = safe_float(
            value,
            None
        )


        if number is not None:

            clean_values.append(
                number
            )


    if not clean_values:

        return None


    less_or_equal = sum(

        1

        for value in clean_values

        if value <= current

    )


    percentile = (

        less_or_equal
        /
        len(
            clean_values
        )

    ) * 100


    return round(
        percentile,
        1
    )


# ============================================================
# STANDARD DEVIATION
# ============================================================

def standard_deviation(
    values
):

    clean = []


    for value in values:

        number = safe_float(
            value,
            None
        )


        if number is not None:

            clean.append(
                number
            )


    if len(
        clean
    ) < 2:

        return None


    mean_value = average(
        clean
    )


    variance = sum(

        (
            value
            -
            mean_value
        )
        **
        2

        for value in clean

    ) / len(
        clean
    )


    return variance ** 0.5


# ============================================================
# Z SCORE
# ============================================================

def calculate_z_score(
    value,
    mean_value,
    std_dev
):

    value = safe_float(
        value,
        None
    )


    if (
        value is None
        or
        mean_value is None
        or
        not std_dev
    ):

        return None


    return round(

        (
            value
            -
            mean_value
        )
        /
        std_dev,

        2

    )


# ============================================================
# LOAD ALREADY-RANKED DAILY BRIEF SHORTLIST
# ============================================================
#
# This replaces the old manual TEST_SYMBOLS list.
#
# Whatever stocks survive the existing Daily Brief pipeline
# are automatically passed into FINRA.
#
# ============================================================

def load_daily_brief_shortlist():

    if not os.path.exists(
        CANDIDATES_FILE
    ):

        raise RuntimeError(

            f"{CANDIDATES_FILE} was not found. "
            "Run the existing Daily Brief "
            "cull/ranking first."

        )


    try:

        with open(
            CANDIDATES_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            candidates = json.load(
                file
            )


    except Exception as error:

        raise RuntimeError(

            f"Could not read "
            f"{CANDIDATES_FILE}: "
            f"{error}"

        ) from error


    if not isinstance(
        candidates,
        list
    ):

        raise RuntimeError(

            f"{CANDIDATES_FILE} must contain "
            "a JSON array of ranked candidates."

        )


    symbols = []

    context_by_symbol = {}

    seen = set()


    for fallback_rank, candidate in enumerate(
        candidates,
        start=1
    ):

        if not isinstance(
            candidate,
            dict
        ):

            continue


        symbol = str(

            candidate.get(
                "symbol",
                ""
            )

        ).strip().upper()


        if (
            not symbol
            or
            symbol in seen
        ):

            continue


        seen.add(
            symbol
        )


        # ----------------------------------------------------
        # ORIGINAL EDGEBREAK RANK
        # ----------------------------------------------------

        supplied_rank = candidate.get(
            "daily_brief_rank"
        )


        try:

            original_rank = int(
                supplied_rank
            )


        except (
            TypeError,
            ValueError
        ):

            original_rank = fallback_rank


        # ----------------------------------------------------
        # ORIGINAL EDGEBREAK SCORE
        # ----------------------------------------------------

        ranking = candidate.get(
            "daily_brief_ranking",
            {}
        )


        if not isinstance(
            ranking,
            dict
        ):

            ranking = {}


        original_score = safe_float(

            ranking.get(
                "total_score"
            ),

            None

        )


        # ----------------------------------------------------
        # SCANNER SOURCE
        # ----------------------------------------------------

        scanners = candidate.get(
            "scanners",
            []
        )


        if not isinstance(
            scanners,
            list
        ):

            scanners = []


        symbols.append(
            symbol
        )


        context_by_symbol[
            symbol
        ] = {

            "original_daily_brief_rank":
                original_rank,

            "original_daily_brief_score":
                original_score,

            "scanners":
                scanners

        }


    if not symbols:

        raise RuntimeError(

            f"No valid symbols were found "
            f"in {CANDIDATES_FILE}."

        )


    return (
        symbols,
        context_by_symbol
    )


# ============================================================
# FINRA AUTHENTICATION
# ============================================================

def get_finra_access_token():

    if (
        not FINRA_CLIENT_ID
        or
        FINRA_CLIENT_ID
        ==
        "PASTE_FINRA_CLIENT_ID_HERE"
    ):

        raise RuntimeError(
            "FINRA_CLIENT_ID has not been configured."
        )


    if (
        not FINRA_CLIENT_SECRET
        or
        FINRA_CLIENT_SECRET
        ==
        "PASTE_FINRA_CLIENT_SECRET_HERE"
    ):

        raise RuntimeError(
            "FINRA_CLIENT_SECRET has not been configured."
        )


    print(
        "Requesting FINRA access token..."
    )


    response = requests.post(

        FINRA_TOKEN_URL,

        auth=(
            FINRA_CLIENT_ID,
            FINRA_CLIENT_SECRET
        ),

        timeout=30

    )


    if response.status_code != 200:

        raise RuntimeError(

            "FINRA authentication failed "
            f"({response.status_code}): "
            f"{response.text}"

        )


    data = response.json()


    access_token = data.get(
        "access_token"
    )


    if not access_token:

        raise RuntimeError(
            "FINRA access token was not returned."
        )


    print(
        "✅ FINRA authentication successful."
    )


    return access_token


# ============================================================
# FETCH FINRA WEEKLY DATA
# ============================================================

def fetch_weekly_summary(
    symbol,
    summary_type,
    access_token
):

    symbol = str(
        symbol
    ).strip().upper()


    headers = {

        "Authorization":
            f"Bearer {access_token}",

        "Accept":
            "application/json",

        "Content-Type":
            "application/json",

        "Data-API-Version":
            "1"

    }


    end_date = datetime.now(
        timezone.utc
    ).date()


    start_date = (

        end_date

        -

        timedelta(
            days=QUERY_LOOKBACK_DAYS
        )

    )


    payload = {

        "limit":
            1000,

        "dateRangeFilters": [

            {

                "fieldName":
                    "weekStartDate",

                "startDate":
                    start_date.isoformat(),

                "endDate":
                    end_date.isoformat()

            }

        ],

        "fields": [

            "issueSymbolIdentifier",
            "issueName",
            "tierIdentifier",
            "weekStartDate",
            "summaryStartDate",
            "totalWeeklyShareQuantity",
            "totalWeeklyTradeCount",
            "summaryTypeCode",
            "lastUpdateDate"

        ],

        "compareFilters": [

            {

                "compareType":
                    "equal",

                "fieldName":
                    "summaryTypeCode",

                "fieldValue":
                    summary_type

            },

            {

                "compareType":
                    "equal",

                "fieldName":
                    "issueSymbolIdentifier",

                "fieldValue":
                    symbol

            }

        ]

    }


    print(

        f"Fetching {symbol} "
        f"{summary_type}..."

    )


    response = requests.post(

        FINRA_WEEKLY_URL,

        headers=headers,

        json=payload,

        timeout=60

    )


    if response.status_code != 200:

        raise RuntimeError(

            f"FINRA query failed for "
            f"{symbol} "
            f"{summary_type} "
            f"({response.status_code}): "
            f"{response.text}"

        )


    data = response.json()


    if not isinstance(
        data,
        list
    ):

        raise RuntimeError(
            "Unexpected FINRA response format."
        )


    print(

        f"   Records returned: "
        f"{len(data)}"

    )


    return data


# ============================================================
# COMBINE ATS + OTC DATA
# ============================================================

def combine_weekly_data(
    ats_rows,
    otc_rows
):

    weeks = {}


    # --------------------------------------------------------
    # INTERNAL ROW ADDER
    # --------------------------------------------------------

    def add_rows(
        rows,
        activity_type
    ):

        for row in rows:

            if not isinstance(
                row,
                dict
            ):

                continue


            week = (

                row.get(
                    "weekStartDate"
                )

                or

                row.get(
                    "summaryStartDate"
                )

            )


            if not week:

                continue


            if week not in weeks:

                weeks[
                    week
                ] = {

                    "week_start":
                        week,

                    "issue_name":
                        row.get(
                            "issueName"
                        ),

                    "tier":
                        row.get(
                            "tierIdentifier"
                        ),

                    "ats_share_quantity":
                        0,

                    "ats_trade_count":
                        0,

                    "otc_share_quantity":
                        0,

                    "otc_trade_count":
                        0,

                    "total_off_exchange_share_quantity":
                        0,

                    "total_off_exchange_trade_count":
                        0,

                    "average_off_exchange_trade_size":
                        None,

                    "sources_present":
                        [],

                    "last_update_date":
                        row.get(
                            "lastUpdateDate"
                        )

                }


            record = weeks[
                week
            ]


            shares = safe_int(

                row.get(
                    "totalWeeklyShareQuantity"
                ),

                0

            )


            trades = safe_int(

                row.get(
                    "totalWeeklyTradeCount"
                ),

                0

            )


            if activity_type == "ATS":

                record[
                    "ats_share_quantity"
                ] += shares


                record[
                    "ats_trade_count"
                ] += trades


            else:

                record[
                    "otc_share_quantity"
                ] += shares


                record[
                    "otc_trade_count"
                ] += trades


            if (
                activity_type
                not in
                record[
                    "sources_present"
                ]
            ):

                record[
                    "sources_present"
                ].append(
                    activity_type
                )


    # --------------------------------------------------------
    # ADD BOTH SOURCES
    # --------------------------------------------------------

    add_rows(
        ats_rows,
        "ATS"
    )


    add_rows(
        otc_rows,
        "OTC"
    )


    combined = []


    # --------------------------------------------------------
    # FINAL WEEKLY TOTALS
    # --------------------------------------------------------

    for week in sorted(
        weeks.keys()
    ):

        record = weeks[
            week
        ]


        total_shares = (

            record[
                "ats_share_quantity"
            ]

            +

            record[
                "otc_share_quantity"
            ]

        )


        total_trades = (

            record[
                "ats_trade_count"
            ]

            +

            record[
                "otc_trade_count"
            ]

        )


        record[
            "total_off_exchange_share_quantity"
        ] = total_shares


        record[
            "total_off_exchange_trade_count"
        ] = total_trades


        if total_trades > 0:

            record[
                "average_off_exchange_trade_size"
            ] = round(

                total_shares
                /
                total_trades,

                2

            )


        combined.append(
            record
        )


    return combined


# ============================================================
# 4-WEEK ACTIVITY BLOCKS
# ============================================================
#
# Latest 48 weekly observations are grouped into:
#
#     12 x 4-week blocks
#
# Activity Index:
#
#     100 = stock's normal 48-week average
#
# ============================================================

def build_4_week_activity_blocks(
    history
):

    if not history:

        return []


    history = sorted(

        history,

        key=lambda row:
            row.get(
                "week_start",
                ""
            )

    )


    # --------------------------------------------------------
    # LAST 48 WEEKLY OBSERVATIONS
    # --------------------------------------------------------

    usable_history = history[
        -TARGET_WEEK_COUNT:
    ]


    if len(
        usable_history
    ) < BLOCK_SIZE_WEEKS:

        return []


    weekly_volumes = [

        safe_float(

            row.get(
                "total_off_exchange_share_quantity"
            ),

            0

        )

        for row in usable_history

    ]


    annual_weekly_average = average(
        weekly_volumes
    )


    blocks = []


    # --------------------------------------------------------
    # CREATE 4-WEEK BLOCKS
    # --------------------------------------------------------

    for start_index in range(

        0,

        len(
            usable_history
        ),

        BLOCK_SIZE_WEEKS

    ):

        period = usable_history[

            start_index:

            start_index
            +
            BLOCK_SIZE_WEEKS

        ]


        if len(
            period
        ) < BLOCK_SIZE_WEEKS:

            continue


        volumes = [

            safe_float(

                row.get(
                    "total_off_exchange_share_quantity"
                ),

                0

            )

            for row in period

        ]


        trades = [

            safe_float(

                row.get(
                    "total_off_exchange_trade_count"
                ),

                0

            )

            for row in period

        ]


        average_weekly_shares = average(
            volumes
        )


        total_shares = sum(
            volumes
        )


        total_trades = sum(
            trades
        )


        average_trade_size = None


        if total_trades > 0:

            average_trade_size = round(

                total_shares
                /
                total_trades,

                2

            )


        # ----------------------------------------------------
        # ACTIVITY INDEX
        # ----------------------------------------------------

        activity_index = None


        if (
            annual_weekly_average
            and
            annual_weekly_average > 0
        ):

            activity_index = round(

                (
                    average_weekly_shares
                    /
                    annual_weekly_average
                )
                *
                100,

                1

            )


        blocks.append({

            "block":
                len(
                    blocks
                )
                +
                1,

            "start_week":
                period[
                    0
                ].get(
                    "week_start"
                ),

            "end_week":
                period[
                    -1
                ].get(
                    "week_start"
                ),

            "average_weekly_off_exchange_shares":
                round(
                    average_weekly_shares,
                    0
                ),

            "total_off_exchange_shares":
                int(
                    total_shares
                ),

            "total_off_exchange_trades":
                int(
                    total_trades
                ),

            "average_trade_size":
                average_trade_size,

            "activity_index":
                activity_index

        })


    # --------------------------------------------------------
    # BLOCK STATISTICS
    # --------------------------------------------------------

    block_averages = [

        block[
            "average_weekly_off_exchange_shares"
        ]

        for block in blocks

    ]


    block_mean = average(
        block_averages
    )


    block_std_dev = standard_deviation(
        block_averages
    )


    # --------------------------------------------------------
    # CLASSIFY EACH BLOCK
    # --------------------------------------------------------

    for block in blocks:

        activity_index = block.get(
            "activity_index"
        )


        z_score = calculate_z_score(

            block[
                "average_weekly_off_exchange_shares"
            ],

            block_mean,

            block_std_dev

        )


        block[
            "z_score"
        ] = z_score


        if activity_index is None:

            state = (
                "NO_DATA"
            )


        elif activity_index >= VERY_ELEVATED_INDEX:

            state = (
                "VERY_ELEVATED"
            )


        elif activity_index >= ELEVATED_INDEX:

            state = (
                "ELEVATED"
            )


        elif activity_index <= VERY_LOW_INDEX:

            state = (
                "VERY_LOW"
            )


        elif activity_index <= LOW_INDEX:

            state = (
                "LOW"
            )


        else:

            state = (
                "NORMAL"
            )


        block[
            "activity_state"
        ] = state


        # ----------------------------------------------------
        # STATISTICAL ANOMALY
        # ----------------------------------------------------

        if (
            z_score is not None
            and
            z_score >= 2
        ):

            anomaly = (
                "HIGH_ANOMALY"
            )


        elif (
            z_score is not None
            and
            z_score >= 1.5
        ):

            anomaly = (
                "ELEVATED_ANOMALY"
            )


        elif (
            z_score is not None
            and
            z_score <= -2
        ):

            anomaly = (
                "LOW_ANOMALY"
            )


        elif (
            z_score is not None
            and
            z_score <= -1.5
        ):

            anomaly = (
                "DEPRESSED_ANOMALY"
            )


        else:

            anomaly = (
                "NORMAL"
            )


        block[
            "anomaly_state"
        ] = anomaly


    return blocks


# ============================================================
# YEARLY ACTIVITY TREND
# ============================================================

def classify_yearly_activity_trend(
    blocks
):

    if len(
        blocks
    ) < 6:

        return (
            "INSUFFICIENT_DATA"
        )


    block_values = [

        safe_float(

            block.get(
                "average_weekly_off_exchange_shares"
            ),

            0

        )

        for block in blocks

    ]


    first_3 = average(
        block_values[
            :3
        ]
    )


    middle_3 = average(
        block_values[
            4:7
        ]
    )


    last_3 = average(
        block_values[
            -3:
        ]
    )


    if (
        not first_3
        or
        not last_3
    ):

        return (
            "INSUFFICIENT_DATA"
        )


    first_to_last_change = (
        percentage_difference(
            last_3,
            first_3
        )
    )


    if (
        first_to_last_change
        is not None
        and
        first_to_last_change >= 30
    ):

        return (
            "RISING_OVER_YEAR"
        )


    if (
        first_to_last_change
        is not None
        and
        first_to_last_change <= -30
    ):

        return (
            "FALLING_OVER_YEAR"
        )


    if (
        middle_3
        and
        middle_3
        >
        first_3
        *
        1.25

        and

        last_3
        <
        middle_3
        *
        0.8
    ):

        return (
            "RISE_THEN_DROP"
        )


    if (
        middle_3
        and
        middle_3
        <
        first_3
        *
        0.8

        and

        last_3
        >
        middle_3
        *
        1.25
    ):

        return (
            "DROP_THEN_RECOVERY"
        )


    return (
        "RELATIVELY_STEADY"
    )


# ============================================================
# STANDARD FINRA ANALYTICS
# ============================================================

def calculate_finra_analytics(
    history
):

    if not history:

        return {

            "available":
                False

        }


    history = sorted(

        history,

        key=lambda row:
            row.get(
                "week_start",
                ""
            )

    )


    latest = history[
        -1
    ]


    volumes = [

        row[
            "total_off_exchange_share_quantity"
        ]

        for row in history

    ]


    trade_counts = [

        row[
            "total_off_exchange_trade_count"
        ]

        for row in history

    ]


    latest_volume = volumes[
        -1
    ]


    latest_trade_count = trade_counts[
        -1
    ]


    # --------------------------------------------------------
    # PRIOR BASELINES
    # --------------------------------------------------------
    #
    # IMPORTANT:
    #
    # Latest week is excluded from its own baseline.
    #
    # --------------------------------------------------------

    previous_volumes = volumes[
        :-1
    ]


    previous_trade_counts = trade_counts[
        :-1
    ]


    average_4_week = average(

        previous_volumes[
            -4:
        ]

    )


    average_12_week = average(

        previous_volumes[
            -12:
        ]

    )


    average_26_week = average(

        previous_volumes[
            -26:
        ]

    )


    average_52_week = average(

        previous_volumes[
            -52:
        ]

    )


    trade_average_4_week = average(

        previous_trade_counts[
            -4:
        ]

    )


    trade_average_12_week = average(

        previous_trade_counts[
            -12:
        ]

    )


    # --------------------------------------------------------
    # PERCENTILES
    # --------------------------------------------------------

    volume_percentile = percentile_rank(

        volumes,

        latest_volume

    )


    trade_count_percentile = percentile_rank(

        trade_counts,

        latest_trade_count

    )


    # --------------------------------------------------------
    # ELEVATED WEEKS LAST 8
    # --------------------------------------------------------

    elevated_weeks_last_8 = 0


    recent_start = max(

        0,

        len(
            history
        )
        -
        8

    )


    for index in range(

        recent_start,

        len(
            history
        )

    ):

        previous_start = max(

            0,

            index
            -
            12

        )


        previous_values = volumes[
            previous_start:index
        ]


        if len(
            previous_values
        ) < 4:

            continue


        baseline = average(
            previous_values
        )


        if (
            baseline
            and
            volumes[
                index
            ]
            >=
            baseline
            *
            1.25
        ):

            elevated_weeks_last_8 += 1


    # --------------------------------------------------------
    # CURRENT ACTIVITY STATE
    # --------------------------------------------------------

    latest_vs_12_week = (
        percentage_difference(
            latest_volume,
            average_12_week
        )
    )


    if (
        latest_vs_12_week is not None
        and
        latest_vs_12_week >= 75
        and
        volume_percentile is not None
        and
        volume_percentile >= 90
    ):

        activity_state = (
            "VERY_ELEVATED"
        )


    elif (
        latest_vs_12_week is not None
        and
        latest_vs_12_week >= 25
        and
        volume_percentile is not None
        and
        volume_percentile >= 75
    ):

        activity_state = (
            "ELEVATED"
        )


    elif (
        latest_vs_12_week is not None
        and
        latest_vs_12_week <= -25
        and
        volume_percentile is not None
        and
        volume_percentile <= 25
    ):

        activity_state = (
            "BELOW_NORMAL"
        )


    else:

        activity_state = (
            "NORMAL"
        )


    return {

        "available":
            True,

        "weeks_available":
            len(
                history
            ),

        "latest_week":
            latest.get(
                "week_start"
            ),

        "tier":
            latest.get(
                "tier"
            ),

        "latest_off_exchange_share_quantity":
            latest_volume,

        "latest_off_exchange_trade_count":
            latest_trade_count,

        "latest_average_trade_size":
            latest.get(
                "average_off_exchange_trade_size"
            ),

        "average_volume_prior_4_week":

            (
                round(
                    average_4_week,
                    2
                )

                if average_4_week
                is not None

                else None
            ),

        "average_volume_prior_12_week":

            (
                round(
                    average_12_week,
                    2
                )

                if average_12_week
                is not None

                else None
            ),

        "average_volume_prior_26_week":

            (
                round(
                    average_26_week,
                    2
                )

                if average_26_week
                is not None

                else None
            ),

        "average_volume_prior_52_week":

            (
                round(
                    average_52_week,
                    2
                )

                if average_52_week
                is not None

                else None
            ),

        "latest_vs_prior_4_week_percent":

            percentage_difference(
                latest_volume,
                average_4_week
            ),

        "latest_vs_prior_12_week_percent":
            latest_vs_12_week,

        "latest_vs_prior_26_week_percent":

            percentage_difference(
                latest_volume,
                average_26_week
            ),

        "volume_12_month_percentile":
            volume_percentile,

        "average_trade_count_prior_4_week":

            (
                round(
                    trade_average_4_week,
                    2
                )

                if trade_average_4_week
                is not None

                else None
            ),

        "average_trade_count_prior_12_week":

            (
                round(
                    trade_average_12_week,
                    2
                )

                if trade_average_12_week
                is not None

                else None
            ),

        "trade_count_12_month_percentile":
            trade_count_percentile,

        "elevated_weeks_last_8":
            elevated_weeks_last_8,

        "current_activity_state":
            activity_state

    }


# ============================================================
# PROCESS ONE SYMBOL
# ============================================================

def process_symbol(
    symbol,
    access_token
):

    symbol = str(
        symbol
    ).strip().upper()


    print()

    print(
        "==================================="
    )

    print(
        f"PROCESSING {symbol}"
    )

    print(
        "==================================="
    )

    print()


    # --------------------------------------------------------
    # ATS
    # --------------------------------------------------------

    ats_rows = fetch_weekly_summary(

        symbol,

        "ATS_W_SMBL",

        access_token

    )


    # --------------------------------------------------------
    # OTC / NON-ATS
    # --------------------------------------------------------

    otc_rows = fetch_weekly_summary(

        symbol,

        "OTC_W_SMBL",

        access_token

    )


    # --------------------------------------------------------
    # COMBINE
    # --------------------------------------------------------

    history = combine_weekly_data(
        ats_rows,
        otc_rows
    )


    # --------------------------------------------------------
    # STANDARD ANALYTICS
    # --------------------------------------------------------

    analytics = calculate_finra_analytics(
        history
    )


    # --------------------------------------------------------
    # 4-WEEK BLOCKS
    # --------------------------------------------------------

    activity_blocks = (
        build_4_week_activity_blocks(
            history
        )
    )


    yearly_trend = (
        classify_yearly_activity_trend(
            activity_blocks
        )
    )


    analytics[
        "yearly_activity_pattern"
    ] = yearly_trend


    # --------------------------------------------------------
    # PRINT SUMMARY
    # --------------------------------------------------------

    print()

    print(
        "-----------------------------------"
    )

    print(
        f"{symbol} FINRA SUMMARY"
    )

    print(
        "-----------------------------------"
    )


    print(

        f"Weeks available      : "
        f"{analytics.get('weeks_available')}"

    )


    print(

        f"Latest FINRA week    : "
        f"{analytics.get('latest_week')}"

    )


    print(

        f"Latest shares        : "
        f"{analytics.get('latest_off_exchange_share_quantity')}"

    )


    print(

        f"12-month percentile  : "
        f"{analytics.get('volume_12_month_percentile')}"

    )


    print(

        f"Current state        : "
        f"{analytics.get('current_activity_state')}"

    )


    print(

        f"Yearly pattern       : "
        f"{yearly_trend}"

    )


    # --------------------------------------------------------
    # PRINT 4-WEEK BLOCKS
    # --------------------------------------------------------

    print()

    print(
        "12-MONTH 4-WEEK ACTIVITY BLOCKS"
    )

    print(
        "-----------------------------------"
    )


    print(

        "BLOCK | START      | END        | "
        "AVG WEEKLY SHARES | INDEX | "
        "STATE         | Z"

    )


    print(

        "------------------------------------------------"
        "-------------------------------------"

    )


    for block in activity_blocks:

        index_value = block.get(
            "activity_index"
        )


        z_score = block.get(
            "z_score"
        )


        index_text = (

            f"{index_value:.1f}"

            if index_value is not None

            else "N/A"

        )


        z_text = (

            f"{z_score:+.2f}"

            if z_score is not None

            else "N/A"

        )


        print(

            f"{block['block']:>5} | "

            f"{block['start_week']} | "

            f"{block['end_week']} | "

            f"{block['average_weekly_off_exchange_shares']:>17,.0f} | "

            f"{index_text:>5} | "

            f"{block['activity_state']:<13} | "

            f"{z_text}"

        )


    return {

        "analytics":
            analytics,

        "activity_blocks_4_week":
            activity_blocks,

        "history":
            history

    }


# ============================================================
# MAIN
# ============================================================

def main():

    print()

    print(
        "==================================="
    )

    print(
        "EDGEBREAK FINRA OFF-EXCHANGE"
    )

    print(
        "POST-RANKING HISTORY BUILDER"
    )

    print(
        "==================================="
    )

    print()


    # --------------------------------------------------------
    # LOAD EXISTING RANKED DAILY BRIEF SHORTLIST
    # --------------------------------------------------------

    (
        symbols,
        shortlist_context
    ) = load_daily_brief_shortlist()


    print(

        f"Shortlist source: "
        f"{CANDIDATES_FILE}"

    )


    print(

        f"Stocks to analyse: "
        f"{len(symbols)}"

    )


    print()


    # --------------------------------------------------------
    # SHOW ORIGINAL EDGEBREAK ORDER
    # --------------------------------------------------------

    for symbol in symbols:

        context = shortlist_context.get(
            symbol,
            {}
        )


        print(

            f"   #"
            f"{context.get('original_daily_brief_rank')} "
            f"{symbol} | "
            f"Score "
            f"{context.get('original_daily_brief_score')}"

        )


    print()


    # --------------------------------------------------------
    # AUTHENTICATE ONCE
    # --------------------------------------------------------

    access_token = (
        get_finra_access_token()
    )


    # --------------------------------------------------------
    # OUTPUT STRUCTURE
    # --------------------------------------------------------

    output = {

        "generated_at":

            datetime.now(
                timezone.utc
            ).isoformat(),

        "source":
            "FINRA weeklySummary",

        "candidate_source":
            CANDIDATES_FILE,

        "shortlist_count":
            len(
                symbols
            ),

        "pipeline_stage":
            "POST_DAILY_BRIEF_RANKING",

        "description":

            (
                "Weekly ATS plus OTC non-ATS "
                "off-exchange trading activity "
                "for stocks already selected "
                "and ranked by the EdgeBreak "
                "Daily Brief pipeline."
            ),

        "important_note":

            (
                "Off-exchange activity measures "
                "trading activity only and does "
                "not indicate buying or selling "
                "direction."
            ),

        "ranking_note":

            (
                "This builder does not change "
                "scanner qualification or scanner "
                "output. It analyses the already-"
                "ranked Daily Brief shortlist for "
                "a later X-Factor reranking stage."
            ),

        "block_method":

            (
                "Latest 48 weekly observations "
                "grouped into twelve 4-week blocks."
            ),

        "activity_index_definition":

            (
                "100 equals the stock's average "
                "weekly off-exchange activity "
                "across the 48-week comparison "
                "period."
            ),

        "symbols":
            {}

    }


    # --------------------------------------------------------
    # PROCESS ONLY THE ALREADY-RANKED SHORTLIST
    # --------------------------------------------------------

    for symbol in symbols:

        try:

            result = process_symbol(

                symbol,

                access_token

            )


            # ------------------------------------------------
            # SAVE ORIGINAL EDGEBREAK RANK WITH FINRA DATA
            # ------------------------------------------------

            result[
                "shortlist_context"
            ] = shortlist_context.get(
                symbol,
                {}
            )


            output[
                "symbols"
            ][
                symbol
            ] = result


        except Exception as error:

            print()

            print(

                f"❌ {symbol} failed: "
                f"{error}"

            )


            output[
                "symbols"
            ][
                symbol
            ] = {

                "shortlist_context":

                    shortlist_context.get(
                        symbol,
                        {}
                    ),

                "error":
                    str(
                        error
                    )

            }


    # --------------------------------------------------------
    # SAVE FINRA DATA SEPARATELY
    # --------------------------------------------------------
    #
    # IMPORTANT:
    #
    # This file DOES NOT write to:
    #
    #     breakout scanner files
    #     pre-breakout scanner files
    #     launch pad scanner files
    #     scanner_database.json
    #     scanner_indicator_history.json
    #     daily_brief_candidates.json
    #
    # Therefore:
    #
    #     scanners remain unchanged
    #     scanner source data remains unchanged
    #     website operation remains unchanged
    #
    # --------------------------------------------------------

    with open(

        OUTPUT_FILE,

        "w",

        encoding="utf-8"

    ) as file:

        json.dump(

            output,

            file,

            indent=4,

            ensure_ascii=False

        )


    # --------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------

    print()

    print(
        "==================================="
    )

    print(
        "FINRA BUILD COMPLETE"
    )

    print(
        "==================================="
    )

    print()


    for symbol in symbols:

        record = output[
            "symbols"
        ].get(
            symbol,
            {}
        )


        analytics = record.get(
            "analytics",
            {}
        )


        context = record.get(
            "shortlist_context",
            {}
        )


        if not analytics:

            print(

                f"#"
                f"{context.get('original_daily_brief_rank')} "
                f"{symbol:<6} "
                f"FAILED"

            )

            continue


        print(

            f"#"
            f"{context.get('original_daily_brief_rank')} "
            f"{symbol:<6} | "

            f"{analytics.get('yearly_activity_pattern')} | "

            f"Current "
            f"{analytics.get('current_activity_state')} | "

            f"Percentile "
            f"{analytics.get('volume_12_month_percentile')}"

        )


    print()


    print(

        f"✅ FINRA data saved separately to "
        f"{OUTPUT_FILE}"

    )


    print(
        "✅ Existing scanner files were not changed."
    )


    print(
        "✅ daily_brief_candidates.json was not changed."
    )


    print()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()