import csv
import json
import os
import tempfile

from copy import deepcopy
from datetime import datetime, timezone


# =========================================================
# FILES
# =========================================================

CANDIDATES_FILE = "daily_brief_candidates.json"
FINRA_FILE = "finra_off_exchange_history.json"
BACKUP_FILE = "daily_brief_candidates_pre_finra.json"


# =========================================================
# TOP-SIX SETTINGS
# =========================================================

TOP_SIX_COUNT = 6

TOP_SIX_HISTORY_DIR = (
    "daily_brief_top6_history"
)

TOP_SIX_HISTORY_CSV = (
    "daily_brief_top6_history.csv"
)


# =========================================================
# PRESSURE BUILDING BOOSTS
# =========================================================

PRESSURE_HIGH_BOOST = 6
PRESSURE_MEDIUM_BOOST = 4
PRESSURE_LOW_BOOST = 2


# =========================================================
# EXISTING FINRA SETTINGS
# =========================================================

MIN_FINRA_WEEKS_FOR_BOOST = 24

EXCEPTIONAL_BOOST = 15
HIGH_BOOST = 8
ELEVATED_BOOST = 5
MILD_BOOST = 2


def safe_float(value, default=None):

    try:

        if value is None:
            return default

        return float(value)

    except (TypeError, ValueError):

        return default


def safe_int(value, default=0):

    try:

        if value is None:
            return default

        return int(float(value))

    except (TypeError, ValueError):

        return default


def load_json(filename):

    if not os.path.exists(
        filename
    ):

        raise RuntimeError(
            f"Required file not found: {filename}"
        )

    try:

        with open(
            filename,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(
                file
            )

    except Exception as error:

        raise RuntimeError(
            f"Could not read {filename}: {error}"
        ) from error


def save_json_atomic(
    filename,
    data
):

    directory = os.path.dirname(
        os.path.abspath(
            filename
        )
    )

    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        delete=False,
        dir=directory,
        suffix=".tmp"
    ) as temp_file:

        json.dump(
            data,
            temp_file,
            indent=4,
            ensure_ascii=False
        )

        temp_name = temp_file.name

    os.replace(
        temp_name,
        filename
    )


def get_ranking(candidate):

    ranking = candidate.get(
        "daily_brief_ranking",
        {}
    )

    if not isinstance(
        ranking,
        dict
    ):

        ranking = {}

    return ranking


def get_original_score(candidate):

    ranking = get_ranking(
        candidate
    )

    return safe_float(
        ranking.get(
            "total_score"
        ),
        0
    )


def get_original_rank(
    candidate,
    fallback_rank
):

    saved_rank = candidate.get(
        "pre_finra_rank"
    )

    if saved_rank is not None:

        return safe_int(
            saved_rank,
            fallback_rank
        )

    return safe_int(
        candidate.get(
            "daily_brief_rank"
        ),
        fallback_rank
    )


def get_scanner_type(candidate):

    ranking = get_ranking(
        candidate
    )

    scanner_type = str(
        ranking.get(
            "scanner_type",
            ""
        )
    ).strip().upper()

    if scanner_type:
        return scanner_type

    scanners = candidate.get(
        "scanners",
        []
    )

    if isinstance(
        scanners,
        list
    ):

        scanners = [

            str(value).strip().upper()

            for value in scanners
        ]

        if "BREAKOUT" in scanners:
            return "BREAKOUT"

        if "PRE_BREAKOUT" in scanners:
            return "PRE_BREAKOUT"

    return "UNKNOWN"


def get_technical_context(candidate):

    ranking = get_ranking(
        candidate
    )

    structural_score = safe_float(
        ranking.get(
            "structural_score"
        ),
        0
    )

    resistance_touches = safe_int(
        ranking.get(
            "resistance_touches"
        ),
        0
    )

    higher_lows = safe_int(
        ranking.get(
            "higher_lows"
        ),
        0
    )

    distance = safe_float(
        ranking.get(
            "distance_from_resistance_percent"
        ),
        None
    )

    participation_state = str(
        ranking.get(
            "participation_state",
            ""
        )
    ).strip().upper()

    obv_relationship = str(
        ranking.get(
            "obv_price_relationship",
            ""
        )
    ).strip().lower()

    obv_5d = str(
        ranking.get(
            "obv_trend_5d",
            ""
        )
    ).strip().lower()

    obv_20d = str(
        ranking.get(
            "obv_trend_20d",
            ""
        )
    ).strip().lower()

    obv_60d = str(
        ranking.get(
            "obv_trend_60d",
            ""
        )
    ).strip().lower()

    price_5d = safe_float(
        ranking.get(
            "price_change_5d_percent"
        ),
        None
    )

    price_20d = safe_float(
        ranking.get(
            "price_change_20d_percent"
        ),
        None
    )

    price_60d = safe_float(
        ranking.get(
            "price_change_60d_percent"
        ),
        None
    )

    return {

        "scanner_type":
            get_scanner_type(
                candidate
            ),

        "structural_score":
            structural_score,

        "resistance_touches":
            resistance_touches,

        "higher_lows":
            higher_lows,

        "distance_from_resistance_percent":
            distance,

        "participation_state":
            participation_state,

        "obv_price_relationship":
            obv_relationship,

        "obv_trend_5d":
            obv_5d,

        "obv_trend_20d":
            obv_20d,

        "obv_trend_60d":
            obv_60d,

        "price_change_5d_percent":
            price_5d,

        "price_change_20d_percent":
            price_20d,

        "price_change_60d_percent":
            price_60d
    }


def get_finra_context(
    symbol,
    finra_data
):

    symbols = finra_data.get(
        "symbols",
        {}
    )

    if not isinstance(
        symbols,
        dict
    ):

        symbols = {}

    record = symbols.get(
        symbol,
        {}
    )

    if not isinstance(
        record,
        dict
    ):

        record = {}

    analytics = record.get(
        "analytics",
        {}
    )

    if not isinstance(
        analytics,
        dict
    ):

        analytics = {}

    blocks = record.get(
        "activity_blocks_4_week",
        []
    )

    if not isinstance(
        blocks,
        list
    ):

        blocks = []

    latest_block = {}

    if blocks:

        latest_block = blocks[-1]

        if not isinstance(
            latest_block,
            dict
        ):

            latest_block = {}

    return {

        "available":
            bool(
                analytics.get(
                    "available",
                    False
                )
            ),

        "weeks_available":
            safe_int(
                analytics.get(
                    "weeks_available"
                ),
                0
            ),

        "latest_week":
            analytics.get(
                "latest_week"
            ),

        "current_activity_state":
            str(
                analytics.get(
                    "current_activity_state",
                    ""
                )
            ).strip().upper(),

        "volume_percentile":
            safe_float(
                analytics.get(
                    "volume_12_month_percentile"
                ),
                None
            ),

        "latest_vs_4_week":
            safe_float(
                analytics.get(
                    "latest_vs_prior_4_week_percent"
                ),
                None
            ),

        "latest_vs_12_week":
            safe_float(
                analytics.get(
                    "latest_vs_prior_12_week_percent"
                ),
                None
            ),

        "latest_vs_26_week":
            safe_float(
                analytics.get(
                    "latest_vs_prior_26_week_percent"
                ),
                None
            ),

        "elevated_weeks_last_8":
            safe_int(
                analytics.get(
                    "elevated_weeks_last_8"
                ),
                0
            ),

        "yearly_activity_pattern":
            analytics.get(
                "yearly_activity_pattern"
            ),

        "latest_block_activity_index":
            safe_float(
                latest_block.get(
                    "activity_index"
                ),
                None
            ),

        "latest_block_z_score":
            safe_float(
                latest_block.get(
                    "z_score"
                ),
                None
            ),

        "latest_block_state":
            str(
                latest_block.get(
                    "activity_state",
                    ""
                )
            ).strip().upper(),

        "latest_block_anomaly":
            str(
                latest_block.get(
                    "anomaly_state",
                    ""
                )
            ).strip().upper()
    }


def calculate_data_age_days(
    latest_week
):

    if not latest_week:
        return None

    try:

        latest_date = datetime.strptime(
            latest_week,
            "%Y-%m-%d"
        ).date()

        today = datetime.now(
            timezone.utc
        ).date()

        return (
            today
            -
            latest_date
        ).days

    except Exception:

        return None


def has_meaningful_activity_signal(finra):

    if not finra.get(
        "available"
    ):

        return False

    if (
        finra.get(
            "weeks_available",
            0
        )
        <
        MIN_FINRA_WEEKS_FOR_BOOST
    ):

        return False

    state = finra.get(
        "current_activity_state"
    )

    percentile = finra.get(
        "volume_percentile"
    )

    latest_vs_12 = finra.get(
        "latest_vs_12_week"
    )

    block_index = finra.get(
        "latest_block_activity_index"
    )

    block_z = finra.get(
        "latest_block_z_score"
    )

    if state in {
        "ELEVATED",
        "VERY_ELEVATED"
    }:

        return True

    if (
        block_index is not None
        and
        block_index >= 120
    ):

        return True

    if (
        block_z is not None
        and
        block_z >= 1.5
    ):

        return True

    if (
        percentile is not None
        and
        percentile >= 90
        and
        latest_vs_12 is not None
        and
        latest_vs_12 >= 10
    ):

        return True

    return False


def calculate_activity_score(finra):

    if not finra.get(
        "available"
    ):

        return 0

    score = 0

    state = finra.get(
        "current_activity_state"
    )

    if state == "VERY_ELEVATED":

        score += 16

    elif state == "ELEVATED":

        score += 10

    percentile = finra.get(
        "volume_percentile"
    )

    if percentile is not None:

        if percentile >= 98:
            score += 10

        elif percentile >= 90:
            score += 8

        elif percentile >= 80:
            score += 5

        elif percentile >= 70:
            score += 3

    latest_vs_12 = finra.get(
        "latest_vs_12_week"
    )

    if latest_vs_12 is not None:

        if latest_vs_12 >= 150:
            score += 8

        elif latest_vs_12 >= 75:
            score += 6

        elif latest_vs_12 >= 25:
            score += 4

        elif latest_vs_12 >= 10:
            score += 2

    block_index = finra.get(
        "latest_block_activity_index"
    )

    if block_index is not None:

        if block_index >= 180:
            score += 6

        elif block_index >= 150:
            score += 5

        elif block_index >= 120:
            score += 3

    block_z = finra.get(
        "latest_block_z_score"
    )

    if block_z is not None:

        if block_z >= 2:
            score += 4

        elif block_z >= 1.5:
            score += 2

    return min(
        score,
        40
    )


