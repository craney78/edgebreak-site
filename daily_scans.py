import subprocess
import time
import csv
import os
import sys
from datetime import datetime, timedelta


# ============================================================
# EDGEBREAK DAILY PIPELINE
# ============================================================
#
# DAILY ORDER
#
#   1. Breakout Scanner
#   2. Pre-Breakout Scanner
#   3. Launch Pad Scanner
#   4. Smart Money Scanner
#
#   5. Build Indicator History
#
#   6. Daily Brief Cull + Original Ranking
#
#   7. FINRA Off-Exchange Analysis
#
#   8. FINRA X-Factor Post-Ranking Rerank
#
#   9. Git Add / Commit / Push
#
#
# IMPORTANT
#
# FINRA does NOT feed the scanners.
#
# Scanner source files and website scanner operation
# remain unchanged.
#
# FINRA runs only AFTER the existing Daily Brief ranking.
#
# ============================================================


# ============================================================
# BASE DIRECTORY
# ============================================================
#
# This is VERY IMPORTANT for Windows Task Scheduler.
#
# Scheduled tasks often start from:
#
#     C:\Windows\System32
#
# rather than the EdgeBreak folder.
#
# Everything below therefore uses the folder containing
# this Python file as the working directory.
#
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

os.chdir(
    BASE_DIR
)


# ============================================================
# PYTHON EXECUTABLE
# ============================================================
#
# Use the exact same Python interpreter that is running
# daily_scans.py.
#
# This is safer than calling:
#
#     python
#
# because Task Scheduler may have a different PATH.
#
# ============================================================

PYTHON_EXE = sys.executable


# ============================================================
# CONFIG
# ============================================================

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


INDICATOR_SCRIPT = (
    "build_indicator_history.py"
)


DAILY_BRIEF_CULL_SCRIPT = (
    "daily_brief_cull.py"
)


FINRA_SCRIPT = (
    "finra_off_exchange_builder.py"
)


FINRA_RERANK_SCRIPT = (
    "daily_brief_finra_rerank.py"
)


CSV_FILE = os.path.join(
    BASE_DIR,
    "daily_scan_history.csv"
)


LOG_FILE = os.path.join(
    BASE_DIR,
    "daily_scan_run.log"
)


# ============================================================
# LOGGING
# ============================================================

def log(
    message=""
):

    print(
        message,
        flush=True
    )


    try:

        with open(
            LOG_FILE,
            "a",
            encoding="utf-8"
        ) as file:

            file.write(
                str(message)
                +
                "\n"
            )

    except Exception:

        pass


# ============================================================
# RUN PYTHON SCRIPT
# ============================================================

def run_python_script(
    name,
    script
):

    script_path = os.path.join(
        BASE_DIR,
        script
    )


    log()
    log(
        f"▶ Running {name}..."
    )


    if not os.path.exists(
        script_path
    ):

        log(
            f"❌ {name} FAILED"
        )

        log(
            f"   File not found: {script_path}"
        )

        return False


    try:

        subprocess.run(

            [
                PYTHON_EXE,
                script_path
            ],

            cwd=BASE_DIR,

            check=True

        )


        log(
            f"✅ {name} Complete"
        )


        return True


    except subprocess.CalledProcessError as error:

        log(
            f"❌ {name} FAILED"
        )

        log(
            f"   Exit code: {error.returncode}"
        )


        return False


    except Exception as error:

        log(
            f"❌ {name} FAILED"
        )

        log(
            f"   Error: {error}"
        )


        return False


# ============================================================
# START
# ============================================================

start_dt = datetime.now()

start_time = time.time()


results = {}


overall_status = (
    "SUCCESS"
)


# ============================================================
# START LOG
# ============================================================

log()
log()
log(
    "=" * 70
)

log(
    "EDGEBREAK DAILY PIPELINE"
)

log(
    "=" * 70
)

log(
    f"Started: "
    f"{start_dt.strftime('%d-%b-%Y %H:%M:%S')}"
)

log(
    f"Working directory: "
    f"{BASE_DIR}"
)

log(
    f"Python: "
    f"{PYTHON_EXE}"
)

log(
    "=" * 70
)


# ============================================================
# RUN SCANNERS
# ============================================================

for name, script in SCANNERS:

    success = run_python_script(
        name,
        script
    )


    if success:

        results[
            name
        ] = "SUCCESS"


    else:

        results[
            name
        ] = "FAILED"

        overall_status = (
            "FAILED"
        )

        break


# ============================================================
# INDICATOR HISTORY
# ============================================================

indicator_status = (
    "NOT RUN"
)


if overall_status == "SUCCESS":

    success = run_python_script(

        "Scanner Indicator History",

        INDICATOR_SCRIPT

    )


    if success:

        indicator_status = (
            "SUCCESS"
        )


    else:

        indicator_status = (
            "FAILED"
        )

        overall_status = (
            "FAILED"
        )


# ============================================================
# DAILY BRIEF CULL + ORIGINAL RANKING
# ============================================================

