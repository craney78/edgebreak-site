# =========================
# DATABASE FIELDS
# =========================
#
# BASIC
#
# symbol
# company_name
# sector
# industry
#
# current_price
# price_group
#
# avg_volume
# volume_ratio
#
# gap_percent
#
# market_cap          # future
#
# =========================
# RESISTANCE
# =========================
#
# resistance_10
# resistance_20
# resistance_30
# resistance_40
# resistance_50
# resistance_60
# resistance_70
# resistance_80
# resistance_90
#
# resistance_touches_10
# resistance_touches_20
# resistance_touches_30
# resistance_touches_40
# resistance_touches_50
# resistance_touches_60
# resistance_touches_70
# resistance_touches_80
# resistance_touches_90
#
# =========================
# HIGHER LOWS
# =========================
#
# higher_lows_10
# higher_lows_20
# higher_lows_30
# higher_lows_40
# higher_lows_50
# higher_lows_60
# higher_lows_70
# higher_lows_80
# higher_lows_90
#
# =========================
# HIGHS
# =========================
#
# high_10
# high_20
# high_30
# high_60
# high_90
#
# distance_to_10_high
# distance_to_20_high
# distance_to_30_high
# distance_to_60_high
# distance_to_90_high
#
# new_10_high
# new_20_high
# new_30_high
# new_60_high
# new_90_high
#
# =========================
# EDGEBREAK STRUCTURE
# =========================
#
# structure_score
# scanner_score
#
# breakout_strength
#
# =========================
# SMART MONEY
# =========================
#
# smart_money_appearances
#
# smart_money_rank
#
# smart_money_score
#
# =========================
# FUTURE
# =========================
#
# relative_strength
#
# momentum_score
#
# accumulation_score
#
# institutional_score
#
# =========================
# META
# =========================
#
# last_updated
#
# =========================

import requests
import pandas as pd
import json
import time
import ssl
from datetime import datetime

ssl._create_default_https_context = ssl._create_unverified_context

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

# =========================
# SETTINGS
# =========================

BATCH_SIZE = 10
SLEEP_TIME = 2

# =========================
# LAUNCH PAD SETTINGS
# =========================

SEARCH_PERIOD = 120          # 6 months
MIN_HISTORY = 120            # Minimum bars required




DATABASE_FILE = "scanner_database.json"

# =========================
# DATABASE
# =========================

database = []

processed = 0
saved = 0
failed = 0


# ===================================

# BUILD NASDAQ UNIVERSE

# ===================================

def build_nasdaq_universe():


    url = "https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt"

    try:

        df = pd.read_csv(url, sep="|")

        clean = df[
            (df["ETF"] == "N") &
            (df["Test Issue"] == "N")
        ]

        clean = clean[
            ~clean["Symbol"].str.contains(
                r"\.|W$|R$|P$|Q$",
                regex=True
            )
        ]

        clean = clean[
            clean["Symbol"].str.len() <= 5
        ]

        symbols = (
            clean["Symbol"]
            .dropna()
            .tolist()
        )

        print(
            f"Loaded {len(symbols)} symbols"
        )

        return symbols

    except Exception as e:

        print(e)

        return []


# ===================================

# FETCH BATCH

# ===================================

def fetch_batch(symbols):


    url = (
        f"https://api.twelvedata.com/time_series"
        f"?symbol={','.join(symbols)}"
        f"&interval=1day"
        f"&outputsize={SEARCH_PERIOD}"
        f"&apikey={API_KEY}"
    )

    try:

        response = requests.get(
            url,
            timeout=20
        )

        return response.json()

    except:

        return {}


# ===================================
# HELPERS
# ===================================

# =========================
# BASIC
# =========================

def safe_float(value):

    try:

        return float(value)

    except:

        return 0.0


def get_price_group(price):

    if price < 20:

        return "SMALL"

    elif price < 80:

        return "MID"

    return "LARGE"



# =========================
# PIVOT DETECTION
# =========================

def find_pivot_highs(data):

    pivots = []

    try:

        bars = data[:SEARCH_PERIOD]

        for i in range(2, len(bars) - 2):

            high = safe_float(bars[i]["high"])

            if (

                high > safe_float(bars[i - 1]["high"])

                and

                high > safe_float(bars[i - 2]["high"])

                and

                high > safe_float(bars[i + 1]["high"])

                and

                high > safe_float(bars[i + 2]["high"])

            ):

                pivots.append({

                    "index": i,
                    "date": bars[i]["datetime"],
                    "price": high

                })

    except:

        pass

    return pivots


def find_pivot_lows(data):

    pivots = []

    try:

        bars = data[:SEARCH_PERIOD]

        for i in range(2, len(bars) - 2):

            low = safe_float(bars[i]["low"])

            if (

                low < safe_float(bars[i - 1]["low"])

                and

                low < safe_float(bars[i - 2]["low"])

                and

                low < safe_float(bars[i + 1]["low"])

                and

                low < safe_float(bars[i + 2]["low"])

            ):

                pivots.append({

                    "index": i,
                    "date": bars[i]["datetime"],
                    "price": low

                })

    except:

        pass

    return pivots


