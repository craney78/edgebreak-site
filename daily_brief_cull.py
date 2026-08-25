import json
import time
import requests


# ============================================================
# EDGEBREAK DAILY BRIEF CULL
# ============================================================
#
# PIPELINE
#
# Breakout Scanner
#       +
# Pre-Breakout Scanner
#       ↓
# Liquidity / proximity / stale breakout culls
#       ↓
# Special security cull
#       ↓
# Duplicate merge
#       ↓
# Bank / Property / REIT cull
#       ↓
# Technical ranking
#       ↓
# TOP 20 + ALL TIES AT #20
#       ↓
# daily_brief_candidates.json
#
# Launch Pad is deliberately EXCLUDED from the Daily Brief.
#
# ============================================================


# ============================================================
# TWELVE DATA
# ============================================================

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"


# ============================================================
# FILES
# ============================================================

BREAKOUT_FILE = "breakout_scanner.json"
PREBREAKOUT_FILE = "scanner_database.json"

OUTPUT_FILE = "daily_brief_candidates.json"
STATS_OUTPUT_FILE = "daily_brief_stats.json"
PROFILE_CACHE_FILE = "daily_brief_profile_cache.json"


# ============================================================
# HARD CULL SETTINGS
# ============================================================

MIN_AVERAGE_VOLUME = 100_000
MIN_AVERAGE_DOLLAR_VOLUME = 1_000_000

# Pre-Breakout must be within 5% of resistance.
MAX_PREBREAKOUT_DISTANCE = 5.0

# A stock already >15% through resistance is considered stale.
MAX_ABOVE_RESISTANCE = 15.0

# Exception for >15% breakout if genuine relative volume >=2x.
HIGH_VOLUME_EXCEPTION = 2.0

PROFILE_SLEEP_TIME = 0.5


# ============================================================
# RANKING SETTINGS
# ============================================================

TARGET_TOP_CANDIDATES = 20


# ============================================================
# BANK / PROPERTY FILTER WORDS
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


# ============================================================
# SPECIAL NASDAQ SECURITY SUFFIXES
# ============================================================

SPECIAL_SECURITY_SUFFIXES = {
    "W": "Warrant",
    "R": "Rights",
    "U": "Units",
    "P": "Preferred",
    "Q": "Bankruptcy",
    "V": "When Issued"
}


# ============================================================
# JSON HELPERS
# ============================================================

def load_json(filename, default=None):

    if default is None:
        default = []

    try:

        with open(
            filename,
            "r",
            encoding="utf-8"
        ) as f:

            return json.load(f)

    except FileNotFoundError:

        print(
            f"File not found: {filename}"
        )

        return default

    except Exception as e:

        print(
            f"Could not load {filename}: {e}"
        )

        return default


def save_json(filename, data):

    with open(
        filename,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            data,
            f,
            indent=4,
            ensure_ascii=False
        )


# ============================================================
# NUMBER HELPER
# ============================================================

def safe_number(value, default=0):

    try:

        if value is None:
            return default

        return float(value)

    except (
        TypeError,
        ValueError
    ):

        return default


# ============================================================
# SCANNER TYPE HELPERS
# ============================================================

def get_scanner_stock(candidate):

    if candidate.get("breakout"):

        return (
            candidate["breakout"],
            "BREAKOUT"
        )

    if candidate.get("pre_breakout"):

        return (
            candidate["pre_breakout"],
            "PRE_BREAKOUT"
        )

    return (
        {},
        "UNKNOWN"
    )


# ============================================================
# PRICE HELPER
# ============================================================

def get_current_price(stock):

    # Breakout scanner
    price = safe_number(
        stock.get("price"),
        0
    )

    if price > 0:
        return price

    # Pre-Breakout scanner
    price = safe_number(
        stock.get("current_price"),
        0
    )

    if price > 0:
        return price

    return 0


# ============================================================
# RESISTANCE HELPER
# ============================================================

