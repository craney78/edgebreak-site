import json
import os
import tempfile
from copy import deepcopy
from datetime import datetime, timezone


# ============================================================
# EDGEBREAK FINRA X-FACTOR RERANKER
# ============================================================
#
# PURPOSE
#
# This file runs AFTER:
#
#     scanners
#         ↓
#     Daily Brief hard culls
#         ↓
#     technical / indicator / persistence ranking
#         ↓
#     daily_brief_candidates.json
#         ↓
#     FINRA history builder
#         ↓
#     finra_off_exchange_history.json
#
# THEN:
#
#     this file
#         ↓
#     X-Factor assessment
#         ↓
#     modest post-ranking rerank
#         ↓
#     daily_brief_candidates.json
#
#
# LOCKED EDGEBREAK RULE
#
# FINRA CAN PROMOTE.
#
# FINRA CANNOT RESCUE.
#
# A stock must already have survived the normal EdgeBreak
# pipeline before this file ever sees it.
#
#
# X-FACTOR IDEA
#
# Unusual off-exchange activity is most interesting when it
# occurs around useful price structure:
#
#     mature bases
#     higher lows
#     constructive resistance structure
#     early structural transitions
#
# It is less useful when:
#
#     chart is choppy / directionless
#     major event gap already happened
#     stock is already heavily extended
#     FINRA history is insufficient
#
#
# IMPORTANT
#
# FINRA off-exchange activity measures ACTIVITY only.
#
# It does NOT indicate:
#
#     buying
#     selling
#     accumulation
#     distribution
#
# This is NOT a trading signal.
#
# ============================================================


# ============================================================
# FILES
# ============================================================

CANDIDATES_FILE = (
    "daily_brief_candidates.json"
)

FINRA_FILE = (
    "finra_off_exchange_history.json"
)

BACKUP_FILE = (
    "daily_brief_candidates_pre_finra.json"
)


# ============================================================
# FINRA HISTORY REQUIREMENT
# ============================================================
#
# Full 48 weeks is preferred.
#
# For V1 we require at least 24 reported weeks before FINRA
# is allowed to alter ranking.
#
# This prevents very young histories such as FTH from being
# treated as if they have a genuine 12-month baseline.
#
# ============================================================

MIN_FINRA_WEEKS_FOR_BOOST = 24


# ============================================================
# X-FACTOR BOOSTS
# ============================================================
#
# These are deliberately SMALL.
#
# Existing EdgeBreak technical ranking remains dominant.
#
# ============================================================

EXCEPTIONAL_BOOST = 15

HIGH_BOOST = 8

ELEVATED_BOOST = 5

MILD_BOOST = 2


# ============================================================
# HELPERS
# ============================================================

def safe_float(
    value,
    default=None
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


def load_json(
    filename
):

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

            f"Could not read "
            f"{filename}: "
            f"{error}"

        ) from error


