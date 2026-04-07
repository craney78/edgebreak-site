import csv
import json
from datetime import datetime
from collections import defaultdict

# =========================
# LOAD TRADES
# =========================
def load_trades():

    trades = []

    try:
        with open("trade_history.csv", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                try:
                    trades.append({
                        "date": row.get("date"),
                        "symbol": row.get("symbol"),
                        "grade": row.get("grade"),
                        "percent_move": float(row.get("percent_move", 0)),
                        "days_held": int(float(row.get("days_held", 0))),
                        "entry_price": float(row.get("entry_price", 0))
                    })
                except:
                    continue

    except:
        print("❌ No trade_history.csv found")

    return trades


# =========================
# CLASSIFY PRICE GROUP
# =========================
def get_price_group(price):
    if price < 20:
        return "SMALL"
    elif price < 80:
        return "MID"
    else:
        return "LARGE"


# =========================
# BUILD STATS
# =========================
def build_stats(trades):

    stats = {
        "overall": {},
        "by_year": {},
        "by_group": {}
    }

    if not trades:
        return {}

    # =========================
    # OVERALL
    # =========================
    total = len(trades)
    wins = [t for t in trades if t["percent_move"] > 0]

    stats["overall"] = {
        "trades": total,
        "win_rate": round(len(wins) / total * 100, 2),
        "avg_return": round(sum(t["percent_move"] for t in trades) / total, 2),
        "best": round(max(t["percent_move"] for t in trades), 2),
        "worst": round(min(t["percent_move"] for t in trades), 2)
    }

    # =========================
    # BY YEAR
    # =========================
    yearly = defaultdict(list)

    for t in trades:
        try:
            year = datetime.fromisoformat(t["date"]).year
            yearly[year].append(t)
        except:
            continue

    for year, group in yearly.items():

        total = len(group)
        wins = [t for t in group if t["percent_move"] > 0]

        stats["by_year"][str(year)] = {
            "trades": total,
            "win_rate": round(len(wins) / total * 100, 2),
            "avg_return": round(sum(t["percent_move"] for t in group) / total, 2),
            "best": round(max(t["percent_move"] for t in group), 2),
            "worst": round(min(t["percent_move"] for t in group), 2)
        }

    # =========================
    # BY PRICE GROUP
    # =========================
    groups = defaultdict(list)

    for t in trades:
        group = get_price_group(t["entry_price"])
        groups[group].append(t)

    for group, items in groups.items():

        total = len(items)
        wins = [t for t in items if t["percent_move"] > 0]

        stats["by_group"][group] = {
            "trades": total,
            "win_rate": round(len(wins) / total * 100, 2),
            "avg_return": round(sum(t["percent_move"] for t in items) / total, 2),
            "best": round(max(t["percent_move"] for t in items), 2),
            "worst": round(min(t["percent_move"] for t in items), 2)
        }

    # =========================
    # NEW FORMAT FOR WEBSITE
    # =========================
    new_format = {}

    if "2025" in stats["by_year"]:

        year_data = stats["by_year"]["2025"]

        # BEST TRADES (top 5)
        sorted_trades = sorted(trades, key=lambda x: x["percent_move"], reverse=True)

        best_trades = [
            {
                "symbol": t["symbol"],
                "return": round(t["percent_move"], 2)
            }
            for t in sorted_trades[:5]
        ]

        new_format = {
            "years": {
                "2025": {
                    "total_trades": year_data["trades"],
                    "win_rate": year_data["win_rate"],
                    "avg_return": year_data["avg_return"],
                    "best_trade": year_data["best"],
                    "worst_trade": year_data["worst"],
                    "best_trades": best_trades,
                    "groups": stats["by_group"]
                }
            }
        }

    return new_format


# =========================
# SAVE JSON
# =========================
def save_stats(stats):

    with open("stats.json", "w") as f:
        json.dump(stats, f, indent=2)

    print("✅ stats.json created")


# =========================
# RUN
# =========================
if __name__ == "__main__":

    print("📊 Building stats...\n")

    trades = load_trades()
    stats = build_stats(trades)

    save_stats(stats)