def calculate_structure_score(technical):

    score = 0

    structural = technical.get(
        "structural_score",
        0
    )

    if structural >= 75:

        score += 18

    elif structural >= 70:

        score += 16

    elif structural >= 65:

        score += 14

    elif structural >= 60:

        score += 12

    elif structural >= 55:

        score += 10

    else:

        score += 6

    higher_lows = technical.get(
        "higher_lows",
        0
    )

    if higher_lows >= 5:

        score += 8

    elif higher_lows == 4:

        score += 7

    elif higher_lows == 3:

        score += 5

    elif higher_lows == 2:

        score += 3

    touches = technical.get(
        "resistance_touches",
        0
    )

    if touches >= 4:

        score += 5

    elif touches == 3:

        score += 4

    elif touches == 2:

        score += 2

    distance = technical.get(
        "distance_from_resistance_percent"
    )

    if distance is not None:

        absolute_distance = abs(
            distance
        )

        if absolute_distance <= 1:

            score += 5

        elif absolute_distance <= 3:

            score += 4

        elif absolute_distance <= 5:

            score += 2

        elif absolute_distance <= 8:

            score += 1

    participation = technical.get(
        "participation_state"
    )

    if participation in {
        "STRONG_CONFIRMATION",
        "POSITIVE_DIVERGENCE"
    }:

        score += 4

    elif participation == "HOLDING_DURING_PULLBACK":

        score += 3

    elif participation in {
        "NORMAL_PULLBACK",
        "NEUTRAL"
    }:

        score += 1

    return min(
        score,
        40
    )


def classify_structure_timing(
    technical,
    finra
):

    weeks = finra.get(
        "weeks_available",
        0
    )

    if (
        not finra.get(
            "available"
        )
        or
        weeks
        <
        MIN_FINRA_WEEKS_FOR_BOOST
    ):

        return "INSUFFICIENT_FINRA_HISTORY"

    scanner_type = technical.get(
        "scanner_type"
    )

    structural_score = technical.get(
        "structural_score",
        0
    )

    higher_lows = technical.get(
        "higher_lows",
        0
    )

    distance = technical.get(
        "distance_from_resistance_percent"
    )

    participation = technical.get(
        "participation_state"
    )

    price_5d = technical.get(
        "price_change_5d_percent"
    )

    price_20d = technical.get(
        "price_change_20d_percent"
    )

    price_60d = technical.get(
        "price_change_60d_percent"
    )

    if scanner_type == "BREAKOUT":

        if (
            distance is not None
            and
            distance >= 8
        ):

            return "EXTENDED_BREAKOUT"

        if (
            price_5d is not None
            and
            price_5d >= 15
        ):

            return "EXTENDED_BREAKOUT"

    if (
        price_60d is not None
        and
        price_60d >= 35
        and
        price_20d is not None
        and
        abs(price_20d) <= 5
        and
        participation not in {
            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"
        }
    ):

        return "POST_MOVE_ACTIVITY"

    if (
        price_20d is not None
        and
        abs(price_20d) <= 3
        and
        price_60d is not None
        and
        abs(price_60d) <= 8
        and
        participation not in {
            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"
        }
    ):

        return "CHOPPY_FLAT"

    if (
        price_60d is not None
        and
        price_60d >= 55
    ):

        return "ADVANCED_TREND"

    if (
        scanner_type == "PRE_BREAKOUT"
        and
        distance is not None
        and
        abs(distance) <= 3.5
        and
        higher_lows >= 3
        and
        participation in {
            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"
        }
        and
        (
            price_5d is None
            or
            abs(price_5d) <= 10
        )
    ):

        return "EARLY_CONSTRUCTIVE"

    if (
        scanner_type == "PRE_BREAKOUT"
        and
        distance is not None
        and
        abs(distance) <= 5
        and
        higher_lows >= 3
        and
        structural_score >= 60
    ):

        return "CONSTRUCTIVE_BASE"

    if (
        scanner_type == "BREAKOUT"
        and
        distance is not None
        and
        distance <= 5
        and
        participation in {
            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"
        }
    ):

        return "CONSTRUCTIVE_BREAKOUT"

    if (
        structural_score < 60
        or
        higher_lows < 2
    ):

        return "WEAK_STRUCTURE"

    return "MIXED_STRUCTURE"


def calculate_alignment_score(
    technical,
    finra,
    timing_state
):

    if not has_meaningful_activity_signal(
        finra
    ):

        return 0

    score = 0

    if timing_state == "EARLY_CONSTRUCTIVE":

        score += 12

    elif timing_state == "CONSTRUCTIVE_BASE":

        score += 9

    elif timing_state == "CONSTRUCTIVE_BREAKOUT":

        score += 7

    elif timing_state == "MIXED_STRUCTURE":

        score += 3

    obv_20d = technical.get(
        "obv_trend_20d"
    )

    obv_60d = technical.get(
        "obv_trend_60d"
    )

    positive_obv_states = {
        "rising",
        "slightly_rising"
    }

    if (
        obv_20d in positive_obv_states
        and
        obv_60d in positive_obv_states
    ):

        score += 4

    elif (
        obv_20d in positive_obv_states
        or
        obv_60d in positive_obv_states
    ):

        score += 2

    activity_state = finra.get(
        "current_activity_state"
    )

    if activity_state == "VERY_ELEVATED":

        score += 4

    elif activity_state == "ELEVATED":

        score += 2

    return min(
        score,
        20
    )


def apply_x_factor_cap(
    raw_score,
    timing_state
):

    if timing_state == "INSUFFICIENT_FINRA_HISTORY":

        return min(
            raw_score,
            49
        )

    if timing_state in {
        "CHOPPY_FLAT",
        "POST_MOVE_ACTIVITY",
        "EXTENDED_BREAKOUT"
    }:

        return min(
            raw_score,
            54
        )

    if timing_state == "ADVANCED_TREND":

        return min(
            raw_score,
            64
        )

    if timing_state == "WEAK_STRUCTURE":

        return min(
            raw_score,
            54
        )

    return min(
        raw_score,
        100
    )


def get_x_factor_label(
    score,
    finra,
    timing_state
):

    if timing_state == "INSUFFICIENT_FINRA_HISTORY":

        return "INSUFFICIENT_DATA"

    if not has_meaningful_activity_signal(
        finra
    ):

        return "NO_CURRENT_X_FACTOR"

    if score >= 85:
        return "EXCEPTIONAL"

    if score >= 75:
        return "HIGH"

    if score >= 65:
        return "ELEVATED"

    if score >= 55:
        return "MILD"

    return "LIMITED"


def calculate_boost(
    x_factor_score,
    x_factor_label,
    timing_state
):

    if timing_state in {
        "INSUFFICIENT_FINRA_HISTORY",
        "CHOPPY_FLAT",
        "POST_MOVE_ACTIVITY",
        "EXTENDED_BREAKOUT",
        "WEAK_STRUCTURE"
    }:

        return 0

    if x_factor_label == "NO_CURRENT_X_FACTOR":

        return 0

    if x_factor_score >= 85:
        return EXCEPTIONAL_BOOST

    if x_factor_score >= 75:
        return HIGH_BOOST

    if x_factor_score >= 65:
        return ELEVATED_BOOST

    if x_factor_score >= 55:
        return MILD_BOOST

    return 0


def build_reason_tags(
    technical,
    finra,
    timing_state
):

    tags = []

    activity_state = finra.get(
        "current_activity_state"
    )

    if activity_state == "VERY_ELEVATED":

        tags.append(
            "very_elevated_off_exchange_activity"
        )

    elif activity_state == "ELEVATED":

        tags.append(
            "elevated_off_exchange_activity"
        )

    percentile = finra.get(
        "volume_percentile"
    )

    if (
        percentile is not None
        and
        percentile >= 90
    ):

        tags.append(
            "high_historical_activity_percentile"
        )

    block_index = finra.get(
        "latest_block_activity_index"
    )

    if (
        block_index is not None
        and
        block_index >= 150
    ):

        tags.append(
            "very_elevated_4_week_activity"
        )

    elif (
        block_index is not None
        and
        block_index >= 120
    ):

        tags.append(
            "elevated_4_week_activity"
        )

    meaningful_activity = (
        has_meaningful_activity_signal(
            finra
        )
    )

    if meaningful_activity:

        if timing_state == "EARLY_CONSTRUCTIVE":

            tags.append(
                "activity_aligned_with_"
                "early_constructive_structure"
            )

        elif timing_state == "CONSTRUCTIVE_BASE":

            tags.append(
                "activity_aligned_with_"
                "constructive_base"
            )

        elif timing_state == "CONSTRUCTIVE_BREAKOUT":

            tags.append(
                "activity_aligned_with_"
                "constructive_breakout"
            )

        elif timing_state == "CHOPPY_FLAT":

            tags.append(
                "activity_occurring_in_"
                "choppy_flat_structure"
            )

        elif timing_state == "POST_MOVE_ACTIVITY":

            tags.append(
                "activity_detected_after_"
                "large_prior_price_move"
            )

        elif timing_state == "EXTENDED_BREAKOUT":

            tags.append(
                "activity_detected_after_"
                "price_extension"
            )

        elif timing_state == "ADVANCED_TREND":

            tags.append(
                "activity_detected_in_"
                "advanced_trend"
            )

    participation = technical.get(
        "participation_state"
    )

    if participation == "STRONG_CONFIRMATION":

        tags.append(
            "strong_technical_participation"
        )

    elif participation == "POSITIVE_DIVERGENCE":

        tags.append(
            "positive_volume_price_divergence"
        )

    return tags


def get_institutional_footprint(
    symbol,
    finra_data
):

    symbols = finra_data.get(
        "symbols",
        {}
    )

    if not isinstance(
        symbols,
        dict
    ):

        return {}

    record = symbols.get(
        symbol,
        {}
    )

    if not isinstance(
        record,
        dict
    ):

        return {}

    footprint = record.get(
        "institutional_footprint",
        {}
    )

    if not isinstance(
        footprint,
        dict
    ):

        return {}

    return footprint


