# ============================================================
# EDGEBREAK SCANNER INDICATOR HISTORY BUILDER
# ============================================================
#
# PURPOSE
# -------
# Builds a rolling technical-indicator and market-participation
# history for stocks currently found by any EdgeBreak scanner.
#
# INPUT FILES
# -----------
# breakout_scanner.json
# scanner_database.json
# launchpad_database.json
#
# OUTPUT FILE
# -----------
# scanner_indicator_history.json
#
# HISTORY
# -------
# Keeps 90 calendar days of saved indicator snapshots.
#
# IMPORTANT
# ---------
# Twelve Data is used ONLY to retrieve daily OHLCV candles.
#
# Indicators and EdgeBreak-derived intelligence are calculated
# locally in Python.
#
# Stocks appearing in multiple scanners are fetched only once.
#
#
# EDGEBREAK PARTICIPATION INTELLIGENCE
# ------------------------------------
#
# This builder now analyses:
#
# - 5-day price behaviour
# - 20-day price behaviour
# - 60-day price behaviour
#
# - 5-day OBV direction
# - 20-day OBV direction
# - 60-day OBV direction
#
# - RSI short-term behaviour
#
# - price / OBV relationship
#
# - participation state
#
#
# IMPORTANT:
#
# A short-term OBV decline DOES NOT automatically mean a
# stock is weakening.
#
# Example:
#
# Price falls for 5 days
# OBV falls modestly
# 20-day OBV remains healthy
# 60-day OBV remains healthy
#
# = NORMAL_PULLBACK
#
#
# Nothing in this file automatically removes stocks.
#
# The derived fields are evidence that can later be used
# as part of EdgeBreak ranking.
#
# ============================================================


import json
import os
import time
import math
import tempfile
from datetime import datetime, timedelta

import requests
import pandas as pd


# ============================================================
# TWELVE DATA
# ============================================================

API_KEY = os.getenv(
    "TWELVE_DATA_API_KEY",
    "c0c94a09b4e242e0805cf8261b5bda67"
)


TWELVE_DATA_URL = (
    "https://api.twelvedata.com/time_series"
)


# ============================================================
# INPUT / OUTPUT FILES
# ============================================================

BREAKOUT_FILE = (
    "breakout_scanner.json"
)

PRE_BREAKOUT_FILE = (
    "scanner_database.json"
)

LAUNCHPAD_FILE = (
    "launchpad_database.json"
)

OUTPUT_FILE = (
    "scanner_indicator_history.json"
)


# ============================================================
# SETTINGS
# ============================================================

# Enough daily bars for:
#
# SMA 200
# 60-day participation analysis
# historical breathing room

HISTORY_BARS = 260


# Keep saved scanner snapshots for this many calendar days.

RETENTION_DAYS = 90


# Same batching style already used by EdgeBreak.

BATCH_SIZE = 10


# Pause between Twelve Data batches.

SLEEP_TIME = 2


# Network timeout.

REQUEST_TIMEOUT = 20


# Retry failed Twelve Data batches.

MAX_RETRIES = 2


# ============================================================
# INDICATOR SETTINGS
# ============================================================

SMA_PERIODS = [
    20,
    50,
    200
]

EMA_PERIODS = [
    20,
    50
]

RSI_PERIOD = 14

MACD_FAST = 12

MACD_SLOW = 26

MACD_SIGNAL = 9

BOLLINGER_PERIOD = 20

BOLLINGER_STD = 2

ATR_PERIOD = 14

AVERAGE_VOLUME_PERIOD = 20


# ============================================================
# EDGEBREAK BEHAVIOUR WINDOWS
# ============================================================

SHORT_WINDOW = 5

MEDIUM_WINDOW = 20

LONG_WINDOW = 60


# ============================================================
# HELPERS
# ============================================================

def safe_float(
    value,
    default=None
):

    try:

        number = float(
            value
        )

        if math.isnan(
            number
        ):

            return default

        return number

    except:

        return default


def clean_number(
    value,
    decimals=4
):

    value = safe_float(
        value
    )

    if value is None:

        return None

    return round(
        value,
        decimals
    )


