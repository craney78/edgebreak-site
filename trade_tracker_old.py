import json
import requests
import csv
import os
from datetime import datetime

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

# =========================
# FETCH LATEST PRICE
# =========================
def fetch_latest_price(symbol):

    url = f"https://api.twelvedata.com/price?symbol={symbol}&apikey={API_KEY}"

    try:
        r = requests.get(url, timeout=10).json()
        return float(r["price"])
    except:
        return None


# =========================
# ARCHIVE TRADE
# =========================
def archive_trade(trade):

    file_exists = os.path.isfile("trade_history.csv")

    row = {
        "date": trade.get("date"),
        "symbol": trade.get("symbol"),
        "grade": trade.get("grade"),
        "entry_price": trade.get("price"),
        "exit_price": trade.get("current_price"),
        "percent_move": trade.get("change_percent"),
        "days_held": trade.get("days_held"),
        "status": trade.get("status")
    }

    with open("trade_history.csv", "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=row.keys())

        if not file_exists:
            writer.writeheader()

        writer.writerow(row)


# =========================
# UPDATE TRADES
# =========================
def update_trades():

    if not os.path.exists("watchlist.json"):
        print("❌ No watchlist found")
        return

    with open("watchlist.json", "r") as f:
        trades = json.load(f)

    active_trades = []

    for trade in trades:

        symbol = trade["symbol"]
        entry = float(trade["price"])
        entry_date = datetime.fromisoformat(trade["date"])

        current_price = fetch_latest_price(symbol)

        if current_price is None:
            print(f"⚠️ Skipping {symbol} (no price)")
            active_trades.append(trade)
            continue

        days_held = (datetime.now() - entry_date).days
        change = ((current_price - entry) / entry) * 100

        price_group = trade["price_group"]

        status = "HOLD"

        # =========================
        # 🔵 LARGE CAP LOGIC
        # =========================
        if price_group == "LARGE":

            if current_price <= entry * 0.93:
                status = "HARD_STOP_LARGE"

            if days_held > 5:
                if current_price <= entry * 0.93:
                    status = "HARD_STOP_LARGE"

        # =========================
        # 🟢 SMALL CAP LOGIC
        # =========================
        if price_group == "SMALL":

            if days_held <= 5 and current_price < entry:
                status = "FAILED_BREAKOUT_SMALL"

            if days_held <= 3 and current_price <= entry * 0.96:
                status = "EARLY_STOP_SMALL"

        # =========================
        # 🟡 MID CAP LOGIC
        # =========================
        if price_group == "MID":

            if days_held <= 3 and current_price < entry * 0.97:
                status = "FAILED_MID_BREAKOUT"

            if days_held > 10 and current_price < entry:
                status = "FAILED_MID_TREND"

            if current_price <= entry * 0.92:
                status = "HARD_STOP_MID"

        # =========================
        # 🔵 GLOBAL EARLY STOP
        # =========================
        if days_held <= 3:
            if current_price <= entry * 0.96:
                status = "EARLY_STOP"

        # =========================
        # UPDATE TRADE
        # =========================
        trade["current_price"] = round(current_price, 2)
        trade["change_percent"] = round(change, 2)
        trade["days_held"] = days_held
        trade["status"] = status

        # =========================
        # MOVE TO HISTORY OR KEEP
        # =========================
        if status == "HOLD":
            active_trades.append(trade)
        else:
            archive_trade(trade)
            print(f"📦 Archived: {symbol} | {status} | {round(change,2)}%")

    # =========================
    # SAVE UPDATED WATCHLIST
    # =========================
    with open("watchlist.json", "w") as f:
        json.dump(active_trades, f, indent=2)

    print(f"✅ Active trades remaining: {len(active_trades)}")


# =========================
# RUN
# =========================
if __name__ == "__main__":
    print("🚀 Running Trade Tracker...\n")
    update_trades()