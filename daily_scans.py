import subprocess
import time

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

for name, script in SCANNERS:

    print(f"\n▶ Running {name}...")

    try:

        subprocess.run(
            ["python", script],
            check=True
        )

        print(f"✅ {name} Complete")

    except subprocess.CalledProcessError:

        print(f"❌ {name} FAILED")

        print("\nDaily scans stopped.")

        exit()

finish = time.time()

print("\n" + "=" * 60)
print("✅ ALL SCANNERS COMPLETED SUCCESSFULLY")
print(f"Finished in {(finish-start)/60:.1f} minutes")
print("=" * 60)