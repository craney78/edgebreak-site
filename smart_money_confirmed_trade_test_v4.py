# ===================================
# SMART MONEY CONFIRMED TRADE TESTER
# V1
# ===================================

import json
import requests
import pandas as pd
from datetime import datetime

API_KEY = "YOUR_API_KEY"

# ===================================
# LOAD CONFIRMED TRADES
# ===================================

with open("confirmed.json", "r") as f:
    confirmed = json.load(f)

print(f"Loaded {len(confirmed)} confirmed setups")

# ===================================
# FETCH DATA
# ===================================

def fetch_data(symbol):

    url = (
        f"https://api.twelvedata.com/time_series"
        f"?symbol={symbol}"
        f"&interval=1day"
        f"&outputsize=1000"
        f"&apikey={API_KEY}"
    )

    try:

        r = requests.get(url, timeout=30)

        if r.status_code != 200:
            return None

        data = r.json()

        if "values" not in data:
            return None

        df = pd.DataFrame(data["values"])

        df = df.rename(columns={
            "datetime": "date"
        })

        df["date"] = pd.to_datetime(df["date"])

        for col in [
            "open",
            "high",
            "low",
            "close",
            "volume"
        ]:
            df[col] = pd.to_numeric(df[col])

        df = (
            df
            .sort_values("date")
            .reset_index(drop=True)
        )

        return df

    except Exception as e:

        print(symbol, e)

        return None


# ===================================
# TEST SINGLE TRADE
# ===================================

def test_trade(df, entry_date, entry_price):

    trade = df[
        df["date"] >= entry_date
    ].copy()

    if len(trade) < 70:

        latest = trade.iloc[-1]

        return {
            "exit_date":
                latest["date"].strftime("%Y-%m-%d"),

            "exit_price":
                round(float(latest["close"]), 2),

            "return_pct":
                round(
                    (
                        (latest["close"] - entry_price)
                        / entry_price
                    ) * 100,
                    2
                ),

            "exit_reason":
                "OPEN"
        }

    stop_price = entry_price * 0.93

    for idx in range(70, len(trade)):

        close = float(
            trade.iloc[idx]["close"]
        )

        current_date = (
            trade.iloc[idx]["date"]
        )

        sma70 = (
            trade.iloc[idx-69:idx+1]["close"]
            .mean()
        )

        # ==========================
        # STOP LOSS
        # ==========================

        if close <= stop_price:

            return {

                "exit_date":
                    current_date.strftime(
                        "%Y-%m-%d"
                    ),

                "exit_price":
                    round(close, 2),

                "return_pct":
                    round(
                        (
                            (close - entry_price)
                            / entry_price
                        ) * 100,
                        2
                    ),

                "exit_reason":
                    "STOP"
            }

        # ==========================
        # SMA70 EXIT
        # ==========================

        if close < sma70:

            return {

                "exit_date":
                    current_date.strftime(
                        "%Y-%m-%d"
                    ),

                "exit_price":
                    round(close, 2),

                "return_pct":
                    round(
                        (
                            (close - entry_price)
                            / entry_price
                        ) * 100,
                        2
                    ),

                "exit_reason":
                    "SMA70"
            }

    # ==========================
    # STILL OPEN
    # ==========================

    latest = trade.iloc[-1]

    return {

        "exit_date":
            latest["date"].strftime(
                "%Y-%m-%d"
            ),

        "exit_price":
            round(
                float(latest["close"]),
                2
            ),

        "return_pct":
            round(
                (
                    (latest["close"] - entry_price)
                    / entry_price
                ) * 100,
                2
            ),

        "exit_reason":
            "OPEN"
    }


# ===================================
# MAIN LOOP
# ===================================

trade_results = []

for i, trade in enumerate(confirmed):

    symbol = trade["symbol"]

    print(
        f"{i+1}/{len(confirmed)} "
        f"{symbol}"
    )

    df = fetch_data(symbol)

    if df is None:
        continue

    entry_date = pd.to_datetime(
        trade["confirmation_date"]
    )

    entry_price = float(
        trade["price"]
    )

    result = test_trade(
        df,
        entry_date,
        entry_price
    )

    trade_results.append({

        "symbol":
            symbol,

        "grade":
            trade.get("grade", "?"),

        "entry_date":
            trade["confirmation_date"],

        "entry_price":
            round(entry_price, 2),

        "exit_date":
            result["exit_date"],

        "exit_price":
            result["exit_price"],

        "return_pct":
            result["return_pct"],

        "exit_reason":
            result["exit_reason"]
    })


# ===================================
# SAVE RESULTS
# ===================================

with open(
    "smart_money_confirmed_trades.json",
    "w"
) as f:

    json.dump(
        trade_results,
        f,
        indent=2
    )

# ===================================
# STATISTICS
# ===================================

returns = [
    x["return_pct"]
    for x in trade_results
]

wins = [
    x
    for x in trade_results
    if x["return_pct"] > 0
]

losses = [
    x
    for x in trade_results
    if x["return_pct"] <= 0
]

win_rate = (
    len(wins)
    / len(trade_results)
    * 100
    if trade_results
    else 0
)

avg_return = (
    sum(returns)
    / len(returns)
    if returns
    else 0
)

best_trade = (
    max(returns)
    if returns
    else 0
)

worst_trade = (
    min(returns)
    if returns
    else 0
)

total_profit = sum(
    10000 * (r / 100)
    for r in returns
)

# ===================================
# RESULTS
# ===================================

print("\n========================")
print("SMART MONEY CONFIRMED")
print("========================")

print(
    f"Trades: {len(trade_results)}"
)

print(
    f"Wins: {len(wins)}"
)

print(
    f"Losses: {len(losses)}"
)

print(
    f"Win Rate: {win_rate:.2f}%"
)

print(
    f"Average Return: {avg_return:.2f}%"
)

print(
    f"Best Trade: {best_trade:.2f}%"
)

print(
    f"Worst Trade: {worst_trade:.2f}%"
)

print(
    f"Profit Per Trade "
    f"(10k position): "
    f"${avg_return * 100:.2f}"
)

print(
    f"Total Profit "
    f"(10k per trade): "
    f"${total_profit:,.2f}"
)

print(
    "\nSaved:"
)

print(
    "smart_money_confirmed_trades.json"
)