daily_brief_status = (
    "NOT RUN"
)


if overall_status == "SUCCESS":

    success = run_python_script(

        "Daily Brief Cull + Ranking",

        DAILY_BRIEF_CULL_SCRIPT

    )


    if success:

        daily_brief_status = (
            "SUCCESS"
        )


    else:

        daily_brief_status = (
            "FAILED"
        )

        overall_status = (
            "FAILED"
        )


# ============================================================
# FINRA OFF-EXCHANGE ANALYSIS
# ============================================================
#
# Runs ONLY after the Daily Brief has already:
#
#     culled
#     ranked
#     produced daily_brief_candidates.json
#
# FINRA therefore cannot alter scanner qualification.
#
# ============================================================

finra_status = (
    "NOT RUN"
)


if overall_status == "SUCCESS":

    success = run_python_script(

        "FINRA Off-Exchange Analysis",

        FINRA_SCRIPT

    )


    if success:

        finra_status = (
            "SUCCESS"
        )


    else:

        finra_status = (
            "FAILED"
        )

        overall_status = (
            "FAILED"
        )


# ============================================================
# FINRA X-FACTOR RERANK
# ============================================================
#
# This is a POST-RANKING stage.
#
# FINRA CAN PROMOTE.
#
# FINRA CANNOT RESCUE.
#
# ============================================================

x_factor_status = (
    "NOT RUN"
)


if overall_status == "SUCCESS":

    success = run_python_script(

        "FINRA X-Factor Rerank",

        FINRA_RERANK_SCRIPT

    )


    if success:

        x_factor_status = (
            "SUCCESS"
        )


    else:

        x_factor_status = (
            "FAILED"
        )

        overall_status = (
            "FAILED"
        )


# ============================================================
# GIT
# ============================================================

git_add = (
    "NOT RUN"
)

git_commit = (
    "NOT RUN"
)

git_push = (
    "NOT RUN"
)


# ============================================================
# GIT ADD
# ============================================================

if overall_status == "SUCCESS":

    log()
    log(
        "▶ Updating Git Repository..."
    )


    try:

        subprocess.run(

            [
                "git",
                "add",
                "."
            ],

            cwd=BASE_DIR,

            check=True

        )


        git_add = (
            "SUCCESS"
        )


        log(
            "✅ Git Add Complete"
        )


    except Exception as error:

        git_add = (
            "FAILED"
        )

        overall_status = (
            "FAILED"
        )


        log(
            "❌ Git Add FAILED"
        )

        log(
            f"   {error}"
        )


# ============================================================
# CHECK FOR GIT CHANGES
# ============================================================

if overall_status == "SUCCESS":

    try:

        status = subprocess.run(

            [
                "git",
                "diff",
                "--cached",
                "--quiet"
            ],

            cwd=BASE_DIR

        )


        # ----------------------------------------------------
        # RETURN CODE 1 = CHANGES EXIST
        # ----------------------------------------------------

        if status.returncode == 1:

            try:

                subprocess.run(

                    [
                        "git",
                        "commit",
                        "-m",
                        (
                            "Daily Scan "
                            +
                            start_dt.strftime(
                                "%Y-%m-%d"
                            )
                        )
                    ],

                    cwd=BASE_DIR,

                    check=True

                )


                git_commit = (
                    "SUCCESS"
                )


                log(
                    "✅ Git Commit Complete"
                )


            except Exception as error:

                git_commit = (
                    "FAILED"
                )

                overall_status = (
                    "FAILED"
                )


                log(
                    "❌ Git Commit FAILED"
                )

                log(
                    f"   {error}"
                )


        # ----------------------------------------------------
        # RETURN CODE 0 = NOTHING TO COMMIT
        # ----------------------------------------------------

        elif status.returncode == 0:

            git_commit = (
                "NOT REQUIRED"
            )

            git_push = (
                "NOT REQUIRED"
            )


            log(
                "ℹ️ No Git changes to commit."
            )


        else:

            git_commit = (
                "FAILED"
            )

            overall_status = (
                "FAILED"
            )


            log(
                "❌ Git status check FAILED"
            )


    except Exception as error:

        git_commit = (
            "FAILED"
        )

        overall_status = (
            "FAILED"
        )


        log(
            "❌ Git status check FAILED"
        )

        log(
            f"   {error}"
        )


# ============================================================
# GIT PUSH
# ============================================================

if (
    overall_status == "SUCCESS"
    and
    git_commit == "SUCCESS"
):

    try:

        subprocess.run(

            [
                "git",
                "push"
            ],

            cwd=BASE_DIR,

            check=True

        )


        git_push = (
            "SUCCESS"
        )


        log(
            "✅ Git Push Complete"
        )


    except Exception as error:

        git_push = (
            "FAILED"
        )

        overall_status = (
            "FAILED"
        )


        log(
            "❌ Git Push FAILED"
        )

        log(
            f"   {error}"
        )


