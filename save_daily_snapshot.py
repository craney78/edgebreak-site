import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


# ============================================================
# EDGEBREAK DAILY RESEARCH SNAPSHOT
# ============================================================
#
# PURPOSE
#
# Freeze today's scanner membership and related daily research
# data so later studies can answer questions such as:
#
#   - What happened after a Pre-Breakout appearance?
#   - Did longer Launch Pad bases behave differently?
#   - How often did confirmed breakouts hold?
#
# This script runs only after the normal EdgeBreak pipeline has
# completed successfully.
#
# It DOES NOT change any live scanner JSON.
#
# ============================================================


BASE_DIR = Path(__file__).resolve().parent

HISTORY_ROOT = (
    BASE_DIR
    /
    "scanner_history"
)


# ============================================================
# REQUIRED CORE SCANNER FILES
# ============================================================

CORE_SOURCES = {

    "breakout":
        "breakout_scanner.json",

    "pre_breakout":
        "scanner_database.json",

    "launchpad":
        "launchpad_database.json"

}


# ============================================================
# OPTIONAL DAILY RESEARCH FILES
# ============================================================
#
# The known Daily Brief file is included directly.
#
# The script also discovers small current JSON files beginning
# with daily_brief or finra. Historical/archive/cache files are
# deliberately excluded to avoid copying history inside history.
#
# ============================================================

KNOWN_OPTIONAL = [

    "daily_brief_candidates.json",

    "daily_brief_top6.json",

    "daily_brief_finra_rerank.json",

    "finra_off_exchange.json",

    "finra_off_exchange_analysis.json"

]


EXCLUDED_NAME_PARTS = {

    "history",
    "archive",
    "cache",
    "backup",
    "snapshot"

}


OPTIONAL_SIZE_LIMIT = (
    5
    *
    1024
    *
    1024
)


PREFERRED_ARRAY_KEYS = [

    "stocks",
    "results",
    "scanner_data",
    "data",
    "candidates",
    "top6",
    "top_6",
    "ranked",
    "records",
    "items"

]


# ============================================================
# HELPERS
# ============================================================

def sha256_file(path):

    digest = hashlib.sha256()

    with path.open("rb") as file:

        for chunk in iter(
            lambda: file.read(1024 * 1024),
            b""
        ):

            digest.update(
                chunk
            )

    return digest.hexdigest()


