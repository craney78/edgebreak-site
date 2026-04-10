import requests
import time
import csv
import os
import json
import pandas as pd

from breakout_logic import detect_breakout_today

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

BATCH_SIZE = 10
SLEEP_TIME = 2
SCAN_LIMIT = 3200

# =========================
# BUILD NASDAQ UNIVERSE (MATCH BACKTEST)
# =========================
def build_nasdaq_universe():

    url = "https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt"

    try:
        df = pd.read_csv(url, sep="|")

        # 🔥 VALIDATE DATA
        if "Symbol" not in df.columns:
            print("❌ Nasdaq file missing Symbol column")
            return []

        clean = df[
            (df["ETF"] == "N") &
            (df["Test Issue"] == "N")
        ]

        clean = clean[~clean["Symbol"].str.contains(r"\.|W$|R$|P$|Q$", regex=True)]
        clean = clean[clean["Symbol"].str.len() <= 5]

        symbols = clean["Symbol"].dropna().tolist()

        print(f"✅ Loaded {len(symbols)} NASDAQ symbols")

        return symbols

    except Exception as e:
        print(f"❌ Failed to load NASDAQ universe: {e}")
        return []

 
# =========================
# FETCH DATA (STABLE EOD VERSION ✅)
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
        headers = {
            "User-Agent": "Mozilla/5.0"
        }

        response = requests.get(url, headers=headers, timeout=20)

        if response.status_code != 200:
            print(f"⚠️ HTTP {response.status_code}")
            return {}

        try:
            data = response.json()
        except:
            print("⚠️ JSON decode failed")
            return {}

        # 🔥 HANDLE API LIMIT / ERROR RESPONSE
        if "code" in data:
            print(f"⚠️ API Error: {data.get('message')}")
            return {}

        # ✅ VALID RESPONSE
        return data if isinstance(data, dict) else {}

    except Exception as e:
        print(f"API error: {e}")

    return {}



def process_data(data):
    signals = []
    seen = set()

    for symbol, content in data.items():

        if not isinstance(content, dict):
            continue

        values = content.get("values")

        # =========================
        # DATA CHECK
        # =========================
        if not values or len(values) < 150:
            continue

        try:
            # oldest → newest
            values = list(reversed(values))

            # =========================
            # MAIN SCAN LOOP
            # =========================
            i = len(values) - 1

                # 🔥 MATCH BACKTEST ORIENTATION
            window = list(reversed(values[i-100:i]))

            # =========================
            # 🔥 LIQUIDITY FILTER (BACKTEST MATCH)
            # =========================
            avg_volume = sum(float(d["volume"]) for d in window[1:21]) / 20
            if avg_volume < 500000:
                continue

                # =========================
                # 🎯 BREAKOUT LOGIC
                # =========================
                result = detect_breakout_today(symbol, window)

                if not result:
                    continue

                # =========================
                # 🔥 VOLUME CONFIRMATION
                # =========================
                recent_volumes = [float(d["volume"]) for d in window[1:21]]
                avg_vol = sum(recent_volumes) / len(recent_volumes)
                current_vol = float(window[0]["volume"])

                volume_ratio = current_vol / avg_vol

                if volume_ratio < 1.3:
                    continue

                # =========================
                # 💰 PRICE GROUP
                # =========================
                current_price = float(window[0]["close"])

                if current_price < 20:
                    price_group = "SMALL"
                elif current_price < 80:
                    price_group = "MID"
                else:
                    price_group = "LARGE"

                # =========================
                # 🔵 LARGE CAP TREND FILTER
                # =========================
                if price_group == "LARGE":
                    sma_long = sum(float(x["close"]) for x in window[1:71]) / 70

                    if current_price < sma_long:
                        continue

                # =========================
                # 🎯 GRADE FILTER
                # =========================
                grade = result["grade"]

                if price_group == "SMALL" and grade != "B+":
                    continue
                if price_group == "MID" and grade != "B":
                    continue
                if price_group == "LARGE" and grade not in ["B+", "A+"]:
                    continue

                # =========================
                # 🧱 STRUCTURE FILTER (MATCH BACKTEST)
                # =========================
                history = window[1:]

                recent_lows = [float(d["low"]) for d in history[:5]]

                higher_lows = sum([
                    recent_lows[0] > recent_lows[1],
                    recent_lows[1] > recent_lows[2]
                ])

                if higher_lows < 2:
                    continue

                # =========================
                # 🧱 RESISTANCE FILTER (MATCH BACKTEST)
                # =========================
                resistance = max(float(d["high"]) for d in history[:80])

                touches = sum(
                    1 for d in history[:80]
                    if abs(float(d["high"]) - resistance) / resistance < 0.015
                )

                if touches < 2:
                    continue

                # =========================
                # 🚫 DUPLICATE CHECK
                # =========================
                key = symbol
                if key in seen:
                    continue
                seen.add(key)

                # =========================
                # ✅ FINAL SIGNAL
                # =========================
                print(
                    f"{result['symbol']} | {grade} | "
                    f"Score {result['score']} | "
                    f"Break {result['breakout_strength']}%"
                )

                signals.append({
                    "symbol": result["symbol"],
                    "date": window[0]["datetime"],
                    "price": current_price,
                    "grade": grade,
                    "score": result["score"],
                    "breakout_strength": result["breakout_strength"],
                    "price_group": price_group,
                    "volume_ratio": round(volume_ratio, 2),
                    "resistance": resistance,

                    # ✅ ADD THESE (PREVENT CRASHES)
                    "setup_type": result.get("setup_type", "breakout"),
                    "insight": result.get("insight", "Breakout with volume"),
                    "day1_return": 0,
                    "day2_return": 0,
                    "result": "OPEN"
                })

        except Exception as e:
            print(f"{symbol} error: {e}")

    # =========================
    # 🔁 REMOVE DUPLICATES (KEEP BEST PER SYMBOL)
    # =========================
    unique = {}

    for s in signals:
        symbol = s["symbol"]

        if symbol not in unique or s["score"] > unique[symbol]["score"]:
            unique[symbol] = s

    return list(unique.values())

