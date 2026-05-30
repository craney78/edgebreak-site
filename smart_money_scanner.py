# =========================
# 🧠 SMART MONEY SCANNER (BASIC)
# =========================

import requests
import json
import time
import pandas as pd
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

BATCH_SIZE = 10
SLEEP_TIME = 2
SCAN_LIMIT = 500


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
        f"&outputsize=200"
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
# 🧠 SMART MONEY LOGIC (V3)
# =========================
def detect_smart_money(symbol, values):

    if len(values) < 60:
        return None

    try:
        closes = [float(v["close"]) for v in values]
        volumes = [float(v["volume"]) for v in values]
        lows = [float(v["low"]) for v in values]
        highs = [float(v["high"]) for v in values]

        recent_closes = closes[-20:]
        recent_volumes = volumes[-20:]

        # =========================
        # 📊 RANGE COMPRESSION
        # =========================
        recent_range = max(recent_closes) - min(recent_closes)
        prev_range = max(closes[-40:-20]) - min(closes[-40:-20])

        tightening = recent_range < prev_range

        range_percent = ((max(recent_closes) - min(recent_closes)) / min(recent_closes)) * 100

        # =========================
        # 📊 VOLATILITY CONTRACTION (NEW 🔥)
        # =========================
        ranges = [highs[i] - lows[i] for i in range(-20, 0)]

        avg_range_recent = sum(ranges[-5:]) / 5
        avg_range_earlier = sum(ranges[:5]) / 5

        volatility_contracting = avg_range_recent < avg_range_earlier

        # =========================
        # 📊 VOLUME ANALYSIS
        # =========================
        avg_vol_50 = sum(volumes[-50:]) / 50
        avg_vol_20 = sum(recent_volumes) / 20

        volume_ratio = avg_vol_20 / avg_vol_50

        # 🔥 volume bias
        up_vol = 0
        down_vol = 0

        for i in range(-20, 0):
            if closes[i] > closes[i - 1]:
                up_vol += volumes[i]
            else:
                down_vol += volumes[i]

        volume_bias = up_vol > down_vol

        # =========================
        # 📊 ABSORPTION (NEW 🔥)
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
        # 📊 POSITION IN BASE
        # =========================
        resistance = max(recent_closes)
        current_price = closes[-1]

        distance_to_high = ((resistance - current_price) / resistance) * 100
        near_high = distance_to_high < 5

        # =========================
        # 📊 TREND FILTER (NEW 🔥)
        # =========================
        avg_50_price = sum(closes[-50:]) / 50
        trend = current_price > avg_50_price

        # =========================
        # 🧠 WEIGHTED SCORING SYSTEM
        # =========================
        score = 0

        if tightening:
            score += 1
        if volatility_contracting:
            score += 2   # 🔥 very important
        if volume_ratio > 1.2:
            score += 1
        if volume_bias:
            score += 1
        if absorption:
            score += 2   # 🔥 strong signal
        if higher_lows:
            score += 1
        if near_high:
            score += 1
        if trend:
            score += 1

        # =========================
        # 🎯 FINAL FILTER
        # =========================
        if score >= 5 and range_percent < 25:
            return {
                "symbol": symbol,
                "type": "SMART_MONEY",
                "price": round(current_price, 2),
                "range_percent": round(range_percent, 2),
                "volume_ratio": round(volume_ratio, 2),
                "distance_to_high": round(distance_to_high, 2),
                "score": score,
                "tightening": tightening,
                "volatility_contracting": volatility_contracting,
                "absorption": absorption,
                "trend": trend
            }

    except Exception as e:
        print(f"{symbol} error: {e}")

    return None


# =========================
# 🚀 MAIN SCAN LOOP
# =========================
def run_scanner():

    print("🧠 RUNNING SMART MONEY SCANNER...\n")

    symbols = build_nasdaq_universe()

    results = []

    for i in range(0, len(symbols), BATCH_SIZE):

        batch = symbols[i:i + BATCH_SIZE]

        data = fetch_batch(batch)

        for symbol, content in data.items():

            values = content.get("values")

            if not values or len(values) < 50:
                continue

            # oldest → newest
            values = list(reversed(values))

            setup = detect_smart_money(symbol, values)

            if setup:
                results.append(setup)

        print(f"Batch {i // BATCH_SIZE + 1} processed...")
        time.sleep(SLEEP_TIME)

    # =========================
    # 💾 SAVE RESULTS
    # =========================
    try:
        with open("smart_money.json", "w") as f:
            json.dump(results, f, indent=2)

        print(f"\n🧠 Found {len(results)} smart money setups")

    except Exception as e:
        print(f"❌ Save failed: {e}")


# =========================
# ▶ RUN
# =========================
if __name__ == "__main__":
    run_scanner()