def save_json_atomic(
    filename,
    data
):

    directory = (
        os.path.dirname(
            os.path.abspath(
                filename
            )
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


        temp_name = (
            temp_file.name
        )


    os.replace(
        temp_name,
        filename
    )


# ============================================================
# GET EXISTING EDGEBREAK RANKING
# ============================================================

def get_ranking(
    candidate
):

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


# ============================================================
# GET ORIGINAL TECHNICAL SCORE
# ============================================================

def get_original_score(
    candidate
):

    ranking = get_ranking(
        candidate
    )


    return safe_float(

        ranking.get(
            "total_score"
        ),

        0

    )


# ============================================================
# GET ORIGINAL RANK
# ============================================================
#
# Makes this script safe to run twice.
#
# If the file has already been reranked, we continue using the
# preserved PRE-FINRA rank rather than treating the reranked
# position as the original rank.
#
# ============================================================

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


# ============================================================
# CURRENT SCANNER TYPE
# ============================================================

def get_scanner_type(
    candidate
):

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

            str(
                value
            ).strip().upper()

            for value in scanners

        ]


        if "BREAKOUT" in scanners:

            return "BREAKOUT"


        if "PRE_BREAKOUT" in scanners:

            return "PRE_BREAKOUT"


    return "UNKNOWN"


# ============================================================
# GET TECHNICAL CONTEXT
# ============================================================

def get_technical_context(
    candidate
):

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


# ============================================================
# FINRA CONTEXT
# ============================================================

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

        latest_block = blocks[
            -1
        ]


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


# ============================================================
# FINRA DATA AGE
# ============================================================

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


    except:

        return None


# ============================================================
# ACTIVITY SIGNAL CHECK
# ============================================================

def has_meaningful_activity_signal(
    finra
):

    if (
        not finra.get(
            "available"
        )
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


# ============================================================
# ACTIVITY SCORE
# ============================================================
#
# Maximum:
#
#     40 points
#
# ============================================================

def calculate_activity_score(
    finra
):

    if not finra.get(
        "available"
    ):

        return 0


    score = 0


    # --------------------------------------------------------
    # CURRENT STATE
    # --------------------------------------------------------

    state = finra.get(
        "current_activity_state"
    )


    if state == "VERY_ELEVATED":

        score += 16


    elif state == "ELEVATED":

        score += 10


    # --------------------------------------------------------
    # PERCENTILE
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # LATEST WEEK VS PRIOR 12 WEEKS
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # LATEST 4-WEEK BLOCK
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # BLOCK Z-SCORE
    # --------------------------------------------------------

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


# ============================================================
# STRUCTURE SCORE
# ============================================================
#
# Maximum:
#
#     40 points
#
# This does NOT replace the existing EdgeBreak structure score.
#
# It converts the already-calculated EdgeBreak information into
# an X-Factor structure component.
#
# ============================================================

def calculate_structure_score(
    technical
):

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


    # --------------------------------------------------------
    # HIGHER LOWS
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # RESISTANCE TOUCHES
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # POSITION RELATIVE TO RESISTANCE
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # PARTICIPATION
    # --------------------------------------------------------

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


# ============================================================
# STRUCTURE / TIMING CLASSIFICATION
# ============================================================

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
        weeks < MIN_FINRA_WEEKS_FOR_BOOST
    ):

        return (
            "INSUFFICIENT_FINRA_HISTORY"
        )


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


    # --------------------------------------------------------
    # EXTENDED BREAKOUT
    # --------------------------------------------------------
    #
    # Activity arriving after a stock is already materially
    # through resistance is less useful for early discovery.
    #
    # --------------------------------------------------------

    if scanner_type == "BREAKOUT":

        if (
            distance is not None
            and
            distance >= 8
        ):

            return (
                "EXTENDED_BREAKOUT"
            )


        if (
            price_5d is not None
            and
            price_5d >= 15
        ):

            return (
                "EXTENDED_BREAKOUT"
            )


    # --------------------------------------------------------
    # POST-MOVE / EVENT-LIKE STRUCTURE
    # --------------------------------------------------------
    #
    # Example behaviour:
    #
    # large 60-day move
    # but recent 20-day price is flat
    # and participation is no longer strong
    #
    # This is designed to stop a SAFT-style situation from
    # receiving a giant X-Factor simply because FINRA exploded.
    #
    # --------------------------------------------------------

    if (
        price_60d is not None
        and
        price_60d >= 35

        and

        price_20d is not None
        and
        abs(
            price_20d
        ) <= 5

        and

        participation
        not in {

            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"

        }
    ):

        return (
            "POST_MOVE_ACTIVITY"
        )


    # --------------------------------------------------------
    # CHOPPY / FLAT STRUCTURE
    # --------------------------------------------------------
    #
    # Designed to catch the STRA-style pattern:
    #
    # high activity
    # but very little 20d / 60d directional progress
    # and no strong participation confirmation.
    #
    # --------------------------------------------------------

    if (
        price_20d is not None
        and
        abs(
            price_20d
        ) <= 3

        and

        price_60d is not None
        and
        abs(
            price_60d
        ) <= 8

        and

        participation
        not in {

            "STRONG_CONFIRMATION",
            "POSITIVE_DIVERGENCE"

        }
    ):

        return (
            "CHOPPY_FLAT"
        )


    # --------------------------------------------------------
    # ADVANCED TREND
    # --------------------------------------------------------
    #
    # Still useful information, but activity appearing after a
    # very large 60-day advance is less valuable as an EARLY
    # X-Factor.
    #
    # KNSA is the type of case this protects against.
    #
    # --------------------------------------------------------

    if (
        price_60d is not None
        and
        price_60d >= 55
    ):

        return (
            "ADVANCED_TREND"
        )


    # --------------------------------------------------------
    # EARLY CONSTRUCTIVE STRUCTURE
    # --------------------------------------------------------

    if (
        scanner_type == "PRE_BREAKOUT"

        and

        distance is not None
        and
        abs(
            distance
        ) <= 3.5

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
            abs(
                price_5d
            ) <= 10
        )
    ):

        return (
            "EARLY_CONSTRUCTIVE"
        )


    # --------------------------------------------------------
    # CONSTRUCTIVE BASE
    # --------------------------------------------------------

    if (
        scanner_type == "PRE_BREAKOUT"

        and

        distance is not None
        and
        abs(
            distance
        ) <= 5

        and

        higher_lows >= 3

        and

        structural_score >= 60
    ):

        return (
            "CONSTRUCTIVE_BASE"
        )


    # --------------------------------------------------------
    # CONSTRUCTIVE BREAKOUT
    # --------------------------------------------------------

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

        return (
            "CONSTRUCTIVE_BREAKOUT"
        )


    # --------------------------------------------------------
    # WEAK STRUCTURE
    # --------------------------------------------------------

    if (
        structural_score < 60
        or
        higher_lows < 2
    ):

        return (
            "WEAK_STRUCTURE"
        )


    return (
        "MIXED_STRUCTURE"
    )


