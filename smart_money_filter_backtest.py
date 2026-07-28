# =========================
# 🧠 SMART MONEY SCANNER (BACKTEST)
# =========================

import requests
import json
import time
import pandas as pd
import ssl
from datetime import datetime, timedelta

ssl._create_default_https_context = ssl._create_unverified_context

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

BATCH_SIZE = 10
SLEEP_TIME = 2
SCAN_LIMIT = 3200

MIN_LOOKBACK = 60
BACKTEST_DAYS = 180
OUTPUT_SIZE = 300

# =========================
# ⏪ BACKTEST SETTINGS
# =========================

MIN_LOOKBACK = 60      # Minimum candles required before scanning
BACKTEST_DAYS = 180    # Trading days to replay
OUTPUT_SIZE = 300      # Candles to download from TwelveData



# =========================
# 📊 BUILD NASDAQ UNIVERSE
# =========================
def build_nasdaq_universe():

    url = "https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt"

    try:
        df = pd.read_csv(url, sep="|")

        if "Symbol" not in df.columns:
            print("❌ Missing Symbol column")
            return []

        clean = df[
            (df["ETF"] == "N") &
            (df["Test Issue"] == "N")
        ]

        clean = clean[~clean["Symbol"].str.contains(r"\.|W$|R$|P$|Q$", regex=True)]
        clean = clean[clean["Symbol"].str.len() <= 5]

        symbols = clean["Symbol"].dropna().tolist()

        print(f"✅ Loaded {len(symbols)} symbols")
        return symbols[:SCAN_LIMIT]

    except Exception as e:
        print(f"❌ Universe load failed: {e}")
        return []


# =========================
# 📡 FETCH DATA
# =========================
def fetch_batch(symbols):

    url = (
        f"https://api.twelvedata.com/time_series"
        f"?symbol={','.join(symbols)}"
        f"&interval=1day"
        f"&outputsize={OUTPUT_SIZE}"
        f"&apikey={API_KEY}"
    )

    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=20)

        if response.status_code != 200:
            print(f"⚠️ HTTP {response.status_code}")
            return {}

        try:
            data = response.json()
        except Exception:
            print("⚠️ Invalid JSON returned")
            return {}

        if "code" in data:
            print(f"⚠️ API error: {data.get('message')}")
            return {}

        return data if isinstance(data, dict) else {}

    except Exception as e:
        print(f"Fetch error: {e}")
        return {}

# =========================
# 🧠 SMART MONEY LOGIC (STRICT V5)
# =========================
def detect_smart_money(symbol, values, end_index, scan_date):

    if end_index < MIN_LOOKBACK:
        return None

    try:

        # Only use data available up to the historical day
        values = values[:end_index + 1]

        closes = [float(v["close"]) for v in values]
        volumes = [float(v["volume"]) for v in values]
        lows = [float(v["low"]) for v in values]
        highs = [float(v["high"]) for v in values]

        current_price = closes[-1]

        
        # =========================
        # 🚫 HARD FILTERS
        # =========================

        if current_price < 5:
            return None

        avg_vol_50 = sum(volumes[-50:]) / 50
        avg_vol_20 = sum(volumes[-20:]) / 20
        volume_ratio = avg_vol_20 / avg_vol_50

        if volume_ratio <= 1.3:
            return None

        recent_closes = closes[-20:]
        range_percent = ((max(recent_closes) - min(recent_closes)) / min(recent_closes)) * 100

        if range_percent < 5:
            return None

        if range_percent > 15:
            return None

        # =========================
        # 🚫 REMOVE EXTENDED STOCKS
        # =========================
        recent_high_50 = max(closes[-50:])
        distance_from_50_high = ((recent_high_50 - current_price) / recent_high_50) * 100

        if distance_from_50_high < 2:
            return None

        # =========================
        # 📊 STRUCTURE + TREND
        # =========================
        avg_50_price = sum(closes[-50:]) / 50
        trend = current_price > avg_50_price

        if not trend:
            return None

        # =========================
        # 📊 RANGE COMPRESSION
        # =========================
        recent_range = max(recent_closes) - min(recent_closes)
        prev_range = max(closes[-40:-20]) - min(closes[-40:-20])

        tightening = recent_range < prev_range

        # =========================
        # 📊 VOLATILITY
        # =========================
        ranges = [highs[i] - lows[i] for i in range(-20, 0)]
        avg_range_recent = sum(ranges[-5:]) / 5
        avg_range_earlier = sum(ranges[:5]) / 5

        volatility_contracting = avg_range_recent < avg_range_earlier

        # =========================
        # 📊 VOLUME BEHAVIOUR
        # =========================
        up_vol = 0
        down_vol = 0

        for i in range(-20, 0):
            if closes[i] > closes[i - 1]:
                up_vol += volumes[i]
            else:
                down_vol += volumes[i]

        volume_bias = up_vol > down_vol

        # =========================
        # 📊 ABSORPTION
        # =========================
        absorption = False

        for i in range(-10, 0):
            if volumes[i] > avg_vol_50 * 1.5 and closes[i] >= closes[i - 1]:
                absorption = True
                break

        # =========================
        # 📊 STRUCTURE (HIGHER LOWS)
        # =========================
        recent_lows = lows[-10:]

        higher_lows = all(
            recent_lows[i] >= recent_lows[i - 1]
            for i in range(1, len(recent_lows))
        )

        # =========================
        # 📊 POSITION
        # =========================
        resistance = max(recent_closes)
        distance_to_high = ((resistance - current_price) / resistance) * 100

        near_high = distance_to_high < 3

        # =========================
        # 🧠 SCORE
        # =========================
        score = 0

        if tightening:
            score += 1
        if volatility_contracting:
            score += 2
        if volume_bias:
            score += 1
        if absorption:
            score += 2
        if higher_lows:
            score += 1
        if near_high:
            score += 1

        # =========================
        # 🎯 FINAL FILTER
        # =========================
        if score >= 6:
            return {
                "symbol": symbol,
                "type": "SMART_MONEY",
                "price": round(current_price, 2),
                "range_percent": round(range_percent, 2),
                "volume_ratio": round(volume_ratio, 2),
                "distance_to_high": round(distance_to_high, 2),
                "score": score,
                "scan_date": scan_date
            }

    except Exception as e:
        print(f"{symbol} error: {e}")

    return None