def get_resistance(stock):

    # Pre-Breakout scanner
    resistance = safe_number(
        stock.get("resistance_price"),
        0
    )

    if resistance > 0:
        return resistance

    # Breakout scanner
    resistance = safe_number(
        stock.get("resistance"),
        0
    )

    if resistance > 0:
        return resistance

    # Compatibility
    resistance = safe_number(
        stock.get("resistance_high"),
        0
    )

    if resistance > 0:
        return resistance

    return 0


# ============================================================
# RESISTANCE TOUCHES
# ============================================================

def get_resistance_touches(stock):

    # Breakout
    touches = safe_number(
        stock.get("touches"),
        -1
    )

    if touches >= 0:
        return touches

    # Pre-Breakout
    touches = safe_number(
        stock.get("resistance_touches"),
        0
    )

    return touches


# ============================================================
# HIGHER LOWS
# ============================================================

def get_higher_lows(stock):

    return safe_number(
        stock.get("higher_lows"),
        0
    )


# ============================================================
# RELATIVE VOLUME
# ============================================================

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
            "available": True,
            "value": value,
            "field": field
        }

    return {
        "available": False,
        "value": 0,
        "field": None
    }


# ============================================================
# PRE-BREAKOUT DISTANCE
# ============================================================

def get_prebreakout_distance(stock):

    # --------------------------------------------------------
    # BEST SOURCE:
    # scanner_database.json already calculates this.
    #
    # Example:
    #
    # "current_price": 81.05
    # "resistance_price": 85.2
    # "distance_to_resistance": 4.87
    #
    # --------------------------------------------------------

    if stock.get("distance_to_resistance") is not None:

        distance = safe_number(
            stock.get("distance_to_resistance"),
            None
        )

        if distance is not None:
            return distance

    # --------------------------------------------------------
    # Fallback: calculate it ourselves
    # --------------------------------------------------------

    price = get_current_price(stock)
    resistance = get_resistance(stock)

    if (
        price <= 0
        or
        resistance <= 0
    ):

        return None

    distance = (
        (
            resistance - price
        )
        /
        resistance
    ) * 100

    return round(
        distance,
        2
    )


# ============================================================
# PRE-BREAKOUT LIQUIDITY
# ============================================================

def passes_prebreakout_liquidity(stock):

    average_volume = safe_number(
        stock.get("average_volume_20"),
        0
    )

    average_dollar_volume = safe_number(
        stock.get("average_dollar_volume_20"),
        0
    )

    return (
        average_volume >= MIN_AVERAGE_VOLUME
        and
        average_dollar_volume >= MIN_AVERAGE_DOLLAR_VOLUME
    )


# ============================================================
# PRE-BREAKOUT PROXIMITY
# ============================================================

def check_prebreakout_proximity(stock):

    distance = get_prebreakout_distance(
        stock
    )

    price = get_current_price(
        stock
    )

    resistance = get_resistance(
        stock
    )

    # If distance cannot be calculated,
    # don't silently remove the stock.
    if distance is None:

        return {
            "remove": False,
            "distance": None,
            "price": price,
            "resistance": resistance
        }

    # Positive distance means below resistance.
    #
    # 4.87 = 4.87% below resistance.
    #
    # Negative means price has already moved above resistance.
    #
    # Do not remove negative distance here. The stale breakout
    # logic deals with stocks that have moved too far through
    # resistance.

    remove = (
        distance >
        MAX_PREBREAKOUT_DISTANCE
    )

    return {
        "remove": remove,
        "distance": round(distance, 2),
        "price": price,
        "resistance": resistance
    }


