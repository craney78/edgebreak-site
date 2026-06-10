import json
import requests
from datetime import datetime

# =========================

# CONFIG

# =========================

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

FREE_WATCHLIST = "free_watchlist.json"
FREE_TRACKER = "free_watchlist_tracker.json"

ELITE_WATCHLIST = "elite_watchlist.json"
ELITE_TRACKER = "elite_watchlist_tracker.json"

# =========================

# FETCH LATEST PRICES

# =========================

def fetch_quotes(symbols):

```
if not symbols:
    return {}

url = (
    "https://api.twelvedata.com/quote"
    f"?symbol={','.join(symbols)}"
    f"&apikey={API_KEY}"
)

try:

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=20
    )

    if response.status_code != 200:

        print(
            f"❌ HTTP {response.status_code}"
        )

        return {}

    return response.json()

except Exception as e:

    print(
        f"❌ Quote Error: {e}"
    )

    return {}
```

# =========================

# UPDATE TRACKER

# =========================

def update_tracker(
watchlist_file,
tracker_file,
smart_money=False
):

```
today = datetime.now().strftime(
    "%Y-%m-%d"
)

# =========================
# LOAD WATCHLIST
# =========================

try:

    with open(
        watchlist_file,
        "r"
    ) as f:

        watchlist = json.load(f)

except Exception as e:

    print(
        f"❌ Could not load "
        f"{watchlist_file}"
    )

    print(e)

    return

# =========================
# LOAD TRACKER
# =========================

try:

    with open(
        tracker_file,
        "r"
    ) as f:

        tracker = json.load(f)

except:

    tracker = []

tracker_dict = {

    item["symbol"]: item

    for item in tracker

}

# =========================
# SYMBOLS
# =========================

symbols = []

for stock in watchlist:

    symbol = stock.get("symbol")

    if symbol:

        symbols.append(symbol)

# =========================
# FETCH PRICES
# =========================

quotes = fetch_quotes(symbols)

# =========================
# PROCESS
# =========================

for stock in watchlist:

    symbol = stock.get("symbol")

    if not symbol:
        continue

    quote = quotes.get(symbol)

    if not quote:
        continue

    try:

        current_price = float(
            quote["close"]
        )

    except:

        continue

    # =========================
    # NEW STOCK
    # =========================

    if symbol not in tracker_dict:

        entry_price = current_price

        # Use existing price if available
        if stock.get("current_price"):

            try:

                entry_price = float(
                    stock["current_price"]
                )

            except:
                pass

        tracker_dict[symbol] = {

            "symbol": symbol,

            "first_seen": today,
            "last_seen": today,

            "entry_price": round(
                entry_price,
                2
            ),

            "current_price": round(
                current_price,
                2
            ),

            "max_price": round(
                current_price,
                2
            ),

            "change_percent": 0,

            "max_gain": 0,

            "days_tracked": 0,

            "appearances": 1

        }

        continue

    # =========================
    # EXISTING STOCK
    # =========================

    t = tracker_dict[symbol]

    t["current_price"] = round(
        current_price,
        2
    )

    # Update Max Price

    if current_price > t["max_price"]:

        t["max_price"] = round(
            current_price,
            2
        )

    # Current Gain

    t["change_percent"] = round(

        (
            (
                current_price
                -
                t["entry_price"]
            )
            /
            t["entry_price"]
        )
        * 100,

        2

    )

    # Maximum Gain

    t["max_gain"] = round(

        (
            (
                t["max_price"]
                -
                t["entry_price"]
            )
            /
            t["entry_price"]
        )
        * 100,

        2

    )

    # Days Tracked

    try:

        start_date = datetime.strptime(
            t["first_seen"],
            "%Y-%m-%d"
        )

        t["days_tracked"] = (

            datetime.now()
            -
            start_date

        ).days

    except:

        t["days_tracked"] = 0

    # =========================
    # SMART MONEY APPEARANCES
    # =========================

    if smart_money:

        if t["last_seen"] != today:

            t["appearances"] += 1

            t["last_seen"] = today

# =========================
# SAVE TRACKER
# =========================

tracker_data = sorted(

    tracker_dict.values(),

    key=lambda x:
    x["change_percent"],

    reverse=True

)

with open(
    tracker_file,
    "w"
) as f:

    json.dump(
        tracker_data,
        f,
        indent=2
    )

print(
    f"✅ Updated "
    f"{tracker_file}"
)
```

# =========================

# RUN FREE TRACKER

# =========================

update_tracker(

```
FREE_WATCHLIST,

FREE_TRACKER,

smart_money=False
```

)

# =========================

# RUN SMART MONEY TRACKER

# =========================

update_tracker(

```
ELITE_WATCHLIST,

ELITE_TRACKER,

smart_money=True
```

)

print(
"\n🚀 Watchlist Tracking Complete"
)
