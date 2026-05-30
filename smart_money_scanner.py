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
SCAN_LIMIT = 500

# =========================
# ⏪ BACKTEST SETTINGS
# =========================

TEST_DAYS_AGO = 180   # how far back to scan (6 months)
MIN_LOOKBACK = 60     # data needed for smart money detection

# =========================
# 📊 OUTPUT CONTROL
# =========================

TOP_N = 10            # how many to show in final list
SAVE_FULL = True      # save full ranked list
SAVE_TOP = True       # save top N


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

        max_price = max(closes_forward)
        min_price = min(closes_forward)

        gain_pct = ((max_price - entry_price) / entry_price) * 100
        drop_pct = ((min_price - entry_price) / entry_price) * 100

        setup["forward_gain_6m"] = round(gain_pct, 2)
        setup["forward_drop_6m"] = round(drop_pct, 2)

        results.append(setup)


# =========================
# 🧠 SORT BY QUALITY
# =========================
results = sorted(
    results,
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

    # 🔥 grade system (based on your B+ discovery)
    if r["score"] >= 7:
        r["grade"] = "A"
    elif r["score"] == 6:
        r["grade"] = "B+"
    elif r["score"] == 5:
        r["grade"] = "B"
    else:
        r["grade"] = "C"


# =========================
# 🔥 TAKE TOP 30 (FOR ANALYSIS)
# =========================
top_results = results[:30]


# =========================
# 💾 SAVE FILES
# =========================
if SAVE_FULL:
    with open("smart_money_full.json", "w") as f:
        json.dump(results, f, indent=2)

if SAVE_TOP:
    with open("smart_money_top30.json", "w") as f:
        json.dump(top_results, f, indent=2)


# =========================
# 📊 SUMMARY OUTPUT
# =========================
print(f"\n🧠 Total setups found: {len(results)}")
print(f"🔥 Top 30 saved for analysis")


# =========================
# 🚀 MAIN SCAN LOOP (BACKTEST VERSION)
# =========================
def run_scanner():

    print("🧠 RUNNING SMART MONEY BACKTEST...\n")

    symbols = build_nasdaq_universe()

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

                max_price = max(closes_forward)
                min_price = min(closes_forward)

                gain_pct = ((max_price - entry_price) / entry_price) * 100
                drop_pct = ((min_price - entry_price) / entry_price) * 100

                setup["forward_gain_6m"] = round(gain_pct, 2)
                setup["forward_drop_6m"] = round(drop_pct, 2)

                results.append(setup)

        print(f"Batch {i // BATCH_SIZE + 1} processed...")
        time.sleep(SLEEP_TIME)

    # =========================
    # 🧠 SORT RESULTS
    # =========================
    results = sorted(
        results,
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
    top_results = results[:30]

    # =========================
    # 💾 SAVE FILES
    # =========================
    try:
        with open("smart_money_full.json", "w") as f:
            json.dump(results, f, indent=2)

        with open("smart_money_top30.json", "w") as f:
            json.dump(top_results, f, indent=2)

        print(f"\n🧠 Total setups found: {len(results)}")
        print(f"🔥 Top 30 saved for analysis")

    except Exception as e:
        print(f"❌ Save failed: {e}")

# =========================
# ▶ RUN
# =========================
if __name__ == "__main__":

    start_time = time.time()

    print("===================================")
    print("🧠 SMART MONEY BACKTEST STARTING")
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
    print("✅ Scan complete")
    print("===================================")        