import requests
import pandas as pd
import time

# =========================
# 🔑 CONFIG
# =========================
API_KEY = "c0c94a09b4e242e0805cf8261b5bda67"

SMA_LONG = 70
STOP_LOSS = 0.05   # 5%
STOP_DAYS = 4

# =========================
# SMALL CAPS (~250)
# =========================
SMALL_CAPS = [
"AAOI","ABCL","ACMR","ADPT","AEHR","AGFY","AI","ALLO","AMSC","ANAB",
"APLT","ARLO","ASPN","ATEN","ATNX","AVDL","AVIR","AXTI","BBIO","BCRX",
"BEAM","BFLY","BLFS","CABA","CDNA","CGEM","CHRS","CLPT","CMPS","CNTA",
"CODX","CRBU","CRDF","CRVS","CSPR","CTMX","CUE","CYRX","DMTK","DNUT",
"DRIO","EBS","EH","EHTH","ELVN","ENSC","ESTA","EVH","FGEN","FOLD",
"FRPT","FVRR","GHRS","GLSI","GRWG","HNST","HRTX","ICPT","IDYA","IMVT",
"INFI","IONS","IPHA","IRWD","KURA","LCTX","LGND","LIVN","LMAT","LOGC",
"MDGL","MDXG","MGNX","MNKD","MNTK","MRVI","MTEM","NERV","NKTR","NTLA",
"NVAX","OCUL","OM","OMER","ONCT","OPK","ORGO","PRAX","PRTA","PSTX",
"QDEL","RAPT","RCUS","RETA","RLAY","RPTX","SANA","SGMO","SITM","SLDB",
"SRRK","STOK","TARS","TRML","TXG","VCYT","VERU","XERS","XOMA",

# expand to ~250
"ARQT","AVRO","BDSX","BHIL","BNGO","CDTX","CGC","CRMD","DAWN","ELEV",
"ENVB","EOLS","EPIX","ESPR","ETNB","EVLO","FATE","FLXN","GALT","GLYC",
"HGEN","ITOS","KALV","KOD","KRYS","LPCN","MCRB","MDWD","MEIP","MNOV",
"MRSN","MRTX","NK","NRIX","OCGN","ONCS","OPRX","PBYI","PLRX","PRVB",
"RCKT","REPL","RGNX","SBBP","SLGL","SNSE","SRNE","STRO","SUPN","SWTX",
"SYRS","TBIO","TCON","TCRR","THRD","TRVI","TXMD","VKTX","VYGR","XBIT",
"XNCR","ZLAB","ZYME","ZVRA","ALDX","ATRA","CERS","CRNX","EPZM","FREQ",
"GOSS","IMAB","IMCR","IMTX","IOVA","IRIX","KZR","LQDA","MGTA","NKTX",
"NRBO","NVCR","PRQR","RIGL","RVNC","SNDL","SYNH","TGTX","TYME","VCEL",
"VRCA","ZNTL"
]

TICKERS = SMALL_CAPS

from breakout_logic import detect_breakout_today

# =========================
# FETCH DATA
# =========================
def get_data(symbol):
    url = f"https://api.twelvedata.com/time_series?symbol={symbol}&interval=1day&outputsize=500&apikey={API_KEY}"
    try:
        r = requests.get(url, timeout=20).json()
        if "values" not in r:
            return None

        df = pd.DataFrame(r["values"])
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.sort_values("datetime", ascending=True)

        return df.to_dict("records")
    except:
        return None

# =========================
# BACKTEST ENGINE
# =========================
def run_backtest():

    results = []

    for symbol in TICKERS:
        print(f"\n🔍 Scanning {symbol}")

        data = get_data(symbol)
        if not data:
            continue

        seen = set()

        for i in range(100, len(data) - 2):

            window = list(reversed(data[i-100:i]))
            setup = detect_breakout_today(symbol, window)

            if not setup:
                continue

            history = window[1:]

            # =========================
            # HIGHER LOWS
            # =========================
            recent_lows = [float(d["low"]) for d in history[:5]]
            if not (recent_lows[0] > recent_lows[1] > recent_lows[2]):
                continue

            resistance = max(float(d["high"]) for d in history[:80])

            touches_long = sum(
                1 for d in history[:80]
                if abs(float(d["high"]) - resistance) / resistance < 0.015
            )

            if touches_long < 3:
                continue

            # =========================
            # GAP ORIGIN FILTER
            # =========================
            gap_index = None

            for k in range(i-10, i):
                if k <= 0:
                    continue

                prev_close_k = float(data[k-1]["close"])
                open_k = float(data[k]["open"])

                gap_k = (open_k - prev_close_k) / prev_close_k

                if gap_k > 0.08:
                    gap_index = k
                    break

            if gap_index is not None:
                gap_origin = float(data[gap_index-1]["close"])
                current_price = float(data[i]["close"])

                if (current_price - gap_origin) / gap_origin > 0.10:
                    continue

            key = f"{symbol}_{window[0]['datetime']}"
            if key in seen:
                continue
            seen.add(key)

            if setup["grade"] not in ["A+", "A", "B+", "B"]:
                continue

            entry = float(data[i]["close"])
            entry_date = data[i]["datetime"]

            exit_price = entry
            exit_date = entry_date

            status = "OPEN"
            days_held = 0

            # =========================
            # EXIT LOOP
            # =========================
            for j in range(i+1, len(data)):

                candle = data[j]
                price = float(candle["close"])
                prev_price = float(data[j-1]["close"])
                days_held += 1

                # STOP LOSS
                if days_held <= STOP_DAYS:
                    if price <= entry * (1 - STOP_LOSS):
                        status = "STOP"
                        exit_price = price
                        exit_date = candle["datetime"]
                        break

                # SMA EXIT
                if j >= SMA_LONG:
                    sma_long = sum(float(x["close"]) for x in data[j-SMA_LONG:j]) / SMA_LONG
                    prev_sma_long = sum(float(x["close"]) for x in data[j-SMA_LONG-1:j-1]) / SMA_LONG

                    if price < sma_long and prev_price >= prev_sma_long:
                        status = "EXIT"
                        exit_price = price
                        exit_date = candle["datetime"]
                        break

            if status == "OPEN":
                exit_price = float(data[-1]["close"])
                exit_date = data[-1]["datetime"]

            percent_move = ((exit_price - entry) / entry) * 100

            setup.update({
                "entry_price": entry,
                "exit_price": exit_price,
                "percent_move": round(percent_move, 2),
                "result": status,
                "symbol": symbol,
                "entry_date": entry_date,
                "exit_date": exit_date
            })

            results.append(setup)

        time.sleep(1)

    if not results:
        print("\n⚠️ No trades found")
        return

    df = pd.DataFrame(results)

    print("\n📊 SUMMARY")
    print(f"Trades: {len(df)}")
    print(f"Win Rate: {round((df['percent_move'] > 0).mean()*100,2)}%")
    print(f"Avg Return: {round(df['percent_move'].mean(),2)}%")
    print(f"Best: {round(df['percent_move'].max(),2)}%")
    print(f"Worst: {round(df['percent_move'].min(),2)}%")


if __name__ == "__main__":
    run_backtest()