# =========================
# 💾 SAVE SMART MONEY HISTORY
# =========================
def save_history(filename, new_records):

    try:
        with open(filename, "r") as f:
            existing = json.load(f)

    except:
        existing = []

    # =====================
    # INDEX EXISTING SYMBOLS
    # =====================

    history = {}

    for record in existing:

        symbol = record["symbol"]

        history[symbol] = set(
            record.get("appearances", [])
        )

    # =====================
    # ADD NEW APPEARANCES
    # =====================

    for record in new_records:

        symbol = record["symbol"]
        scan_date = record["scan_date"]

        if symbol not in history:
            history[symbol] = set()

        history[symbol].add(scan_date)

    # =====================
    # REMOVE OLD DATES
    # =====================

    cutoff_date = (
        datetime.now() -
        timedelta(days=BACKTEST_DAYS)
    ).strftime("%Y-%m-%d")

    output = []

    for symbol, dates in history.items():

        valid_dates = sorted(
            d for d in dates
            if d >= cutoff_date
        )

        if valid_dates:

            output.append({

                "symbol": symbol,

                "count": len(valid_dates),

                "last_seen": valid_dates[-1],

                "appearances": valid_dates

            })

    output = sorted(
        output,
        key=lambda x: x["symbol"]
    )

    # =====================
    # SAVE FILE
    # =====================

    with open(filename, "w") as f:

        json.dump(
            output,
            f,
            indent=2
        )

    return len(output)

# =========================
# 🚀 MAIN SCAN LOOP (BACKTEST VERSION)
# =========================
def run_scanner():

    print("🧠 RUNNING SMART MONEY BACKTEST...\n")

    symbols = build_nasdaq_universe()

    all_results = []

    for i in range(0, len(symbols), BATCH_SIZE):

        batch = symbols[i:i + BATCH_SIZE]

        print(
            f"Batch {(i // BATCH_SIZE) + 1}"
        )

        data = fetch_batch(batch)

        if not data:
            continue

        for symbol, content in data.items():

            values = content.get("values")

            if not values:
                continue

            values = list(reversed(values))

            if len(values) <= MIN_LOOKBACK:
                continue

            start_index = max(
                MIN_LOOKBACK,
                len(values) - BACKTEST_DAYS
)

            start_index = len(values) - BACKTEST_DAYS

            for end_index in range(start_index, len(values)):

                scan_date = values[end_index]["datetime"]

                setup = detect_smart_money(
                    symbol,
                    values,
                    end_index,
                    scan_date
                )

                if setup:
                    all_results.append(setup)

        time.sleep(SLEEP_TIME)

    # =========================
    # 💾 SAVE SMART MONEY HISTORY
    # =========================

    try:

        record_count = save_history(
            "smart_money_filter.json",
            all_results
        )

        print(
            f"\n✅ Saved {record_count} Smart Money stocks from {len(all_results)} historical signals."
        )

    except Exception as e:

        print(
            f"❌ Save failed: {e}"
        )

# =========================
# ▶ START SCANNER
# =========================

if __name__ == "__main__":
    run_scanner()        