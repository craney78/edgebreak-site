import pandas as pd
import json

# =========================
# LOAD DATA
# =========================
df = pd.read_csv("trade_history_2025.csv")

# =========================
# REMOVE OPEN TRADES
# =========================
df = df[df["exit_type"] != "OPEN"]

# =========================
# BASIC STATS
# =========================
total_trades = len(df)

wins = df[df["percent_move"] > 0]
win_rate = round((len(wins) / total_trades) * 100, 2) if total_trades > 0 else 0

avg_return = round(df["percent_move"].mean(), 2)
best_trade = round(df["percent_move"].max(), 2)
worst_trade = round(df["percent_move"].min(), 2)

# =========================
# BEST TRADES (TOP 5)
# =========================
best_trades_df = df.sort_values(by="percent_move", ascending=False).head(5)

best_trades = [
    {
        "symbol": row["symbol"],
        "return": round(row["percent_move"], 2)
    }
    for _, row in best_trades_df.iterrows()
]

# =========================
# GROUPS
# =========================
def get_group(price):
    if price < 20:
        return "SMALL"
    elif price < 80:
        return "MID"
    else:
        return "LARGE"

df["group"] = df["entry_price"].apply(get_group)

groups = {}

for group_name, group_df in df.groupby("group"):

    g_total = len(group_df)
    g_wins = group_df[group_df["percent_move"] > 0]

    groups[group_name] = {
        "trades": g_total,
        "win_rate": round((len(g_wins) / g_total) * 100, 2) if g_total > 0 else 0,
        "avg_return": round(group_df["percent_move"].mean(), 2),
        "best": round(group_df["percent_move"].max(), 2),
        "worst": round(group_df["percent_move"].min(), 2)
    }

# =========================
# BUILD FINAL JSON
# =========================
stats = {
    "years": {
        "2025": {
            "total_trades": total_trades,
            "win_rate": win_rate,
            "avg_return": avg_return,
            "best_trade": best_trade,
            "worst_trade": worst_trade,
            "best_trades": best_trades,
            "groups": groups
        }
    }
}

# =========================
# SAVE
# =========================
with open("stats.json", "w") as f:
    json.dump(stats, f, indent=2)

print("✅ stats.json built from trade_history_2025.csv")