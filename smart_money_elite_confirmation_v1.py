# ===================================
# SMART MONEY → ELITE CONFIRMATION V1
# ===================================

import json
import requests
import pandas as pd
from datetime import datetime

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

MAX_CONFIRM_DAYS = 180

# ===================================
# LOAD SMART MONEY RESULTS
# ===================================

with open("smart_money_full.json", "r") as f:
    smart_money = json.load(f)

print(f"Loaded {len(smart_money)} Smart Money setups")

# ===================================
# FETCH STOCK DATA
# ===================================

def fetch_data(symbol):

    url = (
        f"https://api.twelvedata.com/time_series"
        f"?symbol={symbol}"
        f"&interval=1day"
        f"&outputsize=500"
        f"&apikey={API_KEY}"
    )

    try:
        r = requests.get(url, timeout=20)

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

        for col in ["open","high","low","close","volume"]:
            df[col] = pd.to_numeric(df[col])

        df = df.sort_values("date").reset_index(drop=True)

        return df

    except:
        return None


# ===================================
# SMART MONEY CONFIRMATION V2
# ===================================
# ===================================
# SMART MONEY CONFIRMATION V3
# ===================================

def smart_money_confirm(window):

    if len(window) < 50:
        return False

    highs = window["high"].tolist()
    lows = window["low"].tolist()

    # =========================
    # HIGHER HIGH
    # =========================

    recent_high = max(highs[-20:])
    previous_high = max(highs[-40:-20])

    higher_high = recent_high > previous_high

    # =========================
    # HIGHER LOW
    # =========================

    recent_low = min(lows[-20:])
    previous_low = min(lows[-40:-20])

    higher_low = recent_low > previous_low

    # =========================
    # VOLUME EXPANSION
    # =========================

    avg20_volume = window["volume"].tail(20).mean()
    avg50_volume = window["volume"].tail(50).mean()

    volume_ratio = (
        avg20_volume / avg50_volume
        if avg50_volume > 0 else 0
    )

    volume_expansion = volume_ratio >= 1.3

    # =========================
    # GAP FILTER
    # =========================

    today_open = float(window.iloc[-1]["open"])
    yesterday_close = float(window.iloc[-2]["close"])

    gap_percent = (
        (today_open - yesterday_close)
        / yesterday_close
    ) * 100

    if gap_percent > 10:
        return False

    # =========================
    # CONFIRMATION
    # =========================

    return (
        higher_high
        and higher_low
        and volume_expansion
    )

# ===================================
# MAIN TEST
# ===================================

confirmed = []
not_confirmed = []

for i, setup in enumerate(smart_money):

    symbol = setup["symbol"]

    scan_date = datetime.strptime(
        setup["scan_date"],
        "%Y-%m-%d"
    )

    print(
        f"{i+1}/{len(smart_money)} "
        f"{symbol}"
    )

    df = fetch_data(symbol)

    if df is None:
        continue

    future = df[
        df["date"] > scan_date
    ].copy()

    found = False

    for idx in range(40, len(future)):

        current_date = future.iloc[idx]["date"]

        days_waited = (
            current_date - scan_date
        ).days

        if days_waited > MAX_CONFIRM_DAYS:
            break

        window = future.iloc[:idx+1]

        if smart_money_confirm(window):

            confirmed.append({

                "symbol": symbol,

                "grade":
                    setup.get("grade","?"),

                "smart_money_date":
                    setup["scan_date"],

                "confirmation_date":
                    current_date.strftime("%Y-%m-%d"),

                "days_waited":
                    days_waited,

                "price":
                    round(
                        float(
                            future.iloc[idx]["close"]
                        ),
                        2
                    )
            })

            found = True

            break

    if not found:

        not_confirmed.append({

            "symbol": symbol,

            "grade":
                setup.get("grade","?"),

            "smart_money_date":
                setup["scan_date"]
        })

# ===================================
# SAVE RESULTS
# ===================================

with open(
    "confirmed.json",
    "w"
) as f:

    json.dump(
        confirmed,
        f,
        indent=2
    )

with open(
    "not_confirmed.json",
    "w"
) as f:

    json.dump(
        not_confirmed,
        f,
        indent=2
    )

# ===================================
# STATS
# ===================================

confirmation_rate = (
    len(confirmed)
    / len(smart_money)
    * 100
)

print("\n========================")
print("SMART MONEY → ELITE V1")
print("========================")

print(
    f"Total Smart Money: {len(smart_money)}"
)

print(
    f"Confirmed: {len(confirmed)}"
)

print(
    f"Not Confirmed: {len(not_confirmed)}"
)

print(
    f"Confirmation Rate: "
    f"{round(confirmation_rate,2)}%"
)

if confirmed:

    avg_wait = round(
        sum(
            x["days_waited"]
            for x in confirmed
        )
        /
        len(confirmed),
        2
    )

    print(
        f"Average Days: {avg_wait}"
    )

print("\nFiles Saved:")
print("confirmed.json")
print("not_confirmed.json")