# =========================
# RESISTANCE GROUPS
# =========================

RESISTANCE_TOLERANCE = 0.015      # 1.5%


def find_resistance_groups(pivot_highs):

    groups = []

    current_group = []

    for pivot in pivot_highs:

        if not current_group:

            current_group.append(pivot)
            continue

        centre = current_group[0]["price"]

        if abs(pivot["price"] - centre) / centre <= RESISTANCE_TOLERANCE:

            current_group.append(pivot)

        else:

            if len(current_group) >= 2:

                groups.append(current_group)

            current_group = [pivot]

    if len(current_group) >= 2:

        groups.append(current_group)

    return groups


# =========================
# ACTIVE RESISTANCE
# =========================

def get_active_resistance(pivot_highs):

    groups = find_resistance_groups(pivot_highs)

    if len(groups) == 0:

        return None

    active = groups[-1]

    resistance = sum(
        p["price"]
        for p in active
    ) / len(active)

    return {

        "price": round(resistance, 2),
        "touches": len(active),
        "start_index": active[0]["index"],
        "end_index": active[-1]["index"],
        "start_date": active[0]["date"],
        "end_date": active[-1]["date"]

    }



# =========================
# HIGHER LOW GROUPS
# =========================

HIGHER_LOW_TOLERANCE = 0.02      # 2%


def find_higher_low_groups(pivot_lows):

    groups = []

    current_group = []

    for pivot in pivot_lows:

        if not current_group:

            current_group.append(pivot)
            continue

        previous = current_group[-1]["price"]

        # Must be a higher low (allowing small tolerance)
        if pivot["price"] >= previous * (1 - HIGHER_LOW_TOLERANCE):

            current_group.append(pivot)

        else:

            if len(current_group) >= 2:

                groups.append(current_group)

            current_group = [pivot]

    if len(current_group) >= 2:

        groups.append(current_group)

    return groups


# =========================
# ACTIVE HIGHER LOWS
# =========================

def get_active_higher_lows(pivot_lows):

    groups = find_higher_low_groups(pivot_lows)

    if len(groups) == 0:

        return None

    active = groups[-1]

    return {

        "count": len(active),
        "start_index": active[0]["index"],
        "end_index": active[-1]["index"],
        "start_date": active[0]["date"],
        "end_date": active[-1]["date"],
        "lowest_price": min(
            p["price"]
            for p in active
        ),
        "latest_price": active[-1]["price"]

    }


    
# ===================================
# PROCESS
# ===================================

def process_data(data):

    global database
    global processed
    global saved
    global failed

    for symbol, content in data.items():

        processed += 1

        try:

            if not isinstance(content, dict):
                continue

            values = content.get("values")

            if not values:
                continue

            if len(values) < MIN_HISTORY:
                continue

            # Oldest → Newest
            history = list(reversed(values))

            current_price = safe_float(
                history[-1]["close"]
            )

            # =========================
            # FIND PIVOTS
            # =========================

            pivot_highs = find_pivot_highs(history)
            pivot_lows = find_pivot_lows(history)

            if len(pivot_highs) < 2:
                continue

            if len(pivot_lows) < 2:
                continue

            # =========================
            # FIND ACTIVE STRUCTURES
            # =========================

            resistance = get_active_resistance(
                pivot_highs
            )

            higher_lows = get_active_higher_lows(
                pivot_lows
            )

            if resistance is None:
                continue

            if higher_lows is None:
                continue

            # =========================
            # VALIDATE STRUCTURE
            # =========================

            if resistance["touches"] < 2:
                continue

            if higher_lows["count"] < 2:
                continue

            # Price must remain above
            # latest higher low

            if current_price < higher_lows["latest_price"] * 0.98:
                continue

            # Distance to breakout

            breakout_distance = (
                (resistance["price"] - current_price)
                / resistance["price"]
            ) * 100

            if breakout_distance < 0:
                continue

            # Only save stocks that are
            # reasonably close to breakout

            if breakout_distance > 10:
                continue

            # =========================
            # SAVE RECORD
            # =========================

            record = {

                "symbol": symbol,

                "current_price": round(
                    current_price,
                    2
                ),

                "price_group": get_price_group(
                    current_price
                ),

                "scan_date": datetime.now().strftime("%Y-%m-%d"),

                "last_updated": datetime.now().strftime("%Y-%m-%d"),

                # =====================
                # Launch Pad
                # =====================

                "launch_pad_active": True,

                "resistance_price":
                    resistance["price"],

                "resistance_touches":
                    resistance["touches"],

                "higher_lows":
                    higher_lows["count"],

                "breakout_distance":
                    round(
                        breakout_distance,
                        2
                    ),

                "launch_pad_start":
                    max(
                        resistance["start_date"],
                        higher_lows["start_date"]
                    ),

                "launch_pad_end":
                    min(
                        resistance["end_date"],
                        higher_lows["end_date"]
                    )

            }

            database.append(record)

            saved += 1

        except Exception as e:

            failed += 1

            print(
                f"{symbol} failed: {e}"
            )

