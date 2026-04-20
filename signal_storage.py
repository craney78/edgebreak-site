import json
import os
from datetime import datetime, timedelta

SIGNAL_FILE = "signals.json"
RETENTION_DAYS = 30


def load_signals():
    if not os.path.exists(SIGNAL_FILE):
        return []

    with open(SIGNAL_FILE, "r") as f:
        return json.load(f)


def save_signals(signals):
    with open(SIGNAL_FILE, "w") as f:
        json.dump(signals, f, indent=4)


def add_new_signals(new_signals):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    stored = load_signals()

    for signal in new_signals:
        stored.append({
            "date": today_str,
            "ticker": signal["ticker"],
            "signal": signal["signal"],
            "tradingview": signal["tradingview"]
        })

    # Remove signals older than 30 days
    cutoff_date = datetime.utcnow() - timedelta(days=RETENTION_DAYS)

    cleaned = [
        s for s in stored
        if datetime.strptime(s["date"], "%Y-%m-%d") >= cutoff_date
    ]

    save_signals(cleaned)