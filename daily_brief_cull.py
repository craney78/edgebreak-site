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
LAUNCHPAD_FILE = "launchpad_database.json"

OUTPUT_FILE = "daily_brief_candidates.json"
PROFILE_CACHE_FILE = "daily_brief_profile_cache.json"


# ===================================
# DAILY BRIEF FILTER SETTINGS
# ===================================

MIN_AVERAGE_VOLUME = 100_000
MIN_AVERAGE_DOLLAR_VOLUME = 1_000_000

# Pre-Breakout must be within 5%
# BELOW resistance to qualify for
# Daily Brief AI research.

MAX_PREBREAKOUT_DISTANCE = 5.0

# Any stock already more than 15%
# ABOVE resistance is considered stale.

MAX_ABOVE_RESISTANCE = 15.0

# If genuine relative-volume data exists,
# >= 2x normal volume overrides the
# >15% stale breakout removal.

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
    "real estate"
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

        print(f"File not found: {filename}")
        return default

    except Exception as e:

        print(f"Could not load {filename}: {e}")
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
        average_volume >= MIN_AVERAGE_VOLUME
        and
        average_dollar_volume >= MIN_AVERAGE_DOLLAR_VOLUME
    )


# ===================================
# GET CURRENT PRICE
# ===================================

def get_current_price(stock):

    # Breakout / Pre-Breakout

    price = safe_number(
        stock.get(
            "price",
            0
        )
    )

    if price > 0:
        return price


    # Launch Pad

    current_price = safe_number(
        stock.get(
            "current_price",
            0
        )
    )

    if current_price > 0:
        return current_price


    return 0


# ===================================
# GET RESISTANCE
# ===================================

def get_resistance(stock):

    # Launch Pad
    # Use TOP of resistance zone.

    resistance_zone_high = safe_number(
        stock.get(
            "resistance_zone_high",
            0
        )
    )

    if resistance_zone_high > 0:
        return resistance_zone_high


    # Other possible format

    resistance_high = safe_number(
        stock.get(
            "resistance_high",
            0
        )
    )

    if resistance_high > 0:
        return resistance_high


    # Breakout / Pre-Breakout

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
            "available": True,
            "value": value,
            "field": field
        }


    return {
        "available": False,
        "value": 0,
        "field": None
    }


# ===================================
# PRE-BREAKOUT PROXIMITY CHECK
# ===================================
#
# Daily Brief only:
#
# If price is BELOW resistance and
# more than 5% away, remove it.
#
# Example:
#
# resistance = $100
#
# price $96 = 4% below
# KEEP
#
# price $92 = 8% below
# REMOVE
#
# If stock is already above resistance,
# this rule does NOT remove it.
# The stale breakout rule handles that.
# ===================================

def check_prebreakout_proximity(stock):

    price = get_current_price(
        stock
    )

    resistance = get_resistance(
        stock
    )


    # Cannot calculate safely.
    # Keep rather than delete blindly.

    if (
        price <= 0
        or
        resistance <= 0
    ):

        return {
            "remove": False,
            "price": price,
            "resistance": resistance,
            "distance_below_resistance": None
        }


    # Already at / above resistance.
    # Do not apply Pre-Breakout
    # proximity removal.

    if price >= resistance:

        return {
            "remove": False,
            "price": price,
            "resistance": resistance,
            "distance_below_resistance": 0
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


    # Cannot establish price/resistance.
    # Keep rather than delete blindly.

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


    distance_above_resistance = (
        (
            price -
            resistance
        )
        /
        resistance
    ) * 100


    # Still below resistance.

    if distance_above_resistance <= 0:

        return {

            "stale": False,
            "is_breakout": False,

            "price": price,
            "resistance": resistance,

            "distance_above_resistance":
                round(
                    distance_above_resistance,
                    2
                ),

            "volume_available": False,
            "relative_volume": 0,
            "relative_volume_field": None,

            "high_volume_exception": False

        }


    # Stock is above resistance.

    volume = get_relative_volume(
        stock
    )


    # <=15% above resistance.
    # Keep.

    if (
        distance_above_resistance <=
        MAX_ABOVE_RESISTANCE
    ):

        return {

            "stale": False,
            "is_breakout": True,

            "price": price,
            "resistance": resistance,

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

            "high_volume_exception": False

        }


    # More than 15% above resistance.
    #
    # Keep only if genuine relative
    # volume data exists AND >=2x.

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


        # REMOVE STALE

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


        # 2X VOLUME EXCEPTION

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


# ===================================
# SHOW PRE-BREAKOUTS TOO FAR AWAY
# ===================================

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
# LAUNCH PAD LIQUIDITY
# ===================================
#
# Launch Pad currently has no
# average_volume_20 /
# average_dollar_volume_20.
#
# Do NOT liquidity cull it.
# ===================================

launchpad_liquidity_survivors = list(
    launchpads
)


print()
print("-----------------------------------")
print("LAUNCH PAD LIQUIDITY")
print("-----------------------------------")

print(
    f"Before               : "
    f"{len(launchpads)}"
)

print(
    "Liquidity cull       : "
    "NOT AVAILABLE IN JSON"
)

print(
    f"Remaining            : "
    f"{len(launchpad_liquidity_survivors)}"
)


# ===================================
# UNIVERSAL STALE BREAKOUT CULL
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


(
    launchpad_survivors,
    launchpad_stale_removed,
    launchpad_volume_exceptions
) = apply_stale_breakout_cull(

    launchpad_liquidity_survivors,
    "LAUNCH_PAD"

)


total_stale_removed = (
    len(breakout_stale_removed)
    +
    len(prebreakout_stale_removed)
    +
    len(launchpad_stale_removed)
)


all_volume_exceptions = (
    breakout_volume_exceptions
    +
    prebreakout_volume_exceptions
    +
    launchpad_volume_exceptions
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
    +
    launchpad_stale_removed
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


for stock in launchpad_survivors:

    combined.append({

        "symbol":
            stock.get("symbol"),

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
# MULTI-SCANNER STOCKS
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
            f"Profile error {symbol}: {e}"
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


    # BANKS

    for keyword in BANK_KEYWORDS:

        if keyword in industry:

            return "BANK"


    # PROPERTY / REIT

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


    # Profile failed:
    # KEEP rather than delete blindly.

    if profile is None:

        profile_failures.append(
            symbol
        )

        final_candidates.append(
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


    # REMOVE BANK

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


    # REMOVE PROPERTY / REIT

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
print("LIQUIDITY")
print("-----------------------------------")

print(
    f"Pre-Breakout removed     : "
    f"{len(prebreakout_liquidity_removed)}"
)

print(
    "Breakout liquidity       : N/A"
)

print(
    "Launch Pad liquidity      : N/A"
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
# SHOW BANKS REMOVED
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
# SHOW PROPERTY REMOVED
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