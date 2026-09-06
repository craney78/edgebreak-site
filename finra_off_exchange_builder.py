import json
import os
import statistics
from datetime import datetime, timezone, timedelta

import requests


CANDIDATES_FILE = "daily_brief_candidates.json"
OUTPUT_FILE = "finra_off_exchange_history.json"

FINRA_CLIENT_ID = os.getenv(
    "FINRA_CLIENT_ID",
    "b3a3be63faac4ea18d57"
)

FINRA_CLIENT_SECRET = os.getenv(
    "FINRA_CLIENT_SECRET",
    "Rileymaceynoah123"
)

FINRA_TOKEN_URL = (
    "https://ews.fip.finra.org/"
    "fip/rest/ews/oauth2/access_token"
    "?grant_type=client_credentials"
)

FINRA_WEEKLY_URL = (
    "https://api.finra.org/"
    "data/group/otcMarket/name/weeklySummary"
)


QUERY_LOOKBACK_DAYS = 370
BLOCK_SIZE_WEEKS = 4
TARGET_WEEK_COUNT = 48


# Cross-venue institutional-footprint settings.

INSTITUTIONAL_TOP_RANK = 20
VENUE_BASELINE_WEEKS = 12
VENUE_RECENT_WEEKS = 4
MIN_VENUE_HISTORY = 8
MIN_WEEKLY_VENUE_SHARES = 5000
MIN_APPROX_VENUE_NOTIONAL = 250000


VERY_LOW_INDEX = 60
LOW_INDEX = 80
ELEVATED_INDEX = 120
VERY_ELEVATED_INDEX = 150


def safe_int(value, default=0):

    try:

        if value is None:
            return default

        return int(float(value))

    except (TypeError, ValueError):

        return default


def safe_float(value, default=0.0):

    try:

        if value is None:
            return default

        return float(value)

    except (TypeError, ValueError):

        return default


def average(values):

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

    return (
        sum(valid)
        /
        len(valid)
    )


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
        len(clean_values)
    ) * 100

    return round(
        percentile,
        1
    )


def standard_deviation(values):

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

    if len(clean) < 2:
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
    ) / len(clean)

    return variance ** 0.5


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

        supplied_rank = candidate.get(
            "daily_brief_rank"
        )

        try:

            original_rank = int(
                supplied_rank
            )

        except (TypeError, ValueError):

            original_rank = fallback_rank

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

        scanners = candidate.get(
            "scanners",
            []
        )

        if not isinstance(
            scanners,
            list
        ):

            scanners = []

        current_price = None

        for section_name in [
            "breakout",
            "pre_breakout",
            "launch_pad",
            "smart_money"
        ]:

            section = candidate.get(
                section_name,
                {}
            )

            if not isinstance(
                section,
                dict
            ):

                continue

            price = safe_float(
                section.get(
                    "current_price"
                ),
                None
            )

            if (
                price is not None
                and
                price > 0
            ):

                current_price = price
                break

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
                scanners,

            "current_price":
                current_price
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


def get_finra_access_token():

    if (
        not FINRA_CLIENT_ID
        or
        FINRA_CLIENT_ID ==
        "PASTE_FINRA_CLIENT_ID_HERE"
    ):

        raise RuntimeError(
            "FINRA_CLIENT_ID has not been configured."
        )

    if (
        not FINRA_CLIENT_SECRET
        or
        FINRA_CLIENT_SECRET ==
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
            f"FINRA authentication failed "
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
        "FINRA authentication successful."
    )

    return access_token


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
            "firmCrdNumber",
            "marketParticipantName",
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

    all_data = []
    offset = 0

    while True:

        payload[
            "offset"
        ] = offset

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

        page = response.json()

        if not isinstance(
            page,
            list
        ):

            raise RuntimeError(
                "Unexpected FINRA response format."
            )

        all_data.extend(
            page
        )

        if len(page) < 1000:
            break

        offset += 1000

        if offset >= 10000:

            raise RuntimeError(
                f"FINRA query exceeded 10,000 rows "
                f"for {symbol} {summary_type}."
            )

    print(
        f"   Records returned: "
        f"{len(all_data)}"
    )

    return all_data


def combine_weekly_data(
    ats_rows,
    otc_rows
):

    weeks = {}

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

    add_rows(
        ats_rows,
        "ATS"
    )

    add_rows(
        otc_rows,
        "OTC"
    )

    combined = []

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