def calculate_institutional_factor(
    candidate,
    finra_data
):

    symbol = str(
        candidate.get(
            "symbol",
            ""
        )
    ).strip().upper()


    footprint = get_institutional_footprint(
        symbol,
        finra_data
    )


    technical = get_technical_context(
        candidate
    )


    # Current aggregate FINRA activity must support
    # the cross-venue institutional footprint.

    finra_context = get_finra_context(
        symbol,
        finra_data
    )


    current_finra_percentile = finra_context.get(
        "volume_percentile"
    )


    current_activity_gate_passed = (
        current_finra_percentile is not None
        and
        current_finra_percentile >= 50
    )


    # Block institutional promotion when the existing
    # EdgeBreak timing assessment is unsuitable.

    timing_state = classify_structure_timing(
        technical,
        finra_context
    )


    blocked_timing_states = {
        "CHOPPY_FLAT",
        "POST_MOVE_ACTIVITY",
        "EXTENDED_BREAKOUT",
        "WEAK_STRUCTURE",
        "INSUFFICIENT_FINRA_HISTORY"
    }


    timing_gate_passed = (
        timing_state not in blocked_timing_states
    )


    activity_score = safe_int(
        footprint.get(
            "score"
        ),
        0
    )


    meaningful = bool(
        footprint.get(
            "meaningful_cross_venue_signal",
            False
        )
    )


    strongest_event = footprint.get(
        "strongest_multi_venue_week"
    )


    if not isinstance(
        strongest_event,
        dict
    ):

        strongest_event = {}


    venue_count = safe_int(
        strongest_event.get(
            "unusual_venue_count"
        ),
        0
    )


    alignment_score = 0
    alignment_tags = []


    if (
        technical.get(
            "obv_price_relationship"
        )
        ==
        "confirming_strength"
    ):

        alignment_score += 3

        alignment_tags.append(
            "obv_confirming_strength"
        )


    rising_states = {
        "rising",
        "slightly_rising",
        "strongly_rising"
    }


    if (
        technical.get(
            "obv_trend_20d"
        )
        in
        rising_states
    ):

        alignment_score += 2

        alignment_tags.append(
            "obv_20d_rising"
        )


    if (
        technical.get(
            "obv_trend_60d"
        )
        in
        rising_states
    ):

        alignment_score += 2

        alignment_tags.append(
            "obv_60d_rising"
        )


    if safe_float(
        technical.get(
            "price_change_20d_percent"
        ),
        0
    ) > 0:

        alignment_score += 1

        alignment_tags.append(
            "positive_20d_price_structure"
        )


    if (
        technical.get(
            "participation_state"
        )
        ==
        "STRONG_CONFIRMATION"
    ):

        alignment_score += 2

        alignment_tags.append(
            "strong_participation_confirmation"
        )


    alignment_score = min(
        alignment_score,
        10
    )


    combined_score = min(
        activity_score
        +
        alignment_score,
        100
    )


    boost = 0


    # Institutional boost requires:
    # 1. Meaningful cross-venue activity
    # 2. At least two unusual venues
    # 3. Current FINRA percentile of at least 50
    # 4. Suitable EdgeBreak timing
    # 5. Supporting technical alignment

    if (
        meaningful
        and
        venue_count >= 2
        and
        current_activity_gate_passed
        and
        timing_gate_passed
        and
        alignment_score >= 3
    ):

        if combined_score >= 85:

            boost = 8

        elif combined_score >= 75:

            boost = 5

        elif combined_score >= 65:

            boost = 3

        elif combined_score >= 50:

            boost = 2


    reason_tags = footprint.get(
        "reason_tags",
        []
    )


    if not isinstance(
        reason_tags,
        list
    ):

        reason_tags = []


    return {

        "analyzed":
            bool(
                footprint.get(
                    "analyzed",
                    False
                )
            ),

        "score":
            int(
                round(
                    combined_score
                )
            ),

        "activity_score":
            activity_score,

        "technical_alignment_score":
            alignment_score,

        "boost_points":
            boost,

        "label":
            footprint.get(
                "label",
                "NO_VENUE_DATA"
            ),

        "meaningful_cross_venue_signal":
            meaningful,

        "current_finra_percentile":
            current_finra_percentile,

        "current_activity_gate_passed":
            current_activity_gate_passed,

        "structure_timing_state":
            timing_state,

        "timing_gate_passed":
            timing_gate_passed,

        "latest_finra_week":
            footprint.get(
                "latest_finra_week"
            ),

        "multi_venue_weeks_last_4":
            safe_int(
                footprint.get(
                    "multi_venue_weeks_last_4"
                ),
                0
            ),

        "consecutive_multi_venue_weeks":
            safe_int(
                footprint.get(
                    "consecutive_multi_venue_weeks"
                ),
                0
            ),

        "strongest_multi_venue_week":
            strongest_event
            if strongest_event
            else None,

        "reason_tags":
            list(
                dict.fromkeys(
                    reason_tags
                    +
                    alignment_tags
                )
            ),

        "important_note":
            (
                "This is an institutional-scale activity "
                "inference from delayed FINRA reporting. "
                "It does not prove buying or identify the "
                "underlying investment fund."
            )

    }


def calculate_x_factor(
    candidate,
    finra_data
):

    symbol = str(
        candidate.get(
            "symbol",
            ""
        )
    ).strip().upper()

    technical = get_technical_context(
        candidate
    )

    finra = get_finra_context(
        symbol,
        finra_data
    )

    activity_score = (
        calculate_activity_score(
            finra
        )
    )

    structure_score = (
        calculate_structure_score(
            technical
        )
    )

    timing_state = (
        classify_structure_timing(
            technical,
            finra
        )
    )

    alignment_score = (
        calculate_alignment_score(
            technical,
            finra,
            timing_state
        )
    )

    raw_score = (
        activity_score
        +
        structure_score
        +
        alignment_score
    )

    if not has_meaningful_activity_signal(
        finra
    ):

        raw_score = min(
            raw_score,
            49
        )

    final_score = apply_x_factor_cap(
        raw_score,
        timing_state
    )

    label = get_x_factor_label(
        final_score,
        finra,
        timing_state
    )

    boost = calculate_boost(
        final_score,
        label,
        timing_state
    )

    reason_tags = build_reason_tags(
        technical,
        finra,
        timing_state
    )

    return {

        "score":
            int(
                round(
                    final_score
                )
            ),

        "label":
            label,

        "boost_points":
            boost,

        "activity_score":
            activity_score,

        "structure_score":
            structure_score,

        "alignment_score":
            alignment_score,

        "structure_timing_state":
            timing_state,

        "meaningful_activity_signal":
            has_meaningful_activity_signal(
                finra
            ),

        "finra_weeks_available":
            finra.get(
                "weeks_available"
            ),

        "finra_latest_week":
            finra.get(
                "latest_week"
            ),

        "finra_data_age_days":
            calculate_data_age_days(
                finra.get(
                    "latest_week"
                )
            ),

        "finra_activity_state":
            finra.get(
                "current_activity_state"
            ),

        "finra_volume_percentile":
            finra.get(
                "volume_percentile"
            ),

        "finra_latest_vs_prior_4_week_percent":
            finra.get(
                "latest_vs_4_week"
            ),

        "finra_latest_vs_prior_12_week_percent":
            finra.get(
                "latest_vs_12_week"
            ),

        "finra_latest_vs_prior_26_week_percent":
            finra.get(
                "latest_vs_26_week"
            ),

        "finra_latest_4_week_activity_index":
            finra.get(
                "latest_block_activity_index"
            ),

        "finra_latest_4_week_z_score":
            finra.get(
                "latest_block_z_score"
            ),

        "finra_yearly_activity_pattern":
            finra.get(
                "yearly_activity_pattern"
            ),

        "reason_tags":
            reason_tags,

        "important_note":
            (
                "Off-exchange activity measures "
                "trading activity only and does not "
                "indicate buying or selling direction."
            )
    }


def assign_final_ranks(candidates):

    previous_score = None
    current_rank = 0

    for position, candidate in enumerate(
        candidates,
        start=1
    ):

        final_score = safe_float(
            candidate.get(
                "final_daily_brief_score"
            ),
            0
        )

        if (
            previous_score is None
            or
            final_score != previous_score
        ):

            current_rank = position

        candidate[
            "final_daily_brief_rank"
        ] = current_rank

        candidate[
            "daily_brief_rank"
        ] = current_rank

        previous_score = final_score


def main():

    print()
    print(
        "=" * 70
    )
    print(
        "EDGEBREAK FINRA X-FACTOR RERANK"
    )
    print(
        "=" * 70
    )
    print()

    candidates = load_json(
        CANDIDATES_FILE
    )

    if not isinstance(
        candidates,
        list
    ):

        raise RuntimeError(
            f"{CANDIDATES_FILE} must "
            "contain a JSON array."
        )

    finra_data = load_json(
        FINRA_FILE
    )

    if not isinstance(
        finra_data,
        dict
    ):

        raise RuntimeError(
            f"{FINRA_FILE} must "
            "contain a JSON object."
        )

    original_candidates = deepcopy(
        candidates
    )

    save_json_atomic(
        BACKUP_FILE,
        original_candidates
    )

    processed = []

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

        if not symbol:
            continue

        original_rank = get_original_rank(
            candidate,
            fallback_rank
        )

        original_score = get_original_score(
            candidate
        )

        x_factor = calculate_x_factor(
            candidate,
            finra_data
        )

        x_factor_boost = safe_float(
            x_factor.get(
                "boost_points"
            ),
            0
        )

        institutional_footprint = (
            calculate_institutional_factor(
                candidate,
                finra_data
            )
        )

        institutional_boost = safe_float(
            institutional_footprint.get(
                "boost_points"
            ),
            0
        )

        final_score = (
            original_score
            +
            x_factor_boost
            +
            institutional_boost
        )

        candidate[
            "pre_finra_rank"
        ] = original_rank

        candidate[
            "pre_finra_score"
        ] = original_score

        candidate[
            "x_factor"
        ] = x_factor

        candidate[
            "institutional_footprint"
        ] = institutional_footprint

        candidate[
            "final_daily_brief_score"
        ] = final_score

        ranking = get_ranking(
            candidate
        )

        ranking[
            "pre_finra_total_score"
        ] = original_score

        ranking[
            "x_factor_boost"
        ] = x_factor_boost

        ranking[
            "institutional_footprint_boost"
        ] = institutional_boost

        ranking[
            "final_score"
        ] = final_score

        candidate[
            "daily_brief_ranking"
        ] = ranking

        processed.append(
            candidate
        )

    processed.sort(
        key=lambda candidate: (

            -safe_float(
                candidate.get(
                    "final_daily_brief_score"
                ),
                0
            ),

            safe_int(
                candidate.get(
                    "pre_finra_rank"
                ),
                999
            ),

            str(
                candidate.get(
                    "symbol",
                    ""
                )
            )
        )
    )

    assign_final_ranks(
        processed
    )

    save_json_atomic(
        CANDIDATES_FILE,
        processed
    )

    print(
        "ORIGINAL → FINAL"
    )
    print(
        "-" * 120
    )

    for candidate in processed:

        symbol = candidate.get(
            "symbol"
        )

        old_rank = candidate.get(
            "pre_finra_rank"
        )

        new_rank = candidate.get(
            "final_daily_brief_rank"
        )

        original_score = candidate.get(
            "pre_finra_score"
        )

        final_score = candidate.get(
            "final_daily_brief_score"
        )

        x_factor = candidate.get(
            "x_factor",
            {}
        )

        x_score = x_factor.get(
            "score",
            0
        )

        x_label = x_factor.get(
            "label",
            ""
        )

        x_boost = x_factor.get(
            "boost_points",
            0
        )

        institutional = candidate.get(
            "institutional_footprint",
            {}
        )

        institutional_score = institutional.get(
            "score",
            0
        )

        institutional_boost = institutional.get(
            "boost_points",
            0
        )

        timing = x_factor.get(
            "structure_timing_state",
            ""
        )

        activity = x_factor.get(
            "finra_activity_state",
            ""
        )

        percentile = x_factor.get(
            "finra_volume_percentile"
        )

        print(
            f"#{old_rank:<2} → "
            f"#{new_rank:<2} "
            f"{symbol:<6} | "
            f"Tech {original_score:>5.1f} | "
            f"X {x_score:>3} "
            f"{x_label:<18} | "
            f"X +{x_boost:<2} | "
            f"Venue {institutional_score:>3} "
            f"+{institutional_boost:<2} | "
            f"Final {final_score:>5.1f} | "
            f"{timing:<24} | "
            f"FINRA {activity} "
            f"{percentile}"
        )

    print()
    print(
        "=" * 70
    )
    print(
        "X-FACTOR + INSTITUTIONAL RERANK COMPLETE"
    )
    print(
        "=" * 70
    )
    print()

    print(
        f"Original shortlist backup: "
        f"{BACKUP_FILE}"
    )

    print(
        f"Final reranked shortlist: "
        f"{CANDIDATES_FILE}"
    )

    print(
        "Scanner source files unchanged."
    )

    print(
        "Existing website data filename unchanged."
    )

    print(
        "FINRA and institutional analysis only "
        "promoted existing survivors."
    )

    print()


