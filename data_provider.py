import requests
import time
from config import API_KEY, BATCH_SIZE

BASE_URL = "https://api.twelvedata.com/time_series"

# 🔧 SETTINGS (API SAFE)
OUTPUT_SIZE = 60          # enough for your strategy (reduced from 120)
REQUEST_DELAY = 1         # seconds between batches (prevents rate limit)


def fetch_batch(symbols):
    symbol_string = ",".join(symbols)

    params = {
        "apikey": API_KEY,
        "symbol": symbol_string,
        "interval": "1day",
        "outputsize": OUTPUT_SIZE,
        "format": "JSON",
    }

    try:
        response = requests.get(BASE_URL, params=params)

        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            return {}

        data = response.json()

        # 🚨 Handle API error messages
        if "code" in data:
            print(f"❌ API Limit / Error: {data}")
            return {}

        return data

    except Exception as e:
        print(f"❌ Request failed: {e}")
        return {}


def get_batched_data(symbol_list):
    all_data = {}

    total_batches = len(symbol_list) // BATCH_SIZE + 1

    for i in range(0, len(symbol_list), BATCH_SIZE):
        batch = symbol_list[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1

        print(f"📦 Fetching batch {batch_num}/{total_batches}...")

        batch_data = fetch_batch(batch)

        for symbol in batch:
            if symbol in batch_data and "values" in batch_data[symbol]:
                values = batch_data[symbol]["values"]

                # oldest → newest (important for your logic)
                all_data[symbol] = list(reversed(values))

        # 🛑 Prevent hitting API rate limits
        time.sleep(REQUEST_DELAY)

    return all_data