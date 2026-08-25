import json
import os
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
LAUNCHPAD_FILE = "launchpad_database.json"

OUTPUT_FILE = "daily_brief_candidates.json"

PROFILE_CACHE_FILE = "daily_brief_profile_cache.json"


# ===================================
# DAILY BRIEF FILTER SETTINGS
# ===================================

MIN_AVERAGE_VOLUME = 100_000

MIN_AVERAGE_DOLLAR_VOLUME = 1_000_000


# -----------------------------------
# STALE BREAKOUT RULE
# -----------------------------------
#
# Any stock already trading more than
# 15% above identified resistance is
# considered stale for the Daily Brief.
#
# EXCEPTION:
#
# If relative/current volume is at
# least 2x normal volume, keep it.
#
# This rule is applied wherever we
# have enough data to establish:
#
# 1. current price
# 2. resistance
# 3. distance above resistance
#
# It does NOT remove genuine
# Pre-Breakouts still below resistance.
# -----------------------------------

MAX_ABOVE_RESISTANCE = 15.0

HIGH_VOLUME_EXCEPTION = 2.0


PROFILE_SLEEP_TIME = 0.5


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
    "real estate",
]


# ===================================
# LOAD JSON
# ===================================

def load_json(filename, default=None):

    if default is None:
        default = []

    try:

        with open(filename, "r") as f:

            return json.load(f)

    except FileNotFoundError:

        return default

    except Exception as e:

        print(
            f"Could not load {filename}: {e}"
        )

        return default


# ===================================
# SAVE JSON
# ===================================

def save_json(filename, data):

    with open(filename, "w") as f:

        json.dump(
            data,
            f,
            indent=4
        )


# ===================================
# SAFE NUMBER
# ===================================

def safe_number(value, default=0):

    try:

        return float(value)

    except (TypeError, ValueError):

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
# GET RELATIVE VOLUME
# ===================================
#
# Different scanner files may use
# different field names.
#
# We only use fields that actually
# represent a relative/current-volume
# comparison.
#
# IMPORTANT:
# average_volume_20 is NOT used here.
# It is liquidity, not relative volume.
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

        if value > 0:

            return value, field

    return 0, None


# ===================================
# GET RESISTANCE
# ===================================

def get_resistance(stock):

    # --------------------------------
    # Launch Pad resistance zone
    # --------------------------------

    resistance_high = safe_number(
        stock.get(
            "resistance_high",
            0
        )
    )

    if resistance_high > 0:

        return resistance_high


    # --------------------------------
    # Breakout / other scanners
    # --------------------------------

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
# STALE BREAKOUT CHECK
# ===================================
#
# RETURNS:
#
# stale = True
#   >15% above resistance
#   AND volume <2x
#
# stale = False
#   <=15% above resistance
#
# OR
#
#   >15% above resistance
#   BUT volume >=2x
#
# If required price/resistance data
# is unavailable, keep the stock.
# ===================================

