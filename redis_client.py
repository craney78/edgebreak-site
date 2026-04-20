import redis
from datetime import datetime

# =========================
# 🔌 CONNECT TO REDIS
# =========================

r = redis.Redis(host='localhost', port=6379, db=0)


# =========================
# 🧠 GENERATE KEY (FIXED)
# =========================

def generate_key(ticker):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return f"{ticker}_{today}"


# =========================
# 🔍 CHECK IF NEW SIGNAL
# =========================

def is_new_signal(ticker):
    key = generate_key(ticker)
    return not r.exists(key)


# =========================
# 💾 STORE SIGNAL
# =========================

def store_signal(ticker, expiry_hours=72):
    key = generate_key(ticker)
    r.set(key, 1, ex=expiry_hours * 3600)


# =========================
# 🚫 FILTER DUPLICATES
# =========================

def filter_new_signals(signals):
    """
    Keeps only signals that have not been seen before
    """
    new_signals = []

    for signal in signals:
        ticker = signal.get("symbol")

        if not ticker:
            continue

        if is_new_signal(ticker):
            store_signal(ticker)
            new_signals.append(signal)

    return new_signals