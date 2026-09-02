# ============================================================
# EDGEBREAK — TWELVE DATA GROW AUDIT
# ============================================================
#
# PURPOSE
# -------
# Tests the useful Twelve Data endpoints for EdgeBreak
# without modifying any live scanner files.
#
# The API key is entered securely in the terminal.
# It is NOT saved by this script.
#
# TEST SYMBOL
# -----------
# AAPL
#
# ============================================================


import getpass
import json
import time
from datetime import datetime, timedelta

import requests


# ============================================================
# SETTINGS
# ============================================================

BASE_URL = "https://api.twelvedata.com"

SYMBOL = "AAPL"

TIMEOUT = 20

PAUSE_BETWEEN_REQUESTS = 1.5


# ============================================================
# GET API KEY
# ============================================================

print()
print("==============================================")
print("EDGEBREAK — TWELVE DATA GROW AUDIT")
print("==============================================")
print()

print(
    "Paste your Twelve Data API key below."
)

print(
    "It will NOT be displayed or saved."
)

print()


API_KEY = input(
    "Twelve Data API key: "
)


if not API_KEY.strip():

    print()
    print("❌ No API key entered.")
    raise SystemExit


API_KEY = API_KEY.strip()


# ============================================================
# HELPER — SAFE JSON
# ============================================================

def read_json(response):

    try:

        return response.json()

    except Exception:

        return None


# ============================================================
# HELPER — ERROR MESSAGE
# ============================================================

def get_error_message(data):

    if not isinstance(
        data,
        dict
    ):

        return ""

    message = data.get(
        "message"
    )

    if message:

        return str(
            message
        )

    error = data.get(
        "error"
    )

    if isinstance(
        error,
        str
    ):

        return error

    if isinstance(
        error,
        dict
    ):

        return str(
            error.get(
                "message",
                error
            )
        )

    return ""


# ============================================================
# HELPER — CLASSIFY RESULT
# ============================================================

def classify_result(
    response,
    data
):

    message = (
        get_error_message(
            data
        )
        .lower()
    )


    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    if (
        response.status_code == 200
        and
        not (
            isinstance(
                data,
                dict
            )
            and
            data.get(
                "status"
            ) == "error"
        )
    ):

        return (
            "AVAILABLE",
            "✅"
        )


    # --------------------------------------------------------
    # RATE LIMIT
    # --------------------------------------------------------

    if (
        response.status_code == 429
        or
        "rate limit" in message
        or
        "credits" in message
    ):

        return (
            "RATE / CREDIT LIMIT",
            "⚠️"
        )


    # --------------------------------------------------------
    # PLAN RESTRICTION
    # --------------------------------------------------------

    plan_words = [

        "plan",
        "subscription",
        "premium",
        "upgrade",
        "higher tier",
        "not available"

    ]


    if any(
        word in message
        for word in plan_words
    ):

        return (
            "NOT INCLUDED IN PLAN",
            "❌"
        )


    # --------------------------------------------------------
    # OTHER ERROR
    # --------------------------------------------------------

    return (
        "ERROR",
        "❌"
    )


# ============================================================
# HELPER — SHOW RESPONSE SUMMARY
# ============================================================

def describe_data(
    data
):

    if data is None:

        return "No JSON response"


    if isinstance(
        data,
        list
    ):

        return (
            f"List containing "
            f"{len(data)} records"
        )


    if not isinstance(
        data,
        dict
    ):

        return str(
            type(data).__name__
        )


    if isinstance(
        data.get(
            "values"
        ),
        list
    ):

        values = data[
            "values"
        ]

        return (
            f"{len(values)} values returned"
        )


    if isinstance(
        data.get(
            "data"
        ),
        list
    ):

        values = data[
            "data"
        ]

        return (
            f"{len(values)} records returned"
        )


    keys = list(
        data.keys()
    )


    if len(keys) > 8:

        keys = keys[:8]


    return (
        "Fields: "
        +
        ", ".join(
            keys
        )
    )


# ============================================================
# TEST ONE ENDPOINT
# ============================================================

