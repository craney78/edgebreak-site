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
#
# =========================
# LAUNCH PAD
# =========================
#
# launchpad_found
#
# launchpad_score
#
# launchpad_days
#
# support_zone_low
# support_zone_high
#
# resistance_zone_low
# resistance_zone_high
#
# support_tests
# resistance_tests
#
# support_group_sizes
# resistance_group_sizes
#
# range_percent
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

# 6 Months of Daily Data
MIN_BARS = 126

# Launch Pad Scan Windows
SCAN_WINDOWS = [63, 84, 105, 126]

# =========================
# LAUNCH PAD SETTINGS
# =========================

ZONE_TOLERANCE = 0.05          # ±5% = 10% total zone
MAX_OUTSIDE_CLOSES = 0.10

DATABASE_FILE = "launchpad_database.json"

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

        print(f"Loaded {len(symbols)} symbols")

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
        f"&outputsize=126"
        f"&apikey={API_KEY}"
    )

    try:

        response = requests.get(
            url,
            timeout=20
        )

        return response.json()

    except Exception:

        return {}

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
# PIVOT LOWS
# =========================

def get_pivot_lows(history, window):

    pivots = []

    bars = history[:window]

    for i in range(2, len(bars) - 2):

        low = safe_float(bars[i]["low"])

        if (

            low < safe_float(bars[i-1]["low"]) and
            low < safe_float(bars[i-2]["low"]) and
            low < safe_float(bars[i+1]["low"]) and
            low < safe_float(bars[i+2]["low"])

        ):

            pivots.append(low)

    return pivots

# =========================
# SUPPORT ZONE
# =========================

def find_support_zone(history, window):

    pivots = get_pivot_lows(history, window)

    if len(pivots) < 2:

        return (0, 0)

    best_level = 0
    best_count = 0

    for level in pivots:

        count = sum(

            1

            for p in pivots

            if abs(p - level) / level <= 0.01

        )

        if count > best_count:

            best_count = count
            best_level = level

    zone_low = round(best_level * 0.985, 2)
    zone_high = round(best_level * 1.015, 2)

    return (

        zone_low,
        zone_high

    )

# =========================
# PIVOT HIGHS
# =========================

def get_pivot_highs(history, window):

    pivots = []

    bars = history[:window]

    for i in range(2, len(bars) - 2):

        high = safe_float(bars[i]["high"])

        if (

            high > safe_float(bars[i-1]["high"]) and
            high > safe_float(bars[i-2]["high"]) and
            high > safe_float(bars[i+1]["high"]) and
            high > safe_float(bars[i+2]["high"])

        ):

            pivots.append(high)

    return pivots

# =========================
# RESISTANCE ZONE
# =========================

def find_resistance_zone(history, window):

    pivots = get_pivot_highs(history, window)

    if len(pivots) < 2:

        return (0, 0)

    best_level = 0
    best_count = 0

    for level in pivots:

        count = sum(

            1

            for p in pivots

            if abs(p - level) / level <= 0.015

        )

        if count > best_count:

            best_count = count
            best_level = level

    zone_low = round(best_level * 0.985, 2)
    zone_high = round(best_level * 1.015, 2)

    return (

        zone_low,
        zone_high

    )

# =========================
# SUPPORT TESTS
# =========================

def count_support_tests(
    history,
    support_low,
    support_high,
    min_touches=3,
    grouping_days=5
):

    tests = 0
    group_sizes = []
    group_prices = []

    touches = 0
    touch_sum = 0

    days_since_touch = grouping_days + 1

    for bar in history:

        low = safe_float(bar["low"])

        if support_low <= low <= support_high:

            if days_since_touch <= grouping_days:

                touches += 1
                touch_sum += low

            else:

                if touches >= min_touches:

                    tests += 1
                    group_sizes.append(touches)
                    group_prices.append(
                        round(touch_sum / touches, 2)
                    )

                touches = 1
                touch_sum = low

            days_since_touch = 0

        else:

            days_since_touch += 1

    if touches >= min_touches:

        tests += 1
        group_sizes.append(touches)
        group_prices.append(
            round(touch_sum / touches, 2)
        )

    return (
        tests,
        group_sizes,
        group_prices
    )

        

# =========================
# RESISTANCE TESTS
# =========================

def count_resistance_tests(
    history,
    resistance_low,
    resistance_high,
    min_touches=3,
    grouping_days=5
):

    tests = 0
    group_sizes = []
    group_prices = []

    touches = 0
    touch_sum = 0

    days_since_touch = grouping_days + 1

    for bar in history:

        high = safe_float(bar["high"])

        if resistance_low <= high <= resistance_high:

            if days_since_touch <= grouping_days:

                touches += 1
                touch_sum += high

            else:

                if touches >= min_touches:

                    tests += 1
                    group_sizes.append(touches)
                    group_prices.append(
                        round(touch_sum / touches, 2)
                    )

                touches = 1
                touch_sum = high

            days_since_touch = 0

        else:

            days_since_touch += 1

    if touches >= min_touches:

        tests += 1
        group_sizes.append(touches)
        group_prices.append(
            round(touch_sum / touches, 2)
        )

    return (
        tests,
        group_sizes,
        group_prices
    )