if __name__ == "__main__":

    main()


def safe_float(value, default=None):

    try:

        if value is None:
            return default

        return float(value)

    except (TypeError, ValueError):

        return default


def safe_int(value, default=0):

    try:

        if value is None:
            return default

        return int(float(value))

    except (TypeError, ValueError):

        return default


def load_json(filename):

    if not os.path.exists(
        filename
    ):

        raise RuntimeError(
            f"Required file not found: {filename}"
        )

    try:

        with open(
            filename,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(
                file
            )

    except Exception as error:

        raise RuntimeError(
            f"Could not read {filename}: {error}"
        ) from error


def save_json_atomic(
    filename,
    data
):

    directory = os.path.dirname(
        os.path.abspath(
            filename
        )
    )

    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        delete=False,
        dir=directory,
        suffix=".tmp"
    ) as temp_file:

        json.dump(
            data,
            temp_file,
            indent=4,
            ensure_ascii=False
        )

        temp_name = temp_file.name

    os.replace(
        temp_name,
        filename
    )


def get_ranking(candidate):

    ranking = candidate.get(
        "daily_brief_ranking",
        {}
    )

    if not isinstance(
        ranking,
        dict
    ):

        ranking = {}

    return ranking


def get_original_score(candidate):

    ranking = get_ranking(
        candidate
    )

    return safe_float(
        ranking.get(
            "total_score"
        ),
        0
    )


def get_original_rank(
    candidate,
    fallback_rank
):

    saved_rank = candidate.get(
        "pre_finra_rank"
    )

    if saved_rank is not None:

        return safe_int(
            saved_rank,
            fallback_rank
        )

    return safe_int(
        candidate.get(
            "daily_brief_rank"
        ),
        fallback_rank
    )


def get_scanner_type(candidate):

    ranking = get_ranking(
        candidate
    )

    scanner_type = str(
        ranking.get(
            "scanner_type",
            ""
        )
    ).strip().upper()

    if scanner_type:
        return scanner_type

    scanners = candidate.get(
        "scanners",
        []
    )

    if isinstance(
        scanners,
        list
    ):

        scanners = [

            str(value).strip().upper()

            for value in scanners
        ]

        if "BREAKOUT" in scanners:
            return "BREAKOUT"

        if "PRE_BREAKOUT" in scanners:
            return "PRE_BREAKOUT"

    return "UNKNOWN"


def get_technical_context(candidate):

    ranking = get_ranking(
        candidate
    )

    structural_score = safe_float(
        ranking.get(
            "structural_score"
        ),
        0
    )

    resistance_touches = safe_int(
        ranking.get(
            "resistance_touches"
        ),
        0
    )

    higher_lows = safe_int(
        ranking.get(
            "higher_lows"
        ),
        0
    )

    distance = safe_float(
        ranking.get(
            "distance_from_resistance_percent"
        ),
        None
    )

    participation_state = str(
        ranking.get(
            "participation_state",
            ""
        )
    ).strip().upper()

    obv_relationship = str(
        ranking.get(
            "obv_price_relationship",
            ""
        )
    ).strip().lower()

    obv_5d = str(
        ranking.get(
            "obv_trend_5d",
            ""
        )
    ).strip().lower()

    obv_20d = str(
        ranking.get(
            "obv_trend_20d",
            ""
        )
    ).strip().lower()

    obv_60d = str(
        ranking.get(
            "obv_trend_60d",
            ""
        )
    ).strip().lower()

    price_5d = safe_float(
        ranking.get(
            "price_change_5d_percent"
        ),
        None
    )

    price_20d = safe_float(
        ranking.get(
            "price_change_20d_percent"
        ),
        None
    )

    price_60d = safe_float(
        ranking.get(
            "price_change_60d_percent"
        ),
        None
    )

    return {

        "scanner_type":
            get_scanner_type(
                candidate
            ),

        "structural_score":
            structural_score,

        "resistance_touches":
            resistance_touches,

        "higher_lows":
            higher_lows,

        "distance_from_resistance_percent":
            distance,

        "participation_state":
            participation_state,

        "obv_price_relationship":
            obv_relationship,

        "obv_trend_5d":
            obv_5d,

        "obv_trend_20d":
            obv_20d,

        "obv_trend_60d":
            obv_60d,

        "price_change_5d_percent":
            price_5d,

        "price_change_20d_percent":
            price_20d,

        "price_change_60d_percent":
            price_60d
    }


def get_finra_context(
    symbol,
    finra_data
):

    symbols = finra_data.get(
        "symbols",
        {}
    )

    if not isinstance(
        symbols,
        dict
    ):

        symbols = {}

    record = symbols.get(
        symbol,
        {}
    )

    if not isinstance(
        record,
        dict
    ):

        record = {}

    analytics = record.get(
        "analytics",
        {}
    )

    if not isinstance(
        analytics,
        dict
    ):

        analytics = {}

    blocks = record.get(
        "activity_blocks_4_week",
        []
    )

    if not isinstance(
        blocks,
        list
    ):

        blocks = []

    latest_block = {}

    if blocks:

        latest_block = blocks[-1]

        if not isinstance(
            latest_block,
            dict
        ):

            latest_block = {}

    return {

        "available":
            bool(
                analytics.get(
                    "available",
                    False
                )
            ),

        "weeks_available":
            safe_int(
                analytics.get(
                    "weeks_available"
                ),
                0
            ),

        "latest_week":
            analytics.get(
                "latest_week"
            ),

        "current_activity_state":
            str(
                analytics.get(
                    "current_activity_state",
                    ""
                )
            ).strip().upper(),

        "volume_percentile":
            safe_float(
                analytics.get(
                    "volume_12_month_percentile"
                ),
                None
            ),

        "latest_vs_4_week":
            safe_float(
                analytics.get(
                    "latest_vs_prior_4_week_percent"
                ),
                None
            ),

        "latest_vs_12_week":
            safe_float(
                analytics.get(
                    "latest_vs_prior_12_week_percent"
                ),
                None
            ),

        "latest_vs_26_week":
            safe_float(
                analytics.get(
                    "latest_vs_prior_26_week_percent"
                ),
                None
            ),

        "elevated_weeks_last_8":
            safe_int(
                analytics.get(
                    "elevated_weeks_last_8"
                ),
                0
            ),

        "yearly_activity_pattern":
            analytics.get(
                "yearly_activity_pattern"
            ),

        "latest_block_activity_index":
            safe_float(
                latest_block.get(
                    "activity_index"
                ),
                None
            ),

        "latest_block_z_score":
            safe_float(
                latest_block.get(
                    "z_score"
                ),
                None
            ),

        "latest_block_state":
            str(
                latest_block.get(
                    "activity_state",
                    ""
                )
            ).strip().upper(),

        "latest_block_anomaly":
            str(
                latest_block.get(
                    "anomaly_state",
                    ""
                )
            ).strip().upper()
    }


def calculate_data_age_days(
    latest_week
):

    if not latest_week:
        return None

    try:

        latest_date = datetime.strptime(
            latest_week,
            "%Y-%m-%d"
        ).date()

        today = datetime.now(
            timezone.utc
        ).date()

        return (
            today
            -
            latest_date
        ).days

    except Exception:

        return None


def has_meaningful_activity_signal(finra):

    if not finra.get(
        "available"
    ):

        return False

    if (
        finra.get(
            "weeks_available",
            0
        )
        <
        MIN_FINRA_WEEKS_FOR_BOOST
    ):

        return False

    state = finra.get(
        "current_activity_state"
    )

    percentile = finra.get(
        "volume_percentile"
    )

    latest_vs_12 = finra.get(
        "latest_vs_12_week"
    )

    block_index = finra.get(
        "latest_block_activity_index"
    )

    block_z = finra.get(
        "latest_block_z_score"
    )

    if state in {
        "ELEVATED",
        "VERY_ELEVATED"
    }:

        return True

    if (
        block_index is not None
        and
        block_index >= 120
    ):

        return True

    if (
        block_z is not None
        and
        block_z >= 1.5
    ):

        return True

    if (
        percentile is not None
        and
        percentile >= 90
        and
        latest_vs_12 is not None
        and
        latest_vs_12 >= 10
    ):

        return True

    return False


def calculate_activity_score(finra):

    if not finra.get(
        "available"
    ):

        return 0

    score = 0

    state = finra.get(
        "current_activity_state"
    )

    if state == "VERY_ELEVATED":

        score += 16

    elif state == "ELEVATED":

        score += 10

    percentile = finra.get(
        "volume_percentile"
    )

    if percentile is not None:

        if percentile >= 98:
            score += 10

        elif percentile >= 90:
            score += 8

        elif percentile >= 80:
            score += 5

        elif percentile >= 70:
            score += 3

    latest_vs_12 = finra.get(
        "latest_vs_12_week"
    )

    if latest_vs_12 is not None:

        if latest_vs_12 >= 150:
            score += 8

        elif latest_vs_12 >= 75:
            score += 6

        elif latest_vs_12 >= 25:
            score += 4

        elif latest_vs_12 >= 10:
            score += 2

    block_index = finra.get(
        "latest_block_activity_index"
    )

    if block_index is not None:

        if block_index >= 180:
            score += 6

        elif block_index >= 150:
            score += 5

        elif block_index >= 120:
            score += 3

    block_z = finra.get(
        "latest_block_z_score"
    )

    if block_z is not None:

        if block_z >= 2:
            score += 4

        elif block_z >= 1.5:
            score += 2

    return min(
        score,
        40
    )


