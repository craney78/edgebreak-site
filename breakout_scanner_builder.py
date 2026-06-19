import requests
import time
import os
import json
import pandas as pd
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

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
            # MAIN SCAN (LIVE - TODAY ONLY)
            # =========================
            i = len(values) - 1

            window = list(reversed(values[i-100:i]))

            # 🔥 ADD THIS RIGHT HERE
            if len(window) < 100:
                continue

            # =========================
            # 🔥 VOLUME DATA
            # =========================
            try:

                volumes = [
                    float(d["volume"])
                    for d in window[1:21]
                    if d.get("volume")
                ]

                if len(volumes) < 20:
                    continue

                avg_volume = sum(volumes) / len(volumes)

            except Exception:

                print(
                    f"{symbol} error occurred while calculating volume"
                )

                continue

            # =========================
            # 🎯 BREAKOUT LOGIC
            # =========================

            history = window[1:]

            if len(history) < 80:
                continue

            # Resistance = highest high
            resistance = max(
                float(d["high"])
                for d in history[:80]
            )

            # Count touches/clusters
            touches = sum(
                1
                for d in history[:80]
                if abs(
                    float(d["high"]) - resistance
                ) / resistance < 0.015
            )

            if touches < 2:
                print(
                    f"{symbol} FAILED_TOUCHES "
                    f"{touches}"
                )
                continue

            current_close = float(
                window[0]["close"]
            )

            # Must close above resistance today
            if current_close <= resistance:
                print(
                    f"{symbol} FAILED_BREAKOUT "
                    f"Close={round(current_close,2)} "
                    f"Resistance={round(resistance,2)}"
                )
                continue

            print(
                f"{symbol} PASSED_BREAKOUT "
                f"Touches={touches}"
            )

            
            # =========================
            # 🔥 VOLUME CONFIRMATION
            # =========================
            try:
                recent_volumes = [
                    float(d["volume"])
                    for d in window[1:21]
                    if d.get("volume")
                ]

                if len(recent_volumes) < 20:
                    continue

                avg_vol = sum(recent_volumes) / len(recent_volumes)

                if avg_vol <= 0:
                    continue

                current_vol = float(window[0]["volume"])

                volume_ratio = current_vol / avg_vol

                
            except Exception as e:
                print(f"{symbol} error: {e}")
                continue

            # =========================
            # 💰 PRICE GROUP
            # =========================
            if not window[0].get("close"):
                continue

            current_price = float(window[0]["close"])

            if current_price < 20:
                price_group = "SMALL"
            elif current_price < 80:
                price_group = "MID"
            else:
                price_group = "LARGE"

            
            # =========================
            # 🎯 GRADE FILTER
            # =========================
            if touches >= 5:
                grade = "B+"
                rank = "GOLD"

            elif touches >= 4:
                grade = "A+"
                rank = "SILVER"

            else:
                grade = "A"
                rank = "BRONZE"
                       

            # =========================
            # 🧱 STRUCTURE FILTER (MATCH BACKTEST)
            # =========================
            history = window[1:]

            recent_lows = [float(d["low"]) for d in history[:5]]

            if len(history) < 5:
                continue

            higher_lows = sum([
                recent_lows[0] > recent_lows[1],
                recent_lows[1] > recent_lows[2]
            ])

            if higher_lows < 2:
                print(
                    f"{symbol} FAILED_HIGHER_LOWS "
                    f"{higher_lows}"
                )
                print(f"{symbol} FAILED_HIGHER_LOWS")
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
                f"{symbol} | {grade} | "
                f"Touches={touches}"
            )

            print(
                f"✅ FINAL SIGNAL "
                f"{symbol} "
                f"{grade} "
                f"{price_group}"
                )

            signals.append({

                # =========================
                # CORE
                # =========================

                "rank": rank,

                "symbol": symbol,

                "scan_date": window[0]["datetime"],

                "price": round(
                    current_price,
                    2
                ),

                "price_group": price_group,

                # =========================
                # SCORING
                # =========================

                "grade": grade,

                "score": touches,

                # =========================
                # BREAKOUT
                # =========================

                "resistance": round(
                    resistance,
                    2
                ),

                "distance_above_resistance": round(
                    (
                        (current_price - resistance)
                        / resistance
                    ) * 100,
                    2
                ),

                "breakout_strength": round(
                    ((current_price - resistance) / resistance) * 100,
                    2
                ),

                # =========================
                # STRUCTURE
                # =========================

                "touches": touches,

                "higher_lows": higher_lows,

                # =========================
                # VOLUME
                # =========================

                "volume_ratio": round(
                    volume_ratio,
                    2
                ),

                # =========================
                # SETUP INFO
                # =========================

                "setup_type": "Resistance Breakout",

                "insight": f"{touches} resistance touches"

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

    return list(
        unique.values()
    )

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
# SAVE BREAKOUT SCANNER
# =========================

def save_breakout_scanner(results):

    with open(
        "breakout_scanner.json",
        "w"
    ) as f:

        json.dump(
            results,
            f,
            indent=2
        )

    print(
        f"✅ Saved {len(results)} breakout setups"
    )
# =========================
# MAIN RUN
# =========================

def run():

    print("🚀 BUILDING BREAKOUT SCANNER...\n")

    symbols = build_nasdaq_universe()[:SCAN_LIMIT]

    all_signals = []

    for i in range(
        0,
        len(symbols),
        BATCH_SIZE
    ):

        batch = symbols[
            i:i + BATCH_SIZE
        ]

        print(
            f"Batch {i // BATCH_SIZE + 1}"
        )

        data = fetch_batch(
            batch
        )

        missing = [
            s
            for s in batch
            if s not in data
        ]

        if missing:

            print(
                f"⚠️ Missing data for: {missing}"
            )

        results = process_data(
            data
        )

        all_signals.extend(
            results
        )

        time.sleep(
            SLEEP_TIME
        )

    # =========================
    # SORT RESULTS
    # =========================

    all_signals = sort_signals(
        all_signals
    )

    # =========================
    # SAVE BREAKOUT SCANNER
    # =========================

    save_breakout_scanner(
        all_signals
    )

    print(
        f"✅ Saved {len(all_signals)} breakout setups"
    )

    # =========================
    # UPDATE STATUS
    # =========================

    from datetime import datetime

    with open(
        "breakout_scanner_status.json",
        "w"
    ) as f:

        json.dump(
            {
                "last_scan":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            },
            f,
            indent=2
        )

    print(
        "✅ Breakout scanner updated"
    )


# =========================
# RUN
# =========================

if __name__ == "__main__":

    run()