# =========================
# SUPPORT VALIDATION
# =========================

def validate_support_groups(group_prices):

    if len(group_prices) < 2:
        return False

    centre = group_prices[0]

    zone_low = centre * (1 - ZONE_TOLERANCE)
    zone_high = centre * (1 + ZONE_TOLERANCE)

    previous = group_prices[0]

    for price in group_prices:

        if not (zone_low <= price <= zone_high):
            return False

        if price < previous:
            return False

        previous = price

    return True    


# =========================
# RESISTANCE VALIDATION
# =========================

def validate_resistance_groups(group_prices):

    if len(group_prices) < 2:
        return False

    centre = group_prices[0]

    zone_low = centre * (1 - ZONE_TOLERANCE)
    zone_high = centre * (1 + ZONE_TOLERANCE)

    previous = group_prices[0]

    for price in group_prices:

        if not (zone_low <= price <= zone_high):
            return False

        if price > previous:
            return False

        previous = price

    return True
    
# =========================
# CANDLE CONTAINMENT
# =========================

def validate_candle_containment(
    history,
    support_low,
    resistance_high
):

    outside = 0

    support_buffer = support_low * 0.01
    resistance_buffer = resistance_high * 0.01

    for bar in history:

        close = safe_float(bar["close"])

        if close > resistance_high + resistance_buffer:
            outside += 1

        elif close < support_low - support_buffer:
            outside += 1

    outside_percent = outside / len(history)

    return outside_percent <= MAX_OUTSIDE_PERCENT        

# =========================
# RANGE PERCENT
# =========================

def calculate_range_percent(
    support_low,
    resistance_high
):

    if support_low == 0:

        return 0

    return round(

        (
            (resistance_high - support_low)
            / support_low
        ) * 100,

        2

    )

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
            values = list(reversed(values))

            # newest → oldest
            history = list(reversed(values))

            df = pd.DataFrame(values)

            current_price = safe_float(
                df.iloc[-1]["close"]
            )

            best_record = None

            
            # =========================
            # CHECK EACH WINDOW
            # =========================

            for window in SCAN_WINDOWS:

                support_low, support_high = find_support_zone(
                    history,
                    window
                )

                print(
                    symbol,
                    window,
                    "Pivot Lows:",
                    len(get_pivot_lows(history, window))
                )

                resistance_low, resistance_high = find_resistance_zone(
                    history,
                    window
                )

                print(
                    symbol,
                    window,
                    support_low,
                    resistance_low
                )

                if support_low == 0 or resistance_low == 0:
                    continue

                support_tests, support_groups, support_prices = count_support_tests(
                    history[:window],
                    support_low,
                    support_high
                )

                print(
                    "Support:",
                    support_tests,
                    support_groups
                )

                resistance_tests, resistance_groups, resistance_prices = count_resistance_tests(
                    history[:window],
                    resistance_low,
                    resistance_high
                )

                print(
                    "Resistance:",
                    resistance_tests,
                    resistance_groups
                )

                if support_tests < 3:
                    continue

                if resistance_tests < 3:
                    continue

                if not validate_support_groups(support_prices):
                    continue

                if not validate_resistance_groups(resistance_prices):
                    continue    

                #if not validate_candle_containment(
                    #history[:window],
                    #support_low,
                    #resistance_high
                #):
                    #continue

                range_percent = calculate_range_percent(
                    support_low,
                    resistance_high
                )

                if range_percent > 25:
                    continue

                if (
                    best_record is None
                    or
                    window > best_record["launchpad_days"]
                ):

                    best_record = {

                        "symbol": symbol,

                        "current_price": round(
                            current_price,
                            2
                        ),

                        "price_group": get_price_group(
                            current_price
                        ),

                        "launchpad_found": True,

                        "launchpad_days": window,

                        "support_zone_low": support_low,
                        "support_zone_high": support_high,

                        "resistance_zone_low": resistance_low,
                        "resistance_zone_high": resistance_high,

                        "support_tests": support_tests,
                        "resistance_tests": resistance_tests,

                        "support_group_sizes": support_groups,
                        "resistance_group_sizes": resistance_groups,

                        "range_percent": range_percent,

                        "last_updated": datetime.now().strftime("%Y-%m-%d")

                    }

            if best_record:

                database.append(best_record)

                saved += 1

        except Exception as e:

            failed += 1

            print(
                f"{symbol} failed: {e}"
            )                

# ===================================
# MAIN
# ===================================

symbols = build_nasdaq_universe()

print()

for i in range(0, len(symbols), BATCH_SIZE):

    batch = symbols[i:i+BATCH_SIZE]

    print(
        f"Batch {i+BATCH_SIZE}/{len(symbols)}"
    )

    data = fetch_batch(batch)

    process_data(data)

    time.sleep(SLEEP_TIME)

print()

print(
    f"Processed : {processed}"
)

print(
    f"Saved     : {saved}"
)

print(
    f"Failed    : {failed}"
)

# =========================
# SAVE DATABASE
# =========================

with open(
    DATABASE_FILE,
    "w"
) as f:

    json.dump(

        database,

        f,

        indent=4

    )

print()

print(
    f"Saved {len(database)} Launch Pads"
)