# ============================================================
# FINISH
# ============================================================

finish_dt = datetime.now()


duration = round(

    (
        time.time()
        -
        start_time
    )
    /
    60,

    1

)


# ============================================================
# CSV HISTORY
# ============================================================

rows = []


if os.path.exists(
    CSV_FILE
):

    try:

        with open(

            CSV_FILE,

            newline="",

            encoding="utf-8"

        ) as file:

            reader = csv.DictReader(
                file
            )


            rows = list(
                reader
            )


    except Exception as error:

        log(
            f"⚠️ Could not read existing CSV: {error}"
        )

        rows = []


# ============================================================
# KEEP LAST 180 DAYS
# ============================================================

cutoff = (
    finish_dt
    -
    timedelta(
        days=180
    )
)


filtered = []


for row in rows:

    try:

        row_date = datetime.strptime(

            row[
                "Date"
            ],

            "%Y-%m-%d"

        )


        if row_date >= cutoff:

            filtered.append(
                row
            )


    except Exception:

        pass


# ============================================================
# ADD TODAY
# ============================================================

filtered.append({

    "Date":
        start_dt.strftime(
            "%Y-%m-%d"
        ),

    "Started":
        start_dt.strftime(
            "%H:%M:%S"
        ),

    "Finished":
        finish_dt.strftime(
            "%H:%M:%S"
        ),

    "Duration (min)":
        duration,

    "Breakout":
        results.get(
            "Breakout Scanner",
            "NOT RUN"
        ),

    "Pre-Breakout":
        results.get(
            "Pre-Breakout Scanner",
            "NOT RUN"
        ),

    "Launch Pad":
        results.get(
            "Launch Pad Scanner",
            "NOT RUN"
        ),

    "Smart Money":
        results.get(
            "Smart Money Scanner",
            "NOT RUN"
        ),

    "Indicators":
        indicator_status,

    "Daily Brief":
        daily_brief_status,

    "FINRA":
        finra_status,

    "X-Factor":
        x_factor_status,

    "Git Add":
        git_add,

    "Git Commit":
        git_commit,

    "Git Push":
        git_push,

    "Overall":
        overall_status

})


# ============================================================
# SAVE CSV
# ============================================================

fieldnames = [

    "Date",

    "Started",

    "Finished",

    "Duration (min)",

    "Breakout",

    "Pre-Breakout",

    "Launch Pad",

    "Smart Money",

    "Indicators",

    "Daily Brief",

    "FINRA",

    "X-Factor",

    "Git Add",

    "Git Commit",

    "Git Push",

    "Overall"

]


try:

    with open(

        CSV_FILE,

        "w",

        newline="",

        encoding="utf-8"

    ) as file:

        writer = csv.DictWriter(

            file,

            fieldnames=fieldnames,

            extrasaction="ignore"

        )


        writer.writeheader()


        for row in filtered:

            clean_row = {

                field:
                    row.get(
                        field,
                        ""
                    )

                for field in fieldnames

            }


            writer.writerow(
                clean_row
            )


except Exception as error:

    log(
        f"❌ Could not save history CSV: {error}"
    )


# ============================================================
# FINAL REPORT
# ============================================================

log()
log(
    "=" * 70
)

log(
    "EDGEBREAK DAILY SCAN REPORT"
)

log(
    "=" * 70
)


log(

    f"Started      : "
    f"{start_dt.strftime('%d-%b-%Y %H:%M:%S')}"

)


log(

    f"Finished     : "
    f"{finish_dt.strftime('%d-%b-%Y %H:%M:%S')}"

)


log(

    f"Duration     : "
    f"{duration} minutes"

)


log()


for scanner, _ in SCANNERS:

    log(

        f"{scanner:<25}: "
        f"{results.get(scanner, 'NOT RUN')}"

    )


log()


log(

    f"{'Indicator History':<25}: "
    f"{indicator_status}"

)


log(

    f"{'Daily Brief Cull':<25}: "
    f"{daily_brief_status}"

)


log(

    f"{'FINRA Analysis':<25}: "
    f"{finra_status}"

)


log(

    f"{'X-Factor Rerank':<25}: "
    f"{x_factor_status}"

)


log()


log(

    f"{'Git Add':<25}: "
    f"{git_add}"

)


log(

    f"{'Git Commit':<25}: "
    f"{git_commit}"

)


log(

    f"{'Git Push':<25}: "
    f"{git_push}"

)


log()


log(

    f"{'Overall':<25}: "
    f"{overall_status}"

)


log(

    f"{'History File':<25}: "
    f"{CSV_FILE}"

)


log(

    f"{'Log File':<25}: "
    f"{LOG_FILE}"

)


log(
    "=" * 70
)


# ============================================================
# EXIT CODE
# ============================================================
#
# Useful for Windows Task Scheduler.
#
# 0 = successful
# 1 = something failed
#
# ============================================================

if overall_status == "SUCCESS":

    sys.exit(
        0
    )


else:

    sys.exit(
        1
    )