# ============================================================
# ALIGNMENT SCORE
# ============================================================
#
# Maximum:
#
#     20 points
#
# No alignment points are awarded unless a meaningful FINRA
# activity signal exists.
#
# ============================================================

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


    # --------------------------------------------------------
    # STRUCTURE / ACTIVITY ALIGNMENT
    # --------------------------------------------------------

    if timing_state == "EARLY_CONSTRUCTIVE":

        score += 12


    elif timing_state == "CONSTRUCTIVE_BASE":

        score += 9


    elif timing_state == "CONSTRUCTIVE_BREAKOUT":

        score += 7


    elif timing_state == "MIXED_STRUCTURE":

        score += 3


    # --------------------------------------------------------
    # OBV CONTEXT
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # CURRENT FINRA STRENGTH
    # --------------------------------------------------------

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


# ============================================================
# APPLY STRUCTURE / TIMING CAPS
# ============================================================

def apply_x_factor_cap(
    raw_score,
    timing_state
):

    # --------------------------------------------------------
    # INSUFFICIENT HISTORY
    # --------------------------------------------------------

    if timing_state == "INSUFFICIENT_FINRA_HISTORY":

        return min(
            raw_score,
            49
        )


    # --------------------------------------------------------
    # CHOP / POST-MOVE / ALREADY EXTENDED
    # --------------------------------------------------------
    #
    # These are deliberately capped BELOW the first boost band.
    #
    # Huge FINRA activity therefore cannot automatically move
    # these stocks up the list.
    #
    # --------------------------------------------------------

    if timing_state in {

        "CHOPPY_FLAT",
        "POST_MOVE_ACTIVITY",
        "EXTENDED_BREAKOUT"

    }:

        return min(
            raw_score,
            54
        )


    # --------------------------------------------------------
    # ADVANCED TREND
    # --------------------------------------------------------
    #
    # Can still register an X-Factor, but only receives a very
    # small reranking opportunity.
    #
    # --------------------------------------------------------

    if timing_state == "ADVANCED_TREND":

        return min(
            raw_score,
            64
        )


    # --------------------------------------------------------
    # WEAK STRUCTURE
    # --------------------------------------------------------

    if timing_state == "WEAK_STRUCTURE":

        return min(
            raw_score,
            54
        )


    return min(
        raw_score,
        100
    )


# ============================================================
# X-FACTOR LABEL
# ============================================================

def get_x_factor_label(
    score,
    finra,
    timing_state
):

    if timing_state == "INSUFFICIENT_FINRA_HISTORY":

        return (
            "INSUFFICIENT_DATA"
        )


    if not has_meaningful_activity_signal(
        finra
    ):

        return (
            "NO_CURRENT_X_FACTOR"
        )


    if score >= 85:

        return (
            "EXCEPTIONAL"
        )


    if score >= 75:

        return (
            "HIGH"
        )


    if score >= 65:

        return (
            "ELEVATED"
        )


    if score >= 55:

        return (
            "MILD"
        )


    return (
        "LIMITED"
    )


# ============================================================
# X-FACTOR BOOST
# ============================================================

