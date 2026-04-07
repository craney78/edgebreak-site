import requests
import pandas as pd
import time
import json
from datetime import datetime, timedelta

# =========================
# 🔑 CONFIG
# =========================
API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

SMA_LONG = 70
STOP_LOSS = 0.05
STOP_DAYS = 4

STARTING_CAPITAL = 100000
RISK_PER_TRADE = 0.02


# =========================
# BUILD NASDAQ UNIVERSE
# =========================
def build_nasdaq_universe():
    url = "https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt"
    df = pd.read_csv(url, sep="|")

    clean = df[
        (df["ETF"] == "N") &
        (df["Test Issue"] == "N")
    ]

    clean = clean[~clean["Symbol"].str.contains(r"\.|W$|R$|P$|Q$", regex=True)]
    clean = clean[clean["Symbol"].str.len() <= 5]

    return clean["Symbol"].tolist()

# =========================
# FETCH DATA
# =========================
def get_data_batch(symbols):
    url = f"https://api.twelvedata.com/time_series?symbol={','.join(symbols)}&interval=1day&outputsize=5000&apikey={API_KEY}"
    try:
        r = requests.get(url, timeout=20).json()
        if not isinstance(r, dict):
            return {}

        clean_data = {}
        for symbol in symbols:
            data = r.get(symbol)
            if not data or "values" not in data:
                continue
            clean_data[symbol] = data

        return clean_data
    except:
        return {}

# =========================
# IMPORT YOUR LOGIC
# =========================
from breakout_logic import detect_breakout_today

TICKERS = build_nasdaq_universe()


