# =========================
# 🧠 HELPERS
# =========================

def calculate_avg_volume(data, lookback=20):
    vols = [float(d["volume"]) for d in data[:lookback]]
    return sum(vols) / len(vols)


# =========================
# 🏆 GRADE SYSTEM
# =========================

def get_grade(score):
    if score >= 50:
        return "A+"
    elif score >= 45:
        return "A"
    elif score >= 40:
        return "B+"
    elif score >= 35:
        return "B"
    else:
        return "C"


# =========================
# 🧠 AUTO INSIGHTS
# =========================

def generate_insight(touches, rl, comp, volume_ratio, breakout_strength):
    
    insights = []

    if touches >= 3:
        insights.append("Strong resistance base")
    else:
        insights.append("Valid resistance")

    if rl >= 3:
        insights.append("clear higher lows")
    elif rl >= 2:
        insights.append("rising support")

    if comp >= 3:
        insights.append("tight compression")
    elif comp >= 2:
        insights.append("building pressure")

    if volume_ratio > 2:
        insights.append("heavy volume expansion")
    elif volume_ratio > 1.2:
        insights.append("volume confirmation")

    if breakout_strength > 0.04:
        insights.append("strong momentum breakout")
    else:
        insights.append("controlled breakout")

    return ", ".join(insights)


# =========================
# 🔥 SETUP TYPE
# =========================

def classify_setup(breakout_strength):
    if breakout_strength > 0.04:
        return "Momentum Breakout"
    else:
        return "Compression Breakout"


# =========================
# 🔥 RESISTANCE
# =========================

def find_resistance(data, lookback=30):
    highs = [float(d["high"]) for d in data[:lookback]]
    return max(highs)


# =========================
# 🔥 CLUSTER DETECTION
# =========================

def count_touch_clusters(data, resistance, tolerance=0.015, lookback=30):
    cluster_count = 0
    in_cluster = False

    for d in data[:lookback]:
        high = float(d["high"])

        if abs(high - resistance) / resistance < tolerance:
            if not in_cluster:
                cluster_count += 1
                in_cluster = True
        else:
            in_cluster = False

    return cluster_count


# =========================
# 🔥 STRUCTURE
# =========================

def rising_lows_count(data, lookback=10):
    lows = [float(d["low"]) for d in data[:lookback]]
    return sum(1 for i in range(len(lows) - 1) if lows[i] > lows[i + 1])


def compression_score(data, lookback=10):
    ranges = [float(d["high"]) - float(d["low"]) for d in data[:lookback]]
    return sum(1 for i in range(len(ranges) - 1) if ranges[i] < ranges[i + 1])


# =========================
# 💥 CORE: HIGH-QUALITY BREAKOUT
# =========================

def detect_breakout_today(symbol, window, debug=False):

    for d in window:
        if "volume" not in d or d["volume"] is None:
            return None

    today = window[0]
    history = window[1:]

    close_price = float(today["close"])
    open_price = float(today["open"])
    high_price = float(today["high"])
    low_price = float(today["low"])

    if "volume" not in today or today["volume"] is None:
        return None

    volume = float(today["volume"])

    if len(history) < 30:
        return None

    # =========================
    # 🚫 BASIC FILTERS
    # =========================

    if close_price < 1:
        return None

    avg_volume = calculate_avg_volume(window)

    if avg_volume < 80000:
        return None

    # =========================
    # 🔥 VOLATILITY FILTER
    # =========================

    recent_high = max(float(d["high"]) for d in history[:20])
    recent_low = min(float(d["low"]) for d in history[:20])

    if (recent_high - recent_low) / recent_low < 0.05:
        return None

    # =========================
    # 🔥 RESISTANCE
    # =========================

    resistance = find_resistance(history)

    clusters = count_touch_clusters(history, resistance)

    if clusters < 2:
        return None

    # =========================
    # 🧠 STRUCTURE
    # =========================

    rl = rising_lows_count(window)
    comp = compression_score(window)

    if rl < 2 or comp < 2:
        return None

    # =========================
    # 📊 VOLUME
    # =========================

    volume_ratio = volume / avg_volume

    # =========================
    # 💎 BREAKOUT QUALITY
    # =========================

    breakout_strength = (close_price - resistance) / resistance

    if breakout_strength > 0.08:
        return None

    candle_range = high_price - low_price
    avg_range = sum(
        float(d["high"]) - float(d["low"])
        for d in history[:5]
    ) / 5

    strong_candle = candle_range > avg_range

    # =========================
    # 🔥 BREAKOUT
    # =========================

    breakout = (
        close_price > resistance * 1.002 and
        breakout_strength > 0.015 and
        close_price > open_price and
        volume_ratio > 1.5 and
        strong_candle
    )

    if not breakout:
        return None

    # =========================
    # 🔥 NEW: PRIOR MOVE FILTER
    # =========================

    lookback_move = 12
    recent_prices = [float(d["close"]) for d in history[:lookback_move]]

    recent_low = min(recent_prices)
    move_percent = (close_price - recent_low) / recent_low

    if move_percent > 0.20:
        return None

    # =========================
    # 🏆 SCORE
    # =========================

    score = round(
        clusters * 3 +
        rl * 2 +
        comp * 2 +
        min(volume_ratio * 5, 15) +
        breakout_strength * 100,
        2
    )

    grade = get_grade(score)

    insight = generate_insight(
        clusters,
        rl,
        comp,
        volume_ratio,
        breakout_strength
    )

    setup_type = classify_setup(breakout_strength)

    return {
        "symbol": symbol,
        "date": today["datetime"],
        "price": close_price,
        "resistance": resistance,
        "score": score,
        "grade": grade,
        "setup_type": setup_type,
        "insight": insight,
        "volume_ratio": round(volume_ratio, 2),
        "breakout_strength": round(breakout_strength * 100, 2),
        "day1_return": None,
        "day2_return": None,
        "result": None
    }