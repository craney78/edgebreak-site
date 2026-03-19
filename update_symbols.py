import requests
import csv

ASX_CSV_URL = "https://www.asx.com.au/asx/research/ASXListedCompanies.csv"


def update_symbol_file():
    try:
        response = requests.get(ASX_CSV_URL)
        response.raise_for_status()

        lines = response.text.splitlines()
        reader = csv.reader(lines)

        symbols = []

        for row in reader:
            if len(row) > 1 and row[1] != "ASX code":
                code = row[1].strip()
                if code:
                    symbols.append(code)

        with open("asx_symbols.txt", "w") as f:
            for symbol in symbols:
                f.write(symbol + "\n")

        print(f"Updated ASX symbol list. Total symbols: {len(symbols)}")

    except Exception as e:
        print(f"Error updating symbol list: {e}")


if __name__ == "__main__":
    update_symbol_file()