def calculate_boost(
    x_factor_score,
    x_factor_label,
    timing_state
):

    # --------------------------------------------------------
    # NEVER BOOST THESE STATES
    # --------------------------------------------------------

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

        return (
            EXCEPTIONAL_BOOST
        )


    if x_factor_score >= 75:

        return (
            HIGH_BOOST
        )


    if x_factor_score >= 65:

        return (
            ELEVATED_BOOST
        )


    if x_factor_score >= 55:

        return (
            MILD_BOOST
        )


    return 0


# ============================================================
# BUILD USER / GEMINI REASON TAGS
# ============================================================

def build_reason_tags(
    technical,
    finra,
    timing_state
):

    tags = []


    # --------------------------------------------------------
    # CURRENT FINRA ACTIVITY
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # HISTORICAL PERCENTILE
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # 4-WEEK ACTIVITY
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # ACTIVITY + STRUCTURE ALIGNMENT
    # --------------------------------------------------------
    #
    # IMPORTANT:
    #
    # Only describe activity as aligned with structure when
    # there is actually a meaningful FINRA activity signal.
    #
    # This prevents Gemini from interpreting good structure
    # alone as evidence of unusual off-exchange activity.
    #
    # --------------------------------------------------------

    meaningful_activity = (
        has_meaningful_activity_signal(
            finra
        )
    )


    if meaningful_activity:

        if timing_state == "EARLY_CONSTRUCTIVE":

            tags.append(
                "activity_aligned_with_early_constructive_structure"
            )


        elif timing_state == "CONSTRUCTIVE_BASE":

            tags.append(
                "activity_aligned_with_constructive_base"
            )


        elif timing_state == "CONSTRUCTIVE_BREAKOUT":

            tags.append(
                "activity_aligned_with_constructive_breakout"
            )


        elif timing_state == "CHOPPY_FLAT":

            tags.append(
                "activity_occurring_in_choppy_flat_structure"
            )


        elif timing_state == "POST_MOVE_ACTIVITY":

            tags.append(
                "activity_detected_after_large_prior_price_move"
            )


        elif timing_state == "EXTENDED_BREAKOUT":

            tags.append(
                "activity_detected_after_price_extension"
            )


        elif timing_state == "ADVANCED_TREND":

            tags.append(
                "activity_detected_in_advanced_trend"
            )


    # --------------------------------------------------------
    # TECHNICAL PARTICIPATION
    # --------------------------------------------------------

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


    


# ============================================================
# CALCULATE COMPLETE X-FACTOR
# ============================================================

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


    # --------------------------------------------------------
    # IF FINRA IS NOT CURRENTLY INTERESTING,
    # X-FACTOR CANNOT BECOME HIGH FROM STRUCTURE ALONE.
    # --------------------------------------------------------

    if not has_meaningful_activity_signal(
        finra
    ):

        raw_score = min(
            raw_score,
            49
        )


    final_score = (
        apply_x_factor_cap(
            raw_score,
            timing_state
        )
    )


    label = (
        get_x_factor_label(
            final_score,
            finra,
            timing_state
        )
    )


    boost = (
        calculate_boost(
            final_score,
            label,
            timing_state
        )
    )


    reason_tags = (
        build_reason_tags(
            technical,
            finra,
            timing_state
        )
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
                "Off-exchange activity measures trading "
                "activity only and does not indicate "
                "buying or selling direction."
            )

    }


# ============================================================
# ASSIGN FINAL RANKS
# ============================================================
#
# Competition ranking:
#
#     1
#     1
#     3
#     4
#
# Same style as the existing Daily Brief.
#
# ============================================================