def calculate_structure_score(technical):

    score = 0

    structural = technical.get(
        "structural_score",
        0
    )

    if structural >= 75:

        score += 18

    elif structural >= 70:

        score += 16

    elif structural >= 65:

        score += 14

    elif structural >= 60:

        score += 12

    elif structural >= 55:

        score += 10

    else:

        score += 6

    higher_lows = technical.get(
        "higher_lows",
        0
    )

    if higher_lows >= 5:

        score += 8

    elif higher_lows == 4:

        score += 7

    elif higher_lows == 3:

        score += 5

    elif higher_lows == 2:

        score += 3

    touches = technical.get(
        "resistance_touches",
        0
    )

    if touches >= 4:

        score += 5

    elif touches == 3:

        score += 4

    elif touches == 2:

        score += 2

    distance = technical.get(
        "distance_from_resistance_percent"
    )

    if distance is not None:

        absolute_distance = abs(
            distance
        )

        if absolute_distance <= 1:

            score += 5

        elif absolute_distance <= 3:

            score += 4

        elif absolute_distance <= 5:

            score += 2

        elif absolute_distance <= 8:

            score += 1

    participation = technical.get(
        "participation_state"
    )

    if participation in {
        "STRONG_CONFIRMATION",
        "POSITIVE_DIVERGENCE"
    }:

        score += 4

    elif participation == "HOLDING_DURING_PULLBACK":

        score += 3

    elif participation in {
        "NORMAL_PULLBACK",
        "NEUTRAL"
    }:

        score += 1

    return min(
        score,
        40
    )


def classify_structure_timing(
    technical,
    finra
):

    weeks = finra.get(
        "weeks_available",
        0
    )

    if (
        not finra.get(
            "available"
        )
        or
        weeks
        <
        MIN_FINRA_WEEKS_FOR_BOOST
    ):

        return "INSUFFICIENT_FINRA_HISTORY"

    scanner_type = technical.get(
        "scanner_type"
    )

    structural_score = technical.get(
        "structural_score",
        0
    )

    higher_lows = technical.get(
        "higher_lows",
        0
    )

    distance = technical.get(
        "distance_from_resistance_percent"
    )

    participation = technical.get(
        "participation_state"
    )

    price_5d = technical.get(
        "price_change_5d_percent"
    )

    price_20d = technical.get(
        "price_change_20d_percent"
    )

    price_60d = technical.get(
        "price_change_60d_percent"
    )

    if scanner_type == "BREAKOUT":

        if (
            distance is not None
            and
            distance >= 8
        ):

            return "EXTENDED_BREAKOUT"

        if (
            price_5d is not None
            and
            price_5d >= 15
        ):

            return "EXTENDED_BREAKOUT"

    if (
        price_60d is not None
        and
        price_60d >= 35
        and
        price_20d is not None
        and
        abs(price_20d) <= 5
        and
        participation not in {
            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"
        }
    ):

        return "POST_MOVE_ACTIVITY"

    if (
        price_20d is not None
        and
        abs(price_20d) <= 3
        and
        price_60d is not None
        and
        abs(price_60d) <= 8
        and
        participation not in {
            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"
        }
    ):

        return "CHOPPY_FLAT"

    if (
        price_60d is not None
        and
        price_60d >= 55
    ):

        return "ADVANCED_TREND"

    if (
        scanner_type == "PRE_BREAKOUT"
        and
        distance is not None
        and
        abs(distance) <= 3.5
        and
        higher_lows >= 3
        and
        participation in {
            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"
        }
        and
        (
            price_5d is None
            or
            abs(price_5d) <= 10
        )
    ):

        return "EARLY_CONSTRUCTIVE"

    if (
        scanner_type == "PRE_BREAKOUT"
        and
        distance is not None
        and
        abs(distance) <= 5
        and
        higher_lows >= 3
        and
        structural_score >= 60
    ):

        return "CONSTRUCTIVE_BASE"

    if (
        scanner_type == "BREAKOUT"
        and
        distance is not None
        and
        distance <= 5
        and
        participation in {
            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"
        }
    ):

        return "CONSTRUCTIVE_BREAKOUT"

    if (
        structural_score < 60
        or
        higher_lows < 2
    ):

        return "WEAK_STRUCTURE"

    return "MIXED_STRUCTURE"


def calculate_alignment_score(
    technical,
    finra,
    timing_state
):

    if not has_meaningful_activity_signal(
        finra
    ):

        return 0

    score = 0

    if timing_state == "EARLY_CONSTRUCTIVE":

        score += 12

    elif timing_state == "CONSTRUCTIVE_BASE":

        score += 9

    elif timing_state == "CONSTRUCTIVE_BREAKOUT":

        score += 7

    elif timing_state == "MIXED_STRUCTURE":

        score += 3

    obv_20d = technical.get(
        "obv_trend_20d"
    )

    obv_60d = technical.get(
        "obv_trend_60d"
    )

    positive_obv_states = {
        "rising",
        "slightly_rising"
    }

    if (
        obv_20d in positive_obv_states
        and
        obv_60d in positive_obv_states
    ):

        score += 4

    elif (
        obv_20d in positive_obv_states
        or
        obv_60d in positive_obv_states
    ):

        score += 2

    activity_state = finra.get(
        "current_activity_state"
    )

    if activity_state == "VERY_ELEVATED":

        score += 4

    elif activity_state == "ELEVATED":

        score += 2

    return min(
        score,
        20
    )


def apply_x_factor_cap(
    raw_score,
    timing_state
):

    if timing_state == "INSUFFICIENT_FINRA_HISTORY":

        return min(
            raw_score,
            49
        )

    if timing_state in {
        "CHOPPY_FLAT",
        "POST_MOVE_ACTIVITY",
        "EXTENDED_BREAKOUT"
    }:

        return min(
            raw_score,
            54
        )

    if timing_state == "ADVANCED_TREND":

        return min(
            raw_score,
            64
        )

    if timing_state == "WEAK_STRUCTURE":

        return min(
            raw_score,
            54
        )

    return min(
        raw_score,
        100
    )


def get_x_factor_label(
    score,
    finra,
    timing_state
):

    if timing_state == "INSUFFICIENT_FINRA_HISTORY":

        return "INSUFFICIENT_DATA"

    if not has_meaningful_activity_signal(
        finra
    ):

        return "NO_CURRENT_X_FACTOR"

    if score >= 85:
        return "EXCEPTIONAL"

    if score >= 75:
        return "HIGH"

    if score >= 65:
        return "ELEVATED"

    if score >= 55:
        return "MILD"

    return "LIMITED"


def calculate_boost(
    x_factor_score,
    x_factor_label,
    timing_state
):

    if timing_state in {
        "INSUFFICIENT_FINRA_HISTORY",
        "CHOPPY_FLAT",
        "POST_MOVE_ACTIVITY",
        "EXTENDED_BREAKOUT",
        "WEAK_STRUCTURE"
    }:

        return 0

    if x_factor_label == "NO_CURRENT_X_FACTOR":

        return 0

    if x_factor_score >= 85:
        return EXCEPTIONAL_BOOST

    if x_factor_score >= 75:
        return HIGH_BOOST

    if x_factor_score >= 65:
        return ELEVATED_BOOST

    if x_factor_score >= 55:
        return MILD_BOOST

    return 0


def build_reason_tags(
    technical,
    finra,
    timing_state
):

    tags = []

    activity_state = finra.get(
        "current_activity_state"
    )

    if activity_state == "VERY_ELEVATED":

        tags.append(
            "very_elevated_off_exchange_activity"
        )

    elif activity_state == "ELEVATED":

        tags.append(
            "elevated_off_exchange_activity"
        )

    percentile = finra.get(
        "volume_percentile"
    )

    if (
        percentile is not None
        and
        percentile >= 90
    ):

        tags.append(
            "high_historical_activity_percentile"
        )

    block_index = finra.get(
        "latest_block_activity_index"
    )

    if (
        block_index is not None
        and
        block_index >= 150
    ):

        tags.append(
            "very_elevated_4_week_activity"
        )

    elif (
        block_index is not None
        and
        block_index >= 120
    ):

        tags.append(
            "elevated_4_week_activity"
        )

    meaningful_activity = (
        has_meaningful_activity_signal(
            finra
        )
    )

    if meaningful_activity:

        if timing_state == "EARLY_CONSTRUCTIVE":

            tags.append(
                "activity_aligned_with_"
                "early_constructive_structure"
            )

        elif timing_state == "CONSTRUCTIVE_BASE":

            tags.append(
                "activity_aligned_with_"
                "constructive_base"
            )

        elif timing_state == "CONSTRUCTIVE_BREAKOUT":

            tags.append(
                "activity_aligned_with_"
                "constructive_breakout"
            )

        elif timing_state == "CHOPPY_FLAT":

            tags.append(
                "activity_occurring_in_"
                "choppy_flat_structure"
            )

        elif timing_state == "POST_MOVE_ACTIVITY":

            tags.append(
                "activity_detected_after_"
                "large_prior_price_move"
            )

        elif timing_state == "EXTENDED_BREAKOUT":

            tags.append(
                "activity_detected_after_"
                "price_extension"
            )

        elif timing_state == "ADVANCED_TREND":

            tags.append(
                "activity_detected_in_"
                "advanced_trend"
            )

    participation = technical.get(
        "participation_state"
    )

    if participation == "STRONG_CONFIRMATION":

        tags.append(
            "strong_technical_participation"
        )

    elif participation == "POSITIVE_DIVERGENCE":

        tags.append(
            "positive_volume_price_divergence"
        )

    return tags


def get_institutional_footprint(
    symbol,
    finra_data
):

    symbols = finra_data.get(
        "symbols",
        {}
    )

    if not isinstance(
        symbols,
        dict
    ):

        return {}

    record = symbols.get(
        symbol,
        {}
    )

    if not isinstance(
        record,
        dict
    ):

        return {}

    footprint = record.get(
        "institutional_footprint",
        {}
    )

    if not isinstance(
        footprint,
        dict
    ):

        return {}

    return footprint


