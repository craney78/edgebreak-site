import pandas as pd
import os
from datetime import datetime
import json

CSV_FILE = "breakout_history.csv"


# =========================================
# 🧠 ORIGINAL MARKET (COMPLETED TRADES ONLY)
# =========================================
def calculate_market_strength():

    if not os.path.isfile(CSV_FILE):
        return {
            "status": "NO DATA",
            "label": "NO DATA",
            "mode": "CONDITIONAL",
            "message": "No completed trades yet. Waiting for breakout results."
        }

    df = pd.read_csv(CSV_FILE)

    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    df = df[df["date"] >= (datetime.now() - pd.Timedelta(days=10))]

    # ONLY COMPLETED TRADES (keep this strict)
    df = df[df["day1_return"].notna()]

    if df.empty:
        return {
            "status": "NO DATA",
            "label": "NO DATA",
            "mode": "CONDITIONAL",
            "message": "No completed trades yet. Waiting for breakout results."
        }

    total = len(df)

    success = df[df["day1_return"] > 0]
    follow = df[
        (df["day1_return"] > 0) &
        (df["day2_return"] > df["day1_return"])
    ]
    fail = df[df["day1_return"] <= 0]

    success_rate = len(success) / total
    follow_rate = len(follow) / total
    fail_rate = len(fail) / total

    if success_rate > 0.6 and follow_rate > 0.5:
        status = "GREEN"
        label = "STRONG CONDITIONS"
    elif success_rate > 0.4:
        status = "YELLOW"
        label = "MIXED CONDITIONS"
    else:
        status = "RED"
        label = "WEAK CONDITIONS"

    return {
        "status": status,
        "label": label,
        "success_rate": round(success_rate * 100, 2),
        "follow_through_rate": round(follow_rate * 100, 2),
        "failure_rate": round(fail_rate * 100, 2),
        "total_trades": total,
        "mode": "COMPLETED",
        "timestamp": datetime.now().strftime("%Y-%m-%d")
    }


# =========================================
# ⚡ LIVE MARKET (ACTIVE TRADES — NEW)
# =========================================
def calculate_live_market_strength():

    if not os.path.exists("watchlist.json"):
        return {
            "status": "NO DATA",
            "label": "NO DATA",
            "mode": "CONDITIONAL",
            "message": "No active trades available."
        }

    with open("watchlist.json", "r") as f:
        data = json.load(f)

    # Only active trades
    active = [x for x in data if x.get("status") != "failed"]

    if not active:
        return {
            "status": "NO DATA",
            "label": "NO DATA",
            "mode": "CONDITIONAL",
            "message": "No active trades available."
        }

    total = len(active)

    winners = [x for x in active if x.get("change_percent", 0) > 0]
    strong = [x for x in active if x.get("change_percent", 0) > 5]
    losers = [x for x in active if x.get("change_percent", 0) <= 0]

    win_rate = len(winners) / total
    strength_rate = len(strong) / total
    loss_rate = len(losers) / total

    # MARKET CLASSIFICATION
    if win_rate > 0.6 and strength_rate > 0.3:
        status = "GREEN"
        label = "STRONG CONDITIONS"
    elif win_rate > 0.4:
        status = "YELLOW"
        label = "MIXED CONDITIONS"
    else:
        status = "RED"
        label = "WEAK CONDITIONS"

    return {
        "status": status,
        "label": label,
        "win_rate": round(win_rate * 100, 2),
        "strength_rate": round(strength_rate * 100, 2),
        "loss_rate": round(loss_rate * 100, 2),
        "total_trades": total,
        "mode": "LIVE",
        "timestamp": datetime.now().strftime("%Y-%m-%d")
    }


# =========================================
# 💾 SAVE JSON (UNCHANGED)
# =========================================
def save_market_status_json(data, filename="market_status.json"):
    with open(filename, "w") as f:
        json.dump(data, f)


# =========================================
# 🚀 MAIN RUN (UPDATED TO LIVE)
# =========================================
if __name__ == "__main__":

    # 🔥 USE LIVE MARKET (PRIMARY)
    result = calculate_live_market_strength()

    # Save for website
    save_market_status_json(result)

    print("\n🧠 EDGE BREAK MARKET STATUS\n")

    print(f"{result['status']} - {result['label']}")

    if result.get("mode") == "LIVE":
        print(f"Win Rate: {result['win_rate']}%")
        print(f"Strong Moves: {result['strength_rate']}%")
        print(f"Loss Rate: {result['loss_rate']}%")
        print(f"Active Trades: {result['total_trades']}")
    else:
        print(result.get("message", "No data"))