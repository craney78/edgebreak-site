import json
import time
import requests


# ===================================
# TWELVE DATA
# ===================================

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"


# ===================================
# FILES
# ===================================

BREAKOUT_FILE = "breakout_scanner.json"
PREBREAKOUT_FILE = "scanner_database.json"

OUTPUT_FILE = "daily_brief_candidates.json"
PROFILE_CACHE_FILE = "daily_brief_profile_cache.json"


# ===================================
# DAILY BRIEF FILTER SETTINGS
# ===================================

MIN_AVERAGE_VOLUME = 100_000
MIN_AVERAGE_DOLLAR_VOLUME = 1_000_000

MAX_PREBREAKOUT_DISTANCE = 5.0

MAX_ABOVE_RESISTANCE = 15.0

HIGH_VOLUME_EXCEPTION = 2.0

PROFILE_SLEEP_TIME = 0.5


# ===================================
# RANKING SETTINGS
# ===================================
#
# Rank every stock surviving the hard
# culls.
#
# Normally save TOP 20.
#
# IMPORTANT:
# If multiple stocks tie with the score
# of stock #20, ALL stocks with that
# score are retained.
#
# Example:
#
# #19 = 72
# #20 = 70
# #21 = 70
# #22 = 70
# #23 = 68
#
# Output = 22 stocks.
# ===================================

TARGET_TOP_CANDIDATES = 20


# ===================================
# BANK / PROPERTY FILTER WORDS
# ===================================

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


# ===================================
# SPECIAL NASDAQ SECURITY SUFFIXES
# ===================================

SPECIAL_SECURITY_SUFFIXES = {

    "W": "Warrant",
    "R": "Rights",
    "U": "Units",
    "P": "Preferred",
    "C": "Convertible",
    "Q": "Bankruptcy",
    "V": "When Issued",
    "X": "Fund / Special Security"

}


# ===================================
# LOAD JSON
# ===================================

def load_json(filename, default=None):

    if default is None:
        default = []

    try:

        with open(
            filename,
            "r"
        ) as f:

            return json.load(f)

    except FileNotFoundError:

        print(
            f"File not found: {filename}"
        )

        return default

    except Exception as e:

        print(
            f"Could not load "
            f"{filename}: {e}"
        )

        return default


# ===================================
# SAVE JSON
# ===================================

def save_json(filename, data):

    with open(
        filename,
        "w"
    ) as f:

        json.dump(
            data,
            f,
            indent=4
        )


# ===================================
# SAFE NUMBER
# ===================================

def safe_number(
    value,
    default=0
):

    try:

        return float(value)

    except (
        TypeError,
        ValueError
    ):

        return default


# ===================================
# LIQUIDITY CHECK
# ===================================

def passes_liquidity(stock):

    average_volume = safe_number(
        stock.get(
            "average_volume_20",
            0
        )
    )

    average_dollar_volume = safe_number(
        stock.get(
            "average_dollar_volume_20",
            0
        )
    )

    return (
        average_volume >=
        MIN_AVERAGE_VOLUME

        and

        average_dollar_volume >=
        MIN_AVERAGE_DOLLAR_VOLUME
    )


# ===================================
# GET CURRENT PRICE
# ===================================

def get_current_price(stock):

    price = safe_number(
        stock.get(
            "price",
            0
        )
    )

    if price > 0:
        return price

    return 0


# ===================================
# GET RESISTANCE
# ===================================

def get_resistance(stock):

    resistance_high = safe_number(
        stock.get(
            "resistance_high",
            0
        )
    )

    if resistance_high > 0:
        return resistance_high


    resistance = safe_number(
        stock.get(
            "resistance",
            0
        )
    )

    if resistance > 0:
        return resistance


    return 0


# ===================================
# GET RELATIVE VOLUME
# ===================================