def calculate_institutional_factor(
    candidate,
    finra_data
):

    symbol = str(
        candidate.get(
            "symbol",
            ""
        )
    ).strip().upper()


    footprint = get_institutional_footprint(
        symbol,
        finra_data
    )


    technical = get_technical_context(
        candidate
    )


    # Current aggregate FINRA activity must support
    # the cross-venue institutional footprint.

    finra_context = get_finra_context(
        symbol,
        finra_data
    )


    current_finra_percentile = finra_context.get(
        "volume_percentile"
    )


    current_activity_gate_passed = (
        current_finra_percentile is not None
        and
        current_finra_percentile >= 50
    )


    # Block institutional promotion when the existing
    # EdgeBreak timing assessment is unsuitable.

    timing_state = classify_structure_timing(
        technical,
        finra_context
    )


    blocked_timing_states = {
        "CHOPPY_FLAT",
        "POST_MOVE_ACTIVITY",
        "EXTENDED_BREAKOUT",
        "WEAK_STRUCTURE",
        "INSUFFICIENT_FINRA_HISTORY"
    }


    timing_gate_passed = (
        timing_state not in blocked_timing_states
    )


    activity_score = safe_int(
        footprint.get(
            "score"
        ),
        0
    )


    meaningful = bool(
        footprint.get(
            "meaningful_cross_venue_signal",
            False
        )
    )


    strongest_event = footprint.get(
        "strongest_multi_venue_week"
    )


    if not isinstance(
        strongest_event,
        dict
    ):

        strongest_event = {}


    venue_count = safe_int(
        strongest_event.get(
            "unusual_venue_count"
        ),
        0
    )


    alignment_score = 0
    alignment_tags = []


    if (
        technical.get(
            "obv_price_relationship"
        )
        ==
        "confirming_strength"
    ):

        alignment_score += 3

        alignment_tags.append(
            "obv_confirming_strength"
        )


    rising_states = {
        "rising",
        "slightly_rising",
        "strongly_rising"
    }


    if (
        technical.get(
            "obv_trend_20d"
        )
        in
        rising_states
    ):

        alignment_score += 2

        alignment_tags.append(
            "obv_20d_rising"
        )


    if (
        technical.get(
            "obv_trend_60d"
        )
        in
        rising_states
    ):

        alignment_score += 2

        alignment_tags.append(
            "obv_60d_rising"
        )


    if safe_float(
        technical.get(
            "price_change_20d_percent"
        ),
        0
    ) > 0:

        alignment_score += 1

        alignment_tags.append(
            "positive_20d_price_structure"
        )


    if (
        technical.get(
            "participation_state"
        )
        ==
        "STRONG_CONFIRMATION"
    ):

        alignment_score += 2

        alignment_tags.append(
            "strong_participation_confirmation"
        )


    alignment_score = min(
        alignment_score,
        10
    )


    combined_score = min(
        activity_score
        +
        alignment_score,
        100
    )


    boost = 0


    # Institutional boost requires:
    # 1. Meaningful cross-venue activity
    # 2. At least two unusual venues
    # 3. Current FINRA percentile of at least 50
    # 4. Suitable EdgeBreak timing
    # 5. Supporting technical alignment

    if (
        meaningful
        and
        venue_count >= 2
        and
        current_activity_gate_passed
        and
        timing_gate_passed
        and
        alignment_score >= 3
    ):

        if combined_score >= 85:

            boost = 8

        elif combined_score >= 75:

            boost = 5

        elif combined_score >= 65:

            boost = 3

        elif combined_score >= 50:

            boost = 2


    reason_tags = footprint.get(
        "reason_tags",
        []
    )


    if not isinstance(
        reason_tags,
        list
    ):

        reason_tags = []


    return {

        "analyzed":
            bool(
                footprint.get(
                    "analyzed",
                    False
                )
            ),

        "score":
            int(
                round(
                    combined_score
                )
            ),

        "activity_score":
            activity_score,

        "technical_alignment_score":
            alignment_score,

        "boost_points":
            boost,

        "label":
            footprint.get(
                "label",
                "NO_VENUE_DATA"
            ),

        "meaningful_cross_venue_signal":
            meaningful,

        "current_finra_percentile":
            current_finra_percentile,

        "current_activity_gate_passed":
            current_activity_gate_passed,

        "structure_timing_state":
            timing_state,

        "timing_gate_passed":
            timing_gate_passed,

        "latest_finra_week":
            footprint.get(
                "latest_finra_week"
            ),

        "multi_venue_weeks_last_4":
            safe_int(
                footprint.get(
                    "multi_venue_weeks_last_4"
                ),
                0
            ),

        "consecutive_multi_venue_weeks":
            safe_int(
                footprint.get(
                    "consecutive_multi_venue_weeks"
                ),
                0
            ),

        "strongest_multi_venue_week":
            strongest_event
            if strongest_event
            else None,

        "reason_tags":
            list(
                dict.fromkeys(
                    reason_tags
                    +
                    alignment_tags
                )
            ),

        "important_note":
            (
                "This is an institutional-scale activity "
                "inference from delayed FINRA reporting. "
                "It does not prove buying or identify the "
                "underlying investment fund."
            )

    }

# =========================================================
# GET PRESSURE BUILDING EVIDENCE
# =========================================================

def get_pressure_building_evidence(
    symbol,
    finra_data
):

    symbols = finra_data.get(
        "symbols",
        {}
    )

    if not isinstance(
        symbols,
        dict
    ):

        return {}

    record = symbols.get(
        symbol,
        {}
    )

    if not isinstance(
        record,
        dict
    ):

        return {}

    evidence = record.get(
        "pressure_building_evidence",
        {}
    )

    if not isinstance(
        evidence,
        dict
    ):

        return {}

    return evidence


# =========================================================
# CALCULATE PRESSURE BUILDING INDEX
# =========================================================

def calculate_pressure_building_index(
    candidate,
    finra_data
):

    symbol = str(
        candidate.get(
            "symbol",
            ""
        )
    ).strip().upper()

    evidence = get_pressure_building_evidence(
        symbol,
        finra_data
    )

    technical = get_technical_context(
        candidate
    )

    x_factor = candidate.get(
        "x_factor",
        {}
    )

    if not isinstance(
        x_factor,
        dict
    ):

        x_factor = {}

    timing_state = str(
        x_factor.get(
            "structure_timing_state",
            ""
        )
    ).strip().upper()

    blocked_states = {
        "CHOPPY_FLAT",
        "POST_MOVE_ACTIVITY",
        "EXTENDED_BREAKOUT",
        "WEAK_STRUCTURE",
        "INSUFFICIENT_FINRA_HISTORY"
    }

    timing_gate_passed = (
        timing_state not in blocked_states
    )

    current_percentile = safe_float(
        evidence.get(
            "current_finra_percentile"
        ),
        None
    )

    venue_count = safe_int(
        evidence.get(
            "strongest_unusual_venue_count"
        ),
        0
    )

    multi_venue_weeks = safe_int(
        evidence.get(
            "multi_venue_weeks_last_4"
        ),
        0
    )

    consecutive_weeks = safe_int(
        evidence.get(
            "consecutive_multi_venue_weeks"
        ),
        0
    )

    eligible = bool(
        evidence.get(
            "eligible_for_pressure_index",
            False
        )
    )


    # =====================================================
    # CURRENT FINRA PERCENTILE
    # MAXIMUM 20 POINTS
    # =====================================================

    percentile_points = 0

    if current_percentile is not None:

        if current_percentile >= 95:

            percentile_points = 20

        elif current_percentile >= 85:

            percentile_points = 17

        elif current_percentile >= 70:

            percentile_points = 14

        elif current_percentile >= 50:

            percentile_points = 8


    # =====================================================
    # VENUE BREADTH
    # MAXIMUM 15 POINTS
    # =====================================================

    venue_points = 0

    if venue_count >= 4:

        venue_points = 15

    elif venue_count == 3:

        venue_points = 12

    elif venue_count == 2:

        venue_points = 8


    # =====================================================
    # MULTI-VENUE PERSISTENCE
    # MAXIMUM 30 POINTS
    # =====================================================

    persistence_points = 0

    if multi_venue_weeks >= 4:

        persistence_points = 30

    elif multi_venue_weeks == 3:

        persistence_points = 24

    elif multi_venue_weeks == 2:

        persistence_points = 18

    elif multi_venue_weeks == 1:

        persistence_points = 7


    # =====================================================
    # CONSECUTIVE ACTIVITY
    # MAXIMUM 10 POINTS
    # =====================================================

    consecutive_points = 0

    if consecutive_weeks >= 4:

        consecutive_points = 10

    elif consecutive_weeks == 3:

        consecutive_points = 8

    elif consecutive_weeks == 2:

        consecutive_points = 6

    elif consecutive_weeks == 1:

        consecutive_points = 3


    # =====================================================
    # STRUCTURE AND PRICE CONTAINMENT
    # MAXIMUM 15 POINTS
    # =====================================================

    timing_points_by_state = {

        "EARLY_CONSTRUCTIVE":
            12,

        "CONSTRUCTIVE_BASE":
            11,

        "CONSTRUCTIVE_BREAKOUT":
            9,

        "ADVANCED_TREND":
            6

    }

    containment_points = (
        timing_points_by_state.get(
            timing_state,
            0
        )
    )

    distance = safe_float(
        technical.get(
            "distance_from_resistance_percent"
        ),
        None
    )

    if (
        distance is not None
        and
        -3 <= distance <= 8
    ):

        containment_points += 3

    containment_points = min(
        containment_points,
        15
    )


    # =====================================================
    # OBV AND PARTICIPATION ALIGNMENT
    # MAXIMUM 10 POINTS
    # =====================================================

    obv_points = 0
    obv_tags = []

    if (
        technical.get(
            "obv_price_relationship"
        )
        ==
        "confirming_strength"
    ):

        obv_points += 4

        obv_tags.append(
            "obv_confirming_strength"
        )

    rising_states = {
        "rising",
        "slightly_rising",
        "strongly_rising"
    }

    if (
        technical.get(
            "obv_trend_20d"
        )
        in
        rising_states
    ):

        obv_points += 3

        obv_tags.append(
            "obv_20d_rising"
        )

    if (
        technical.get(
            "obv_trend_60d"
        )
        in
        rising_states
    ):

        obv_points += 2

        obv_tags.append(
            "obv_60d_rising"
        )

    if (
        technical.get(
            "participation_state"
        )
        ==
        "STRONG_CONFIRMATION"
    ):

        obv_points += 1

        obv_tags.append(
            "strong_participation_confirmation"
        )

    obv_points = min(
        obv_points,
        10
    )


    # =====================================================
    # COMPLETE PRESSURE BUILDING SCORE
    # =====================================================

    score = min(

        percentile_points
        +
        venue_points
        +
        persistence_points
        +
        consecutive_points
        +
        containment_points
        +
        obv_points,

        100

    )

    evidence_state = str(
        evidence.get(
            "evidence_state",
            "NO_PRESSURE_CONFIRMATION"
        )
    ).strip().upper()


    # =====================================================
    # CONFIRMATION TIER AND BOOST
    # =====================================================

    if (
        eligible
        and
        timing_gate_passed
    ):

        confirmation_tier = (
            "ACTIVE_PRESSURE_BUILD"
        )

        tier_priority = 0

        if score >= 85:

            label = (
                "STRONG_PRESSURE_BUILD"
            )

            boost = PRESSURE_HIGH_BOOST

        elif score >= 75:

            label = (
                "PRESSURE_BUILD_DETECTED"
            )

            boost = PRESSURE_MEDIUM_BOOST

        elif score >= 65:

            label = (
                "EARLY_PRESSURE_BUILD"
            )

            boost = PRESSURE_LOW_BOOST

        else:

            label = (
                "QUALIFIED_PRESSURE_EVIDENCE"
            )

            boost = 0

    elif (
        evidence_state
        ==
        "EARLY_OR_RECENT_VENUE_EVIDENCE"
    ):

        confirmation_tier = (
            "RECENT_PRESSURE_EVIDENCE"
        )

        tier_priority = 1

        label = (
            "RECENT_OR_INCOMPLETE_PRESSURE_EVIDENCE"
        )

        boost = 0

    else:

        confirmation_tier = (
            "UNCONFIRMED"
        )

        tier_priority = 2

        if not timing_gate_passed:

            label = (
                "BLOCKED_BY_STRUCTURE_TIMING"
            )

        else:

            label = (
                "NO_CURRENT_PRESSURE_CONFIRMATION"
            )

        boost = 0


    # =====================================================
    # REASON TAGS
    # =====================================================

    reason_tags = evidence.get(
        "evidence_tags",
        []
    )

    if not isinstance(
        reason_tags,
        list
    ):

        reason_tags = []


    return {

        "analyzed":
            True,

        "top_six_membership_locked":
            True,

        "score":
            int(
                round(
                    score
                )
            ),

        "label":
            label,

        "confirmation_tier":
            confirmation_tier,

        "tier_priority":
            tier_priority,

        "boost_points":
            boost,

        "eligible_from_finra_evidence":
            eligible,

        "timing_gate_passed":
            timing_gate_passed,

        "structure_timing_state":
            timing_state,

        "current_finra_percentile":
            current_percentile,

        "strongest_unusual_venue_count":
            venue_count,

        "multi_venue_weeks_last_4":
            multi_venue_weeks,

        "consecutive_multi_venue_weeks":
            consecutive_weeks,

        "percentile_points":
            percentile_points,

        "venue_breadth_points":
            venue_points,

        "persistence_points":
            persistence_points,

        "consecutive_week_points":
            consecutive_points,

        "price_containment_points":
            containment_points,

        "obv_alignment_points":
            obv_points,

        "reason_tags":
            list(
                dict.fromkeys(
                    reason_tags
                    +
                    obv_tags
                )
            ),

        "important_note":
            (
                "The Pressure Building Index is an "
                "inference from delayed FINRA and "
                "technical data. It does not prove "
                "institutional buying or identify an "
                "investment firm."
            )

    }


