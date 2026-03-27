import requests
import time
import csv
import os
import json

from breakout_logic import detect_breakout_today
from market_index import calculate_live_market_strength, save_market_status_json

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
# SAFE FLOAT
# =========================
def safe_float(value):
    try:
        return float(value)
    except:
        return 0


# =========================
# REBUILD FROM HISTORY
# =========================
def rebuild_from_history():

    if not os.path.exists("breakout_history.csv"):
        print("❌ No CSV found")
        return []

    latest = {}

    with open("breakout_history.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            try:
                symbol = row.get("symbol")

                if not symbol:
                    continue

                latest[symbol] = {
                    "symbol": symbol,
                    "score": safe_float(row.get("score")),
                    "grade": row.get("grade", "C"),
                    "break": safe_float(row.get("breakout_strength")),

                    "age": 1,
                    "status": "holding",
                    "signal_date": row.get("date"),
                    "entry_price": safe_float(row.get("price")),
                    "current_price": safe_float(row.get("price")),
                    "change_percent": 0
                }

            except Exception as e:
                print("Row error:", e)

    print(f"✅ Rebuilt {len(latest)} stocks from history")

    return list(latest.values())


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
# SAVE WATCHLIST TXT
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
# ARCHIVE COMPLETED TRADES (NEW 🔥)
# =========================
def archive_trade(item):

    file_exists = os.path.isfile("trade_history.csv")

    percent_move = item.get("change_percent", 0)

    row = {
        "date": item.get("signal_date"),
        "ticker": item.get("symbol"),
        "grade": item.get("grade"),  # ✅ ADDED
        "result": item.get("status"),
        "breakout_price": item.get("entry_price"),
        "exit_price": item.get("current_price"),
        "percent_move": percent_move,
        "duration_days": item.get("age")
    }

    with open("trade_history.csv", "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=row.keys())

        if not file_exists:
            writer.writeheader()

        writer.writerow(row)


# =========================
# SAVE WATCHLIST JSON
# =========================
def save_watchlist_json(new_signals):

    existing = []

    if os.path.exists("watchlist.json"):
        with open("watchlist.json", "r") as f:
            try:
                existing = json.load(f)
            except:
                existing = []

    if not existing:
        print("⚠️ watchlist empty — rebuilding from history...")
        existing = rebuild_from_history()

    existing_map = {item["symbol"]: item for item in existing}

    # =========================
    # 🔄 UPDATE EXISTING TRADES
    # =========================
    for item in existing:

        item["age"] = item.get("age", 0) + 1

        latest_price = get_latest_price(item["symbol"])
        if latest_price:
            item["current_price"] = latest_price

            entry_price = item.get("entry_price") or item.get("start_price") or latest_price

            entry_price = safe_float(entry_price)
            latest_price = safe_float(latest_price)

            if entry_price > 0:
                change = ((latest_price - entry_price) / entry_price) * 100
                item["change_percent"] = round(change, 2)
            else:
                item["change_percent"] = 0

        if "status" not in item:
            item["status"] = "holding"

        # =========================
        # 🧠 WIN / LOSS LOGIC
        # =========================
        if item["age"] >= 2:

            resistance = item.get("resistance", item.get("entry_price"))
            entry = safe_float(item.get("entry_price"))
            price = safe_float(item.get("current_price"))

            if resistance and price:

                # 🔴 LOSS
                if price < resistance:
                    item["below_resistance"] = item.get("below_resistance", 0) + 1
                else:
                    item["below_resistance"] = 0

                if item["below_resistance"] >= 2:
                    item["status"] = "LOSS"

                # 🟢 WIN
                peak = item.get("peak_price", entry)

                if price > peak:
                    item["peak_price"] = price

                peak = item.get("peak_price", entry)

                pullback = ((price - peak) / peak) * 100 if peak > 0 else 0

                if peak >= entry * 1.12 and pullback <= -5:
                    item["status"] = "WIN"

    # =========================
    # 📦 ARCHIVE COMPLETED TRADES (NO C GRADE)
    # =========================
    completed = []

    for item in existing:

        if item.get("status") in ["WIN", "LOSS"]:

            grade = item.get("grade", "C")

            # ❌ REMOVE C COMPLETELY
            if grade == "C":
                completed.append(item)
                continue

            archive_trade(item)
            completed.append(item)

    # REMOVE completed trades
    existing = [x for x in existing if x not in completed]

    # =========================
    # ➕ ADD NEW SIGNALS
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
                "entry_price": s.get("price"),
                "resistance": s.get("resistance"),
                "current_price": s.get("price"),
                "change_percent": 0
            })

    # =========================
    # 💾 SAVE JSON
    # =========================
    with open("watchlist.json", "w") as f:
        json.dump(existing, f, indent=2)

    print(f"✅ watchlist.json updated — total {len(existing)} stocks")

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

    if len(all_signals) > 0:
        display_list = all_signals
    else:
        display_list = rebuild_from_history()

    display_list = sort_signals(display_list)

    print("\n💎 BREAKOUTS (RANKED):\n")

    for s in display_list:
        print(
            f"{s['symbol']} | {s['grade']} | "
            f"Score {s['score']} | "
            f"Break {s.get('break', s.get('breakout_strength', 0))}%"
        )

    if len(all_signals) > 0:
        save_watchlist(all_signals)
        log_to_csv(all_signals)
    else:
        print("⚠️ No new signals — rebuilding watchlist")

    save_watchlist_json(all_signals)

    market = calculate_live_market_strength()
    save_market_status_json(market)

    print(f"\nTOTAL NEW SIGNALS: {len(all_signals)}")


if __name__ == "__main__":
    run()