def load_json(path):

    with path.open(
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(
            file
        )


def find_records(data):

    if isinstance(
        data,
        list
    ):

        return (
            data,
            "root_array"
        )


    if isinstance(
        data,
        dict
    ):

        for key in PREFERRED_ARRAY_KEYS:

            value = data.get(
                key
            )

            if isinstance(
                value,
                list
            ):

                return (
                    value,
                    key
                )


        # Last-resort array discovery.
        # Only use this when there is exactly one list-valued key,
        # which avoids guessing when a file contains several arrays.
        arrays = [

            (
                key,
                value
            )

            for key, value
            in data.items()

            if isinstance(
                value,
                list
            )

        ]


        if len(
            arrays
        ) == 1:

            key, value = arrays[0]

            return (
                value,
                key
            )


    return (
        None,
        None
    )


def normalise_source(
    label,
    path,
    required=False
):

    data = load_json(
        path
    )

    records, record_key = (
        find_records(
            data
        )
    )


    source = {

        "label":
            label,

        "source_file":
            path.name,

        "required":
            required,

        "sha256":
            sha256_file(
                path
            ),

        "bytes":
            path.stat().st_size

    }


    if records is not None:

        source[
            "record_container"
        ] = record_key

        source[
            "record_count"
        ] = len(
            records
        )

        # Preserve each result record exactly as it exists today.
        source[
            "records"
        ] = records


        # Preserve useful top-level metadata without duplicating
        # another large results array.
        if isinstance(
            data,
            dict
        ):

            metadata = {

                key:
                    value

                for key, value
                in data.items()

                if key != record_key
                and
                not isinstance(
                    value,
                    list
                )

            }


            if metadata:

                source[
                    "source_metadata"
                ] = metadata


    else:

        # Unknown schema: preserve the JSON rather than silently
        # throwing data away.
        source[
            "record_count"
        ] = None

        source[
            "raw"
        ] = data


    return source


def discover_optional_files():

    found = {}


    for filename in KNOWN_OPTIONAL:

        path = (
            BASE_DIR
            /
            filename
        )

        if path.exists():

            found[
                filename
            ] = path


    for path in BASE_DIR.glob(
        "*.json"
    ):

        name = (
            path.name
            .lower()
        )


        if not (
            name.startswith(
                "daily_brief"
            )
            or
            name.startswith(
                "finra"
            )
        ):

            continue


        if any(
            part in name
            for part in EXCLUDED_NAME_PARTS
        ):

            continue


        if (
            path.name
            in found
        ):

            continue


        if (
            path.stat().st_size
            >
            OPTIONAL_SIZE_LIMIT
        ):

            continue


        found[
            path.name
        ] = path


    return list(
        found.values()
    )


# ============================================================
# MARKET / SNAPSHOT DATE
# ============================================================
#
# Scheduled runs occur after the U.S. close at about 21:30 UTC.
# At that time the UTC calendar date is also the U.S. market
# session date.
#
# EDGEBREAK_SNAPSHOT_DATE can be supplied manually if an older
# session ever needs to be recreated.
#
# ============================================================

market_date = (
    os.getenv(
        "EDGEBREAK_SNAPSHOT_DATE",
        ""
    )
    .strip()
)


if not market_date:

    market_date = (
        datetime.now(
            timezone.utc
        )
        .date()
        .isoformat()
    )


try:

    datetime.strptime(
        market_date,
        "%Y-%m-%d"
    )

except ValueError:

    print(
        "❌ Invalid EDGEBREAK_SNAPSHOT_DATE. "
        "Use YYYY-MM-DD.",
        flush=True
    )

    sys.exit(
        1
    )


target_dir = (
    HISTORY_ROOT
    /
    market_date
)

target_dir.mkdir(
    parents=True,
    exist_ok=True
)


target_file = (
    target_dir
    /
    "snapshot.json"
)


temp_file = (
    target_dir
    /
    "snapshot.json.tmp"
)


# ============================================================
# BUILD SNAPSHOT
# ============================================================

snapshot = {

    "snapshot_version":
        1,

    "market_date":
        market_date,

    "created_at_utc":
        datetime.now(
            timezone.utc
        ).isoformat(),

    "purpose":
        "Frozen EdgeBreak daily scanner and research dataset for future historical analysis.",

    "core_scanners":
        {},

    "optional_daily_research":
        {},

    "missing_optional_files":
        []

}


# ============================================================
# CORE SCANNERS — REQUIRED
# ============================================================

for label, filename in CORE_SOURCES.items():

    path = (
        BASE_DIR
        /
        filename
    )


    if not path.exists():

        print(
            f"❌ Required snapshot source missing: {filename}",
            flush=True
        )

        sys.exit(
            1
        )


    try:

        snapshot[
            "core_scanners"
        ][
            label
        ] = normalise_source(

            label,
            path,
            required=True

        )

    except Exception as error:

        print(
            f"❌ Could not snapshot {filename}: {error}",
            flush=True
        )

        sys.exit(
            1
        )


# ============================================================
# OPTIONAL DAILY RESEARCH
# ============================================================

optional_paths = (
    discover_optional_files()
)


for path in optional_paths:

    try:

        snapshot[
            "optional_daily_research"
        ][
            path.stem
        ] = normalise_source(

            path.stem,
            path,
            required=False

        )

    except Exception as error:

        snapshot[
            "missing_optional_files"
        ].append({

            "file":
                path.name,

            "reason":
                str(
                    error
                )

        })


# ============================================================
# SUMMARY
# ============================================================

snapshot[
    "summary"
] = {

    "breakout_records":
        snapshot[
            "core_scanners"
        ][
            "breakout"
        ].get(
            "record_count"
        ),

    "pre_breakout_records":
        snapshot[
            "core_scanners"
        ][
            "pre_breakout"
        ].get(
            "record_count"
        ),

    "launchpad_records":
        snapshot[
            "core_scanners"
        ][
            "launchpad"
        ].get(
            "record_count"
        ),

    "optional_files_saved":
        len(
            snapshot[
                "optional_daily_research"
            ]
        )

}


# ============================================================
# ATOMIC SAVE
# ============================================================

with temp_file.open(
    "w",
    encoding="utf-8"
) as file:

    json.dump(

        snapshot,
        file,

        indent=2,

        ensure_ascii=False,

        default=str

    )

    file.write(
        "\n"
    )


os.replace(
    temp_file,
    target_file
)


print()
print(
    "=" * 70
)
print(
    "EDGEBREAK DAILY SNAPSHOT SAVED"
)
print(
    "=" * 70
)
print(
    f"Market date       : {market_date}"
)
print(
    f"Breakout records  : {snapshot['summary']['breakout_records']}"
)
print(
    f"Pre-Breakout      : {snapshot['summary']['pre_breakout_records']}"
)
print(
    f"Launch Pad        : {snapshot['summary']['launchpad_records']}"
)
print(
    f"Optional files    : {snapshot['summary']['optional_files_saved']}"
)
print(
    f"Saved to          : {target_file}"
)
print(
    "=" * 70
)