def test_endpoint(
    name,
    endpoint,
    params=None
):

    if params is None:

        params = {}


    request_params = {

        **params,

        "apikey":
            API_KEY

    }


    url = (
        BASE_URL
        +
        endpoint
    )


    try:

        response = requests.get(

            url,

            params=
                request_params,

            timeout=
                TIMEOUT

        )


        data = read_json(
            response
        )


        status_text, icon = (
            classify_result(
                response,
                data
            )
        )


        print()
        print(
            f"{icon} {name}"
        )

        print(
            f"   Endpoint : {endpoint}"
        )

        print(
            f"   HTTP     : {response.status_code}"
        )

        print(
            f"   Result   : {status_text}"
        )


        if (
            status_text ==
            "AVAILABLE"
        ):

            print(
                "   Data     : "
                +
                describe_data(
                    data
                )
            )

        else:

            message = (
                get_error_message(
                    data
                )
            )


            if message:

                print(
                    f"   Message  : {message}"
                )


        # ----------------------------------------------------
        # CREDIT HEADERS
        # ----------------------------------------------------

        credits_used = (
            response.headers.get(
                "api-credits-used"
            )
        )

        credits_left = (
            response.headers.get(
                "api-credits-left"
            )
        )


        if (
            credits_used is not None
            or
            credits_left is not None
        ):

            print(
                f"   Credits  : "
                f"used={credits_used} "
                f"left={credits_left}"
            )


        return {

            "name":
                name,

            "endpoint":
                endpoint,

            "http":
                response.status_code,

            "status":
                status_text,

            "message":
                get_error_message(
                    data
                )

        }


    except Exception as error:

        print()
        print(
            f"❌ {name}"
        )

        print(
            f"   Endpoint : {endpoint}"
        )

        print(
            f"   Result   : NETWORK ERROR"
        )

        print(
            f"   Message  : {error}"
        )


        return {

            "name":
                name,

            "endpoint":
                endpoint,

            "http":
                None,

            "status":
                "NETWORK ERROR",

            "message":
                str(
                    error
                )

        }


# ============================================================
# API USAGE / PLAN
# ============================================================

print()
print()
print("----------------------------------------------")
print("1. ACCOUNT / PLAN")
print("----------------------------------------------")


try:

    response = requests.get(

        f"{BASE_URL}/api_usage",

        params={
            "apikey":
                API_KEY
        },

        timeout=
            TIMEOUT

    )


    usage_data = read_json(
        response
    )


    print()
    print(
        f"HTTP: {response.status_code}"
    )


    if isinstance(
        usage_data,
        dict
    ):

        print(
            json.dumps(
                usage_data,
                indent=2
            )
        )

    else:

        print(
            usage_data
        )


except Exception as error:

    print(
        "❌ Could not read API usage:",
        error
    )


time.sleep(
    PAUSE_BETWEEN_REQUESTS
)


# ============================================================
# TESTS
# ============================================================

results = []


# ------------------------------------------------------------
# CORE MARKET DATA
# ------------------------------------------------------------

print()
print()
print("----------------------------------------------")
print("2. CORE MARKET DATA")
print("----------------------------------------------")


core_tests = [

    (
        "Daily OHLCV",
        "/time_series",
        {
            "symbol":
                SYMBOL,

            "interval":
                "1day",

            "outputsize":
                5
        }
    ),

    (
        "Quote",
        "/quote",
        {
            "symbol":
                SYMBOL
        }
    ),

    (
        "Price",
        "/price",
        {
            "symbol":
                SYMBOL
        }
    )

]


for test in core_tests:

    results.append(
        test_endpoint(
            *test
        )
    )

    time.sleep(
        PAUSE_BETWEEN_REQUESTS
    )


# ------------------------------------------------------------
# TECHNICAL INDICATORS
# ------------------------------------------------------------

print()
print()
print("----------------------------------------------")
print("3. TECHNICAL INDICATORS")
print("----------------------------------------------")


technical_tests = [

    (
        "OBV",
        "/obv",
        {
            "symbol":
                SYMBOL,

            "interval":
                "1day",

            "outputsize":
                5
        }
    ),

    (
        "RSI",
        "/rsi",
        {
            "symbol":
                SYMBOL,

            "interval":
                "1day",

            "time_period":
                14,

            "outputsize":
                5
        }
    ),

    (
        "MACD",
        "/macd",
        {
            "symbol":
                SYMBOL,

            "interval":
                "1day",

            "outputsize":
                5
        }
    ),

    (
        "ATR",
        "/atr",
        {
            "symbol":
                SYMBOL,

            "interval":
                "1day",

            "time_period":
                14,

            "outputsize":
                5
        }
    ),

    (
        "Bollinger Bands",
        "/bbands",
        {
            "symbol":
                SYMBOL,

            "interval":
                "1day",

            "time_period":
                20,

            "outputsize":
                5
        }
    ),

    (
        "SMA",
        "/sma",
        {
            "symbol":
                SYMBOL,

            "interval":
                "1day",

            "time_period":
                20,

            "outputsize":
                5
        }
    ),

    (
        "EMA",
        "/ema",
        {
            "symbol":
                SYMBOL,

            "interval":
                "1day",

            "time_period":
                20,

            "outputsize":
                5
        }
    )

]


