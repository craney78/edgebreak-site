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

MIN_BARS = 100

LOOKBACKS = [10,20,30,40,50,60,70,80,90]

HIGH_LOOKBACKS = [10,20,30,60,90]

AVG_VOLUME_OPTIONS = [
    500000,
    1000000
]

DATABASE_FILE = "scanner_database.json"

# =========================
# DATABASE
# =========================

database = []

processed = 0
saved = 0
failed = 0

# =========================
# FUTURE SETTINGS
# =========================

SMART_MONEY_FILE = "smart_money_database.json"

FREE_WATCHLIST_FILE = "free_breakout_watchlist.json"
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


def get_avg_volume(df):

    try:

        return int(
            df["volume"]
            .astype(float)
            .tail(20)
            .mean()
        )

    except:

        return 0


def get_volume_ratio(df):

    try:

        current_volume = safe_float(
            df.iloc[-1]["volume"]
        )

        avg_volume = (
            df["volume"]
            .astype(float)
            .tail(20)
            .mean()
        )

        if avg_volume == 0:

            return 0

        return round(
            current_volume / avg_volume,
            2
        )

    except:

        return 0


def get_gap_percent(df):

    try:

        today_open = safe_float(
            df.iloc[-1]["open"]
        )

        yesterday_close = safe_float(
            df.iloc[-2]["close"]
        )

        if yesterday_close == 0:

            return 0

        return round(
            (
                (today_open - yesterday_close)
                / yesterday_close
            ) * 100,
            2
        )

    except:

        return 0
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

    for p in pivots:

        if abs(
            p - resistance
        ) / resistance <= 0.015:

            count += 1

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

    count = 0

    for i in range(
        1,
        len(pivots)
    ):

        if pivots[i] > pivots[i-1]:

            count += 1

    return count


# =========================
# COMPRESSION
# =========================

def get_compression(
    data,
    lookback
):

    pivots_high = get_pivot_highs(
        data,
        lookback
    )

    pivots_low = get_pivot_lows(
        data,
        lookback
    )

    if (
        len(pivots_high) < 2
        or
        len(pivots_low) < 2
    ):

        return 0

    compression = 0

    for i in range(
        1,
        min(
            len(pivots_high),
            len(pivots_low)
        )
    ):

        range_now = (
            pivots_high[i]
            -
            pivots_low[i]
        )

        range_prev = (
            pivots_high[i-1]
            -
            pivots_low[i-1]
        )

        if range_now < range_prev:

            compression += 1

    return compression



# =========================
# HIGHS
# =========================

def get_high(df, lookback):

    try:

        return round(
            df.tail(lookback)
            ["high"]
            .astype(float)
            .max(),
            2
        )

    except:

        return 0


def distance_to_high(df, lookback):

    try:

        current_price = safe_float(
            df.iloc[-1]["close"]
        )

        high = get_high(
            df,
            lookback
        )

        if high == 0:

            return 999

        return round(
            (
                (high - current_price)
                / high
            ) * 100,
            2
        )

    except:

        return 999


def is_new_high(df, lookback):

    try:

        current_price = safe_float(
            df.iloc[-1]["close"]
        )

        high = get_high(
            df,
            lookback
        )

        return bool(
            current_price >= high
        )

    except:

        return False

# =========================
# EDGEBREAK STRUCTURE
# =========================

def calculate_structure_score(record):

    touches = record.get(
        "resistance_touches_30",
        0
    )

    higher_lows = record.get(
        "higher_lows_30",
        0
    )

    compression = record.get(
        "compression_30",
        0
    )

    score = (

        touches * 10

        +

        higher_lows * 15

        +

        compression * 5

    )

    return round(score, 2)

    # =========================
    # STRUCTURE
    # =========================

    score += (
        calculate_structure_score(
            record
        ) * 1.0
    )

    # =========================
    # VOLUME
    # =========================

    score += (
        min(
            record.get(
                "volume_ratio",
                0
            ),
            3
        ) * 10
    )

    # =========================
    # DISTANCE TO HIGH
    # =========================

    distance = record.get(
        "distance_to_30_high",
        999
    )

    if distance <= 1:

        score += 20

    elif distance <= 2:

        score += 15

    elif distance <= 5:

        score += 10

    elif distance <= 10:

        score += 5

    # =========================
    # GAP
    # =========================

    gap = abs(
        record.get(
            "gap_percent",
            0
        )
    )

    if gap > 2:

        score += 5

    return round(score, 2)

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

            record = {

            # =========================
            # BASIC
            # =========================

            "symbol": symbol,

            
            "current_price":
                round(current_price, 2),

            "price_group":
                get_price_group(
                    current_price
                ),

            "close_price":
                round(current_price, 2),

            "avg_volume":
                get_avg_volume(df),

            "volume_ratio":
                get_volume_ratio(df),

            "gap_percent":
                get_gap_percent(df),

            

            # =========================
            # META
            # =========================

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
            # COMPRESSION
            # =========================

            for days in LOOKBACKS:

                record[
                    f"compression_{days}"
                ] = get_compression(
                    history,
                    days
                )

            # =========================
            # HIGHS
            # =========================

            for days in HIGH_LOOKBACKS:

                record[
                    f"high_{days}"
                ] = get_high(
                    df,
                    days
                )

                record[
                    f"distance_to_{days}_high"
                ] = distance_to_high(
                    df,
                    days
                )

                record[
                    f"new_{days}_high"
                ] = bool(
                    is_new_high(
                        df,
                        days
                    )
                )

            # =========================
            # EDGEBREAK SCORES
            # =========================

            record[
                "setup_score"
            ] = calculate_structure_score(
                record
            )

            record[
                "scanner_score"
            ] = calculate_scanner_score(
                record
            )

            # =========================
            # FUTURE PLACEHOLDERS
            # =========================

            record[
                "relative_strength"
            ] = 0

            record[
                "momentum_score"
            ] = 0

            record[
                "accumulation_score"
            ] = 0

            record[
                "institutional_score"
            ] = 0

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
