import subprocess
import time
import sys

SCANNERS = [

    (
        "Breakout Scanner",
        "breakout_scanner_builder.py"
    ),

    (
        "Pre-Breakout Scanner",
        "scanner_database_builder.py"
    ),

    (
        "Launch Pad Scanner",
        "launchpad_database_builder.py"
    ),

    (
        "Smart Money Scanner",
        "smart_money_daily_scan.py"
    )

]

print("\n" + "=" * 60)
print("        EDGEBREAK DAILY SCANS")
print("=" * 60)

start = time.time()

# =====================================
# RUN ALL SCANNERS
# =====================================

for name, script in SCANNERS:

    print(f"\n▶ Running {name}...")

    try:

        subprocess.run(
            ["python", script],
            check=True
        )

        print(f"✅ {name} Complete")

    except subprocess.CalledProcessError:

        print(f"\n❌ {name} FAILED")
        print("Daily scans cancelled.")
        sys.exit(1)

# =====================================
# GIT ADD / COMMIT / PUSH
# =====================================

print("\n" + "=" * 60)
print("Updating Git Repository")
print("=" * 60)

try:

    subprocess.run(
        ["git", "add", "."],
        check=True
    )

    subprocess.run(
        [
            "git",
            "commit",
            "-m",
            "Daily Scan"
        ],
        check=True
    )

    subprocess.run(
        ["git", "push"],
        check=True
    )

    print("✅ Git repository updated successfully.")

except subprocess.CalledProcessError:

    print("❌ Git update failed.")
    sys.exit(1)

finish = time.time()

print("\n" + "=" * 60)
print("✅ EDGEBREAK DAILY UPDATE COMPLETE")
print("=" * 60)
print(f"Finished in {(finish-start)/60:.1f} minutes")
print("=" * 60)