# =========================
# SORT SIGNALS
# =========================
GRADE_ORDER = {
    "A+": 5,
    "A": 4,
    "B+": 3,
    "B": 2,
    "C": 1
}

def sort_signals(signals):
    return sorted(
        signals,
        key=lambda x: (GRADE_ORDER.get(x["grade"], 0), x["score"]),
        reverse=True
    )


# =========================
# SAFE FLOAT
# =========================
def safe_float(value):
    try:
        return float(value)
    except:
        return 0


# =========================
# 🧠 GET MARKET CONDITION
# =========================
def get_current_market_label():

    if not os.path.exists("market_status.json"):
        return "UNKNOWN"

    try:
        with open("market_status.json", "r") as f:
            data = json.load(f)
            return data.get("label", "UNKNOWN")
    except:
        return "UNKNOWN"
   

# =========================
# CSV LOGGING
# =========================
FIELDNAMES = [
    "date",
    "symbol",
    "price",
    "resistance",
    "score",
    "grade",
    "setup_type",
    "breakout_strength",
    "volume_ratio",
    "insight",
    "day1_return",
    "day2_return",
    "result"
]

# =========================
# APPEND TO ACTIVE POSITIONS (LIVE SYSTEM)
# =========================
def append_to_active_positions(new_signals):

    file = "active_positions.json"

    if os.path.exists(file):
        with open(file, "r") as f:
            try:
                existing = json.load(f)
            except:
                existing = []
    else:
        existing = []

    existing_symbols = {t["symbol"] for t in existing}

    added = 0

    for s in new_signals:

        if s["symbol"] in existing_symbols:
            continue

        trade = {
            "symbol": s["symbol"],
            "entry_price": s["price"],
            "entry_date": s["date"],
            "grade": s["grade"],
            "price_group": s["price_group"],
            "current_price": s["price"],
            "change_percent": 0,
            "days_held": 0
        }

        existing.append(trade)
        added += 1

    with open(file, "w") as f:
        json.dump(existing, f, indent=2)

    print(f"✅ Added {added} new trades")

# =========================
# MAIN RUN
# =========================
def run():
    print("🚀 SCANNING...\n")

    symbols = build_nasdaq_universe()[:SCAN_LIMIT]
    all_signals = []

    for i in range(0, len(symbols), BATCH_SIZE):
        batch = symbols[i:i + BATCH_SIZE]

        print(f"Batch {i // BATCH_SIZE + 1}")

        data = fetch_batch(batch)

        missing = [s for s in batch if s not in data]
        if missing:
            print(f"⚠️ Missing data for: {missing}")

        signals = process_data(data)
        all_signals.extend(signals)

        time.sleep(SLEEP_TIME)

    all_signals = sort_signals(all_signals)

    # ✅ ONLY RESPONSIBILITY
    if len(all_signals) > 0:
        append_to_active_positions(all_signals)
    else:
        print("⚠️ No new signals")

    print(f"\n📊 TOTAL NEW SIGNALS: {len(all_signals)}")

# =========================
# RUN
# =========================
if __name__ == "__main__":
    run()