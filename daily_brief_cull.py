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
# PRE-BREAKOUT LIQUIDITY CULL
# ===================================

prebreakout_survivors = []
liquidity_removed = []


for stock in prebreakouts:

    volume = stock.get(
        "average_volume_20",
        0
    )

    dollar_volume = stock.get(
        "average_dollar_volume_20",
        0
    )

    if (
        volume >= MIN_AVERAGE_VOLUME
        and
        dollar_volume >=
        MIN_AVERAGE_DOLLAR_VOLUME
    ):

        prebreakout_survivors.append(
            stock
        )

    else:

        liquidity_removed.append({
            "symbol":
                stock.get("symbol"),

            "average_volume_20":
                volume,

            "average_dollar_volume_20":
                dollar_volume
        })


print()
print("-----------------------------------")
print("LIQUIDITY CULL")
print("-----------------------------------")

print(
    f"Pre-Breakouts before : "
    f"{len(prebreakouts)}"
)

print(
    f"Removed              : "
    f"{len(liquidity_removed)}"
)

print(
    f"Remaining            : "
    f"{len(prebreakout_survivors)}"
)


# ===================================
# COMBINE ALL SURVIVORS
# ===================================

combined = []


for stock in breakouts:

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


for stock in launchpads:

    combined.append({

        "symbol":
            stock.get("symbol"),

        "scanners":
            ["LAUNCH_PAD"],

        "launchpad":
            stock
    })


# ===================================
# MERGE DUPLICATE SYMBOLS
# ===================================

merged = {}


for stock in combined:

    symbol = stock.get("symbol")

    if not symbol:
        continue

    symbol = symbol.upper()

    if symbol not in merged:

        merged[symbol] = {

            "symbol":
                symbol,

            "scanners":
                []
        }


    record = merged[symbol]


    for scanner in stock.get(
        "scanners",
        []
    ):

        if scanner not in record["scanners"]:

            record[
                "scanners"
            ].append(scanner)


    if "breakout" in stock:

        record[
            "breakout"
        ] = stock["breakout"]


    if "pre_breakout" in stock:

        record[
            "pre_breakout"
        ] = stock["pre_breakout"]


    if "launchpad" in stock:

        record[
            "launchpad"
        ] = stock["launchpad"]


merged_candidates = list(
    merged.values()
)


duplicates_removed = (
    len(combined)
    - len(merged_candidates)
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

        return profile_cache[symbol]


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
            not isinstance(data, dict)
            or
            data.get("status") == "error"
        ):

            print(
                f"Profile failed: "
                f"{symbol}"
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

    symbol = stock["symbol"]


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

    stock["company"] = {

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


    # -------------------------------
    # REMOVE BANK
    # -------------------------------

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


    # -------------------------------
    # REMOVE PROPERTY / REIT
    # -------------------------------

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

print(
    f"Liquidity removed     : "
    f"{len(liquidity_removed)}"
)

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

print("-----------------------------------")

print(
    f"FINAL CANDIDATES      : "
    f"{len(final_candidates)}"
)

print("-----------------------------------")


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

        print(symbol)


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