def build_4_week_activity_blocks(history):

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

    usable_history = history[
        -TARGET_WEEK_COUNT:
    ]

    if (
        len(usable_history)
        <
        BLOCK_SIZE_WEEKS
    ):

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

    for start_index in range(
        0,
        len(usable_history),
        BLOCK_SIZE_WEEKS
    ):

        period = usable_history[
            start_index:
            start_index + BLOCK_SIZE_WEEKS
        ]

        if (
            len(period)
            <
            BLOCK_SIZE_WEEKS
        ):

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

        activity_index = None

        if (
            annual_weekly_average
            and
            annual_weekly_average > 0
        ):

            activity_index = round(
                average_weekly_shares
                /
                annual_weekly_average
                *
                100,
                1
            )

        blocks.append({

            "block":
                len(blocks) + 1,

            "start_week":
                period[0].get(
                    "week_start"
                ),

            "end_week":
                period[-1].get(
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

            state = "NO_DATA"

        elif activity_index >= VERY_ELEVATED_INDEX:

            state = "VERY_ELEVATED"

        elif activity_index >= ELEVATED_INDEX:

            state = "ELEVATED"

        elif activity_index <= VERY_LOW_INDEX:

            state = "VERY_LOW"

        elif activity_index <= LOW_INDEX:

            state = "LOW"

        else:

            state = "NORMAL"

        block[
            "activity_state"
        ] = state

        if (
            z_score is not None
            and
            z_score >= 2
        ):

            anomaly = "HIGH_ANOMALY"

        elif (
            z_score is not None
            and
            z_score >= 1.5
        ):

            anomaly = "ELEVATED_ANOMALY"

        elif (
            z_score is not None
            and
            z_score <= -2
        ):

            anomaly = "LOW_ANOMALY"

        elif (
            z_score is not None
            and
            z_score <= -1.5
        ):

            anomaly = "DEPRESSED_ANOMALY"

        else:

            anomaly = "NORMAL"

        block[
            "anomaly_state"
        ] = anomaly

    return blocks


def classify_yearly_activity_trend(blocks):

    if len(blocks) < 6:
        return "INSUFFICIENT_DATA"

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
        block_values[:3]
    )

    middle_3 = average(
        block_values[4:7]
    )

    last_3 = average(
        block_values[-3:]
    )

    if (
        not first_3
        or
        not last_3
    ):

        return "INSUFFICIENT_DATA"

    first_to_last_change = (
        percentage_difference(
            last_3,
            first_3
        )
    )

    if (
        first_to_last_change is not None
        and
        first_to_last_change >= 30
    ):

        return "RISING_OVER_YEAR"

    if (
        first_to_last_change is not None
        and
        first_to_last_change <= -30
    ):

        return "FALLING_OVER_YEAR"

    if (
        middle_3
        and
        middle_3 > first_3 * 1.25
        and
        last_3 < middle_3 * 0.8
    ):

        return "RISE_THEN_DROP"

    if (
        middle_3
        and
        middle_3 < first_3 * 0.8
        and
        last_3 > middle_3 * 1.25
    ):

        return "DROP_THEN_RECOVERY"

    return "RELATIVELY_STEADY"


def calculate_finra_analytics(history):

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

    latest = history[-1]

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

    latest_volume = volumes[-1]
    latest_trade_count = trade_counts[-1]

    previous_volumes = volumes[:-1]
    previous_trade_counts = trade_counts[:-1]

    average_4_week = average(
        previous_volumes[-4:]
    )

    average_12_week = average(
        previous_volumes[-12:]
    )

    average_26_week = average(
        previous_volumes[-26:]
    )

    average_52_week = average(
        previous_volumes[-52:]
    )

    trade_average_4_week = average(
        previous_trade_counts[-4:]
    )

    trade_average_12_week = average(
        previous_trade_counts[-12:]
    )

    volume_percentile = percentile_rank(
        volumes,
        latest_volume
    )

    trade_count_percentile = percentile_rank(
        trade_counts,
        latest_trade_count
    )

    elevated_weeks_last_8 = 0

    recent_start = max(
        0,
        len(history) - 8
    )

    for index in range(
        recent_start,
        len(history)
    ):

        previous_start = max(
            0,
            index - 12
        )

        previous_values = volumes[
            previous_start:index
        ]

        if len(previous_values) < 4:
            continue

        baseline = average(
            previous_values
        )

        if (
            baseline
            and
            volumes[index]
            >=
            baseline * 1.25
        ):

            elevated_weeks_last_8 += 1

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

        activity_state = "VERY_ELEVATED"

    elif (
        latest_vs_12_week is not None
        and
        latest_vs_12_week >= 25
        and
        volume_percentile is not None
        and
        volume_percentile >= 75
    ):

        activity_state = "ELEVATED"

    elif (
        latest_vs_12_week is not None
        and
        latest_vs_12_week <= -25
        and
        volume_percentile is not None
        and
        volume_percentile <= 25
    ):

        activity_state = "BELOW_NORMAL"

    else:

        activity_state = "NORMAL"

    return {

        "available":
            True,

        "weeks_available":
            len(history),

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
            round(
                average_4_week,
                2
            )
            if average_4_week is not None
            else None,

        "average_volume_prior_12_week":
            round(
                average_12_week,
                2
            )
            if average_12_week is not None
            else None,

        "average_volume_prior_26_week":
            round(
                average_26_week,
                2
            )
            if average_26_week is not None
            else None,

        "average_volume_prior_52_week":
            round(
                average_52_week,
                2
            )
            if average_52_week is not None
            else None,

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
            round(
                trade_average_4_week,
                2
            )
            if trade_average_4_week is not None
            else None,

        "average_trade_count_prior_12_week":
            round(
                trade_average_12_week,
                2
            )
            if trade_average_12_week is not None
            else None,

        "trade_count_12_month_percentile":
            trade_count_percentile,

        "elevated_weeks_last_8":
            elevated_weeks_last_8,

        "current_activity_state":
            activity_state
    }


def venue_row_value(
    row,
    *field_names
):

    if not isinstance(
        row,
        dict
    ):

        return None

    for field_name in field_names:

        if (
            field_name in row
            and
            row.get(field_name) is not None
        ):

            return row.get(
                field_name
            )

    lowercase_row = {

        str(key).lower():
            value

        for key, value in row.items()
    }

    for field_name in field_names:

        value = lowercase_row.get(
            str(field_name).lower()
        )

        if value is not None:
            return value

    return None


def venue_percentile_rank(
    values,
    current
):

    if not values:
        return None

    below = sum(
        1
        for value in values
        if value < current
    )

    equal = sum(
        1
        for value in values
        if value == current
    )

    return round(
        100
        *
        (
            below
            +
            0.5
            *
            equal
        )
        /
        len(values),
        1
    )


def normalise_venue_rows(
    rows,
    channel
):

    normalised = []

    for row in rows:

        week = venue_row_value(
            row,
            "weekStartDate",
            "tradeReportStartDate"
        )

        identifier = str(
            venue_row_value(
                row,
                "marketParticipantIdentifier"
            )
            or
            ""
        ).strip()

        name = str(
            venue_row_value(
                row,
                "marketParticipantName"
            )
            or
            ""
        ).strip()

        crd = str(
            venue_row_value(
                row,
                "firmCrdNumber"
            )
            or
            ""
        ).strip()

        if (
            not week
            or
            not (
                identifier
                or
                name
                or
                crd
            )
        ):

            continue

        shares = safe_int(
            venue_row_value(
                row,
                "totalWeeklyShareQuantity",
                "totalShareQuantitySum"
            ),
            0
        )

        trades = safe_int(
            venue_row_value(
                row,
                "totalWeeklyTradeCount",
                "totalTradeCountSum"
            ),
            0
        )

        normalised.append({

            "week":
                str(week)[:10],

            "venue_key":
                f"{channel}|"
                f"{identifier or crd or name}",

            "channel":
                channel,

            "identifier":
                identifier,

            "name":
                name
                or
                identifier
                or
                f"CRD {crd}",

            "firm_crd_number":
                crd,

            "shares":
                max(
                    shares,
                    0
                ),

            "trades":
                max(
                    trades,
                    0
                )
        })

    return normalised


def build_cross_venue_footprint(
    ats_firm_rows,
    otc_firm_rows,
    current_price
):

    rows = (
        normalise_venue_rows(
            ats_firm_rows,
            "ATS"
        )
        +
        normalise_venue_rows(
            otc_firm_rows,
            "NON_ATS"
        )
    )

    combined = {}

    for row in rows:

        key = (
            row["week"],
            row["venue_key"]
        )

        if key not in combined:

            combined[
                key
            ] = dict(
                row
            )

        else:

            combined[
                key
            ][
                "shares"
            ] += row["shares"]

            combined[
                key
            ][
                "trades"
            ] += row["trades"]

    rows = list(
        combined.values()
    )

    weeks = sorted({

        row["week"]

        for row in rows
    })

    venue_history = {}

    for row in rows:

        venue_history.setdefault(
            row["venue_key"],
            []
        ).append(
            row
        )

    for history in venue_history.values():

        history.sort(
            key=lambda item:
                item["week"]
        )

    recent_weeks = weeks[
        -VENUE_RECENT_WEEKS:
    ]

    weekly_events = []

    for week in recent_weeks:

        unusual_venues = []

        for history in venue_history.values():

            current_row = next(
                (
                    row
                    for row in history
                    if row["week"] == week
                ),
                None
            )

            if current_row is None:
                continue

            prior_shares = [

                row["shares"]

                for row in history

                if row["week"] < week

            ][
                -VENUE_BASELINE_WEEKS:
            ]

            if (
                len(prior_shares)
                <
                MIN_VENUE_HISTORY
            ):

                continue

            baseline = statistics.median(
                prior_shares
            )

            ratio = (
                current_row["shares"]
                /
                baseline
                if baseline > 0
                else None
            )

            deviation = standard_deviation(
                prior_shares
            )

            z_score = calculate_z_score(
                current_row["shares"],
                average(
                    prior_shares
                ),
                deviation
            )

            percentile = venue_percentile_rank(
                prior_shares,
                current_row["shares"]
            )

            approximate_notional = (
                current_row["shares"]
                *
                current_price
                if (
                    current_price is not None
                    and
                    current_price > 0
                )
                else None
            )

            large_enough = (
                current_row["shares"]
                >=
                MIN_WEEKLY_VENUE_SHARES
            )

            if approximate_notional is not None:

                large_enough = (
                    large_enough
                    and
                    approximate_notional
                    >=
                    MIN_APPROX_VENUE_NOTIONAL
                )

            statistically_unusual = (

                (
                    ratio is not None
                    and
                    ratio >= 1.5
                    and
                    percentile is not None
                    and
                    percentile >= 85
                )

                or

                (
                    z_score is not None
                    and
                    z_score >= 2
                )

                or

                (
                    ratio is not None
                    and
                    ratio >= 1.25
                    and
                    percentile is not None
                    and
                    percentile >= 95
                )
            )

            if (
                not large_enough
                or
                not statistically_unusual
            ):

                continue

            unusual_venues.append({

                "identifier":
                    current_row[
                        "identifier"
                    ],

                "name":
                    current_row[
                        "name"
                    ],

                "firm_crd_number":
                    current_row[
                        "firm_crd_number"
                    ],

                "channel":
                    current_row[
                        "channel"
                    ],

                "shares":
                    current_row[
                        "shares"
                    ],

                "trades":
                    current_row[
                        "trades"
                    ],

                "average_trade_size":
                    round(
                        current_row["shares"]
                        /
                        current_row["trades"],
                        1
                    )
                    if current_row["trades"] > 0
                    else None,

                "baseline_median_shares":
                    round(
                        baseline,
                        1
                    ),

                "activity_ratio":
                    round(
                        ratio,
                        2
                    )
                    if ratio is not None
                    else None,

                "z_score":
                    round(
                        z_score,
                        2
                    )
                    if z_score is not None
                    else None,

                "percentile":
                    percentile,

                "approximate_notional":
                    round(
                        approximate_notional,
                        2
                    )
                    if approximate_notional is not None
                    else None
            })

        unusual_venues.sort(
            key=lambda item: (
                -item["shares"],
                item["name"]
            )
        )

        weekly_events.append({

            "week":
                week,

            "unusual_venue_count":
                len(
                    unusual_venues
                ),

            "channels":
                sorted({
                    item["channel"]
                    for item in unusual_venues
                }),

            "reporting_venues":
                unusual_venues
        })

    multi_venue_events = [

        event

        for event in weekly_events

        if event[
            "unusual_venue_count"
        ] >= 2
    ]

    strongest_event = (
        max(
            multi_venue_events,
            key=lambda event: (
                event[
                    "unusual_venue_count"
                ],
                event["week"]
            )
        )
        if multi_venue_events
        else None
    )

    consecutive_weeks = 0

    for event in reversed(
        weekly_events
    ):

        if (
            event[
                "unusual_venue_count"
            ]
            >= 2
        ):

            consecutive_weeks += 1

        else:

            break

    activity_score = 0
    reason_tags = []

    if strongest_event:

        venue_count = strongest_event[
            "unusual_venue_count"
        ]

        if venue_count == 2:

            activity_score += 35

        elif venue_count == 3:

            activity_score += 48

        else:

            activity_score += 58

        reason_tags.append(
            f"{venue_count}_unusual_"
            "reporting_venues_same_week"
        )

        if (
            len(
                strongest_event[
                    "channels"
                ]
            )
            >= 2
        ):

            activity_score += 12

            reason_tags.append(
                "ats_and_non_ats_same_week"
            )

        peak_z = max(
            (
                safe_float(
                    venue.get(
                        "z_score"
                    ),
                    0
                )
                for venue in strongest_event[
                    "reporting_venues"
                ]
            ),
            default=0
        )

        activity_score += min(
            12,
            max(
                0,
                round(
                    peak_z * 2
                )
            )
        )

    if len(multi_venue_events) >= 2:

        activity_score += 12

        reason_tags.append(
            "repeated_multi_venue_weeks"
        )

    if len(multi_venue_events) >= 3:

        activity_score += 6

    if consecutive_weeks >= 2:

        activity_score += 6

        reason_tags.append(
            "consecutive_multi_venue_activity"
        )

    activity_score = min(
        int(
            round(
                activity_score
            )
        ),
        100
    )

    if activity_score >= 85:

        label = (
            "EXCEPTIONAL_CROSS_VENUE_FOOTPRINT"
        )

    elif activity_score >= 75:

        label = (
            "STRONG_CROSS_VENUE_FOOTPRINT"
        )

    elif activity_score >= 60:

        label = (
            "ELEVATED_CROSS_VENUE_FOOTPRINT"
        )

    elif activity_score >= 45:

        label = (
            "NOTABLE_CROSS_VENUE_FOOTPRINT"
        )

    elif any(
        event[
            "unusual_venue_count"
        ] == 1
        for event in weekly_events
    ):

        label = (
            "SINGLE_VENUE_WATCH"
        )

    else:

        label = (
            "NO_MEANINGFUL_CROSS_VENUE_SIGNAL"
        )

    return {

        "analyzed":
            True,

        "latest_finra_week":
            weeks[-1]
            if weeks
            else None,

        "weeks_available":
            len(weeks),

        "venues_available":
            len(
                venue_history
            ),

        "recent_weeks_analyzed":
            recent_weeks,

        "multi_venue_weeks_last_4":
            len(
                multi_venue_events
            ),

        "consecutive_multi_venue_weeks":
            consecutive_weeks,

        "strongest_multi_venue_week":
            strongest_event,

        "score":
            activity_score,

        "label":
            label,

        "meaningful_cross_venue_signal":
            bool(
                strongest_event
                and
                activity_score >= 45
            ),

        "reason_tags":
            reason_tags,

        "important_note":
            (
                "FINRA weekly data is delayed and "
                "does not identify buy/sell direction. "
                "Named participants are ATSs or "
                "reporting broker-dealers, not "
                "confirmed investment-manager owners."
            )
    }


def process_symbol(
    symbol,
    access_token,
    shortlist_context
):

    symbol = str(
        symbol
    ).strip().upper()

    print()
    print(
        "=" * 60
    )
    print(
        f"PROCESSING {symbol}"
    )
    print(
        "=" * 60
    )
    print()

    ats_rows = fetch_weekly_summary(
        symbol,
        "ATS_W_SMBL",
        access_token
    )

    otc_rows = fetch_weekly_summary(
        symbol,
        "OTC_W_SMBL",
        access_token
    )

    original_rank = safe_int(
        shortlist_context.get(
            "original_daily_brief_rank"
        ),
        999
    )

    if (
        original_rank
        <=
        INSTITUTIONAL_TOP_RANK
    ):

        ats_firm_rows = fetch_weekly_summary(
            symbol,
            "ATS_W_SMBL_FIRM",
            access_token
        )

        otc_firm_rows = fetch_weekly_summary(
            symbol,
            "OTC_W_SMBL_FIRM",
            access_token
        )

        institutional_footprint = (
            build_cross_venue_footprint(
                ats_firm_rows,
                otc_firm_rows,
                safe_float(
                    shortlist_context.get(
                        "current_price"
                    ),
                    None
                )
            )
        )

    else:

        institutional_footprint = {

            "analyzed":
                False,

            "score":
                0,

            "label":
                "NOT_ANALYZED_OUTSIDE_TOP_20",

            "meaningful_cross_venue_signal":
                False,

            "reason_tags":
                [],

            "important_note":
                (
                    "Venue-level institutional footprint "
                    "is restricted to the current top 20."
                )
        }

    history = combine_weekly_data(
        ats_rows,
        otc_rows
    )

    analytics = calculate_finra_analytics(
        history
    )

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

    print()
    print(
        f"{symbol} FINRA SUMMARY"
    )
    print(
        "-" * 60
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

    print(
        f"Venue footprint      : "
        f"{institutional_footprint.get('label')}"
    )

    print(
        f"Venue score          : "
        f"{institutional_footprint.get('score')}"
    )

    print()
    print(
        "12-MONTH 4-WEEK ACTIVITY BLOCKS"
    )
    print(
        "-" * 85
    )

    print(
        "BLOCK | START      | END        | "
        "AVG WEEKLY SHARES | INDEX | STATE         | Z"
    )

    print(
        "-" * 85
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

        "institutional_footprint":
            institutional_footprint,

        "history":
            history
    }


def main():

    print()
    print(
        "=" * 70
    )
    print(
        "EDGEBREAK FINRA OFF-EXCHANGE"
    )
    print(
        "POST-RANKING HISTORY BUILDER"
    )
    print(
        "=" * 70
    )
    print()

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

    access_token = (
        get_finra_access_token()
    )

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
            len(symbols),

        "pipeline_stage":
            "POST_DAILY_BRIEF_RANKING",

        "description":
            (
                "Weekly ATS plus OTC non-ATS "
                "off-exchange trading activity for "
                "stocks already selected and ranked "
                "by the EdgeBreak Daily Brief pipeline. "
                "The current top 20 also receive named "
                "venue/reporting-firm concentration analysis."
            ),

        "important_note":
            (
                "Off-exchange activity measures trading "
                "activity only and does not indicate buying "
                "or selling direction. Named participants "
                "are execution venues/reporting firms, "
                "not confirmed fund owners."
            ),

        "ranking_note":
            (
                "This builder does not change scanner "
                "qualification or scanner output. It analyses "
                "the already-ranked Daily Brief shortlist for "
                "the existing FINRA reranking stage."
            ),

        "block_method":
            (
                "Latest 48 weekly observations grouped "
                "into twelve 4-week blocks."
            ),

        "activity_index_definition":
            (
                "100 equals the stock's average weekly "
                "off-exchange activity across the "
                "48-week comparison period."
            ),

        "symbols":
            {}
    }

    for symbol in symbols:

        try:

            result = process_symbol(
                symbol,
                access_token,
                shortlist_context.get(
                    symbol,
                    {}
                )
            )

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
                f"{symbol} failed: "
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
                    str(error)
            }

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

    print()
    print(
        "=" * 70
    )
    print(
        "FINRA BUILD COMPLETE"
    )
    print(
        "=" * 70
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

        footprint = record.get(
            "institutional_footprint",
            {}
        )

        if not analytics:

            print(
                f"#{context.get('original_daily_brief_rank')} "
                f"{symbol:<6} FAILED"
            )

            continue

        print(
            f"#{context.get('original_daily_brief_rank')} "
            f"{symbol:<6} | "
            f"{analytics.get('yearly_activity_pattern')} | "
            f"Current "
            f"{analytics.get('current_activity_state')} | "
            f"Percentile "
            f"{analytics.get('volume_12_month_percentile')} | "
            f"Venue "
            f"{footprint.get('label')} | "
            f"Score "
            f"{footprint.get('score')}"
        )

    print()
    print(
        f"FINRA data saved to "
        f"{OUTPUT_FILE}"
    )
    print(
        "Existing scanner files were not changed."
    )
    print(
        "daily_brief_candidates.json was not changed."
    )
    print()


if __name__ == "__main__":

    main()