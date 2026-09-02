# ============================================================
# EDGEBREAK DAILY BRIEF CULL
# ============================================================
#
# Full replacement based on current 2026-09-02 version.
#
# Adds:
# - indicator/participation ranking
# - preferred/special security profile exclusion
# - scanner persistence intelligence
#
# Scanner persistence:
# - counts appearances across actual saved scan sessions
# - weekends/holidays do not break streaks
# - never hard-culls
# - max +3 ranking points
# - automatically becomes more informative as history grows
#
# ============================================================

import json
import os
import time
import requests


# ============================================================
# TWELVE DATA
# ============================================================

API_KEY = os.getenv(
    "TWELVE_DATA_API_KEY",
    "c0c94a09b4e242e0805cf8261b5bda67"
)


# ============================================================
# FILES
# ============================================================

BREAKOUT_FILE = "breakout_scanner.json"
PREBREAKOUT_FILE = "scanner_database.json"
INDICATOR_HISTORY_FILE = "scanner_indicator_history.json"

OUTPUT_FILE = "daily_brief_candidates.json"
STATS_OUTPUT_FILE = "daily_brief_stats.json"
PROFILE_CACHE_FILE = "daily_brief_profile_cache.json"


# ============================================================
# HARD CULL SETTINGS
# ============================================================

MIN_AVERAGE_VOLUME = 100000
MIN_AVERAGE_DOLLAR_VOLUME = 1000000

MAX_PREBREAKOUT_DISTANCE = 5.0
MAX_ABOVE_RESISTANCE = 15.0
HIGH_VOLUME_EXCEPTION = 2.0

PROFILE_SLEEP_TIME = 0.5


# ============================================================
# RANKING SETTINGS
# ============================================================

TARGET_TOP_CANDIDATES = 20


PARTICIPATION_SCORE_MAP = {

    "STRONG_CONFIRMATION":
        10,

    "POSITIVE_DIVERGENCE":
        10,

    "HOLDING_DURING_PULLBACK":
        7,

    "NORMAL_PULLBACK":
        0,

    "NEUTRAL":
        0,

    "WEAKENING":
        -4,

    "PERSISTENT_DISTRIBUTION":
        -8
}


# ============================================================
# SCANNER PERSISTENCE SCORE
# ============================================================
#
# Deliberately low-weight.
#
# Persistence NEVER hard-culls a stock.
#
# As EdgeBreak accumulates more history, the same code will
# automatically be able to classify longer persistence.
#
# ============================================================

PERSISTENCE_SCORE_MAP = {

    "INSUFFICIENT_HISTORY":
        0,

    "NEW":
        0,

    "OCCASIONAL":
        0,

    "REPEATED":
        1,

    "PERSISTENT":
        2,

    "HIGHLY_PERSISTENT":
        3
}


# ============================================================
# EXCLUSION SETTINGS
# ============================================================

BANK_KEYWORDS = [
    "banks",
    "bank",
    "savings",
    "thrift"
]


PROPERTY_KEYWORDS = [
    "reit",
    "real estate"
]


SPECIAL_SECURITY_SUFFIXES = {

    "W":
        "Warrant",

    "R":
        "Rights",

    "U":
        "Units",

    "P":
        "Preferred",

    "Q":
        "Bankruptcy",

    "V":
        "When Issued"
}


# ============================================================
# JSON HELPERS
# ============================================================

