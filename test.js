<script>
function loadChart(symbol) {

  const cleanSymbol = symbol.toUpperCase().trim();
  const finalSymbol = "NASDAQ:" + cleanSymbol;

  document.getElementById("tv_chart").innerHTML = "";

  // 👇 SHOW SYMBOL TO USER
  document.getElementById("chartTitle").innerText = finalSymbol;

  new TradingView.widget({
    width: "100%",
    height: 420,
    symbol: finalSymbol,
    interval: "D",
    timezone: "America/New_York",
    theme: "dark",
    style: "1",
    locale: "en",
    hide_top_toolbar: true,
    hide_legend: false,   // 👈 IMPORTANT (shows ticker inside chart too)
    container_id: "tv_chart"
  });

}

document.addEventListener("DOMContentLoaded", function () {

  console.log("✅ PAGE RUNNING");


  // =========================
  // 🎬 NUMBER ANIMATION
  // =========================
  function animateValue(id, end) {
    const el = document.getElementById(id);
    if (!el || isNaN(end)) return;

    let start = 0;
    const duration = 800;
    let startTime = null;

    function animate(time) {
      if (!startTime) startTime = time;

      const progress = Math.min((time - startTime) / duration, 1);
      const value = start + (end - start) * progress;

      el.innerText = value.toFixed(2) + "%";

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        el.innerText = end.toFixed(2) + "%";
      }
    }

    requestAnimationFrame(animate);
  }

  // =========================
  // 🔔 TODAY ACTIVITY
  // =========================
  fetch("/activity.json?v=" + Date.now())
  .then(res => res.json())
  .then(data => {

    if (!Array.isArray(data)) data = [];

    let open = 0;
    let closed = 0;

    const html = data.slice(-5).reverse().map(a => {

      if (a.type === "OPEN") {
        open++;
        return `<div class="green">🟢 ${a.symbol}</div>`;
      }

      if (a.type === "CLOSED") {
        closed++;
        const result = a.result ?? a.percent_move ?? 0;
        const color = result >= 0 ? "#22c55e" : "#ef4444";

        return `
          <div>
            🔴 ${a.symbol}
            <span style="color:${color}; font-weight:bold;">
              ${result.toFixed(2)}%
            </span>
          </div>
        `;
      }

      return "";

    }).join("");

    const todayOpenEl = document.getElementById("todayOpen");
    const todayClosedEl = document.getElementById("todayClosed");

    if (todayOpenEl) todayOpenEl.innerText = open;
    if (todayClosedEl) todayClosedEl.innerText = closed;

    document.getElementById("todayActivityFeed").innerHTML = html || `
      <div style="color:#94a3b8; font-size:13px;">
        No trades triggered yet today
      </div>
    `;

  })
  .catch(() => {
    console.log("Failed to load activity");
  });

  // =========================
  // 📊 LIVE TRADES + BREAKDOWN
  // =========================
  fetch("/active_positions.json?v=" + Date.now())
    .then(res => res.json())
    .then(data => {

      if (!Array.isArray(data)) data = [];

      const noTrades = document.getElementById("noTradesMessage");

      // hide if trades exist
      if (data.length > 0) {
        noTrades.style.display = "none";
      } else {
        noTrades.style.display = "block";
      }
      const small = [];
      const mid = [];
      const large = [];

      window.tradeMap = {};

      data.forEach(t => {

          window.tradeMap[t.symbol] = t;

          const g = (t.price_group || t.group || "").toUpperCase();

          if (g === "SMALL") small.push(t);
          else if (g === "MID") mid.push(t);
          else if (g === "LARGE") large.push(t);

      });

      document.getElementById("smallCount").innerText = small.length;
      document.getElementById("midCount").innerText = mid.length;
      document.getElementById("largeCount").innerText = large.length;

      function renderTrades(trades, title, id) {
        const el = document.getElementById(id);
        if (!el) return;

        if (trades.length === 0) {
          el.innerHTML = `<h3>${title}</h3><p style="color:#64748b;">No active trades</p>`;
          return;
        }

        el.innerHTML = `<h3>${title}</h3>` + trades.map(t => {
        const change = t.change_percent ?? 0;
        const entry = parseFloat(t.entry_price || 0);
        const current = parseFloat(t.current_price || 0);

        let distance = 0;
        if (entry > 0) {
          distance = ((current - entry) / entry) * 100;
        }

        let entryState = "";
        let entryColor = "";
        let reEntryText = "";

        // 🔥 ENTRY STATE LOGIC (UPDATED)
        if (distance < 0) {
          entryState = "🔻 Failed Breakout";
          entryColor = "#ef4444";
          reEntryText = "Below entry — caution";
        }
        else if (distance < 3) {
          entryState = "🟢 Fresh";
          entryColor = "#22c55e";
          reEntryText = "Enter on breakout";
        }
        else if (distance < 10) {
          entryState = "🟡 Pullback";
          entryColor = "#f59e0b";
          reEntryText = `Watch $${entry.toFixed(2)}`;
        }
        else {
          entryState = "🔴 Extended";
          entryColor = "#ef4444";
          reEntryText = "Wait for pullback";
        }

        let moveStage = "";

        if (distance < 5) {
          moveStage = "Early";
        }
        else if (distance < 20) {
          moveStage = "Developing";
        }
        else {
          moveStage = "Extended Move";
        }
        const color = change >= 0 ? "#22c55e" : "#ef4444";

        return `
          <div class="box" onclick="selectTrade('${t.symbol}')">
            <div style="display:flex; justify-content:space-between;">
      
              <strong 
                style="cursor:pointer;"
                onclick="window.location.href='chart.html?symbol=${t.symbol}'"
              >
                ${t.symbol}
              </strong>

              <span style="color:${color}; font-weight:bold;">
                ${change.toFixed(2)}%
              </span>
            </div>

            <div style="font-size:13px; color:#94a3b8;">
              Entry: $${t.entry_price ?? "-"} | Now: $${t.current_price ?? "-"}
            </div>

            <div style="margin-top:6px; font-size:13px;">

              <div style="
                display:inline-block;
                background:${entryColor}20;
                color:${entryColor};
                padding:4px 8px;
                border-radius:6px;
                font-weight:600;
                font-size:12px;
                margin-bottom:4px;
              ">
                ${entryState}
              </div>

              <div style="color:#94a3b8;">
                ${distance >= 0 ? "+" : ""}${distance.toFixed(2)}% from entry
              </div>

              <div style="color:#64748b; font-size:12px;">
                Re-entry: ${reEntryText}
              </div>

              <div style="
                margin-top:4px;
                display:inline-block;
                background:#1e293b;
                color:#cbd5f5;
                padding:3px 8px;
                border-radius:6px;
                font-size:11px;
              ">
                Stage: ${moveStage}
              </div>
            </div>

            <div style="font-size:12px; color:#64748b;">
              ${t.days_held ?? 0} days
            </div>
          </div>
        `;
      }).join("");
      }

      renderTrades(small, "🟢 Small Caps", "smallSection");
      renderTrades(mid, "🟡 Mid Caps", "midSection");
      renderTrades(large, "🔵 Large Caps", "largeSection");

      /* =========================
      BREAKOUT HEALTH
      ========================= */
      function getHealthScore(trade){

          let score = 50;

          const change =
              parseFloat(trade.change_percent || 0);

          const days =
              parseInt(trade.days_held || 0);

          if(change > 0) score += 10;
          if(change > 3) score += 10;
          if(change > 10) score += 10;

          if(days > 5) score += 10;
          if(days > 20) score += 10;

          return Math.min(score,100);

      }     

      
      // =========================
      // 📊 WEEKLY PERFORMANCE (PRO VERSION)
      // =========================

      const weeklyContainer = document.getElementById("weeklyTrades");
      const weeklyTotalEl = document.getElementById("weeklyTotal");

      if (weeklyContainer && weeklyTotalEl && data.length > 0) {

        const best = Math.max(...data.map(t => t.weekly_change_percent || 0));
        const worst = Math.min(...data.map(t => t.weekly_change_percent || 0));

        let total = 0;
        let count = 0;

        weeklyContainer.innerHTML = data.map(t => {

          const change = parseFloat(t.weekly_change_percent ?? 0);
          total += change;
          count++;

          const color = change >= 0 ? "#22c55e" : "#ef4444";

          // 🔥 badges
          let badge = "";
          if (change === best) badge = "🔥";
          if (change === worst) badge = "🔻";

          return `
            <div style="margin-bottom:18px;">

              <!-- TOP ROW -->
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px;">
                <div style="font-weight:600;">${t.symbol} ${badge}</div>
                <div style="color:${color}; font-weight:bold;">
                  ${change >= 0 ? "+" : ""}${change.toFixed(2)}%
                </div>
              </div>

              <!-- BAR WRAPPER -->
              <div style="
                position:relative;
                height:8px;
                background:#1e293b;
                border-radius:6px;
                overflow:hidden;
              ">

                <!-- CENTER LINE -->
                <div style="
                  position:absolute;
                  left:50%;
                  top:0;
                  bottom:0;
                  width:1px;
                  background:#334155;
                "></div>

                <!-- BAR -->
                <div style="
                  position:absolute;
                  top:0;
                  height:100%;
                  ${change >= 0 ? "left:50%;" : "right:50%;"}
                  width:${Math.min(Math.abs(change) * 4, 50)}%;
                  background:${color};
                  box-shadow:0 0 6px ${color};
                  border-radius:6px;
                  transition:width 0.4s ease;
                "></div>

              </div>

            </div>
          `;
        }).join("");

        const avg = total / count;

        // =========================
        // 📊 SUMMARY CARD LOGIC
        // =========================

        const summaryTotal = document.getElementById("weeklySummaryTotal");
        const winLossEl = document.getElementById("weeklyWinLoss");
        const marketStatus = document.getElementById("weeklyMarketStatus");

        const winners = data.filter(
          t => (t.weekly_change_percent ?? 0) > 0
        ).length;

        const losers = data.filter(
          t => (t.weekly_change_percent ?? 0) < 0
        ).length;

        // Only update if the elements actually exist
        if (summaryTotal && winLossEl && marketStatus) {

          // overall %
          summaryTotal.innerText =
            (avg >= 0 ? "+" : "") + avg.toFixed(2) + "%";

          summaryTotal.style.color =
            avg >= 0 ? "#22c55e" : "#ef4444";

          // win/loss
          winLossEl.innerText = `${winners} / ${losers}`;

          // market read
          if (avg > 2) {

            marketStatus.innerText = "🔥 Strong Week";
            marketStatus.style.color = "#22c55e";

          } else if (avg > 0) {

            marketStatus.innerText = "🟢 Positive";
            marketStatus.style.color = "#22c55e";

          } else if (avg < -2) {

            marketStatus.innerText = "🔻 Weak Week";
            marketStatus.style.color = "#ef4444";

          } else {

            marketStatus.innerText = "⚖️ Flat";
            marketStatus.style.color = "#94a3b8";

          }

        }

        weeklyTotalEl.innerText =
          (avg >= 0 ? "+" : "") + avg.toFixed(2) + "%";

        weeklyTotalEl.style.color =
          avg >= 0 ? "#22c55e" : "#ef4444";

        } else {

          weeklyContainer.innerHTML = `
            <div style="color:#94a3b8; font-size:13px;">
              No active trades this week
            </div>
          `;

          weeklyTotalEl.innerText = "-";

        }
  
  // =========================
  // 📊 COMBINED STATS (CLEAN FINAL)
  // =========================
  console.log("🔥 STATS BLOCK RUNNING");
  
  Promise.all([
    fetch("/active_positions.json?v=" + Date.now()).then(r => r.json()),
    fetch("/live_trade_history.json?v=" + Date.now()).then(r => r.json())
  ])
  .then(([active, history]) => {

    console.log("ACTIVE:", active);
    console.log("HISTORY:", history);

    // safety
    if (!Array.isArray(active)) active = [];
    if (!Array.isArray(history)) history = [];

    // =========================
    // ✅ ALWAYS SHOW LIVE COUNT
    // =========================
    document.getElementById("activeCount").innerText = active.length;

    // =========================
    // ❌ NO HISTORY → DEFAULT UI
    // =========================
    if (history.length === 0) {
      document.getElementById("avgReturn").innerText = "0%";
      document.getElementById("winRate").innerText = "0%";
      document.getElementById("bestTrade").innerText = "-";
      document.getElementById("winBar").style.width = "0%";
      return;
    }

    // =========================
    // 🔥 COMBINED STATS (BEST VERSION)
    // =========================

    // combine ALL trades for performance
    const all = history.map(t => ({
      percent_move: t.percent_move ?? t.result ?? 0,
      symbol: t.symbol
    }));

    // =========================
    // 📊 CALCULATIONS
    // =========================
    let wins = 0;
    let total = 0;

    // use history for win rate
    history.forEach(t => {
      const r = parseFloat(t.percent_move ?? t.result ?? 0);
      if (r > 0) wins++;
    });

    // use ALL for avg + best
    let best = all[0];

    all.forEach(t => {
      const r = parseFloat(t.percent_move ?? 0);

      total += r;

      const bestValue = parseFloat(best.percent_move ?? 0);

      if (r > bestValue) {
        best = t;
      }
    });

    // final stats
    const win = history.length > 0 ? (wins / history.length) * 100 : 0;
    const avg = all.length > 0 ? total / all.length : 0;

    // =========================
    // 💰 PROFIT FACTOR
    // =========================

    let totalWins = 0;
    let totalLosses = 0;

    history.forEach(t => {
      const r = parseFloat(t.percent_move ?? t.result ?? 0);

      if (r > 0) totalWins += r;
      if (r < 0) totalLosses += Math.abs(r);
    });

    const profitFactor =
      totalLosses > 0 ? totalWins / totalLosses : 0;

    // update UI
    document.getElementById("profitFactor").innerText =
      profitFactor.toFixed(2) + "x";

    // =========================
    // 📊 AVG HOLD TIME + RETURN
    // =========================

    let totalDays = 0;
    let totalReturn = 0;

    history.forEach(t => {
      const days = parseFloat(t.days_held ?? 0);
      const r = parseFloat(t.percent_move ?? t.result ?? 0);

      totalDays += days;
      totalReturn += r;
    });

    const avgDays = history.length > 0 ? totalDays / history.length : 0;
    const avgTrade = history.length > 0 ? totalReturn / history.length : 0;

    // update UI
    document.getElementById("avgHold").innerText =
      avgDays.toFixed(0) + " days";

    document.getElementById("avgPerTrade").innerText =
      (avgTrade >= 0 ? "+" : "") + avgTrade.toFixed(2) + "% per trade";

    // =========================
    // 📊 CATEGORY STATS (FIXED POSITION)
    // =========================

    const smallTrades = [];
    const midTrades = [];
    const largeTrades = [];

    history.forEach(t => {

      const price = parseFloat(t.entry_price ?? 0);

      if (price < 20) smallTrades.push(t);
      else if (price < 80) midTrades.push(t);
      else largeTrades.push(t);

    });

    function getStats(trades) {

      if (trades.length === 0) return "-";

      let total = 0;
      let wins = 0;

      trades.forEach(t => {
        const r = parseFloat(t.percent_move ?? 0);
        total += r;
        if (r > 0) wins++;
      });

      const avg = total / trades.length;
      const win = (wins / trades.length) * 100;

      return `
        <div style="font-size:14px;">
          ${trades.length} trades<br>
          ${avg.toFixed(2)}% avg<br>
          ${win.toFixed(0)}% win
        </div>
      `;
    }

    document.getElementById("smallStats").innerHTML = getStats(smallTrades);
    document.getElementById("midStats").innerHTML = getStats(midTrades);
    document.getElementById("largeStats").innerHTML = getStats(largeTrades);

    // =========================
    // 💰 PORTFOLIO SIMULATOR
    // =========================

    function runSimulation() {

      const startInput = document.getElementById("startCapital");
      const sizeInput = document.getElementById("positionSize");

      if (!startInput || !sizeInput) return;

      const startValue = parseFloat(startInput.value || 10000);
      const positionSize = parseFloat(sizeInput.value || 1);

      // sort trades by date (important)
      // get selected time range
      const range = document.getElementById("timeRange")?.value || "ALL";

      // current time
      const now = Date.now();

      // filter trades
      let filtered = history;

      if (range !== "ALL") {

        const months = parseInt(range);
        const cutoff = now - (months * 30 * 24 * 60 * 60 * 1000);

        filtered = history.filter(t => {
          return (t.entry_date ?? 0) >= cutoff;
        });

      }

      // sort filtered trades
      const sortedHistory = [...filtered].sort((a, b) => {
        return (a.entry_date ?? 0) - (b.entry_date ?? 0);
      });

      
      // =========================
      // 📈 EQUITY CURVE (FIXED)
      // =========================
            
      let chartCapital = startValue;

      const values = [1];
      const drawdowns = [0];
      const labels = ["Start"];

      let peak = 1;

        let bestIndex = 0;
        let bestValue = -Infinity;
        
        sortedHistory.forEach((t, i) => {

        const r = parseFloat(t.percent_move ?? t.result ?? 0);

        // 🔥 track best trade
        if (r > bestValue) {
          bestValue = r;
          bestIndex = i + 1; // +1 because of "Start"
        }

        chartCapital = chartCapital * (1 + (r / 100) * positionSize);

        const normalized = chartCapital / startValue;

        values.push(normalized);
        labels.push(i + 1);

        if (normalized > peak) peak = normalized;

        const dd = (normalized - peak) / peak;
        drawdowns.push(dd);

      });    
      
      // =========================
      // 📉 MAX DRAWDOWN
      // =========================
      const maxDD = Math.min(...drawdowns) * 100;

      const ddEl = document.getElementById("maxDrawdown");
      if (ddEl) {
        ddEl.innerText = maxDD.toFixed(2) + "%";
      }

      // =========================
      // 💰 FINAL VALUES
      // =========================

      const final = chartCapital;
      const totalReturn = ((final - startValue) / startValue) * 100;

      // update UI
      document.getElementById("finalValue").innerText =
        "$" + final.toLocaleString(undefined, { maximumFractionDigits: 0 });

      document.getElementById("totalReturn").innerText =
        totalReturn.toFixed(2) + "%";

      // =========================
      // 📊 RENDER CHART
      // =========================

      const ctx = document.getElementById("equityChart");

      if (ctx) {

        if (window.equityChartInstance) {
          window.equityChartInstance.destroy();
        }

        window.equityChartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                data: values,
                borderColor: "#22c55e",
                backgroundColor: "rgba(34,197,94,0.1)",
                tension: 0.45,
                fill: true,
                borderWidth: 3,
                pointRadius: 0
              },
              {
                data: drawdowns.map(d => 1 + d),
                borderColor: "#ef4444",
                backgroundColor: "rgba(239,68,68,0.1)",
                tension: 0.45,
                fill: true,
                borderWidth: 2,
                pointRadius: 0
              },
              {
                data: values.map((v, i) => i === bestIndex ? v : null),
                borderColor: "#facc15",
                backgroundColor: "#facc15",
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false
              }
            ]
          },
          options: {
            plugins: {
              legend: { display: false },

              tooltip: {
                callbacks: {
                  label: function(context) {
                    if (context.datasetIndex === 2 && context.raw !== null) {
                      return "Best Trade: +" + bestValue.toFixed(2) + "%";
                    }
                    return "";
                  }
                }
              }

            },
            scales: {
              x: {
                ticks: { display: false },
                grid: { display: false }
              },
              y: {
                min: 0.9,
                ticks: {
                  color: "#94a3b8",
                  callback: function(v) {
                    return "$" + Math.round(v * startValue).toLocaleString();
                  }
                },
                grid: { color: "#1e293b" }
              }
            }
          }
        });

      } // ✅ END if (ctx)

      } // ✅ CLOSE runSimulation()
      
        

      // run once
      runSimulation();

      // listeners
      document.getElementById("startCapital")?.addEventListener("input", runSimulation);
      document.getElementById("positionSize")?.addEventListener("change", runSimulation);
      document.getElementById("timeRange")?.addEventListener("change", runSimulation);

    

    // =========================
    // 🏆 TOP & WORST TRADES
    // =========================

        // use history only (closed trades)
        const sorted = [...history].sort((a, b) => {
          return (b.percent_move ?? 0) - (a.percent_move ?? 0);
        });
    
    // top 3 winners
    const top = sorted.slice(0, 3);

    // worst 3 losers
    const worst = sorted.slice(-3).reverse();

    function renderTradeList(trades, isPositive = true) {

      if (trades.length === 0) return "No trades";

      return trades.map(t => {
        const move = parseFloat(t.percent_move ?? 0);
        const color = move >= 0 ? "#22c55e" : "#ef4444";

        return `
          <div style="font-size:14px; margin-bottom:6px;">
            <strong 
              style="cursor:pointer;"
              onclick="window.location.href='chart.html?symbol=${t.symbol}'"
            >
              ${t.symbol}
            </strong>
            <span style="color:${color}; float:right;">
              ${move.toFixed(2)}%
            </span>
          </div>
        `;
      }).join("");
    }

    // update UI
    document.getElementById("topTrades").innerHTML = renderTradeList(top, true);
    document.getElementById("worstTrades").innerHTML = renderTradeList(worst, false);

    // =========================
    // 📊 UPDATE UI
    // =========================

    // animate
    animateValue("avgReturn", avg);
    animateValue("winRate", win);

    // BEST TRADE
    const bestMove = parseFloat(best.percent_move ?? best.result ?? 0);

    document.getElementById("bestTrade").innerHTML = `
  <div style="font-size:22px; font-weight:bold; color:#22c55e;">
    ${best.symbol}
  </div>
  <div style="font-size:14px; color:#94a3b8;">
    +${bestMove.toFixed(2)}%
  </div>
`;

   
    // =========================
    // 📈 PERFORMANCE BAR (YOUR RULES)
    // =========================
    const bar = document.getElementById("winBar");

    let width = 0;

    // WIDTH LOGIC
    if (avg <= 0) {
      width = 0;
    } else if (avg >= 5) {
      width = 100;
    } else {
      width = (avg / 5) * 100;
    }

    // APPLY WIDTH
    bar.style.width = width + "%";

    // COLOR LOGIC
    if (avg < 0) {
      bar.style.background = "#ef4444"; // red
    } else if (avg < 5) {
      bar.style.background = "#f59e0b"; // yellow
    } else {
      bar.style.background = "#22c55e"; // green
    }

    }) // closes .then()

    .catch(err => {
      console.error("STATS ERROR:", err);
    });

    }); // ✅ closes MAIN DOMContentLoaded

</script>