# ============================================================
# STALE BREAKOUT CHECK
# ============================================================

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
            "stale": False,
            "is_breakout": False,
            "price": price,
            "resistance": resistance,
            "distance_above_resistance": None,
            "volume_available": False,
            "relative_volume": 0,
            "relative_volume_field": None,
            "high_volume_exception": False
        }

    distance_above = (
        (
            price - resistance
        )
        /
        resistance
    ) * 100

    # Still below resistance.
    if distance_above <= 0:

        return {
            "stale": False,
            "is_breakout": False,
            "price": price,
            "resistance": resistance,
            "distance_above_resistance":
                round(distance_above, 2),
            "volume_available": False,
            "relative_volume": 0,
            "relative_volume_field": None,
            "high_volume_exception": False
        }

    volume = get_relative_volume(
        stock
    )

    # Fresh breakout.
    if distance_above <= MAX_ABOVE_RESISTANCE:

        return {
            "stale": False,
            "is_breakout": True,
            "price": price,
            "resistance": resistance,
            "distance_above_resistance":
                round(distance_above, 2),
            "volume_available":
                volume["available"],
            "relative_volume":
                volume["value"],
            "relative_volume_field":
                volume["field"],
            "high_volume_exception": False
        }

    # More than 15% through resistance.
    high_volume_exception = (
        volume["available"]
        and
        volume["value"] >= HIGH_VOLUME_EXCEPTION
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
            round(distance_above, 2),

        "volume_available":
            volume["available"],

        "relative_volume":
            volume["value"],

        "relative_volume_field":
            volume["field"],

        "high_volume_exception":
            high_volume_exception
    }


# ============================================================
# APPLY STALE BREAKOUT CULL
# ============================================================

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
# SPECIAL SECURITY CHECK
# ============================================================

def get_special_security_reason(symbol):

    if not symbol:
        return None

    symbol = str(
        symbol
    ).strip().upper()

    # Ordinary NASDAQ tickers can legitimately have
    # five letters, so DO NOT remove every ticker >4.
    if len(symbol) <= 4:
        return None

    suffix = symbol[-1]

    if suffix in SPECIAL_SECURITY_SUFFIXES:

        return SPECIAL_SECURITY_SUFFIXES[
            suffix
        ]

    return None


# ============================================================
# LOAD SCANNER FILES
# ============================================================

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


# ============================================================
# BREAKOUT LIQUIDITY
# ============================================================

# Breakout JSON currently does not contain the same
# 20-day liquidity fields as the Pre-Breakout scanner.

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


# ============================================================
# PRE-BREAKOUT LIQUIDITY CULL
# ============================================================

prebreakout_liquidity_survivors = []
prebreakout_liquidity_removed = []