# =========================
# BACKTEST ENGINE
# =========================
def run_backtest():

    results = []

    BATCH_SIZE = 20

    for i in range(0, len(TICKERS), BATCH_SIZE):

        batch = TICKERS[i:i+BATCH_SIZE]
        batch_data = get_data_batch(batch)

        for symbol in batch:

            print(f"\n🔍 Scanning {symbol}")

            content = batch_data.get(symbol)

            # =========================
            # DATA CHECK
            # =========================
            if not content or "values" not in content:
                continue

            df = pd.DataFrame(content["values"])
            df["datetime"] = pd.to_datetime(df["datetime"])
            df = df.sort_values("datetime", ascending=True)

            START_DATE = "2025-01-01"
            END_DATE = "2026-12-31"

            df = df[(df["datetime"] >= START_DATE) & (df["datetime"] <= END_DATE)]

            # ✅ CREATE data FIRST
            data = df.to_dict("records")

            # =========================
            # DATA QUALITY FILTER
            # =========================
            if len(data) < 150:
                continue

            # =========================
            # VOLUME FILTER (NEW 🔥)
            # =========================
            avg_volume = sum(float(d["volume"]) for d in data[-20:]) / 20

            if avg_volume < 500000:
                continue    

            
            # =========================
            # MAIN SCAN LOOP
            # =========================
            seen = set()

            for idx in range(100, len(data) - 2):

                window = list(reversed(data[idx-100:idx]))
                setup = detect_breakout_today(symbol, window)

                if not setup:
                    continue

                # =========================
                # BREAKOUT VOLUME CONFIRMATION 🔥
                # =========================
                recent_volumes = [float(d["volume"]) for d in window[1:21]]
                avg_vol = sum(recent_volumes) / len(recent_volumes)
                current_vol = float(window[0]["volume"])

                volume_ratio = current_vol / avg_vol

                if volume_ratio < 1.3:
                    continue

                # =========================
                # PRICE + GROUP
                # =========================
                current_price = float(data[idx]["close"])

                if current_price < 20:
                    price_group = "SMALL"
                elif current_price < 80:
                    price_group = "MID"
                else:
                    price_group = "LARGE"

                # =========================
                # 🔵 LARGE CAP SMA FILTER 🔥
                # =========================
                if price_group == "LARGE":

                    if idx < SMA_LONG:
                        continue

                    sma_long = sum(float(x["close"]) for x in data[idx-SMA_LONG:idx]) / SMA_LONG

                    if current_price < sma_long:
                        continue

                # =========================
                # GRADE FILTER (UNCHANGED)
                # =========================
                if price_group == "SMALL":
                    if setup["grade"] != "B+":
                        continue

                elif price_group == "MID":
                    if setup["grade"] != "B":
                        continue

                else:  # LARGE
                    if setup["grade"] not in ["B+", "A+"]:
                        continue

                history = window[1:]

                # =========================
                # STRUCTURE
                # =========================
                recent_lows = [float(d["low"]) for d in history[:5]]

                higher_lows = sum([
                    recent_lows[0] > recent_lows[1],
                    recent_lows[1] > recent_lows[2]
                ])

                if higher_lows < 2:
                    continue

                resistance = max(float(d["high"]) for d in history[:80])

                touches_long = sum(
                    1 for d in history[:80]
                    if abs(float(d["high"]) - resistance) / resistance < 0.015
                )

                if touches_long < 2:
                    continue

                key = f"{symbol}_{window[0]['datetime']}"
                if key in seen:
                    continue
                seen.add(key)

                # =========================
                # ENTRY
                # =========================
                entry = float(data[idx]["close"])
                entry_date = data[idx]["datetime"]

                exit_price = entry
                exit_date = entry_date
                status = "OPEN"
                days_held = 0

                # =========================
                # PRICE GROUP (ADD THIS HERE)
                # =========================
                if entry < 20:
                    price_group = "SMALL"
                elif entry < 80:
                    price_group = "MID"
                else:
                    price_group = "LARGE"

                # =========================
                # EXIT LOOP
                # =========================
                for j in range(idx+1, len(data)):

                    candle = data[j]

                    price = float(candle["close"])
                    low_price = float(candle["low"])

                    prev_price = float(data[j-1]["close"])
                    days_held += 1

                    # =========================
                    # 🔵 LARGE CAP HARD STOP ONLY
                    # =========================
                    if price_group == "LARGE":
                        if low_price <= entry * 0.93:
                            status = "HARD_STOP_LARGE"
                            exit_price = entry * 0.93
                            exit_date = candle["datetime"]
                            break
                    
                    # =========================
                    # 🟢 SMALL CAP LOGIC
                    # =========================
                    if price_group == "SMALL":

                        # fast failure
                        if days_held <= 5 and price < entry:
                            status = "FAILED_BREAKOUT_SMALL"
                            exit_price = price
                            exit_date = candle["datetime"]
                            break

                        # early stop
                        if days_held <= 3 and price <= entry * 0.96:
                            status = "EARLY_STOP_SMALL"
                            exit_price = price
                            exit_date = candle["datetime"]
                            break


                    # =========================
                    # 🟡 MID CAP LOGIC
                    # =========================
                    if price_group == "MID":

                        # early failure (SOFTER)
                        if days_held <= 3 and price < entry * 0.97:
                            status = "FAILED_MID_BREAKOUT"
                            exit_price = price
                            exit_date = candle["datetime"]
                            break
                        
                        # slow bleed fix
                        if days_held > 10 and price < entry:
                            status = "FAILED_MID_TREND"
                            exit_price = price
                            exit_date = candle["datetime"]
                            break

                        if price_group == "MID":
                            if low_price <= entry * 0.92:
                                status = "HARD_STOP_MID"
                                exit_price = entry * 0.92
                                exit_date = candle["datetime"]
                                break

                    # =========================
                    # 🔵 LARGE CAP LOGIC
                    # =========================

                    if price_group == "LARGE":

                        # give breakout time
                        if days_held > 5:
                            if low_price <= entry * 0.93:
                                status = "HARD_STOP_LARGE"
                                exit_price = entry * 0.93
                                exit_date = candle["datetime"]
                                break

                    # =========================
                    # 🔵 GLOBAL EARLY STOP
                    # =========================
                    EARLY_STOP = 0.04

                    if days_held <= 3:
                        if price <= entry * (1 - EARLY_STOP):
                            status = "EARLY_STOP"
                            exit_price = price
                            exit_date = candle["datetime"]
                            break


                    # =========================
                    # SMA EXIT
                    # =========================
                    if j >= SMA_LONG:
                        sma_long = sum(float(x["close"]) for x in data[j-SMA_LONG:j]) / SMA_LONG
                        prev_sma_long = sum(float(x["close"]) for x in data[j-SMA_LONG-1:j-1]) / SMA_LONG

                        if price < sma_long and prev_price >= prev_sma_long:
                            status = "EXIT"
                            exit_price = price
                            exit_date = candle["datetime"]
                            break

                # =========================
                # CLOSE IF STILL OPEN
                # =========================
                if status == "OPEN":
                    exit_price = float(data[-1]["close"])
                    exit_date = data[-1]["datetime"]

                percent_move = ((exit_price - entry) / entry) * 100

                results.append({
                    "symbol": symbol,
                    "grade": setup["grade"],
                    "entry_date": entry_date,
                    "exit_date": exit_date,
                    "entry_price": entry,
                    "percent_move": round(percent_move, 2),
                    "days_held": days_held,
                    "exit_type": status
                })

        time.sleep(0.1)

         
    # =========================
    # 📊 EXPORT RESULTS (ADD HERE)
    # =========================
    
    df = pd.DataFrame(results)

    df.to_csv("trade_history_2025.csv", index=False)

    print(f"\n✅ Saved {len(df)} trades to trade_history_2025.csv")    

    # =========================
    # RESULTS SUMMARY + ANALYSIS
    # =========================
    if not results:
        print("\n⚠️ No trades found")
        return None

    df = pd.DataFrame(results)

    # =========================
    # ADD PRICE GROUP COLUMN ✅ (THIS FIXES YOUR ERROR)
    # =========================
    def classify_price(price):
        if price < 20:
            return "SMALL"
        elif price < 80:
            return "MID"
        else:
            return "LARGE"

    df["price_group"] = df["entry_price"].apply(classify_price)

    # =========================
    # 🏆 ANALYSIS BY PRICE GROUP
    # =========================
    print("\n🏆 ANALYSIS BY PRICE GROUP")
    print("=" * 60)

    for group in ["SMALL", "MID", "LARGE"]:

        group_df = df[df["price_group"] == group]

        if group_df.empty:
            continue

        print(f"\n🔹 {group} CAPS")

        # =========================
        # 📊 GRADE RANKING
        # =========================
        ranked = (
            group_df.groupby("grade")["percent_move"]
            .mean()
            .sort_values(ascending=False)
        )

        print("\n📊 GRADE RANKING")
        print(ranked)

        # =========================
        # 🔥 TOP 5 TRADES
        # =========================
        top5 = group_df.sort_values("percent_move", ascending=False).head(5)

        print("\n🔥 TOP 5 TRADES")
        for _, trade in top5.iterrows():
            print(
                f"{trade['symbol']} | {trade['grade']} | "
                f"{trade['percent_move']}% | {trade['days_held']}d"
            )

        # =========================
        # 🔻 WORST 5 TRADES
        # =========================
        worst5 = group_df.sort_values("percent_move").head(5)

        print("\n🔻 WORST 5 TRADES")
        for _, trade in worst5.iterrows():
            print(
                f"{trade['symbol']} | {trade['grade']} | "
                f"{trade['percent_move']}% | {trade['days_held']}d"
            )

        print("\n" + "=" * 60)

    # =========================
    # 📊 SUMMARY
    # =========================
    print("\n📊 SUMMARY (A+ + B + B+ EXPANDED)")
    print(f"Trades: {len(df)}")
    print(f"Win Rate: {round((df['percent_move'] > 0).mean()*100,2)}%")
    print(f"Avg Return: {round(df['percent_move'].mean(),2)}%")
    print(f"Best: {round(df['percent_move'].max(),2)}%")
    print(f"Worst: {round(df['percent_move'].min(),2)}%")

    return df

