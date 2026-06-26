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

# ==========================================
# SMART MONEY FILTER
# ==========================================

def passes_smart_money_filter(data):

    try:

        if len(data) < 60:
            return False

        closes = [float(d["close"]) for d in data]
        highs = [float(d["high"]) for d in data]
        lows = [float(d["low"]) for d in data]
        volumes = [float(d["volume"]) for d in data]

        current_close = closes[-1]

        # ==========================================
        # EVENT A
        # ABSORPTION
        # ==========================================

        absorption_count = 0

        avg_range_20 = sum(
            h - l
            for h, l in zip(highs[-20:], lows[-20:])
        ) / 20

        avg_volume_50 = sum(volumes[-50:]) / 50

        for i in range(-20, 0):

            daily_range = highs[i] - lows[i]

            if daily_range <= 0:
                continue

            close_position = (
                closes[i] - lows[i]
            ) / daily_range

            if (
                volumes[i] > avg_volume_50 * 1.3
                and daily_range < avg_range_20
                and close_position > 0.60
            ):
                absorption_count += 1

        if absorption_count < 2:
            return False

        # ==========================================
        # EVENT B
        # VOLUME CLUSTERING
        # ==========================================

        high_volume_days = 0

        for i in range(-20, 0):

            if volumes[i] > avg_volume_50 * 1.5:
                high_volume_days += 1

        if high_volume_days < 3:
            return False

        # ==========================================
        # EVENT C
        # TIGHT STRUCTURE
        # ==========================================

        high_20 = max(highs[-20:])
        low_20 = min(lows[-20:])

        if low_20 <= 0:
            return False

        range_percent = (
            (high_20 - low_20)
            / low_20
        ) * 100

        if range_percent > 15:
            return False

        # ==========================================
        # EVENT D
        # STRONG CLOSES
        # ==========================================

        strong_close_days = 0

        for i in range(-20, 0):

            daily_range = highs[i] - lows[i]

            if daily_range <= 0:
                continue

            close_position = (
                closes[i] - lows[i]
            ) / daily_range

            if close_position >= 0.60:
                strong_close_days += 1

        if strong_close_days < 5:
            return False

        # ==========================================
        # EVENT E
        # TREND HEALTH
        # ==========================================

        ma50_now = sum(closes[-50:]) / 50

        ma50_old = sum(
            closes[-60:-10]
        ) / 50

        trend_ok = (
            current_close > ma50_now
            or
            ma50_now > ma50_old
        )

        if not trend_ok:
            return False

        # ==========================================
        # PASS
        # ==========================================

        return {
            "absorption_count": absorption_count,
            "high_volume_days": high_volume_days,
            "strong_close_days": strong_close_days,
            "range_percent": round(
                range_percent,
                2
            )
        }

    except Exception:

        return False

# =========================
# 💾 SAVE HISTORY
# KEEPS 4 WEEKS OF DATA
# =========================
def save_history(filename, new_records):

    try:

        with open(filename, "r") as f:

            existing = json.load(f)

    except:

        existing = []

    # =====================
    # ADD NEW RECORDS
    # =====================

    existing.extend(new_records)

    # =====================
    # REMOVE OLD RECORDS
    # =====================

    cutoff_date = (
        datetime.now() -
        timedelta(days=28)
    ).strftime("%Y-%m-%d")

    existing = [

        record

        for record in existing

        if record.get(
            "scan_date",
            "1900-01-01"
        ) >= cutoff_date

    ]

    # =====================
    # SAVE FILE
    # =====================

    with open(filename, "w") as f:

        json.dump(
            existing,
            f,
            indent=2
        )

    return len(existing)    

# =========================
# 🚀 MAIN SCAN LOOP
# =========================

def run_scanner():

    print("🧠 RUNNING SMART MONEY SCAN...\n")

    symbols = build_nasdaq_universe()

    # Today's date (used throughout the scan)
    today = datetime.now().strftime("%Y-%m-%d")

    # =========================
    # LOAD EXISTING RESULTS
    # =========================

    try:

        with open(
            "smart_money_filter.json",
            "r"
        ) as f:

            existing = json.load(f)

    except:

        existing = []

    history = {

        item["symbol"]: item

        for item in existing

    }

    # =========================
    # RESET TODAY'S STATUS
    # =========================

    for stock in history.values():

        stock["smart_money"] = False

    all_results = history.copy()

    

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

            values = list(
                reversed(values)
            )

            if len(values) < MIN_LOOKBACK:
                continue

            result = passes_smart_money_filter(
                values
            )

            if not result:
                continue

            
            previous = history.get(symbol)

            if previous:

                smart_money_dates = previous.get(
                    "smart_money_dates",
                    []
                )

                # Don't add today's date twice
                if today not in smart_money_dates:

                    smart_money_dates.append(today)

            else:
                
                smart_money_dates = [today]

                        

            # =========================
            # SAVE / UPDATE RECORD
            # =========================

            all_results[symbol] = {

                "symbol": symbol,

                "scan_date": today,

                "smart_money": True,

                "smart_money_dates": sorted(
                    smart_money_dates
                ),

                "absorption_count":
                    result["absorption_count"],

                "high_volume_days":
                    result["high_volume_days"],

                "strong_close_days":
                    result["strong_close_days"],

                "range_percent":
                    result["range_percent"]

            }

            print(
                f"{symbol} "
                f"ABS={result['absorption_count']} "
                f"VOL={result['high_volume_days']} "
                f"CLOSES={result['strong_close_days']} "
                f"RANGE={result['range_percent']}%"
            )

        time.sleep(
            SLEEP_TIME
        )

    # =========================
    # SORT RESULTS
    # =========================

    results = sorted(

        all_results.values(),

        key=lambda x:(

            x["absorption_count"],
            x["high_volume_days"],
            x["strong_close_days"]

        ),

    reverse=True

)

     

    # =========================
    # SAVE FILE
    # =========================

    try:

        with open(
            "smart_money_filter.json",
            "w"
        ) as f:

            json.dump(
                results,
                f,
                indent=2
            )

        print(
            f"\n🧠 Smart Money Results: "
            f"{len(results)}"
        )

        print(
            "💾 Saved to smart_money_filter.json"
        )

    except Exception as e:

        print(
            f"❌ Save failed: {e}"
        )

# =========================
# ▶ RUN
# =========================

if __name__ == "__main__":

    start_time = time.time()

    print("===================================")
    print("🧠 SMART MONEY SCANNER")
    print("===================================\n")

    try:

        run_scanner()

    except KeyboardInterrupt:

        print(
            "\n⚠️ Stopped manually"
        )

    except Exception as e:

        print(
            f"\n❌ Fatal error: {e}"
        )

    end_time = time.time()

    runtime = round(
        end_time - start_time,
        2
    )

    print("\n===================================")
    print(
        f"⏱ Runtime: {runtime} seconds"
    )
    print(
        "📊 Smart Money scan complete"
    )
    print("===================================")        