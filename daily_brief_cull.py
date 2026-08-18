import json

# ===================================
# FILES
# ===================================

BREAKOUT_FILE = "breakout_scanner.json"
PREBREAKOUT_FILE = "scanner_database.json"
LAUNCHPAD_FILE = "launchpad_database.json"

OUTPUT_FILE = "daily_brief_candidates.json"

# ===================================
# DAILY BRIEF FILTER SETTINGS
# ===================================

MIN_AVERAGE_VOLUME = 100_000
MIN_AVERAGE_DOLLAR_VOLUME = 1_000_000


# ===================================
# LOAD JSON
# ===================================

def load_json(filename):

    try:

        with open(filename, "r") as f:
            return json.load(f)

    except Exception as e:

        print(f"Could not load {filename}: {e}")
        return []


# ===================================
# LOAD SCANNER RESULTS
# ===================================

breakouts = load_json(BREAKOUT_FILE)
prebreakouts = load_json(PREBREAKOUT_FILE)
launchpads = load_json(LAUNCHPAD_FILE)


print()
print("===================================")
print("EDGEBREAK DAILY BRIEF CULL")
print("===================================")
print()

print(f"Breakouts loaded     : {len(breakouts)}")
print(f"Pre-Breakouts loaded : {len(prebreakouts)}")
print(f"Launch Pads loaded   : {len(launchpads)}")

starting_total = (
    len(breakouts)
    + len(prebreakouts)
    + len(launchpads)
)

print()
print(f"Starting results     : {starting_total}")


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
        dollar_volume >= MIN_AVERAGE_DOLLAR_VOLUME
    ):

        prebreakout_survivors.append(stock)

    else:

        liquidity_removed.append({
            "symbol": stock.get("symbol"),
            "average_volume_20": volume,
            "average_dollar_volume_20": dollar_volume
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
        "symbol": stock.get("symbol"),
        "scanners": ["BREAKOUT"],
        "breakout": stock
    })


for stock in prebreakout_survivors:

    combined.append({
        "symbol": stock.get("symbol"),
        "scanners": ["PRE_BREAKOUT"],
        "pre_breakout": stock
    })


for stock in launchpads:

    combined.append({
        "symbol": stock.get("symbol"),
        "scanners": ["LAUNCH_PAD"],
        "launchpad": stock
    })


# ===================================
# MERGE DUPLICATE SYMBOLS
# ===================================

merged = {}

for stock in combined:

    symbol = stock.get("symbol")

    if not symbol:
        continue

    if symbol not in merged:

        merged[symbol] = {
            "symbol": symbol,
            "scanners": []
        }

    record = merged[symbol]

    for scanner in stock.get(
        "scanners",
        []
    ):

        if scanner not in record["scanners"]:
            record["scanners"].append(scanner)

    if "breakout" in stock:
        record["breakout"] = stock["breakout"]

    if "pre_breakout" in stock:
        record["pre_breakout"] = stock["pre_breakout"]

    if "launchpad" in stock:
        record["launchpad"] = stock["launchpad"]


final_candidates = list(
    merged.values()
)


duplicates_removed = (
    len(combined)
    - len(final_candidates)
)


# ===================================
# RESULTS
# ===================================

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
    f"{len(final_candidates)}"
)


# ===================================
# SAVE
# ===================================

with open(
    OUTPUT_FILE,
    "w"
) as f:

    json.dump(
        final_candidates,
        f,
        indent=4
    )


print()
print("===================================")
print("FINAL DAILY BRIEF POOL")
print("===================================")

print()
print(
    f"Started with         : "
    f"{starting_total}"
)

print(
    f"Liquidity removed    : "
    f"{len(liquidity_removed)}"
)

print(
    f"Duplicates merged    : "
    f"{duplicates_removed}"
)

print(
    f"Remaining for next cull: "
    f"{len(final_candidates)}"
)

print()
print(
    f"Saved to {OUTPUT_FILE}"
)

print()