# =========================================================
# GET PRICE AT SELECTION
# =========================================================

def get_candidate_price(
    candidate
):

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

            return price

    return None


# =========================================================
# GET US SCAN DATE
# =========================================================

def get_candidate_scan_date(
    candidate
):

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

        for field_name in [
            "scan_date",
            "date",
            "last_updated"
        ]:

            value = section.get(
                field_name
            )

            if value:

                value = str(
                    value
                ).strip()

                if len(value) >= 10:

                    return value[:10]

    ranking = get_ranking(
        candidate
    )

    indicator_date = ranking.get(
        "indicator_date"
    )

    if indicator_date:

        return str(
            indicator_date
        )[:10]

    return datetime.now(
        timezone.utc
    ).date().isoformat()


# =========================================================
# SAVE DAILY TOP-SIX HISTORY
# =========================================================

def save_top_six_history(
    top_six
):

    if not top_six:

        return None

    selection_date = get_candidate_scan_date(
        top_six[0]
    )

    os.makedirs(
        TOP_SIX_HISTORY_DIR,
        exist_ok=True
    )

    daily_filename = os.path.join(
        TOP_SIX_HISTORY_DIR,
        f"{selection_date}_top6.json"
    )

    saved_stocks = []

    for candidate in top_six:

        saved_candidate = deepcopy(
            candidate
        )

        saved_candidate[
            "selection_date"
        ] = selection_date

        saved_candidate[
            "price_at_selection"
        ] = get_candidate_price(
            candidate
        )

        saved_stocks.append(
            saved_candidate
        )

    history_record = {

        "selection_date":
            selection_date,

        "created_at":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "selection_count":
            len(
                saved_stocks
            ),

        "selection_method":
            "EDGEBREAK_LOCKED_TOP6_PRESSURE_BUILDING",

        "important_note":
            (
                "These six candidates were locked before "
                "the Pressure Building Index was calculated. "
                "No outside candidate was allowed to enter "
                "through the PBI stage."
            ),

        "stocks":
            saved_stocks

    }

    save_json_atomic(
        daily_filename,
        history_record
    )


    # =====================================================
    # CUMULATIVE CSV
    # =====================================================

    csv_fields = [

        "Selection Date",
        "Symbol",
        "Price Found",
        "Pre-FINRA Rank",
        "Pre-Pressure Rank",
        "Final Rank",
        "Technical Score",
        "X-Factor Score",
        "X-Factor Boost",
        "Venue Score",
        "Venue Boost",
        "Pressure Building Index",
        "Pressure Label",
        "Pressure Tier",
        "Pressure Boost",
        "Final Score",
        "Structure Timing",
        "FINRA Percentile",
        "Multi-Venue Weeks",
        "Consecutive Multi-Venue Weeks",
        "Strongest Unusual Venue Count"

    ]

    existing_rows = []

    if os.path.exists(
        TOP_SIX_HISTORY_CSV
    ):

        try:

            with open(
                TOP_SIX_HISTORY_CSV,
                "r",
                newline="",
                encoding="utf-8-sig"
            ) as file:

                existing_rows = [

                    row

                    for row
                    in csv.DictReader(
                        file
                    )

                    if (
                        row.get(
                            "Selection Date"
                        )
                        !=
                        selection_date
                    )

                ]

        except Exception:

            existing_rows = []

    new_rows = []

    for candidate in top_six:

        x_factor = candidate.get(
            "x_factor",
            {}
        )

        institutional = candidate.get(
            "institutional_footprint",
            {}
        )

        pressure = candidate.get(
            "pressure_building_index",
            {}
        )

        new_rows.append({

            "Selection Date":
                selection_date,

            "Symbol":
                candidate.get(
                    "symbol"
                ),

            "Price Found":
                get_candidate_price(
                    candidate
                ),

            "Pre-FINRA Rank":
                candidate.get(
                    "pre_finra_rank"
                ),

            "Pre-Pressure Rank":
                candidate.get(
                    "pre_pressure_rank"
                ),

            "Final Rank":
                candidate.get(
                    "final_daily_brief_rank"
                ),

            "Technical Score":
                candidate.get(
                    "pre_finra_score"
                ),

            "X-Factor Score":
                x_factor.get(
                    "score"
                ),

            "X-Factor Boost":
                x_factor.get(
                    "boost_points"
                ),

            "Venue Score":
                institutional.get(
                    "score"
                ),

            "Venue Boost":
                institutional.get(
                    "boost_points"
                ),

            "Pressure Building Index":
                pressure.get(
                    "score"
                ),

            "Pressure Label":
                pressure.get(
                    "label"
                ),

            "Pressure Tier":
                pressure.get(
                    "confirmation_tier"
                ),

            "Pressure Boost":
                pressure.get(
                    "boost_points"
                ),

            "Final Score":
                candidate.get(
                    "final_daily_brief_score"
                ),

            "Structure Timing":
                pressure.get(
                    "structure_timing_state"
                ),

            "FINRA Percentile":
                pressure.get(
                    "current_finra_percentile"
                ),

            "Multi-Venue Weeks":
                pressure.get(
                    "multi_venue_weeks_last_4"
                ),

            "Consecutive Multi-Venue Weeks":
                pressure.get(
                    "consecutive_multi_venue_weeks"
                ),

            "Strongest Unusual Venue Count":
                pressure.get(
                    "strongest_unusual_venue_count"
                )

        })

    with open(
        TOP_SIX_HISTORY_CSV,
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=csv_fields
        )

        writer.writeheader()

        writer.writerows(
            existing_rows
            +
            new_rows
        )

    return daily_filename


def calculate_x_factor(
    candidate,
    finra_data
):

    symbol = str(
        candidate.get(
            "symbol",
            ""
        )
    ).strip().upper()

    technical = get_technical_context(
        candidate
    )

    finra = get_finra_context(
        symbol,
        finra_data
    )

    activity_score = (
        calculate_activity_score(
            finra
        )
    )

    structure_score = (
        calculate_structure_score(
            technical
        )
    )

    timing_state = (
        classify_structure_timing(
            technical,
            finra
        )
    )

    alignment_score = (
        calculate_alignment_score(
            technical,
            finra,
            timing_state
        )
    )

    raw_score = (
        activity_score
        +
        structure_score
        +
        alignment_score
    )

    if not has_meaningful_activity_signal(
        finra
    ):

        raw_score = min(
            raw_score,
            49
        )

    final_score = apply_x_factor_cap(
        raw_score,
        timing_state
    )

    label = get_x_factor_label(
        final_score,
        finra,
        timing_state
    )

    boost = calculate_boost(
        final_score,
        label,
        timing_state
    )

    reason_tags = build_reason_tags(
        technical,
        finra,
        timing_state
    )

    return {

        "score":
            int(
                round(
                    final_score
                )
            ),

        "label":
            label,

        "boost_points":
            boost,

        "activity_score":
            activity_score,

        "structure_score":
            structure_score,

        "alignment_score":
            alignment_score,

        "structure_timing_state":
            timing_state,

        "meaningful_activity_signal":
            has_meaningful_activity_signal(
                finra
            ),

        "finra_weeks_available":
            finra.get(
                "weeks_available"
            ),

        "finra_latest_week":
            finra.get(
                "latest_week"
            ),

        "finra_data_age_days":
            calculate_data_age_days(
                finra.get(
                    "latest_week"
                )
            ),

        "finra_activity_state":
            finra.get(
                "current_activity_state"
            ),

        "finra_volume_percentile":
            finra.get(
                "volume_percentile"
            ),

        "finra_latest_vs_prior_4_week_percent":
            finra.get(
                "latest_vs_4_week"
            ),

        "finra_latest_vs_prior_12_week_percent":
            finra.get(
                "latest_vs_12_week"
            ),

        "finra_latest_vs_prior_26_week_percent":
            finra.get(
                "latest_vs_26_week"
            ),

        "finra_latest_4_week_activity_index":
            finra.get(
                "latest_block_activity_index"
            ),

        "finra_latest_4_week_z_score":
            finra.get(
                "latest_block_z_score"
            ),

        "finra_yearly_activity_pattern":
            finra.get(
                "yearly_activity_pattern"
            ),

        "reason_tags":
            reason_tags,

        "important_note":
            (
                "Off-exchange activity measures "
                "trading activity only and does not "
                "indicate buying or selling direction."
            )
    }