# =========================
# STRUCTURE VALIDATION
# =========================

MIN_RESISTANCE_TOUCHES = 2
MIN_HIGHER_LOWS = 2

MAX_BREAKOUT_DISTANCE = 10.0      # %
PRICE_BUFFER = 0.02               # 2%

def validate_structure(
    resistance,
    higher_lows,
    current_price
):

    if resistance is None:
        return None

    if higher_lows is None:
        return None

    # =========================
    # MINIMUM STRUCTURE
    # =========================

    if resistance["touches"] < MIN_RESISTANCE_TOUCHES:

        return None

    if higher_lows["count"] < MIN_HIGHER_LOWS:

        return None

    # =========================
    # STRUCTURES MUST OVERLAP
    # =========================

    if higher_lows["end_index"] < resistance["start_index"]:

        return None

    if resistance["end_index"] < higher_lows["start_index"]:

        return None

    # =========================
    # PRICE MUST REMAIN ABOVE
    # LATEST HIGHER LOW
    # =========================

    if current_price < higher_lows["latest_price"] * (1 - PRICE_BUFFER):

        return None

    # =========================
    # PRICE MUST BE BELOW
    # RESISTANCE
    # =========================

    if current_price >= resistance["price"]:

        return None

    # =========================
    # DISTANCE TO RESISTANCE
    # =========================

    distance = (

        (resistance["price"] - current_price)

        / resistance["price"]

    ) * 100

    if distance > MAX_BREAKOUT_DISTANCE:

        return None

    # =========================
    # VALID STRUCTURE
    # =========================

    return {

        "structure_active": True,

        "resistance_price":
            resistance["price"],

        "resistance_touches":
            resistance["touches"],

        "higher_lows":
            higher_lows["count"],

        "distance_to_resistance":
            round(
                distance,
                2
            ),

        "structure_start":
            max(
                resistance["start_date"],
                higher_lows["start_date"]
            ),

        "structure_end":
            min(
                resistance["end_date"],
                higher_lows["end_date"]
            )

    }            
# ===================================
# MAIN
# ===================================

def main():

    global database

    start_time = time.time()

    print("\n")
    print("===================================")
    print("EDGEBREAK SCANNER DATABASE BUILDER")
    print("===================================\n")

    symbols = build_nasdaq_universe()

    total = len(symbols)

    if total == 0:

        print("❌ No symbols loaded")

        return

    print(f"📊 Scanning {total} NASDAQ stocks\n")

    total_batches = (
        total + BATCH_SIZE - 1
    ) // BATCH_SIZE

    # =========================
    # SCAN
    # =========================

    for i in range(0, total, BATCH_SIZE):

        batch = symbols[i:i + BATCH_SIZE]

        batch_number = (i // BATCH_SIZE) + 1

        print(
            f"\n📦 Batch {batch_number}/{total_batches}"
        )

        print(
            f"Processed : {processed}"
        )

        print(
            f"Saved     : {saved}"
        )

        print(
            f"Failed    : {failed}"
        )

        data = fetch_batch(batch)

        process_data(data)

        time.sleep(SLEEP_TIME)

    # =========================
    # SORT DATABASE
    # =========================

    database.sort(

        key=lambda x: (

            x["resistance_touches"],
            x["higher_lows"],
            -x["distance_to_resistance"]

        ),

        reverse=True

    )

    # =========================
    # SAVE DATABASE
    # =========================

    print("\n💾 Saving database...")

    with open(DATABASE_FILE, "w") as f:

        json.dump(
            database,
            f,
            indent=2
        )

    runtime = round(
        time.time() - start_time,
        2
    )

    # =========================
    # SUMMARY
    # =========================

    average_touches = 0
    average_higher_lows = 0
    average_distance = 0

    if len(database) > 0:

        average_touches = round(

            sum(

                r["resistance_touches"]

                for r in database

            ) / len(database),

            2

        )

        average_higher_lows = round(

            sum(

                r["higher_lows"]

                for r in database

            ) / len(database),

            2

        )

        average_distance = round(

            sum(

                r["distance_to_resistance"]

                for r in database

            ) / len(database),

            2

        )

    print("\n")
    print("===================================")
    print("SCAN COMPLETE")
    print("===================================")

    print(f"Processed Stocks : {processed}")
    print(f"Qualified Stocks : {saved}")
    print(f"Rejected Stocks  : {processed - saved}")
    print(f"Failed           : {failed}")

    print()

    print(
        f"Average Resistance Touches : {average_touches}"
    )

    print(
        f"Average Higher Lows        : {average_higher_lows}"
    )

    print(
        f"Average Distance           : {average_distance}%"
    )

    print()

    print(
        f"Database Size : {len(database)}"
    )

    print(
        f"Runtime       : {runtime} seconds"
    )

    print()

    print(f"✅ Saved to {DATABASE_FILE}")


if __name__ == "__main__":

    main()