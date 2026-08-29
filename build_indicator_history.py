# ============================================================
# EDGEBREAK SCANNER INDICATOR HISTORY BUILDER
# ============================================================
#
# PURPOSE
# -------
# Builds a small rolling technical-indicator history for stocks
# currently found by any EdgeBreak scanner.
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
# Indicators are calculated locally in Python.
#
# Stocks appearing in multiple scanners are fetched only once.
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

# Uses the same API key environment if one exists.
# Falls back to the key currently used by the EdgeBreak scanner.
#
# If you later move the scanner key into an environment variable,
# this file will automatically use it.

API_KEY = os.getenv(
    "TWELVE_DATA_API_KEY",
    "c0c94a09b4e242e0805cf8261b5bda67"
)

TWELVE_DATA_URL = "https://api.twelvedata.com/time_series"


# ============================================================
# INPUT / OUTPUT FILES
# ============================================================

BREAKOUT_FILE = "breakout_scanner.json"

PRE_BREAKOUT_FILE = "scanner_database.json"

LAUNCHPAD_FILE = "launchpad_database.json"

OUTPUT_FILE = "scanner_indicator_history.json"


# ============================================================
# SETTINGS
# ============================================================

# Enough daily bars for the 200-day SMA plus breathing room.

HISTORY_BARS = 260


# Keep snapshots for this many calendar days.

RETENTION_DAYS = 90


# Same batching style already used by EdgeBreak.

BATCH_SIZE = 10


# Twelve Data Grow plan has plenty of capacity, but we still
# keep a small pause between batches.

SLEEP_TIME = 2


# Network timeout.

REQUEST_TIMEOUT = 20


# Retry failed Twelve Data batches.

MAX_RETRIES = 2


# ============================================================
# INDICATOR SETTINGS
# ============================================================

SMA_PERIODS = [20, 50, 200]

EMA_PERIODS = [20, 50]

RSI_PERIOD = 14

MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9

BOLLINGER_PERIOD = 20
BOLLINGER_STD = 2

ATR_PERIOD = 14

AVERAGE_VOLUME_PERIOD = 20


# ============================================================
# HELPERS
# ============================================================

def safe_float(value, default=None):

    try:

        number = float(value)

        if math.isnan(number):
            return default

        return number

    except:

        return default


def clean_number(value, decimals=4):

    value = safe_float(value)

    if value is None:
        return None

    return round(value, decimals)