def get_relative_volume(stock):

    possible_fields = [

        "volume_ratio",
        "relative_volume",
        "relative_volume_20",
        "relativeVolume",
        "relativeVolume20"

    ]


    for field in possible_fields:

        if field not in stock:
            continue


        value = safe_number(
            stock.get(field),
            0
        )


        return {

            "available":
                True,

            "value":
                value,

            "field":
                field

        }


    return {

        "available":
            False,

        "value":
            0,

        "field":
            None

    }


# ===================================
# PRE-BREAKOUT PROXIMITY CHECK
# ===================================

def check_prebreakout_proximity(stock):

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

        return {

            "remove":
                False,

            "price":
                price,

            "resistance":
                resistance,

            "distance_below_resistance":
                None

        }


    if price >= resistance:

        return {

            "remove":
                False,

            "price":
                price,

            "resistance":
                resistance,

            "distance_below_resistance":
                0

        }


    distance_below_resistance = (
        (
            resistance -
            price
        )
        /
        resistance
    ) * 100


    return {

        "remove":
            distance_below_resistance >
            MAX_PREBREAKOUT_DISTANCE,

        "price":
            price,

        "resistance":
            resistance,

        "distance_below_resistance":
            round(
                distance_below_resistance,
                2
            )

    }


# ===================================
# STALE BREAKOUT CHECK
# ===================================

