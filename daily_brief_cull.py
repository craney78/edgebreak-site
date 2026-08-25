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


# Launch Pad stocks that have already
# moved more than this percentage above
# the top of their resistance zone are
# considered stale for Daily Brief AI
# research.

MAX_LAUNCHPAD_ABOVE_RESISTANCE = 15.0


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

        number = float(value)

        return number

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
    + len(prebreakouts)
    + len(launchpads)
)


print()
print(
    f"Starting results     : "
    f"{starting_total}"
)


# ===================================
# BREAKOUT STATUS
# ===================================
#
# IMPORTANT:
#
# The current breakout_scanner.json
# does NOT contain:
#
# average_volume_20
# average_dollar_volume_20
#
# Therefore Breakouts temporarily pass
# directly into the Daily Brief pool.
#
# We will add those fields to the
# Breakout scanner separately.
# ===================================

breakout_survivors = list(
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
    f"{len(breakout_survivors)}"
)


# ===================================
# PRE-BREAKOUT LIQUIDITY CULL
# ===================================

prebreakout_survivors = []

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

        prebreakout_survivors.append(
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
    f"{len(prebreakout_survivors)}"
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
# LAUNCH PAD STALE CULL
# ===================================
#
# Remove a Launch Pad stock when:
#
# current price is more than 15%
# above the TOP of the resistance
# zone.
#
# Example:
#
# resistance_high = 100
# maximum allowed = 115
#
# price > 115
# => stale for Daily Brief research
#
# ===================================

launchpad_survivors = []

launchpad_stale_removed = []


for stock in launchpad_liquidity_survivors:

    price = safe_number(
        stock.get(
            "price",
            0
        )
    )


    resistance_high = safe_number(
        stock.get(
            "resistance_high",
            0
        )
    )


    # ---------------------------------
    # FALLBACK
    # ---------------------------------
    #
    # If resistance_high is not present
    # for some reason, try resistance.
    #
    # If neither exists, keep the stock
    # rather than deleting it blindly.
    # ---------------------------------

    if resistance_high <= 0:

        resistance_high = safe_number(
            stock.get(
                "resistance",
                0
            )
        )


    if (
        price <= 0
        or
        resistance_high <= 0
    ):

        launchpad_survivors.append(
            stock
        )

        continue


    distance_above_resistance = (
        (
            price -
            resistance_high
        )
        /
        resistance_high
    ) * 100


    # ---------------------------------
    # REMOVE STALE LAUNCH PAD
    # ---------------------------------

    if (
        distance_above_resistance >
        MAX_LAUNCHPAD_ABOVE_RESISTANCE
    ):

        launchpad_stale_removed.append({

            "symbol":
                stock.get(
                    "symbol"
                ),

            "price":
                round(
                    price,
                    2
                ),

            "resistance_high":
                round(
                    resistance_high,
                    2
                ),

            "distance_above_resistance":
                round(
                    distance_above_resistance,
                    2
                )

        })


        continue


    # ---------------------------------
    # SURVIVES
    # ---------------------------------

    launchpad_survivors.append(
        stock
    )


print()
print("-----------------------------------")
print("LAUNCH PAD STALE CULL")
print("-----------------------------------")

print(
    f"Before               : "
    f"{len(launchpad_liquidity_survivors)}"
)

print(
    f"Removed >15%         : "
    f"{len(launchpad_stale_removed)}"
)

print(
    f"Remaining            : "
    f"{len(launchpad_survivors)}"
)


# ===================================
# SHOW STALE LAUNCH PADS
# ===================================

if launchpad_stale_removed:

    print()
    print("STALE LAUNCH PADS REMOVED")
    print("-----------------------------------")


    for stock in launchpad_stale_removed:

        print(
            f"{stock['symbol']} | "
            f"Price ${stock['price']} | "
            f"Resistance ${stock['resistance_high']} | "
            f"{stock['distance_above_resistance']}% above"
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
    f"Started with          : "
    f"{starting_total}"
)

print()
print("SCANNER CULLS")
print("-----------------------------------")

print(
    f"Pre-Breakout liquidity: "
    f"{len(prebreakout_liquidity_removed)} removed"
)

print(
    f"Launch Pad liquidity  : "
    f"{len(launchpad_liquidity_removed)} removed"
)

print(
    f"Launch Pad stale >15% : "
    f"{len(launchpad_stale_removed)} removed"
)

print(
    f"Total liquidity removed: "
    f"{total_liquidity_removed}"
)

print()
print("MERGE / PROFILE CULLS")
print("-----------------------------------")

print(
    f"Duplicates merged     : "
    f"{duplicates_removed}"
)

print(
    f"Banks removed         : "
    f"{len(bank_removed)}"
)

print(
    f"Property/REIT removed : "
    f"{len(property_removed)}"
)

print(
    f"Profile failures      : "
    f"{len(profile_failures)}"
)

print()
print("-----------------------------------")

print(
    f"FINAL CANDIDATES      : "
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