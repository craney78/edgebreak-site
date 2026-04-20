import requests
from config import API_KEY

BASE_URL = "https://api.twelvedata.com/stocks"


def fetch_nasdaq_symbols():
    params = {
        "apikey": API_KEY,
        "exchange": "NASDAQ",
        "format": "JSON"
    }

    response = requests.get(BASE_URL, params=params)

    if response.status_code != 200:
        print("Failed to fetch NASDAQ symbols")
        return []

    data = response.json()

    if "data" not in data:
        print("Unexpected response:", data)
        return []

    symbols = []

    for item in data["data"]:
        if item.get("type") == "Common Stock":
            symbols.append(item["symbol"])

    return symbols


def save_symbols(symbols):
    with open("nasdaq_symbols.txt", "w") as f:
        for symbol in symbols:
            f.write(symbol + "\n")

    print(f"Saved {len(symbols)} NASDAQ symbols.")


if __name__ == "__main__":
    print("Fetching NASDAQ symbol list...")
    symbols = fetch_nasdaq_symbols()

    if symbols:
        save_symbols(symbols)
    else:
        print("No symbols saved.")