def load_json(
    filename,
    default=None
):

    if default is None:

        default = []


    try:

        with open(
            filename,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(
                file
            )


    except FileNotFoundError:

        print(
            f"⚠️ File not found: {filename}"
        )

        return default


    except Exception as error:

        print(
            f"❌ Could not load {filename}: {error}"
        )

        return default


def save_json(
    filename,
    data
):

    with open(
        filename,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=4,
            ensure_ascii=False
        )


def safe_number(
    value,
    default=0
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


# ============================================================
# INDICATOR HISTORY
# ============================================================

indicator_history = load_json(
    INDICATOR_HISTORY_FILE,
    {}
)


if not isinstance(
    indicator_history,
    dict
):

    indicator_history = {}


# ============================================================
# LATEST INDICATOR SNAPSHOT
# ============================================================

def get_latest_indicator_snapshot(
    symbol
):

    if not symbol:

        return None


    symbol = str(
        symbol
    ).strip().upper()


    record = indicator_history.get(
        symbol
    )


    if not isinstance(
        record,
        dict
    ):

        return None


    history = record.get(
        "history",
        []
    )


    if not isinstance(
        history,
        list
    ):

        return None


    valid = [

        item

        for item
        in history

        if (
            isinstance(
                item,
                dict
            )

            and

            item.get(
                "date"
            )
        )

    ]


    if not valid:

        return None


    return max(

        valid,

        key=lambda item:
            item.get(
                "date",
                ""
            )

    )


# ============================================================
# INDICATOR INTELLIGENCE
# ============================================================

def get_indicator_intelligence(
    symbol
):

    snapshot = get_latest_indicator_snapshot(
        symbol
    )


    if not snapshot:

        return {

            "available":
                False,

            "date":
                None,

            "participation_state":
                None,

            "obv_price_relationship":
                None,

            "obv_trend_5d":
                None,

            "obv_trend_20d":
                None,

            "obv_trend_60d":
                None,

            "rsi_state":
                None,

            "relative_volume":
                None,

            "price_change_5d_percent":
                None,

            "price_change_20d_percent":
                None,

            "price_change_60d_percent":
                None

        }


    return {

        "available":
            True,

        "date":
            snapshot.get(
                "date"
            ),

        "participation_state":
            snapshot.get(
                "participation_state"
            ),

        "obv_price_relationship":
            snapshot.get(
                "obv_price_relationship"
            ),

        "obv_trend_5d":
            snapshot.get(
                "obv_trend_5d"
            ),

        "obv_trend_20d":
            snapshot.get(
                "obv_trend_20d"
            ),

        "obv_trend_60d":
            snapshot.get(
                "obv_trend_60d"
            ),

        "rsi_state":
            snapshot.get(
                "rsi_state"
            ),

        "relative_volume":
            safe_number(
                snapshot.get(
                    "relative_volume"
                ),
                None
            ),

        "price_change_5d_percent":
            safe_number(
                snapshot.get(
                    "price_change_5d_percent"
                ),
                None
            ),

        "price_change_20d_percent":
            safe_number(
                snapshot.get(
                    "price_change_20d_percent"
                ),
                None
            ),

        "price_change_60d_percent":
            safe_number(
                snapshot.get(
                    "price_change_60d_percent"
                ),
                None
            )
    }


# ============================================================
# GLOBAL SAVED SCAN SESSIONS
# ============================================================
#
# Build the union of all saved scanner snapshot dates.
#
# This means:
#
# "last 5 scans"
#
# means the last five actual saved EdgeBreak scanner sessions,
# NOT the last five calendar days.
#
# Weekends and holidays do not break persistence.
#
# ============================================================

def build_global_scan_sessions():

    sessions = set()


    for record in indicator_history.values():

        if not isinstance(
            record,
            dict
        ):

            continue


        history = record.get(
            "history",
            []
        )


        if not isinstance(
            history,
            list
        ):

            continue


        for snapshot in history:

            if not isinstance(
                snapshot,
                dict
            ):

                continue


            date_value = snapshot.get(
                "date"
            )


            if date_value:

                sessions.add(
                    str(
                        date_value
                    )
                )


    return sorted(
        sessions
    )


GLOBAL_SCAN_SESSIONS = (
    build_global_scan_sessions()
)


# ============================================================
# SCANNER PERSISTENCE
# ============================================================

def get_scanner_persistence(
    symbol
):

    available_session_count = len(
        GLOBAL_SCAN_SESSIONS
    )


    result = {

        "available":
            False,

        "scanner_sessions_available":
            available_session_count,

        "appearances_last_5_scans":
            0,

        "appearances_last_10_scans":
            0,

        "appearances_last_20_scans":
            0,

        "sessions_in_5_scan_window":
            min(
                5,
                available_session_count
            ),

        "sessions_in_10_scan_window":
            min(
                10,
                available_session_count
            ),

        "sessions_in_20_scan_window":
            min(
                20,
                available_session_count
            ),

        "consecutive_scan_appearances":
            0,

        "saved_appearances":
            0,

        "first_seen":
            None,

        "last_seen":
            None,

        "persistence_state":
            "INSUFFICIENT_HISTORY",

        "persistence_points":
            0

    }


    if not symbol:

        return result


    symbol = str(
        symbol
    ).strip().upper()


    record = indicator_history.get(
        symbol
    )


    if not isinstance(
        record,
        dict
    ):

        return result


    history = record.get(
        "history",
        []
    )


    if not isinstance(
        history,
        list
    ):

        return result


    appearance_dates = set()


    for snapshot in history:

        if not isinstance(
            snapshot,
            dict
        ):

            continue


        date_value = snapshot.get(
            "date"
        )


        if date_value:

            appearance_dates.add(
                str(
                    date_value
                )
            )


    if not appearance_dates:

        return result


    result[
        "available"
    ] = True


    result[
        "saved_appearances"
    ] = len(
        appearance_dates
    )


    result[
        "first_seen"
    ] = record.get(
        "first_seen"
    )


    result[
        "last_seen"
    ] = record.get(
        "last_seen"
    )


    # --------------------------------------------------------
    # RECENT WINDOWS
    # --------------------------------------------------------

    last_5_sessions = (
        GLOBAL_SCAN_SESSIONS[
            -5:
        ]
    )


    last_10_sessions = (
        GLOBAL_SCAN_SESSIONS[
            -10:
        ]
    )


    last_20_sessions = (
        GLOBAL_SCAN_SESSIONS[
            -20:
        ]
    )


    appearances_5 = sum(

        1

        for session
        in last_5_sessions

        if session in appearance_dates

    )


    appearances_10 = sum(

        1

        for session
        in last_10_sessions

        if session in appearance_dates

    )


    appearances_20 = sum(

        1

        for session
        in last_20_sessions

        if session in appearance_dates

    )


    result[
        "appearances_last_5_scans"
    ] = appearances_5


    result[
        "appearances_last_10_scans"
    ] = appearances_10


    result[
        "appearances_last_20_scans"
    ] = appearances_20


    # --------------------------------------------------------
    # CONSECUTIVE APPEARANCES
    # --------------------------------------------------------

    consecutive = 0


    for session in reversed(
        GLOBAL_SCAN_SESSIONS
    ):

        if session in appearance_dates:

            consecutive += 1

        else:

            break


    result[
        "consecutive_scan_appearances"
    ] = consecutive


    saved_appearances = len(
        appearance_dates
    )


    # --------------------------------------------------------
    # PERSISTENCE CLASSIFICATION
    # --------------------------------------------------------
    #
    # Less than 3 available sessions:
    # no meaningful persistence score yet.
    #
    # REPEATED:
    # 3 consecutive appearances
    # OR 3 appearances across recent 5-session window.
    #
    # PERSISTENT:
    # 5 consecutive appearances
    # OR 4 appearances across last 5 scans.
    #
    # HIGHLY_PERSISTENT:
    # 8 consecutive appearances
    # OR 8 appearances across last 10 scans.
    #
    # No persistence state creates a negative score.
    #
    # --------------------------------------------------------

    if available_session_count < 3:

        state = (
            "INSUFFICIENT_HISTORY"
        )


    elif saved_appearances <= 1:

        state = (
            "NEW"
        )


    elif (

        consecutive >= 8

        or

        (
            available_session_count >= 10

            and

            appearances_10 >= 8
        )

    ):

        state = (
            "HIGHLY_PERSISTENT"
        )


    elif (

        consecutive >= 5

        or

        (
            available_session_count >= 5

            and

            appearances_5 >= 4
        )

    ):

        state = (
            "PERSISTENT"
        )


    elif (

        consecutive >= 3

        or

        (
            available_session_count >= 4

            and

            appearances_5 >= 3
        )

    ):

        state = (
            "REPEATED"
        )


    else:

        state = (
            "OCCASIONAL"
        )


    points = PERSISTENCE_SCORE_MAP.get(
        state,
        0
    )


    result[
        "persistence_state"
    ] = state


    result[
        "persistence_points"
    ] = int(
        points
    )


    return result


# ============================================================
# SCANNER HELPERS
# ============================================================

def get_scanner_stock(
    candidate
):

    if candidate.get(
        "breakout"
    ):

        return (
            candidate[
                "breakout"
            ],
            "BREAKOUT"
        )


    if candidate.get(
        "pre_breakout"
    ):

        return (
            candidate[
                "pre_breakout"
            ],
            "PRE_BREAKOUT"
        )


    return (
        {},
        "UNKNOWN"
    )


def get_current_price(
    stock
):

    price = safe_number(
        stock.get(
            "price"
        ),
        0
    )


    if price > 0:

        return price


    price = safe_number(
        stock.get(
            "current_price"
        ),
        0
    )


    if price > 0:

        return price


    return 0


def get_resistance(
    stock
):

    for field in (
        "resistance_price",
        "resistance",
        "resistance_high"
    ):

        resistance = safe_number(
            stock.get(
                field
            ),
            0
        )


        if resistance > 0:

            return resistance


    return 0


def get_resistance_touches(
    stock
):

    touches = safe_number(
        stock.get(
            "touches"
        ),
        -1
    )


    if touches >= 0:

        return touches


    return safe_number(
        stock.get(
            "resistance_touches"
        ),
        0
    )


def get_higher_lows(
    stock
):

    return safe_number(
        stock.get(
            "higher_lows"
        ),
        0
    )


# ============================================================
# RELATIVE VOLUME
# ============================================================

def get_relative_volume(
    stock,
    symbol=None
):

    possible_fields = (

        "volume_ratio",
        "relative_volume",
        "relative_volume_20",
        "relativeVolume",
        "relativeVolume20"

    )


    for field in possible_fields:

        if field not in stock:

            continue


        value = safe_number(
            stock.get(
                field
            ),
            None
        )


        if value is None:

            continue


        return {

            "available":
                True,

            "value":
                value,

            "field":
                field

        }


    if symbol:

        snapshot = get_latest_indicator_snapshot(
            symbol
        )


        if snapshot:

            value = safe_number(
                snapshot.get(
                    "relative_volume"
                ),
                None
            )


            if value is not None:

                return {

                    "available":
                        True,

                    "value":
                        value,

                    "field":
                        (
                            "scanner_indicator_history."
                            "relative_volume"
                        )

                }


    return {

        "available":
            False,

        "value":
            0,

        "field":
            None

    }


# ============================================================
# PRE-BREAKOUT DISTANCE
# ============================================================

def get_prebreakout_distance(
    stock
):

    if (
        stock.get(
            "distance_to_resistance"
        )
        is not None
    ):

        distance = safe_number(
            stock.get(
                "distance_to_resistance"
            ),
            None
        )


        if distance is not None:

            return distance


    price = get_current_price(
        stock
    )


    resistance = get_resistance(
        stock
    )


    if (
        price <= 0

        or

        resistance <= 0
    ):

        return None


    return round(

        (
            resistance
            -
            price
        )

        /

        resistance

        *

        100,

        2

    )


# ============================================================
# PRE-BREAKOUT LIQUIDITY
# ============================================================

def passes_prebreakout_liquidity(
    stock
):

    average_volume = safe_number(
        stock.get(
            "average_volume_20"
        ),
        0
    )


    average_dollar_volume = safe_number(
        stock.get(
            "average_dollar_volume_20"
        ),
        0
    )


    return (

        average_volume
        >=
        MIN_AVERAGE_VOLUME

        and

        average_dollar_volume
        >=
        MIN_AVERAGE_DOLLAR_VOLUME

    )


# ============================================================
# PRE-BREAKOUT PROXIMITY
# ============================================================

def check_prebreakout_proximity(
    stock
):

    distance = get_prebreakout_distance(
        stock
    )


    price = get_current_price(
        stock
    )


    resistance = get_resistance(
        stock
    )


    if distance is None:

        return {

            "remove":
                False,

            "distance":
                None,

            "price":
                price,

            "resistance":
                resistance

        }


    return {

        "remove":
            (
                distance
                >
                MAX_PREBREAKOUT_DISTANCE
            ),

        "distance":
            round(
                distance,
                2
            ),

        "price":
            price,

        "resistance":
            resistance

    }


# ============================================================
# STALE BREAKOUT
# ============================================================

def check_stale_breakout(
    stock,
    symbol=None
):

    price = get_current_price(
        stock
    )


    resistance = get_resistance(
        stock
    )


    base_result = {

        "stale":
            False,

        "is_breakout":
            False,

        "price":
            price,

        "resistance":
            resistance,

        "distance_above_resistance":
            None,

        "volume_available":
            False,

        "relative_volume":
            0,

        "relative_volume_field":
            None,

        "high_volume_exception":
            False

    }


    if (
        price <= 0

        or

        resistance <= 0
    ):

        return base_result


    distance_above = (

        (
            price
            -
            resistance
        )

        /

        resistance

        *

        100

    )


    if distance_above <= 0:

        base_result[
            "distance_above_resistance"
        ] = round(
            distance_above,
            2
        )


        return base_result


    volume = get_relative_volume(
        stock,
        symbol
    )


    result = {

        **base_result,

        "is_breakout":
            True,

        "distance_above_resistance":
            round(
                distance_above,
                2
            ),

        "volume_available":
            volume[
                "available"
            ],

        "relative_volume":
            volume[
                "value"
            ],

        "relative_volume_field":
            volume[
                "field"
            ]

    }


    if (
        distance_above
        <=
        MAX_ABOVE_RESISTANCE
    ):

        return result


    high_volume_exception = (

        volume[
            "available"
        ]

        and

        volume[
            "value"
        ]
        >=
        HIGH_VOLUME_EXCEPTION

    )


    result[
        "stale"
    ] = (
        not high_volume_exception
    )


    result[
        "high_volume_exception"
    ] = high_volume_exception


    return result


def apply_stale_breakout_cull(
    stocks,
    scanner_name
):

    survivors = []
    removed = []
    volume_exceptions = []


    for stock in stocks:

        symbol = stock.get(
            "symbol"
        )


        result = check_stale_breakout(
            stock,
            symbol
        )


        if result[
            "stale"
        ]:

            removed.append({

                "symbol":
                    symbol,

                "scanner":
                    scanner_name,

                "price":
                    result[
                        "price"
                    ],

                "resistance":
                    result[
                        "resistance"
                    ],

                "distance_above_resistance":
                    result[
                        "distance_above_resistance"
                    ],

                "volume_available":
                    result[
                        "volume_available"
                    ],

                "relative_volume":
                    result[
                        "relative_volume"
                    ]

            })


            continue


        if result[
            "high_volume_exception"
        ]:

            volume_exceptions.append({

                "symbol":
                    symbol,

                "scanner":
                    scanner_name,

                "distance_above_resistance":
                    result[
                        "distance_above_resistance"
                    ],

                "relative_volume":
                    result[
                        "relative_volume"
                    ]

            })


        survivors.append(
            stock
        )


    return (
        survivors,
        removed,
        volume_exceptions
    )


# ============================================================
# SPECIAL SECURITY
# ============================================================

def get_special_security_reason(
    symbol
):

    if not symbol:

        return None


    symbol = str(
        symbol
    ).strip().upper()


    if len(
        symbol
    ) <= 4:

        return None


    return SPECIAL_SECURITY_SUFFIXES.get(
        symbol[
            -1
        ]
    )


# ============================================================
# PROFILE CACHE
# ============================================================

profile_cache = load_json(
    PROFILE_CACHE_FILE,
    {}
)


if not isinstance(
    profile_cache,
    dict
):

    profile_cache = {}


# ============================================================
# TWELVE DATA PROFILE
# ============================================================

def fetch_profile(
    symbol
):

    if symbol in profile_cache:

        return profile_cache[
            symbol
        ]


    if (
        not API_KEY

        or

        API_KEY
        ==
        "PASTE_YOUR_EXISTING_KEY_HERE"
    ):

        print(
            f"⚠️ Profile skipped: {symbol} "
            "(Twelve Data API key not configured)"
        )

        return None


    try:

        response = requests.get(

            "https://api.twelvedata.com/profile",

            params={

                "symbol":
                    symbol,

                "apikey":
                    API_KEY

            },

            timeout=20

        )


        data = response.json()


        if (

            not isinstance(
                data,
                dict
            )

            or

            data.get(
                "status"
            )
            ==
            "error"

        ):

            print(
                f"⚠️ Profile failed: {symbol}"
            )

            return None


        profile = {

            "name":
                data.get(
                    "name"
                ),

            "sector":
                data.get(
                    "sector"
                ),

            "industry":
                data.get(
                    "industry"
                ),

            "type":
                data.get(
                    "type"
                )

        }


        profile_cache[
            symbol
        ] = profile


        save_json(
            PROFILE_CACHE_FILE,
            profile_cache
        )


        print(
            f"Profile saved: {symbol}"
        )


        time.sleep(
            PROFILE_SLEEP_TIME
        )


        return profile


    except Exception as error:

        print(
            f"⚠️ Profile error "
            f"{symbol}: {error}"
        )

        return None


# ============================================================
# PROFILE EXCLUSION CHECK
# ============================================================

def get_exclusion_reason(
    profile
):

    if not profile:

        return None


    sector = str(
        profile.get(
            "sector",
            ""
        )
    ).lower()


    industry = str(
        profile.get(
            "industry",
            ""
        )
    ).lower()


    stock_type = str(
        profile.get(
            "type",
            ""
        )
    ).lower()


    combined_text = (

        sector

        +
        " "

        +
        industry

        +
        " "

        +
        stock_type

    )


    SPECIAL_PROFILE_TYPES = [

        "preferred",
        "warrant",
        "rights",
        "unit"

    ]


    for keyword in SPECIAL_PROFILE_TYPES:

        if keyword in stock_type:

            return "SPECIAL_SECURITY"


    for keyword in BANK_KEYWORDS:

        if keyword in industry:

            return "BANK"


    for keyword in PROPERTY_KEYWORDS:

        if keyword in combined_text:

            return "PROPERTY"


    return None


# ============================================================
# TOUCH SCORE
# ============================================================

def score_touches(
    stock
):

    touches = get_resistance_touches(
        stock
    )


    if touches >= 6:

        return 30


    if touches == 5:

        return 27


    if touches == 4:

        return 24


    if touches == 3:

        return 20


    if touches == 2:

        return 15


    if touches == 1:

        return 7


    return 0


# ============================================================
# HIGHER LOW SCORE
# ============================================================

def score_higher_lows(
    stock
):

    higher_lows = get_higher_lows(
        stock
    )


    if higher_lows >= 8:

        return 30


    if higher_lows >= 6:

        return 28


    if higher_lows >= 5:

        return 26


    if higher_lows >= 4:

        return 24


    if higher_lows >= 3:

        return 21


    if higher_lows >= 2:

        return 17


    if higher_lows >= 1:

        return 9


    return 0


# ============================================================
# BREAKOUT POSITION SCORE
# ============================================================

def score_breakout_position(
    stock
):

    price = get_current_price(
        stock
    )


    resistance = get_resistance(
        stock
    )


    if (
        price <= 0

        or

        resistance <= 0
    ):

        return (
            0,
            None
        )


    distance_above = round(

        (
            price
            -
            resistance
        )

        /

        resistance

        *

        100,

        2

    )


    if (
        0
        <=
        distance_above
        <=
        2
    ):

        return (
            30,
            distance_above
        )


    if distance_above <= 4:

        return (
            27,
            distance_above
        )


    if distance_above <= 6:

        return (
            23,
            distance_above
        )


    if distance_above <= 10:

        return (
            17,
            distance_above
        )


    if distance_above <= 15:

        return (
            10,
            distance_above
        )


    return (
        0,
        distance_above
    )


# ============================================================
# PRE-BREAKOUT POSITION SCORE
# ============================================================

def score_prebreakout_position(
    stock
):

    distance = get_prebreakout_distance(
        stock
    )


    if distance is None:

        return (
            0,
            None
        )


    if distance < 0:

        distance_above = abs(
            distance
        )


        if distance_above <= 1:

            return (
                30,
                distance
            )


        if distance_above <= 2:

            return (
                28,
                distance
            )


        if distance_above <= 5:

            return (
                22,
                distance
            )


        return (
            10,
            distance
        )


    if distance <= 0.5:

        return (
            30,
            distance
        )


    if distance <= 1:

        return (
            29,
            distance
        )


    if distance <= 2:

        return (
            26,
            distance
        )


    if distance <= 3:

        return (
            22,
            distance
        )


    if distance <= 4:

        return (
            18,
            distance
        )


    if distance <= 5:

        return (
            14,
            distance
        )


    return (
        0,
        distance
    )


# ============================================================
# VOLUME SCORE
# ============================================================

def score_volume(
    stock,
    symbol=None
):

    volume = get_relative_volume(
        stock,
        symbol
    )


    if not volume[
        "available"
    ]:

        return (
            0,
            None,
            None
        )


    ratio = volume[
        "value"
    ]


    source = volume[
        "field"
    ]


    if ratio >= 2.0:

        return (
            10,
            ratio,
            source
        )


    if ratio >= 1.5:

        return (
            8,
            ratio,
            source
        )


    if ratio >= 1.0:

        return (
            6,
            ratio,
            source
        )


    if ratio >= 0.75:

        return (
            4,
            ratio,
            source
        )


    if ratio >= 0.5:

        return (
            2,
            ratio,
            source
        )


    return (
        0,
        ratio,
        source
    )


# ============================================================
# PARTICIPATION SCORE
# ============================================================

def score_participation(
    symbol
):

    intelligence = get_indicator_intelligence(
        symbol
    )


    if not intelligence[
        "available"
    ]:

        return {

            "points":
                0,

            "state":
                None,

            "intelligence":
                intelligence

        }


    state = str(

        intelligence.get(
            "participation_state"
        )

        or

        "NEUTRAL"

    ).strip().upper()


    points = PARTICIPATION_SCORE_MAP.get(
        state,
        0
    )


    return {

        "points":
            int(
                points
            ),

        "state":
            state,

        "intelligence":
            intelligence

    }


# ============================================================
# FINAL DAILY BRIEF SCORE
# ============================================================

def calculate_daily_brief_score(
    candidate
):

    symbol = str(
        candidate.get(
            "symbol",
            ""
        )
    ).strip().upper()


    stock, scanner_type = (
        get_scanner_stock(
            candidate
        )
    )


    touch_points = score_touches(
        stock
    )


    higher_low_points = score_higher_lows(
        stock
    )


    if scanner_type == "BREAKOUT":

        (
            position_points,
            distance
        ) = score_breakout_position(
            stock
        )


    else:

        (
            position_points,
            distance
        ) = score_prebreakout_position(
            stock
        )


    (
        volume_points,
        relative_volume,
        relative_volume_source
    ) = score_volume(
        stock,
        symbol
    )


    structural_score = (

        touch_points

        +
        higher_low_points

        +
        position_points

        +
        volume_points

    )


    participation = score_participation(
        symbol
    )


    participation_points = participation[
        "points"
    ]


    intelligence = participation[
        "intelligence"
    ]


    persistence = get_scanner_persistence(
        symbol
    )


    persistence_points = persistence[
        "persistence_points"
    ]


    total_score = (

        structural_score

        +
        participation_points

        +
        persistence_points

    )


    return {

        "total_score":
            int(
                total_score
            ),

        "structural_score":
            int(
                structural_score
            ),

        "participation_points":
            int(
                participation_points
            ),

        "participation_state":
            participation[
                "state"
            ],

        "persistence_points":
            int(
                persistence_points
            ),

        "persistence_state":
            persistence.get(
                "persistence_state"
            ),

        "scanner_sessions_available":
            persistence.get(
                "scanner_sessions_available"
            ),

        "appearances_last_5_scans":
            persistence.get(
                "appearances_last_5_scans"
            ),

        "appearances_last_10_scans":
            persistence.get(
                "appearances_last_10_scans"
            ),

        "appearances_last_20_scans":
            persistence.get(
                "appearances_last_20_scans"
            ),

        "sessions_in_5_scan_window":
            persistence.get(
                "sessions_in_5_scan_window"
            ),

        "sessions_in_10_scan_window":
            persistence.get(
                "sessions_in_10_scan_window"
            ),

        "sessions_in_20_scan_window":
            persistence.get(
                "sessions_in_20_scan_window"
            ),

        "consecutive_scan_appearances":
            persistence.get(
                "consecutive_scan_appearances"
            ),

        "saved_appearances":
            persistence.get(
                "saved_appearances"
            ),

        "first_seen":
            persistence.get(
                "first_seen"
            ),

        "last_seen":
            persistence.get(
                "last_seen"
            ),

        "indicator_date":
            intelligence.get(
                "date"
            ),

        "obv_price_relationship":
            intelligence.get(
                "obv_price_relationship"
            ),

        "obv_trend_5d":
            intelligence.get(
                "obv_trend_5d"
            ),

        "obv_trend_20d":
            intelligence.get(
                "obv_trend_20d"
            ),

        "obv_trend_60d":
            intelligence.get(
                "obv_trend_60d"
            ),

        "rsi_state":
            intelligence.get(
                "rsi_state"
            ),

        "price_change_5d_percent":
            intelligence.get(
                "price_change_5d_percent"
            ),

        "price_change_20d_percent":
            intelligence.get(
                "price_change_20d_percent"
            ),

        "price_change_60d_percent":
            intelligence.get(
                "price_change_60d_percent"
            ),

        "scanner_type":
            scanner_type,

        "touch_points":
            touch_points,

        "higher_low_points":
            higher_low_points,

        "position_points":
            position_points,

        "volume_points":
            volume_points,

        "resistance_touches":
            int(
                get_resistance_touches(
                    stock
                )
            ),

        "higher_lows":
            int(
                get_higher_lows(
                    stock
                )
            ),

        "distance_from_resistance_percent":
            distance,

        "relative_volume":
            relative_volume,

        "relative_volume_source":
            relative_volume_source

    }


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("===================================")
    print("EDGEBREAK DAILY BRIEF CULL")
    print("===================================")
    print()


    # --------------------------------------------------------
    # LOAD SCANNERS
    # --------------------------------------------------------

    breakouts = load_json(
        BREAKOUT_FILE,
        []
    )


    prebreakouts = load_json(
        PREBREAKOUT_FILE,
        []
    )


    starting_total = (

        len(
            breakouts
        )

        +

        len(
            prebreakouts
        )

    )


    print(
        f"Breakouts loaded     : "
        f"{len(breakouts)}"
    )


    print(
        f"Pre-Breakouts loaded : "
        f"{len(prebreakouts)}"
    )


    print(
        "Launch Pads          : "
        "EXCLUDED FROM DAILY BRIEF"
    )


    print(
        f"Indicator history    : "
        f"{len(indicator_history)} symbols"
    )


    print(
        f"Saved scan sessions  : "
        f"{len(GLOBAL_SCAN_SESSIONS)}"
    )


    print(
        f"Starting results     : "
        f"{starting_total}"
    )


    # --------------------------------------------------------
    # BREAKOUT LIQUIDITY
    # --------------------------------------------------------

    breakout_liquidity_survivors = list(
        breakouts
    )


    print()
    print("-----------------------------------")
    print("BREAKOUT LIQUIDITY")
    print("-----------------------------------")


    print(
        f"Before               : "
        f"{len(breakouts)}"
    )


    print(
        "Liquidity cull       : "
        "NOT APPLIED"
    )


    print(
        f"Remaining            : "
        f"{len(breakout_liquidity_survivors)}"
    )


    # --------------------------------------------------------
    # PRE-BREAKOUT LIQUIDITY
    # --------------------------------------------------------

    prebreakout_liquidity_survivors = []
    prebreakout_liquidity_removed = []


    for stock in prebreakouts:

        if passes_prebreakout_liquidity(
            stock
        ):

            prebreakout_liquidity_survivors.append(
                stock
            )


        else:

            prebreakout_liquidity_removed.append({

                "symbol":
                    stock.get(
                        "symbol"
                    ),

                "average_volume_20":
                    safe_number(
                        stock.get(
                            "average_volume_20"
                        ),
                        0
                    ),

                "average_dollar_volume_20":
                    safe_number(
                        stock.get(
                            "average_dollar_volume_20"
                        ),
                        0
                    )

            })


    print()
    print("-----------------------------------")
    print("PRE-BREAKOUT LIQUIDITY CULL")
    print("-----------------------------------")


    print(
        f"Before               : "
        f"{len(prebreakouts)}"
    )


    print(
        f"Removed              : "
        f"{len(prebreakout_liquidity_removed)}"
    )


    print(
        f"Remaining            : "
        f"{len(prebreakout_liquidity_survivors)}"
    )


    # --------------------------------------------------------
    # PRE-BREAKOUT PROXIMITY
    # --------------------------------------------------------

    prebreakout_proximity_survivors = []
    prebreakout_proximity_removed = []


    for stock in prebreakout_liquidity_survivors:

        result = check_prebreakout_proximity(
            stock
        )


        if result[
            "remove"
        ]:

            prebreakout_proximity_removed.append({

                "symbol":
                    stock.get(
                        "symbol"
                    ),

                "price":
                    result[
                        "price"
                    ],

                "resistance":
                    result[
                        "resistance"
                    ],

                "distance":
                    result[
                        "distance"
                    ]

            })


            continue


        prebreakout_proximity_survivors.append(
            stock
        )


    print()
    print("-----------------------------------")
    print("PRE-BREAKOUT 5% PROXIMITY CULL")
    print("-----------------------------------")


    print(
        f"Before               : "
        f"{len(prebreakout_liquidity_survivors)}"
    )


    print(
        f"Removed >5% away     : "
        f"{len(prebreakout_proximity_removed)}"
    )


    print(
        f"Remaining            : "
        f"{len(prebreakout_proximity_survivors)}"
    )


    # --------------------------------------------------------
    # STALE BREAKOUT
    # --------------------------------------------------------

    (
        breakout_survivors,
        breakout_stale_removed,
        breakout_volume_exceptions
    ) = apply_stale_breakout_cull(

        breakout_liquidity_survivors,

        "BREAKOUT"

    )


    (
        prebreakout_survivors,
        prebreakout_stale_removed,
        prebreakout_volume_exceptions
    ) = apply_stale_breakout_cull(

        prebreakout_proximity_survivors,

        "PRE_BREAKOUT"

    )


    total_stale_removed = (

        len(
            breakout_stale_removed
        )

        +

        len(
            prebreakout_stale_removed
        )

    )


    all_volume_exceptions = (

        breakout_volume_exceptions

        +

        prebreakout_volume_exceptions

    )


    print()
    print("-----------------------------------")
    print("STALE BREAKOUT CULL")
    print("-----------------------------------")


    print(
        f"Breakout removed     : "
        f"{len(breakout_stale_removed)}"
    )


    print(
        f"Pre-Breakout removed : "
        f"{len(prebreakout_stale_removed)}"
    )


    print(
        f"Total stale removed  : "
        f"{total_stale_removed}"
    )


    print(
        f"2x volume exceptions : "
        f"{len(all_volume_exceptions)}"
    )


    # --------------------------------------------------------
    # COMBINE SCANNERS
    # --------------------------------------------------------

    combined = []


    for stock in breakout_survivors:

        combined.append({

            "symbol":
                stock.get(
                    "symbol"
                ),

            "scanners":
                [
                    "BREAKOUT"
                ],

            "breakout":
                stock

        })


    for stock in prebreakout_survivors:

        combined.append({

            "symbol":
                stock.get(
                    "symbol"
                ),

            "scanners":
                [
                    "PRE_BREAKOUT"
                ],

            "pre_breakout":
                stock

        })


    print()
    print("-----------------------------------")
    print("AFTER SCANNER-SPECIFIC CULLS")
    print("-----------------------------------")


    print(
        f"Breakouts            : "
        f"{len(breakout_survivors)}"
    )


    print(
        f"Pre-Breakouts        : "
        f"{len(prebreakout_survivors)}"
    )


    print(
        f"Combined appearances : "
        f"{len(combined)}"
    )


    # --------------------------------------------------------
    # SPECIAL SECURITY TICKER CULL
    # --------------------------------------------------------

    normal_security_candidates = []
    weird_security_removed = []


    for stock in combined:

        symbol = str(
            stock.get(
                "symbol",
                ""
            )
        ).strip().upper()


        reason = get_special_security_reason(
            symbol
        )


        if reason:

            weird_security_removed.append({

                "symbol":
                    symbol,

                "reason":
                    reason,

                "scanners":
                    stock.get(
                        "scanners",
                        []
                    )

            })


            continue


        normal_security_candidates.append(
            stock
        )


    print()
    print("-----------------------------------")
    print("SPECIAL SECURITY CULL")
    print("-----------------------------------")


    print(
        f"Before               : "
        f"{len(combined)}"
    )


    print(
        f"Special removed      : "
        f"{len(weird_security_removed)}"
    )


    print(
        f"Remaining            : "
        f"{len(normal_security_candidates)}"
    )


    # --------------------------------------------------------
    # DUPLICATE MERGE
    # --------------------------------------------------------

    merged = {}


    for stock in normal_security_candidates:

        symbol = stock.get(
            "symbol"
        )


        if not symbol:

            continue


        symbol = str(
            symbol
        ).upper()


        if symbol not in merged:

            merged[
                symbol
            ] = {

                "symbol":
                    symbol,

                "scanners":
                    []

            }


        record = merged[
            symbol
        ]


        for scanner in stock.get(
            "scanners",
            []
        ):

            if scanner not in record[
                "scanners"
            ]:

                record[
                    "scanners"
                ].append(
                    scanner
                )


        if "breakout" in stock:

            record[
                "breakout"
            ] = stock[
                "breakout"
            ]


        if "pre_breakout" in stock:

            record[
                "pre_breakout"
            ] = stock[
                "pre_breakout"
            ]


    merged_candidates = list(
        merged.values()
    )


    duplicates_removed = (

        len(
            normal_security_candidates
        )

        -

        len(
            merged_candidates
        )

    )


    print()
    print("-----------------------------------")
    print("DUPLICATE MERGE")
    print("-----------------------------------")


    print(
        f"Before merge         : "
        f"{len(normal_security_candidates)}"
    )


    print(
        f"Duplicates merged    : "
        f"{duplicates_removed}"
    )


    print(
        f"Unique candidates    : "
        f"{len(merged_candidates)}"
    )


    # --------------------------------------------------------
    # BANK / PROPERTY / PROFILE SECURITY CULL
    # --------------------------------------------------------

    qualified_candidates = []

    bank_removed = []
    property_removed = []
    profile_failures = []


    print()
    print("-----------------------------------")
    print("BANK / PROPERTY CULL")
    print("-----------------------------------")
    print()


    for index, stock in enumerate(
        merged_candidates,
        start=1
    ):

        symbol = stock[
            "symbol"
        ]


        print(
            f"[{index}/"
            f"{len(merged_candidates)}] "
            f"{symbol}"
        )


        profile = fetch_profile(
            symbol
        )


        if profile is None:

            profile_failures.append(
                symbol
            )


            qualified_candidates.append(
                stock
            )


            continue


        stock[
            "company"
        ] = {

            "name":
                profile.get(
                    "name"
                ),

            "sector":
                profile.get(
                    "sector"
                ),

            "industry":
                profile.get(
                    "industry"
                ),

            "type":
                profile.get(
                    "type"
                )

        }


        reason = get_exclusion_reason(
            profile
        )


        if reason == "SPECIAL_SECURITY":

            weird_security_removed.append({

                "symbol":
                    symbol,

                "reason":
                    profile.get(
                        "type"
                    )
                    or
                    "Special Security",

                "scanners":
                    stock.get(
                        "scanners",
                        []
                    )

            })


            print(
                f"   REMOVED SPECIAL SECURITY: "
                f"{profile.get('type')}"
            )


            continue


        if reason == "BANK":

            bank_removed.append({

                "symbol":
                    symbol,

                "name":
                    profile.get(
                        "name"
                    ),

                "industry":
                    profile.get(
                        "industry"
                    )

            })


            print(
                f"   REMOVED BANK: "
                f"{profile.get('industry')}"
            )


            continue


        if reason == "PROPERTY":

            property_removed.append({

                "symbol":
                    symbol,

                "name":
                    profile.get(
                        "name"
                    ),

                "industry":
                    profile.get(
                        "industry"
                    )

            })


            print(
                f"   REMOVED PROPERTY: "
                f"{profile.get('industry')}"
            )


            continue


        qualified_candidates.append(
            stock
        )


    # --------------------------------------------------------
    # SCORE
    # --------------------------------------------------------

    ranked_candidates = []


    for candidate in qualified_candidates:

        symbol = candidate.get(
            "symbol"
        )


        candidate[
            "indicator_intelligence"
        ] = get_indicator_intelligence(
            symbol
        )


        candidate[
            "scanner_persistence"
        ] = get_scanner_persistence(
            symbol
        )


        candidate[
            "daily_brief_ranking"
        ] = calculate_daily_brief_score(
            candidate
        )


        ranked_candidates.append(
            candidate
        )


    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    ranked_candidates.sort(

        key=lambda stock: (

            -stock[
                "daily_brief_ranking"
            ][
                "total_score"
            ],

            -stock[
                "daily_brief_ranking"
            ][
                "participation_points"
            ],

            -stock[
                "daily_brief_ranking"
            ][
                "persistence_points"
            ],

            -stock[
                "daily_brief_ranking"
            ][
                "position_points"
            ],

            -stock[
                "daily_brief_ranking"
            ][
                "higher_low_points"
            ],

            -stock[
                "daily_brief_ranking"
            ][
                "touch_points"
            ],

            stock.get(
                "symbol",
                ""
            )

        )

    )


    # --------------------------------------------------------
    # COMPETITION RANK
    # --------------------------------------------------------

    previous_score = None
    current_rank = 0


    for index, candidate in enumerate(
        ranked_candidates,
        start=1
    ):

        score = candidate[
            "daily_brief_ranking"
        ][
            "total_score"
        ]


        if score != previous_score:

            current_rank = index


        candidate[
            "daily_brief_rank"
        ] = current_rank


        previous_score = score


    # --------------------------------------------------------
    # TOP 20 + ALL TIES
    # --------------------------------------------------------

    if (
        len(
            ranked_candidates
        )
        <=
        TARGET_TOP_CANDIDATES
    ):

        final_candidates = (
            ranked_candidates
        )


        cutoff_score = None


    else:

        cutoff_score = (

            ranked_candidates[
                TARGET_TOP_CANDIDATES
                -
                1
            ][
                "daily_brief_ranking"
            ][
                "total_score"
            ]

        )


        final_candidates = [

            candidate

            for candidate
            in ranked_candidates

            if candidate[
                "daily_brief_ranking"
            ][
                "total_score"
            ]
            >=
            cutoff_score

        ]


    # --------------------------------------------------------
    # PRINT FULL RANKING
    # --------------------------------------------------------

    print()
    print("===================================")
    print("DAILY BRIEF RANKING")
    print("===================================")
    print()


    print(
        f"Qualified candidates    : "
        f"{len(qualified_candidates)}"
    )


    print(
        f"Target top candidates   : "
        f"{TARGET_TOP_CANDIDATES}"
    )


    if cutoff_score is not None:

        print(
            f"Cutoff score            : "
            f"{cutoff_score}"
        )


    print(
        f"Selected including ties : "
        f"{len(final_candidates)}"
    )


    print()


    print(
        "RANK | SYMBOL | TYPE         | FINAL | "
        "BASE | PART | PERS | VOL | PARTICIPATION"
    )


    print(
        "------------------------------------------------"
        "----------------------------"
    )


    for candidate in ranked_candidates:

        ranking = candidate[
            "daily_brief_ranking"
        ]


        state = (
            ranking.get(
                "participation_state"
            )
            or
            "NO_DATA"
        )


        print(

            f"{candidate['daily_brief_rank']:>4} | "

            f"{candidate['symbol']:<6} | "

            f"{ranking['scanner_type']:<12} | "

            f"{ranking['total_score']:>5} | "

            f"{ranking['structural_score']:>4} | "

            f"{ranking['participation_points']:>+4} | "

            f"{ranking['persistence_points']:>+4} | "

            f"{ranking['volume_points']:>3} | "

            f"{state}"

        )


    # --------------------------------------------------------
    # SELECTED GROUP
    # --------------------------------------------------------

    print()
    print("===================================")
    print("SELECTED FOR DAILY BRIEF RESEARCH")
    print("===================================")
    print()


    for candidate in final_candidates:

        ranking = candidate[
            "daily_brief_ranking"
        ]


        distance = ranking[
            "distance_from_resistance_percent"
        ]


        relative_volume = ranking[
            "relative_volume"
        ]


        scanner_type = ranking[
            "scanner_type"
        ]


        if distance is None:

            distance_text = (
                "N/A"
            )


        elif scanner_type == "BREAKOUT":

            if distance >= 0:

                distance_text = (
                    f"{distance:.2f}% above"
                )

            else:

                distance_text = (
                    f"{abs(distance):.2f}% below"
                )


        elif distance >= 0:

            distance_text = (
                f"{distance:.2f}% below"
            )


        else:

            distance_text = (
                f"{abs(distance):.2f}% above"
            )


        if relative_volume is None:

            volume_text = (
                "N/A"
            )


        else:

            volume_text = (
                f"{relative_volume:.2f}x"
            )


        participation_state = (

            ranking.get(
                "participation_state"
            )

            or

            "NO_DATA"

        )


        persistence_state = (

            ranking.get(
                "persistence_state"
            )

            or

            "NO_DATA"

        )


        print(

            f"#{candidate['daily_brief_rank']} "

            f"{candidate['symbol']} | "

            f"{scanner_type} | "

            f"Score "
            f"{ranking['total_score']} | "

            f"Base "
            f"{ranking['structural_score']} | "

            f"Participation "
            f"{ranking['participation_points']:+d} "
            f"({participation_state}) | "

            f"Persistence "
            f"{ranking['persistence_points']:+d} "
            f"({persistence_state}; "

            f"{ranking['appearances_last_5_scans']}/"
            f"{ranking['sessions_in_5_scan_window']} "
            f"last scans) | "

            f"Touches "
            f"{ranking['resistance_touches']} | "

            f"Higher Lows "
            f"{ranking['higher_lows']} | "

            f"{distance_text} resistance | "

            f"Volume "
            f"{volume_text}"

        )


    # --------------------------------------------------------
    # INDICATOR STATS
    # --------------------------------------------------------

    indicator_data_available = sum(

        1

        for candidate
        in ranked_candidates

        if candidate.get(
            "indicator_intelligence",
            {}
        ).get(
            "available"
        )

    )


    participation_state_counts = {}


    for candidate in ranked_candidates:

        state = candidate.get(
            "daily_brief_ranking",
            {}
        ).get(
            "participation_state"
        )


        if not state:

            state = (
                "NO_DATA"
            )


        participation_state_counts[
            state
        ] = (

            participation_state_counts.get(
                state,
                0
            )

            +

            1

        )


    # --------------------------------------------------------
    # PERSISTENCE STATS
    # --------------------------------------------------------

    persistence_state_counts = {}


    for candidate in ranked_candidates:

        state = candidate.get(
            "daily_brief_ranking",
            {}
        ).get(
            "persistence_state"
        )


        if not state:

            state = (
                "NO_DATA"
            )


        persistence_state_counts[
            state
        ] = (

            persistence_state_counts.get(
                state,
                0
            )

            +

            1

        )


    # --------------------------------------------------------
    # SAVE CANDIDATES
    # --------------------------------------------------------

    save_json(
        OUTPUT_FILE,
        final_candidates
    )


    # --------------------------------------------------------
    # SAVE STATS
    # --------------------------------------------------------

    daily_brief_stats = {

        "technical_setups_found":
            starting_total,

        "breakout_setups_found":
            len(
                breakouts
            ),

        "pre_breakout_setups_found":
            len(
                prebreakouts
            ),

        "forwarded_for_ai_research":
            len(
                final_candidates
            ),

        "indicator_data_available":
            indicator_data_available,

        "participation_state_counts":
            participation_state_counts,

        "scanner_sessions_available":
            len(
                GLOBAL_SCAN_SESSIONS
            ),

        "persistence_state_counts":
            persistence_state_counts,

        "launch_pad_included":
            False

    }


    save_json(
        STATS_OUTPUT_FILE,
        daily_brief_stats
    )


    # --------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------

    tie_extras = max(

        0,

        len(
            final_candidates
        )

        -

        TARGET_TOP_CANDIDATES

    )


    print()
    print("===================================")
    print("FINAL DAILY BRIEF POOL")
    print("===================================")
    print()


    print(
        f"Started with             : "
        f"{starting_total}"
    )


    print(
        f"Pre-Breakout liquidity   : "
        f"{len(prebreakout_liquidity_removed)} removed"
    )


    print(
        f"Pre-Breakout >5% away    : "
        f"{len(prebreakout_proximity_removed)} removed"
    )


    print(
        f"Stale breakouts          : "
        f"{total_stale_removed} removed"
    )


    print(
        f"Saved by 2x volume       : "
        f"{len(all_volume_exceptions)}"
    )


    print(
        f"Special securities       : "
        f"{len(weird_security_removed)} removed"
    )


    print(
        f"Duplicates merged        : "
        f"{duplicates_removed}"
    )


    print(
        f"Banks removed            : "
        f"{len(bank_removed)}"
    )


    print(
        f"Property/REIT removed    : "
        f"{len(property_removed)}"
    )


    print(
        f"Profile failures         : "
        f"{len(profile_failures)}"
    )


    print()
    print("INDICATOR INTELLIGENCE")
    print("-----------------------------------")


    print(
        f"Indicator history symbols : "
        f"{len(indicator_history)}"
    )


    print(
        f"Candidates with data      : "
        f"{indicator_data_available}"
    )


    for state, count in sorted(
        participation_state_counts.items()
    ):

        print(
            f"{state:<26}: "
            f"{count}"
        )


    print()
    print("SCANNER PERSISTENCE")
    print("-----------------------------------")


    print(
        f"Saved scan sessions       : "
        f"{len(GLOBAL_SCAN_SESSIONS)}"
    )


    for state, count in sorted(
        persistence_state_counts.items()
    ):

        print(
            f"{state:<26}: "
            f"{count}"
        )


    print()
    print("RANKING")
    print("-----------------------------------")


    print(
        f"Qualified before ranking : "
        f"{len(qualified_candidates)}"
    )


    print(
        f"Target                   : "
        f"{TARGET_TOP_CANDIDATES}"
    )


    if cutoff_score is not None:

        print(
            f"20th-place score         : "
            f"{cutoff_score}"
        )


    print(
        f"Extra stocks from tie    : "
        f"{tie_extras}"
    )


    print()
    print("-----------------------------------")


    print(
        f"FINAL CANDIDATES         : "
        f"{len(final_candidates)}"
    )


    print("-----------------------------------")
    print()


    print(
        f"✅ Saved candidates to "
        f"{OUTPUT_FILE}"
    )


    print(
        f"✅ Saved stats to "
        f"{STATS_OUTPUT_FILE}"
    )


    print(
        f"✅ Profile cache: "
        f"{PROFILE_CACHE_FILE}"
    )


    print()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()