def load_json_file(filename):

    if not os.path.exists(filename):

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

            data = json.load(f)

        if isinstance(data, list):
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

    if not os.path.exists(OUTPUT_FILE):

        return {}

    try:

        with open(
            OUTPUT_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)

        if isinstance(data, dict):
            return data

    except Exception as e:

        print(
            f"⚠️ Existing indicator history could not be read: {e}"
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
            row.get("symbol", "")
        ).strip().upper()

        if not symbol:
            continue

        if symbol not in symbol_map:

            symbol_map[symbol] = {
                "scanners": [],
                "scanner_data": {}
            }

        if "breakout" not in symbol_map[symbol]["scanners"]:

            symbol_map[symbol]["scanners"].append(
                "breakout"
            )

        symbol_map[symbol]["scanner_data"]["breakout"] = {

            "scan_date":
                row.get("scan_date"),

            "price":
                row.get("price"),

            "resistance":
                row.get("resistance"),

            "distance_above_resistance":
                row.get("distance_above_resistance"),

            "touches":
                row.get("touches"),

            "higher_lows":
                row.get("higher_lows"),

            "volume_ratio":
                row.get("volume_ratio"),

            "grade":
                row.get("grade"),

            "rank":
                row.get("rank")

        }


    # --------------------------------------------------------
    # PRE-BREAKOUT
    # --------------------------------------------------------

    pre_breakout_data = load_json_file(
        PRE_BREAKOUT_FILE
    )

    for row in pre_breakout_data:

        symbol = str(
            row.get("symbol", "")
        ).strip().upper()

        if not symbol:
            continue

        if symbol not in symbol_map:

            symbol_map[symbol] = {
                "scanners": [],
                "scanner_data": {}
            }

        if "pre_breakout" not in symbol_map[symbol]["scanners"]:

            symbol_map[symbol]["scanners"].append(
                "pre_breakout"
            )

        symbol_map[symbol]["scanner_data"]["pre_breakout"] = {

            "scan_date":
                row.get("scan_date"),

            "current_price":
                row.get("current_price"),

            "resistance_price":
                row.get("resistance_price"),

            "resistance_touches":
                row.get("resistance_touches"),

            "higher_lows":
                row.get("higher_lows"),

            "distance_to_resistance":
                row.get("distance_to_resistance"),

            "average_volume_20":
                row.get("average_volume_20"),

            "average_dollar_volume_20":
                row.get("average_dollar_volume_20"),

            "liquidity_group":
                row.get("liquidity_group")

        }


    # --------------------------------------------------------
    # LAUNCH PAD
    # --------------------------------------------------------

    launchpad_data = load_json_file(
        LAUNCHPAD_FILE
    )

    for row in launchpad_data:

        symbol = str(
            row.get("symbol", "")
        ).strip().upper()

        if not symbol:
            continue

        if symbol not in symbol_map:

            symbol_map[symbol] = {
                "scanners": [],
                "scanner_data": {}
            }

        if "launchpad" not in symbol_map[symbol]["scanners"]:

            symbol_map[symbol]["scanners"].append(
                "launchpad"
            )

        symbol_map[symbol]["scanner_data"]["launchpad"] = {

            "last_updated":
                row.get("last_updated"),

            "current_price":
                row.get("current_price"),

            "launchpad_days":
                row.get("launchpad_days"),

            "support_zone_low":
                row.get("support_zone_low"),

            "support_zone_high":
                row.get("support_zone_high"),

            "resistance_zone_low":
                row.get("resistance_zone_low"),

            "resistance_zone_high":
                row.get("resistance_zone_high"),

            "support_tests":
                row.get("support_tests"),

            "resistance_tests":
                row.get("resistance_tests"),

            "range_percent":
                row.get("range_percent")

        }


    # --------------------------------------------------------
    # SORT SCANNER NAMES
    # --------------------------------------------------------

    scanner_order = {
        "breakout": 1,
        "pre_breakout": 2,
        "launchpad": 3
    }

    for symbol in symbol_map:

        symbol_map[symbol]["scanners"].sort(
            key=lambda x: scanner_order.get(
                x,
                99
            )
        )


    return symbol_map


# ============================================================
# TWELVE DATA FETCH
# ============================================================

def fetch_batch(symbols):

    params = {

        "symbol":
            ",".join(symbols),

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

                timeout=REQUEST_TIMEOUT

            )

            response.raise_for_status()

            data = response.json()

            return data

        except Exception as e:

            print(
                f"⚠️ Twelve Data attempt "
                f"{attempt}/{MAX_RETRIES} failed: {e}"
            )

            if attempt < MAX_RETRIES:

                time.sleep(3)

    return {}


# ============================================================
# NORMALISE TWELVE DATA RESPONSE
# ============================================================

def extract_symbol_values(
    batch_data,
    symbol,
    batch_size
):

    if not isinstance(batch_data, dict):
        return None


    # --------------------------------------------------------
    # MULTI-SYMBOL RESPONSE
    # --------------------------------------------------------

    if symbol in batch_data:

        content = batch_data.get(symbol)

        if isinstance(content, dict):

            values = content.get("values")

            if isinstance(values, list):
                return values


    # --------------------------------------------------------
    # SINGLE-SYMBOL RESPONSE
    # --------------------------------------------------------

    if batch_size == 1:

        values = batch_data.get("values")

        if isinstance(values, list):
            return values


    return None


# ============================================================
# BUILD DATAFRAME
# ============================================================