def check_stale_breakout(stock):

    price = safe_number(
        stock.get(
            "price",
            0
        )
    )

    resistance = get_resistance(
        stock
    )


    # --------------------------------
    # Cannot establish breakout
    # --------------------------------

    if (
        price <= 0
        or
        resistance <= 0
    ):

        return {
            "stale": False,
            "is_breakout": False,
            "distance_above_resistance": None,
            "relative_volume": 0,
            "relative_volume_field": None,
            "high_volume_exception": False
        }


    distance_above_resistance = (
        (
            price -
            resistance
        )
        /
        resistance
    ) * 100


    # --------------------------------
    # Stock has NOT broken resistance
    # --------------------------------

    if distance_above_resistance <= 0:

        return {
            "stale": False,
            "is_breakout": False,
            "distance_above_resistance":
                round(
                    distance_above_resistance,
                    2
                ),
            "relative_volume": 0,
            "relative_volume_field": None,
            "high_volume_exception": False
        }


    # --------------------------------
    # Stock HAS broken resistance
    # --------------------------------

    relative_volume, volume_field = (
        get_relative_volume(
            stock
        )
    )


    # --------------------------------
    # Within acceptable breakout range
    # --------------------------------

    if (
        distance_above_resistance <=
        MAX_ABOVE_RESISTANCE
    ):

        return {
            "stale": False,
            "is_breakout": True,
            "distance_above_resistance":
                round(
                    distance_above_resistance,
                    2
                ),
            "relative_volume":
                relative_volume,
            "relative_volume_field":
                volume_field,
            "high_volume_exception": False
        }


    # --------------------------------
    # More than 15% above resistance
    #
    # Check 2x volume exception.
    # --------------------------------

    high_volume_exception = (
        relative_volume >=
        HIGH_VOLUME_EXCEPTION
    )


    return {
        "stale":
            not high_volume_exception,

        "is_breakout":
            True,

        "distance_above_resistance":
            round(
                distance_above_resistance,
                2
            ),

        "relative_volume":
            relative_volume,

        "relative_volume_field":
            volume_field,

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


        # -----------------------------
        # REMOVE STALE BREAKOUT
        # -----------------------------

        if result["stale"]:

            removed.append({

                "symbol":
                    symbol,

                "scanner":
                    scanner_name,

                "price":
                    safe_number(
                        stock.get(
                            "price",
                            0
                        )
                    ),

                "resistance":
                    get_resistance(
                        stock
                    ),

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

            continue


        # -----------------------------
        # HIGH VOLUME EXCEPTION
        # -----------------------------

        if result[
            "high_volume_exception"
        ]:

            volume_exceptions.append({

                "symbol":
                    symbol,

                "scanner":
                    scanner_name,

                "price":
                    safe_number(
                        stock.get(
                            "price",
                            0
                        )
                    ),

                "resistance":
                    get_resistance(
                        stock
                    ),

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

launchpads = load_json(
    LAUNCHPAD_FILE,
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
    f"Launch Pads loaded   : "
    f"{len(launchpads)}"
)


starting_total = (
    len(breakouts)
    +
    len(prebreakouts)
    +
    len(launchpads)
)


print()
print(
    f"Starting results     : "
    f"{starting_total}"
)


# ===================================
# BREAKOUT LIQUIDITY
# ===================================
#
# Current Breakout JSON does not
# contain average_volume_20 and
# average_dollar_volume_20.
#
# Therefore Breakouts still bypass
# the liquidity cull for now.
#
# The stale breakout rule DOES apply.
# ===================================

breakout_liquidity_survivors = list(
    breakouts
)


print()
print("-----------------------------------")
print("BREAKOUT LIQUIDITY")
print("-----------------------------------")

print(
    f"Breakouts loaded      : "
    f"{len(breakouts)}"
)

print(
    "Liquidity cull        : "
    "NOT YET AVAILABLE"
)

print(
    f"Remaining             : "
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
# LAUNCH PAD LIQUIDITY CULL
# ===================================

launchpad_liquidity_survivors = []

launchpad_liquidity_removed = []


for stock in launchpads:

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

        launchpad_liquidity_survivors.append(
            stock
        )

    else:

        launchpad_liquidity_removed.append({

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
print("LAUNCH PAD LIQUIDITY CULL")
print("-----------------------------------")

print(
    f"Before               : "
    f"{len(launchpads)}"
)

print(
    f"Removed              : "
    f"{len(launchpad_liquidity_removed)}"
)

print(
    f"Remaining            : "
    f"{len(launchpad_liquidity_survivors)}"
)


# ===================================
# UNIVERSAL STALE BREAKOUT CULL
# ===================================
#
# Apply the same rule to:
#
# BREAKOUT
# PRE-BREAKOUT
# LAUNCH PAD
#
# A genuine Pre-Breakout below
# resistance automatically survives.
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

    prebreakout_liquidity_survivors,
    "PRE_BREAKOUT"

)


(
    launchpad_survivors,
    launchpad_stale_removed,
    launchpad_volume_exceptions
) = apply_stale_breakout_cull(

    launchpad_liquidity_survivors,
    "LAUNCH_PAD"

)


# ===================================
# STALE CULL SUMMARY
# ===================================

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
    f"Launch Pad removed   : "
    f"{len(launchpad_stale_removed)}"
)


total_stale_removed = (
    len(
        breakout_stale_removed
    )
    +
    len(
        prebreakout_stale_removed
    )
    +
    len(
        launchpad_stale_removed
    )
)


print(
    f"Total stale removed  : "
    f"{total_stale_removed}"
)


# ===================================
# HIGH VOLUME EXCEPTIONS
# ===================================

all_volume_exceptions = (
    breakout_volume_exceptions
    +
    prebreakout_volume_exceptions
    +
    launchpad_volume_exceptions
)


print(
    f"2x volume exceptions : "
    f"{len(all_volume_exceptions)}"
)


# ===================================
# SHOW STALE STOCKS REMOVED
# ===================================

all_stale_removed = (
    breakout_stale_removed
    +
    prebreakout_stale_removed
    +
    launchpad_stale_removed
)


if all_stale_removed:

    print()
    print("STALE BREAKOUTS REMOVED")
    print("-----------------------------------")


    for stock in all_stale_removed:

        volume_text = (
            f"{stock['relative_volume']:.2f}x"
            if stock[
                "relative_volume"
            ] > 0
            else "N/A"
        )


        print(
            f"{stock['symbol']} | "
            f"{stock['scanner']} | "
            f"{stock['distance_above_resistance']:.2f}% "
            f"above resistance | "
            f"Volume {volume_text}"
        )


# ===================================
# SHOW 2X VOLUME EXCEPTIONS
# ===================================

if all_volume_exceptions:

    print()
    print("STALE DISTANCE BUT KEPT — 2X VOLUME")
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
# COMBINE ALL SURVIVORS
# ===================================

combined = []


# -----------------------------------
# BREAKOUTS
# -----------------------------------

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


# -----------------------------------
# PRE-BREAKOUTS
# -----------------------------------

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


# -----------------------------------
# LAUNCH PADS
# -----------------------------------

for stock in launchpad_survivors:

    combined.append({

        "symbol":
            stock.get(
                "symbol"
            ),

        "scanners":
            ["LAUNCH_PAD"],

        "launchpad":
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
    f"Launch Pads          : "
    f"{len(launchpad_survivors)}"
)

print(
    f"Combined appearances : "
    f"{len(combined)}"
)


# ===================================
# MERGE DUPLICATE SYMBOLS
# ===================================

merged = {}


for stock in combined:

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


    if "launchpad" in stock:

        record[
            "launchpad"
        ] = stock[
            "launchpad"
        ]


merged_candidates = list(
    merged.values()
)


duplicates_removed = (
    len(combined)
    -
    len(merged_candidates)
)


print()
print("-----------------------------------")
print("DUPLICATE MERGE")
print("-----------------------------------")

print(
    f"Before merge         : "
    f"{len(combined)}"
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
# SHOW MULTI-SCANNER STOCKS
# ===================================

multi_scanner_candidates = [

    stock

    for stock in merged_candidates

    if len(
        stock.get(
            "scanners",
            []
        )
    ) > 1

]


if multi_scanner_candidates:

    print()
    print("MULTI-SCANNER CANDIDATES")
    print("-----------------------------------")


    for stock in multi_scanner_candidates:

        print(
            f"{stock['symbol']} | "
            f"{', '.join(stock['scanners'])}"
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

    # -------------------------------
    # USE CACHE FIRST
    # -------------------------------

    if symbol in profile_cache:

        return profile_cache[
            symbol
        ]


    # -------------------------------
    # TWELVE DATA PROFILE
    # -------------------------------

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


        # ---------------------------
        # CHECK FOR API ERROR
        # ---------------------------

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
                f"Profile failed: "
                f"{symbol}"
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


        # ---------------------------
        # SAVE TO CACHE
        # ---------------------------

        profile_cache[
            symbol
        ] = profile


        save_json(
            PROFILE_CACHE_FILE,
            profile_cache
        )


        print(
            f"Profile saved: "
            f"{symbol}"
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


    # -------------------------------
    # BANKS
    # -------------------------------

    for keyword in BANK_KEYWORDS:

        if keyword in industry:

            return "BANK"


    # -------------------------------
    # REIT / PROPERTY
    # -------------------------------

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


final_candidates = []

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


    # -------------------------------
    # PROFILE FAILED
    # KEEP STOCK
    # -------------------------------

    if profile is None:

        profile_failures.append(
            symbol
        )


        final_candidates.append(
            stock
        )


        continue


    # -------------------------------
    # ADD PROFILE TO CANDIDATE
    # -------------------------------

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


    # -------------------------------
    # REMOVE BANK
    # -------------------------------

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


    # -------------------------------
    # REMOVE PROPERTY / REIT
    # -------------------------------

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


    # -------------------------------
    # SURVIVES
    # -------------------------------

    final_candidates.append(
        stock
    )


# ===================================
# SAVE FINAL CANDIDATES
# ===================================

save_json(
    OUTPUT_FILE,
    final_candidates
)


# ===================================
# TOTAL LIQUIDITY REMOVED
# ===================================

total_liquidity_removed = (
    len(
        prebreakout_liquidity_removed
    )
    +
    len(
        launchpad_liquidity_removed
    )
)


# ===================================
# FINAL RESULTS
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
print("LIQUIDITY")
print("-----------------------------------")

print(
    f"Pre-Breakout removed     : "
    f"{len(prebreakout_liquidity_removed)}"
)

print(
    f"Launch Pad removed       : "
    f"{len(launchpad_liquidity_removed)}"
)

print(
    f"Total liquidity removed  : "
    f"{total_liquidity_removed}"
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
    f"Launch Pad stale         : "
    f"{len(launchpad_stale_removed)}"
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
print("-----------------------------------")

print(
    f"FINAL CANDIDATES         : "
    f"{len(final_candidates)}"
)

print("-----------------------------------")


# ===================================
# SHOW LIQUIDITY REMOVALS
# ===================================

if prebreakout_liquidity_removed:

    print()
    print("PRE-BREAKOUT LIQUIDITY REMOVED")
    print("-----------------------------------")


    for stock in prebreakout_liquidity_removed:

        print(
            f"{stock['symbol']} | "
            f"Avg Vol "
            f"{stock['average_volume_20']:,.0f} | "
            f"Avg $ Vol "
            f"${stock['average_dollar_volume_20']:,.0f}"
        )


if launchpad_liquidity_removed:

    print()
    print("LAUNCH PAD LIQUIDITY REMOVED")
    print("-----------------------------------")


    for stock in launchpad_liquidity_removed:

        print(
            f"{stock['symbol']} | "
            f"Avg Vol "
            f"{stock['average_volume_20']:,.0f} | "
            f"Avg $ Vol "
            f"${stock['average_dollar_volume_20']:,.0f}"
        )


# ===================================
# SHOW REMOVED BANKS
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
# SHOW REMOVED PROPERTY
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
    f"Saved final candidates to "
    f"{OUTPUT_FILE}"
)

print(
    f"Profile cache saved to "
    f"{PROFILE_CACHE_FILE}"
)

print()