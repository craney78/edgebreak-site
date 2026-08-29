import subprocess
import time
import csv
import os
from datetime import datetime, timedelta

# ==========================================
# CONFIG
# ==========================================

SCANNERS = [

    ("Breakout Scanner", "breakout_scanner_builder.py"),

    ("Pre-Breakout Scanner", "scanner_database_builder.py"),

    ("Launch Pad Scanner", "launchpad_database_builder.py"),

    ("Smart Money Scanner", "smart_money_daily_scan.py")

]

CSV_FILE = "daily_scan_history.csv"

# ==========================================
# START
# ==========================================

start_dt = datetime.now()
start_time = time.time()

results = {}

print("\n" + "=" * 65)
print("              EDGEBREAK DAILY SCANS")
print("=" * 65)

# ==========================================
# RUN SCANNERS
# ==========================================

overall_status = "SUCCESS"

for name, script in SCANNERS:

    print(f"\n▶ Running {name}...")

    try:

        subprocess.run(
            ["python", script],
            check=True
        )

        print(f"✅ {name} Complete")

        results[name] = "SUCCESS"

    except subprocess.CalledProcessError:

        print(f"❌ {name} FAILED")

        results[name] = "FAILED"

        overall_status = "FAILED"

        break

# ==========================================
# INDICATOR HISTORY
# ==========================================

if overall_status == "SUCCESS":

    print("\n▶ Building Scanner Indicator History...")

    try:

        subprocess.run(
            ["python", "build_indicator_history.py"],
            check=True
        )

        print("✅ Scanner Indicator History Complete")

    except subprocess.CalledProcessError:

        print("❌ Scanner Indicator History FAILED")

        overall_status = "FAILED"        

# ==========================================
# DAILY BRIEF CULL
# ==========================================

if overall_status == "SUCCESS":

    print("\n▶ Running Daily Brief Cull...")

    try:

        subprocess.run(
            ["python", "daily_brief_cull.py"],
            check=True
        )

        print("✅ Daily Brief Cull Complete")

    except subprocess.CalledProcessError:

        print("❌ Daily Brief Cull FAILED")

        overall_status = "FAILED"        

# ==========================================
# GIT
# ==========================================

git_add = "NOT RUN"
git_commit = "NOT RUN"
git_push = "NOT RUN"

if overall_status == "SUCCESS":

    print("\nUpdating Git Repository...")

    try:

        subprocess.run(
            ["git", "add", "."],
            check=True
        )

        git_add = "SUCCESS"

    except:

        git_add = "FAILED"

        overall_status = "FAILED"

if overall_status == "SUCCESS":

    status = subprocess.run(
        ["git", "diff", "--cached", "--quiet"]
    )

    if status.returncode == 1:

        try:

            subprocess.run(
                [
                    "git",
                    "commit",
                    "-m",
                    f"Daily Scan {start_dt.strftime('%Y-%m-%d')}"
                ],
                check=True
            )

            git_commit = "SUCCESS"

        except:

            git_commit = "FAILED"

            overall_status = "FAILED"

if overall_status == "SUCCESS" and git_commit == "SUCCESS":

    try:

        subprocess.run(
            ["git", "push"],
            check=True
        )

        git_push = "SUCCESS"

    except:

        git_push = "FAILED"

        overall_status = "FAILED"

elif git_commit == "NOT RUN":

    git_push = "NOT REQUIRED"

# ==========================================
# FINISH
# ==========================================

finish_dt = datetime.now()

duration = round(
    (time.time() - start_time) / 60,
    1
)

# ==========================================
# CSV HISTORY
# ==========================================

rows = []

if os.path.exists(CSV_FILE):

    with open(CSV_FILE, newline="") as f:

        reader = csv.DictReader(f)

        rows = list(reader)

cutoff = finish_dt - timedelta(days=180)

filtered = []

for row in rows:

    try:

        row_date = datetime.strptime(
            row["Date"],
            "%Y-%m-%d"
        )

        if row_date >= cutoff:

            filtered.append(row)

    except:

        pass

filtered.append({

    "Date": start_dt.strftime("%Y-%m-%d"),

    "Started": start_dt.strftime("%H:%M:%S"),

    "Finished": finish_dt.strftime("%H:%M:%S"),

    "Duration (min)": duration,

    "Breakout": results.get("Breakout Scanner", "NOT RUN"),

    "Pre-Breakout": results.get("Pre-Breakout Scanner", "NOT RUN"),

    "Launch Pad": results.get("Launch Pad Scanner", "NOT RUN"),

    "Smart Money": results.get("Smart Money Scanner", "NOT RUN"),

    "Git Add": git_add,

    "Git Commit": git_commit,

    "Git Push": git_push,

    "Overall": overall_status

})

with open(CSV_FILE, "w", newline="") as f:

    writer = csv.DictWriter(

        f,

        fieldnames=[

            "Date",

            "Started",

            "Finished",

            "Duration (min)",

            "Breakout",

            "Pre-Breakout",

            "Launch Pad",

            "Smart Money",

            "Git Add",

            "Git Commit",

            "Git Push",

            "Overall"

        ]

    )

    writer.writeheader()

    writer.writerows(filtered)

# ==========================================
# REPORT
# ==========================================

print("\n" + "=" * 65)

print("          EDGEBREAK DAILY SCAN REPORT")

print("=" * 65)

print(f"Started      : {start_dt.strftime('%d-%b-%Y %H:%M:%S')}")

print(f"Finished     : {finish_dt.strftime('%d-%b-%Y %H:%M:%S')}")

print(f"Duration     : {duration} minutes\n")

for scanner, _ in SCANNERS:

    print(f"{scanner:<22}: {results.get(scanner,'NOT RUN')}")

print()

print(f"Git Add      : {git_add}")

print(f"Git Commit   : {git_commit}")

print(f"Git Push     : {git_push}")

print()

print(f"Overall      : {overall_status}")

print(f"History File : {CSV_FILE}")

print("=" * 65)