# =========================
# 💰 FIXED TRADE ANALYSIS
# =========================
def run_fixed_trade_analysis(df):

    # 🔥 Ensure trades are in order
    df = df.sort_values("entry_date")

    TRADE_SIZE = 10000

    total_pnl = 0
    results = []

    print("\n💰 FIXED TRADE ANALYSIS ($10,000 per trade)\n")

    for _, trade in df.iterrows():

        entry = trade["entry_date"].date()
        exit = trade["exit_date"].date()
        percent = trade["percent_move"]

        pnl = TRADE_SIZE * (percent / 100)
        total_pnl += pnl

        results.append(pnl)

        print(
            f"{trade['symbol']} | {entry} → {exit} | "
            f"{percent}% | PnL: ${round(pnl,2)}"
        )

    print("\n📊 SUMMARY")
    print(f"Trades: {len(df)}")

    if len(df) > 0:
        print(f"Total PnL: ${round(total_pnl,2)}")
        print(f"Final Capital: ${round(TRADE_SIZE * len(df) + total_pnl,2)}")
        print(f"Avg Trade: ${round(total_pnl / len(df),2)}")

        # 🔥 Win rate
        win_rate = (df["percent_move"] > 0).mean() * 100
        print(f"Win Rate: {round(win_rate,2)}%")

    else:
        print("No trades found")
        return

    # =========================
    # 📊 WIN / LOSS ANALYSIS
    # =========================
    wins = [x for x in results if x > 0]
    losses = [x for x in results if x < 0]

    if wins:
        print(f"Avg Win: ${round(sum(wins)/len(wins),2)}")
        print(f"Best Win: ${round(max(wins),2)}")

    if losses:
        print(f"Avg Loss: ${round(sum(losses)/len(losses),2)}")
        print(f"Worst Loss: ${round(min(losses),2)}")

    
