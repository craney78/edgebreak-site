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

MIN_BARS = 120

LOOKBACKS = [10,20,30,40,50,60,70,80,90]



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
        f"&outputsize=120"
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
# PIVOTS
# =========================

def get_pivot_highs(data, lookback):

    pivots = []

    try:

        bars = data[:lookback]

        for i in range(2, len(bars)-2):

            high = float(bars[i]["high"])

            if (

                high >
                float(bars[i-1]["high"])

                and

                high >
                float(bars[i-2]["high"])

                and

                high >
                float(bars[i+1]["high"])

                and

                high >
                float(bars[i+2]["high"])

            ):

                pivots.append(high)

    except:

        pass

    return pivots


def get_pivot_lows(data, lookback):

    pivots = []

    try:

        bars = data[:lookback]

        for i in range(2, len(bars)-2):

            low = float(bars[i]["low"])

            if (

                low <
                float(bars[i-1]["low"])

                and

                low <
                float(bars[i-2]["low"])

                and

                low <
                float(bars[i+1]["low"])

                and

                low <
                float(bars[i+2]["low"])

            ):

                pivots.append(low)

    except:

        pass

    return pivots


# =========================
# RESISTANCE TOUCHES
# =========================

def get_resistance(data, lookback):

    pivots = get_pivot_highs(
        data,
        lookback
    )

    if len(pivots) == 0:

        return 0

    best_level = 0
    best_count = 0

    for level in pivots:

        count = sum(

            1

            for p in pivots

            if abs(
                p - level
            ) / level <= 0.015

        )

        if count > best_count:

            best_count = count
            best_level = level

    return round(best_level, 2)


# =========================
# RESISTANCE TOUCHES
# =========================

def count_resistance_touches(
    data,
    lookback
):

    pivots = get_pivot_highs(
        data,
        lookback
    )

    resistance = get_resistance(
        data,
        lookback
    )

    if resistance == 0:
        return 0

    count = 0

    for p in reversed(pivots):

        if abs(
            p - resistance
        ) / resistance <= 0.015:

            count += 1

        else:

            break

    return count

# =========================
# HIGHER LOWS
# =========================

def count_higher_lows(
    data,
    lookback
):

    pivots = get_pivot_lows(
        data,
        lookback
    )

    if len(pivots) < 2:
        return 0

    pivots = list(
        reversed(pivots)
    )

    count = 0

    for i in range(
        1,
        len(pivots)
    ):

        if pivots[i-1] > pivots[i]:

            count += 1

        else:

            break

    return count



    
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

            if len(values) < MIN_BARS:
                continue

            # oldest → newest
            values = list(
                reversed(values)
            )

            # newest → oldest
            history = list(
                reversed(values)
            )

            df = pd.DataFrame(values)

            current_price = safe_float(
                df.iloc[-1]["close"]
            )

            # =========================
            # RECORD
            # =========================

            record = {

                "symbol":
                    symbol,

                "current_price":
                    round(
                        current_price,
                        2
                    ),

                "price_group":
                    get_price_group(
                        current_price
                    ),

                "scan_date":
                    datetime.now()
                    .strftime("%Y-%m-%d"),

                "last_updated":
                    datetime.now()
                    .strftime("%Y-%m-%d")

            }

            # =========================
            # RESISTANCE
            # =========================

            for days in LOOKBACKS:

                record[
                    f"resistance_{days}"
                ] = get_resistance(
                    history,
                    days
                )

                record[
                    f"resistance_touches_{days}"
                ] = count_resistance_touches(
                    history,
                    days
                )

            # =========================
            # HIGHER LOWS
            # =========================

            for days in LOOKBACKS:

                record[
                    f"higher_lows_{days}"
                ] = count_higher_lows(
                    history,
                    days
                )

            # =========================
            # SAVE RECORD
            # =========================

            database.append(
                record
            )

            saved += 1

        except Exception as e:

            failed += 1

            print(
                f"{symbol} failed: {e}"
            )
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

    print(
        f"📊 Scanning {total} symbols\n"
    )

    for i in range(
        0,
        total,
        BATCH_SIZE
    ):

        batch = symbols[
            i:i+BATCH_SIZE
        ]

        print(
            f"📦 Batch "
            f"{int(i/BATCH_SIZE)+1} "
            f"| {i} / {total}"
        )

        data = fetch_batch(
            batch
        )

        process_data(
            data
        )

        time.sleep(
            SLEEP_TIME
        )

    print("\n")
    print("💾 Saving database...")

    with open(
        DATABASE_FILE,
        "w"
    ) as f:

        json.dump(
            database,
            f,
            indent=2
        )

    runtime = round(
        time.time()
        - start_time,
        2
    )

    print("\n")
    print("===================================")
    print("SCAN COMPLETE")
    print("===================================")

    print(
        f"Processed: {processed}"
    )

    print(
        f"Saved: {saved}"
    )

    print(
        f"Failed: {failed}"
    )

    print(
        f"Database Size: "
        f"{len(database)}"
    )

    print(
        f"Runtime: "
        f"{runtime} seconds"
    )

    print(
        f"\n✅ Saved to "
        f"{DATABASE_FILE}"
    )


if __name__ == "__main__":

    main()
