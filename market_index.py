import pandas as pd
import os
from datetime import datetime
import json

CSV_FILE = "breakout_history.csv"


def calculate_market_strength():
    if not os.path.isfile(CSV_FILE):
        return {"status": "NO DATA", "mode": "CONDITIONAL"}

    df = pd.read_csv(CSV_FILE)

    # ✅ ADD DATE FILTER (NEW - SAFE)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    # 🔥 ONLY USE LAST 7 DAYS (RECENT MARKET CONDITIONS)
    df = df[df["date"] >= (datetime.now() - pd.Timedelta(days=7))]

    # Only use completed trades
    df = df[df["day1_return"].notna()]

    if df.empty:
        return {"status": "NO DATA", "mode": "CONDITIONAL"}

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

    # 🧠 MARKET CLASSIFICATION
    if success_rate > 0.6 and follow_rate > 0.5:
        status = "GREEN"
        label = "STRONG CONDITIONS"
    elif success_rate > 0.4:
        status = "YELLOW"
        label = "MIXED CONDITIONS"
    else:
        status = "RED"
        label = "WEAK CONDITIONS"

    # 🧠 DISPLAY CONTROL (YOUR RULE)
    show_stats = success_rate > 0.5 or status == "GREEN"

    if show_stats:
        return {
            "status": status,
            "label": label,
            "success_rate": round(success_rate * 100, 2),
            "follow_through_rate": round(follow_rate * 100, 2),
            "failure_rate": round(fail_rate * 100, 2),
            "total_trades": total,
            "mode": "FULL",
            "timestamp": datetime.now().strftime("%Y-%m-%d")
        }
    else:
        return {
            "status": status,
            "label": label,
            "mode": "CONDITIONAL",
            "message": "Breakouts are currently failing at a high rate. Edge is reduced. Conditions are not favourable.",
            "timestamp": datetime.now().strftime("%Y-%m-%d")
        }


def save_market_status_json(data, filename="market_status.json"):
    with open(filename, "w") as f:
        json.dump(data, f)


if __name__ == "__main__":
    result = calculate_market_strength()

    # Save for website
    save_market_status_json(result)

    print("\n🧠 EDGE BREAK MARKET STATUS\n")

    if result.get("mode") == "FULL":
        print(f"{result['status']} - {result['label']}")
        print(f"Success: {result['success_rate']}%")
        print(f"Follow Through: {result['follow_through_rate']}%")
        print(f"Failure: {result['failure_rate']}%")
        print(f"Trades: {result['total_trades']}")
    else:
        print(f"{result['status']} - {result['label']}")
        print(result["message"])