# =========================
# 📤 EXPORT FUNCTIONS (NOW OUTSIDE ✅)
# =========================

def export_watchlist(df):

    active = df[df["exit_date"] == df["exit_date"].max()]

    watchlist = []

    for _, row in active.iterrows():
        watchlist.append({
            "symbol": row["symbol"],
            "group": "SMALL" if row["entry_price"] < 20 else "MID" if row["entry_price"] < 80 else "LARGE",
            "price": row["entry_price"],
            "breakout": row["entry_price"],
            "change_percent": row["percent_move"],
            "signal_date": str(row["entry_date"]),
            "status": "active"
        })

    with open("watchlist.json", "w") as f:
        json.dump(watchlist, f, indent=2)

    print("✅ watchlist.json created")


def export_best_trades(df):

    one_year_ago = datetime.now() - timedelta(days=365)

    recent = df[df["entry_date"] >= one_year_ago]

    best = recent[recent["percent_move"] > 20]
    best = best.sort_values("percent_move", ascending=False).head(20)

    output = []

    for _, row in best.iterrows():
        output.append({
            "symbol": row["symbol"],
            "group": row["price_group"],
            "return": row["percent_move"],
            "days": row["days_held"],
            "date": str(row["entry_date"])
        })

    with open("best_trades.json", "w") as f:
        json.dump(output, f, indent=2)

    print("✅ best_trades.json created")


def export_stats(df):

    current_year = datetime.now().year

    df_year = df[df["entry_date"].dt.year == current_year]

    stats = {}

    for group in ["SMALL", "MID", "LARGE"]:

        group_df = df_year[df_year["price_group"] == group]

        if group_df.empty:
            continue

        stats[group] = {
            "trades": int(len(group_df)),
            "avg_return": round(group_df["percent_move"].mean(), 2),
            "best": round(group_df["percent_move"].max(), 2),
            "worst": round(group_df["percent_move"].min(), 2)
        }

    with open("current_year_stats.json", "w") as f:
        json.dump(stats, f, indent=2)

    print("✅ stats.json created")    
 
# =========================
# RUN EVERYTHING
# =========================

df = run_backtest()

if df is not None:
    run_fixed_trade_analysis(df)

    export_watchlist(df)
    export_best_trades(df)
    export_stats(df)