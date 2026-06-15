import json
import requests
import os
from datetime import datetime, timedelta
import time

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

# =========================
# FILE PATHS
# =========================
WATCHLIST_FILE = "free_breakout_watchlist.json"

SMA_LONG = 70
EARLY_STOP = 0.04

# =========================
# FETCH DAILY DATA
# =========================
def fetch_latest_candle(symbol):

    url = f"https://api.twelvedata.com/time_series?symbol={symbol}&interval=1day&outputsize=100&apikey={API_KEY}"

    try:
        r = requests.get(url, timeout=10).json()
        values = r.get("values", [])

        if not values or len(values) < SMA_LONG + 5:
            return None

        # oldest → newest
        values = list(reversed(values))

        latest = values[-1]
        prev = values[-2]

        return {
            "price": float(latest["close"]),
            "low": float(latest["low"]),
            "prev_price": float(prev["close"]),
            "history": values
        }

    except:
        return None

# =========================
# JSON HELPERS
# =========================
def load_json(file, default):
    if not os.path.exists(file):
        return default
    try:
        with open(file, "r") as f:
            return json.load(f)
    except:
        return default

def save_json(file, data):
    with open(file, "w") as f:
        json.dump(data, f, indent=2)

# =========================
# EXACT EXIT LOGIC (MATCH BACKTEST)
# =========================
def check_exit(price_group, entry, price, low_price, prev_price, days, history):

    # 🔵 LARGE HARD STOP (FIRST PRIORITY)
    if price_group == "LARGE":
        if low_price <= entry * 0.93:
            return "HARD_STOP_LARGE", entry * 0.93

    # 🟢 SMALL CAP
    if price_group == "SMALL":

        if days <= 5 and price < entry:
            return "FAILED_BREAKOUT_SMALL", price

        if days <= 3 and price <= entry * 0.96:
            return "EARLY_STOP_SMALL", price

    # 🟡 MID CAP
    if price_group == "MID":

        if days <= 3 and price < entry * 0.97:
            return "FAILED_MID_BREAKOUT", price

        if days > 10 and price < entry:
            return "FAILED_MID_TREND", price

        if low_price <= entry * 0.92:
            return "HARD_STOP_MID", entry * 0.92

    # 🔵 LARGE AFTER DAY 5
    if price_group == "LARGE":
        if days > 5:
            if low_price <= entry * 0.93:
                return "HARD_STOP_LARGE", entry * 0.93

    # 🌍 GLOBAL EARLY STOP
    if days <= 3:
        if price <= entry * (1 - EARLY_STOP):
            return "EARLY_STOP", price

    # 📉 SMA EXIT (ONLY IF STILL OPEN)
    if len(history) >= SMA_LONG + 1:

        sma = sum(float(x["close"]) for x in history[-SMA_LONG:]) / SMA_LONG
        prev_sma = sum(float(x["close"]) for x in history[-SMA_LONG-1:-1]) / SMA_LONG

        if price < sma and prev_price >= prev_sma:
            return "EXIT", price

    # STILL OPEN
    return "HOLD", price

# =========================
# UPDATE STATS
# =========================
def update_stats(history):

    if not history:
        save_json(STATS_FILE, {})
        return

    total = len(history)
    wins = [t for t in history if t["percent_move"] > 0]

    stats = {
        "total_trades": total,
        "win_rate": round(len(wins)/total * 100, 2),
        "avg_return": round(sum(t["percent_move"] for t in history)/total, 2),
        "best_trade": max(history, key=lambda x: x["percent_move"]),
        "worst_trade": min(history, key=lambda x: x["percent_move"])
    }

    save_json(STATS_FILE, stats)

# =========================
# MAIN TRACKER
# =========================
def run_tracker():

    print("🚀 Running EXACT trade tracker...\n")

    trades = load_json(WATCHLIST_FILE, [])

    updated_watchlist = []

    for trade in trades:

        symbol = trade["symbol"]
        entry = float(trade["entry_price"])
        entry_date_str = trade.get("entry_date") or trade.get("date")

        if not entry_date_str:
            print(f"⚠️ Missing date for {trade['symbol']}")
            continue

        entry_date = datetime.fromisoformat(entry_date_str)
        price_group = trade.get("price_group")

        # =========================
        # ✅ FIXED DATA FETCH + SETUP
        # =========================

        # increment days (ALWAYS RUN)
        days = trade.get("days_held", 0) + 1

        # ALWAYS fetch latest candle
        candle = fetch_latest_candle(symbol)

        if not candle:
            print(f"⚠️ Skipping {symbol} (no data)")
            updated_watchlist.append(trade)
            continue

        # =========================
        # 📊 EXTRACT PRICE DATA (ALWAYS RUN)
        # =========================

        price = candle["price"]
        low_price = candle["low"]
        prev_price = candle["prev_price"]
        history_data = candle["history"]

        # =========================
        # 📊 TRUE WEEKLY PERFORMANCE (STABLE + CLEAN)
        # =========================

        today = datetime.now()
        weekday = today.weekday()

        monday = today - timedelta(days=weekday)
        monday_str = monday.strftime("%Y-%m-%d")

        # 🔥 STEP 1 — RESET ONLY ON NEW WEEK
        if trade.get("week_start") != monday_str:
            trade["week_start"] = monday_str
            trade["week_start_price"] = price

        # 🔥 STEP 2 — FIX LEGACY BAD DATA (ENTRY PRICE USED AS BASELINE)
        entry_price = trade.get("entry_price")

        if (
            entry_price
            and "week_start_price" in trade
            and abs(trade["week_start_price"] - entry_price) / entry_price < 0.05
        ):
            # if baseline is within 5% of entry → it's wrong
            trade["week_start_price"] = price

        # 🔥 STEP 3 — SAFETY: PREVENT EXTREME WEEKLY VALUES
        start_price = trade.get("week_start_price", price)

        if start_price == 0:
            start_price = price

        weekly_change = ((price - start_price) / start_price) * 100

        # cap unrealistic values (optional but recommended)
        if abs(weekly_change) > 50:
            weekly_change = 0

        trade["weekly_change_percent"] = round(weekly_change, 2)

        # =========================
        # 🧠 PRICE GROUP FALLBACK (CLEAN)
        # =========================

        if not price_group:
            if entry < 20:
                price_group = "SMALL"
            elif entry < 80:
                price_group = "MID"
            else:
                price_group = "LARGE"

        # =========================
        # EXACT EXIT CALL
        # =========================
        status, exit_price = check_exit(
            price_group,
            entry,
            price,
            low_price,
            prev_price,
            days,
            history_data
        )

        # =========================
        # UPDATE LIVE VALUES
        # =========================
        trade["current_price"] = round(price, 2)
        trade["change_percent"] = round(((price - entry) / entry) * 100, 2)
        trade["days_held"] = days

        # =========================
        # CLOSE TRADE
        # =========================
        if status != "HOLD":

            percent_move = ((exit_price - entry) / entry) * 100

            print(
                f"🗑️ REMOVED {symbol} | "
                f"{status} | "
                f"{round(percent_move,2)}%"
            )

        else:

            updated_watchlist.append(trade)

    # =========================
    # SAVE ALL FILES
    # =========================
    save_json(
        WATCHLIST_FILE,
        updated_watchlist
    )

    print(
        f"\n✅ Watchlist stocks remaining: "
        f"{len(updated_watchlist)}"
    )

# =========================
# RUN
# =========================
if __name__ == "__main__":
    run_tracker()