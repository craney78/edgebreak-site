import requests
import json

API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

url = f"https://api.twelvedata.com/profile?symbol=AAPL&apikey={API_KEY}"

response = requests.get(url)

print(response.status_code)
print(json.dumps(response.json(), indent=4))