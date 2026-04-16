# =========================
# 🚀 EDGEBREAK DAILY RUNNER
# =========================

import subprocess
import datetime

# =========================
# 🟢 START LOG
# =========================
with open("run_log.txt", "a") as f:
    f.write(f"\nRun started: {datetime.datetime.now()}\n")

print("RUN DAILY STARTED")

print("====================================")
print("EDGEBREAK DAILY RUN START")
print("Time:", datetime.datetime.now())
print("====================================")

# -------------------------
# 1. RUN SCANNER
# -------------------------
print("\nRunning scanner...")

try:
    subprocess.run(["python", "scanner.py"], check=True)
    print("✅ Scanner complete")
except Exception as e:
    print("❌ Scanner failed:", e)

# -------------------------
# 2. RUN TRADE TRACKER
# -------------------------
print("\nRunning trade tracker...")

try:
    subprocess.run(["python", "trade_tracker.py"], check=True)
    print("✅ Trade tracker complete")
except Exception as e:
    print("❌ Trade tracker failed:", e)

# -------------------------
# 3. RUN NOTIFICATIONS
# -------------------------
print("\nRunning notifications...")

try:
    subprocess.run(["python", "notifications.py"], check=True)
    print("✅ Notifications complete")
except Exception as e:
    print("❌ Notifications failed:", e)

# =========================
# ✅ FINAL OUTPUT
# =========================
print("\n====================================")
print("EDGEBREAK DAILY RUN COMPLETE")
print("====================================")

# =========================
# 🔴 END LOG
# =========================
with open("run_log.txt", "a") as f:
    f.write(f"Run finished: {datetime.datetime.now()}\n")