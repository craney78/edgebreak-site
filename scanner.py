import requests
import time
import csv
import os

from breakout_logic import detect_breakout_today

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"
SYMBOL_FILE = "nasdaq_symbols.txt"

BATCH_SIZE = 20
SLEEP_TIME = 1.5
SCAN_LIMIT = 9999


# =========================
# 📂 LOAD SYMBOLS
# =========================

def load_symbols():
    with open(SYMBOL_FILE, "r") as f:
        return [line.strip() for line in f if line.strip()]


# =========================
# 🌐 FETCH DATA
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
# 🧠 PROCESS DATA
# =========================

def process_data(data, debug=False):
    signals = []

    for symbol, content in data.items():

        if not isinstance(content, dict):
            continue

        values = content.get("values")
        if not values or len(values) < 60:
            continue

        try:
            window = values[:50]

            result = detect_breakout_today(symbol, window, debug)

            if result:
                print(
                    f"{result['symbol']} | {result['grade']} | {result['setup_type']} | "
                    f"Score {result['score']} | "
                    f"Break {result['breakout_strength']}%"
                )
                signals.append(result)

        except Exception as e:
            print(f"{symbol} error: {e}")

    return signals


# =========================
# 🏆 SORTING (GRADE FIRST)
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
# 📊 SAVE WATCHLIST
# =========================

def save_watchlist(signals):
    with open("watchlist.txt", "w", encoding="utf-8") as f:
        f.write("💎 RANKED BREAKOUTS\n\n")

        for s in signals:
            f.write(
                f"{s['symbol']} | {s['grade']} | {s['setup_type']} | "
                f"Score {s['score']} | "
                f"Break {s['breakout_strength']}%\n"
                f"→ {s['insight']}\n\n"
            )

    print("\n📄 Watchlist saved")


# =========================
# 📈 PERFORMANCE TRACKING
# =========================

def log_to_csv(signals, filename="breakout_history.csv"):
    file_exists = os.path.isfile(filename)

    with open(filename, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow([
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
            ])

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
# 🚀 MAIN RUNNER
# =========================

def run():
    print("🚀 SCANNING NASDAQ...\n")

    symbols = load_symbols()[:SCAN_LIMIT]
    all_signals = []

    for i in range(0, len(symbols), BATCH_SIZE):
        batch = symbols[i:i + BATCH_SIZE]

        print(f"Batch {i // BATCH_SIZE + 1}")

        data = fetch_batch(batch)
        signals = process_data(data, debug=False)

        all_signals.extend(signals)

        time.sleep(SLEEP_TIME)

    # =========================
    # 🏆 SORT FINAL OUTPUT
    # =========================

    all_signals = sort_signals(all_signals)

    print("\n💎 BREAKOUTS (RANKED):\n")

    for s in all_signals:
        print(
            f"{s['symbol']} | {s['grade']} | {s['setup_type']} | "
            f"Score {s['score']} | "
            f"Break {s['breakout_strength']}%\n"
            f"→ {s['insight']}\n"
        )

    # =========================
    # 💾 SAVE + TRACK
    # =========================

    save_watchlist(all_signals)
    log_to_csv(all_signals)

    print(f"\nTOTAL BREAKOUTS: {len(all_signals)}")


if __name__ == "__main__":
    run()