for test in technical_tests:

    results.append(
        test_endpoint(
            *test
        )
    )

    time.sleep(
        PAUSE_BETWEEN_REQUESTS
    )


# ------------------------------------------------------------
# GROW FUNDAMENTALS
# ------------------------------------------------------------

print()
print()
print("----------------------------------------------")
print("4. GROW FUNDAMENTALS")
print("----------------------------------------------")


fundamental_tests = [

    (
        "Company Profile",
        "/profile",
        {
            "symbol":
                SYMBOL
        }
    ),

    (
        "Earnings History",
        "/earnings",
        {
            "symbol":
                SYMBOL
        }
    ),

    (
        "Dividends",
        "/dividends",
        {
            "symbol":
                SYMBOL
        }
    ),

    (
        "Stock Splits",
        "/splits",
        {
            "symbol":
                SYMBOL
        }
    ),

    (
        "Press Releases",
        "/press_releases",
        {
            "symbol":
                SYMBOL
        }
    )

]


for test in fundamental_tests:

    results.append(
        test_endpoint(
            *test
        )
    )

    time.sleep(
        PAUSE_BETWEEN_REQUESTS
    )


# ------------------------------------------------------------
# EARNINGS CALENDAR
# ------------------------------------------------------------

print()
print()
print("----------------------------------------------")
print("5. EARNINGS CALENDAR")
print("----------------------------------------------")


today = datetime.utcnow().date()

calendar_start = (
    today
    -
    timedelta(
        days=7
    )
)

calendar_end = (
    today
    +
    timedelta(
        days=14
    )
)


results.append(

    test_endpoint(

        "Earnings Calendar",

        "/earnings_calendar",

        {

            "start_date":
                calendar_start
                .isoformat(),

            "end_date":
                calendar_end
                .isoformat()

        }

    )

)


# ============================================================
# SUMMARY
# ============================================================

print()
print()
print("==============================================")
print("TWELVE DATA AUDIT SUMMARY")
print("==============================================")
print()


available = [

    result

    for result in results

    if result[
        "status"
    ] == "AVAILABLE"

]


blocked = [

    result

    for result in results

    if result[
        "status"
    ] == "NOT INCLUDED IN PLAN"

]


other = [

    result

    for result in results

    if result[
        "status"
    ] not in [
        "AVAILABLE",
        "NOT INCLUDED IN PLAN"
    ]

]


print(
    "AVAILABLE:"
)

for result in available:

    print(
        f"   ✅ {result['name']}"
    )


print()
print(
    "NOT INCLUDED IN PLAN:"
)

if blocked:

    for result in blocked:

        print(
            f"   ❌ {result['name']}"
        )

else:

    print(
        "   None detected"
    )


print()
print(
    "ERROR / RATE LIMIT:"
)

if other:

    for result in other:

        print(
            f"   ⚠️ {result['name']} "
            f"— {result['status']}"
        )

else:

    print(
        "   None"
    )


print()
print("----------------------------------------------")
print("KNOWN HIGHER-TIER DATA — NOT CALLED")
print("----------------------------------------------")

print()
print(
    "Pro / Venture:"
)

print(
    "   • Statistics"
)

print(
    "   • Income Statement"
)

print(
    "   • Balance Sheet"
)

print(
    "   • Cash Flow"
)

print()

print(
    "Higher-tier analysis / enterprise:"
)

print(
    "   • Analyst estimates"
)

print(
    "   • EPS revisions"
)

print(
    "   • Growth estimates"
)

print(
    "   • Recommendations"
)

print(
    "   • Price targets"
)

print(
    "   • Institutional holders"
)


print()
print("==============================================")
print("AUDIT COMPLETE")
print("==============================================")
print()