def assign_final_ranks(
    candidates
):

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

            current_rank = (
                position
            )


        candidate[
            "final_daily_brief_rank"
        ] = current_rank


        # ----------------------------------------------------
        # EXISTING SITE CAN KEEP USING daily_brief_rank
        # ----------------------------------------------------
        #
        # We update the existing rank field so the site /
        # Gemini pipeline does not need a new filename or a new
        # front-end data source.
        #
        # ----------------------------------------------------

        candidate[
            "daily_brief_rank"
        ] = current_rank


        previous_score = (
            final_score
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print()

    print(
        "==================================="
    )

    print(
        "EDGEBREAK FINRA X-FACTOR RERANK"
    )

    print(
        "==================================="
    )

    print()


    # --------------------------------------------------------
    # LOAD CURRENT ALREADY-RANKED SHORTLIST
    # --------------------------------------------------------

    candidates = load_json(
        CANDIDATES_FILE
    )


    if not isinstance(
        candidates,
        list
    ):

        raise RuntimeError(

            f"{CANDIDATES_FILE} "
            "must contain a JSON array."

        )


    # --------------------------------------------------------
    # LOAD FINRA OUTPUT
    # --------------------------------------------------------

    finra_data = load_json(
        FINRA_FILE
    )


    if not isinstance(
        finra_data,
        dict
    ):

        raise RuntimeError(

            f"{FINRA_FILE} "
            "must contain a JSON object."

        )


    # --------------------------------------------------------
    # SAVE PRE-FINRA BACKUP
    # --------------------------------------------------------

    original_candidates = (
        deepcopy(
            candidates
        )
    )


    save_json_atomic(

        BACKUP_FILE,

        original_candidates

    )


    # --------------------------------------------------------
    # CALCULATE X-FACTOR FOR EVERY SURVIVING STOCK
    # --------------------------------------------------------

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


        original_rank = (
            get_original_rank(
                candidate,
                fallback_rank
            )
        )


        original_score = (
            get_original_score(
                candidate
            )
        )


        x_factor = (
            calculate_x_factor(
                candidate,
                finra_data
            )
        )


        boost = safe_float(

            x_factor.get(
                "boost_points"
            ),

            0

        )


        final_score = (

            original_score
            +
            boost

        )


        # ----------------------------------------------------
        # PRESERVE ORIGINAL EDGEBREAK RANK
        # ----------------------------------------------------

        candidate[
            "pre_finra_rank"
        ] = original_rank


        candidate[
            "pre_finra_score"
        ] = original_score


        # ----------------------------------------------------
        # ADD X-FACTOR
        # ----------------------------------------------------

        candidate[
            "x_factor"
        ] = x_factor


        candidate[
            "final_daily_brief_score"
        ] = final_score


        # ----------------------------------------------------
        # ADDITIVE FIELDS INSIDE EXISTING RANKING OBJECT
        # ----------------------------------------------------

        ranking = get_ranking(
            candidate
        )


        ranking[
            "pre_finra_total_score"
        ] = original_score


        ranking[
            "x_factor_boost"
        ] = boost


        ranking[
            "final_score"
        ] = final_score


        candidate[
            "daily_brief_ranking"
        ] = ranking


        processed.append(
            candidate
        )


    # --------------------------------------------------------
    # FINAL SORT
    # --------------------------------------------------------
    #
    # Primary:
    #
    #     original technical score + X-Factor boost
    #
    # Tie:
    #
    #     preserve original EdgeBreak rank
    #
    # Therefore FINRA only changes order when it genuinely
    # earns enough boost to do so.
    #
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # ASSIGN FINAL RANKS
    # --------------------------------------------------------

    assign_final_ranks(
        processed
    )


    # --------------------------------------------------------
    # SAVE BACK TO SAME DAILY BRIEF FILE
    # --------------------------------------------------------
    #
    # IMPORTANT:
    #
    # Same filename.
    #
    # Existing site / Gemini pipeline can continue reading:
    #
    #     daily_brief_candidates.json
    #
    # No scanner input file is changed.
    #
    # --------------------------------------------------------

    save_json_atomic(

        CANDIDATES_FILE,

        processed

    )


    # --------------------------------------------------------
    # PRINT RESULTS
    # --------------------------------------------------------

    print(
        "ORIGINAL → FINAL"
    )

    print(
        "-----------------------------------"
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
            "score"
        )


        x_label = x_factor.get(
            "label"
        )


        boost = x_factor.get(
            "boost_points"
        )


        timing = x_factor.get(
            "structure_timing_state"
        )


        activity = x_factor.get(
            "finra_activity_state"
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

            f"+{boost:<2} | "

            f"Final {final_score:>5.1f} | "

            f"{timing:<24} | "

            f"FINRA {activity} "
            f"{percentile}"

        )


    print()

    print(
        "==================================="
    )

    print(
        "X-FACTOR RERANK COMPLETE"
    )

    print(
        "==================================="
    )

    print()


    print(

        f"✅ Original shortlist backup: "
        f"{BACKUP_FILE}"

    )


    print(

        f"✅ Final reranked shortlist: "
        f"{CANDIDATES_FILE}"

    )


    print(
        "✅ Scanner source files unchanged."
    )


    print(
        "✅ Existing website data filename unchanged."
    )


    print(
        "✅ FINRA only promoted existing survivors."
    )


    print()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()