def build_dataframe(values):

    if not values:
        return None

    rows = []

    for bar in values:

        try:

            row = {

                "datetime":
                    bar.get("datetime"),

                "open":
                    safe_float(
                        bar.get("open")
                    ),

                "high":
                    safe_float(
                        bar.get("high")
                    ),

                "low":
                    safe_float(
                        bar.get("low")
                    ),

                "close":
                    safe_float(
                        bar.get("close")
                    ),

                "volume":
                    safe_float(
                        bar.get("volume")
                    )

            }

            if (

                row["datetime"] is None

                or row["high"] is None

                or row["low"] is None

                or row["close"] is None

            ):

                continue

            rows.append(row)

        except:

            continue


    if not rows:
        return None


    df = pd.DataFrame(rows)


    # Twelve Data normally returns newest first.
    # Sort explicitly so calculations always run oldest → newest.

    df["datetime"] = pd.to_datetime(
        df["datetime"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["datetime"]
    )

    df = df.sort_values(
        "datetime"
    )

    df = df.drop_duplicates(
        subset=["datetime"],
        keep="last"
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

def calculate_sma(series, period):

    if len(series) < period:
        return None

    value = (
        series
        .rolling(period)
        .mean()
        .iloc[-1]
    )

    return clean_number(
        value
    )


# ============================================================
# EMA
# ============================================================

def calculate_ema(series, period):

    if len(series) < period:
        return None

    value = (
        series
        .ewm(
            span=period,
            adjust=False
        )
        .mean()
        .iloc[-1]
    )

    return clean_number(
        value
    )


# ============================================================
# RSI
# ============================================================

def calculate_rsi(
    series,
    period=14
):

    if len(series) < period + 1:
        return None

    delta = series.diff()

    gains = delta.clip(
        lower=0
    )

    losses = (
        -delta.clip(
            upper=0
        )
    )


    # Wilder-style smoothing

    average_gain = gains.ewm(

        alpha=1 / period,

        adjust=False,

        min_periods=period

    ).mean()


    average_loss = losses.ewm(

        alpha=1 / period,

        adjust=False,

        min_periods=period

    ).mean()


    avg_gain = average_gain.iloc[-1]

    avg_loss = average_loss.iloc[-1]


    if pd.isna(avg_gain):
        return None

    if pd.isna(avg_loss):
        return None


    if avg_loss == 0:

        if avg_gain == 0:
            return 50.0

        return 100.0


    rs = avg_gain / avg_loss

    rsi = 100 - (
        100 / (1 + rs)
    )

    return clean_number(
        rsi,
        2
    )


# ============================================================
# MACD
# ============================================================

def calculate_macd(series):

    minimum_bars = (
        MACD_SLOW
        + MACD_SIGNAL
    )

    if len(series) < minimum_bars:
        return {
            "macd": None,
            "signal": None,
            "histogram": None
        }


    ema_fast = series.ewm(

        span=MACD_FAST,

        adjust=False

    ).mean()


    ema_slow = series.ewm(

        span=MACD_SLOW,

        adjust=False

    ).mean()


    macd_line = (
        ema_fast
        - ema_slow
    )


    signal_line = macd_line.ewm(

        span=MACD_SIGNAL,

        adjust=False

    ).mean()


    histogram = (
        macd_line
        - signal_line
    )


    return {

        "macd":
            clean_number(
                macd_line.iloc[-1]
            ),

        "signal":
            clean_number(
                signal_line.iloc[-1]
            ),

        "histogram":
            clean_number(
                histogram.iloc[-1]
            )

    }


# ============================================================
# BOLLINGER BANDS
# ============================================================

def calculate_bollinger(series):

    if len(series) < BOLLINGER_PERIOD:

        return {
            "upper": None,
            "middle": None,
            "lower": None
        }


    rolling = series.rolling(
        BOLLINGER_PERIOD
    )


    middle = (
        rolling
        .mean()
        .iloc[-1]
    )


    std = (
        rolling
        .std(ddof=0)
        .iloc[-1]
    )


    upper = (
        middle
        + BOLLINGER_STD * std
    )


    lower = (
        middle
        - BOLLINGER_STD * std
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

def calculate_atr(df):

    if len(df) < ATR_PERIOD + 1:
        return None


    previous_close = (
        df["close"]
        .shift(1)
    )


    range_one = (
        df["high"]
        - df["low"]
    )


    range_two = (
        df["high"]
        - previous_close
    ).abs()


    range_three = (
        df["low"]
        - previous_close
    ).abs()


    true_range = pd.concat(

        [
            range_one,
            range_two,
            range_three
        ],

        axis=1

    ).max(axis=1)


    # Wilder ATR

    atr = true_range.ewm(

        alpha=1 / ATR_PERIOD,

        adjust=False,

        min_periods=ATR_PERIOD

    ).mean()


    return clean_number(
        atr.iloc[-1]
    )


# ============================================================
# VOLUME
# ============================================================

def calculate_volume_metrics(df):

    if "volume" not in df.columns:

        return {
            "average_volume_20": None,
            "relative_volume": None
        }


    valid_volume = (
        df["volume"]
        .dropna()
    )


    if len(valid_volume) < AVERAGE_VOLUME_PERIOD:

        return {
            "average_volume_20": None,
            "relative_volume": None
        }


    last_20 = valid_volume.iloc[
        -AVERAGE_VOLUME_PERIOD:
    ]


    average_volume = (
        last_20.mean()
    )


    current_volume = (
        valid_volume.iloc[-1]
    )


    relative_volume = None


    # Relative volume is current day's volume
    # divided by the 20-day average volume.

    if average_volume > 0:

        relative_volume = (
            current_volume
            / average_volume
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
# ON-BALANCE VOLUME (OBV)
# ============================================================

def calculate_obv(df):

    if "volume" not in df.columns:

        return {
            "obv": None,
            "obv_change_5d_percent": None,
            "obv_change_20d_percent": None,
            "obv_trend": None
        }


    close = df["close"]

    volume = df["volume"].fillna(0)


    if len(df) < 2:

        return {
            "obv": None,
            "obv_change_5d_percent": None,
            "obv_change_20d_percent": None,
            "obv_trend": None
        }


    # --------------------------------------------------------
    # BUILD OBV SERIES
    # --------------------------------------------------------

    obv_values = [0.0]


    for i in range(
        1,
        len(df)
    ):

        previous_obv = (
            obv_values[-1]
        )


        if (
            close.iloc[i]
            > close.iloc[i - 1]
        ):

            current_obv = (
                previous_obv
                + volume.iloc[i]
            )


        elif (
            close.iloc[i]
            < close.iloc[i - 1]
        ):

            current_obv = (
                previous_obv
                - volume.iloc[i]
            )


        else:

            current_obv = (
                previous_obv
            )


        obv_values.append(
            current_obv
        )


    obv = pd.Series(
        obv_values,
        index=df.index,
        dtype="float64"
    )


    latest_obv = (
        obv.iloc[-1]
    )


    # --------------------------------------------------------
    # 5-DAY OBV CHANGE
    # --------------------------------------------------------

    obv_change_5d_percent = None


    if len(obv) >= 6:

        old_obv = (
            obv.iloc[-6]
        )


        if old_obv != 0:

            obv_change_5d_percent = (

                (
                    latest_obv
                    - old_obv
                )

                / abs(
                    old_obv
                )

            ) * 100


    # --------------------------------------------------------
    # 20-DAY OBV CHANGE
    # --------------------------------------------------------

    obv_change_20d_percent = None


    if len(obv) >= 21:

        old_obv = (
            obv.iloc[-21]
        )


        if old_obv != 0:

            obv_change_20d_percent = (

                (
                    latest_obv
                    - old_obv
                )

                / abs(
                    old_obv
                )

            ) * 100


    # --------------------------------------------------------
    # OBV TREND
    # --------------------------------------------------------

    obv_trend = "neutral"


    if len(obv) >= 21:

        recent_obv = (
            obv.iloc[-20:]
            .reset_index(
                drop=True
            )
        )


        x = pd.Series(
            range(
                len(recent_obv)
            ),
            dtype="float64"
        )


        # Linear slope of recent OBV.

        denominator = (
            x.var()
        )


        if denominator > 0:

            slope = (
                x.cov(
                    recent_obv
                )
                / denominator
            )


            recent_average_volume = (
                volume
                .iloc[-20:]
                .mean()
            )


            # Normalize the slope against typical volume.
            # This prevents tiny OBV movements from being
            # labelled as meaningful trends.

            if recent_average_volume > 0:

                normalized_slope = (
                    slope
                    / recent_average_volume
                )


                if normalized_slope > 0.05:

                    obv_trend = "rising"


                elif normalized_slope < -0.05:

                    obv_trend = "falling"


    return {

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
            obv_trend

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
            - level
        )
        / level
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


    close = df["close"]

    current_price = clean_number(
        close.iloc[-1],
        4
    )


    candle_date = (
        df["datetime"]
        .iloc[-1]
        .strftime("%Y-%m-%d")
    )


    # --------------------------------------------------------
    # MOVING AVERAGES
    # --------------------------------------------------------

    sma20 = calculate_sma(
        close,
        20
    )

    sma50 = calculate_sma(
        close,
        50
    )

    sma200 = calculate_sma(
        close,
        200
    )


    ema20 = calculate_ema(
        close,
        20
    )

    ema50 = calculate_ema(
        close,
        50
    )


    # --------------------------------------------------------
    # RSI
    # --------------------------------------------------------

    rsi14 = calculate_rsi(
        close,
        RSI_PERIOD
    )


    # --------------------------------------------------------
    # MACD
    # --------------------------------------------------------

    macd = calculate_macd(
        close
    )


    # --------------------------------------------------------
    # BOLLINGER
    # --------------------------------------------------------

    bollinger = calculate_bollinger(
        close
    )


    # --------------------------------------------------------
    # ATR
    # --------------------------------------------------------

    atr14 = calculate_atr(
        df
    )


    # --------------------------------------------------------
    # VOLUME
    # --------------------------------------------------------

    volume = calculate_volume_metrics(
        df
    )

    # --------------------------------------------------------
    # ON-BALANCE VOLUME
    # --------------------------------------------------------

    obv = calculate_obv(
        df
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
            macd["macd"],

        "macd_signal":
            macd["signal"],

        "macd_histogram":
            macd["histogram"],

        # ========================
        # BOLLINGER BANDS
        # ========================

        "bollinger_upper":
            bollinger["upper"],

        "bollinger_middle":
            bollinger["middle"],

        "bollinger_lower":
            bollinger["lower"],

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
        # ON-BALANCE VOLUME
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
        # DATA QUALITY
        # ========================

        "bars_available":
            len(df)

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

        history_database[symbol] = {

            "first_seen":
                snapshot["date"],

            "last_seen":
                snapshot["date"],

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


    record = history_database[
        symbol
    ]


    # --------------------------------------------------------
    # FIRST / LAST SEEN
    # --------------------------------------------------------

    existing_first_seen = (
        record.get(
            "first_seen"
        )
    )


    if not existing_first_seen:

        record["first_seen"] = (
            snapshot["date"]
        )


    record["last_seen"] = (
        snapshot["date"]
    )


    # --------------------------------------------------------
    # CURRENT SCANNER MEMBERSHIP
    # --------------------------------------------------------

    record["scanners"] = (
        scanner_info.get(
            "scanners",
            []
        )
    )


    record["scanner_data"] = (
        scanner_info.get(
            "scanner_data",
            {}
        )
    )


    # --------------------------------------------------------
    # HISTORY
    # --------------------------------------------------------

    snapshots = record.get(
        "history",
        []
    )


    if not isinstance(
        snapshots,
        list
    ):

        snapshots = []


    # Same-day reruns should REPLACE the existing
    # snapshot rather than creating duplicates.

    snapshots = [

        item

        for item in snapshots

        if item.get("date")
        != snapshot["date"]

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


    record["history"] = snapshots


# ============================================================
# PURGE OLD SNAPSHOTS
# ============================================================

def purge_old_history(
    history_database
):

    today = datetime.now().date()

    cutoff = (
        today
        - timedelta(
            days=RETENTION_DAYS
        )
    )


    for symbol in list(
        history_database.keys()
    ):

        record = history_database[
            symbol
        ]


        snapshots = record.get(
            "history",
            []
        )


        cleaned = []


        for snapshot in snapshots:

            date_string = snapshot.get(
                "date"
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


            if snapshot_date >= cutoff:

                cleaned.append(
                    snapshot
                )


        record["history"] = cleaned


        # We deliberately DO NOT delete the symbol record
        # when its detailed 90-day history expires.
        #
        # This leaves behind first_seen / last_seen metadata
        # so EdgeBreak can still remember that it previously
        # found the stock.


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


    temp_path = None


    try:

        with tempfile.NamedTemporaryFile(

            mode="w",

            encoding="utf-8",

            dir=directory,

            delete=False,

            suffix=".tmp"

        ) as temp_file:

            json.dump(

                history_database,

                temp_file,

                indent=2,

                ensure_ascii=False

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

    start_time = time.time()


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

        for info in symbol_map.values()

        if "breakout"
        in info["scanners"]

    )


    pre_breakout_count = sum(

        1

        for info in symbol_map.values()

        if "pre_breakout"
        in info["scanners"]

    )


    launchpad_count = sum(

        1

        for info in symbol_map.values()

        if "launchpad"
        in info["scanners"]

    )


    print(
        f"Breakout stocks     : {breakout_count}"
    )

    print(
        f"Pre-Breakout stocks : {pre_breakout_count}"
    )

    print(
        f"Launch Pad stocks   : {launchpad_count}"
    )

    print(
        f"Unique stocks       : {len(symbols)}"
    )

    print()


    # --------------------------------------------------------
    # LOAD EXISTING HISTORY
    # --------------------------------------------------------

    history_database = (
        load_existing_history()
    )


    print(
        f"Existing history    : "
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

        len(symbols)
        + BATCH_SIZE
        - 1

    ) // BATCH_SIZE


    for i in range(
        0,
        len(symbols),
        BATCH_SIZE
    ):

        batch = symbols[
            i:i + BATCH_SIZE
        ]


        batch_number = (
            i // BATCH_SIZE
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

                        len(batch)

                    )
                )


                if not values:

                    print(
                        f"   ⚠️ {symbol}: "
                        f"no candle data"
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
                        f"invalid candle data"
                    )

                    failed += 1

                    continue


                # We can still save stocks with less than
                # 200 bars. Their unavailable long-period
                # indicators simply remain None.

                if len(df) < 200:

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

                    f" | SMA200 "
                    f"{snapshot['sma200']}"

                )


            except Exception as e:

                failed += 1

                print(
                    f"   ❌ {symbol}: {e}"
                )


        # ----------------------------------------------------
        # SAVE AFTER EVERY BATCH
        # ----------------------------------------------------
        #
        # If Windows, internet, Twelve Data or anything else
        # dies halfway through, completed batches survive.

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
            < len(symbols)
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
        - start_time,
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
        f"Scanner stocks processed : {processed}"
    )

    print(
        f"Snapshots saved          : {saved}"
    )

    print(
        f"Failed                   : {failed}"
    )

    print(
        f"Under 200 bars           : "
        f"{insufficient_history}"
    )

    print(
        f"History symbols stored   : "
        f"{len(history_database)}"
    )

    print(
        f"Retention                : "
        f"{RETENTION_DAYS} days"
    )

    print(
        f"Runtime                  : "
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