def assign_final_ranks(candidates):

    previous_score = None
    current_rank = 0

    for position, candidate in enumerate(
        candidates,
        start=1
    ):

        final_score = safe_float(
            candidate.get(
                "final_daily_brief_score"
            ),
            0
        )

        if (
            previous_score is None
            or
            final_score != previous_score
        ):

            current_rank = position

        candidate[
            "final_daily_brief_rank"
        ] = current_rank

        candidate[
            "daily_brief_rank"
        ] = current_rank

        previous_score = final_score


def main():

    print()
    print(
        "=" * 70
    )
    print(
        "EDGEBREAK FINRA X-FACTOR RERANK"
    )
    print(
        "=" * 70
    )
    print()

    candidates = load_json(
        CANDIDATES_FILE
    )

    if not isinstance(
        candidates,
        list
    ):

        raise RuntimeError(
            f"{CANDIDATES_FILE} must "
            "contain a JSON array."
        )

    finra_data = load_json(
        FINRA_FILE
    )

    if not isinstance(
        finra_data,
        dict
    ):

        raise RuntimeError(
            f"{FINRA_FILE} must "
            "contain a JSON object."
        )

    original_candidates = deepcopy(
        candidates
    )

    save_json_atomic(
        BACKUP_FILE,
        original_candidates
    )

    processed = []


    # =====================================================
    # EXISTING X-FACTOR AND INSTITUTIONAL RERANK
    # =====================================================

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

        if not symbol:

            continue

        original_rank = get_original_rank(
            candidate,
            fallback_rank
        )

        original_score = get_original_score(
            candidate
        )

        x_factor = calculate_x_factor(
            candidate,
            finra_data
        )

        x_factor_boost = safe_float(
            x_factor.get(
                "boost_points"
            ),
            0
        )

        institutional_footprint = (
            calculate_institutional_factor(
                candidate,
                finra_data
            )
        )

        institutional_boost = safe_float(
            institutional_footprint.get(
                "boost_points"
            ),
            0
        )

        final_score = (
            original_score
            +
            x_factor_boost
            +
            institutional_boost
        )

        candidate[
            "pre_finra_rank"
        ] = original_rank

        candidate[
            "pre_finra_score"
        ] = original_score

        candidate[
            "x_factor"
        ] = x_factor

        candidate[
            "institutional_footprint"
        ] = institutional_footprint

        candidate[
            "final_daily_brief_score"
        ] = final_score

        ranking = get_ranking(
            candidate
        )

        ranking[
            "pre_finra_total_score"
        ] = original_score

        ranking[
            "x_factor_boost"
        ] = x_factor_boost

        ranking[
            "institutional_footprint_boost"
        ] = institutional_boost

        ranking[
            "final_score"
        ] = final_score

        candidate[
            "daily_brief_ranking"
        ] = ranking

        processed.append(
            candidate
        )


    # =====================================================
    # COMPLETE THE EXISTING RERANK FIRST
    # =====================================================

    processed.sort(
        key=lambda candidate: (

            -safe_float(
                candidate.get(
                    "final_daily_brief_score"
                ),
                0
            ),

            safe_int(
                candidate.get(
                    "pre_finra_rank"
                ),
                999
            ),

            str(
                candidate.get(
                    "symbol",
                    ""
                )
            )

        )
    )

    assign_final_ranks(
        processed
    )


    # =====================================================
    # SAVE PRE-PRESSURE ORDER
    # =====================================================

    for position, candidate in enumerate(
        processed,
        start=1
    ):

        candidate[
            "pre_pressure_rank"
        ] = position

        candidate[
            "pre_pressure_score"
        ] = safe_float(
            candidate.get(
                "final_daily_brief_score"
            ),
            0
        )


    # =====================================================
    # LOCK THE TOP SIX
    # =====================================================
    #
    # Candidates outside this list cannot enter through PBI.
    # =====================================================

    locked_top_six = processed[
        :TOP_SIX_COUNT
    ]

    remaining_candidates = processed[
        TOP_SIX_COUNT:
    ]


    # =====================================================
    # CALCULATE PBI FOR THE LOCKED SIX ONLY
    # =====================================================

    for candidate in locked_top_six:

        pressure_index = (
            calculate_pressure_building_index(
                candidate,
                finra_data
            )
        )

        pressure_boost = safe_float(
            pressure_index.get(
                "boost_points"
            ),
            0
        )

        pressure_adjusted_score = (

            safe_float(
                candidate.get(
                    "pre_pressure_score"
                ),
                0
            )

            +

            pressure_boost

        )

        candidate[
            "pressure_building_index"
        ] = pressure_index

        candidate[
            "final_daily_brief_score"
        ] = pressure_adjusted_score

        ranking = get_ranking(
            candidate
        )

        ranking[
            "pre_pressure_score"
        ] = candidate.get(
            "pre_pressure_score"
        )

        ranking[
            "pressure_building_index"
        ] = pressure_index.get(
            "score"
        )

        ranking[
            "pressure_building_boost"
        ] = pressure_boost

        ranking[
            "final_score"
        ] = pressure_adjusted_score

        candidate[
            "daily_brief_ranking"
        ] = ranking


    # =====================================================
    # MARK ALL OTHER CANDIDATES AS NOT ANALYSED
    # =====================================================

    for candidate in remaining_candidates:

        candidate[
            "pressure_building_index"
        ] = {

            "analyzed":
                False,

            "top_six_membership_locked":
                False,

            "score":
                None,

            "label":
                "NOT_ANALYZED_OUTSIDE_LOCKED_TOP_SIX",

            "confirmation_tier":
                "NOT_ANALYZED",

            "tier_priority":
                3,

            "boost_points":
                0,

            "important_note":
                (
                    "The Pressure Building Index is "
                    "restricted to the six candidates "
                    "selected by the existing FINRA and "
                    "institutional reranking stage."
                )

        }


    # =====================================================
    # REORDER ONLY THE SAME LOCKED SIX
    # =====================================================

    locked_top_six.sort(
        key=lambda candidate: (

            safe_int(
                candidate.get(
                    "pressure_building_index",
                    {}
                ).get(
                    "tier_priority"
                ),
                3
            ),

            -safe_float(
                candidate.get(
                    "final_daily_brief_score"
                ),
                0
            ),

            safe_int(
                candidate.get(
                    "pre_pressure_rank"
                ),
                999
            ),

            str(
                candidate.get(
                    "symbol",
                    ""
                )
            )

        )
    )


    # =====================================================
    # REASSEMBLE WITHOUT ALLOWING OUTSIDE ENTRY
    # =====================================================

    processed = (
        locked_top_six
        +
        remaining_candidates
    )

    assign_final_ranks(
        processed
    )


    # =====================================================
    # SAVE WEBSITE DATA
    # =====================================================

    save_json_atomic(
        CANDIDATES_FILE,
        processed
    )


    # =====================================================
    # SAVE PERMANENT DAILY TOP-SIX HISTORY
    # =====================================================

    daily_history_file = (
        save_top_six_history(
            locked_top_six
        )
    )


    # =====================================================
    # FINAL REPORT
    # =====================================================

    print(
        "ORIGINAL → FINAL"
    )

    print(
        "-" * 135
    )

    for candidate in processed:

        symbol = candidate.get(
            "symbol"
        )

        old_rank = candidate.get(
            "pre_finra_rank"
        )

        new_rank = candidate.get(
            "final_daily_brief_rank"
        )

        original_score = candidate.get(
            "pre_finra_score"
        )

        final_score = candidate.get(
            "final_daily_brief_score"
        )

        x_factor = candidate.get(
            "x_factor",
            {}
        )

        x_score = x_factor.get(
            "score",
            0
        )

        x_label = x_factor.get(
            "label",
            ""
        )

        x_boost = x_factor.get(
            "boost_points",
            0
        )

        institutional = candidate.get(
            "institutional_footprint",
            {}
        )

        institutional_score = institutional.get(
            "score",
            0
        )

        institutional_boost = institutional.get(
            "boost_points",
            0
        )

        pressure = candidate.get(
            "pressure_building_index",
            {}
        )

        pressure_score = pressure.get(
            "score"
        )

        pressure_boost = pressure.get(
            "boost_points",
            0
        )

        timing = x_factor.get(
            "structure_timing_state",
            ""
        )

        activity = x_factor.get(
            "finra_activity_state",
            ""
        )

        percentile = x_factor.get(
            "finra_volume_percentile"
        )

        print(
            f"#{old_rank:<2} → "
            f"#{new_rank:<2} "
            f"{symbol:<6} | "
            f"Tech {original_score:>5.1f} | "
            f"X {x_score:>3} "
            f"{x_label:<18} | "
            f"X +{x_boost:<2} | "
            f"Venue {institutional_score:>3} "
            f"+{institutional_boost:<2} | "
            f"PBI {str(pressure_score):>4} "
            f"+{pressure_boost:<2} | "
            f"Final {final_score:>5.1f} | "
            f"{timing:<24} | "
            f"FINRA {activity} "
            f"{percentile}"
        )

    print()
    print(
        "=" * 70
    )
    print(
        "X-FACTOR + INSTITUTIONAL RERANK COMPLETE"
    )
    print(
        "=" * 70
    )
    print()

    print(
        f"Original shortlist backup: "
        f"{BACKUP_FILE}"
    )

    print(
        f"Final reranked shortlist: "
        f"{CANDIDATES_FILE}"
    )

    print(
        f"Daily top-six snapshot: "
        f"{daily_history_file}"
    )

    print(
        f"Top-six cumulative history: "
        f"{TOP_SIX_HISTORY_CSV}"
    )

    print(
        "Scanner source files unchanged."
    )

    print(
        "Existing website data filename unchanged."
    )

    print(
        "FINRA and institutional analysis only "
        "promoted existing survivors."
    )

    print(
        "Pressure Building Index analyzed only "
        "the locked top six; no outside candidate "
        "could enter."
    )

    print()


if __name__ == "__main__":

    main()