def load_json_file(
    filename
):

    if not os.path.exists(
        filename
    ):

        print(
            f"⚠️ File not found: {filename}"
        )

        return []

    try:

        with open(
            filename,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(
                f
            )

        if isinstance(
            data,
            list
        ):

            return data

        return []

    except Exception as e:

        print(
            f"❌ Could not read {filename}: {e}"
        )

        return []


# ============================================================
# LOAD EXISTING INDICATOR HISTORY
# ============================================================

def load_existing_history():

    if not os.path.exists(
        OUTPUT_FILE
    ):

        return {}

    try:

        with open(
            OUTPUT_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(
                f
            )

        if isinstance(
            data,
            dict
        ):

            return data

    except Exception as e:

        print(
            "⚠️ Existing indicator history "
            f"could not be read: {e}"
        )

    return {}


# ============================================================
# BUILD UNIQUE SCANNER SYMBOL LIST
# ============================================================

def build_scanner_symbol_map():

    symbol_map = {}


    # --------------------------------------------------------
    # BREAKOUT
    # --------------------------------------------------------

    breakout_data = load_json_file(
        BREAKOUT_FILE
    )


    for row in breakout_data:

        symbol = str(
            row.get(
                "symbol",
                ""
            )
        ).strip().upper()


        if not symbol:

            continue


        if symbol not in symbol_map:

            symbol_map[
                symbol
            ] = {

                "scanners":
                    [],

                "scanner_data":
                    {}

            }


        if (
            "breakout"
            not in
            symbol_map[
                symbol
            ][
                "scanners"
            ]
        ):

            symbol_map[
                symbol
            ][
                "scanners"
            ].append(
                "breakout"
            )


        symbol_map[
            symbol
        ][
            "scanner_data"
        ][
            "breakout"
        ] = {

            "scan_date":
                row.get(
                    "scan_date"
                ),

            "price":
                row.get(
                    "price"
                ),

            "resistance":
                row.get(
                    "resistance"
                ),

            "distance_above_resistance":
                row.get(
                    "distance_above_resistance"
                ),

            "touches":
                row.get(
                    "touches"
                ),

            "higher_lows":
                row.get(
                    "higher_lows"
                ),

            "volume_ratio":
                row.get(
                    "volume_ratio"
                ),

            "grade":
                row.get(
                    "grade"
                ),

            "rank":
                row.get(
                    "rank"
                )

        }


    # --------------------------------------------------------
    # PRE-BREAKOUT
    # --------------------------------------------------------

    pre_breakout_data = load_json_file(
        PRE_BREAKOUT_FILE
    )


    for row in pre_breakout_data:

        symbol = str(
            row.get(
                "symbol",
                ""
            )
        ).strip().upper()


        if not symbol:

            continue


        if symbol not in symbol_map:

            symbol_map[
                symbol
            ] = {

                "scanners":
                    [],

                "scanner_data":
                    {}

            }


        if (
            "pre_breakout"
            not in
            symbol_map[
                symbol
            ][
                "scanners"
            ]
        ):

            symbol_map[
                symbol
            ][
                "scanners"
            ].append(
                "pre_breakout"
            )


        symbol_map[
            symbol
        ][
            "scanner_data"
        ][
            "pre_breakout"
        ] = {

            "scan_date":
                row.get(
                    "scan_date"
                ),

            "current_price":
                row.get(
                    "current_price"
                ),

            "resistance_price":
                row.get(
                    "resistance_price"
                ),

            "resistance_touches":
                row.get(
                    "resistance_touches"
                ),

            "higher_lows":
                row.get(
                    "higher_lows"
                ),

            "distance_to_resistance":
                row.get(
                    "distance_to_resistance"
                ),

            "average_volume_20":
                row.get(
                    "average_volume_20"
                ),

            "average_dollar_volume_20":
                row.get(
                    "average_dollar_volume_20"
                ),

            "liquidity_group":
                row.get(
                    "liquidity_group"
                )

        }


    # --------------------------------------------------------
    # LAUNCH PAD
    # --------------------------------------------------------

    launchpad_data = load_json_file(
        LAUNCHPAD_FILE
    )


    for row in launchpad_data:

        symbol = str(
            row.get(
                "symbol",
                ""
            )
        ).strip().upper()


        if not symbol:

            continue


        if symbol not in symbol_map:

            symbol_map[
                symbol
            ] = {

                "scanners":
                    [],

                "scanner_data":
                    {}

            }


        if (
            "launchpad"
            not in
            symbol_map[
                symbol
            ][
                "scanners"
            ]
        ):

            symbol_map[
                symbol
            ][
                "scanners"
            ].append(
                "launchpad"
            )


        symbol_map[
            symbol
        ][
            "scanner_data"
        ][
            "launchpad"
        ] = {

            "last_updated":
                row.get(
                    "last_updated"
                ),

            "current_price":
                row.get(
                    "current_price"
                ),

            "launchpad_days":
                row.get(
                    "launchpad_days"
                ),

            "support_zone_low":
                row.get(
                    "support_zone_low"
                ),

            "support_zone_high":
                row.get(
                    "support_zone_high"
                ),

            "resistance_zone_low":
                row.get(
                    "resistance_zone_low"
                ),

            "resistance_zone_high":
                row.get(
                    "resistance_zone_high"
                ),

            "support_tests":
                row.get(
                    "support_tests"
                ),

            "resistance_tests":
                row.get(
                    "resistance_tests"
                ),

            "range_percent":
                row.get(
                    "range_percent"
                )

        }


    # --------------------------------------------------------
    # SORT SCANNER NAMES
    # --------------------------------------------------------

    scanner_order = {

        "breakout":
            1,

        "pre_breakout":
            2,

        "launchpad":
            3

    }


    for symbol in symbol_map:

        symbol_map[
            symbol
        ][
            "scanners"
        ].sort(

            key=lambda x:
                scanner_order.get(
                    x,
                    99
                )

        )


    return symbol_map


# ============================================================
# TWELVE DATA FETCH
# ============================================================

def fetch_batch(
    symbols
):

    params = {

        "symbol":
            ",".join(
                symbols
            ),

        "interval":
            "1day",

        "outputsize":
            HISTORY_BARS,

        "apikey":
            API_KEY

    }


    for attempt in range(
        1,
        MAX_RETRIES + 1
    ):

        try:

            response = requests.get(

                TWELVE_DATA_URL,

                params=params,

                timeout=
                    REQUEST_TIMEOUT

            )


            response.raise_for_status()


            data = (
                response.json()
            )


            return data


        except Exception as e:

            print(
                "⚠️ Twelve Data attempt "
                f"{attempt}/{MAX_RETRIES} "
                f"failed: {e}"
            )


            if (
                attempt <
                MAX_RETRIES
            ):

                time.sleep(
                    3
                )


    return {}


# ============================================================
# NORMALISE TWELVE DATA RESPONSE
# ============================================================

def extract_symbol_values(
    batch_data,
    symbol,
    batch_size
):

    if not isinstance(
        batch_data,
        dict
    ):

        return None


    # --------------------------------------------------------
    # MULTI-SYMBOL RESPONSE
    # --------------------------------------------------------

    if symbol in batch_data:

        content = (
            batch_data.get(
                symbol
            )
        )


        if isinstance(
            content,
            dict
        ):

            values = (
                content.get(
                    "values"
                )
            )


            if isinstance(
                values,
                list
            ):

                return values


    # --------------------------------------------------------
    # SINGLE-SYMBOL RESPONSE
    # --------------------------------------------------------

    if batch_size == 1:

        values = (
            batch_data.get(
                "values"
            )
        )


        if isinstance(
            values,
            list
        ):

            return values


    return None


# ============================================================
# BUILD DATAFRAME
# ============================================================

def build_dataframe(
    values
):

    if not values:

        return None


    rows = []


    for bar in values:

        try:

            row = {

                "datetime":
                    bar.get(
                        "datetime"
                    ),

                "open":
                    safe_float(
                        bar.get(
                            "open"
                        )
                    ),

                "high":
                    safe_float(
                        bar.get(
                            "high"
                        )
                    ),

                "low":
                    safe_float(
                        bar.get(
                            "low"
                        )
                    ),

                "close":
                    safe_float(
                        bar.get(
                            "close"
                        )
                    ),

                "volume":
                    safe_float(
                        bar.get(
                            "volume"
                        )
                    )

            }


            if (
                row[
                    "datetime"
                ]
                is None

                or

                row[
                    "high"
                ]
                is None

                or

                row[
                    "low"
                ]
                is None

                or

                row[
                    "close"
                ]
                is None
            ):

                continue


            rows.append(
                row
            )


        except:

            continue


    if not rows:

        return None


    df = pd.DataFrame(
        rows
    )


    # Twelve Data normally returns newest first.
    # Always calculate oldest -> newest.

    df[
        "datetime"
    ] = pd.to_datetime(

        df[
            "datetime"
        ],

        errors=
            "coerce"

    )


    df = df.dropna(
        subset=[
            "datetime"
        ]
    )


    df = df.sort_values(
        "datetime"
    )


    df = df.drop_duplicates(

        subset=[
            "datetime"
        ],

        keep=
            "last"

    )


    df = df.reset_index(
        drop=True
    )


    if df.empty:

        return None


    return df


# ============================================================
# SMA
# ============================================================

def calculate_sma(
    series,
    period
):

    if len(
        series
    ) < period:

        return None


    value = (

        series

        .rolling(
            period
        )

        .mean()

        .iloc[
            -1
        ]

    )


    return clean_number(
        value
    )


# ============================================================
# EMA
# ============================================================

def calculate_ema(
    series,
    period
):

    if len(
        series
    ) < period:

        return None


    value = (

        series

        .ewm(
            span=period,
            adjust=False
        )

        .mean()

        .iloc[
            -1
        ]

    )


    return clean_number(
        value
    )


# ============================================================
# RSI SERIES
# ============================================================

def calculate_rsi_series(
    series,
    period=14
):

    if len(
        series
    ) < period + 1:

        return None


    delta = (
        series.diff()
    )


    gains = (
        delta.clip(
            lower=0
        )
    )


    losses = (

        -delta.clip(
            upper=0
        )

    )


    average_gain = gains.ewm(

        alpha=
            1 / period,

        adjust=
            False,

        min_periods=
            period

    ).mean()


    average_loss = losses.ewm(

        alpha=
            1 / period,

        adjust=
            False,

        min_periods=
            period

    ).mean()


    rs = (
        average_gain
        /
        average_loss.replace(
            0,
            float(
                "nan"
            )
        )
    )


    rsi = (

        100

        -

        (
            100
            /
            (
                1
                +
                rs
            )
        )

    )


    # Where average loss is zero:
    #
    # gains > 0 = RSI 100
    # gains = 0 = RSI 50

    zero_loss = (
        average_loss
        ==
        0
    )


    rising_only = (

        zero_loss

        &

        (
            average_gain
            >
            0
        )

    )


    no_movement = (

        zero_loss

        &

        (
            average_gain
            ==
            0
        )

    )


    rsi.loc[
        rising_only
    ] = 100.0


    rsi.loc[
        no_movement
    ] = 50.0


    return rsi


# ============================================================
# RSI
# ============================================================

def calculate_rsi(
    series,
    period=14
):

    rsi_series = (
        calculate_rsi_series(
            series,
            period
        )
    )


    if rsi_series is None:

        return None


    latest = (
        rsi_series.iloc[
            -1
        ]
    )


    if pd.isna(
        latest
    ):

        return None


    return clean_number(
        latest,
        2
    )


# ============================================================
# MACD
# ============================================================

def calculate_macd(
    series
):

    minimum_bars = (

        MACD_SLOW
        +
        MACD_SIGNAL

    )


    if len(
        series
    ) < minimum_bars:

        return {

            "macd":
                None,

            "signal":
                None,

            "histogram":
                None

        }


    ema_fast = (
        series.ewm(

            span=
                MACD_FAST,

            adjust=
                False

        ).mean()
    )


    ema_slow = (
        series.ewm(

            span=
                MACD_SLOW,

            adjust=
                False

        ).mean()
    )


    macd_line = (
        ema_fast
        -
        ema_slow
    )


    signal_line = (
        macd_line.ewm(

            span=
                MACD_SIGNAL,

            adjust=
                False

        ).mean()
    )


    histogram = (
        macd_line
        -
        signal_line
    )


    return {

        "macd":
            clean_number(
                macd_line.iloc[
                    -1
                ]
            ),

        "signal":
            clean_number(
                signal_line.iloc[
                    -1
                ]
            ),

        "histogram":
            clean_number(
                histogram.iloc[
                    -1
                ]
            )

    }


# ============================================================
# BOLLINGER BANDS
# ============================================================

def calculate_bollinger(
    series
):

    if len(
        series
    ) < BOLLINGER_PERIOD:

        return {

            "upper":
                None,

            "middle":
                None,

            "lower":
                None

        }


    rolling = (
        series.rolling(
            BOLLINGER_PERIOD
        )
    )


    middle = (
        rolling
        .mean()
        .iloc[
            -1
        ]
    )


    std = (
        rolling
        .std(
            ddof=0
        )
        .iloc[
            -1
        ]
    )


    upper = (

        middle

        +

        BOLLINGER_STD
        *
        std

    )


    lower = (

        middle

        -

        BOLLINGER_STD
        *
        std

    )


    return {

        "upper":
            clean_number(
                upper
            ),

        "middle":
            clean_number(
                middle
            ),

        "lower":
            clean_number(
                lower
            )

    }


# ============================================================
# ATR
# ============================================================

def calculate_atr(
    df
):

    if len(
        df
    ) < ATR_PERIOD + 1:

        return None


    previous_close = (
        df[
            "close"
        ].shift(
            1
        )
    )


    range_one = (

        df[
            "high"
        ]

        -

        df[
            "low"
        ]

    )


    range_two = (

        df[
            "high"
        ]

        -

        previous_close

    ).abs()


    range_three = (

        df[
            "low"
        ]

        -

        previous_close

    ).abs()


    true_range = pd.concat(

        [

            range_one,

            range_two,

            range_three

        ],

        axis=1

    ).max(
        axis=1
    )


    atr = true_range.ewm(

        alpha=
            1 / ATR_PERIOD,

        adjust=
            False,

        min_periods=
            ATR_PERIOD

    ).mean()


    return clean_number(
        atr.iloc[
            -1
        ]
    )


# ============================================================
# VOLUME
# ============================================================

def calculate_volume_metrics(
    df
):

    if (
        "volume"
        not in
        df.columns
    ):

        return {

            "average_volume_20":
                None,

            "relative_volume":
                None

        }


    valid_volume = (
        df[
            "volume"
        ]
        .dropna()
    )


    if len(
        valid_volume
    ) < AVERAGE_VOLUME_PERIOD:

        return {

            "average_volume_20":
                None,

            "relative_volume":
                None

        }


    last_20 = (
        valid_volume.iloc[
            -AVERAGE_VOLUME_PERIOD:
        ]
    )


    average_volume = (
        last_20.mean()
    )


    current_volume = (
        valid_volume.iloc[
            -1
        ]
    )


    relative_volume = (
        None
    )


    if average_volume > 0:

        relative_volume = (

            current_volume

            /

            average_volume

        )


    return {

        "average_volume_20":
            round(
                average_volume
            ),

        "relative_volume":
            clean_number(
                relative_volume,
                2
            )

    }


# ============================================================
# PERCENT CHANGE
# ============================================================

def calculate_percent_change(
    series,
    lookback
):

    if len(
        series
    ) < lookback + 1:

        return None


    current = safe_float(
        series.iloc[
            -1
        ]
    )


    previous = safe_float(
        series.iloc[
            -(lookback + 1)
        ]
    )


    if current is None:

        return None


    if previous is None:

        return None


    if previous == 0:

        return None


    change = (

        (
            current
            -
            previous
        )

        /

        abs(
            previous
        )

    ) * 100


    return clean_number(
        change,
        2
    )


# ============================================================
# PRICE TREND
# ============================================================

def classify_price_trend(
    change_percent,
    lookback
):

    if change_percent is None:

        return None


    # Wider windows require larger movement before
    # EdgeBreak describes the price trend as meaningful.

    threshold_map = {

        5:
            1.0,

        20:
            3.0,

        60:
            6.0

    }


    threshold = (
        threshold_map.get(
            lookback,
            2.0
        )
    )


    if (
        change_percent
        >
        threshold
    ):

        return "rising"


    if (
        change_percent
        <
        -threshold
    ):

        return "falling"


    return "flat"


# ============================================================
# BUILD OBV SERIES
# ============================================================

def build_obv_series(
    df
):

    if (
        "volume"
        not in
        df.columns
    ):

        return None


    if len(
        df
    ) < 2:

        return None


    close = (
        df[
            "close"
        ]
    )


    volume = (
        df[
            "volume"
        ]
        .fillna(
            0
        )
    )


    obv_values = [
        0.0
    ]


    for i in range(
        1,
        len(
            df
        )
    ):

        previous_obv = (
            obv_values[
                -1
            ]
        )


        if (
            close.iloc[
                i
            ]
            >
            close.iloc[
                i - 1
            ]
        ):

            current_obv = (

                previous_obv

                +

                volume.iloc[
                    i
                ]

            )


        elif (
            close.iloc[
                i
            ]
            <
            close.iloc[
                i - 1
            ]
        ):

            current_obv = (

                previous_obv

                -

                volume.iloc[
                    i
                ]

            )


        else:

            current_obv = (
                previous_obv
            )


        obv_values.append(
            current_obv
        )


    return pd.Series(

        obv_values,

        index=
            df.index,

        dtype=
            "float64"

    )


# ============================================================
# OBV WINDOW STRENGTH
# ============================================================

def calculate_obv_window_strength(
    obv,
    volume,
    lookback
):

    if obv is None:

        return None


    if len(
        obv
    ) < lookback + 1:

        return None


    recent_volume = (

        volume

        .iloc[
            -lookback:
        ]

        .dropna()

    )


    if recent_volume.empty:

        return None


    average_volume = (
        recent_volume.mean()
    )


    if average_volume <= 0:

        return None


    current_obv = (
        obv.iloc[
            -1
        ]
    )


    old_obv = (
        obv.iloc[
            -(lookback + 1)
        ]
    )


    obv_change = (

        current_obv

        -

        old_obv

    )


    # --------------------------------------------------------
    # IMPORTANT
    # --------------------------------------------------------
    #
    # We do NOT divide by the historical absolute OBV value.
    #
    # OBV's absolute starting point is arbitrary.
    #
    # Instead we compare the OBV movement with the amount
    # of trading volume that occurred during the period.
    #
    # A value around:
    #
    # +1.0 = most volume occurred on up days
    # -1.0 = most volume occurred on down days
    #  0.0 = broadly balanced
    #
    # Values can occasionally exceed +/-1 because individual
    # daily volumes may differ from the period average.
    # --------------------------------------------------------

    denominator = (

        average_volume

        *

        lookback

    )


    if denominator == 0:

        return None


    strength = (

        obv_change

        /

        denominator

    )


    return clean_number(
        strength,
        4
    )


# ============================================================
# CLASSIFY OBV WINDOW
# ============================================================

def classify_obv_window(
    strength
):

    if strength is None:

        return None


    if strength >= 0.15:

        return "rising"


    if strength >= 0.04:

        return "slightly_rising"


    if strength <= -0.15:

        return "falling"


    if strength <= -0.04:

        return "slightly_falling"


    return "flat"


# ============================================================
# LEGACY OBV TREND
# ============================================================

def calculate_legacy_obv_trend(
    obv,
    volume
):

    if obv is None:

        return None


    if len(
        obv
    ) < 21:

        return "neutral"


    recent_obv = (

        obv

        .iloc[
            -20:
        ]

        .reset_index(
            drop=True
        )

    )


    x = pd.Series(

        range(
            len(
                recent_obv
            )
        ),

        dtype=
            "float64"

    )


    denominator = (
        x.var()
    )


    if denominator <= 0:

        return "neutral"


    slope = (

        x.cov(
            recent_obv
        )

        /

        denominator

    )


    recent_average_volume = (

        volume

        .iloc[
            -20:
        ]

        .mean()

    )


    if (
        recent_average_volume
        is None
    ):

        return "neutral"


    if (
        pd.isna(
            recent_average_volume
        )
    ):

        return "neutral"


    if recent_average_volume <= 0:

        return "neutral"


    normalized_slope = (

        slope

        /

        recent_average_volume

    )


    if normalized_slope > 0.05:

        return "rising"


    if normalized_slope < -0.05:

        return "falling"


    return "neutral"


# ============================================================
# ON-BALANCE VOLUME
# ============================================================

def calculate_obv(
    df
):

    empty_result = {

        # Existing fields

        "obv":
            None,

        "obv_change_5d_percent":
            None,

        "obv_change_20d_percent":
            None,

        "obv_trend":
            None,


        # New fields

        "obv_strength_5d":
            None,

        "obv_strength_20d":
            None,

        "obv_strength_60d":
            None,

        "obv_trend_5d":
            None,

        "obv_trend_20d":
            None,

        "obv_trend_60d":
            None

    }


    if (
        "volume"
        not in
        df.columns
    ):

        return empty_result


    obv = (
        build_obv_series(
            df
        )
    )


    if obv is None:

        return empty_result


    volume = (
        df[
            "volume"
        ]
        .fillna(
            0
        )
    )


    latest_obv = (
        obv.iloc[
            -1
        ]
    )


    # --------------------------------------------------------
    # EXISTING 5-DAY OBV PERCENTAGE
    # --------------------------------------------------------
    #
    # Kept for backward compatibility.
    #
    # Do NOT use this field as a primary EdgeBreak ranking
    # signal because absolute OBV values are arbitrary.

    obv_change_5d_percent = (
        None
    )


    if len(
        obv
    ) >= 6:

        old_obv = (
            obv.iloc[
                -6
            ]
        )


        if old_obv != 0:

            obv_change_5d_percent = (

                (
                    latest_obv
                    -
                    old_obv
                )

                /

                abs(
                    old_obv
                )

            ) * 100


    # --------------------------------------------------------
    # EXISTING 20-DAY OBV PERCENTAGE
    # --------------------------------------------------------

    obv_change_20d_percent = (
        None
    )


    if len(
        obv
    ) >= 21:

        old_obv = (
            obv.iloc[
                -21
            ]
        )


        if old_obv != 0:

            obv_change_20d_percent = (

                (
                    latest_obv
                    -
                    old_obv
                )

                /

                abs(
                    old_obv
                )

            ) * 100


    # --------------------------------------------------------
    # LEGACY TREND
    # --------------------------------------------------------

    legacy_trend = (
        calculate_legacy_obv_trend(

            obv,

            volume

        )
    )


    # --------------------------------------------------------
    # NEW NORMALISED OBV STRENGTH
    # --------------------------------------------------------

    strength_5d = (
        calculate_obv_window_strength(

            obv,

            volume,

            SHORT_WINDOW

        )
    )


    strength_20d = (
        calculate_obv_window_strength(

            obv,

            volume,

            MEDIUM_WINDOW

        )
    )


    strength_60d = (
        calculate_obv_window_strength(

            obv,

            volume,

            LONG_WINDOW

        )
    )


    # --------------------------------------------------------
    # NEW OBV TREND LABELS
    # --------------------------------------------------------

    trend_5d = (
        classify_obv_window(
            strength_5d
        )
    )


    trend_20d = (
        classify_obv_window(
            strength_20d
        )
    )


    trend_60d = (
        classify_obv_window(
            strength_60d
        )
    )


    return {

        # Existing fields

        "obv":
            clean_number(
                latest_obv,
                0
            ),

        "obv_change_5d_percent":
            clean_number(
                obv_change_5d_percent,
                2
            ),

        "obv_change_20d_percent":
            clean_number(
                obv_change_20d_percent,
                2
            ),

        "obv_trend":
            legacy_trend,


        # New fields

        "obv_strength_5d":
            strength_5d,

        "obv_strength_20d":
            strength_20d,

        "obv_strength_60d":
            strength_60d,

        "obv_trend_5d":
            trend_5d,

        "obv_trend_20d":
            trend_20d,

        "obv_trend_60d":
            trend_60d

    }


# ============================================================
# RSI BEHAVIOUR
# ============================================================

def calculate_rsi_behaviour(
    close
):

    result = {

        "rsi_change_5d":
            None,

        "rsi_change_20d":
            None,

        "rsi_state":
            None

    }


    rsi_series = (
        calculate_rsi_series(

            close,

            RSI_PERIOD

        )
    )


    if rsi_series is None:

        return result


    valid_rsi = (
        rsi_series.dropna()
    )


    if valid_rsi.empty:

        return result


    current = safe_float(
        valid_rsi.iloc[
            -1
        ]
    )


    if current is None:

        return result


    change_5d = (
        None
    )


    change_20d = (
        None
    )


    if len(
        valid_rsi
    ) >= 6:

        old = safe_float(
            valid_rsi.iloc[
                -6
            ]
        )


        if old is not None:

            change_5d = (
                current
                -
                old
            )


    if len(
        valid_rsi
    ) >= 21:

        old = safe_float(
            valid_rsi.iloc[
                -21
            ]
        )


        if old is not None:

            change_20d = (
                current
                -
                old
            )


    # --------------------------------------------------------
    # RSI STATE
    # --------------------------------------------------------

    state = (
        "holding"
    )


    if (
        change_5d is not None

        and

        change_5d >= 4
    ):

        state = (
            "strengthening"
        )


    elif (

        current >= 55

        and

        (
            change_5d is None

            or

            change_5d >= -5
        )

    ):

        state = (
            "holding_strong"
        )


    elif (

        change_5d is not None

        and

        change_5d <= -8

        and

        current < 45

    ):

        state = (
            "weakening"
        )


    elif (

        change_5d is not None

        and

        change_5d <= -5

    ):

        state = (
            "softening"
        )


    return {

        "rsi_change_5d":
            clean_number(
                change_5d,
                2
            ),

        "rsi_change_20d":
            clean_number(
                change_20d,
                2
            ),

        "rsi_state":
            state

    }


# ============================================================
# OBV TREND HELPERS
# ============================================================

def obv_is_positive(
    trend
):

    return trend in {

        "rising",
        "slightly_rising"

    }


def obv_is_healthy(
    trend
):

    return trend in {

        "rising",
        "slightly_rising",
        "flat"

    }


def obv_is_negative(
    trend
):

    return trend in {

        "falling",
        "slightly_falling"

    }


# ============================================================
# PRICE VS OBV RELATIONSHIP
# ============================================================

def classify_obv_price_relationship(

    price_change_5d,

    price_change_20d,

    obv_trend_5d,

    obv_trend_20d,

    obv_trend_60d

):

    # --------------------------------------------------------
    # SHORT-TERM PRICE PULLBACK
    # --------------------------------------------------------

    if (
        price_change_5d is not None

        and

        price_change_5d <= -1.0
    ):

        longer_obv_healthy = (

            obv_is_healthy(
                obv_trend_20d
            )

            and

            obv_is_healthy(
                obv_trend_60d
            )

        )


        # Price is pulling back while OBV is flat/rising.
        #
        # This is the strongest pullback relationship.

        if (

            longer_obv_healthy

            and

            obv_trend_5d in {

                "rising",
                "slightly_rising",
                "flat"

            }

        ):

            return (
                "positive_divergence"
            )


        # Price is pulling back and short-term OBV is only
        # slightly declining while the broader participation
        # picture remains healthy.
        #
        # DO NOT treat this as deterioration.

        if (

            longer_obv_healthy

            and

            obv_trend_5d
            ==
            "slightly_falling"

        ):

            return (
                "holding_during_pullback"
            )


        # Even a clearly falling 5-day OBV can be perfectly
        # normal after several consecutive down sessions
        # provided the 20/60-day structure remains healthy.

        if (

            longer_obv_healthy

            and

            obv_trend_5d
            ==
            "falling"

        ):

            return (
                "normal_pullback"
            )


    # --------------------------------------------------------
    # STRENGTH CONFIRMATION
    # --------------------------------------------------------

    if (
        price_change_20d is not None

        and

        price_change_20d >= 3.0

        and

        obv_is_positive(
            obv_trend_20d
        )

        and

        obv_is_healthy(
            obv_trend_60d
        )
    ):

        return (
            "confirming_strength"
        )


    # --------------------------------------------------------
    # NEGATIVE DIVERGENCE
    # --------------------------------------------------------

    if (
        price_change_5d is not None

        and

        price_change_5d >= 1.0

        and

        obv_trend_5d
        ==
        "falling"

        and

        obv_is_negative(
            obv_trend_20d
        )
    ):

        return (
            "negative_divergence"
        )


    # --------------------------------------------------------
    # CONFIRMING WEAKNESS
    # --------------------------------------------------------

    if (
        price_change_20d is not None

        and

        price_change_20d <= -3.0

        and

        obv_trend_20d
        ==
        "falling"

        and

        obv_is_negative(
            obv_trend_60d
        )
    ):

        return (
            "confirming_weakness"
        )


    return (
        "neutral"
    )


# ============================================================
# PARTICIPATION STATE
# ============================================================

def classify_participation_state(

    relationship,

    price_change_5d,

    price_change_20d,

    obv_trend_5d,

    obv_trend_20d,

    obv_trend_60d,

    rsi_state

):

    # --------------------------------------------------------
    # POSITIVE DIVERGENCE
    # --------------------------------------------------------

    if (
        relationship
        ==
        "positive_divergence"
    ):

        return (
            "POSITIVE_DIVERGENCE"
        )


    # --------------------------------------------------------
    # HOLDING DURING PULLBACK
    # --------------------------------------------------------

    if (
        relationship
        ==
        "holding_during_pullback"
    ):

        return (
            "HOLDING_DURING_PULLBACK"
        )


    # --------------------------------------------------------
    # NORMAL PULLBACK
    # --------------------------------------------------------

    if (
        relationship
        ==
        "normal_pullback"
    ):

        return (
            "NORMAL_PULLBACK"
        )


    # --------------------------------------------------------
    # STRONG CONFIRMATION
    # --------------------------------------------------------

    if (
        relationship
        ==
        "confirming_strength"

        and

        rsi_state
        not in {

            "weakening"

        }
    ):

        return (
            "STRONG_CONFIRMATION"
        )


    # --------------------------------------------------------
    # PERSISTENT DISTRIBUTION
    # --------------------------------------------------------
    #
    # Require weakness across multiple independent windows.
    #
    # A single 5-day OBV decline is NOT enough.

    if (

        obv_trend_20d
        ==
        "falling"

        and

        obv_trend_60d
        ==
        "falling"

        and

        rsi_state in {

            "softening",
            "weakening"

        }

        and

        (
            price_change_20d is None

            or

            price_change_20d <= 0
        )

    ):

        return (
            "PERSISTENT_DISTRIBUTION"
        )


    # --------------------------------------------------------
    # CONFIRMING WEAKNESS
    # --------------------------------------------------------

    if (

        relationship
        ==
        "confirming_weakness"

        and

        rsi_state in {

            "softening",
            "weakening"

        }

    ):

        return (
            "PERSISTENT_DISTRIBUTION"
        )


    # --------------------------------------------------------
    # WEAKENING
    # --------------------------------------------------------

    if (
        relationship
        ==
        "negative_divergence"
    ):

        return (
            "WEAKENING"
        )


    if (

        obv_trend_20d
        ==
        "falling"

        and

        rsi_state in {

            "softening",
            "weakening"

        }

    ):

        return (
            "WEAKENING"
        )


    # --------------------------------------------------------
    # NEUTRAL
    # --------------------------------------------------------

    return (
        "NEUTRAL"
    )


# ============================================================
# PRICE / PARTICIPATION INTELLIGENCE
# ============================================================

def calculate_participation_intelligence(
    df,
    obv_data
):

    close = (
        df[
            "close"
        ]
    )


    # --------------------------------------------------------
    # PRICE CHANGES
    # --------------------------------------------------------

    price_change_5d = (
        calculate_percent_change(

            close,

            SHORT_WINDOW

        )
    )


    price_change_20d = (
        calculate_percent_change(

            close,

            MEDIUM_WINDOW

        )
    )


    price_change_60d = (
        calculate_percent_change(

            close,

            LONG_WINDOW

        )
    )


    # --------------------------------------------------------
    # PRICE TREND LABELS
    # --------------------------------------------------------

    price_trend_5d = (
        classify_price_trend(

            price_change_5d,

            SHORT_WINDOW

        )
    )


    price_trend_20d = (
        classify_price_trend(

            price_change_20d,

            MEDIUM_WINDOW

        )
    )


    price_trend_60d = (
        classify_price_trend(

            price_change_60d,

            LONG_WINDOW

        )
    )


    # --------------------------------------------------------
    # RSI BEHAVIOUR
    # --------------------------------------------------------

    rsi_behaviour = (
        calculate_rsi_behaviour(
            close
        )
    )


    # --------------------------------------------------------
    # PRICE VS OBV
    # --------------------------------------------------------

    relationship = (
        classify_obv_price_relationship(

            price_change_5d,

            price_change_20d,

            obv_data.get(
                "obv_trend_5d"
            ),

            obv_data.get(
                "obv_trend_20d"
            ),

            obv_data.get(
                "obv_trend_60d"
            )

        )
    )


    # --------------------------------------------------------
    # PARTICIPATION STATE
    # --------------------------------------------------------

    participation_state = (
        classify_participation_state(

            relationship,

            price_change_5d,

            price_change_20d,

            obv_data.get(
                "obv_trend_5d"
            ),

            obv_data.get(
                "obv_trend_20d"
            ),

            obv_data.get(
                "obv_trend_60d"
            ),

            rsi_behaviour.get(
                "rsi_state"
            )

        )
    )


    return {

        "price_change_5d_percent":
            price_change_5d,

        "price_change_20d_percent":
            price_change_20d,

        "price_change_60d_percent":
            price_change_60d,

        "price_trend_5d":
            price_trend_5d,

        "price_trend_20d":
            price_trend_20d,

        "price_trend_60d":
            price_trend_60d,

        "rsi_change_5d":
            rsi_behaviour.get(
                "rsi_change_5d"
            ),

        "rsi_change_20d":
            rsi_behaviour.get(
                "rsi_change_20d"
            ),

        "rsi_state":
            rsi_behaviour.get(
                "rsi_state"
            ),

        "obv_price_relationship":
            relationship,

        "participation_state":
            participation_state

    }


# ============================================================
# PRICE VS MOVING AVERAGE
# ============================================================

def percent_from_level(
    price,
    level
):

    if price is None:

        return None


    if level is None:

        return None


    if level == 0:

        return None


    value = (

        (
            price
            -
            level
        )

        /

        level

    ) * 100


    return clean_number(
        value,
        2
    )


# ============================================================
# BUILD INDICATOR SNAPSHOT
# ============================================================

def build_indicator_snapshot(
    symbol,
    df,
    scanner_info
):

    if df is None:

        return None


    if df.empty:

        return None


    close = (
        df[
            "close"
        ]
    )


    current_price = (
        clean_number(

            close.iloc[
                -1
            ],

            4

        )
    )


    candle_date = (

        df[
            "datetime"
        ]

        .iloc[
            -1
        ]

        .strftime(
            "%Y-%m-%d"
        )

    )


    # --------------------------------------------------------
    # MOVING AVERAGES
    # --------------------------------------------------------

    sma20 = (
        calculate_sma(
            close,
            20
        )
    )


    sma50 = (
        calculate_sma(
            close,
            50
        )
    )


    sma200 = (
        calculate_sma(
            close,
            200
        )
    )


    ema20 = (
        calculate_ema(
            close,
            20
        )
    )


    ema50 = (
        calculate_ema(
            close,
            50
        )
    )


    # --------------------------------------------------------
    # RSI
    # --------------------------------------------------------

    rsi14 = (
        calculate_rsi(

            close,

            RSI_PERIOD

        )
    )


    # --------------------------------------------------------
    # MACD
    # --------------------------------------------------------

    macd = (
        calculate_macd(
            close
        )
    )


    # --------------------------------------------------------
    # BOLLINGER
    # --------------------------------------------------------

    bollinger = (
        calculate_bollinger(
            close
        )
    )


    # --------------------------------------------------------
    # ATR
    # --------------------------------------------------------

    atr14 = (
        calculate_atr(
            df
        )
    )


    # --------------------------------------------------------
    # VOLUME
    # --------------------------------------------------------

    volume = (
        calculate_volume_metrics(
            df
        )
    )


    # --------------------------------------------------------
    # OBV
    # --------------------------------------------------------

    obv = (
        calculate_obv(
            df
        )
    )


    # --------------------------------------------------------
    # EDGEBREAK PARTICIPATION INTELLIGENCE
    # --------------------------------------------------------

    participation = (
        calculate_participation_intelligence(

            df,

            obv

        )
    )


    # --------------------------------------------------------
    # SNAPSHOT
    # --------------------------------------------------------

    snapshot = {

        "date":
            candle_date,

        "scanners":
            scanner_info.get(
                "scanners",
                []
            ),

        "price":
            current_price,


        # ========================
        # MOVING AVERAGES
        # ========================

        "sma20":
            sma20,

        "sma50":
            sma50,

        "sma200":
            sma200,

        "ema20":
            ema20,

        "ema50":
            ema50,


        # ========================
        # DISTANCE FROM MA
        # ========================

        "percent_from_sma20":
            percent_from_level(
                current_price,
                sma20
            ),

        "percent_from_sma50":
            percent_from_level(
                current_price,
                sma50
            ),

        "percent_from_sma200":
            percent_from_level(
                current_price,
                sma200
            ),


        # ========================
        # RSI
        # ========================

        "rsi14":
            rsi14,


        # ========================
        # MACD
        # ========================

        "macd":
            macd[
                "macd"
            ],

        "macd_signal":
            macd[
                "signal"
            ],

        "macd_histogram":
            macd[
                "histogram"
            ],


        # ========================
        # BOLLINGER BANDS
        # ========================

        "bollinger_upper":
            bollinger[
                "upper"
            ],

        "bollinger_middle":
            bollinger[
                "middle"
            ],

        "bollinger_lower":
            bollinger[
                "lower"
            ],


        # ========================
        # ATR
        # ========================

        "atr14":
            atr14,


        # ========================
        # VOLUME
        # ========================

        "average_volume_20":
            volume[
                "average_volume_20"
            ],

        "relative_volume":
            volume[
                "relative_volume"
            ],


        # ========================
        # EXISTING OBV FIELDS
        # ========================

        "obv":
            obv[
                "obv"
            ],

        "obv_change_5d_percent":
            obv[
                "obv_change_5d_percent"
            ],

        "obv_change_20d_percent":
            obv[
                "obv_change_20d_percent"
            ],

        "obv_trend":
            obv[
                "obv_trend"
            ],


        # ========================
        # NEW OBV INTELLIGENCE
        # ========================

        "obv_strength_5d":
            obv[
                "obv_strength_5d"
            ],

        "obv_strength_20d":
            obv[
                "obv_strength_20d"
            ],

        "obv_strength_60d":
            obv[
                "obv_strength_60d"
            ],

        "obv_trend_5d":
            obv[
                "obv_trend_5d"
            ],

        "obv_trend_20d":
            obv[
                "obv_trend_20d"
            ],

        "obv_trend_60d":
            obv[
                "obv_trend_60d"
            ],


        # ========================
        # PRICE BEHAVIOUR
        # ========================

        "price_change_5d_percent":
            participation[
                "price_change_5d_percent"
            ],

        "price_change_20d_percent":
            participation[
                "price_change_20d_percent"
            ],

        "price_change_60d_percent":
            participation[
                "price_change_60d_percent"
            ],

        "price_trend_5d":
            participation[
                "price_trend_5d"
            ],

        "price_trend_20d":
            participation[
                "price_trend_20d"
            ],

        "price_trend_60d":
            participation[
                "price_trend_60d"
            ],


        # ========================
        # RSI BEHAVIOUR
        # ========================

        "rsi_change_5d":
            participation[
                "rsi_change_5d"
            ],

        "rsi_change_20d":
            participation[
                "rsi_change_20d"
            ],

        "rsi_state":
            participation[
                "rsi_state"
            ],


        # ========================
        # EDGEBREAK PARTICIPATION
        # ========================

        "obv_price_relationship":
            participation[
                "obv_price_relationship"
            ],

        "participation_state":
            participation[
                "participation_state"
            ],


        # ========================
        # DATA QUALITY
        # ========================

        "bars_available":
            len(
                df
            )

    }


    return snapshot


# ============================================================
# UPDATE SYMBOL HISTORY
# ============================================================

def update_symbol_history(

    history_database,

    symbol,

    snapshot,

    scanner_info

):

    if symbol not in history_database:

        history_database[
            symbol
        ] = {

            "first_seen":
                snapshot[
                    "date"
                ],

            "last_seen":
                snapshot[
                    "date"
                ],

            "scanners":
                scanner_info.get(
                    "scanners",
                    []
                ),

            "scanner_data":
                scanner_info.get(
                    "scanner_data",
                    {}
                ),

            "history":
                []

        }


    record = (
        history_database[
            symbol
        ]
    )


    # --------------------------------------------------------
    # FIRST / LAST SEEN
    # --------------------------------------------------------

    existing_first_seen = (
        record.get(
            "first_seen"
        )
    )


    if not existing_first_seen:

        record[
            "first_seen"
        ] = (
            snapshot[
                "date"
            ]
        )


    record[
        "last_seen"
    ] = (
        snapshot[
            "date"
        ]
    )


    # --------------------------------------------------------
    # CURRENT SCANNER MEMBERSHIP
    # --------------------------------------------------------

    record[
        "scanners"
    ] = (
        scanner_info.get(
            "scanners",
            []
        )
    )


    record[
        "scanner_data"
    ] = (
        scanner_info.get(
            "scanner_data",
            {}
        )
    )


    # --------------------------------------------------------
    # HISTORY
    # --------------------------------------------------------

    snapshots = (
        record.get(
            "history",
            []
        )
    )


    if not isinstance(
        snapshots,
        list
    ):

        snapshots = []


    # Same-day reruns replace existing snapshot.

    snapshots = [

        item

        for item
        in snapshots

        if (
            item.get(
                "date"
            )
            !=
            snapshot[
                "date"
            ]
        )

    ]


    snapshots.append(
        snapshot
    )


    snapshots.sort(

        key=lambda x:
            x.get(
                "date",
                ""
            )

    )


    record[
        "history"
    ] = (
        snapshots
    )


# ============================================================
# PURGE OLD SNAPSHOTS
# ============================================================

def purge_old_history(
    history_database
):

    today = (
        datetime.now()
        .date()
    )


    cutoff = (

        today

        -

        timedelta(
            days=
                RETENTION_DAYS
        )

    )


    for symbol in list(
        history_database.keys()
    ):

        record = (
            history_database[
                symbol
            ]
        )


        snapshots = (
            record.get(
                "history",
                []
            )
        )


        cleaned = []


        for snapshot in snapshots:

            date_string = (
                snapshot.get(
                    "date"
                )
            )


            try:

                snapshot_date = (

                    datetime.strptime(

                        date_string,

                        "%Y-%m-%d"

                    ).date()

                )

            except:

                continue


            if (
                snapshot_date
                >=
                cutoff
            ):

                cleaned.append(
                    snapshot
                )


        record[
            "history"
        ] = (
            cleaned
        )


        # Do not delete old symbol records.
        #
        # first_seen / last_seen allow EdgeBreak to retain
        # historical scanner awareness even when detailed
        # snapshots have expired.


# ============================================================
# ATOMIC SAVE
# ============================================================

def save_history_atomic(
    history_database
):

    directory = (
        os.path.dirname(

            os.path.abspath(
                OUTPUT_FILE
            )

        )
    )


    temp_path = (
        None
    )


    try:

        with tempfile.NamedTemporaryFile(

            mode=
                "w",

            encoding=
                "utf-8",

            dir=
                directory,

            delete=
                False,

            suffix=
                ".tmp"

        ) as temp_file:

            json.dump(

                history_database,

                temp_file,

                indent=
                    2,

                ensure_ascii=
                    False

            )


            temp_path = (
                temp_file.name
            )


        os.replace(

            temp_path,

            OUTPUT_FILE

        )


    except Exception:

        if (

            temp_path

            and

            os.path.exists(
                temp_path
            )

        ):

            try:

                os.remove(
                    temp_path
                )

            except:

                pass


        raise


# ============================================================
# MAIN
# ============================================================

def main():

    start_time = (
        time.time()
    )


    print()

    print(
        "=============================================="
    )

    print(
        "EDGEBREAK INDICATOR HISTORY BUILDER"
    )

    print(
        "=============================================="
    )

    print()


    # --------------------------------------------------------
    # API KEY CHECK
    # --------------------------------------------------------

    if (

        not API_KEY

        or

        API_KEY
        ==
        "PASTE_YOUR_EXISTING_KEY_HERE"

    ):

        print(
            "❌ Twelve Data API key is not configured."
        )

        print()

        print(
            "Set TWELVE_DATA_API_KEY or replace the "
            "placeholder in this file."
        )

        print()

        return


    # --------------------------------------------------------
    # LOAD SCANNER STOCKS
    # --------------------------------------------------------

    symbol_map = (
        build_scanner_symbol_map()
    )


    symbols = sorted(
        symbol_map.keys()
    )


    if not symbols:

        print(
            "❌ No scanner stocks found."
        )

        return


    breakout_count = sum(

        1

        for info
        in symbol_map.values()

        if (
            "breakout"
            in
            info[
                "scanners"
            ]
        )

    )


    pre_breakout_count = sum(

        1

        for info
        in symbol_map.values()

        if (
            "pre_breakout"
            in
            info[
                "scanners"
            ]
        )

    )


    launchpad_count = sum(

        1

        for info
        in symbol_map.values()

        if (
            "launchpad"
            in
            info[
                "scanners"
            ]
        )

    )


    print(
        "Breakout stocks     : "
        f"{breakout_count}"
    )

    print(
        "Pre-Breakout stocks : "
        f"{pre_breakout_count}"
    )

    print(
        "Launch Pad stocks   : "
        f"{launchpad_count}"
    )

    print(
        "Unique stocks       : "
        f"{len(symbols)}"
    )

    print()


    # --------------------------------------------------------
    # LOAD EXISTING HISTORY
    # --------------------------------------------------------

    history_database = (
        load_existing_history()
    )


    print(
        "Existing history    : "
        f"{len(history_database)} symbols"
    )

    print()


    # --------------------------------------------------------
    # FETCH / CALCULATE
    # --------------------------------------------------------

    processed = 0

    saved = 0

    failed = 0

    insufficient_history = 0


    total_batches = (

        len(
            symbols
        )

        +

        BATCH_SIZE

        -

        1

    ) // BATCH_SIZE


    for i in range(

        0,

        len(
            symbols
        ),

        BATCH_SIZE

    ):

        batch = (
            symbols[
                i:
                i + BATCH_SIZE
            ]
        )


        batch_number = (

            i
            //
            BATCH_SIZE

        ) + 1


        print(

            f"📦 Batch "
            f"{batch_number}/"
            f"{total_batches}"
            f" — "
            f"{', '.join(batch)}"

        )


        batch_data = (
            fetch_batch(
                batch
            )
        )


        for symbol in batch:

            processed += 1


            try:

                values = (
                    extract_symbol_values(

                        batch_data,

                        symbol,

                        len(
                            batch
                        )

                    )
                )


                if not values:

                    print(
                        f"   ⚠️ {symbol}: "
                        "no candle data"
                    )

                    failed += 1

                    continue


                df = (
                    build_dataframe(
                        values
                    )
                )


                if df is None:

                    print(
                        f"   ⚠️ {symbol}: "
                        "invalid candle data"
                    )

                    failed += 1

                    continue


                if len(
                    df
                ) < 200:

                    insufficient_history += 1


                snapshot = (
                    build_indicator_snapshot(

                        symbol,

                        df,

                        symbol_map[
                            symbol
                        ]

                    )
                )


                if snapshot is None:

                    failed += 1

                    continue


                update_symbol_history(

                    history_database,

                    symbol,

                    snapshot,

                    symbol_map[
                        symbol
                    ]

                )


                saved += 1


                print(

                    f"   ✅ {symbol}"

                    f" | Price "
                    f"{snapshot['price']}"

                    f" | RSI "
                    f"{snapshot['rsi14']}"

                    f" | OBV20 "
                    f"{snapshot['obv_trend_20d']}"

                    f" | OBV60 "
                    f"{snapshot['obv_trend_60d']}"

                    f" | Participation "
                    f"{snapshot['participation_state']}"

                )


            except Exception as e:

                failed += 1


                print(
                    f"   ❌ {symbol}: {e}"
                )


        # ----------------------------------------------------
        # SAVE AFTER EVERY BATCH
        # ----------------------------------------------------

        purge_old_history(
            history_database
        )


        try:

            save_history_atomic(
                history_database
            )

        except Exception as e:

            print(
                f"❌ Could not save history: {e}"
            )

            return


        if (
            i + BATCH_SIZE
            <
            len(
                symbols
            )
        ):

            time.sleep(
                SLEEP_TIME
            )


    # --------------------------------------------------------
    # FINAL PURGE / SAVE
    # --------------------------------------------------------

    purge_old_history(
        history_database
    )


    save_history_atomic(
        history_database
    )


    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    runtime = round(

        time.time()
        -
        start_time,

        2

    )


    print()

    print(
        "=============================================="
    )

    print(
        "INDICATOR HISTORY COMPLETE"
    )

    print(
        "=============================================="
    )

    print()


    print(
        "Scanner stocks processed : "
        f"{processed}"
    )


    print(
        "Snapshots saved          : "
        f"{saved}"
    )


    print(
        "Failed                   : "
        f"{failed}"
    )


    print(
        "Under 200 bars           : "
        f"{insufficient_history}"
    )


    print(
        "History symbols stored   : "
        f"{len(history_database)}"
    )


    print(
        "Retention                : "
        f"{RETENTION_DAYS} days"
    )


    print(
        "Runtime                  : "
        f"{runtime} seconds"
    )

    print()


    print(
        f"✅ Saved to {OUTPUT_FILE}"
    )

    print()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()