for stock in prebreakouts:

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

    if passes_prebreakout_liquidity(
        stock
    ):

        prebreakout_liquidity_survivors.append(
            stock
        )

    else:

        prebreakout_liquidity_removed.append({
            "symbol":
                stock.get("symbol"),

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


# ============================================================
# PRE-BREAKOUT 5% PROXIMITY CULL
# ============================================================

prebreakout_proximity_survivors = []
prebreakout_proximity_removed = []

for stock in prebreakout_liquidity_survivors:

    result = check_prebreakout_proximity(
        stock
    )

    if result["remove"]:

        prebreakout_proximity_removed.append({
            "symbol":
                stock.get("symbol"),

            "price":
                result["price"],

            "resistance":
                result["resistance"],

            "distance":
                result["distance"]
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

        distance = stock[
            "distance"
        ]

        distance_text = (
            f"{distance:.2f}%"
            if distance is not None
            else "N/A"
        )

        print(
            f"{stock['symbol']} | "
            f"Price ${stock['price']:.2f} | "
            f"Resistance ${stock['resistance']:.2f} | "
            f"{distance_text} below"
        )


# ============================================================
# STALE BREAKOUT CULL
# ============================================================

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


if (
    breakout_stale_removed
    or
    prebreakout_stale_removed
):

    print()
    print("STALE BREAKOUTS REMOVED")
    print("-----------------------------------")

    all_stale = (
        breakout_stale_removed
        +
        prebreakout_stale_removed
    )

    for stock in all_stale:

        if stock[
            "volume_available"
        ]:

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


# ============================================================
# COMBINE SCANNERS
# ============================================================

combined = []

for stock in breakout_survivors:

    combined.append({
        "symbol":
            stock.get("symbol"),

        "scanners":
            ["BREAKOUT"],

        "breakout":
            stock
    })


for stock in prebreakout_survivors:

    combined.append({
        "symbol":
            stock.get("symbol"),

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


# ============================================================
# SPECIAL SECURITY CULL
# ============================================================

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


# ============================================================
# DUPLICATE MERGE
# ============================================================

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


# ============================================================
# PROFILE CACHE
# ============================================================

profile_cache = load_json(
    PROFILE_CACHE_FILE,
    {}
)


# ============================================================
# TWELVE DATA PROFILE
# ============================================================

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
            data.get("status") == "error"
        ):

            print(
                f"Profile failed: {symbol}"
            )

            return None

        profile = {
            "name":
                data.get("name"),

            "sector":
                data.get("sector"),

            "industry":
                data.get("industry"),

            "type":
                data.get("type")
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


# ============================================================
# BANK / PROPERTY CHECK
# ============================================================

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


# ============================================================
# BANK / PROPERTY CULL
# ============================================================

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
            profile.get("name"),

        "sector":
            profile.get("sector"),

        "industry":
            profile.get("industry"),

        "type":
            profile.get("type")
    }

    reason = get_exclusion_reason(
        profile
    )

    if reason == "BANK":

        bank_removed.append({
            "symbol":
                symbol,

            "name":
                profile.get("name"),

            "industry":
                profile.get("industry")
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
                profile.get("name"),

            "industry":
                profile.get("industry")
        })

        print(
            f"   REMOVED PROPERTY: "
            f"{profile.get('industry')}"
        )

        continue

    qualified_candidates.append(
        stock
    )


# ============================================================
# RANKING
# ============================================================
#
# We now rank both scanners using STRUCTURAL factors that
# actually exist in both scanner outputs.
#
#
# RESISTANCE TOUCHES
# ------------------
# Maximum 30 points
#
#
# HIGHER LOWS
# -----------
# Maximum 30 points
#
#
# PRICE POSITION
# --------------
# Maximum 30 points
#
# Breakout:
# reward fresh movement through resistance.
#
# Pre-Breakout:
# reward closeness BELOW resistance.
#
#
# VOLUME
# ------
# Maximum 10 bonus points when genuine relative-volume data
# exists.
#
# Pre-Breakout currently does not contain relative-volume
# data, so it is NOT removed or penalised for missing it.
#
#
# TOTAL POSSIBLE = 100
#
# ============================================================


# ============================================================
# TOUCH SCORE — MAX 30
# ============================================================

def score_touches(stock):

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
# HIGHER LOW SCORE — MAX 30
# ============================================================

def score_higher_lows(stock):

    higher_lows = get_higher_lows(
        stock
    )

    # Cap the benefit.
    #
    # BBIO, for example, has 11 higher lows.
    # That's strong, but we don't want 11 higher lows to
    # completely dominate every other ranking factor.

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
# BREAKOUT POSITION SCORE — MAX 30
# ============================================================

def score_breakout_position(stock):

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

    distance_above = (
        (
            price - resistance
        )
        /
        resistance
    ) * 100

    # Fresh breakout sweet spot.

    if 0 <= distance_above <= 2:

        return (
            30,
            round(distance_above, 2)
        )

    if distance_above <= 4:

        return (
            27,
            round(distance_above, 2)
        )

    if distance_above <= 6:

        return (
            23,
            round(distance_above, 2)
        )

    if distance_above <= 10:

        return (
            17,
            round(distance_above, 2)
        )

    if distance_above <= 15:

        return (
            10,
            round(distance_above, 2)
        )

    return (
        0,
        round(distance_above, 2)
    )


# ============================================================
# PRE-BREAKOUT POSITION SCORE — MAX 30
# ============================================================

def score_prebreakout_position(stock):

    distance = get_prebreakout_distance(
        stock
    )

    if distance is None:

        return (
            0,
            None
        )

    # Stock has already moved slightly above resistance.
    #
    # The stale breakout cull handles excessive moves.

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

    # Still below resistance.
    #
    # Closer = stronger Daily Brief candidate.

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
# VOLUME SCORE — MAX 10
# ============================================================

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


# ============================================================
# CALCULATE TECHNICAL SCORE
# ============================================================

def calculate_daily_brief_score(
    candidate
):

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
        relative_volume
    ) = score_volume(
        stock
    )

    total_score = (
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
            int(total_score),

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
            relative_volume
    }


# ============================================================
# SCORE ALL SURVIVORS
# ============================================================

ranked_candidates = []

for candidate in qualified_candidates:

    ranking = calculate_daily_brief_score(
        candidate
    )

    candidate[
        "daily_brief_ranking"
    ] = ranking

    ranked_candidates.append(
        candidate
    )


# ============================================================
# SORT
# ============================================================
#
# Primary:
# total score
#
# Tie order:
# position score
# higher-low score
# touch score
# symbol
#
# IMPORTANT:
# These tie breakers ONLY control display order.
#
# They do NOT split the #20 score group.
#
# ============================================================

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


# ============================================================
# ASSIGN COMPETITION RANK
# ============================================================
#
# Example:
#
# 1  90
# 2  88
# 2  88
# 4  85
#
# ============================================================

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


# ============================================================
# TOP 20 + ALL TIES
# ============================================================

if (
    len(ranked_candidates)
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


# ============================================================
# PRINT TECHNICAL RANKING
# ============================================================

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
    "RANK | SYMBOL | TYPE         | SCORE | "
    "TOUCH | LOWS | POSITION | VOLUME"
)

print(
    "------------------------------------------------"
    "-----------------------"
)


for candidate in ranked_candidates:

    ranking = candidate[
        "daily_brief_ranking"
    ]

    print(
        f"{candidate['daily_brief_rank']:>4} | "
        f"{candidate['symbol']:<6} | "
        f"{ranking['scanner_type']:<12} | "
        f"{ranking['total_score']:>5} | "
        f"{ranking['touch_points']:>5} | "
        f"{ranking['higher_low_points']:>4} | "
        f"{ranking['position_points']:>8} | "
        f"{ranking['volume_points']:>6}"
    )


# ============================================================
# SELECTED GROUP
# ============================================================

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

        distance_text = "N/A"

    elif scanner_type == "BREAKOUT":

        if distance >= 0:

            distance_text = (
                f"{distance:.2f}% above"
            )

        else:

            distance_text = (
                f"{abs(distance):.2f}% below"
            )

    else:

        if distance >= 0:

            distance_text = (
                f"{distance:.2f}% below"
            )

        else:

            distance_text = (
                f"{abs(distance):.2f}% above"
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
        f"{scanner_type} | "
        f"Score {ranking['total_score']}/100 | "
        f"Touches "
        f"{ranking['resistance_touches']} | "
        f"Higher Lows "
        f"{ranking['higher_lows']} | "
        f"{distance_text} resistance | "
        f"Volume {volume_text}"
    )


# ============================================================
# SAVE ONLY TOP 20 + TIES
# ============================================================

save_json(
    OUTPUT_FILE,
    final_candidates
)


# ============================================================
# SAVE DAILY BRIEF STATS
# ============================================================
#
# These values are used by the website to display the
# automated Daily Brief funnel.
#
# Example:
#
# 3,253 NASDAQ Stocks Scanned
#       ↓
# 122 Technical Setups Found
#       ↓
# 21 Companies Forwarded for AI Research
#
# Stocks to Investigate is populated separately from the
# completed AI Daily Brief results.
#
# ============================================================

daily_brief_stats = {

    "technical_setups_found":
        starting_total,

    "breakout_setups_found":
        len(breakouts),

    "pre_breakout_setups_found":
        len(prebreakouts),

    "forwarded_for_ai_research":
        len(final_candidates),

    "launch_pad_included":
        False
}


save_json(
    STATS_OUTPUT_FILE,
    daily_brief_stats
)


# ============================================================
# FINAL SUMMARY
# ============================================================

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

print(
    f"Within 5% remaining      : "
    f"{len(prebreakout_proximity_survivors)}"
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


# ============================================================
# SPECIAL SECURITIES REMOVED
# ============================================================

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


# ============================================================
# BANKS REMOVED
# ============================================================

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


# ============================================================
# PROPERTY / REIT REMOVED
# ============================================================

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


# ============================================================
# PROFILE FAILURES
# ============================================================

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