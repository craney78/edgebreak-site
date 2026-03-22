import requests
import time
import csv
import os
import json

from datetime import datetime

from breakout_logic import detect_breakout_today
from market_index import calculate_market_strength, save_market_status_json

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"
SYMBOL_FILE = "nasdaq_symbols.txt"

BATCH_SIZE = 20
SLEEP_TIME = 1.5
SCAN_LIMIT = 9999


# =========================
# LOAD SYMBOLS
# =========================
def load_symbols():
    with open(SYMBOL_FILE, "r") as f:
        return [line.strip() for line in f if line.strip()]


# =========================
# FETCH DATA
# =========================
def fetch_batch(symbols):
    url = (
        f"https://api.twelvedata.com/time_series"
        f"?symbol={','.join(symbols)}"
        f"&interval=1day"
        f"&outputsize=120"
        f"&apikey={API_KEY}"
    )

    try:
        return requests.get(url, timeout=10).json()
    except Exception as e:
        print(f"API error: {e}")
        return {}


# =========================
# PROCESS DATA
# =========================
def process_data(data):
    signals = []

    for symbol, content in data.items():

        if not isinstance(content, dict):
            continue

        values = content.get("values")
        if not values or len(values) < 60:
            continue

        try:
            window = values[:50]

            result = detect_breakout_today(symbol, window)

            if result:
                print(
                    f"{result['symbol']} | {result['grade']} | "
                    f"Score {result['score']} | "
                    f"Break {result['breakout_strength']}%"
                )

                signals.append(result)

        except Exception as e:
            print(f"{symbol} error: {e}")

    return signals


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
# GET LATEST PRICE
# =========================
def get_latest_price(symbol):
    try:
        url = f"https://api.twelvedata.com/price?symbol={symbol}&apikey={API_KEY}"
        data = requests.get(url, timeout=5).json()
        return float(data["price"])
    except:
        return None


# =========================
# SAVE TXT WATCHLIST
# =========================
def save_watchlist(signals):
    with open("watchlist.txt", "w", encoding="utf-8") as f:
        f.write("💎 RANKED BREAKOUTS\n\n")

        for s in signals:
            f.write(
                f"{s['symbol']} | {s['grade']} | "
                f"Score {s['score']} | "
                f"Break {s['breakout_strength']}%\n"
                f"→ {s['insight']}\n\n"
            )

    print("📄 Watchlist TXT saved")


# =========================
# SAVE WATCHLIST JSON (UPGRADED)
# =========================
def save_watchlist_json(new_signals):

    existing = []

    if os.path.exists("watchlist.json"):
        with open("watchlist.json", "r") as f:
            try:
                existing = json.load(f)
            except:
                existing = []

    existing_map = {item["symbol"]: item for item in existing}

    added = 0
    updated = 0

    # =========================
    # UPDATE EXISTING SIGNALS
    # =========================
    for item in existing:

        # AGE
        item["age"] = item.get("age", 0) + 1

        # PRICE UPDATE
        latest_price = get_latest_price(item["symbol"])
        if latest_price:
            item["current_price"] = latest_price

            start_price = item.get("start_price", latest_price)

            change = ((latest_price - start_price) / start_price) * 100
            item["change_percent"] = round(change, 2)

        # DEFAULT STATUS
        if "status" not in item:
            item["status"] = "holding"

        # =========================
        # FAILURE LOGIC
        # =========================
        if item["age"] >= 2:

            resistance = item.get("resistance", item.get("start_price"))
            price = item.get("current_price")

            if resistance and price:

                if price < resistance:
                    item["below_resistance"] = item.get("below_resistance", 0) + 1
                else:
                    item["below_resistance"] = 0

                if item["below_resistance"] >= 2:
                    item["status"] = "failed"

    # =========================
    # ADD NEW SIGNALS
    # =========================
    for s in new_signals:

        if s["symbol"] not in existing_map:

            existing.append({
                "symbol": s["symbol"],
                "score": s["score"],
                "grade": s["grade"],
                "break": s["breakout_strength"],

                "age": 0,
                "status": "breaking",
                "signal_date": s.get("date"),
                "start_price": s.get("price"),
                "resistance": s.get("resistance"),
                "current_price": s.get("price"),
                "change_percent": 0
            })

            added += 1

        else:
            if "grade" not in existing_map[s["symbol"]]:
                existing_map[s["symbol"]]["grade"] = s["grade"]
                updated += 1

    # =========================
    # CLEAN OLD FAILED
    # =========================
    existing = [
        x for x in existing
        if not (x.get("status") == "failed" and x.get("age", 0) > 10)
    ]

    # SAVE
    with open("watchlist.json", "w") as f:
        json.dump(existing, f, indent=2)

    print(f"✅ watchlist.json updated — {added} new, {updated} fixed")


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

def log_to_csv(signals, filename="breakout_history.csv"):
    file_exists = os.path.isfile(filename)

    with open(filename, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow(FIELDNAMES)

        for s in signals:
            writer.writerow([
                s["date"],
                s["symbol"],
                s["price"],
                s["resistance"],
                s["score"],
                s["grade"],
                s["setup_type"],
                s["breakout_strength"],
                s["volume_ratio"],
                s["insight"],
                s["day1_return"],
                s["day2_return"],
                s["result"]
            ])

    print("📊 Logged to breakout_history.csv")


# =========================
# MAIN RUN
# =========================
def run():
    print("🚀 SCANNING...\n")

    symbols = load_symbols()[:SCAN_LIMIT]
    all_signals = []

    for i in range(0, len(symbols), BATCH_SIZE):
        batch = symbols[i:i + BATCH_SIZE]

        print(f"Batch {i // BATCH_SIZE + 1}")

        data = fetch_batch(batch)
        signals = process_data(data)

        all_signals.extend(signals)

        time.sleep(SLEEP_TIME)

    all_signals = sort_signals(all_signals)

    print("\n💎 BREAKOUTS (RANKED):\n")

    for s in all_signals:
        print(
            f"{s['symbol']} | {s['grade']} | Score {s['score']} | Break {s['breakout_strength']}%"
        )

    if len(all_signals) > 0:
        save_watchlist(all_signals)
        save_watchlist_json(all_signals)
        log_to_csv(all_signals)
    else:
        print("⚠️ No new signals — watchlist unchanged")

    market = calculate_market_strength()
    save_market_status_json(market)

    print(f"\nTOTAL NEW SIGNALS: {len(all_signals)}")


if __name__ == "__main__":
    run()