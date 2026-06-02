# =========================
# 🧠 SMART MONEY SCANNER (BACKTEST READY)
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

# =========================
# ⏪ BACKTEST SETTINGS (MULTI-WEEK)
# =========================

MIN_LOOKBACK = 60   # data needed for smart money detection


# =========================
# 📅 GET PAST WEDNESDAYS
# =========================
def get_past_wednesdays(weeks=78):
    dates = []
    today = datetime.today()

    for i in range(1, weeks + 1):
        d = today - timedelta(days=i * 7)
        dates.append(d)

    return dates


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
        f"&outputsize=500"
        f"&apikey={API_KEY}"
    )

    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=20)

        if response.status_code != 200:
            return {}

        data = response.json()

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
def detect_smart_money(symbol, values):

    if len(values) < 60:
        return None

    try:
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
                "score": score
            }

    except Exception as e:
        print(f"{symbol} error: {e}")

    return None

# =========================
# 🚀 MAIN SCAN LOOP (BACKTEST VERSION)
# =========================
def run_scanner():

    print("🧠 RUNNING SMART MONEY BACKTEST...\n")

    symbols = build_nasdaq_universe()

    # 🔥 NEW: multi-week dates
    scan_dates = get_past_wednesdays(weeks=78)

    all_results = []

    for scan_index, scan_date in enumerate(scan_dates):

        print(f"\n📅 Week {scan_index + 1} → {scan_date.date()}")

        # 🔥 NEW: dynamic backtest window
        TEST_DAYS_AGO = (datetime.today() - scan_date).days

        results = []

        for i in range(0, len(symbols), BATCH_SIZE):

            batch = symbols[i:i + BATCH_SIZE]

            # ✅ FIXED: fetch data inside loop
            data = fetch_batch(batch)

            if not data:
                continue

            for symbol, content in data.items():

                values = content.get("values")

                if not values or len(values) < TEST_DAYS_AGO + MIN_LOOKBACK:
                    continue

                # oldest → newest
                values = list(reversed(values))

                # =========================
                # ⏪ HISTORICAL SPLIT
                # =========================
                historical_values = values[:-TEST_DAYS_AGO]
                forward_values = values[-TEST_DAYS_AGO:]

                # =========================
                # 🧠 DETECT SMART MONEY (PAST)
                # =========================
                setup = detect_smart_money(symbol, historical_values)

                if setup:

                    # =========================
                    # 📊 FORWARD PERFORMANCE (6 MONTHS)
                    # =========================
                    closes_forward = [float(v["close"]) for v in forward_values]

                    entry_price = closes_forward[0]
                    setup["entry_price"] = round(entry_price, 2)

                    max_price = max(closes_forward)
                    min_price = min(closes_forward)

                    setup["max_price"] = round(max_price, 2)
                    setup["min_price"] = round(min_price, 2)

                    gain_pct = ((max_price - entry_price) / entry_price) * 100
                    drop_pct = ((min_price - entry_price) / entry_price) * 100

                    setup["forward_gain_6m"] = round(gain_pct, 2)
                    setup["forward_drop_6m"] = round(drop_pct, 2)

                    # 🔥 NEW: track week
                    setup["scan_week"] = scan_index + 1
                    setup["scan_date"] = str(scan_date.date())

                    results.append(setup)

        print(f"Batch {i // BATCH_SIZE + 1} processed...")
        time.sleep(SLEEP_TIME)

        # 🔥 NEW: collect all weeks
        all_results.extend(results)

    # =========================
    # 🧠 SORT RESULTS
    # =========================
    results = sorted(
        all_results,
        key=lambda x: (
            x["score"],
            -x["distance_to_high"],
            x["volume_ratio"]
        ),
        reverse=True
    )

    # =========================
    # 🎯 ADD RANK + GRADE
    # =========================
    for i, r in enumerate(results):

        r["rank"] = i + 1

        if r["score"] >= 7:
            r["grade"] = "A"
        elif r["score"] == 6:
            r["grade"] = "B+"
        elif r["score"] == 5:
            r["grade"] = "B"
        else:
            r["grade"] = "C"

    # =========================
    # 🔥 TAKE TOP 30
    # =========================
    top_results = results[:250]

    # =========================
    # 💾 SAVE FILES
    # =========================
    try:
        with open("smart_money_full.json", "w") as f:
            json.dump(results, f, indent=2)

        with open("smart_money_top250.json", "w") as f:
            json.dump(top_results, f, indent=2)

        print(f"\n🧠 Total setups found: {len(results)}")
        print(f"🔥 Top 250 saved for analysis")

    except Exception as e:
        print(f"❌ Save failed: {e}")

# =========================
# ▶ RUN (MULTI-WEEK MODE)
# =========================
if __name__ == "__main__":

    start_time = time.time()

    print("===================================")
    print("🧠 SMART MONEY MULTI-WEEK BACKTEST")
    print("===================================\n")

    try:
        run_scanner()

    except KeyboardInterrupt:
        print("\n⚠️ Stopped manually")

    except Exception as e:
        print(f"\n❌ Fatal error: {e}")

    end_time = time.time()
    runtime = round(end_time - start_time, 2)

    print("\n===================================")
    print(f"⏱ Runtime: {runtime} seconds")
    print("📊 Multi-week validation complete")
    print("===================================")