def check_stale_breakout(stock):

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

        return {

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


    distance_above_resistance = (
        (
            price -
            resistance
        )
        /
        resistance
    ) * 100


    if distance_above_resistance <= 0:

        return {

            "stale":
                False,

            "is_breakout":
                False,

            "price":
                price,

            "resistance":
                resistance,

            "distance_above_resistance":
                round(
                    distance_above_resistance,
                    2
                ),

            "volume_available":
                False,

            "relative_volume":
                0,

            "relative_volume_field":
                None,

            "high_volume_exception":
                False

        }


    volume = get_relative_volume(
        stock
    )


    if (
        distance_above_resistance <=
        MAX_ABOVE_RESISTANCE
    ):

        return {

            "stale":
                False,

            "is_breakout":
                True,

            "price":
                price,

            "resistance":
                resistance,

            "distance_above_resistance":
                round(
                    distance_above_resistance,
                    2
                ),

            "volume_available":
                volume["available"],

            "relative_volume":
                volume["value"],

            "relative_volume_field":
                volume["field"],

            "high_volume_exception":
                False

        }


    high_volume_exception = (

        volume["available"]

        and

        volume["value"] >=
        HIGH_VOLUME_EXCEPTION

    )


    return {

        "stale":
            not high_volume_exception,

        "is_breakout":
            True,

        "price":
            price,

        "resistance":
            resistance,

        "distance_above_resistance":
            round(
                distance_above_resistance,
                2
            ),

        "volume_available":
            volume["available"],

        "relative_volume":
            volume["value"],

        "relative_volume_field":
            volume["field"],

        "high_volume_exception":
            high_volume_exception

    }


# ===================================
# APPLY STALE BREAKOUT CULL
# ===================================

def apply_stale_breakout_cull(
    stocks,
    scanner_name
):

    survivors = []
    removed = []
    volume_exceptions = []


    for stock in stocks:

        result = check_stale_breakout(
            stock
        )

        symbol = stock.get(
            "symbol"
        )


        if result["stale"]:

            removed.append({

                "symbol":
                    symbol,

                "scanner":
                    scanner_name,

                "price":
                    result["price"],

                "resistance":
                    result["resistance"],

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
                    ],

                "relative_volume_field":
                    result[
                        "relative_volume_field"
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

                "price":
                    result["price"],

                "resistance":
                    result["resistance"],

                "distance_above_resistance":
                    result[
                        "distance_above_resistance"
                    ],

                "relative_volume":
                    result[
                        "relative_volume"
                    ],

                "relative_volume_field":
                    result[
                        "relative_volume_field"
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


# ===================================
# SPECIAL SECURITY CHECK
# ===================================

def get_special_security_reason(symbol):

    if not symbol:
        return None


    symbol = str(
        symbol
    ).strip().upper()


    if len(symbol) <= 4:
        return None


    suffix = symbol[-1]


    if suffix in SPECIAL_SECURITY_SUFFIXES:

        return SPECIAL_SECURITY_SUFFIXES[
            suffix
        ]


    return None


# ===================================
# LOAD SCANNER RESULTS
# ===================================

breakouts = load_json(
    BREAKOUT_FILE,
    []
)

prebreakouts = load_json(
    PREBREAKOUT_FILE,
    []
)


print()
print("===================================")
print("EDGEBREAK DAILY BRIEF CULL")
print("===================================")
print()

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


starting_total = (
    len(breakouts)
    +
    len(prebreakouts)
)


print()

print(
    f"Starting results     : "
    f"{starting_total}"
)


# ===================================
# BREAKOUT LIQUIDITY
# ===================================

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
    "NOT AVAILABLE IN JSON"
)

print(
    f"Remaining            : "
    f"{len(breakout_liquidity_survivors)}"
)


# ===================================
# PRE-BREAKOUT LIQUIDITY CULL
# ===================================

prebreakout_liquidity_survivors = []
prebreakout_liquidity_removed = []


for stock in prebreakouts:

    average_volume = safe_number(
        stock.get(
            "average_volume_20",
            0
        )
    )

    average_dollar_volume = safe_number(
        stock.get(
            "average_dollar_volume_20",
            0
        )
    )


    if passes_liquidity(
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
                average_volume,

            "average_dollar_volume_20":
                average_dollar_volume

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


# ===================================
# PRE-BREAKOUT 5% PROXIMITY CULL
# ===================================

prebreakout_proximity_survivors = []
prebreakout_proximity_removed = []


for stock in prebreakout_liquidity_survivors:

    result = check_prebreakout_proximity(
        stock
    )


    if result["remove"]:

        prebreakout_proximity_removed.append({

            "symbol":
                stock.get(
                    "symbol"
                ),

            "price":
                result["price"],

            "resistance":
                result["resistance"],

            "distance_below_resistance":
                result[
                    "distance_below_resistance"
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


if prebreakout_proximity_removed:

    print()
    print("PRE-BREAKOUTS >5% FROM RESISTANCE")
    print("-----------------------------------")


    for stock in prebreakout_proximity_removed:

        print(
            f"{stock['symbol']} | "
            f"Price ${stock['price']:.2f} | "
            f"Resistance ${stock['resistance']:.2f} | "
            f"{stock['distance_below_resistance']:.2f}% below"
        )


# ===================================
# STALE BREAKOUT CULL
# ===================================

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
    len(breakout_stale_removed)
    +
    len(prebreakout_stale_removed)
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


# ===================================
# SHOW STALE STOCKS
# ===================================

all_stale_removed = (
    breakout_stale_removed
    +
    prebreakout_stale_removed
)


if all_stale_removed:

    print()
    print("STALE BREAKOUTS REMOVED")
    print("-----------------------------------")


    for stock in all_stale_removed:

        if stock["volume_available"]:

            volume_text = (
                f"{stock['relative_volume']:.2f}x"
            )

        else:

            volume_text = "N/A"


        print(
            f"{stock['symbol']} | "
            f"{stock['scanner']} | "
            f"Price ${stock['price']:.2f} | "
            f"Resistance ${stock['resistance']:.2f} | "
            f"{stock['distance_above_resistance']:.2f}% above | "
            f"Volume {volume_text}"
        )


# ===================================
# SHOW 2X VOLUME EXCEPTIONS
# ===================================

if all_volume_exceptions:

    print()
    print("KEPT DESPITE >15% — 2X VOLUME")
    print("-----------------------------------")


    for stock in all_volume_exceptions:

        print(
            f"{stock['symbol']} | "
            f"{stock['scanner']} | "
            f"{stock['distance_above_resistance']:.2f}% "
            f"above resistance | "
            f"Volume "
            f"{stock['relative_volume']:.2f}x"
        )


# ===================================
# COMBINE SURVIVORS
# ===================================

combined = []


for stock in breakout_survivors:

    combined.append({

        "symbol":
            stock.get(
                "symbol"
            ),

        "scanners":
            ["BREAKOUT"],

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
            ["PRE_BREAKOUT"],

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


# ===================================
# SPECIAL SECURITY CULL
# ===================================

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


if weird_security_removed:

    print()
    print("SPECIAL SECURITIES REMOVED")
    print("-----------------------------------")


    for stock in weird_security_removed:

        scanner_text = ", ".join(
            stock.get(
                "scanners",
                []
            )
        )


        print(
            f"{stock['symbol']} | "
            f"{stock['reason']} | "
            f"{scanner_text}"
        )


# ===================================
# MERGE DUPLICATE SYMBOLS
# ===================================

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

        merged[symbol] = {

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
    len(normal_security_candidates)
    -
    len(merged_candidates)
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


# ===================================
# LOAD PROFILE CACHE
# ===================================

profile_cache = load_json(
    PROFILE_CACHE_FILE,
    {}
)


# ===================================
# FETCH TWELVE DATA PROFILE
# ===================================

def fetch_profile(symbol):

    if symbol in profile_cache:

        return profile_cache[
            symbol
        ]


    url = (
        "https://api.twelvedata.com/profile"
        f"?symbol={symbol}"
        f"&apikey={API_KEY}"
    )


    try:

        response = requests.get(
            url,
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
            ) == "error"
        ):

            print(
                f"Profile failed: {symbol}"
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


    except Exception as e:

        print(
            f"Profile error "
            f"{symbol}: {e}"
        )

        return None


# ===================================
# BANK / PROPERTY CHECK
# ===================================

def get_exclusion_reason(profile):

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
        + " "
        + industry
        + " "
        + stock_type
    )


    for keyword in BANK_KEYWORDS:

        if keyword in industry:
            return "BANK"


    for keyword in PROPERTY_KEYWORDS:

        if keyword in combined_text:
            return "PROPERTY"


    return None


# ===================================
# PROFILE CULL
# ===================================

print()
print("-----------------------------------")
print("BANK / PROPERTY CULL")
print("-----------------------------------")
print()


qualified_candidates = []

bank_removed = []

property_removed = []

profile_failures = []


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


# ===================================
# RANKING HELPERS
# ===================================

def get_primary_stock(candidate):

    if candidate.get(
        "breakout"
    ):

        return (
            candidate["breakout"],
            "BREAKOUT"
        )


    if candidate.get(
        "pre_breakout"
    ):

        return (
            candidate["pre_breakout"],
            "PRE_BREAKOUT"
        )


    return (
        {},
        "UNKNOWN"
    )


# ===================================
# GRADE SCORE
# ===================================
#
# Maximum = 25
# ===================================

def score_grade(stock):

    grade = str(
        stock.get(
            "grade",
            ""
        )
    ).strip().upper()


    grade_scores = {

        "A+": 25,
        "A": 22,
        "A-": 20,

        "B+": 18,
        "B": 15,
        "B-": 12,

        "C+": 9,
        "C": 6,
        "C-": 3

    }


    return grade_scores.get(
        grade,
        0
    )


# ===================================
# RESISTANCE TOUCH SCORE
# ===================================
#
# Maximum = 20
#
# More established resistance receives
# more points, but the score is capped
# so one metric cannot dominate.
# ===================================

def score_touches(stock):

    touches = safe_number(
        stock.get(
            "touches",
            stock.get(
                "resistance_touches",
                0
            )
        )
    )


    if touches >= 6:
        return 20

    if touches == 5:
        return 18

    if touches == 4:
        return 16

    if touches == 3:
        return 13

    if touches == 2:
        return 9

    if touches == 1:
        return 4

    return 0


# ===================================
# HIGHER LOW SCORE
# ===================================
#
# Maximum = 20
# ===================================

def score_higher_lows(stock):

    higher_lows = safe_number(
        stock.get(
            "higher_lows",
            0
        )
    )


    if higher_lows >= 4:
        return 20

    if higher_lows == 3:
        return 18

    if higher_lows == 2:
        return 15

    if higher_lows == 1:
        return 8

    return 0


# ===================================
# PRICE POSITION SCORE
# ===================================
#
# Maximum = 25
#
# BREAKOUT:
# Reward a fresh breakout close to
# resistance.
#
# PRE-BREAKOUT:
# Reward a stock approaching resistance.
#
# This means both scanner types can
# compete fairly without simply giving
# every Breakout a huge fixed bonus.
# ===================================

def score_price_position(
    stock,
    scanner_type
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


    distance_percent = (
        (
            price -
            resistance
        )
        /
        resistance
    ) * 100


    # ===================================
    # BREAKOUT
    # ===================================

    if scanner_type == "BREAKOUT":

        distance_above = max(
            distance_percent,
            0
        )


        # Sweet spot:
        # freshly through resistance.

        if (
            distance_above >= 0
            and
            distance_above <= 2
        ):

            return (
                25,
                round(
                    distance_percent,
                    2
                )
            )


        if distance_above <= 4:

            return (
                22,
                round(
                    distance_percent,
                    2
                )
            )


        if distance_above <= 6:

            return (
                18,
                round(
                    distance_percent,
                    2
                )
            )


        if distance_above <= 10:

            return (
                13,
                round(
                    distance_percent,
                    2
                )
            )


        if distance_above <= 15:

            return (
                7,
                round(
                    distance_percent,
                    2
                )
            )


        return (
            0,
            round(
                distance_percent,
                2
            )
        )


    # ===================================
    # PRE-BREAKOUT
    # ===================================

    distance_below = abs(
        min(
            distance_percent,
            0
        )
    )


    # If scanner still calls it
    # Pre-Breakout but it has crossed
    # resistance slightly, treat it as
    # extremely close.

    if distance_percent >= 0:

        if distance_percent <= 2:

            return (
                25,
                round(
                    distance_percent,
                    2
                )
            )

        if distance_percent <= 5:

            return (
                20,
                round(
                    distance_percent,
                    2
                )
            )

        return (
            10,
            round(
                distance_percent,
                2
            )
        )


    if distance_below <= 1:

        return (
            25,
            round(
                distance_percent,
                2
            )
        )


    if distance_below <= 2:

        return (
            22,
            round(
                distance_percent,
                2
            )
        )


    if distance_below <= 3:

        return (
            18,
            round(
                distance_percent,
                2
            )
        )


    if distance_below <= 4:

        return (
            14,
            round(
                distance_percent,
                2
            )
        )


    if distance_below <= 5:

        return (
            10,
            round(
                distance_percent,
                2
            )
        )


    return (
        0,
        round(
            distance_percent,
            2
        )
    )


# ===================================
# VOLUME SCORE
# ===================================
#
# Maximum = 10
#
# Only score volume when genuine
# relative-volume information exists.
#
# Missing volume data receives zero,
# but is NOT otherwise penalised.
# ===================================

def score_volume(stock):

    volume = get_relative_volume(
        stock
    )


    if not volume[
        "available"
    ]:

        return (
            0,
            None
        )


    ratio = volume[
        "value"
    ]


    if ratio >= 2.0:

        return (
            10,
            ratio
        )


    if ratio >= 1.5:

        return (
            8,
            ratio
        )


    if ratio >= 1.0:

        return (
            6,
            ratio
        )


    if ratio >= 0.75:

        return (
            4,
            ratio
        )


    if ratio >= 0.5:

        return (
            2,
            ratio
        )


    return (
        0,
        ratio
    )


# ===================================
# CALCULATE DAILY BRIEF SCORE
# ===================================
#
# TOTAL POSSIBLE = 100
#
# Grade             25
# Resistance Touch  20
# Higher Lows       20
# Price Position    25
# Volume            10
# --------------------
# TOTAL             100
# ===================================

def calculate_daily_brief_score(
    candidate
):

    stock, scanner_type = (
        get_primary_stock(
            candidate
        )
    )


    grade_points = score_grade(
        stock
    )


    touch_points = score_touches(
        stock
    )


    higher_low_points = (
        score_higher_lows(
            stock
        )
    )


    (
        position_points,
        distance_percent
    ) = score_price_position(
        stock,
        scanner_type
    )


    (
        volume_points,
        relative_volume
    ) = score_volume(
        stock
    )


    total_score = (
        grade_points
        +
        touch_points
        +
        higher_low_points
        +
        position_points
        +
        volume_points
    )


    return {

        "total_score":
            int(
                total_score
            ),

        "scanner_type":
            scanner_type,

        "grade_points":
            grade_points,

        "touch_points":
            touch_points,

        "higher_low_points":
            higher_low_points,

        "position_points":
            position_points,

        "volume_points":
            volume_points,

        "distance_from_resistance_percent":
            distance_percent,

        "relative_volume":
            relative_volume

    }


# ===================================
# RANK ALL QUALIFIED CANDIDATES
# ===================================

ranked_candidates = []


for candidate in qualified_candidates:

    ranking = (
        calculate_daily_brief_score(
            candidate
        )
    )


    candidate[
        "daily_brief_ranking"
    ] = ranking


    ranked_candidates.append(
        candidate
    )


# ===================================
# SORT
# ===================================
#
# Primary sort:
# Highest total score.
#
# Tie sorting only determines display
# order inside the tied score group.
#
# It DOES NOT remove tied stocks.
# ===================================

ranked_candidates.sort(

    key=lambda stock: (

        -stock[
            "daily_brief_ranking"
        ][
            "total_score"
        ],

        0
        if stock[
            "daily_brief_ranking"
        ][
            "scanner_type"
        ] == "BREAKOUT"
        else 1,

        stock.get(
            "symbol",
            ""
        )

    )

)


# ===================================
# ASSIGN RANK NUMBERS
# ===================================
#
# Stocks with the same score receive
# the same ranking number.
#
# Example:
#
# 1 = 90
# 2 = 88
# 2 = 88
# 4 = 85
# ===================================

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


# ===================================
# TOP 20 + TIES
# ===================================

if (
    len(ranked_candidates) <=
    TARGET_TOP_CANDIDATES
):

    final_candidates = (
        ranked_candidates
    )

    cutoff_score = None


else:

    cutoff_score = (
        ranked_candidates[
            TARGET_TOP_CANDIDATES - 1
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
        ] >= cutoff_score

    ]


# ===================================
# PRINT FULL RANKING
# ===================================

print()
print("===================================")
print("DAILY BRIEF TECHNICAL RANKING")
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
    "RANK | SYMBOL | TYPE | SCORE | "
    "GRADE | TOUCH | LOWS | POSITION | VOLUME"
)

print(
    "------------------------------------------------"
    "----------------------------"
)


for candidate in ranked_candidates:

    ranking = candidate[
        "daily_brief_ranking"
    ]


    print(
        f"{candidate['daily_brief_rank']:>4} | "
        f"{candidate['symbol']:<6} | "
        f"{ranking['scanner_type']:<12} | "
        f"{ranking['total_score']:>3} | "
        f"{ranking['grade_points']:>2} | "
        f"{ranking['touch_points']:>2} | "
        f"{ranking['higher_low_points']:>2} | "
        f"{ranking['position_points']:>2} | "
        f"{ranking['volume_points']:>2}"
    )


# ===================================
# PRINT SELECTED GROUP
# ===================================

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


    if distance is None:

        distance_text = "N/A"

    elif distance >= 0:

        distance_text = (
            f"{distance:.2f}% above"
        )

    else:

        distance_text = (
            f"{abs(distance):.2f}% below"
        )


    if relative_volume is None:

        volume_text = "N/A"

    else:

        volume_text = (
            f"{relative_volume:.2f}x"
        )


    print(
        f"#{candidate['daily_brief_rank']} "
        f"{candidate['symbol']} | "
        f"{ranking['scanner_type']} | "
        f"Score {ranking['total_score']}/100 | "
        f"{distance_text} resistance | "
        f"Volume {volume_text}"
    )


# ===================================
# SAVE ONLY TOP-RANKED GROUP
# ===================================

save_json(
    OUTPUT_FILE,
    final_candidates
)


# ===================================
# FINAL SUMMARY
# ===================================

print()
print("===================================")
print("FINAL DAILY BRIEF POOL")
print("===================================")
print()

print(
    f"Started with             : "
    f"{starting_total}"
)


print()
print("SCANNERS")
print("-----------------------------------")

print(
    f"Breakouts loaded         : "
    f"{len(breakouts)}"
)

print(
    f"Pre-Breakouts loaded     : "
    f"{len(prebreakouts)}"
)

print(
    "Launch Pad               : EXCLUDED"
)


print()
print("LIQUIDITY")
print("-----------------------------------")

print(
    f"Pre-Breakout removed     : "
    f"{len(prebreakout_liquidity_removed)}"
)

print(
    "Breakout liquidity       : N/A"
)


print()
print("PRE-BREAKOUT PROXIMITY")
print("-----------------------------------")

print(
    f"Removed >5% away         : "
    f"{len(prebreakout_proximity_removed)}"
)


print()
print("STALE BREAKOUTS")
print("-----------------------------------")

print(
    f"Breakout stale removed   : "
    f"{len(breakout_stale_removed)}"
)

print(
    f"Pre-Breakout stale       : "
    f"{len(prebreakout_stale_removed)}"
)

print(
    f"Total stale removed      : "
    f"{total_stale_removed}"
)

print(
    f"Saved by 2x volume       : "
    f"{len(all_volume_exceptions)}"
)


print()
print("OTHER CULLS")
print("-----------------------------------")

print(
    f"Special securities       : "
    f"{len(weird_security_removed)}"
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


tie_extras = max(
    0,
    len(final_candidates)
    -
    TARGET_TOP_CANDIDATES
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


# ===================================
# SPECIAL SECURITIES REMOVED
# ===================================

if weird_security_removed:

    print()
    print("SPECIAL SECURITIES REMOVED")
    print("-----------------------------------")


    for stock in weird_security_removed:

        scanner_text = ", ".join(
            stock.get(
                "scanners",
                []
            )
        )


        print(
            f"{stock['symbol']} | "
            f"{stock['reason']} | "
            f"{scanner_text}"
        )


# ===================================
# BANKS REMOVED
# ===================================

if bank_removed:

    print()
    print("BANKS REMOVED")
    print("-----------------------------------")


    for stock in bank_removed:

        print(
            f"{stock['symbol']} | "
            f"{stock['name']} | "
            f"{stock['industry']}"
        )


# ===================================
# PROPERTY REMOVED
# ===================================

if property_removed:

    print()
    print("PROPERTY / REIT REMOVED")
    print("-----------------------------------")


    for stock in property_removed:

        print(
            f"{stock['symbol']} | "
            f"{stock['name']} | "
            f"{stock['industry']}"
        )


# ===================================
# PROFILE FAILURES
# ===================================

if profile_failures:

    print()
    print("PROFILE LOOKUPS FAILED")
    print("-----------------------------------")


    for symbol in profile_failures:

        print(
            symbol
        )


print()

print(
    f"Saved TOP RANKED candidates to "
    f"{OUTPUT_FILE}"
)

print(
    f"Profile cache saved to "
    f"{PROFILE_CACHE_FILE}"
)

print()