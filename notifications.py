import json
import os
import requests

WEBHOOK_URL = "https://discord.com/api/webhooks/1494196359962693754/14jcn6DdF9IlSROJzQwyO2r12cGvYlYcIVmiwsXvZLWeN19UDxZ8pl_PayCo4AYVDati"


# =========================
# DISCORD EMBED FUNCTION
# =========================
def send_discord_embed(title, fields, color):
    try:
        data = {
            "embeds": [
                {
                    "title": title,
                    "color": color,
                    "fields": fields,
                    "footer": {
                    "text": "EdgeBreak System • Data-driven • Not financial advice"
                    },
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
            ]
        }

        requests.post(WEBHOOK_URL, json=data)

    except Exception as e:
        print("Discord error:", e)


# =========================
# LOAD ACTIVITY
# =========================
file = "activity.json"

if not os.path.exists(file):
    print("No activity file found")
    exit()

with open(file, "r") as f:
    try:
        activity = json.load(f)
    except:
        activity = []


# =========================
# LOAD LAST CHECK
# =========================
checkpoint_file = "last_checked.txt"

if os.path.exists(checkpoint_file):
    with open(checkpoint_file, "r") as f:
        last_checked = f.read().strip()
else:
    last_checked = ""


# =========================
# FIND NEW EVENTS
# =========================
new_events = []

for trade in activity:
    trade_id = str(trade.get("symbol")) + str(trade.get("entry_date"))

    if trade_id != last_checked:
        new_events.append(trade)


# =========================
# PROCESS EVENTS
# =========================
for trade in new_events:

    symbol = trade.get("symbol")
    status = trade.get("exit_type")

    if status == "OPEN":

        symbol = trade.get("symbol")
        status = trade.get("exit_type")

        # 🔴 ADD THIS HERE
        entry_price = float(trade.get("entry_price", 0))
        stop_price = float(trade.get("stop_price", entry_price * 0.95))
                
        # Default risk-reward ratio
        R = 2

        # Calculate target
        target_price = entry_price + (entry_price - stop_price) * R

        chart_url = f"https://edgebreak.ai/chart.html?symbol={symbol}&entry={entry_price}&stop={stop_price}&target={round(target_price, 2)}"

        fields = [
            {"name": "Symbol", "value": symbol, "inline": True},
            {"name": "Grade", "value": str(trade.get("grade", "N/A")), "inline": True},
            {"name": "Entry", "value": f"${trade.get('entry_price', 'N/A')}", "inline": True},
            {"name": "Stop", "value": f"${trade.get('stop_price', 'N/A')}", "inline": True},
            {"name": "System View", "value": confidence, "inline": False},
            {"name": "Chart", "value": f"[View Chart]({chart_url})", "inline": False},
            {"name": "Event", "value": "Breakout Detected", "inline": False}
            {"name": "Target", "value": f"${round(target_price, 2)}", "inline": True},
        ]

        send_discord_embed(
            "🚀 System Event",
            fields,
            5763719
        )

    elif status == "CLOSED":

        result = trade.get("percent_move", 0)

        fields = [
            {"name": "Symbol", "value": symbol, "inline": True},
            {"name": "Result", "value": f"{result}%", "inline": True},
            {"name": "Days Held", "value": str(trade.get("days_held", "N/A")), "inline": True},
            {"name": "Exit Type", "value": trade.get("exit_reason", "System Exit"), "inline": False}
        ]

        color = 5763719 if result >= 0 else 15548997

        send_discord_embed(
            "📉 System Update",
            fields,
            color
        )


# =========================
# SAVE LAST CHECK
# =========================
if activity:
    last_trade = activity[-1]
    last_id = str(last_trade.get("symbol")) + str(last_trade.get("entry_date"))

    with open(checkpoint_file, "w") as f:
        f.write(last_id)


# =========================
# OPTIONAL DEBUG (SAFE)
# =========================
if not new_events:
    print("No new events today")