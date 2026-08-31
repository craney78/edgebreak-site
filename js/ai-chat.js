
/* =========================================================
   EDGEBREAK AI CHAT
   PANEL OPEN / CLOSE
========================================================= */

(function initEdgeBreakAIChat() {

    const chatButton =
        document.getElementById("edgeBreakChatButton");

    const chatPanel =
        document.getElementById("edgeBreakChatPanel");

    const chatOverlay =
        document.getElementById("edgeBreakChatOverlay");

    const chatClose =
        document.getElementById("edgeBreakChatClose");


    /* -----------------------------------------------------
       SAFETY CHECK
    ----------------------------------------------------- */

    if (
        !chatButton ||
        !chatPanel ||
        !chatOverlay ||
        !chatClose
    ) {

        console.warn(
            "EdgeBreak AI Chat elements not found."
        );

        return;
    }


    /* -----------------------------------------------------
       OPEN CHAT
    ----------------------------------------------------- */

    function openEdgeBreakChat() {

        chatPanel.classList.add("is-open");
        chatOverlay.classList.add("is-open");

        chatPanel.setAttribute(
            "aria-hidden",
            "false"
        );

        chatOverlay.setAttribute(
            "aria-hidden",
            "false"
        );

        chatButton.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.style.overflow = "hidden";

    }


    /* -----------------------------------------------------
       CLOSE CHAT
    ----------------------------------------------------- */

    function closeEdgeBreakChat() {

        chatPanel.classList.remove("is-open");
        chatOverlay.classList.remove("is-open");

        chatPanel.setAttribute(
            "aria-hidden",
            "true"
        );

        chatOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

        chatButton.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.style.overflow = "";

    }


    /* -----------------------------------------------------
       OPEN BUTTON
    ----------------------------------------------------- */

    chatButton.addEventListener(
        "click",
        openEdgeBreakChat
    );


    /* -----------------------------------------------------
       CLOSE BUTTON
    ----------------------------------------------------- */

    chatClose.addEventListener(
        "click",
        closeEdgeBreakChat
    );


    /* -----------------------------------------------------
       CLICK OUTSIDE PANEL
    ----------------------------------------------------- */

    chatOverlay.addEventListener(
        "click",
        closeEdgeBreakChat
    );


    /* -----------------------------------------------------
       ESC KEY
    ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Escape" &&
                chatPanel.classList.contains("is-open")
            ) {

                closeEdgeBreakChat();

            }

        }
    );


})();

/* =========================================================
   EDGEBREAK AI CHAT
   QUICK ANSWERS NAVIGATION
========================================================= */

(function initEdgeBreakQuickAnswers() {

    const categories =
        document.getElementById(
            "edgeBreakChatCategories"
        );

    const quickScreen =
        document.getElementById(
            "edgeBreakQuickScreen"
        );

    const quickButton =
        document.querySelector(
            '[data-chat-category="quick"]'
        );

    const backButton =
        quickScreen?.querySelector(
            '[data-chat-back="main"]'
        );


    /* -----------------------------------------------------
       SAFETY CHECK
    ----------------------------------------------------- */

    if (
        !categories ||
        !quickScreen ||
        !quickButton ||
        !backButton
    ) {

        console.warn(
            "EdgeBreak Quick Answers elements not found."
        );

        return;

    }


    /* -----------------------------------------------------
       OPEN QUICK ANSWERS
    ----------------------------------------------------- */

    quickButton.addEventListener(
        "click",
        function() {

            categories.hidden = true;
            quickScreen.hidden = false;

            const conversation =
                document.getElementById(
                    "edgeBreakChatConversation"
                );

            if (conversation) {
                conversation.scrollTop = 0;
            }

        }
    );


    /* -----------------------------------------------------
       RETURN TO MAIN CATEGORIES
    ----------------------------------------------------- */

    backButton.addEventListener(
        "click",
        function() {

            quickScreen.hidden = true;
            categories.hidden = false;

            const conversation =
                document.getElementById(
                    "edgeBreakChatConversation"
                );

            if (conversation) {
                conversation.scrollTop = 0;
            }

        }
    );


})();

/* =========================================================
   EDGEBREAK AI CHAT
   TECHNICAL SETUP NAVIGATION
========================================================= */

(function initEdgeBreakTechnicalSetup() {

    const categories =
        document.getElementById(
            "edgeBreakChatCategories"
        );

    const technicalScreen =
        document.getElementById(
            "edgeBreakTechnicalScreen"
        );

    const technicalButton =
        document.querySelector(
            '[data-chat-category="stock"]'
        );

    const backButton =
        technicalScreen?.querySelector(
            '[data-chat-back="main"]'
        );


    /* -----------------------------------------------------
       SAFETY CHECK
    ----------------------------------------------------- */

    if (
        !categories ||
        !technicalScreen ||
        !technicalButton ||
        !backButton
    ) {

        console.warn(
            "EdgeBreak Technical Setup elements not found."
        );

        return;

    }


    /* -----------------------------------------------------
       OPEN TECHNICAL SETUP
    ----------------------------------------------------- */

    technicalButton.addEventListener(
        "click",
        function() {

            categories.hidden = true;
            technicalScreen.hidden = false;

            const conversation =
                document.getElementById(
                    "edgeBreakChatConversation"
                );

            if (conversation) {
                conversation.scrollTop = 0;
            }

        }
    );


    /* -----------------------------------------------------
       RETURN TO MAIN CATEGORIES
    ----------------------------------------------------- */

    backButton.addEventListener(
        "click",
        function() {

            technicalScreen.hidden = true;
            categories.hidden = false;

            const conversation =
                document.getElementById(
                    "edgeBreakChatConversation"
                );

            if (conversation) {
                conversation.scrollTop = 0;
            }

        }
    );


})();

/* =========================================================
   EDGEBREAK AI CHAT
   HELP ME UNDERSTAND NAVIGATION
========================================================= */

(function initEdgeBreakLearnNavigation() {

    const categories =
        document.getElementById(
            "edgeBreakChatCategories"
        );

    const learnScreen =
        document.getElementById(
            "edgeBreakLearnScreen"
        );

    const learnButton =
        document.querySelector(
            '[data-chat-category="learn"]'
        );

    const backButton =
        learnScreen?.querySelector(
            '[data-chat-back="main"]'
        );

    if (
        !categories ||
        !learnScreen ||
        !learnButton ||
        !backButton
    ) {
        console.warn(
            "EdgeBreak Help Me Understand elements not found."
        );
        return;
    }


    /* OPEN HELP ME UNDERSTAND */

    learnButton.addEventListener(
        "click",
        function() {

            categories.hidden = true;
            learnScreen.hidden = false;

            const conversation =
                document.getElementById(
                    "edgeBreakChatConversation"
                );

            if (conversation) {
                conversation.scrollTop = 0;
            }

        }
    );


    /* BACK TO MAIN MENU */

    backButton.addEventListener(
        "click",
        function() {

            learnScreen.hidden = true;
            categories.hidden = false;

            const conversation =
                document.getElementById(
                    "edgeBreakChatConversation"
                );

            if (conversation) {
                conversation.scrollTop = 0;
            }

        }
    );

})();

/* =========================================================
   EDGEBREAK AI CHAT
   HELP ME UNDERSTAND ANSWERS
========================================================= */

(function initEdgeBreakLearnAnswers() {

    const learnScreen =
        document.getElementById(
            "edgeBreakLearnScreen"
        );

    const conversation =
        document.getElementById(
            "edgeBreakChatConversation"
        );

    if (
        !learnScreen ||
        !conversation
    ) {
        console.warn(
            "EdgeBreak Help Me Understand answer elements not found."
        );
        return;
    }


    const answers = {

        "resistance": `
            <strong>Resistance</strong> is a price area where a stock
            has previously had difficulty moving higher.
            <br><br>
            Traders watch resistance because repeated reactions around
            the same area can show where selling pressure has appeared.
            If price approaches resistance again, that area becomes an
            important part of the chart to watch.
        `,


        "support": `
            <strong>Support</strong> is a price area where a stock
            has previously found enough buying interest to stop or slow
            a decline.
            <br><br>
            When price repeatedly holds around a similar level, that
            area may become an important part of the stock's technical
            structure.
        `,


        "breakout": `
            A <strong>breakout</strong> occurs when price moves above
            an established resistance area.
            <br><br>
            Traders often look at the strength of the move, trading
            volume and whether price can remain above the previous
            resistance area.
            <br><br>
            A breakout does not guarantee that price will continue
            higher.
        `,


        "pre-breakout": `
            A <strong>pre-breakout setup</strong> is a stock trading
            close to an established resistance area before a confirmed
            breakout has occurred.
            <br><br>
            EdgeBreak looks for technical structure such as repeated
            resistance tests and higher lows that may show price
            tightening beneath resistance.
        `,


        "higher-lows": `
            <strong>Higher lows</strong> occur when each important
            pullback stops at a higher price than the previous one.
            <br><br>
            This can show that buyers are becoming willing to support
            the stock at progressively higher prices.
            <br><br>
            When higher lows form beneath resistance, the available
            trading range can gradually become tighter.
        `,


        "volume": `
            <strong>Volume</strong> shows how many shares of a stock
            are being traded.
            <br><br>
            Higher volume means more shares are changing hands, while
            lower volume means less trading activity.
            <br><br>
            Volume can provide useful context when examining price
            movements because a move occurring with unusually strong
            trading activity may attract more attention than the same
            move occurring on very low volume.
        `,


        "relative-volume": `
            <strong>Relative volume</strong> compares a stock's current
            trading volume with its normal or average volume.
            <br><br>
            For example, relative volume of <strong>2.0×</strong>
            means the stock is trading at roughly twice its usual
            volume for the comparison being used.
            <br><br>
            It helps show whether current market participation is
            unusually high or low.
        `,


        "trading-range": `
            A <strong>trading range</strong> forms when price moves
            between an identifiable support area and resistance area
            for a period of time.
            <br><br>
            Instead of trending strongly higher or lower, price
            repeatedly moves within that range.
            <br><br>
            EdgeBreak uses established ranges when analysing some
            consolidation and Launch Pad structures.
        `,


        "launch-pad": `
            An EdgeBreak <strong>Launch Pad</strong> is a stock that
            has formed an established technical base or trading range.
            <br><br>
            EdgeBreak looks for features including identifiable support
            and resistance zones, repeated tests of those areas and a
            relatively controlled trading range.
            <br><br>
            The name describes the technical structure EdgeBreak has
            detected. It does not mean the stock will break out or move
            higher.
        `,


        "smart-money": `
            <strong>Smart Money</strong> is EdgeBreak's filter for
            highlighting stocks showing activity that may be worth
            investigating more closely.
            <br><br>
            EdgeBreak records when a stock appears in the Smart Money
            Filter and can track repeated appearances over time.
            <br><br>
            A Smart Money appearance should not be interpreted as proof
            that institutions are buying the stock.
            <br><br>
            The EdgeBreak Smart Money Filter has also had limited
            operating time and is still gathering historical data for
            analysis.
        `,


        "liquidity": `
            <strong>Liquidity</strong> describes how easily shares can
            generally be traded without causing a large change in
            price.
            <br><br>
            Stocks with high trading activity are usually more liquid
            than stocks that trade very few shares.
            <br><br>
            EdgeBreak uses measures such as average share volume and
            average dollar volume when assessing trading activity.
        `,


        "market-cap": `
            <strong>Market capitalisation</strong>, or market cap, is
            the approximate total market value of a company's
            outstanding shares.
            <br><br>
            It is commonly calculated as:
            <br><br>
            <strong>Share Price × Shares Outstanding = Market Cap</strong>
            <br><br>
            Market cap is commonly used to describe the relative size
            of a publicly traded company.
        `

    };


    const questionButtons =
        learnScreen.querySelectorAll(
            "[data-chat-learn-question]"
        );


    questionButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const question =
                        button.dataset.chatLearnQuestion;

                    const questionText =
                        button.querySelector(
                            "span:first-child"
                        )?.textContent.trim() ||
                        "Help Me Understand";

                    const answer =
                        answers[question];

                    if (!answer) {
                        return;
                    }


                    /* USER QUESTION */

                    const userMessage =
                        document.createElement("div");

                    userMessage.className =
                        "edge-chat-message edge-chat-message-user";

                    userMessage.innerHTML = `
                        <div class="edge-chat-message-bubble">
                            <strong>
                                ${questionText}
                            </strong>
                        </div>
                    `;


                    /* AI ANSWER */

                    const aiMessage =
                        document.createElement("div");

                    aiMessage.className =
                        "edge-chat-message edge-chat-message-ai";

                    aiMessage.innerHTML = `
                        <div class="edge-chat-message-bubble">
                            ${answer}
                        </div>
                    `;


                    /* BACK BUTTON */

                    const answerBackRow =
                        document.createElement("div");

                    answerBackRow.className =
                        "edge-chat-answer-back-row";

                    const answerBackButton =
                        document.createElement("button");

                    answerBackButton.type =
                        "button";

                    answerBackButton.className =
                        "edge-chat-back";

                    answerBackButton.textContent =
                        "← Back to Help Me Understand";

                    answerBackRow.appendChild(
                        answerBackButton
                    );


                    /* HIDE QUESTION SCREEN */

                    learnScreen.hidden = true;


                    /* SHOW ANSWER */

                    conversation.appendChild(
                        userMessage
                    );

                    conversation.appendChild(
                        aiMessage
                    );

                    conversation.appendChild(
                        answerBackRow
                    );


                    /* BACK TO QUESTIONS */

                    answerBackButton.addEventListener(
                        "click",
                        function() {

                            userMessage.remove();
                            aiMessage.remove();
                            answerBackRow.remove();

                            learnScreen.hidden =
                                false;

                            conversation.scrollTop =
                                0;

                        }
                    );


                    conversation.scrollTop =
                        conversation.scrollHeight;

                }
            );

        }
    );

})();

/* =========================================================
   EDGEBREAK AI CHAT
   EDGEBREAK & MY ACCOUNT
========================================================= */

(function initEdgeBreakAccountSection() {

    const categories =
        document.getElementById(
            "edgeBreakChatCategories"
        );

    const accountScreen =
        document.getElementById(
            "edgeBreakAccountScreen"
        );

    const accountButton =
        document.querySelector(
            '[data-chat-category="account"]'
        );

    const conversation =
        document.getElementById(
            "edgeBreakChatConversation"
        );

    const backButton =
        accountScreen?.querySelector(
            '[data-chat-back="main"]'
        );


    /* -----------------------------------------------------
       SAFETY CHECK
    ----------------------------------------------------- */

    if (
        !categories ||
        !accountScreen ||
        !accountButton ||
        !conversation ||
        !backButton
    ) {

        console.warn(
            "EdgeBreak Account elements not found."
        );

        return;

    }


    /* =====================================================
       ANSWERS
    ===================================================== */

    const answers = {


        /* -------------------------------------------------
           #1 WHAT DOES EDGEBREAK DO?
        ------------------------------------------------- */

        "what-is-edgebreak": `

            <strong>EdgeBreak</strong> is a NASDAQ stock
            discovery and research platform.
            <br><br>
            Each trading day, EdgeBreak scans more than
            <strong>3,200 NASDAQ-listed stocks</strong> looking
            for technical structures identified by its
            Breakout, Pre-Breakout and Launch Pad scanners.
            <br><br>
            The setups found are then filtered, graded and
            ranked before selected stocks are passed through
            EdgeBreak's AI research process.
            <br><br>
            EdgeBreak also provides AI Stock Research,
            AI Chart Analysis, market intelligence and
            educational tools to help users investigate
            stocks and better understand what the scanners
            have found.

        `,


        /* -------------------------------------------------
           #2 WHAT ARE THE EDGEBREAK SCANNERS?
        ------------------------------------------------- */

        "scanners": `

            EdgeBreak currently uses
            <strong>three main NASDAQ stock scanners</strong>:
            <br><br>

            <strong>Breakout Scanner</strong><br>
            Finds stocks that have moved above an identified
            resistance level after forming qualifying
            technical structure.
            <br><br>

            <strong>Pre-Breakout Scanner</strong><br>
            Looks for stocks developing technical structure
            beneath resistance, including repeated resistance
            tests and higher lows.
            <br><br>

            <strong>Launch Pad Scanner</strong><br>
            Searches for established trading bases with
            identifiable support and resistance zones and
            repeated interaction around those areas.
            <br><br>
            The scanners are designed to identify different
            stages and types of technical structure rather
            than predict what a stock will do next.

        `,


        /* -------------------------------------------------
           #3 DIFFERENCE BETWEEN THE SCANNERS
        ------------------------------------------------- */

        "scanner-difference": `

            The easiest way to understand the three EdgeBreak
            scanners is by looking at
            <strong>where the stock is within its technical
            structure</strong>.
            <br><br>

            <strong>Launch Pad</strong><br>
            The stock has formed an established trading base
            between identifiable support and resistance areas.
            <br><br>

            <strong>Pre-Breakout</strong><br>
            The stock is developing structure beneath an
            identified resistance level. EdgeBreak looks for
            features such as repeated resistance tests and
            higher lows.
            <br><br>

            <strong>Breakout</strong><br>
            Price has moved above the resistance level
            identified by EdgeBreak.
            <br><br>
            A stock can sometimes appear in more than one
            EdgeBreak dataset because each scanner examines
            the stock from a different technical perspective.

        `,


        /* -------------------------------------------------
           #4 DAILY BRIEF
        ------------------------------------------------- */

        "daily-brief": `

            The <strong>EdgeBreak Daily Brief</strong> brings
            together EdgeBreak's daily NASDAQ scanning and
            research process into a simpler market summary.
            <br><br>
            EdgeBreak first scans the NASDAQ for technical
            setups. Those results are then filtered, graded
            and ranked before selected companies are forwarded
            for AI research.
            <br><br>
            The Daily Brief combines this with broader NASDAQ
            market intelligence to help users quickly see
            what EdgeBreak found during the completed trading
            session and which researched stocks may be worth
            investigating further.
            <br><br>
            It is designed to reduce the amount of scanner
            data a user needs to work through manually.

        `,


        /* -------------------------------------------------
           #5 AI STOCK RESEARCH
        ------------------------------------------------- */

        "ai-research": `

            <strong>AI Stock Research</strong> helps users
            investigate companies found through EdgeBreak.
            <br><br>
            Instead of relying only on a technical scanner
            result, users can access additional company and
            market research to better understand the stock
            they are investigating.
            <br><br>
            EdgeBreak's AI research can examine areas such as
            company information, recent developments, market
            attention and other research context available
            through the platform.
            <br><br>
            AI Stock Research is a research tool. It does
            <strong>not</strong> provide a buy, sell or hold
            recommendation.

        `,


        /* -------------------------------------------------
           #6 AI CHART ANALYSIS
        ------------------------------------------------- */

        "ai-chart": `

            <strong>AI Chart Analysis</strong> allows you to
            provide a stock chart for EdgeBreak AI to analyse.
            <br><br>
            The analysis focuses on technical features visible
            in the chart, such as support, resistance, trading
            ranges, higher lows, consolidation, price
            structure and volume.
            <br><br>
            It is designed to help explain what may be
            happening technically on a chart in straightforward
            language.
            <br><br>
            AI Chart Analysis does not predict the future
            price of a stock or provide buy, sell or hold
            recommendations.

        `,


        /* -------------------------------------------------
           #7 SMART MONEY FILTER
        ------------------------------------------------- */

        "smart-money": `

            The <strong>EdgeBreak Smart Money Filter</strong>
            records stocks that meet EdgeBreak's activity
            criteria and tracks their appearances over time.
            <br><br>
            This allows EdgeBreak to identify whether a stock
            has appeared in the filter previously and how many
            recorded appearances it has accumulated.
            <br><br>
            A Smart Money appearance provides additional
            research context. It should not be interpreted as
            proof that institutions are buying a stock.
            <br><br>
            <strong>Important:</strong> the Smart Money Filter
            has had limited operating time and is still
            gathering historical data for analysis.

        `,


        /* -------------------------------------------------
           #8 EDGEBREAK ACADEMY
        ------------------------------------------------- */

        "academy": `

            <strong>EdgeBreak Academy</strong> is the
            educational section of EdgeBreak.
            <br><br>
            It provides structured learning material to help
            users better understand stock-market and technical
            analysis concepts used throughout the platform.
            <br><br>
            The Academy is designed to help users build their
            knowledge so they can better understand scanner
            results, technical structures and the information
            presented by EdgeBreak.
            <br><br>
            It is particularly useful for users who are still
            learning the terminology and concepts they
            encounter while researching stocks.

        `,


        /* -------------------------------------------------
           #9 SCANNER UPDATE TIME
        ------------------------------------------------- */

        "scanner-updates": `

            EdgeBreak updates its scanner results
            <strong>daily after the NASDAQ closes</strong>.
            <br><br>
            The process begins after the regular NASDAQ
            trading session closes at approximately
            <strong>4:00 PM Eastern Time in the United
            States</strong>.
            <br><br>
            EdgeBreak then scans more than
            <strong>3,200 NASDAQ-listed stocks</strong> using
            the Breakout, Pre-Breakout and Launch Pad
            scanners.
            <br><br>
            The technical setups found are filtered,
            <strong>graded and ranked</strong>. Selected
            stocks are then passed through EdgeBreak's AI
            research process.
            <br><br>
            The complete daily process takes approximately
            <strong>two hours</strong> and is normally
            completed by around
            <strong>6:00 PM Eastern Time</strong>.

        `,


        /* -------------------------------------------------
           #10 WHY DID A STOCK DISAPPEAR?
        ------------------------------------------------- */

        "stock-disappeared": `

            EdgeBreak scanner results are
            <strong>recalculated as market data changes</strong>.
            <br><br>
            A stock can disappear from a scanner when it no
            longer satisfies the technical conditions required
            for that particular setup.
            <br><br>
            For example, price may move away from an identified
            resistance area, a previously detected structure
            may no longer remain active, or updated market
            data may cause the stock to no longer qualify
            under the scanner's rules.
            <br><br>
            This is normal. Scanner inclusion describes the
            technical conditions EdgeBreak identified at that
            time — it is not a permanent classification of
            the stock.

        `,


        /* -------------------------------------------------
           #11 7-DAY FREE TRIAL
        ------------------------------------------------- */

        "free-trial": `

            The <strong>7-day EdgeBreak free trial</strong>
            gives you access to the full version of EdgeBreak
            for seven days.
            <br><br>
            During the trial you can access the
            <strong>three EdgeBreak scanners</strong>, market
            intelligence and stock AI intelligence available
            through the full platform.
            <br><br>
            After the seven-day trial, you will be charged
            <strong>$20 USD per month</strong> to continue
            accessing the full version of EdgeBreak.
            <br><br>
            If you are not a subscriber, you can still access
            <strong>EdgeBreak Free</strong>.
            <br><br>
            The free version provides restricted access,
            including the first
            <strong>two stocks on each scanner</strong> and
            <strong>two of the final AI-researched stocks</strong>.
            AI Deep Research on individual stocks is not
            available in the free version.

        `,


        /* -------------------------------------------------
           #12 MANAGE / CANCEL ACCOUNT
        ------------------------------------------------- */

        "manage-account": `

            You can manage your EdgeBreak account from your
            <strong>EdgeBreak Workspace</strong>.
            <br><br>

            <strong>How to get there:</strong>
            <br><br>
            1. Open the EdgeBreak navigation.
            <br>
            2. Go to <strong>EdgeBreak AI Hub</strong>, the
            main scanner page.
            <br>
            3. Scroll to <strong>EdgeBreak Tools</strong>.
            <br>
            4. Select <strong>Open Workspace</strong>.
            <br>
            5. Scroll to <strong>Manage My Account</strong>
            and select it.
            <br><br>

            From Manage My Account you can access account
            security information, change your password,
            verify your email and manage your notification
            preferences, including email alerts and marketing
            preferences.
            <br><br>
            You can also view EdgeBreak policies.
            <br><br>
            <strong>Two-factor authentication (2FA) is coming
            soon.</strong>
            <br><br>
            If you choose
            <strong>Delete Account</strong>, your EdgeBreak
            account will be closed and billing will stop.

        `,


        /* -------------------------------------------------
           #13 FINANCIAL ADVICE
        ------------------------------------------------- */

        "financial-advice": `

            <strong>No.</strong> EdgeBreak does not provide
            financial advice.
            <br><br>
            EdgeBreak is designed for stock discovery,
            technical research, market intelligence and
            education.
            <br><br>
            Scanner results, AI research, chart analysis and
            other information provided by EdgeBreak are
            intended to help users conduct their own research.
            <br><br>
            EdgeBreak does not tell you to
            <strong>buy, sell or hold</strong> a security and
            does not make investment decisions on your
            behalf.
            <br><br>
            Users should independently verify important
            information and make their own investment
            decisions.

        `

    };


    /* =====================================================
       OPEN ACCOUNT SCREEN
    ===================================================== */

    accountButton.addEventListener(
        "click",
        function() {

            categories.hidden = true;
            accountScreen.hidden = false;

            conversation.scrollTop = 0;

        }
    );


    /* =====================================================
       BACK TO MAIN MENU
    ===================================================== */

    backButton.addEventListener(
        "click",
        function() {

            accountScreen.hidden = true;
            categories.hidden = false;

            conversation.scrollTop = 0;

        }
    );


    /* =====================================================
       QUESTION BUTTONS
    ===================================================== */

    const questionButtons =
        accountScreen.querySelectorAll(
            "[data-chat-account-question]"
        );


    questionButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const question =
                        button.dataset.chatAccountQuestion;

                    const questionText =
                        button.querySelector(
                            "span:first-child"
                        )?.textContent.trim() ||
                        "EdgeBreak & My Account";

                    const answer =
                        answers[question];

                    if (!answer) {
                        return;
                    }


                    /* -----------------------------------------
                       USER MESSAGE
                    ----------------------------------------- */

                    const userMessage =
                        document.createElement("div");

                    userMessage.className =
                        "edge-chat-message edge-chat-message-user";

                    userMessage.innerHTML = `

                        <div class="edge-chat-message-bubble">

                            <strong>
                                ${questionText}
                            </strong>

                        </div>

                    `;


                    /* -----------------------------------------
                       EDGEBREAK ANSWER
                    ----------------------------------------- */

                    const aiMessage =
                        document.createElement("div");

                    aiMessage.className =
                        "edge-chat-message edge-chat-message-ai";

                    aiMessage.innerHTML = `

                        <div class="edge-chat-message-icon">
                            ✦
                        </div>

                        <div class="edge-chat-message-bubble">
                            ${answer}
                        </div>

                    `;


                    /* -----------------------------------------
                       BACK BUTTON
                    ----------------------------------------- */

                    const answerBackRow =
                        document.createElement("div");

                    answerBackRow.className =
                        "edge-chat-answer-back-row";


                    const answerBackButton =
                        document.createElement("button");

                    answerBackButton.type =
                        "button";

                    answerBackButton.className =
                        "edge-chat-back";

                    answerBackButton.textContent =
                        "← Back to EdgeBreak & My Account";


                    answerBackRow.appendChild(
                        answerBackButton
                    );


                    /* -----------------------------------------
                       HIDE ACCOUNT QUESTIONS
                    ----------------------------------------- */

                    accountScreen.hidden = true;


                    /* -----------------------------------------
                       DISPLAY ANSWER
                    ----------------------------------------- */

                    conversation.appendChild(
                        userMessage
                    );

                    conversation.appendChild(
                        aiMessage
                    );

                    conversation.appendChild(
                        answerBackRow
                    );


                    /* -----------------------------------------
                       RETURN TO ACCOUNT QUESTIONS
                    ----------------------------------------- */

                    answerBackButton.addEventListener(
                        "click",
                        function() {

                            userMessage.remove();
                            aiMessage.remove();
                            answerBackRow.remove();

                            accountScreen.hidden =
                                false;

                            conversation.scrollTop =
                                0;

                        }
                    );


                    conversation.scrollTop =
                        conversation.scrollHeight;

                }
            );

        }
    );


})();

/* =========================================================
   EDGEBREAK AI CHAT
   TECHNICAL QUESTION -> STOCK SELECT
========================================================= */

(function initEdgeBreakTechnicalQuestionSelection() {

    const technicalScreen =
        document.getElementById(
            "edgeBreakTechnicalScreen"
        );

    const stockScreen =
        document.getElementById(
            "edgeBreakStockScreen"
        );

    const selectedQuestionText =
        document.getElementById(
            "edgeBreakSelectedQuestionText"
        );

    const tickerInput =
        document.getElementById(
            "edgeBreakTickerInput"
        );

    const tickerMessage =
        document.getElementById(
            "edgeBreakTickerMessage"
        );


    /* -----------------------------------------------------
       SAFETY CHECK
    ----------------------------------------------------- */

    if (
        !technicalScreen ||
        !stockScreen ||
        !selectedQuestionText ||
        !tickerInput ||
        !tickerMessage
    ) {

        console.warn(
            "EdgeBreak Technical Question elements not found."
        );

        return;

    }


    const questionButtons =
        technicalScreen.querySelectorAll(
            "[data-chat-technical-question]"
        );


    /* -----------------------------------------------------
       TECHNICAL QUESTION SELECT
    ----------------------------------------------------- */

    questionButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const question =
                        button.dataset.chatTechnicalQuestion;

                    const label =
                        button.querySelector(
                            "span:first-child"
                        );

                    const questionLabel =
                        label
                            ? label.textContent.trim()
                            : "Technical Setup";


                    /* -----------------------------------------
                       STORE QUESTION FOR STOCK ROUTER
                    ----------------------------------------- */

                    window.edgeBreakTechnicalQuestion =
                        question;

                    window.edgeBreakTechnicalQuestionLabel =
                        questionLabel;

                    window.edgeBreakQuestionMode =
                        "technical";


                    /* -----------------------------------------
                       UPDATE STOCK SCREEN
                    ----------------------------------------- */

                    selectedQuestionText.textContent =
                        questionLabel;

                    technicalScreen.hidden = true;
                    stockScreen.hidden = false;

                    tickerInput.value = "";
                    tickerMessage.textContent = "";


                    /* -----------------------------------------
                       CHANGE STOCK BACK DESTINATION
                    ----------------------------------------- */

                    const stockBackButton =
                        stockScreen.querySelector(
                            ".edge-chat-back"
                        );

                    if (stockBackButton) {

                        stockBackButton.dataset.chatBack =
                            "technical";

                    }


                    /* -----------------------------------------
                       FOCUS TICKER
                    ----------------------------------------- */

                    setTimeout(
                        function() {
                            tickerInput.focus();
                        },
                        50
                    );


                    const conversation =
                        document.getElementById(
                            "edgeBreakChatConversation"
                        );

                    if (conversation) {
                        conversation.scrollTop = 0;
                    }

                }
            );

        }
    );


})();

/* =========================================================
   EDGEBREAK AI CHAT
   MARGIN & MY TRADING ACCOUNT
========================================================= */

(function initEdgeBreakMarginSection() {

    const categories =
        document.getElementById(
            "edgeBreakChatCategories"
        );

    const marginScreen =
        document.getElementById(
            "edgeBreakMarginScreen"
        );

    const marginButton =
        document.querySelector(
            '[data-chat-category="margin"]'
        );

    const conversation =
        document.getElementById(
            "edgeBreakChatConversation"
        );

    const backButton =
        marginScreen?.querySelector(
            '[data-chat-back="main"]'
        );


    if (
        !categories ||
        !marginScreen ||
        !marginButton ||
        !conversation ||
        !backButton
    ) {
        console.warn(
            "EdgeBreak Margin elements not found."
        );
        return;
    }


    /* =====================================================
       ANSWERS
    ===================================================== */

    const answers = {


        "margin-account": `
            A <strong>margin account</strong> allows an eligible
            investor to borrow money from their broker to help
            purchase securities.
            <br><br>
            The securities and cash in the account generally act
            as collateral for the loan.
            <br><br>
            Using borrowed money increases market exposure, but it
            also increases risk. Losses can be larger than they
            would have been when using only your own cash, and
            brokers may charge interest on borrowed funds.
            <br><br>
            Margin availability, borrowing limits and requirements
            vary between brokers and accounts.
        `,


        "leverage": `
            <strong>Leverage</strong> means using borrowed money
            or other financial exposure to control a position
            larger than the amount of your own cash being used.
            <br><br>
            For example, if your own capital represents only part
            of the total position, movements in the stock can have
            a larger effect on your capital.
            <br><br>
            Leverage magnifies both gains <strong>and losses</strong>.
            It does not improve the quality of a trade or make a
            stock more likely to move in your favour.
        `,


        "buying-power": `
            <strong>Buying power</strong> is the amount your account
            is currently permitted to use to purchase securities.
            <br><br>
            In a cash account, this is largely determined by
            available cash and settled funds.
            <br><br>
            In an eligible margin account, buying power may also
            include borrowing capacity provided by the broker.
            <br><br>
            Your displayed buying power can change as positions,
            cash balances and margin requirements change.
        `,


        "margin-call": `
            A <strong>margin call</strong> can occur when the equity
            in a margin account falls below a required level.
            <br><br>
            This can happen when securities held in the account
            decline in value or when margin requirements change.
            <br><br>
            The account holder may be required to deposit additional
            funds or securities, or reduce positions.
            <br><br>
            Depending on the broker and circumstances, positions
            may also be liquidated without waiting for the investor
            to take action.
        `,


        "maintenance-margin": `
            <strong>Maintenance margin</strong> is the minimum amount
            of equity that generally must be maintained in a margin
            account relative to its positions.
            <br><br>
            If account equity falls below the required level, the
            account may become subject to a margin call or other
            broker action.
            <br><br>
            Maintenance requirements can vary by broker, security
            and market conditions, and brokers may impose requirements
            above regulatory minimums.
        `,


        "cash-vs-margin": `
            A <strong>cash account</strong> generally requires
            purchases to be paid for using the investor's own
            available funds.
            <br><br>
            A <strong>margin account</strong> may allow eligible
            investors to borrow against assets in the account,
            providing additional buying power.
            <br><br>
            Margin accounts therefore introduce additional factors
            including borrowing costs, margin requirements and the
            possibility of forced liquidation.
            <br><br>
            Exact features and rules depend on the broker.
        `,


        "market-order": `
            A <strong>market order</strong> instructs a broker to
            execute an order at the best available market price.
            <br><br>
            It generally prioritises execution rather than a specific
            price.
            <br><br>
            The final execution price is not guaranteed and can differ
            from the price visible when the order was submitted,
            particularly in fast-moving or less liquid stocks.
        `,


        "limit-order": `
            A <strong>limit order</strong> specifies the maximum price
            you are willing to pay when buying, or the minimum price
            you are willing to accept when selling.
            <br><br>
            It gives you more control over execution price than a
            market order.
            <br><br>
            However, reaching the limit price does not guarantee that
            the order will execute. There may not be enough shares
            available to fill the order.
        `,


        "stop-order": `
            A <strong>stop order</strong> becomes active after a
            specified stop price is reached.
            <br><br>
            A standard stop order typically becomes a market order
            once triggered, which means the final execution price is
            not guaranteed.
            <br><br>
            During fast price movements or price gaps, execution can
            occur significantly away from the stop price.
            <br><br>
            Brokers may offer several different types of stop orders,
            so their exact behaviour should always be checked.
        `,


        "short-selling": `
            <strong>Short selling</strong> generally involves selling
            borrowed shares with the expectation of later buying shares
            back to return to the lender.
            <br><br>
            Unlike owning a stock, where the share price cannot fall
            below zero, a rising share price creates increasing losses
            for a short position.
            <br><br>
            Short selling can involve borrowing costs, margin
            requirements and restrictions on whether shares are
            available to borrow.
            <br><br>
            Broker rules and availability vary.
        `,


        "position-sizing": `
            <strong>Position sizing</strong> is the process of deciding
            how much capital or how many shares are allocated to a
            particular trade.
            <br><br>
            It is an important part of risk management because the
            same percentage price movement has a very different effect
            on an account depending on the size of the position.
            <br><br>
            EdgeBreak can explain position-sizing concepts, but it
            does not determine how much an individual should invest
            or recommend a position size.
        `,


        "settlement": `
            <strong>Trade settlement</strong> is the process that
            completes a securities transaction after the trade has
            executed.
            <br><br>
            Settlement determines when securities and funds officially
            transfer between the parties involved in the transaction.
            <br><br>
            This can affect when funds are considered settled and
            available for certain transactions, particularly in cash
            accounts.
            <br><br>
            Settlement rules can vary by market and security, so
            current requirements should be confirmed with your broker.
        `

    };


    /* =====================================================
       OPEN MARGIN SCREEN
    ===================================================== */

    marginButton.addEventListener(
        "click",
        function() {

            categories.hidden = true;
            marginScreen.hidden = false;

            conversation.scrollTop = 0;

        }
    );


    /* =====================================================
       BACK TO MAIN MENU
    ===================================================== */

    backButton.addEventListener(
        "click",
        function() {

            marginScreen.hidden = true;
            categories.hidden = false;

            conversation.scrollTop = 0;

        }
    );


    /* =====================================================
       QUESTION BUTTONS
    ===================================================== */

    const questionButtons =
        marginScreen.querySelectorAll(
            "[data-chat-margin-question]"
        );


    questionButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const question =
                        button.dataset.chatMarginQuestion;

                    const questionText =
                        button.querySelector(
                            "span:first-child"
                        )?.textContent.trim() ||
                        "Margin & My Trading Account";

                    const answer =
                        answers[question];

                    if (!answer) {
                        return;
                    }


                    /* USER MESSAGE */

                    const userMessage =
                        document.createElement("div");

                    userMessage.className =
                        "edge-chat-message edge-chat-message-user";

                    userMessage.innerHTML = `
                        <div class="edge-chat-message-bubble">
                            <strong>
                                ${questionText}
                            </strong>
                        </div>
                    `;


                    /* EDGEBREAK ANSWER */

                    const aiMessage =
                        document.createElement("div");

                    aiMessage.className =
                        "edge-chat-message edge-chat-message-ai";

                    aiMessage.innerHTML = `
                        <div class="edge-chat-message-bubble">
                            ${answer}
                        </div>
                    `;


                    /* BACK BUTTON */

                    const answerBackRow =
                        document.createElement("div");

                    answerBackRow.className =
                        "edge-chat-answer-back-row";

                    const answerBackButton =
                        document.createElement("button");

                    answerBackButton.type =
                        "button";

                    answerBackButton.className =
                        "edge-chat-back";

                    answerBackButton.textContent =
                        "← Back to Margin & My Trading Account";

                    answerBackRow.appendChild(
                        answerBackButton
                    );


                    /* HIDE QUESTION SCREEN */

                    marginScreen.hidden = true;


                    /* DISPLAY ANSWER */

                    conversation.appendChild(
                        userMessage
                    );

                    conversation.appendChild(
                        aiMessage
                    );

                    conversation.appendChild(
                        answerBackRow
                    );


                    /* BACK TO MARGIN QUESTIONS */

                    answerBackButton.addEventListener(
                        "click",
                        function() {

                            userMessage.remove();
                            aiMessage.remove();
                            answerBackRow.remove();

                            marginScreen.hidden =
                                false;

                            conversation.scrollTop =
                                0;

                        }
                    );


                    conversation.scrollTop =
                        conversation.scrollHeight;

                }
            );

        }
    );

})();

/* =========================================================
   EDGEBREAK AI CHAT
   ENTERING & EXITING TRADES
========================================================= */

(function initEdgeBreakTradeSection() {

    const categories =
        document.getElementById(
            "edgeBreakChatCategories"
        );

    const tradeScreen =
        document.getElementById(
            "edgeBreakTradeScreen"
        );

    const tradeButton =
        document.querySelector(
            '[data-chat-category="trade"]'
        );

    const conversation =
        document.getElementById(
            "edgeBreakChatConversation"
        );

    const backButton =
        tradeScreen?.querySelector(
            '[data-chat-back="main"]'
        );


    /* -----------------------------------------------------
       SAFETY CHECK
    ----------------------------------------------------- */

    if (
        !categories ||
        !tradeScreen ||
        !tradeButton ||
        !conversation ||
        !backButton
    ) {

        console.warn(
            "EdgeBreak Trade elements not found."
        );

        return;

    }


    /* =====================================================
       ANSWERS
    ===================================================== */

    const answers = {


        /* -------------------------------------------------
           #1 BEFORE ENTERING
        ------------------------------------------------- */

        "before-entry": `

            Before entering a trade, it helps to understand
            <strong>why you are considering the trade</strong>
            and what would make that idea no longer valid.
            <br><br>
            Traders commonly check:
            <br><br>
            • The current price structure.<br>
            • Nearby support and resistance.<br>
            • Whether price is inside, below or above a
            trading range.<br>
            • Recent volume and relative volume.<br>
            • How far price has already moved.<br>
            • Upcoming company or market events.<br>
            • The amount of capital they are prepared to risk.
            <br><br>
            Planning these things before entering can reduce
            the temptation to make decisions emotionally once
            money is involved.

        `,


        /* -------------------------------------------------
           #2 ENTRY POINT
        ------------------------------------------------- */

        "entry-point": `

            Traders use different methods to decide where to
            enter a position.
            <br><br>
            Some wait for price to move through an identified
            <strong>resistance level</strong>. Others look for
            entries near support or after price pulls back
            following a breakout.
            <br><br>
            The important part is that an entry normally has
            a reason behind it.
            <br><br>
            Instead of simply entering because a stock is
            rising, a trader may define the technical level
            they are watching, what confirmation they want to
            see and what would invalidate the setup.
            <br><br>
            There is no single entry method that is correct
            for every trader or every stock.

        `,


        /* -------------------------------------------------
           #3 BEFORE OR AFTER BREAKOUT
        ------------------------------------------------- */

        "before-after-breakout": `

            Entering <strong>before</strong> and
            <strong>after</strong> a breakout involve
            different trade-offs.
            <br><br>
            <strong>Before a breakout:</strong><br>
            Price has not yet confirmed that it can move
            through resistance. An entry may be closer to the
            trading range, but the breakout may never occur.
            <br><br>
            <strong>After a breakout:</strong><br>
            Price has moved through the identified resistance
            area, but the entry may be further from the
            original setup and the breakout can still fail.
            <br><br>
            Some traders also wait for a breakout followed by
            a pullback or retest.
            <br><br>
            EdgeBreak can show you where a stock is relative
            to its identified technical structure, but it
            does not decide which entry approach you should
            use.

        `,


        /* -------------------------------------------------
           #4 CHASING PRICE
        ------------------------------------------------- */

        "chasing": `

            Chasing occurs when a trader enters after price
            has already made a substantial move, often because
            they are worried about missing it.
            <br><br>
            The further price moves away from the original
            technical setup, the more the characteristics of
            the trade can change.
            <br><br>
            For example:
            <br><br>
            • The distance to nearby support may increase.<br>
            • A logical exit level may become much further
            away.<br>
            • Short-term traders may begin taking profits.<br>
            • Price may pull back toward the breakout area.<br>
            • The entry may be driven by FOMO rather than the
            original setup.
            <br><br>
            A strong price move does not automatically mean
            the stock will continue moving in the same
            direction.

        `,


        /* -------------------------------------------------
           #5 SUPPORT / RESISTANCE ENTRY
        ------------------------------------------------- */

        "support-resistance-entry": `

            Support and resistance can give a trader
            <strong>reference points</strong> when planning an
            entry.
            <br><br>
            <strong>Resistance</strong> is an area where price
            has previously struggled to move higher.
            <br><br>
            <strong>Support</strong> is an area where buying
            interest has previously been strong enough to
            interrupt or reverse a decline.
            <br><br>
            A trader might watch how price behaves near one of
            these areas rather than entering at an arbitrary
            price.
            <br><br>
            These are zones rather than guaranteed barriers.
            Price can move through either support or
            resistance.

        `,


        /* -------------------------------------------------
           #6 POSITION SIZE
        ------------------------------------------------- */

        "position-size": `

            Position size determines how much of your capital
            is exposed to a particular trade.
            <br><br>
            Before choosing a position size, traders often
            consider:
            <br><br>
            • Their total account size.<br>
            • How much they are prepared to lose if the trade
            fails.<br>
            • The distance between the entry and their planned
            exit level.<br>
            • The stock's volatility.<br>
            • Liquidity.<br>
            • Other positions already held.
            <br><br>
            A larger position increases both potential gains
            and potential losses.
            <br><br>
            Position sizing is therefore usually considered
            together with risk rather than simply asking how
            many shares a trader can afford to buy.

        `,


        /* -------------------------------------------------
           #7 PLAN AN EXIT
        ------------------------------------------------- */

        "plan-exit": `

            Many traders think about their exit
            <strong>before entering the trade</strong>.
            <br><br>
            This can include considering:
            <br><br>
            • What would show that the original setup has
            failed.<br>
            • Whether there is a technical level they are
            using to control risk.<br>
            • How they would respond if price moves strongly
            in their favour.<br>
            • Whether they intend to exit the entire position
            or reduce it gradually.<br>
            • Upcoming events that could materially change
            the stock.
            <br><br>
            Having a plan does not mean it can never change.
            It gives the trader a framework for making
            decisions instead of reacting only to short-term
            price movement.

        `,


        /* -------------------------------------------------
           #8 STOP LOSS
        ------------------------------------------------- */

        "stop-loss": `

            A <strong>stop-loss</strong> is an instruction
            designed to trigger an exit when a security
            reaches a specified price.
            <br><br>
            Traders use stop orders as one method of limiting
            the amount of capital exposed if a trade moves
            against them.
            <br><br>
            However, a stop price does not guarantee the exact
            execution price.
            <br><br>
            If a stock moves rapidly or gaps through the stop
            level, the eventual execution price can be
            different from the stop price.
            <br><br>
            The exact behaviour can also depend on the type of
            stop order and the broker being used.

        `,


        /* -------------------------------------------------
           #9 TRAILING STOP
        ------------------------------------------------- */

        "trailing-stop": `

            A <strong>trailing stop</strong> is a type of stop
            designed to move as the price moves favourably.
            <br><br>
            Instead of remaining at one fixed price, the stop
            follows price according to a specified dollar
            amount or percentage.
            <br><br>
            If price reverses far enough to reach the trailing
            stop, the order can be triggered.
            <br><br>
            Traders sometimes use trailing stops to protect
            part of an existing gain while allowing a position
            room to continue moving.
            <br><br>
            Like other stop orders, a trailing stop does not
            guarantee the final execution price.

        `,


        /* -------------------------------------------------
           #10 PARTIAL PROFITS
        ------------------------------------------------- */

        "partial-profits": `

            Taking partial profits means selling
            <strong>part of a position</strong> while keeping
            the remainder open.
            <br><br>
            Some traders use this approach after a favourable
            move because it allows them to reduce their
            exposure while still participating if the stock
            continues higher.
            <br><br>
            For example, a trader may reduce part of a
            position and continue managing the remaining
            shares separately.
            <br><br>
            The trade-off is that reducing a position also
            means there are fewer shares participating if
            price continues to rise.
            <br><br>
            Partial profit-taking is a trading technique, not
            a requirement.

        `,


        /* -------------------------------------------------
           #11 WEAKENING SETUP
        ------------------------------------------------- */

        "setup-weakened": `

            A technical setup can change as new price and
            volume data develops.
            <br><br>
            Depending on the original setup, traders may watch
            for changes such as:
            <br><br>
            • Price failing to remain above a breakout area.<br>
            • Previously established support being broken.<br>
            • Higher lows no longer developing.<br>
            • Repeated rejection around resistance.<br>
            • A trading range losing its previous structure.<br>
            • Significant price movement occurring on unusual
            volume.
            <br><br>
            No single event automatically means a trade has
            failed.
            <br><br>
            The important question is whether the conditions
            that formed the trader's original idea still
            exist.

        `,


        /* -------------------------------------------------
           #12 EMOTIONAL DECISIONS
        ------------------------------------------------- */

        "emotional-decisions": `

            One way traders try to reduce emotional decisions
            is by making important decisions
            <strong>before entering a position</strong>.
            <br><br>
            A trading plan can define:
            <br><br>
            • Why the trade is being considered.<br>
            • The intended entry approach.<br>
            • How much capital is being exposed.<br>
            • What would invalidate the setup.<br>
            • How an exit will be handled.<br>
            • What circumstances would justify changing the
            original plan.
            <br><br>
            This can help reduce decisions driven by
            <strong>FOMO, fear, panic or greed</strong>.
            <br><br>
            The goal is not to remove emotion completely. It
            is to have a process in place before those
            emotions become stronger.

        `

    };


    /* =====================================================
       OPEN TRADE SCREEN
    ===================================================== */

    tradeButton.addEventListener(
        "click",
        function() {

            categories.hidden = true;
            tradeScreen.hidden = false;

            conversation.scrollTop = 0;

        }
    );


    /* =====================================================
       BACK TO MAIN MENU
    ===================================================== */

    backButton.addEventListener(
        "click",
        function() {

            tradeScreen.hidden = true;
            categories.hidden = false;

            conversation.scrollTop = 0;

        }
    );


    /* =====================================================
       QUESTION BUTTONS
    ===================================================== */

    const questionButtons =
        tradeScreen.querySelectorAll(
            "[data-chat-trade-question]"
        );


    questionButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const question =
                        button.dataset.chatTradeQuestion;

                    const questionText =
                        button.querySelector(
                            "span:first-child"
                        )?.textContent.trim() ||
                        "Entering & Exiting Trades";

                    const answer =
                        answers[question];

                    if (!answer) {
                        return;
                    }


                    /* USER MESSAGE */

                    const userMessage =
                        document.createElement("div");

                    userMessage.className =
                        "edge-chat-message edge-chat-message-user";

                    userMessage.innerHTML = `

                        <div class="edge-chat-message-bubble">

                            <strong>
                                ${questionText}
                            </strong>

                        </div>

                    `;


                    /* EDGEBREAK ANSWER */

                    const aiMessage =
                        document.createElement("div");

                    aiMessage.className =
                        "edge-chat-message edge-chat-message-ai";

                    aiMessage.innerHTML = `

                        <div class="edge-chat-message-icon">
                            ✦
                        </div>

                        <div class="edge-chat-message-bubble">
                            ${answer}
                        </div>

                    `;


                    /* BACK BUTTON */

                    const answerBackRow =
                        document.createElement("div");

                    answerBackRow.className =
                        "edge-chat-answer-back-row";


                    const answerBackButton =
                        document.createElement("button");

                    answerBackButton.type =
                        "button";

                    answerBackButton.className =
                        "edge-chat-back";

                    answerBackButton.textContent =
                        "← Back to Entering & Exiting Trades";


                    answerBackRow.appendChild(
                        answerBackButton
                    );


                    /* HIDE QUESTIONS */

                    tradeScreen.hidden = true;


                    /* DISPLAY ANSWER */

                    conversation.appendChild(
                        userMessage
                    );

                    conversation.appendChild(
                        aiMessage
                    );

                    conversation.appendChild(
                        answerBackRow
                    );


                    /* RETURN TO QUESTIONS */

                    answerBackButton.addEventListener(
                        "click",
                        function() {

                            userMessage.remove();
                            aiMessage.remove();
                            answerBackRow.remove();

                            tradeScreen.hidden =
                                false;

                            conversation.scrollTop =
                                0;

                        }
                    );


                    conversation.scrollTop =
                        conversation.scrollHeight;

                }
            );

        }
    );


})();

/* =========================================================
   EDGEBREAK AI CHAT
   NASDAQ & THE MARKET
========================================================= */

(function initEdgeBreakNasdaqSection() {

    const categories =
        document.getElementById(
            "edgeBreakChatCategories"
        );

    const nasdaqScreen =
        document.getElementById(
            "edgeBreakNasdaqScreen"
        );

    const nasdaqButton =
        document.querySelector(
            '[data-chat-category="nasdaq"]'
        );

    const conversation =
        document.getElementById(
            "edgeBreakChatConversation"
        );

    const backButton =
        nasdaqScreen?.querySelector(
            '[data-chat-back="main"]'
        );


    if (
        !categories ||
        !nasdaqScreen ||
        !nasdaqButton ||
        !conversation ||
        !backButton
    ) {

        console.warn(
            "EdgeBreak NASDAQ elements not found."
        );

        return;

    }


    /* =====================================================
       MARKET DATA
    ===================================================== */

    async function getNasdaqData() {

        /*
        If the user already opened the NASDAQ Market
        Overview, use the data already loaded on the page.
        */

        if (
            window.edgeBreakNasdaqOverview?.overview
        ) {

            return window.edgeBreakNasdaqOverview;

        }


        /*
        Otherwise request the same cached EdgeBreak
        NASDAQ Market Overview used by the page.
        */

        const response =
            await fetch(
                "/api/nasdaq_market_overview",
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({})

                }
            );


        const raw =
            await response.text();


        let data = {};


        try {

            data =
                JSON.parse(
                    raw
                );

        }
        catch (error) {

            throw new Error(
                "EdgeBreak market intelligence returned an invalid response."
            );

        }


        if (
            !response.ok ||
            !data.success ||
            !data.overview
        ) {

            throw new Error(
                data?.error ||
                "Today's NASDAQ market intelligence is unavailable."
            );

        }


        /*
        Keep it available for every other NASDAQ
        chatbot question during this page session.
        */

        window.edgeBreakNasdaqOverview =
            data;


        return data;

    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function safe(value) {

        return String(
            value ?? ""
        )
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function formatAreas(areas) {

        if (
            !Array.isArray(areas) ||
            !areas.length
        ) {

            return "No notable areas were identified.";

        }


        return areas
            .map(
                area => `

                    <strong>
                        ${safe(area.name)}
                    </strong>
                    <br>

                    ${safe(area.summary)}

                `
            )
            .join("<br><br>");

    }


    function formatDrivers(drivers) {

        if (
            !Array.isArray(drivers) ||
            !drivers.length
        ) {

            return "No major market drivers were identified.";

        }


        return drivers
            .map(
                driver => `

                    <strong>
                        ${safe(driver.headline)}
                    </strong>
                    <br>

                    ${safe(driver.summary)}

                `
            )
            .join("<br><br>");

    }


    function formatEvents(events) {

        if (
            !Array.isArray(events) ||
            !events.length
        ) {

            return "No major scheduled events were identified.";

        }


        return events
            .map(
                event => `

                    <strong>
                        ${safe(event.date)}
                        ${event.event
                            ? ` — ${safe(event.event)}`
                            : ""
                        }
                    </strong>
                    <br>

                    ${safe(event.whyItMatters)}

                `
            )
            .join("<br><br>");

    }


    function getScannerCount(names) {

        for (const name of names) {

            const value =
                window[name];


            if (
                Array.isArray(value)
            ) {

                return value.length;

            }

        }


        return null;

    }


    function getScannerCounts() {

        return {

            breakout:
                getScannerCount([
                    "breakoutData",
                    "breakoutStocks",
                    "breakoutResults",
                    "breakouts"
                ]),

            preBreakout:
                getScannerCount([
                    "preBreakoutData",
                    "preBreakoutStocks",
                    "preBreakoutResults",
                    "preBreakouts"
                ]),

            launchPad:
                getScannerCount([
                    "launchPadData",
                    "launchpadData",
                    "launchPadStocks",
                    "launchpadStocks",
                    "launchPadResults"
                ])

        };

    }


    function scannerCountAnswer() {

        const counts =
            getScannerCounts();


        const parts = [];


        if (
            counts.breakout !== null
        ) {

            parts.push(
                `<strong>${counts.breakout}</strong> Breakout setups`
            );

        }


        if (
            counts.preBreakout !== null
        ) {

            parts.push(
                `<strong>${counts.preBreakout}</strong> Pre-Breakout setups`
            );

        }


        if (
            counts.launchPad !== null
        ) {

            parts.push(
                `<strong>${counts.launchPad}</strong> Launch Pad setups`
            );

        }


        if (!parts.length) {

            return `
                Today's scanner counts are not currently
                available in this page session.
            `;

        }


        const total =
            [
                counts.breakout,
                counts.preBreakout,
                counts.launchPad
            ]
                .filter(
                    value =>
                        Number.isFinite(value)
                )
                .reduce(
                    (sum, value) =>
                        sum + value,
                    0
                );


        return `

            EdgeBreak is currently displaying:
            <br><br>

            ${parts.join("<br>")}
            <br><br>

            That's
            <strong>${total} technical setups</strong>
            across the available scanner datasets.
            <br><br>

            Scanner counts describe how many stocks
            currently meet EdgeBreak's technical rules.
            They should be considered alongside the
            broader NASDAQ market environment.

        `;

    }


    /* =====================================================
       BUILD ANSWER
    ===================================================== */

    function buildAnswer(
        question,
        data
    ) {

        const overview =
            data.overview || {};


        const composite =
            overview.nasdaqComposite || {};


        const nasdaq100 =
            overview.nasdaq100 || {};


        switch (question) {


            /* ---------------------------------------------
               #1 NASDAQ TODAY
            --------------------------------------------- */

            case "nasdaq-today":

                return `

                    <strong>NASDAQ Composite:</strong>
                    ${safe(
                        composite.changePercent || "—"
                    )}
                    <br><br>

                    ${safe(
                        composite.summary || ""
                    )}

                    <br><br>

                    <strong>NASDAQ-100:</strong>
                    ${safe(
                        nasdaq100.changePercent || "—"
                    )}
                    <br><br>

                    ${safe(
                        nasdaq100.summary || ""
                    )}

                    <br><br>

                    ${safe(
                        overview.marketSummary || ""
                    )}

                `;


            /* ---------------------------------------------
               #2 SESSION STRENGTH
            --------------------------------------------- */

            case "session-strength":

                return `

                    ${safe(
                        overview.marketSummary ||
                        composite.summary ||
                        "Today's market summary is unavailable."
                    )}

                    <br><br>

                    <strong>NASDAQ Composite:</strong>
                    ${safe(
                        composite.changePercent || "—"
                    )}

                    <br>

                    <strong>NASDAQ-100:</strong>
                    ${safe(
                        nasdaq100.changePercent || "—"
                    )}

                `;


            /* ---------------------------------------------
               #3 MARKET BREADTH
            --------------------------------------------- */

            case "market-breadth":

                return `

                    ${
                        safe(
                            overview.marketBreadth ||
                            overview.breadth ||
                            overview.marketSummary ||
                            "EdgeBreak did not return a separate market-breadth summary for this session."
                        )
                    }

                    <br><br>

                    Market breadth matters because a
                    headline index can sometimes be moved
                    significantly by a relatively small
                    number of very large companies.

                `;


            /* ---------------------------------------------
               #4 STRONG AREAS
            --------------------------------------------- */

            case "strongest-areas":

                return `

                    <strong>
                        Stronger NASDAQ areas from the
                        completed session:
                    </strong>

                    <br><br>

                    ${formatAreas(
                        overview.strongAreas
                    )}

                `;


            /* ---------------------------------------------
               #5 WEAK AREAS
            --------------------------------------------- */

            case "weakest-areas":

                return `

                    <strong>
                        Weaker NASDAQ areas from the
                        completed session:
                    </strong>

                    <br><br>

                    ${formatAreas(
                        overview.weakAreas
                    )}

                `;


            /* ---------------------------------------------
               #6 MARKET DRIVERS
            --------------------------------------------- */

            case "market-drivers":

                return `

                    <strong>
                        Important drivers EdgeBreak identified
                        for the completed NASDAQ session:
                    </strong>

                    <br><br>

                    ${formatDrivers(
                        overview.marketDrivers
                    )}

                `;


            /* ---------------------------------------------
               #7 MAJOR MOVERS
            --------------------------------------------- */

            case "major-movers":

                return `

                    ${
                        safe(
                            overview.majorMovers ||
                            overview.notableMovers ||
                            overview.nasdaq100?.summary ||
                            "A separate major-movers list was not returned in today's market overview."
                        )
                    }

                    <br><br>

                    For individual company research, you can
                    also use EdgeBreak AI Stock Research from
                    the scanner.

                `;


            /* ---------------------------------------------
               #8 SCANNER ACTIVITY
            --------------------------------------------- */

            case "scanner-activity":

                return scannerCountAnswer();


            /* ---------------------------------------------
               #9 WHAT SCANNER ACTIVITY MEANS
            --------------------------------------------- */

            case "scanner-market":

                return `

                    EdgeBreak scanner activity shows how many
                    NASDAQ stocks are currently meeting the
                    platform's technical setup rules.
                    <br><br>

                    A larger number of qualifying setups can
                    indicate that technical structures are
                    appearing across more stocks, while fewer
                    qualifying setups can indicate a more
                    limited opportunity set.
                    <br><br>

                    Scanner activity should not be interpreted
                    by itself as proof that the overall market
                    is bullish or bearish.
                    <br><br>

                    ${scannerCountAnswer()}

                `;


            /* ---------------------------------------------
               #10 STOCKS VS NASDAQ
            --------------------------------------------- */

            case "stocks-vs-nasdaq":

                return `

                    <strong>Yes.</strong>
                    Individual stocks can rise even when the
                    NASDAQ is falling.
                    <br><br>

                    The NASDAQ contains thousands of companies
                    across different industries. Individual
                    stocks can respond to company news,
                    earnings, sector strength, technical
                    breakouts or other stock-specific factors
                    even during a weaker overall market.
                    <br><br>

                    However, the broader market environment
                    can still influence individual stocks,
                    which is why EdgeBreak provides both
                    stock-level scanner research and broader
                    NASDAQ market intelligence.

                `;


            /* ---------------------------------------------
               #11 UPCOMING EVENTS
            --------------------------------------------- */

            case "upcoming-events":

                return `

                    <strong>
                        Important events ahead:
                    </strong>

                    <br><br>

                    ${formatEvents(
                        overview.upcomingEvents
                    )}

                    <br><br>

                    These are upcoming events provided as
                    context for the next trading session or
                    sessions.

                `;


            /* ---------------------------------------------
               #12 BIG PICTURE
            --------------------------------------------- */

            case "big-picture":

                return `

                    <strong>
                        NASDAQ Big Picture
                    </strong>

                    <br><br>

                    ${safe(
                        overview.marketSummary || ""
                    )}

                    <br><br>

                    <strong>NASDAQ Composite:</strong>
                    ${safe(
                        composite.changePercent || "—"
                    )}

                    <br>

                    <strong>NASDAQ-100:</strong>
                    ${safe(
                        nasdaq100.changePercent || "—"
                    )}

                    <br><br>

                    <strong>EdgeBreak takeaway:</strong>
                    <br>

                    ${safe(
                        overview.takeaway || ""
                    )}

                `;


            default:

                return `
                    Today's NASDAQ market information
                    is unavailable for this question.
                `;

        }

    }


    /* =====================================================
       OPEN NASDAQ SCREEN
    ===================================================== */

    nasdaqButton.addEventListener(
        "click",
        function() {

            categories.hidden =
                true;

            nasdaqScreen.hidden =
                false;

            conversation.scrollTop =
                0;

        }
    );


    /* =====================================================
       BACK TO MAIN
    ===================================================== */

    backButton.addEventListener(
        "click",
        function() {

            nasdaqScreen.hidden =
                true;

            categories.hidden =
                false;

            conversation.scrollTop =
                0;

        }
    );


    /* =====================================================
       QUESTION BUTTONS
    ===================================================== */

    const questionButtons =
        nasdaqScreen.querySelectorAll(
            "[data-chat-nasdaq-question]"
        );


    questionButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                async function() {

                    const question =
                        button.dataset
                            .chatNasdaqQuestion;


                    const questionText =
                        button.querySelector(
                            "span:first-child"
                        )?.textContent.trim() ||
                        "NASDAQ & The Market";


                    /*
                    Prevent double clicks while
                    market data is loading.
                    */

                    questionButtons.forEach(
                        item =>
                            item.disabled = true
                    );


                    try {


                        /* USER MESSAGE */

                        const userMessage =
                            document.createElement(
                                "div"
                            );

                        userMessage.className =
                            "edge-chat-message edge-chat-message-user";

                        userMessage.innerHTML = `

                            <div class="edge-chat-message-bubble">

                                <strong>
                                    ${safe(questionText)}
                                </strong>

                            </div>

                        `;


                        /* LOADING MESSAGE */

                        const loadingMessage =
                            document.createElement(
                                "div"
                            );

                        loadingMessage.className =
                            "edge-chat-message edge-chat-message-ai";

                        loadingMessage.innerHTML = `

                            <div class="edge-chat-message-icon">
                                ✦
                            </div>

                            <div class="edge-chat-message-bubble">
                                Loading today's EdgeBreak
                                NASDAQ market intelligence...
                            </div>

                        `;


                        nasdaqScreen.hidden =
                            true;


                        conversation.appendChild(
                            userMessage
                        );

                        conversation.appendChild(
                            loadingMessage
                        );


                        conversation.scrollTop =
                            conversation.scrollHeight;


                        /* GET CACHED / CURRENT DATA */

                        const data =
                            await getNasdaqData();


                        loadingMessage.remove();


                        /* ANSWER */

                        const aiMessage =
                            document.createElement(
                                "div"
                            );

                        aiMessage.className =
                            "edge-chat-message edge-chat-message-ai";

                        aiMessage.innerHTML = `

                            <div class="edge-chat-message-icon">
                                ✦
                            </div>

                            <div class="edge-chat-message-bubble">

                                ${buildAnswer(
                                    question,
                                    data
                                )}

                            </div>

                        `;


                        /* BACK */

                        const answerBackRow =
                            document.createElement(
                                "div"
                            );

                        answerBackRow.className =
                            "edge-chat-answer-back-row";


                        const answerBackButton =
                            document.createElement(
                                "button"
                            );

                        answerBackButton.type =
                            "button";

                        answerBackButton.className =
                            "edge-chat-back";

                        answerBackButton.textContent =
                            "← Back to NASDAQ & The Market";


                        answerBackRow.appendChild(
                            answerBackButton
                        );


                        conversation.appendChild(
                            aiMessage
                        );

                        conversation.appendChild(
                            answerBackRow
                        );


                        answerBackButton.addEventListener(
                            "click",
                            function() {

                                userMessage.remove();
                                aiMessage.remove();
                                answerBackRow.remove();

                                nasdaqScreen.hidden =
                                    false;

                                conversation.scrollTop =
                                    0;

                            }
                        );


                        conversation.scrollTop =
                            conversation.scrollHeight;

                    }
                    catch (error) {

                        console.error(
                            "EdgeBreak NASDAQ Chat Error:",
                            error
                        );


                        const errorMessage =
                            document.createElement(
                                "div"
                            );

                        errorMessage.className =
                            "edge-chat-message edge-chat-message-ai";

                        errorMessage.innerHTML = `

                            <div class="edge-chat-message-icon">
                                ✦
                            </div>

                            <div class="edge-chat-message-bubble">

                                Today's EdgeBreak NASDAQ
                                market intelligence is
                                temporarily unavailable.

                            </div>

                        `;


                        conversation.appendChild(
                            errorMessage
                        );


                        const errorBackRow =
                            document.createElement(
                                "div"
                            );

                        errorBackRow.className =
                            "edge-chat-answer-back-row";


                        const errorBackButton =
                            document.createElement(
                                "button"
                            );

                        errorBackButton.type =
                            "button";

                        errorBackButton.className =
                            "edge-chat-back";

                        errorBackButton.textContent =
                            "← Back to NASDAQ & The Market";


                        errorBackRow.appendChild(
                            errorBackButton
                        );

                        conversation.appendChild(
                            errorBackRow
                        );


                        errorBackButton.addEventListener(
                            "click",
                            function() {

                                errorMessage.remove();
                                errorBackRow.remove();

                                nasdaqScreen.hidden =
                                    false;

                            }
                        );

                    }
                    finally {

                        questionButtons.forEach(
                            item =>
                                item.disabled = false
                        );

                    }

                }
            );

        }
    );


})();

/* =========================================================
   EDGEBREAK AI CHAT
   SECTORS & TRENDS
========================================================= */

(function initEdgeBreakSectorSection() {

    const categories =
        document.getElementById(
            "edgeBreakChatCategories"
        );

    const sectorScreen =
        document.getElementById(
            "edgeBreakSectorScreen"
        );

    const sectorButton =
        document.querySelector(
            '[data-chat-category="sector"]'
        );

    const conversation =
        document.getElementById(
            "edgeBreakChatConversation"
        );

    const backButton =
        sectorScreen?.querySelector(
            '[data-chat-back="main"]'
        );


    /* =====================================================
       SAFETY CHECK
    ===================================================== */

    if (
        !categories ||
        !sectorScreen ||
        !sectorButton ||
        !conversation ||
        !backButton
    ) {

        console.warn(
            "EdgeBreak Sector elements not found."
        );

        return;

    }


    /* =====================================================
       SAFE HTML
    ===================================================== */

    function safe(value) {

        return String(
            value ?? ""
        )
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    /* =====================================================
       CURRENT MARKET DATA

       Reuses the NASDAQ Market Overview already loaded
       by EdgeBreak AI where possible.
    ===================================================== */

    async function getSectorMarketData() {

        if (
            window.edgeBreakNasdaqOverview?.overview
        ) {

            return window.edgeBreakNasdaqOverview;

        }


        const response =
            await fetch(
                "/api/nasdaq_market_overview",
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({})

                }
            );


        const raw =
            await response.text();


        let data = {};


        try {

            data =
                JSON.parse(
                    raw
                );

        }
        catch (error) {

            throw new Error(
                "EdgeBreak market intelligence returned an invalid response."
            );

        }


        if (
            !response.ok ||
            !data.success ||
            !data.overview
        ) {

            throw new Error(
                data?.error ||
                "Today's sector intelligence is unavailable."
            );

        }


        window.edgeBreakNasdaqOverview =
            data;


        return data;

    }


    /* =====================================================
       FORMAT STRONG / WEAK AREAS
    ===================================================== */

    function formatAreas(areas) {

        if (
            !Array.isArray(areas) ||
            !areas.length
        ) {

            return `
                No notable sector or industry
                leadership was identified.
            `;

        }


        return areas
            .map(
                area => `

                    <strong>
                        ${safe(area.name)}
                    </strong>
                    <br>

                    ${safe(area.summary)}

                `
            )
            .join("<br><br>");

    }


    /* =====================================================
       FIND TECHNOLOGY AREA

       We do NOT assume technology was strong.
       We only report what today's overview actually says.
    ===================================================== */

    function findTechnologyAreas(
        strongAreas,
        weakAreas
    ) {

        const technologyTerms = [
            "technology",
            "tech",
            "software",
            "semiconductor",
            "semiconductors",
            "chip",
            "chips",
            "hardware"
        ];


        function matches(area) {

            const text =
                `${area?.name || ""} ${area?.summary || ""}`
                    .toLowerCase();


            return technologyTerms.some(
                term =>
                    text.includes(term)
            );

        }


        const strongTech =
            Array.isArray(strongAreas)
                ? strongAreas.filter(matches)
                : [];


        const weakTech =
            Array.isArray(weakAreas)
                ? weakAreas.filter(matches)
                : [];


        return {
            strongTech,
            weakTech
        };

    }


    /* =====================================================
       STATIC EDUCATIONAL ANSWERS
    ===================================================== */

    const answers = {


        /* -------------------------------------------------
           #3 WHY SECTOR STRENGTH MATTERS
        ------------------------------------------------- */

        "why-sector-strength": `

            Sector conditions provide useful
            <strong>context</strong> when researching an
            individual stock.
            <br><br>
            Companies within the same sector can be influenced
            by similar factors such as demand, interest rates,
            commodity prices, regulation, technology trends or
            investor sentiment.
            <br><br>
            If several companies from the same area are
            strengthening together, the move may reflect
            broader sector participation rather than one
            company acting alone.
            <br><br>
            Sector strength does not guarantee that an
            individual stock will rise. It simply gives you
            another piece of information when evaluating the
            stock's technical and market environment.

        `,


        /* -------------------------------------------------
           #4 STOCK RISING IN WEAK SECTOR
        ------------------------------------------------- */

        "stock-rise-weak-sector": `

            <strong>Yes.</strong> An individual stock can rise
            while its broader sector is weak.
            <br><br>
            Company-specific factors such as earnings, new
            products, contracts, regulatory developments or
            unusually strong demand for the shares can cause
            a stock to behave differently from its peers.
            <br><br>
            When a stock remains strong while many companies
            around it are weak, traders sometimes describe
            that as <strong>relative strength</strong>.
            <br><br>
            That does not mean the stock is immune from broader
            sector weakness, but the difference can be useful
            research information.

        `,


        /* -------------------------------------------------
           #5 STRONG SECTOR HELP
        ------------------------------------------------- */

        "strong-sector-help": `

            A strong sector can provide a
            <strong>supportive market environment</strong> for
            companies within that area.
            <br><br>
            When investors are increasing exposure to a
            particular industry or theme, several related
            stocks may experience stronger demand at the same
            time.
            <br><br>
            This can help explain why technical setups
            sometimes appear across multiple stocks from the
            same area.
            <br><br>
            But sector strength does not make every company
            within the sector equally strong. The individual
            company's price structure, volume, liquidity and
            company-specific developments still matter.

        `,


        /* -------------------------------------------------
           #6 SECTOR ROTATION
        ------------------------------------------------- */

        "sector-rotation": `

            <strong>Sector rotation</strong> describes capital
            moving between different areas of the market.
            <br><br>
            For example, investors may reduce exposure to one
            group of companies while increasing exposure to
            another because of changing economic expectations,
            interest rates, earnings trends or market
            sentiment.
            <br><br>
            This can cause previously strong sectors to weaken
            while other sectors begin showing stronger price
            performance.
            <br><br>
            Rotation is usually better viewed as a developing
            pattern across groups of stocks rather than a
            single day's movement.

        `,


        /* -------------------------------------------------
           #7 ROTATION INTO SECTOR
        ------------------------------------------------- */

        "rotation-into-sector": `

            There is no single measurement that proves money
            is rotating into a sector.
            <br><br>
            Traders may look for several pieces of evidence,
            including:
            <br><br>
            • Multiple stocks in the sector strengthening
            together.<br>
            • Improving trading volume.<br>
            • More stocks forming or completing technical
            breakouts.<br>
            • The sector outperforming the broader market.<br>
            • Strength continuing across multiple trading
            sessions rather than appearing for only one day.
            <br><br>
            EdgeBreak's scanner activity can also provide
            useful context if technical setups begin appearing
            across several companies from the same area.

        `,


        /* -------------------------------------------------
           #8 COMPARE WITH SECTOR
        ------------------------------------------------- */

        "compare-sector": `

            Comparing a stock with other companies in the same
            sector can provide useful context.
            <br><br>
            You might ask:
            <br><br>
            • Are several related stocks moving higher?<br>
            • Is this stock outperforming its peers?<br>
            • Is the entire sector weak while this stock
            remains strong?<br>
            • Are technical breakouts appearing across the
            group?<br>
            • Is the movement company-specific or part of a
            broader sector trend?
            <br><br>
            The comparison does not determine whether a stock
            is a good trade. It helps explain the environment
            in which the stock is moving.

        `,


        /* -------------------------------------------------
           #9 STRONGER THAN SECTOR
        ------------------------------------------------- */

        "stronger-than-sector": `

            If a stock is performing better than its broader
            sector, it is showing
            <strong>relative strength</strong> compared with
            that group.
            <br><br>
            For example, the sector may be falling while the
            stock remains stable, or the sector may be rising
            while the individual stock rises more strongly.
            <br><br>
            That difference can indicate that stock-specific
            demand or company developments are having a
            stronger influence than the broader sector.
            <br><br>
            Relative strength is useful context, but it does
            not guarantee that the stock will continue to
            outperform.

        `,


        /* -------------------------------------------------
           #10 WEAKER THAN SECTOR
        ------------------------------------------------- */

        "weaker-than-sector": `

            If a stock is underperforming while its broader
            sector is strong, it is showing
            <strong>relative weakness</strong>.
            <br><br>
            That can be worth investigating because the stock
            is not participating in the same way as many of
            its peers.
            <br><br>
            Possible explanations can include company-specific
            news, earnings, valuation concerns, technical
            resistance or simply weaker demand for that
            particular stock.
            <br><br>
            Relative weakness does not explain the cause by
            itself. It identifies a difference that may deserve
            further research.

        `

    };


    /* =====================================================
       BUILD CURRENT MARKET ANSWER
    ===================================================== */

    function buildCurrentAnswer(
        question,
        data
    ) {

        const overview =
            data?.overview || {};


        switch (question) {


            /* ---------------------------------------------
               #1 STRONGEST SECTORS
            --------------------------------------------- */

            case "strongest-sectors":

                return `

                    <strong>
                        Stronger areas from the completed
                        NASDAQ session:
                    </strong>

                    <br><br>

                    ${formatAreas(
                        overview.strongAreas
                    )}

                `;


            /* ---------------------------------------------
               #2 WEAKEST SECTORS
            --------------------------------------------- */

            case "weakest-sectors":

                return `

                    <strong>
                        Weaker areas from the completed
                        NASDAQ session:
                    </strong>

                    <br><br>

                    ${formatAreas(
                        overview.weakAreas
                    )}

                `;


            /* ---------------------------------------------
               #11 TECHNOLOGY LEADERSHIP
            --------------------------------------------- */

            case "technology-leading": {

                const tech =
                    findTechnologyAreas(
                        overview.strongAreas,
                        overview.weakAreas
                    );


                if (
                    tech.strongTech.length &&
                    !tech.weakTech.length
                ) {

                    return `

                        Technology-related areas appeared among
                        the <strong>stronger areas</strong>
                        identified by EdgeBreak for the
                        completed session.
                        <br><br>

                        ${formatAreas(
                            tech.strongTech
                        )}

                        <br><br>

                        This describes today's market
                        leadership. It does not mean every
                        technology stock was strong.

                    `;

                }


                if (
                    tech.weakTech.length &&
                    !tech.strongTech.length
                ) {

                    return `

                        Technology-related areas appeared among
                        the <strong>weaker areas</strong>
                        identified by EdgeBreak for the
                        completed session.
                        <br><br>

                        ${formatAreas(
                            tech.weakTech
                        )}

                        <br><br>

                        Individual technology stocks may still
                        have performed differently from the
                        broader group.

                    `;

                }


                if (
                    tech.strongTech.length &&
                    tech.weakTech.length
                ) {

                    return `

                        Today's technology picture was
                        <strong>mixed</strong>.
                        <br><br>

                        Some technology-related areas appeared
                        among EdgeBreak's stronger groups:
                        <br><br>

                        ${formatAreas(
                            tech.strongTech
                        )}

                        <br><br>

                        Other technology-related areas appeared
                        among the weaker groups:
                        <br><br>

                        ${formatAreas(
                            tech.weakTech
                        )}

                    `;

                }


                return `

                    EdgeBreak's current market overview did not
                    identify a technology-related group clearly
                    enough among today's strongest or weakest
                    areas to call technology the market leader.
                    <br><br>

                    That does not mean technology was unchanged.
                    It means the current EdgeBreak overview does
                    not provide enough evidence to label it as
                    today's clear leader.

                `;

            }


            /* ---------------------------------------------
               #12 SECTOR PICTURE
            --------------------------------------------- */

            case "sector-picture":

                return `

                    <strong>
                        Today's Sector Picture
                    </strong>

                    <br><br>

                    <strong>Stronger areas</strong>
                    <br><br>

                    ${formatAreas(
                        overview.strongAreas
                    )}

                    <br><br>

                    <strong>Weaker areas</strong>
                    <br><br>

                    ${formatAreas(
                        overview.weakAreas
                    )}

                    ${
                        overview.marketSummary
                            ? `

                                <br><br>

                                <strong>
                                    Broader market context
                                </strong>
                                <br><br>

                                ${safe(
                                    overview.marketSummary
                                )}

                            `
                            : ""
                    }

                `;


            default:

                return `
                    Today's sector information is
                    unavailable for this question.
                `;

        }

    }


    /* =====================================================
       WHICH QUESTIONS REQUIRE CURRENT DATA?
    ===================================================== */

    const currentDataQuestions =
        new Set([

            "strongest-sectors",
            "weakest-sectors",
            "technology-leading",
            "sector-picture"

        ]);


    /* =====================================================
       OPEN SECTOR SCREEN
    ===================================================== */

    sectorButton.addEventListener(
        "click",
        function() {

            categories.hidden =
                true;

            sectorScreen.hidden =
                false;

            conversation.scrollTop =
                0;

        }
    );


    /* =====================================================
       BACK TO MAIN MENU
    ===================================================== */

    backButton.addEventListener(
        "click",
        function() {

            sectorScreen.hidden =
                true;

            categories.hidden =
                false;

            conversation.scrollTop =
                0;

        }
    );


    /* =====================================================
       QUESTION BUTTONS
    ===================================================== */

    const questionButtons =
        sectorScreen.querySelectorAll(
            "[data-chat-sector-question]"
        );


    questionButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                async function() {

                    const question =
                        button.dataset
                            .chatSectorQuestion;


                    const questionText =
                        button.querySelector(
                            "span:first-child"
                        )?.textContent.trim() ||
                        "Sectors & Trends";


                    /* =====================================
                       USER MESSAGE
                    ===================================== */

                    const userMessage =
                        document.createElement(
                            "div"
                        );

                    userMessage.className =
                        "edge-chat-message edge-chat-message-user";

                    userMessage.innerHTML = `

                        <div class="edge-chat-message-bubble">

                            <strong>
                                ${safe(
                                    questionText
                                )}
                            </strong>

                        </div>

                    `;


                    sectorScreen.hidden =
                        true;


                    conversation.appendChild(
                        userMessage
                    );


                    let aiMessage =
                        null;


                    let loadingMessage =
                        null;


                    try {


                        /* =================================
                           CURRENT DATA QUESTION
                        ================================= */

                        if (
                            currentDataQuestions.has(
                                question
                            )
                        ) {

                            questionButtons.forEach(
                                item =>
                                    item.disabled = true
                            );


                            loadingMessage =
                                document.createElement(
                                    "div"
                                );


                            loadingMessage.className =
                                "edge-chat-message edge-chat-message-ai";


                            loadingMessage.innerHTML = `

                                <div class="edge-chat-message-icon">
                                    ✦
                                </div>

                                <div class="edge-chat-message-bubble">

                                    Loading today's EdgeBreak
                                    sector intelligence...

                                </div>

                            `;


                            conversation.appendChild(
                                loadingMessage
                            );


                            conversation.scrollTop =
                                conversation.scrollHeight;


                            const data =
                                await getSectorMarketData();


                            loadingMessage.remove();


                            aiMessage =
                                document.createElement(
                                    "div"
                                );


                            aiMessage.className =
                                "edge-chat-message edge-chat-message-ai";


                            aiMessage.innerHTML = `

                                <div class="edge-chat-message-icon">
                                    ✦
                                </div>

                                <div class="edge-chat-message-bubble">

                                    ${buildCurrentAnswer(
                                        question,
                                        data
                                    )}

                                </div>

                            `;

                        }


                        /* =================================
                           EDUCATIONAL QUESTION
                        ================================= */

                        else {

                            const answer =
                                answers[
                                    question
                                ];


                            if (!answer) {

                                throw new Error(
                                    "Sector answer not found."
                                );

                            }


                            aiMessage =
                                document.createElement(
                                    "div"
                                );


                            aiMessage.className =
                                "edge-chat-message edge-chat-message-ai";


                            aiMessage.innerHTML = `

                                <div class="edge-chat-message-icon">
                                    ✦
                                </div>

                                <div class="edge-chat-message-bubble">

                                    ${answer}

                                </div>

                            `;

                        }


                        /* =================================
                           BACK BUTTON
                        ================================= */

                        const answerBackRow =
                            document.createElement(
                                "div"
                            );


                        answerBackRow.className =
                            "edge-chat-answer-back-row";


                        const answerBackButton =
                            document.createElement(
                                "button"
                            );


                        answerBackButton.type =
                            "button";


                        answerBackButton.className =
                            "edge-chat-back";


                        answerBackButton.textContent =
                            "← Back to Sectors & Trends";


                        answerBackRow.appendChild(
                            answerBackButton
                        );


                        conversation.appendChild(
                            aiMessage
                        );


                        conversation.appendChild(
                            answerBackRow
                        );


                        answerBackButton.addEventListener(
                            "click",
                            function() {

                                userMessage.remove();
                                aiMessage.remove();
                                answerBackRow.remove();

                                sectorScreen.hidden =
                                    false;

                                conversation.scrollTop =
                                    0;

                            }
                        );


                        conversation.scrollTop =
                            conversation.scrollHeight;

                    }
                    catch (error) {

                        console.error(
                            "EdgeBreak Sector Chat Error:",
                            error
                        );


                        if (loadingMessage) {

                            loadingMessage.remove();

                        }


                        const errorMessage =
                            document.createElement(
                                "div"
                            );


                        errorMessage.className =
                            "edge-chat-message edge-chat-message-ai";


                        errorMessage.innerHTML = `

                            <div class="edge-chat-message-icon">
                                ✦
                            </div>

                            <div class="edge-chat-message-bubble">

                                Today's EdgeBreak sector
                                intelligence is temporarily
                                unavailable.

                            </div>

                        `;


                        const errorBackRow =
                            document.createElement(
                                "div"
                            );


                        errorBackRow.className =
                            "edge-chat-answer-back-row";


                        const errorBackButton =
                            document.createElement(
                                "button"
                            );


                        errorBackButton.type =
                            "button";


                        errorBackButton.className =
                            "edge-chat-back";


                        errorBackButton.textContent =
                            "← Back to Sectors & Trends";


                        errorBackRow.appendChild(
                            errorBackButton
                        );


                        conversation.appendChild(
                            errorMessage
                        );


                        conversation.appendChild(
                            errorBackRow
                        );


                        errorBackButton.addEventListener(
                            "click",
                            function() {

                                userMessage.remove();
                                errorMessage.remove();
                                errorBackRow.remove();

                                sectorScreen.hidden =
                                    false;

                            }
                        );

                    }
                    finally {

                        questionButtons.forEach(
                            item =>
                                item.disabled = false
                        );

                    }

                }
            );

        }
    );


})();

// ============================================================
// EDGEBREAK SCANNER INDICATOR HISTORY
// ============================================================

let edgeBreakIndicatorHistory = null;
let edgeBreakIndicatorHistoryPromise = null;


async function loadEdgeBreakIndicatorHistory() {

    // Already loaded
    if (edgeBreakIndicatorHistory) {
        return edgeBreakIndicatorHistory;
    }


    // Already loading
    if (edgeBreakIndicatorHistoryPromise) {
        return edgeBreakIndicatorHistoryPromise;
    }


    edgeBreakIndicatorHistoryPromise = fetch(
        "/scanner_indicator_history.json",
        {
            cache: "no-store"
        }
    )
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    `Indicator history HTTP ${response.status}`
                );
            }

            return response.json();

        })
        .then(data => {

            edgeBreakIndicatorHistory = data;

            console.log(
                "EdgeBreak indicator history loaded:",
                Object.keys(data || {}).length,
                "stocks"
            );

            return data;

        })
        .catch(error => {

            console.error(
                "Could not load EdgeBreak indicator history:",
                error
            );

            edgeBreakIndicatorHistoryPromise = null;

            return null;

        });


    return edgeBreakIndicatorHistoryPromise;
}


// ============================================================
// FIND INDICATOR HISTORY FOR A STOCK
// ============================================================

function getEdgeBreakIndicatorRecord(symbol) {

    if (
        !edgeBreakIndicatorHistory ||
        !symbol
    ) {
        return null;
    }


    const ticker = String(symbol)
        .trim()
        .toUpperCase();


    return (
        edgeBreakIndicatorHistory[ticker]
        || null
    );
}


// ============================================================
// GET LATEST SAVED INDICATOR SNAPSHOT
// ============================================================

function getLatestEdgeBreakIndicatorSnapshot(symbol) {

    const record =
        getEdgeBreakIndicatorRecord(symbol);


    if (
        !record ||
        !Array.isArray(record.history) ||
        !record.history.length
    ) {
        return null;
    }


    const sortedHistory = [
        ...record.history
    ].sort((a, b) => {

        return String(a.date || "")
            .localeCompare(
                String(b.date || "")
            );

    });


    return (
        sortedHistory[
            sortedHistory.length - 1
        ]
        || null
    );
}

/* =========================================================
   EDGEBREAK AI CHAT
   QUICK QUESTION -> STOCK SELECT
========================================================= */

(function initEdgeBreakStockSelection() {

    // ========================================================
    // LOAD EDGEBREAK INDICATOR HISTORY
    // ========================================================

    loadEdgeBreakIndicatorHistory();

    const quickScreen =
        document.getElementById(
            "edgeBreakQuickScreen"
        );

    const stockScreen =
        document.getElementById(
            "edgeBreakStockScreen"
        );

    const selectedQuestionText =
        document.getElementById(
            "edgeBreakSelectedQuestionText"
        );

    const tickerForm =
        document.getElementById(
            "edgeBreakTickerForm"
        );

    const tickerInput =
        document.getElementById(
            "edgeBreakTickerInput"
        );

    const tickerMessage =
        document.getElementById(
            "edgeBreakTickerMessage"
        );

    const backButton =
        stockScreen?.querySelector(
            '[data-chat-back="quick"]'
        );


    /* -----------------------------------------------------
       SAFETY
    ----------------------------------------------------- */

    if (
        !quickScreen ||
        !stockScreen ||
        !selectedQuestionText ||
        !tickerForm ||
        !tickerInput ||
        !tickerMessage ||
        !backButton
    ) {

        console.warn(
            "EdgeBreak stock selection elements not found."
        );

        return;

    }


    /* -----------------------------------------------------
       CURRENT QUESTION
    ----------------------------------------------------- */

    let selectedQuestion = null;

    let selectedQuestionLabel = "";


    /* -----------------------------------------------------
       QUICK QUESTION BUTTONS
    ----------------------------------------------------- */

    const questionButtons =
        quickScreen.querySelectorAll(
            "[data-chat-question]"
        );


    questionButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    selectedQuestion =
                        button.dataset.chatQuestion;

                    window.edgeBreakQuestionMode =
                        "quick";

                    const label =
                        button.querySelector(
                            "span:first-child"
                        );

                    selectedQuestionLabel =
                        label
                            ? label.textContent.trim()
                            : "Quick Answer";


                    selectedQuestionText.textContent =
                        selectedQuestionLabel;

                    const stockBackButton =
                        stockScreen.querySelector(
                            ".edge-chat-back"
                        );

                    if (stockBackButton) {
                        stockBackButton.dataset.chatBack =
                            "quick";
                    }

                    quickScreen.hidden = true;

                    stockScreen.hidden = false;


                    tickerInput.value = "";

                    tickerMessage.textContent = "";


                    setTimeout(
                        function() {
                            tickerInput.focus();
                        },
                        50
                    );


                    const conversation =
                        document.getElementById(
                            "edgeBreakChatConversation"
                        );

                    if (conversation) {
                        conversation.scrollTop = 0;
                    }

                }
            );

        }
    );


    /* -----------------------------------------------------
       BACK TO QUICK ANSWERS
    ----------------------------------------------------- */

    backButton.addEventListener(
        "click",
        function() {

            stockScreen.hidden = true;
            tickerMessage.textContent = "";

            const technicalScreen =
                document.getElementById(
                    "edgeBreakTechnicalScreen"
                );


            /* -----------------------------------------
            RETURN TO TECHNICAL SETUP
            ----------------------------------------- */

            if (
                window.edgeBreakQuestionMode ===
                "technical"
            ) {

                quickScreen.hidden = true;

                if (technicalScreen) {
                    technicalScreen.hidden = false;
                }

            }


            /* -----------------------------------------
            RETURN TO QUICK ANSWERS
            ----------------------------------------- */

            else {

                if (technicalScreen) {
                    technicalScreen.hidden = true;
                }

                quickScreen.hidden = false;

            }


            const conversation =
                document.getElementById(
                    "edgeBreakChatConversation"
                );

            if (conversation) {
                conversation.scrollTop = 0;
            }

        }
    );


    /* -----------------------------------------------------
       TICKER INPUT CLEANUP
    ----------------------------------------------------- */

    tickerInput.addEventListener(
        "input",
        function() {

            tickerInput.value =
                tickerInput.value
                    .toUpperCase()
                    .replace(
                        /[^A-Z0-9.-]/g,
                        ""
                    );

        }
    );


    /* -----------------------------------------------------
    FORM SUBMIT
    EDGEBREAK AI — QUICK ANSWER #1
    QUICK RUNDOWN
    ----------------------------------------------------- */

    tickerForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const ticker =
                tickerInput.value
                    .trim()
                    .toUpperCase();


            if (!ticker) {

                tickerMessage.textContent =
                    "Enter a stock ticker first.";

                return;

            }


            tickerMessage.textContent = "";


            /* -------------------------------------------------
            FIND STOCK ACROSS EDGEBREAK DATA
            ------------------------------------------------- */

            const breakoutStock =
                Array.isArray(window.breakoutData)
                    ? window.breakoutData.find(
                        stock =>
                            String(stock.symbol || "")
                                .toUpperCase() === ticker
                    )
                    : null;


            const preBreakoutStock =
                Array.isArray(window.scannerData)
                    ? window.scannerData.find(
                        stock =>
                            String(stock.symbol || "")
                                .toUpperCase() === ticker
                    )
                    : null;


            const launchPadStock =
                Array.isArray(window.launchPadData)
                    ? window.launchPadData.find(
                        stock =>
                            String(stock.symbol || "")
                                .toUpperCase() === ticker
                    )
                    : null;


            const smartMoneyStock =
                Array.isArray(window.smartMoneyData)
                    ? window.smartMoneyData.find(
                        stock =>
                            String(stock.symbol || "")
                                .toUpperCase() === ticker
                    )
                    : null;


            /* -------------------------------------------------
            STOCK NOT FOUND
            ------------------------------------------------- */

            if (
                !breakoutStock &&
                !preBreakoutStock &&
                !launchPadStock
            ) {

                tickerMessage.textContent =
                    ticker +
                    " is not currently appearing in the EdgeBreak Breakout, Pre-Breakout or Launch Pad scanners.";

                return;

            }


            /* -------------------------------------------------
            HELPERS
            ------------------------------------------------- */

            function money(value) {

                const number = Number(value);

                if (!Number.isFinite(number)) {
                    return "—";
                }

                if (number < 1) {
                    return "$" + number.toFixed(2);
                }

                return "$" + number.toFixed(2);

            }


            function number(value, decimals = 2) {

                const parsed = Number(value);

                if (!Number.isFinite(parsed)) {
                    return "—";
                }

                return parsed.toFixed(decimals);

            }


            function formatDate(value) {

                if (!value) {
                    return "";
                }

                const parts =
                    String(value).split("-");

                if (parts.length !== 3) {
                    return String(value);
                }

                const date =
                    new Date(
                        Number(parts[0]),
                        Number(parts[1]) - 1,
                        Number(parts[2])
                    );


                return date.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                );

            }

            /* -------------------------------------------------
            EDGEBREAK INDICATOR DATA
            ------------------------------------------------- */

            const indicatorRecord =
                getEdgeBreakIndicatorRecord(
                    ticker
                );


            const latestIndicators =
                getLatestEdgeBreakIndicatorSnapshot(
                    ticker
                );


            const indicatorHistory =
                indicatorRecord &&
                Array.isArray(
                    indicatorRecord.history
                )
                    ? indicatorRecord.history
                    : [];


            const indicatorDate =
                latestIndicators &&
                latestIndicators.date
                    ? formatDate(
                        latestIndicators.date
                    )
                    : "";

            /* -------------------------------------------------
            BUILD ANSWER
            ------------------------------------------------- */

            let answer = "";

            /* =================================================
            TECHNICAL SETUP ANSWERS
            ================================================= */

            if (
                window.edgeBreakQuestionMode === "technical"
            ) {

                const technicalQuestion =
                    window.edgeBreakTechnicalQuestion;


                /* =================================================
                TECHNICAL #1
                WHAT RESISTANCE LEVEL DID EDGEBREAK IDENTIFY?
                ================================================= */

                if (
                    technicalQuestion === "technical-resistance"
                ) {

                    let technicalText = "";


                    if (breakoutStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Breakout Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak identified resistance for
                                    ${ticker} around

                                    <strong>
                                        ${money(breakoutStock.resistance)}
                                    </strong>.

                                    Current price is
                                    <strong>${money(breakoutStock.price)}</strong>.

                                    Price is currently approximately
                                    <strong>
                                        ${number(breakoutStock.distance_above_resistance)}%
                                        above that resistance level
                                    </strong>.

                                </div>

                            </div>

                        `;

                    }


                    if (preBreakoutStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Pre-Breakout Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak identified resistance for
                                    ${ticker} around

                                    <strong>
                                        ${money(preBreakoutStock.resistance_price)}
                                    </strong>.

                                    Current price is
                                    <strong>
                                        ${money(preBreakoutStock.current_price)}
                                    </strong>.

                                    Price is approximately
                                    <strong>
                                        ${number(preBreakoutStock.distance_to_resistance)}%
                                        below resistance
                                    </strong>.

                                </div>

                            </div>

                        `;

                    }


                    if (launchPadStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Launch Pad Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak identified a resistance zone
                                    between

                                    <strong>
                                        ${money(launchPadStock.resistance_zone_low)}
                                        –
                                        ${money(launchPadStock.resistance_zone_high)}
                                    </strong>.

                                    Current price is
                                    <strong>
                                        ${money(launchPadStock.current_price)}
                                    </strong>.

                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Resistance
                            </div>

                            ${technicalText}

                            <div style="
                                margin-top:12px;
                                padding-top:12px;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#64748b;
                                font-size:12px;
                                line-height:1.6;
                            ">
                                Resistance is an area where price has
                                previously encountered repeated selling
                                pressure. EdgeBreak reports the technical
                                levels detected by its scanners.
                            </div>

                        </div>

                    `;

                }


                /* =================================================
                TECHNICAL #2
                WHAT SUPPORT LEVEL DID EDGEBREAK IDENTIFY?
                ================================================= */

                else if (
                    technicalQuestion === "technical-support"
                ) {

                    let technicalText = "";


                    if (launchPadStock) {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Launch Pad Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak identified a support zone
                                    for ${ticker} between

                                    <strong>
                                        ${money(launchPadStock.support_zone_low)}
                                        –
                                        ${money(launchPadStock.support_zone_high)}
                                    </strong>.

                                    Current price is
                                    <strong>
                                        ${money(launchPadStock.current_price)}
                                    </strong>.

                                    The base has recorded
                                    <strong>
                                        ${launchPadStock.support_tests}
                                        support tests
                                    </strong>.

                                </div>

                            </div>

                        `;

                    } else {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak does not currently have a
                                separately stored support level for
                                ${ticker} in this scanner setup.

                                <div style="
                                    margin-top:10px;
                                    color:#94a3b8;
                                ">
                                    The Breakout and Pre-Breakout datasets
                                    currently store resistance structure,
                                    but not a separate support level.
                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Support
                            </div>

                            ${technicalText}

                            <div style="
                                margin-top:12px;
                                padding-top:12px;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#64748b;
                                font-size:12px;
                                line-height:1.6;
                            ">
                                EdgeBreak only reports a support level
                                when that level exists in the available
                                scanner data.
                            </div>

                        </div>

                    `;

                }


                /* =================================================
                TECHNICAL #3
                HOW MANY TIMES HAS RESISTANCE BEEN TESTED?
                ================================================= */

                else if (
                    technicalQuestion === "resistance-tests"
                ) {

                    let technicalText = "";


                    if (breakoutStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <strong style="color:#22c55e;">
                                    Breakout Scanner
                                </strong>

                                <div style="
                                    margin-top:8px;
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak recorded
                                    <strong>
                                        ${breakoutStock.touches}
                                        resistance tests
                                    </strong>
                                    around
                                    <strong>
                                        ${money(breakoutStock.resistance)}
                                    </strong>
                                    before the breakout.

                                </div>

                            </div>

                        `;

                    }


                    if (preBreakoutStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <strong style="color:#22c55e;">
                                    Pre-Breakout Scanner
                                </strong>

                                <div style="
                                    margin-top:8px;
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak has recorded
                                    <strong>
                                        ${preBreakoutStock.resistance_touches}
                                        resistance tests
                                    </strong>
                                    around
                                    <strong>
                                        ${money(preBreakoutStock.resistance_price)}
                                    </strong>.

                                </div>

                            </div>

                        `;

                    }


                    if (launchPadStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <strong style="color:#22c55e;">
                                    Launch Pad Scanner
                                </strong>

                                <div style="
                                    margin-top:8px;
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    The Launch Pad base has recorded
                                    <strong>
                                        ${launchPadStock.resistance_tests}
                                        resistance tests
                                    </strong>
                                    around the
                                    <strong>
                                        ${money(launchPadStock.resistance_zone_low)}
                                        –
                                        ${money(launchPadStock.resistance_zone_high)}
                                    </strong>
                                    resistance zone.

                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Resistance Tests
                            </div>

                            ${technicalText}

                            <div style="
                                margin-top:12px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">
                                Repeated tests help show how often price
                                has interacted with the resistance area.
                                They do not guarantee that resistance will
                                eventually break.
                            </div>

                        </div>

                    `;

                }


                /* =================================================
                TECHNICAL #4
                HOW MANY TIMES HAS SUPPORT BEEN TESTED?
                ================================================= */

                else if (
                    technicalQuestion === "support-tests"
                ) {

                    let technicalText = "";


                    if (launchPadStock) {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak recorded
                                    <strong>
                                        ${launchPadStock.support_tests}
                                        support tests
                                    </strong>
                                    within the Launch Pad base.

                                    The identified support zone is

                                    <strong>
                                        ${money(launchPadStock.support_zone_low)}
                                        –
                                        ${money(launchPadStock.support_zone_high)}
                                    </strong>.

                                </div>

                                <div style="
                                    margin-top:10px;
                                    color:#94a3b8;
                                    line-height:1.7;
                                ">

                                    Repeated support tests show how often
                                    price interacted with the lower area
                                    of the identified trading range.

                                </div>

                            </div>

                        `;

                    } else {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak does not currently store a
                                separate support-test count for ${ticker}
                                in this scanner setup.

                                <div style="
                                    margin-top:10px;
                                    color:#94a3b8;
                                ">
                                    Support-test data is currently available
                                    when EdgeBreak identifies a Launch Pad
                                    base.
                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Support Tests
                            </div>

                            ${technicalText}

                        </div>

                    `;

                }

                /* =================================================
                TECHNICAL #5
                HOW MANY HIGHER LOWS HAS THE STOCK FORMED?
                ================================================= */

                else if (
                    technicalQuestion === "higher-lows"
                ) {

                    let technicalText = "";


                    if (breakoutStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Breakout Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak recorded
                                    <strong>
                                        ${breakoutStock.higher_lows}
                                        higher lows
                                    </strong>
                                    within the breakout structure for
                                    ${ticker}.

                                </div>

                            </div>

                        `;

                    }


                    if (preBreakoutStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Pre-Breakout Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak has identified
                                    <strong>
                                        ${preBreakoutStock.higher_lows}
                                        higher lows
                                    </strong>
                                    in the current Pre-Breakout structure.

                                </div>

                            </div>

                        `;

                    }


                    if (
                        launchPadStock &&
                        !breakoutStock &&
                        !preBreakoutStock
                    ) {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak does not currently store a
                                higher-low count for ${ticker} in the
                                Launch Pad dataset.

                                <div style="
                                    margin-top:10px;
                                    color:#94a3b8;
                                ">
                                    The Launch Pad Scanner instead tracks
                                    the stock's support tests, resistance
                                    tests and base structure.
                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Higher Lows
                            </div>

                            ${technicalText}

                            <div style="
                                margin-top:12px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">
                                Higher lows occur when successive lows
                                form above earlier lows. EdgeBreak uses
                                them as one part of identifying developing
                                technical structure.
                            </div>

                        </div>

                    `;

                }


                /* =================================================
                TECHNICAL #6
                IS PRICE ABOVE OR BELOW RESISTANCE?
                ================================================= */

                else if (
                    technicalQuestion === "resistance-position"
                ) {

                    let technicalText = "";


                    if (breakoutStock) {

                        const distance =
                            Number(
                                breakoutStock.distance_above_resistance
                            );


                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Breakout Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    ${ticker} is
                                    <strong>above resistance</strong>.

                                    Current price is
                                    <strong>${money(breakoutStock.price)}</strong>
                                    compared with resistance around
                                    <strong>${money(breakoutStock.resistance)}</strong>.

                                    ${
                                        Number.isFinite(distance)
                                            ? `
                                                Price is approximately
                                                <strong>${number(distance)}%
                                                above resistance</strong>.
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                        `;

                    }


                    if (preBreakoutStock) {

                        const distance =
                            Number(
                                preBreakoutStock.distance_to_resistance
                            );


                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Pre-Breakout Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    ${ticker} is currently
                                    <strong>below resistance</strong>.

                                    Current price is
                                    <strong>
                                        ${money(preBreakoutStock.current_price)}
                                    </strong>
                                    compared with resistance around
                                    <strong>
                                        ${money(preBreakoutStock.resistance_price)}
                                    </strong>.

                                    ${
                                        Number.isFinite(distance)
                                            ? `
                                                Price is approximately
                                                <strong>${number(distance)}%
                                                below resistance</strong>.
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                        `;

                    }


                    if (launchPadStock) {

                        const currentPrice =
                            Number(
                                launchPadStock.current_price
                            );

                        const resistanceLow =
                            Number(
                                launchPadStock.resistance_zone_low
                            );

                        const resistanceHigh =
                            Number(
                                launchPadStock.resistance_zone_high
                            );

                        let positionText = "";


                        if (
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(resistanceHigh) &&
                            currentPrice > resistanceHigh
                        ) {

                            const above =
                                (
                                    (
                                        currentPrice -
                                        resistanceHigh
                                    ) /
                                    resistanceHigh
                                ) * 100;

                            positionText = `
                                Price is
                                <strong>${number(above)}% above the top
                                of the resistance zone</strong>.
                            `;

                        } else if (
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(resistanceLow) &&
                            currentPrice >= resistanceLow
                        ) {

                            positionText = `
                                Price is currently
                                <strong>inside the resistance zone</strong>.
                            `;

                        } else if (
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(resistanceLow)
                        ) {

                            const below =
                                (
                                    (
                                        resistanceLow -
                                        currentPrice
                                    ) /
                                    currentPrice
                                ) * 100;

                            positionText = `
                                Price is approximately
                                <strong>${number(below)}% below the bottom
                                of the resistance zone</strong>.
                            `;

                        }


                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Launch Pad Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak identified resistance between
                                    <strong>
                                        ${money(resistanceLow)}
                                        –
                                        ${money(resistanceHigh)}
                                    </strong>.

                                    Current price is
                                    <strong>${money(currentPrice)}</strong>.

                                    ${positionText}

                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Position vs Resistance
                            </div>

                            ${technicalText}

                        </div>

                    `;

                }


                /* =================================================
                TECHNICAL #7
                WHERE IS PRICE WITHIN THE TRADING RANGE?
                ================================================= */

                else if (
                    technicalQuestion === "range-position"
                ) {

                    let technicalText = "";


                    if (launchPadStock) {

                        const currentPrice =
                            Number(
                                launchPadStock.current_price
                            );

                        const supportLow =
                            Number(
                                launchPadStock.support_zone_low
                            );

                        const supportHigh =
                            Number(
                                launchPadStock.support_zone_high
                            );

                        const resistanceLow =
                            Number(
                                launchPadStock.resistance_zone_low
                            );

                        const resistanceHigh =
                            Number(
                                launchPadStock.resistance_zone_high
                            );


                        let positionText = "";


                        if (
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(resistanceHigh) &&
                            currentPrice > resistanceHigh
                        ) {

                            positionText =
                                `Price is currently <strong>above the original trading range</strong>.`;

                        } else if (
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(supportLow) &&
                            currentPrice < supportLow
                        ) {

                            positionText =
                                `Price is currently <strong>below the original trading range</strong>.`;

                        } else if (
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(resistanceLow) &&
                            currentPrice >= resistanceLow
                        ) {

                            positionText =
                                `Price is currently <strong>inside the resistance area at the upper end of the range</strong>.`;

                        } else if (
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(supportHigh) &&
                            currentPrice <= supportHigh
                        ) {

                            positionText =
                                `Price is currently <strong>inside the support area at the lower end of the range</strong>.`;

                        } else {

                            positionText =
                                `Price is currently <strong>between the support and resistance areas</strong>.`;

                        }


                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    Current price:
                                    <strong>${money(currentPrice)}</strong>.

                                    <br><br>

                                    Support:
                                    <strong>
                                        ${money(supportLow)}
                                        –
                                        ${money(supportHigh)}
                                    </strong>.

                                    <br>

                                    Resistance:
                                    <strong>
                                        ${money(resistanceLow)}
                                        –
                                        ${money(resistanceHigh)}
                                    </strong>.

                                    <div style="
                                        margin-top:12px;
                                        color:#94a3b8;
                                    ">
                                        ${positionText}
                                    </div>

                                </div>

                            </div>

                        `;

                    } else {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak does not currently have a
                                complete support-to-resistance trading
                                range stored for ${ticker} in this scanner
                                setup.

                                <div style="
                                    margin-top:10px;
                                    color:#94a3b8;
                                ">
                                    Full trading-range positioning is
                                    currently available for Launch Pad
                                    structures.
                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Position in Trading Range
                            </div>

                            ${technicalText}

                        </div>

                    `;

                }


                /* =================================================
                TECHNICAL #8
                HAS PRICE MOVED OUTSIDE THE ORIGINAL SETUP?
                ================================================= */

                else if (
                    technicalQuestion === "outside-setup"
                ) {

                    let technicalText = "";


                    if (launchPadStock) {

                        const currentPrice =
                            Number(
                                launchPadStock.current_price
                            );

                        const supportLow =
                            Number(
                                launchPadStock.support_zone_low
                            );

                        const resistanceHigh =
                            Number(
                                launchPadStock.resistance_zone_high
                            );


                        let statusText = "";


                        if (
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(resistanceHigh) &&
                            currentPrice > resistanceHigh
                        ) {

                            const distance =
                                (
                                    (
                                        currentPrice -
                                        resistanceHigh
                                    ) /
                                    resistanceHigh
                                ) * 100;


                            statusText = `

                                <strong>Yes.</strong>

                                Price has moved above the original
                                Launch Pad structure and is currently
                                approximately
                                <strong>${number(distance)}% above the
                                top of the original resistance zone</strong>.

                            `;

                        } else if (
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(supportLow) &&
                            currentPrice < supportLow
                        ) {

                            const distance =
                                (
                                    (
                                        supportLow -
                                        currentPrice
                                    ) /
                                    supportLow
                                ) * 100;


                            statusText = `

                                <strong>Yes.</strong>

                                Price has moved below the original
                                Launch Pad structure and is currently
                                approximately
                                <strong>${number(distance)}% below the
                                bottom of the original support zone</strong>.

                            `;

                        } else {

                            statusText = `

                                <strong>No.</strong>

                                Price remains within the broader
                                support-to-resistance structure originally
                                identified by the Launch Pad Scanner.

                            `;

                        }


                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${statusText}

                                <div style="
                                    margin-top:12px;
                                    color:#94a3b8;
                                ">
                                    Original support:
                                    <strong>
                                        ${money(launchPadStock.support_zone_low)}
                                        –
                                        ${money(launchPadStock.support_zone_high)}
                                    </strong>.

                                    <br>

                                    Original resistance:
                                    <strong>
                                        ${money(launchPadStock.resistance_zone_low)}
                                        –
                                        ${money(launchPadStock.resistance_zone_high)}
                                    </strong>.
                                </div>

                            </div>

                        `;

                    } else if (breakoutStock) {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                <strong>Yes.</strong>

                                ${ticker} has moved above the resistance
                                level that defined the breakout setup.

                                Price is currently approximately
                                <strong>
                                    ${number(breakoutStock.distance_above_resistance)}%
                                    above resistance
                                </strong>
                                around
                                <strong>
                                    ${money(breakoutStock.resistance)}
                                </strong>.

                            </div>

                        `;

                    } else if (preBreakoutStock) {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                <strong>No breakout has been recorded.</strong>

                                ${ticker} remains approximately
                                <strong>
                                    ${number(preBreakoutStock.distance_to_resistance)}%
                                    below resistance
                                </strong>
                                around
                                <strong>
                                    ${money(preBreakoutStock.resistance_price)}
                                </strong>.

                                <div style="
                                    margin-top:10px;
                                    color:#94a3b8;
                                ">
                                    The Pre-Breakout dataset does not store
                                    a complete lower support boundary, so
                                    EdgeBreak cannot determine whether price
                                    has moved below the full original setup.
                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Original Setup
                            </div>

                            ${technicalText}

                            <div style="
                                margin-top:12px;
                                padding-top:12px;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#64748b;
                                font-size:12px;
                                line-height:1.6;
                            ">
                                This describes price relative to the
                                technical structure stored by EdgeBreak.
                                It does not predict the stock's next move.
                            </div>

                        </div>

                    `;

                }

                /* =================================================
                TECHNICAL #9
                HOW WIDE IS THE TRADING RANGE?
                ================================================= */

                else if (
                    technicalQuestion === "range-width"
                ) {

                    let technicalText = "";


                    if (launchPadStock) {

                        const rangePercent =
                            Number(
                                launchPadStock.range_percent
                            );

                        const supportLow =
                            Number(
                                launchPadStock.support_zone_low
                            );

                        const supportHigh =
                            Number(
                                launchPadStock.support_zone_high
                            );

                        const resistanceLow =
                            Number(
                                launchPadStock.resistance_zone_low
                            );

                        const resistanceHigh =
                            Number(
                                launchPadStock.resistance_zone_high
                            );


                        let rangeDescription = "";


                        if (
                            Number.isFinite(rangePercent) &&
                            rangePercent <= 6
                        ) {

                            rangeDescription =
                                `EdgeBreak has identified a relatively tight base structure.`;

                        } else if (
                            Number.isFinite(rangePercent) &&
                            rangePercent <= 10
                        ) {

                            rangeDescription =
                                `EdgeBreak has identified a moderately compact base structure.`;

                        } else {

                            rangeDescription =
                                `The identified base has a wider distance between its support and resistance areas.`;

                        }


                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    The Launch Pad trading range for
                                    ${ticker} is approximately

                                    <strong>
                                        ${number(rangePercent)}%
                                    </strong>.

                                    <div style="
                                        margin-top:12px;
                                        color:#94a3b8;
                                        line-height:1.7;
                                    ">

                                        Support zone:

                                        <strong style="color:#e2e8f0;">
                                            ${money(supportLow)}
                                            –
                                            ${money(supportHigh)}
                                        </strong>.

                                        <br>

                                        Resistance zone:

                                        <strong style="color:#e2e8f0;">
                                            ${money(resistanceLow)}
                                            –
                                            ${money(resistanceHigh)}
                                        </strong>.

                                    </div>

                                    <div style="
                                        margin-top:12px;
                                        color:#94a3b8;
                                        line-height:1.7;
                                    ">

                                        <strong style="color:#e2e8f0;">
                                            In plain English:
                                        </strong>

                                        ${rangeDescription}

                                    </div>

                                </div>

                            </div>

                        `;

                    } else {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak does not currently store a
                                complete support-to-resistance range width
                                for ${ticker} in this scanner setup.

                                <div style="
                                    margin-top:10px;
                                    color:#94a3b8;
                                ">
                                    Range width is currently available
                                    for Launch Pad structures.
                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Trading Range Width
                            </div>

                            ${technicalText}

                        </div>

                    `;

                }


                /* =================================================
                TECHNICAL #10
                HOW LONG IS THE BASE?
                ================================================= */

                else if (
                    technicalQuestion === "base-length"
                ) {

                    let technicalText = "";


                    if (launchPadStock) {

                        const baseDays =
                            Number(
                                launchPadStock.launchpad_days
                            );


                        let baseDescription = "";


                        if (
                            Number.isFinite(baseDays) &&
                            baseDays >= 105
                        ) {

                            baseDescription =
                                `This is one of the longer base periods tracked by the Launch Pad Scanner.`;

                        } else if (
                            Number.isFinite(baseDays) &&
                            baseDays >= 84
                        ) {

                            baseDescription =
                                `This represents an established multi-month base.`;

                        } else if (
                            Number.isFinite(baseDays) &&
                            baseDays >= 63
                        ) {

                            baseDescription =
                                `This represents an established base spanning roughly three months of trading sessions.`;

                        } else {

                            baseDescription =
                                `EdgeBreak has identified a defined base over the available period.`;

                        }


                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    EdgeBreak identified a

                                    <strong>
                                        ${baseDays}-trading-day base
                                    </strong>

                                    for ${ticker}.

                                    <div style="
                                        margin-top:12px;
                                        color:#94a3b8;
                                        line-height:1.7;
                                    ">

                                        During the base, EdgeBreak recorded

                                        <strong style="color:#e2e8f0;">
                                            ${launchPadStock.support_tests}
                                            support tests
                                        </strong>

                                        and

                                        <strong style="color:#e2e8f0;">
                                            ${launchPadStock.resistance_tests}
                                            resistance tests
                                        </strong>.

                                    </div>

                                    <div style="
                                        margin-top:12px;
                                        color:#94a3b8;
                                        line-height:1.7;
                                    ">

                                        <strong style="color:#e2e8f0;">
                                            In plain English:
                                        </strong>

                                        ${baseDescription}

                                    </div>

                                </div>

                            </div>

                        `;

                    } else {

                        technicalText = `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak does not currently store a
                                reliable base length for ${ticker} in
                                this scanner setup.

                                <div style="
                                    margin-top:10px;
                                    color:#94a3b8;
                                ">
                                    Exact base length is currently
                                    available for Launch Pad structures.
                                </div>

                            </div>

                        `;

                    }


                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:12px;
                            ">
                                ${ticker} — Base Length
                            </div>

                            ${technicalText}

                        </div>

                    `;

                }


                /* =================================================
                TECHNICAL #11
                EXPLAIN THIS TECHNICAL SETUP IN SIMPLE TERMS
                ================================================= */

                else if (
                    technicalQuestion === "explain-setup"
                ) {

                    let technicalText = "";


                    /* =================================================
                    BREAKOUT
                    ================================================= */

                    if (breakoutStock) {

                        const distance =
                            Number(
                                breakoutStock.distance_above_resistance
                            );


                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Breakout Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    In simple terms, ${ticker} repeatedly
                                    approached an area around
                                    <strong>${money(breakoutStock.resistance)}</strong>
                                    where price had previously struggled
                                    to move higher.

                                    <br><br>

                                    EdgeBreak recorded
                                    <strong>${breakoutStock.touches}
                                    resistance tests</strong>
                                    and
                                    <strong>${breakoutStock.higher_lows}
                                    higher lows</strong>.

                                    Price then moved above that resistance
                                    area.

                                    ${
                                        Number.isFinite(distance)
                                            ? `
                                                It is currently approximately
                                                <strong>${number(distance)}%
                                                above the identified resistance
                                                level</strong>.
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    PRE-BREAKOUT
                    ================================================= */

                    if (preBreakoutStock) {

                        const distance =
                            Number(
                                preBreakoutStock.distance_to_resistance
                            );


                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Pre-Breakout Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    In simple terms, ${ticker} is trading
                                    underneath an area around
                                    <strong>
                                        ${money(preBreakoutStock.resistance_price)}
                                    </strong>
                                    that price has tested several times.

                                    <br><br>

                                    EdgeBreak has recorded
                                    <strong>
                                        ${preBreakoutStock.resistance_touches}
                                        resistance tests
                                    </strong>
                                    together with
                                    <strong>
                                        ${preBreakoutStock.higher_lows}
                                        higher lows
                                    </strong>.

                                    ${
                                        Number.isFinite(distance)
                                            ? `
                                                Price is currently approximately
                                                <strong>${number(distance)}%
                                                below resistance</strong>.
                                            `
                                            : ""
                                    }

                                    <br><br>

                                    The scanner is essentially tracking a
                                    stock that is building structure beneath
                                    an established resistance area.

                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    LAUNCH PAD
                    ================================================= */

                    if (launchPadStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Launch Pad Scanner
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    In simple terms, ${ticker} spent
                                    approximately
                                    <strong>
                                        ${launchPadStock.launchpad_days}
                                        trading days
                                    </strong>
                                    forming a defined price range.

                                    <br><br>

                                    EdgeBreak identified support around

                                    <strong>
                                        ${money(launchPadStock.support_zone_low)}
                                        –
                                        ${money(launchPadStock.support_zone_high)}
                                    </strong>

                                    and resistance around

                                    <strong>
                                        ${money(launchPadStock.resistance_zone_low)}
                                        –
                                        ${money(launchPadStock.resistance_zone_high)}
                                    </strong>.

                                    <br><br>

                                    Price repeatedly interacted with both
                                    sides of that range, creating the base
                                    structure detected by the scanner.

                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    INDICATOR EXPLANATION
                    ================================================= */

                    if (latestIndicators) {

                        const price =
                            latestIndicators.price == null
                                ? null
                                : Number(
                                    latestIndicators.price
                                );

                        const rsi =
                            latestIndicators.rsi14 == null
                                ? null
                                : Number(
                                    latestIndicators.rsi14
                                );

                        const macd =
                            latestIndicators.macd == null
                                ? null
                                : Number(
                                    latestIndicators.macd
                                );

                        const macdSignal =
                            latestIndicators.macd_signal == null
                                ? null
                                : Number(
                                    latestIndicators.macd_signal
                                );

                        const sma20 =
                            latestIndicators.sma20 == null
                                ? null
                                : Number(
                                    latestIndicators.sma20
                                );

                        const sma50 =
                            latestIndicators.sma50 == null
                                ? null
                                : Number(
                                    latestIndicators.sma50
                                );

                        const sma200 =
                            latestIndicators.sma200 == null
                                ? null
                                : Number(
                                    latestIndicators.sma200
                                );

                        const relativeVolume =
                            latestIndicators.relative_volume == null
                                ? null
                                : Number(
                                    latestIndicators.relative_volume
                                );

                        const obvTrend =
                            String(
                                latestIndicators.obv_trend || ""
                            ).toLowerCase();


                        let trendExplanation = "";
                        let momentumExplanation = "";
                        let volumeExplanation = "";


                        /* ---------------------------------------------
                        TREND
                        --------------------------------------------- */

                        if (
                            Number.isFinite(price) &&
                            Number.isFinite(sma20) &&
                            Number.isFinite(sma50)
                        ) {

                            if (
                                price > sma20 &&
                                price > sma50 &&
                                sma20 > sma50
                            ) {

                                trendExplanation = `
                                    Price is above both its
                                    <strong>20-day and 50-day moving averages</strong>,
                                    with the shorter 20-day average also above
                                    the 50-day average. In simple terms, the
                                    recent price trend has been stronger than
                                    its medium-term trend.
                                `;

                            } else if (
                                price < sma20 &&
                                price < sma50
                            ) {

                                trendExplanation = `
                                    Price is currently below both its
                                    <strong>20-day and 50-day moving averages</strong>.
                                    In simple terms, recent price action has
                                    been softer than those short and
                                    medium-term averages.
                                `;

                            } else {

                                trendExplanation = `
                                    Price is currently sitting around its
                                    <strong>20-day and 50-day moving averages</strong>,
                                    giving the short and medium-term trend
                                    a more mixed appearance.
                                `;

                            }

                        }


                        if (
                            Number.isFinite(price) &&
                            Number.isFinite(sma200)
                        ) {

                            trendExplanation += `

                                ${
                                    price > sma200
                                        ? `
                                            Price is also above its
                                            <strong>200-day moving average</strong>,
                                            placing it above its longer-term
                                            average price.
                                        `
                                        : `
                                            Price is below its
                                            <strong>200-day moving average</strong>,
                                            placing it below its longer-term
                                            average price.
                                        `
                                }

                            `;

                        }


                        /* ---------------------------------------------
                        MOMENTUM
                        --------------------------------------------- */

                        if (Number.isFinite(rsi)) {

                            if (rsi >= 70) {

                                momentumExplanation += `
                                    RSI is
                                    <strong>${number(rsi, 1)}</strong>,
                                    showing strong recent momentum, although
                                    the reading is elevated above 70.
                                `;

                            } else if (rsi >= 55) {

                                momentumExplanation += `
                                    RSI is
                                    <strong>${number(rsi, 1)}</strong>,
                                    showing positive recent momentum.
                                `;

                            } else if (rsi <= 30) {

                                momentumExplanation += `
                                    RSI is
                                    <strong>${number(rsi, 1)}</strong>,
                                    which is a relatively low momentum reading.
                                `;

                            } else if (rsi < 45) {

                                momentumExplanation += `
                                    RSI is
                                    <strong>${number(rsi, 1)}</strong>,
                                    showing softer recent momentum.
                                `;

                            } else {

                                momentumExplanation += `
                                    RSI is
                                    <strong>${number(rsi, 1)}</strong>,
                                    placing recent momentum in a relatively
                                    neutral area.
                                `;

                            }

                        }


                        if (
                            Number.isFinite(macd) &&
                            Number.isFinite(macdSignal)
                        ) {

                            momentumExplanation += `

                                ${
                                    macd > macdSignal
                                        ? `
                                            MACD is currently
                                            <strong>above its signal line</strong>,
                                            providing another positive recent
                                            momentum reading.
                                        `
                                        : macd < macdSignal
                                            ? `
                                                MACD is currently
                                                <strong>below its signal line</strong>,
                                                showing softer recent momentum.
                                            `
                                            : `
                                                MACD is currently very close to
                                                its signal line.
                                            `
                                }

                            `;

                        }


                        /* ---------------------------------------------
                        VOLUME
                        --------------------------------------------- */

                        if (
                            Number.isFinite(relativeVolume) &&
                            relativeVolume > 0
                        ) {

                            if (relativeVolume >= 1.5) {

                                volumeExplanation += `
                                    Latest recorded volume is approximately
                                    <strong>${number(relativeVolume, 2)}×
                                    the 20-day average</strong>, so trading
                                    activity is elevated relative to its
                                    recent average.
                                `;

                            } else if (relativeVolume >= 0.75) {

                                volumeExplanation += `
                                    Latest recorded volume is approximately
                                    <strong>${number(relativeVolume, 2)}×
                                    the 20-day average</strong>, placing
                                    trading activity around its recent
                                    normal range.
                                `;

                            } else {

                                volumeExplanation += `
                                    Latest recorded volume is approximately
                                    <strong>${number(relativeVolume, 2)}×
                                    the 20-day average</strong>, so recent
                                    trading activity is lighter than its
                                    recent average.
                                `;

                            }

                        }


                        if (obvTrend === "rising") {

                            volumeExplanation += `
                                On-Balance Volume is
                                <strong>rising</strong>, meaning volume has
                                generally accumulated more on advancing
                                sessions over the recent period.
                            `;

                        } else if (
                            obvTrend === "falling"
                        ) {

                            volumeExplanation += `
                                On-Balance Volume is
                                <strong>falling</strong>, meaning volume has
                                generally accumulated more on declining
                                sessions over the recent period.
                            `;

                        } else if (
                            obvTrend === "neutral"
                        ) {

                            volumeExplanation += `
                                On-Balance Volume is currently
                                <strong>relatively neutral</strong>.
                            `;

                        }


                        /* ---------------------------------------------
                        DISPLAY INDICATORS
                        --------------------------------------------- */

                        if (
                            trendExplanation ||
                            momentumExplanation ||
                            volumeExplanation
                        ) {

                            technicalText += `

                                <div style="
                                    padding:14px 0;
                                    border-top:1px solid rgba(148,163,184,.16);
                                ">

                                    <div style="
                                        font-weight:800;
                                        color:#38bdf8;
                                        margin-bottom:8px;
                                    ">
                                        What the Indicators Are Showing
                                    </div>

                                    ${
                                        trendExplanation
                                            ? `
                                                <div style="
                                                    margin-bottom:12px;
                                                    color:#cbd5e1;
                                                    line-height:1.7;
                                                ">

                                                    <strong style="color:#e2e8f0;">
                                                        Trend:
                                                    </strong>

                                                    ${trendExplanation}

                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        momentumExplanation
                                            ? `
                                                <div style="
                                                    margin-bottom:12px;
                                                    color:#cbd5e1;
                                                    line-height:1.7;
                                                ">

                                                    <strong style="color:#e2e8f0;">
                                                        Momentum:
                                                    </strong>

                                                    ${momentumExplanation}

                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        volumeExplanation
                                            ? `
                                                <div style="
                                                    color:#cbd5e1;
                                                    line-height:1.7;
                                                ">

                                                    <strong style="color:#e2e8f0;">
                                                        Volume:
                                                    </strong>

                                                    ${volumeExplanation}

                                                </div>
                                            `
                                            : ""
                                    }

                                </div>

                            `;

                        }

                    }


                    /* =================================================
                    ANSWER
                    ================================================= */

                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:6px;
                            ">
                                ${ticker} — Technical Setup Explained
                            </div>

                            ${
                                indicatorDate
                                    ? `
                                        <div style="
                                            color:#64748b;
                                            font-size:12px;
                                            margin-bottom:14px;
                                        ">
                                            Technical data through
                                            <strong style="color:#94a3b8;">
                                                ${indicatorDate}
                                            </strong>
                                        </div>
                                    `
                                    : ""
                            }

                            ${technicalText}

                            <div style="
                                margin-top:12px;
                                padding-top:12px;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#64748b;
                                font-size:12px;
                                line-height:1.6;
                            ">
                                EdgeBreak is describing the technical
                                structure and indicator data currently
                                available. These conditions can change
                                and do not predict what price will do next.
                            </div>

                        </div>

                    `;

                }


                /* =================================================
                TECHNICAL #12
                SHOW ME THE KEY TECHNICAL NUMBERS
                ================================================= */

                else if (
                    technicalQuestion === "technical-numbers"
                ) {

                    let technicalText = "";


                    /* =================================================
                    BREAKOUT
                    ================================================= */

                    if (breakoutStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:10px;
                                ">
                                    Breakout Scanner
                                </div>

                                <div style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(2, minmax(0, 1fr));
                                    gap:8px 18px;
                                    color:#cbd5e1;
                                    line-height:1.6;
                                ">

                                    <div>
                                        Price:
                                        <strong>
                                            ${money(breakoutStock.price)}
                                        </strong>
                                    </div>

                                    <div>
                                        Resistance:
                                        <strong>
                                            ${money(breakoutStock.resistance)}
                                        </strong>
                                    </div>

                                    <div>
                                        Above Resistance:
                                        <strong>
                                            ${number(
                                                breakoutStock.distance_above_resistance
                                            )}%
                                        </strong>
                                    </div>

                                    <div>
                                        Resistance Tests:
                                        <strong>
                                            ${breakoutStock.touches}
                                        </strong>
                                    </div>

                                    <div>
                                        Higher Lows:
                                        <strong>
                                            ${breakoutStock.higher_lows}
                                        </strong>
                                    </div>

                                    <div>
                                        Volume Ratio:
                                        <strong>
                                            ${
                                                Number.isFinite(
                                                    Number(
                                                        breakoutStock.volume_ratio
                                                    )
                                                )
                                                    ? number(
                                                        breakoutStock.volume_ratio,
                                                        2
                                                    ) + "×"
                                                    : "—"
                                            }
                                        </strong>
                                    </div>

                                    ${
                                        breakoutStock.grade
                                            ? `
                                                <div>
                                                    EdgeBreak Grade:
                                                    <strong>
                                                        ${breakoutStock.grade}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        breakoutStock.score != null &&
                                        Number.isFinite(
                                            Number(
                                                breakoutStock.score
                                            )
                                        )
                                            ? `
                                                <div>
                                                    EdgeBreak Score:
                                                    <strong>
                                                        ${number(
                                                            breakoutStock.score,
                                                            1
                                                        )}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    PRE-BREAKOUT
                    ================================================= */

                    if (preBreakoutStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:10px;
                                ">
                                    Pre-Breakout Scanner
                                </div>

                                <div style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(2, minmax(0, 1fr));
                                    gap:8px 18px;
                                    color:#cbd5e1;
                                    line-height:1.6;
                                ">

                                    <div>
                                        Price:
                                        <strong>
                                            ${money(
                                                preBreakoutStock.current_price
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        Resistance:
                                        <strong>
                                            ${money(
                                                preBreakoutStock.resistance_price
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        Below Resistance:
                                        <strong>
                                            ${number(
                                                preBreakoutStock.distance_to_resistance
                                            )}%
                                        </strong>
                                    </div>

                                    <div>
                                        Resistance Tests:
                                        <strong>
                                            ${preBreakoutStock.resistance_touches}
                                        </strong>
                                    </div>

                                    <div>
                                        Higher Lows:
                                        <strong>
                                            ${preBreakoutStock.higher_lows}
                                        </strong>
                                    </div>

                                    <div>
                                        20-Day Avg Volume:
                                        <strong>
                                            ${
                                                Number.isFinite(
                                                    Number(
                                                        preBreakoutStock.average_volume_20
                                                    )
                                                )
                                                    ? Math.round(
                                                        Number(
                                                            preBreakoutStock.average_volume_20
                                                        )
                                                    ).toLocaleString("en-US")
                                                    : "—"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        20-Day Dollar Volume:
                                        <strong>
                                            ${
                                                Number.isFinite(
                                                    Number(
                                                        preBreakoutStock.average_dollar_volume_20
                                                    )
                                                )
                                                    ? "$" +
                                                      Math.round(
                                                          Number(
                                                              preBreakoutStock.average_dollar_volume_20
                                                          )
                                                      ).toLocaleString("en-US")
                                                    : "—"
                                            }
                                        </strong>
                                    </div>

                                    ${
                                        preBreakoutStock.liquidity_group
                                            ? `
                                                <div>
                                                    Liquidity Group:
                                                    <strong>
                                                        ${preBreakoutStock.liquidity_group}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    LAUNCH PAD
                    ================================================= */

                    if (launchPadStock) {

                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:10px;
                                ">
                                    Launch Pad Scanner
                                </div>

                                <div style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(2, minmax(0, 1fr));
                                    gap:8px 18px;
                                    color:#cbd5e1;
                                    line-height:1.6;
                                ">

                                    <div>
                                        Price:
                                        <strong>
                                            ${money(
                                                launchPadStock.current_price
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        Base Length:
                                        <strong>
                                            ${launchPadStock.launchpad_days}
                                            days
                                        </strong>
                                    </div>

                                    <div>
                                        Support:
                                        <strong>
                                            ${money(
                                                launchPadStock.support_zone_low
                                            )}
                                            –
                                            ${money(
                                                launchPadStock.support_zone_high
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        Resistance:
                                        <strong>
                                            ${money(
                                                launchPadStock.resistance_zone_low
                                            )}
                                            –
                                            ${money(
                                                launchPadStock.resistance_zone_high
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        Support Tests:
                                        <strong>
                                            ${launchPadStock.support_tests}
                                        </strong>
                                    </div>

                                    <div>
                                        Resistance Tests:
                                        <strong>
                                            ${launchPadStock.resistance_tests}
                                        </strong>
                                    </div>

                                    <div>
                                        Range Width:
                                        <strong>
                                            ${number(
                                                launchPadStock.range_percent
                                            )}%
                                        </strong>
                                    </div>

                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    TECHNICAL INDICATORS
                    ================================================= */

                    if (latestIndicators) {

                        const indicatorPrice =
                            latestIndicators.price == null
                                ? null
                                : Number(
                                    latestIndicators.price
                                );

                        const rsi =
                            latestIndicators.rsi14 == null
                                ? null
                                : Number(
                                    latestIndicators.rsi14
                                );

                        const macd =
                            latestIndicators.macd == null
                                ? null
                                : Number(
                                    latestIndicators.macd
                                );

                        const macdSignal =
                            latestIndicators.macd_signal == null
                                ? null
                                : Number(
                                    latestIndicators.macd_signal
                                );

                        const macdHistogram =
                            latestIndicators.macd_histogram == null
                                ? null
                                : Number(
                                    latestIndicators.macd_histogram
                                );

                        const sma20 =
                            latestIndicators.sma20 == null
                                ? null
                                : Number(
                                    latestIndicators.sma20
                                );

                        const sma50 =
                            latestIndicators.sma50 == null
                                ? null
                                : Number(
                                    latestIndicators.sma50
                                );

                        const sma200 =
                            latestIndicators.sma200 == null
                                ? null
                                : Number(
                                    latestIndicators.sma200
                                );

                        const ema20 =
                            latestIndicators.ema20 == null
                                ? null
                                : Number(
                                    latestIndicators.ema20
                                );

                        const ema50 =
                            latestIndicators.ema50 == null
                                ? null
                                : Number(
                                    latestIndicators.ema50
                                );

                        const bollingerUpper =
                            latestIndicators.bollinger_upper == null
                                ? null
                                : Number(
                                    latestIndicators.bollinger_upper
                                );

                        const bollingerMiddle =
                            latestIndicators.bollinger_middle == null
                                ? null
                                : Number(
                                    latestIndicators.bollinger_middle
                                );

                        const bollingerLower =
                            latestIndicators.bollinger_lower == null
                                ? null
                                : Number(
                                    latestIndicators.bollinger_lower
                                );

                        const atr =
                            latestIndicators.atr14 == null
                                ? null
                                : Number(
                                    latestIndicators.atr14
                                );

                        const averageVolume =
                            latestIndicators.average_volume_20 == null
                                ? null
                                : Number(
                                    latestIndicators.average_volume_20
                                );

                        const relativeVolume =
                            latestIndicators.relative_volume == null
                                ? null
                                : Number(
                                    latestIndicators.relative_volume
                                );

                        const obvTrend =
                            String(
                                latestIndicators.obv_trend || ""
                            ).toLowerCase();


                        technicalText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#38bdf8;
                                    margin-bottom:10px;
                                ">
                                    Technical Indicators
                                </div>

                                <div style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(2, minmax(0, 1fr));
                                    gap:8px 18px;
                                    color:#cbd5e1;
                                    line-height:1.6;
                                ">

                                    ${
                                        Number.isFinite(indicatorPrice)
                                            ? `
                                                <div>
                                                    Indicator Price:
                                                    <strong>
                                                        ${money(indicatorPrice)}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(rsi)
                                            ? `
                                                <div>
                                                    RSI (14):
                                                    <strong>
                                                        ${number(rsi, 1)}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(sma20)
                                            ? `
                                                <div>
                                                    SMA 20:
                                                    <strong>
                                                        ${money(sma20)}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(sma50)
                                            ? `
                                                <div>
                                                    SMA 50:
                                                    <strong>
                                                        ${money(sma50)}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(sma200)
                                            ? `
                                                <div>
                                                    SMA 200:
                                                    <strong>
                                                        ${money(sma200)}
                                                    </strong>
                                                </div>
                                            `
                                            : `
                                                <div>
                                                    SMA 200:
                                                    <strong>—</strong>
                                                </div>
                                            `
                                    }

                                    ${
                                        Number.isFinite(ema20)
                                            ? `
                                                <div>
                                                    EMA 20:
                                                    <strong>
                                                        ${money(ema20)}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(ema50)
                                            ? `
                                                <div>
                                                    EMA 50:
                                                    <strong>
                                                        ${money(ema50)}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(macd)
                                            ? `
                                                <div>
                                                    MACD:
                                                    <strong>
                                                        ${number(macd, 4)}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(macdSignal)
                                            ? `
                                                <div>
                                                    MACD Signal:
                                                    <strong>
                                                        ${number(macdSignal, 4)}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(macdHistogram)
                                            ? `
                                                <div>
                                                    MACD Histogram:
                                                    <strong>
                                                        ${number(
                                                            macdHistogram,
                                                            4
                                                        )}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(atr)
                                            ? `
                                                <div>
                                                    ATR (14):
                                                    <strong>
                                                        ${money(atr)}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(averageVolume)
                                            ? `
                                                <div>
                                                    Avg Volume (20):
                                                    <strong>
                                                        ${Math.round(
                                                            averageVolume
                                                        ).toLocaleString("en-US")}
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(relativeVolume) &&
                                        relativeVolume > 0
                                            ? `
                                                <div>
                                                    Relative Volume:
                                                    <strong>
                                                        ${number(
                                                            relativeVolume,
                                                            2
                                                        )}×
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        obvTrend
                                            ? `
                                                <div>
                                                    OBV Trend:
                                                    <strong>
                                                        ${
                                                            obvTrend === "rising"
                                                                ? "Rising"
                                                                : obvTrend === "falling"
                                                                    ? "Falling"
                                                                    : "Neutral"
                                                        }
                                                    </strong>
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>


                            ${
                                Number.isFinite(bollingerUpper) ||
                                Number.isFinite(bollingerMiddle) ||
                                Number.isFinite(bollingerLower)
                                    ? `

                                        <div style="
                                            padding:14px 0;
                                            border-top:1px solid rgba(148,163,184,.16);
                                        ">

                                            <div style="
                                                font-weight:800;
                                                color:#38bdf8;
                                                margin-bottom:10px;
                                            ">
                                                Bollinger Bands
                                            </div>

                                            <div style="
                                                display:grid;
                                                grid-template-columns:
                                                    repeat(2, minmax(0, 1fr));
                                                gap:8px 18px;
                                                color:#cbd5e1;
                                                line-height:1.6;
                                            ">

                                                ${
                                                    Number.isFinite(
                                                        bollingerUpper
                                                    )
                                                        ? `
                                                            <div>
                                                                Upper Band:
                                                                <strong>
                                                                    ${money(
                                                                        bollingerUpper
                                                                    )}
                                                                </strong>
                                                            </div>
                                                        `
                                                        : ""
                                                }

                                                ${
                                                    Number.isFinite(
                                                        bollingerMiddle
                                                    )
                                                        ? `
                                                            <div>
                                                                Middle Band:
                                                                <strong>
                                                                    ${money(
                                                                        bollingerMiddle
                                                                    )}
                                                                </strong>
                                                            </div>
                                                        `
                                                        : ""
                                                }

                                                ${
                                                    Number.isFinite(
                                                        bollingerLower
                                                    )
                                                        ? `
                                                            <div>
                                                                Lower Band:
                                                                <strong>
                                                                    ${money(
                                                                        bollingerLower
                                                                    )}
                                                                </strong>
                                                            </div>
                                                        `
                                                        : ""
                                                }

                                            </div>

                                        </div>

                                    `
                                    : ""
                            }

                        `;

                    }


                    /* =================================================
                    ANSWER
                    ================================================= */

                    answer = `

                        <div class="edge-ai-rundown">

                            <div style="
                                font-size:18px;
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:6px;
                            ">
                                ${ticker} — Key Technical Numbers
                            </div>

                            ${
                                indicatorDate
                                    ? `
                                        <div style="
                                            color:#64748b;
                                            font-size:12px;
                                            margin-bottom:14px;
                                        ">
                                            Indicator data through
                                            <strong style="color:#94a3b8;">
                                                ${indicatorDate}
                                            </strong>
                                        </div>
                                    `
                                    : ""
                            }

                            ${technicalText}

                            <div style="
                                margin-top:12px;
                                padding-top:12px;
                                border-top:1px solid rgba(148,163,184,.16);
                                color:#64748b;
                                font-size:12px;
                                line-height:1.6;
                            ">
                                Scanner figures come from the current
                                EdgeBreak scanner data. Indicator figures
                                come from EdgeBreak's latest stored
                                technical snapshot for ${ticker}.
                                Technical conditions can change and these
                                figures are not buy, sell or hold
                                recommendations.
                            </div>

                        </div>

                    `;

                }

            }    

            /* =================================================
            QUICK ANSWER #12
            WHICH SCANNER FOUND THIS STOCK?
            ================================================= */

            else if (
                window.edgeBreakQuestionMode === "quick" &&
                selectedQuestion === "scanner-found"
            ) {

                const scanners = [];

                if (breakoutStock) {
                    scanners.push("Breakout Scanner");
                }

                if (preBreakoutStock) {
                    scanners.push("Pre-Breakout Scanner");
                }

                if (launchPadStock) {
                    scanners.push("Launch Pad Scanner");
                }


                let scannerText = "";


                /* =================================================
                SUMMARY
                ================================================= */

                if (scanners.length === 1) {

                    scannerText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#38bdf8;
                                margin-bottom:8px;
                            ">
                                Current Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                <strong>${ticker}</strong> is currently
                                appearing in the

                                <strong>
                                    ${scanners[0]}
                                </strong>.

                                EdgeBreak found the stock because its
                                current chart structure meets the
                                conditions for that scanner.

                            </div>

                        </div>

                    `;

                } else if (scanners.length > 1) {

                    scannerText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#38bdf8;
                                margin-bottom:8px;
                            ">
                                Multiple Scanner Identification
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                <strong>${ticker}</strong> is currently
                                appearing in

                                <strong>
                                    ${scanners.length} EdgeBreak scanners
                                </strong>:

                                <strong>
                                    ${scanners.join(", ")}
                                </strong>.

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                This can happen because the EdgeBreak
                                scanners examine different parts of a
                                stock's technical structure.

                                A stock can therefore meet more than one
                                scanner's criteria at the same time.

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                BREAKOUT SCANNER
                ================================================= */

                if (breakoutStock) {

                    const resistance =
                        Number(
                            breakoutStock.resistance
                        );

                    const currentPrice =
                        Number(
                            breakoutStock.price
                        );

                    const distance =
                        Number(
                            breakoutStock.distance_above_resistance
                        );

                    const touches =
                        Number(
                            breakoutStock.touches
                        );

                    const higherLows =
                        Number(
                            breakoutStock.higher_lows
                        );

                    const volumeRatio =
                        Number(
                            breakoutStock.volume_ratio
                        );


                    scannerText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Breakout Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified ${ticker} because
                                price moved through resistance around

                                <strong>
                                    ${money(resistance)}
                                </strong>.

                                ${
                                    Number.isFinite(currentPrice)
                                        ? `
                                            The scanner recorded price around
                                            <strong>${money(currentPrice)}</strong>.
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(distance)
                                        ? `
                                            That places price approximately
                                            <strong>${number(distance)}% above resistance</strong>.
                                        `
                                        : ""
                                }

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    What the scanner saw:
                                </strong>

                                ${
                                    Number.isFinite(touches)
                                        ? `
                                            <strong>${touches} resistance touches</strong>
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(higherLows)
                                        ? `
                                            ${
                                                Number.isFinite(touches)
                                                    ? "and"
                                                    : ""
                                            }
                                            <strong>${higherLows} higher lows</strong>
                                            before the breakout.
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(volumeRatio)
                                        ? `
                                            Breakout volume was approximately
                                            <strong>${number(volumeRatio, 2)}× normal volume</strong>.
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                PRE-BREAKOUT SCANNER
                ================================================= */

                if (preBreakoutStock) {

                    const resistance =
                        Number(
                            preBreakoutStock.resistance_price
                        );

                    const currentPrice =
                        Number(
                            preBreakoutStock.current_price
                        );

                    const distance =
                        Number(
                            preBreakoutStock.distance_to_resistance
                        );

                    const touches =
                        Number(
                            preBreakoutStock.resistance_touches
                        );

                    const higherLows =
                        Number(
                            preBreakoutStock.higher_lows
                        );


                    scannerText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Pre-Breakout Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified ${ticker} because
                                price is forming technical structure
                                beneath resistance around

                                <strong>
                                    ${money(resistance)}
                                </strong>.

                                ${
                                    Number.isFinite(currentPrice)
                                        ? `
                                            Current scanner price is approximately
                                            <strong>${money(currentPrice)}</strong>.
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(distance)
                                        ? `
                                            Price is approximately
                                            <strong>${number(distance)}% below resistance</strong>.
                                        `
                                        : ""
                                }

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    What the scanner saw:
                                </strong>

                                ${
                                    Number.isFinite(touches)
                                        ? `
                                            <strong>${touches} resistance touches</strong>
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(higherLows)
                                        ? `
                                            ${
                                                Number.isFinite(touches)
                                                    ? "and"
                                                    : ""
                                            }
                                            <strong>${higherLows} higher lows</strong>.
                                        `
                                        : ""
                                }

                                This combination is why the stock
                                currently meets the Pre-Breakout
                                Scanner's structural criteria.

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                LAUNCH PAD SCANNER
                ================================================= */

                if (launchPadStock) {

                    const baseDays =
                        Number(
                            launchPadStock.launchpad_days
                        );

                    const supportTests =
                        Number(
                            launchPadStock.support_tests
                        );

                    const resistanceTests =
                        Number(
                            launchPadStock.resistance_tests
                        );

                    const supportLow =
                        Number(
                            launchPadStock.support_zone_low
                        );

                    const supportHigh =
                        Number(
                            launchPadStock.support_zone_high
                        );

                    const resistanceLow =
                        Number(
                            launchPadStock.resistance_zone_low
                        );

                    const resistanceHigh =
                        Number(
                            launchPadStock.resistance_zone_high
                        );

                    const rangePercent =
                        Number(
                            launchPadStock.range_percent
                        );


                    scannerText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Launch Pad Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified ${ticker} because
                                the stock formed a defined trading base

                                ${
                                    Number.isFinite(baseDays)
                                        ? `
                                            across approximately
                                            <strong>${baseDays} trading days</strong>.
                                        `
                                        : "."
                                }

                                ${
                                    Number.isFinite(rangePercent)
                                        ? `
                                            The stored base range is approximately
                                            <strong>${number(rangePercent)}%</strong>.
                                        `
                                        : ""
                                }

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    What the scanner saw:
                                </strong>

                                ${
                                    Number.isFinite(supportLow) &&
                                    Number.isFinite(supportHigh)
                                        ? `
                                            Support around
                                            <strong>
                                                ${money(supportLow)}–${money(supportHigh)}
                                            </strong>
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(resistanceLow) &&
                                    Number.isFinite(resistanceHigh)
                                        ? `
                                            and resistance around
                                            <strong>
                                                ${money(resistanceLow)}–${money(resistanceHigh)}
                                            </strong>.
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(supportTests)
                                        ? `
                                            EdgeBreak recorded
                                            <strong>${supportTests} support tests</strong>
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(resistanceTests)
                                        ? `
                                            ${
                                                Number.isFinite(supportTests)
                                                    ? "and"
                                                    : "EdgeBreak recorded"
                                            }
                                            <strong>${resistanceTests} resistance tests</strong>.
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                ANSWER
                ================================================= */

                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:6px;
                        ">
                            ${ticker} — Scanner Identification
                        </div>

                        ${
                            indicatorDate
                                ? `
                                    <div style="
                                        color:#64748b;
                                        font-size:12px;
                                        margin-bottom:14px;
                                    ">
                                        Technical data through
                                        <strong style="color:#94a3b8;">
                                            ${indicatorDate}
                                        </strong>
                                    </div>
                                `
                                : ""
                        }

                        ${scannerText}

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            Scanner identification means the stock met
                            EdgeBreak's defined technical screening
                            conditions. It does not represent a buy,
                            sell or hold recommendation.
                        </div>

                    </div>

                `;

            }


            /* =================================================
            QUICK ANSWER #11
            HAS SMART MONEY IDENTIFIED THIS STOCK?
            ================================================= */

            else if (
                selectedQuestion === "smart-money-status"
            ) {

                let smartMoneyText = "";


                /* =================================================
                FOUND IN SMART MONEY DATA
                ================================================= */

                if (smartMoneyStock) {

                    const count =
                        Number(
                            smartMoneyStock.count
                        );

                    const lastSeen =
                        smartMoneyStock.last_seen
                            ? formatDate(
                                smartMoneyStock.last_seen
                            )
                            : "";


                    let appearanceDescription = "";


                    if (
                        Number.isFinite(count) &&
                        count >= 10
                    ) {

                        appearanceDescription = `

                            ${ticker} has appeared
                            <strong>repeatedly</strong> in the Smart Money
                            Filter during the period EdgeBreak has recorded.

                        `;

                    } else if (
                        Number.isFinite(count) &&
                        count >= 3
                    ) {

                        appearanceDescription = `

                            ${ticker} has made
                            <strong>multiple appearances</strong> in the
                            Smart Money Filter during the period EdgeBreak
                            has recorded.

                        `;

                    } else if (
                        Number.isFinite(count) &&
                        count >= 1
                    ) {

                        appearanceDescription = `

                            ${ticker} has been identified by the
                            Smart Money Filter during the period
                            EdgeBreak has recorded.

                        `;

                    }


                    smartMoneyText = `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#a78bfa;
                                margin-bottom:8px;
                            ">
                                Smart Money Filter
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                <strong style="color:#f8fafc;">
                                    Yes.
                                </strong>

                                ${
                                    Number.isFinite(count)
                                        ? `
                                            ${ticker} has appeared in the
                                            EdgeBreak Smart Money Filter

                                            <strong>
                                                ${count}
                                                ${
                                                    count === 1
                                                        ? "time"
                                                        : "times"
                                                }
                                            </strong>.
                                        `
                                        : `
                                            ${ticker} has appeared in the
                                            EdgeBreak Smart Money Filter.
                                        `
                                }

                                ${
                                    lastSeen
                                        ? `
                                            The most recent recorded appearance was
                                            <strong>${lastSeen}</strong>.
                                        `
                                        : ""
                                }

                            </div>

                            ${
                                appearanceDescription
                                    ? `
                                        <div style="
                                            margin-top:10px;
                                            color:#94a3b8;
                                            line-height:1.7;
                                        ">

                                            <strong style="color:#e2e8f0;">
                                                What that tells us:
                                            </strong>

                                            ${appearanceDescription}

                                        </div>
                                    `
                                    : ""
                            }

                        </div>


                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#38bdf8;
                                margin-bottom:8px;
                            ">
                                How to Read This
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                The Smart Money Filter is an EdgeBreak
                                research filter designed to highlight
                                stocks meeting its defined market-activity
                                criteria.

                                Repeated appearances show that a stock
                                has met those criteria on multiple
                                occasions within EdgeBreak's stored data.

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                A Smart Money appearance does
                                <strong>not prove that institutions are
                                buying the stock</strong>, and it should
                                not be interpreted as a prediction of
                                future price movement.

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                NOT FOUND
                ================================================= */

                else {

                    smartMoneyText = `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#94a3b8;
                                margin-bottom:8px;
                            ">
                                Smart Money Filter
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                <strong style="color:#f8fafc;">
                                    No recorded appearance.
                                </strong>

                                EdgeBreak has not recorded ${ticker}
                                in the Smart Money Filter data currently
                                available to the chatbot.

                            </div>

                        </div>


                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#38bdf8;
                                margin-bottom:8px;
                            ">
                                Important Context
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                The Smart Money Filter is still building
                                its historical dataset.

                                A stock having no recorded appearance
                                simply means EdgeBreak has not recorded
                                it meeting the filter criteria during
                                the available observation period.

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                It does <strong>not</strong> mean that
                                institutional activity is absent.

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                ANSWER
                ================================================= */

                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:12px;
                        ">
                            ${ticker} — Smart Money
                        </div>

                        ${smartMoneyText}

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            Smart Money Filter appearances describe
                            EdgeBreak's own screening results. They do
                            not confirm institutional transactions and
                            are not buy, sell or hold recommendations.
                        </div>

                    </div>

                `;

            }


            /* =================================================
            QUICK ANSWER #10
            HOW LONG HAS THIS SETUP BEEN FORMING?
            ================================================= */

            else if (
                selectedQuestion === "setup-age"
            ) {

                let ageText = "";


                /* =================================================
                HISTORY OBSERVATION DATES
                ================================================= */

                let historyDates = [];


                if (
                    Array.isArray(indicatorHistory) &&
                    indicatorHistory.length
                ) {

                    historyDates =
                        indicatorHistory
                            .map(
                                item =>
                                    item && item.date
                                        ? String(item.date)
                                        : ""
                            )
                            .filter(Boolean)
                            .sort();

                }


                const firstHistoryDate =
                    historyDates.length
                        ? historyDates[0]
                        : "";

                const lastHistoryDate =
                    historyDates.length
                        ? historyDates[
                            historyDates.length - 1
                        ]
                        : "";


                /* =================================================
                LAUNCH PAD
                ================================================= */

                if (launchPadStock) {

                    const baseDays =
                        Number(
                            launchPadStock.launchpad_days
                        );

                    const supportTests =
                        Number(
                            launchPadStock.support_tests
                        );

                    const resistanceTests =
                        Number(
                            launchPadStock.resistance_tests
                        );


                    let baseDescription = "";


                    if (
                        Number.isFinite(baseDays) &&
                        baseDays >= 105
                    ) {

                        baseDescription =
                            `This is a relatively long base, representing roughly <strong>${number(baseDays / 21, 1)} months of trading sessions</strong>.`;

                    } else if (
                        Number.isFinite(baseDays) &&
                        baseDays >= 84
                    ) {

                        baseDescription =
                            `This is an established multi-month base, representing roughly <strong>${number(baseDays / 21, 1)} months of trading sessions</strong>.`;

                    } else if (
                        Number.isFinite(baseDays) &&
                        baseDays >= 63
                    ) {

                        baseDescription =
                            `This represents roughly <strong>${number(baseDays / 21, 1)} months of trading sessions</strong> inside the base structure.`;

                    } else if (
                        Number.isFinite(baseDays)
                    ) {

                        baseDescription =
                            `EdgeBreak identified approximately <strong>${baseDays} trading days</strong> in the stored base structure.`;

                    }


                    ageText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Launch Pad Formation
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified a
                                <strong>${baseDays}-day base</strong>
                                for ${ticker}.

                                ${
                                    Number.isFinite(supportTests)
                                        ? `
                                            The structure contains
                                            <strong>${supportTests} support tests</strong>
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(resistanceTests)
                                        ? `
                                            and
                                            <strong>${resistanceTests} resistance tests</strong>.
                                        `
                                        : "."
                                }

                            </div>

                            ${
                                baseDescription
                                    ? `
                                        <div style="
                                            margin-top:10px;
                                            color:#94a3b8;
                                            line-height:1.7;
                                        ">

                                            <strong style="color:#e2e8f0;">
                                                In plain English:
                                            </strong>

                                            ${baseDescription}

                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                    `;

                }


                /* =================================================
                PRE-BREAKOUT
                ================================================= */

                if (preBreakoutStock) {

                    const structureStart =
                        preBreakoutStock.structure_start
                            ? new Date(
                                preBreakoutStock.structure_start
                            )
                            : null;

                    const structureEnd =
                        preBreakoutStock.structure_end
                            ? new Date(
                                preBreakoutStock.structure_end
                            )
                            : null;


                    let formationDays = null;


                    if (
                        structureStart &&
                        structureEnd &&
                        !Number.isNaN(
                            structureStart.getTime()
                        ) &&
                        !Number.isNaN(
                            structureEnd.getTime()
                        ) &&
                        structureEnd >= structureStart
                    ) {

                        formationDays =
                            Math.round(
                                (
                                    structureEnd -
                                    structureStart
                                ) /
                                (
                                    1000 *
                                    60 *
                                    60 *
                                    24
                                )
                            );

                    }


                    ageText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Pre-Breakout Formation
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} currently has an active
                                Pre-Breakout structure with

                                <strong>
                                    ${preBreakoutStock.resistance_touches}
                                    resistance touches
                                </strong>

                                and

                                <strong>
                                    ${preBreakoutStock.higher_lows}
                                    higher lows
                                </strong>.

                                ${
                                    structureStart &&
                                    !Number.isNaN(
                                        structureStart.getTime()
                                    )
                                        ? `
                                            The stored structure begins around
                                            <strong>${formatDate(preBreakoutStock.structure_start)}</strong>.
                                        `
                                        : ""
                                }

                                ${
                                    structureEnd &&
                                    !Number.isNaN(
                                        structureEnd.getTime()
                                    )
                                        ? `
                                            The latest stored structure date is
                                            <strong>${formatDate(preBreakoutStock.structure_end)}</strong>.
                                        `
                                        : ""
                                }

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Formation period:
                                </strong>

                                ${
                                    Number.isFinite(formationDays)
                                        ? `
                                            The stored structure spans approximately
                                            <strong>${formationDays} calendar days</strong>.
                                            This is the period represented by the
                                            scanner's structure dates rather than
                                            an estimate made by the chatbot.
                                        `
                                        : `
                                            EdgeBreak does not currently have two
                                            reliable structure dates available to
                                            calculate an exact formation period.
                                        `
                                }

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                BREAKOUT
                ================================================= */

                if (breakoutStock) {

                    ageText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Breakout Formation
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} is currently appearing as a
                                completed breakout structure.

                                Before price moved through resistance,
                                EdgeBreak recorded

                                <strong>
                                    ${breakoutStock.touches}
                                    resistance touches
                                </strong>

                                and

                                <strong>
                                    ${breakoutStock.higher_lows}
                                    higher lows
                                </strong>.

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Formation period:
                                </strong>

                                The current Breakout Scanner record does
                                not contain a reliable start date for the
                                original structure, so EdgeBreak will not
                                invent an exact formation duration.

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                EDGEBREAK OBSERVATION HISTORY
                ================================================= */

                if (
                    firstHistoryDate &&
                    lastHistoryDate
                ) {

                    const firstDate =
                        new Date(
                            firstHistoryDate
                        );

                    const lastDate =
                        new Date(
                            lastHistoryDate
                        );


                    let observationDays = null;


                    if (
                        !Number.isNaN(
                            firstDate.getTime()
                        ) &&
                        !Number.isNaN(
                            lastDate.getTime()
                        )
                    ) {

                        observationDays =
                            Math.round(
                                (
                                    lastDate -
                                    firstDate
                                ) /
                                (
                                    1000 *
                                    60 *
                                    60 *
                                    24
                                )
                            );

                    }


                    ageText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#38bdf8;
                                margin-bottom:8px;
                            ">
                                EdgeBreak Observation History
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak's stored indicator history
                                currently contains records for ${ticker}
                                from

                                <strong>
                                    ${formatDate(firstHistoryDate)}
                                </strong>

                                through

                                <strong>
                                    ${formatDate(lastHistoryDate)}
                                </strong>.

                                ${
                                    Number.isFinite(observationDays) &&
                                    observationDays > 0
                                        ? `
                                            That represents approximately
                                            <strong>${observationDays} calendar days</strong>
                                            of stored EdgeBreak observations.
                                        `
                                        : ""
                                }

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Important distinction:
                                </strong>

                                This tells us how long EdgeBreak has
                                stored observations for the stock.
                                It does <strong>not</strong> necessarily
                                mean the current chart setup began on
                                that first date.

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                ANSWER
                ================================================= */

                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:6px;
                        ">
                            ${ticker} — How Long Has the Setup Been Forming?
                        </div>

                        ${
                            indicatorDate
                                ? `
                                    <div style="
                                        color:#64748b;
                                        font-size:12px;
                                        margin-bottom:14px;
                                    ">
                                        Technical data through
                                        <strong style="color:#94a3b8;">
                                            ${indicatorDate}
                                        </strong>
                                    </div>
                                `
                                : ""
                        }

                        ${ageText}

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            EdgeBreak reports setup duration only when it
                            can be supported by stored scanner data.
                            Observation history and actual pattern
                            formation dates are treated separately.
                        </div>

                    </div>

                `;

            }

            /* =================================================
            QUICK ANSWER #9
            HOW STRONG IS THIS SETUP?
            ================================================= */

            else if (
                selectedQuestion === "setup-strength"
            ) {

                let strengthText = "";
                let positiveFactors = [];
                let cautionFactors = [];


                /* =================================================
                BREAKOUT STRUCTURE
                ================================================= */

                if (breakoutStock) {

                    const touches =
                        Number(
                            breakoutStock.touches
                        );

                    const higherLows =
                        Number(
                            breakoutStock.higher_lows
                        );

                    const volumeRatio =
                        Number(
                            breakoutStock.volume_ratio
                        );

                    const distance =
                        Number(
                            breakoutStock.distance_above_resistance
                        );


                    let structureAssessment = "";


                    if (
                        touches >= 3 &&
                        higherLows >= 3
                    ) {

                        structureAssessment =
                            `The breakout formed from a <strong>well-established technical structure</strong>, with repeated resistance testing and multiple higher lows.`;

                        positiveFactors.push(
                            `${touches} resistance touches and ${higherLows} higher lows`
                        );

                    } else if (
                        touches >= 2 &&
                        higherLows >= 1
                    ) {

                        structureAssessment =
                            `The breakout formed from an <strong>established technical structure</strong>, with repeated resistance interaction and a developing higher-low pattern.`;

                    } else {

                        structureAssessment =
                            `The stock met EdgeBreak's Breakout Scanner conditions, although fewer structural confirmations are present in the stored setup data.`;

                        cautionFactors.push(
                            "Fewer structural confirmations in the stored breakout setup"
                        );

                    }


                    if (
                        Number.isFinite(volumeRatio) &&
                        volumeRatio >= 1.5
                    ) {

                        positiveFactors.push(
                            `Breakout volume was ${number(volumeRatio, 2)}× normal volume`
                        );

                    } else if (
                        Number.isFinite(volumeRatio) &&
                        volumeRatio < 1
                    ) {

                        cautionFactors.push(
                            `Breakout volume was only ${number(volumeRatio, 2)}× normal volume`
                        );

                    }


                    if (
                        Number.isFinite(distance) &&
                        distance > 5
                    ) {

                        cautionFactors.push(
                            `Price is already ${number(distance)}% above the original resistance level`
                        );

                    }


                    strengthText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Breakout Structure
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak recorded
                                <strong>${touches} resistance touches</strong>
                                and
                                <strong>${higherLows} higher lows</strong>
                                before price moved through resistance around
                                <strong>${money(breakoutStock.resistance)}</strong>.

                                ${
                                    breakoutStock.grade
                                        ? `
                                            The scanner assigned the setup an
                                            EdgeBreak grade of
                                            <strong>${breakoutStock.grade}</strong>.
                                        `
                                        : ""
                                }

                                ${
                                    Number.isFinite(volumeRatio)
                                        ? `
                                            Breakout volume was approximately
                                            <strong>${number(volumeRatio, 2)}× normal volume</strong>.
                                        `
                                        : ""
                                }

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Structure assessment:
                                </strong>

                                ${structureAssessment}

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                PRE-BREAKOUT STRUCTURE
                ================================================= */

                if (preBreakoutStock) {

                    const touches =
                        Number(
                            preBreakoutStock.resistance_touches
                        );

                    const higherLows =
                        Number(
                            preBreakoutStock.higher_lows
                        );

                    const distance =
                        Number(
                            preBreakoutStock.distance_to_resistance
                        );


                    let structureAssessment = "";


                    if (
                        touches >= 3 &&
                        higherLows >= 3
                    ) {

                        structureAssessment =
                            `The scanner has identified a <strong>well-established technical structure</strong>, with repeated resistance testing and multiple higher lows.`;

                        positiveFactors.push(
                            `${touches} resistance touches and ${higherLows} higher lows`
                        );

                    } else if (
                        touches >= 2 &&
                        higherLows >= 1
                    ) {

                        structureAssessment =
                            `The stock has an <strong>established developing structure</strong>, with repeated resistance interaction and higher lows present.`;

                    } else {

                        structureAssessment =
                            `The stock meets the Pre-Breakout Scanner conditions, although fewer structural confirmations are currently present.`;

                        cautionFactors.push(
                            "Fewer structural confirmations in the stored pre-breakout setup"
                        );

                    }


                    if (
                        Number.isFinite(distance) &&
                        distance <= 1
                    ) {

                        positiveFactors.push(
                            `Price is within ${number(distance)}% of resistance`
                        );

                    }


                    strengthText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Pre-Breakout Structure
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak has recorded
                                <strong>${touches} resistance touches</strong>
                                and
                                <strong>${higherLows} higher lows</strong>.

                                Resistance is around
                                <strong>${money(preBreakoutStock.resistance_price)}</strong>,
                                with price approximately
                                <strong>${number(distance)}% below that level</strong>.

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Structure assessment:
                                </strong>

                                ${structureAssessment}

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                LAUNCH PAD STRUCTURE
                ================================================= */

                if (launchPadStock) {

                    const supportTests =
                        Number(
                            launchPadStock.support_tests
                        );

                    const resistanceTests =
                        Number(
                            launchPadStock.resistance_tests
                        );

                    const baseDays =
                        Number(
                            launchPadStock.launchpad_days
                        );

                    const rangePercent =
                        Number(
                            launchPadStock.range_percent
                        );


                    let structureAssessment = "";


                    if (
                        supportTests >= 3 &&
                        resistanceTests >= 3 &&
                        baseDays >= 84
                    ) {

                        structureAssessment =
                            `EdgeBreak has identified a <strong>well-established base</strong>, with repeated testing of both sides of the range over an extended period.`;

                        positiveFactors.push(
                            `${baseDays}-day base with ${supportTests} support tests and ${resistanceTests} resistance tests`
                        );

                    } else if (
                        supportTests >= 2 &&
                        resistanceTests >= 2
                    ) {

                        structureAssessment =
                            `The stock has an <strong>established trading base</strong>, with repeated interaction around both support and resistance.`;

                    } else {

                        structureAssessment =
                            `EdgeBreak has identified a defined base, although fewer repeated tests of the range boundaries are present.`;

                        cautionFactors.push(
                            "Fewer repeated tests of the Launch Pad range boundaries"
                        );

                    }


                    strengthText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Launch Pad Structure
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified a
                                <strong>${baseDays}-day base</strong>
                                with
                                <strong>${supportTests} support tests</strong>
                                and
                                <strong>${resistanceTests} resistance tests</strong>.

                                The range between the identified support
                                and resistance areas is approximately
                                <strong>${number(rangePercent)}%</strong>.

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Structure assessment:
                                </strong>

                                ${structureAssessment}

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                INDICATOR CONFIRMATION
                ================================================= */

                if (latestIndicators) {

                    const price =
                        Number(
                            latestIndicators.price
                        );

                    const rsi =
                        Number(
                            latestIndicators.rsi14
                        );

                    const macd =
                        Number(
                            latestIndicators.macd
                        );

                    const macdSignal =
                        Number(
                            latestIndicators.macd_signal
                        );

                    const sma20 =
                        Number(
                            latestIndicators.sma20
                        );

                    const sma50 =
                        Number(
                            latestIndicators.sma50
                        );

                    const sma200 =
                        Number(
                            latestIndicators.sma200
                        );

                    const relativeVolume =
                        Number(
                            latestIndicators.relative_volume
                        );

                    const obvTrend =
                        String(
                            latestIndicators.obv_trend || ""
                        ).toLowerCase();


                    /* ---------------------------------------------
                    TREND
                    --------------------------------------------- */

                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma20) &&
                        Number.isFinite(sma50)
                    ) {

                        if (
                            price > sma20 &&
                            price > sma50 &&
                            sma20 > sma50
                        ) {

                            positiveFactors.push(
                                "Price is above the 20-day and 50-day SMAs, with the 20-day SMA above the 50-day SMA"
                            );

                        } else if (
                            price < sma20 &&
                            price < sma50
                        ) {

                            cautionFactors.push(
                                "Price is below both the 20-day and 50-day SMAs"
                            );

                        }

                    }


                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma200)
                    ) {

                        if (price > sma200) {

                            positiveFactors.push(
                                "Price is above the 200-day SMA"
                            );

                        } else {

                            cautionFactors.push(
                                "Price is below the 200-day SMA"
                            );

                        }

                    }


                    /* ---------------------------------------------
                    RSI
                    --------------------------------------------- */

                    if (Number.isFinite(rsi)) {

                        if (
                            rsi >= 50 &&
                            rsi < 70
                        ) {

                            positiveFactors.push(
                                `RSI is ${number(rsi, 1)}, showing positive momentum without an elevated 70+ reading`
                            );

                        } else if (rsi >= 70) {

                            positiveFactors.push(
                                `RSI is ${number(rsi, 1)}, showing strong recent momentum`
                            );

                            cautionFactors.push(
                                `RSI is also elevated above 70`
                            );

                        } else if (rsi < 40) {

                            cautionFactors.push(
                                `RSI is ${number(rsi, 1)}, showing softer recent momentum`
                            );

                        }

                    }


                    /* ---------------------------------------------
                    MACD
                    --------------------------------------------- */

                    if (
                        Number.isFinite(macd) &&
                        Number.isFinite(macdSignal)
                    ) {

                        if (macd > macdSignal) {

                            positiveFactors.push(
                                "MACD is above its signal line"
                            );

                        } else if (macd < macdSignal) {

                            cautionFactors.push(
                                "MACD is below its signal line"
                            );

                        }

                    }


                    /* ---------------------------------------------
                    RELATIVE VOLUME
                    --------------------------------------------- */

                    if (
                        Number.isFinite(relativeVolume) &&
                        relativeVolume >= 1.5
                    ) {

                        positiveFactors.push(
                            `Latest recorded volume is ${number(relativeVolume, 2)}× the 20-day average`
                        );

                    }


                    /* ---------------------------------------------
                    OBV
                    --------------------------------------------- */

                    if (obvTrend === "rising") {

                        positiveFactors.push(
                            "On-Balance Volume is rising"
                        );

                    } else if (
                        obvTrend === "falling"
                    ) {

                        cautionFactors.push(
                            "On-Balance Volume is falling"
                        );

                    }

                }


                /* =================================================
                REMOVE DUPLICATES
                ================================================= */

                positiveFactors = [
                    ...new Set(
                        positiveFactors
                    )
                ];

                cautionFactors = [
                    ...new Set(
                        cautionFactors
                    )
                ];


                /* =================================================
                CONFIRMING FACTORS
                ================================================= */

                if (positiveFactors.length) {

                    strengthText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#38bdf8;
                                margin-bottom:10px;
                            ">
                                Confirming Factors
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.8;
                            ">

                                ${positiveFactors
                                    .map(
                                        factor => `
                                            <div style="margin-bottom:7px;">
                                                <strong style="color:#f8fafc;">
                                                    •
                                                </strong>
                                                ${factor}
                                            </div>
                                        `
                                    )
                                    .join("")}

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                MIXED / CAUTION FACTORS
                ================================================= */

                if (cautionFactors.length) {

                    strengthText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#f59e0b;
                                margin-bottom:10px;
                            ">
                                Factors to Keep in Context
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.8;
                            ">

                                ${cautionFactors
                                    .map(
                                        factor => `
                                            <div style="margin-bottom:7px;">
                                                <strong style="color:#f8fafc;">
                                                    •
                                                </strong>
                                                ${factor}
                                            </div>
                                        `
                                    )
                                    .join("")}

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                PLAIN-ENGLISH ASSESSMENT
                ================================================= */

                let assessmentText = "";


                if (
                    positiveFactors.length >= 4 &&
                    cautionFactors.length <= 1
                ) {

                    assessmentText =
                        `The current EdgeBreak data shows <strong>multiple technical characteristics supporting the structure</strong>. The scanner pattern is being accompanied by several trend, momentum or volume confirmations.`;

                } else if (
                    positiveFactors.length >= 2
                ) {

                    assessmentText =
                        `The setup has <strong>several supporting technical characteristics</strong>, although not every indicator is pointing in the same direction.`;

                } else if (
                    cautionFactors.length >= 3
                ) {

                    assessmentText =
                        `The scanner structure is present, but the current indicator picture is <strong>more mixed</strong>, with several factors that should be kept in context.`;

                } else {

                    assessmentText =
                        `EdgeBreak has identified enough structure for the stock to qualify for its scanner, while the additional indicator confirmation is currently <strong>mixed or limited</strong>.`;

                }


                strengthText += `

                    <div style="
                        padding:14px 0;
                        border-top:1px solid rgba(148,163,184,.16);
                    ">

                        <div style="
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:8px;
                        ">
                            Overall Technical Picture
                        </div>

                        <div style="
                            color:#cbd5e1;
                            line-height:1.7;
                        ">

                            ${assessmentText}

                        </div>

                    </div>

                `;


                /* =================================================
                ANSWER
                ================================================= */

                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:6px;
                        ">
                            ${ticker} — Setup Strength
                        </div>

                        ${
                            indicatorDate
                                ? `
                                    <div style="
                                        color:#64748b;
                                        font-size:12px;
                                        margin-bottom:14px;
                                    ">
                                        Technical data through
                                        <strong style="color:#94a3b8;">
                                            ${indicatorDate}
                                        </strong>
                                    </div>
                                `
                                : ""
                        }

                        ${strengthText}

                        <div style="
                            margin-top:10px;
                            color:#94a3b8;
                            line-height:1.7;
                        ">

                            <strong style="color:#e2e8f0;">
                                What "strength" means here:
                            </strong>

                            EdgeBreak is describing the amount of technical
                            structure and indicator confirmation currently
                            present. It is not estimating the probability
                            that the stock will rise.

                        </div>

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            Technical conditions can change quickly.
                            EdgeBreak provides research and market
                            information only and does not provide buy,
                            sell or hold recommendations.
                        </div>

                    </div>

                `;

            }

            /* =================================================
            QUICK ANSWER #8
            ANYTHING I SHOULD KNOW QUICKLY?
            ================================================= */

            else if (
                selectedQuestion === "anything-important"
            ) {

                let importantText = "";
                let flagCount = 0;


                /* =================================================
                SCANNER POSITION
                ================================================= */

                if (breakoutStock) {

                    const distance =
                        Number(
                            breakoutStock.distance_above_resistance
                        );

                    const volumeRatio =
                        Number(
                            breakoutStock.volume_ratio
                        );


                    let breakoutFlags = "";


                    if (Number.isFinite(distance)) {

                        if (distance <= 2) {

                            breakoutFlags += `

                                <div style="margin-bottom:8px;">
                                    <strong style="color:#f8fafc;">
                                        • Close to breakout level:
                                    </strong>

                                    Price is only
                                    <strong>${number(distance)}% above</strong>
                                    resistance around
                                    <strong>${money(breakoutStock.resistance)}</strong>.
                                </div>

                            `;

                            flagCount++;

                        } else if (distance > 5) {

                            breakoutFlags += `

                                <div style="margin-bottom:8px;">
                                    <strong style="color:#f8fafc;">
                                        • Extended from breakout area:
                                    </strong>

                                    Price is already
                                    <strong>${number(distance)}% above</strong>
                                    the resistance level around
                                    <strong>${money(breakoutStock.resistance)}</strong>.
                                </div>

                            `;

                            flagCount++;

                        }

                    }


                    if (
                        Number.isFinite(volumeRatio) &&
                        volumeRatio >= 1.5
                    ) {

                        breakoutFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Elevated breakout volume:
                                </strong>

                                The breakout was recorded with approximately
                                <strong>${number(volumeRatio, 2)}× normal volume</strong>.
                            </div>

                        `;

                        flagCount++;

                    }


                    if (breakoutFlags) {

                        importantText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:10px;
                                ">
                                    Breakout Structure
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${breakoutFlags}
                                </div>

                            </div>

                        `;

                    }

                }


                /* =================================================
                PRE-BREAKOUT POSITION
                ================================================= */

                if (preBreakoutStock) {

                    const distance =
                        Number(
                            preBreakoutStock.distance_to_resistance
                        );


                    let preBreakoutFlags = "";


                    if (
                        Number.isFinite(distance) &&
                        distance <= 1
                    ) {

                        preBreakoutFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Very close to resistance:
                                </strong>

                                Price is approximately
                                <strong>${number(distance)}% below</strong>
                                resistance around
                                <strong>${money(preBreakoutStock.resistance_price)}</strong>.
                            </div>

                        `;

                        flagCount++;

                    } else if (
                        Number.isFinite(distance) &&
                        distance <= 3
                    ) {

                        preBreakoutFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Approaching resistance:
                                </strong>

                                Price is approximately
                                <strong>${number(distance)}% below</strong>
                                resistance around
                                <strong>${money(preBreakoutStock.resistance_price)}</strong>.
                            </div>

                        `;

                        flagCount++;

                    }


                    if (
                        Number(preBreakoutStock.resistance_touches) >= 3
                    ) {

                        preBreakoutFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Repeated resistance testing:
                                </strong>

                                EdgeBreak has recorded
                                <strong>${preBreakoutStock.resistance_touches} resistance touches</strong>.
                            </div>

                        `;

                        flagCount++;

                    }


                    if (
                        Number(preBreakoutStock.higher_lows) >= 3
                    ) {

                        preBreakoutFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Higher-low structure:
                                </strong>

                                EdgeBreak has recorded
                                <strong>${preBreakoutStock.higher_lows} higher lows</strong>
                                within the current setup.
                            </div>

                        `;

                        flagCount++;

                    }


                    if (preBreakoutFlags) {

                        importantText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:10px;
                                ">
                                    Pre-Breakout Structure
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${preBreakoutFlags}
                                </div>

                            </div>

                        `;

                    }

                }


                /* =================================================
                LAUNCH PAD POSITION
                ================================================= */

                if (launchPadStock) {

                    const currentPrice =
                        Number(
                            launchPadStock.current_price
                        );

                    const supportLow =
                        Number(
                            launchPadStock.support_zone_low
                        );

                    const supportHigh =
                        Number(
                            launchPadStock.support_zone_high
                        );

                    const resistanceLow =
                        Number(
                            launchPadStock.resistance_zone_low
                        );

                    const resistanceHigh =
                        Number(
                            launchPadStock.resistance_zone_high
                        );


                    let launchFlags = "";


                    if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceLow) &&
                        Number.isFinite(resistanceHigh) &&
                        currentPrice >= resistanceLow &&
                        currentPrice <= resistanceHigh
                    ) {

                        launchFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Price is in the resistance zone:
                                </strong>

                                The Launch Pad resistance area is approximately
                                <strong>${money(resistanceLow)}–${money(resistanceHigh)}</strong>.
                            </div>

                        `;

                        flagCount++;

                    }


                    if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(supportLow) &&
                        Number.isFinite(supportHigh) &&
                        currentPrice >= supportLow &&
                        currentPrice <= supportHigh
                    ) {

                        launchFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Price is around support:
                                </strong>

                                The Launch Pad support area is approximately
                                <strong>${money(supportLow)}–${money(supportHigh)}</strong>.
                            </div>

                        `;

                        flagCount++;

                    }


                    if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceHigh) &&
                        currentPrice > resistanceHigh
                    ) {

                        const above =
                            (
                                (
                                    currentPrice -
                                    resistanceHigh
                                ) /
                                resistanceHigh
                            ) * 100;


                        launchFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Above the stored Launch Pad range:
                                </strong>

                                Price is approximately
                                <strong>${number(above)}% above</strong>
                                the top of the original resistance zone.
                            </div>

                        `;

                        flagCount++;

                    }


                    if (launchFlags) {

                        importantText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:10px;
                                ">
                                    Launch Pad Structure
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${launchFlags}
                                </div>

                            </div>

                        `;

                    }

                }


                /* =================================================
                INDICATOR FLAGS
                ================================================= */

                if (latestIndicators) {

                    const price =
                        Number(
                            latestIndicators.price
                        );

                    const rsi =
                        Number(
                            latestIndicators.rsi14
                        );

                    const macd =
                        Number(
                            latestIndicators.macd
                        );

                    const macdSignal =
                        Number(
                            latestIndicators.macd_signal
                        );

                    const sma20 =
                        Number(
                            latestIndicators.sma20
                        );

                    const sma50 =
                        Number(
                            latestIndicators.sma50
                        );

                    const sma200 =
                        Number(
                            latestIndicators.sma200
                        );

                    const bollingerUpper =
                        Number(
                            latestIndicators.bollinger_upper
                        );

                    const bollingerLower =
                        Number(
                            latestIndicators.bollinger_lower
                        );

                    const relativeVolume =
                        Number(
                            latestIndicators.relative_volume
                        );

                    const obvTrend =
                        String(
                            latestIndicators.obv_trend || ""
                        ).toLowerCase();


                    let indicatorFlags = "";


                    /* ---------------------------------------------
                    RSI
                    --------------------------------------------- */

                    if (
                        Number.isFinite(rsi) &&
                        rsi >= 70
                    ) {

                        indicatorFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Elevated RSI:
                                </strong>

                                RSI is
                                <strong>${number(rsi, 1)}</strong>,
                                showing strong recent momentum with an
                                elevated reading.
                            </div>

                        `;

                        flagCount++;

                    } else if (
                        Number.isFinite(rsi) &&
                        rsi <= 30
                    ) {

                        indicatorFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Low RSI:
                                </strong>

                                RSI is
                                <strong>${number(rsi, 1)}</strong>,
                                reflecting weak recent momentum.
                            </div>

                        `;

                        flagCount++;

                    }


                    /* ---------------------------------------------
                    MOVING AVERAGE ALIGNMENT
                    --------------------------------------------- */

                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma20) &&
                        Number.isFinite(sma50)
                    ) {

                        if (
                            price > sma20 &&
                            price > sma50 &&
                            sma20 > sma50
                        ) {

                            indicatorFlags += `

                                <div style="margin-bottom:8px;">
                                    <strong style="color:#f8fafc;">
                                        • Positive short-term trend alignment:
                                    </strong>

                                    Price is above both the 20-day and
                                    50-day moving averages, with the
                                    20-day SMA also above the 50-day SMA.
                                </div>

                            `;

                            flagCount++;

                        } else if (
                            price < sma20 &&
                            price < sma50 &&
                            sma20 < sma50
                        ) {

                            indicatorFlags += `

                                <div style="margin-bottom:8px;">
                                    <strong style="color:#f8fafc;">
                                        • Weak short-term trend alignment:
                                    </strong>

                                    Price is below both the 20-day and
                                    50-day moving averages, with the
                                    20-day SMA below the 50-day SMA.
                                </div>

                            `;

                            flagCount++;

                        }

                    }


                    /* ---------------------------------------------
                    LONG-TERM MOVING AVERAGE
                    --------------------------------------------- */

                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma200)
                    ) {

                        if (price > sma200) {

                            indicatorFlags += `

                                <div style="margin-bottom:8px;">
                                    <strong style="color:#f8fafc;">
                                        • Above the 200-day average:
                                    </strong>

                                    Price is currently above the
                                    200-day SMA at
                                    <strong>${money(sma200)}</strong>.
                                </div>

                            `;

                            flagCount++;

                        } else {

                            indicatorFlags += `

                                <div style="margin-bottom:8px;">
                                    <strong style="color:#f8fafc;">
                                        • Below the 200-day average:
                                    </strong>

                                    Price is currently below the
                                    200-day SMA at
                                    <strong>${money(sma200)}</strong>.
                                </div>

                            `;

                            flagCount++;

                        }

                    }


                    /* ---------------------------------------------
                    MACD
                    --------------------------------------------- */

                    if (
                        Number.isFinite(macd) &&
                        Number.isFinite(macdSignal)
                    ) {

                        if (macd > macdSignal) {

                            indicatorFlags += `

                                <div style="margin-bottom:8px;">
                                    <strong style="color:#f8fafc;">
                                        • MACD above signal:
                                    </strong>

                                    MACD is currently above its signal
                                    line, supporting positive short-term
                                    momentum.
                                </div>

                            `;

                            flagCount++;

                        } else if (macd < macdSignal) {

                            indicatorFlags += `

                                <div style="margin-bottom:8px;">
                                    <strong style="color:#f8fafc;">
                                        • MACD below signal:
                                    </strong>

                                    MACD is currently below its signal
                                    line, showing softer short-term
                                    momentum.
                                </div>

                            `;

                            flagCount++;

                        }

                    }


                    /* ---------------------------------------------
                    BOLLINGER POSITION
                    --------------------------------------------- */

                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(bollingerUpper) &&
                        price >= bollingerUpper
                    ) {

                        indicatorFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • At the upper Bollinger Band:
                                </strong>

                                Price is at or above the upper band
                                around
                                <strong>${money(bollingerUpper)}</strong>,
                                placing it near the upper edge of its
                                recent trading envelope.
                            </div>

                        `;

                        flagCount++;

                    } else if (
                        Number.isFinite(price) &&
                        Number.isFinite(bollingerLower) &&
                        price <= bollingerLower
                    ) {

                        indicatorFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • At the lower Bollinger Band:
                                </strong>

                                Price is at or below the lower band
                                around
                                <strong>${money(bollingerLower)}</strong>,
                                placing it near the lower edge of its
                                recent trading envelope.
                            </div>

                        `;

                        flagCount++;

                    }


                    /* ---------------------------------------------
                    RELATIVE VOLUME
                    --------------------------------------------- */

                    if (
                        Number.isFinite(relativeVolume) &&
                        relativeVolume >= 1.5
                    ) {

                        indicatorFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • Elevated recent volume:
                                </strong>

                                Latest recorded volume is approximately
                                <strong>${number(relativeVolume, 2)}×</strong>
                                the 20-day average.
                            </div>

                        `;

                        flagCount++;

                    }


                    /* ---------------------------------------------
                    OBV
                    --------------------------------------------- */

                    if (obvTrend === "rising") {

                        indicatorFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • OBV is rising:
                                </strong>

                                Volume has generally accumulated more
                                strongly on advancing days over the
                                recent period.
                            </div>

                        `;

                        flagCount++;

                    } else if (obvTrend === "falling") {

                        indicatorFlags += `

                            <div style="margin-bottom:8px;">
                                <strong style="color:#f8fafc;">
                                    • OBV is falling:
                                </strong>

                                Volume has generally accumulated more
                                heavily on declining days over the
                                recent period.
                            </div>

                        `;

                        flagCount++;

                    }


                    if (indicatorFlags) {

                        importantText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#38bdf8;
                                    margin-bottom:10px;
                                ">
                                    Technical Flags
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${indicatorFlags}
                                </div>

                            </div>

                        `;

                    }

                }


                /* =================================================
                SMART MONEY
                ================================================= */

                if (smartMoneyStock) {

                    importantText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#a78bfa;
                                margin-bottom:8px;
                            ">
                                Smart Money Filter
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} has appeared in the
                                Smart Money Filter

                                <strong>
                                    ${smartMoneyStock.count}
                                    ${
                                        Number(smartMoneyStock.count) === 1
                                            ? "time"
                                            : "times"
                                    }
                                </strong>.

                                ${
                                    smartMoneyStock.last_seen
                                        ? `
                                            The most recent appearance was
                                            <strong>${formatDate(smartMoneyStock.last_seen)}</strong>.
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                NO MAJOR FLAGS
                ================================================= */

                if (
                    flagCount === 0 &&
                    !smartMoneyStock
                ) {

                    importantText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#cbd5e1;
                            line-height:1.7;
                        ">

                            Nothing unusually extreme is standing out
                            in the technical measures EdgeBreak currently
                            has stored for ${ticker}.

                            The stock is still appearing because its
                            scanner structure meets the relevant
                            EdgeBreak criteria.

                        </div>

                    `;

                }


                /* =================================================
                ANSWER
                ================================================= */

                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:6px;
                        ">
                            ${ticker} — Quick Things to Know
                        </div>

                        ${
                            indicatorDate
                                ? `
                                    <div style="
                                        color:#64748b;
                                        font-size:12px;
                                        margin-bottom:14px;
                                    ">
                                        Technical data through
                                        <strong style="color:#94a3b8;">
                                            ${indicatorDate}
                                        </strong>
                                    </div>
                                `
                                : ""
                        }

                        ${importantText}

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            These flags highlight technical conditions
                            currently standing out in EdgeBreak's stored
                            scanner and indicator data. They are research
                            observations, not buy, sell or hold
                            recommendations.
                        </div>

                    </div>

                `;

            }

            /* =================================================
            QUICK ANSWER #7
            HOW CLOSE IS IT TO RESISTANCE?
            ================================================= */

            else if (
                selectedQuestion === "distance-resistance"
            ) {

                let distanceText = "";


                /* ---------------------------------------------
                BREAKOUT
                --------------------------------------------- */

                if (breakoutStock) {

                    const currentPrice =
                        Number(
                            breakoutStock.price
                        );

                    const resistance =
                        Number(
                            breakoutStock.resistance
                        );

                    const distance =
                        Number(
                            breakoutStock.distance_above_resistance
                        );


                    let positionText = "";


                    if (Number.isFinite(distance)) {

                        if (distance <= 2) {

                            positionText =
                                `${ticker} has already moved through resistance and is still relatively close to the original breakout level.`;

                        } else if (distance <= 5) {

                            positionText =
                                `${ticker} has already moved through resistance and is now moderately above the original breakout level.`;

                        } else {

                            positionText =
                                `${ticker} has already moved through resistance and is now some distance beyond the original breakout level.`;

                        }

                    }


                    distanceText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Breakout Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                Current price:
                                <strong>${money(currentPrice)}</strong>.

                                Identified resistance:
                                <strong>${money(resistance)}</strong>.

                                Price is currently
                                <strong>${number(distance)}% above resistance</strong>.

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Short version:
                                </strong>

                                ${positionText}

                            </div>

                        </div>

                    `;

                }


                /* ---------------------------------------------
                PRE-BREAKOUT
                --------------------------------------------- */

                if (preBreakoutStock) {

                    const currentPrice =
                        Number(
                            preBreakoutStock.current_price
                        );

                    const resistance =
                        Number(
                            preBreakoutStock.resistance_price
                        );

                    const distance =
                        Number(
                            preBreakoutStock.distance_to_resistance
                        );


                    let positionText = "";


                    if (Number.isFinite(distance)) {

                        if (distance <= 0.5) {

                            positionText =
                                `${ticker} is sitting very close to the resistance level identified by EdgeBreak.`;

                        } else if (distance <= 2) {

                            positionText =
                                `${ticker} is trading close to the resistance level identified by EdgeBreak.`;

                        } else {

                            positionText =
                                `${ticker} remains below the identified resistance level with more distance between current price and resistance.`;

                        }

                    }


                    distanceText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Pre-Breakout Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                Current price:
                                <strong>${money(currentPrice)}</strong>.

                                Identified resistance:
                                <strong>${money(resistance)}</strong>.

                                Price is currently approximately
                                <strong>${number(distance)}% below resistance</strong>.

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Short version:
                                </strong>

                                ${positionText}

                            </div>

                        </div>

                    `;

                }


                /* ---------------------------------------------
                LAUNCH PAD
                --------------------------------------------- */

                if (launchPadStock) {

                    const currentPrice =
                        Number(
                            launchPadStock.current_price
                        );

                    const resistanceLow =
                        Number(
                            launchPadStock.resistance_zone_low
                        );

                    const resistanceHigh =
                        Number(
                            launchPadStock.resistance_zone_high
                        );


                    let positionText = "";


                    if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceHigh) &&
                        currentPrice > resistanceHigh
                    ) {

                        const distanceAbove =
                            (
                                (
                                    currentPrice -
                                    resistanceHigh
                                ) /
                                resistanceHigh
                            ) * 100;


                        positionText =
                            `${ticker} is currently <strong>${number(distanceAbove)}% above the top of the resistance zone</strong>.`;

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceLow) &&
                        currentPrice >= resistanceLow
                    ) {

                        positionText =
                            `${ticker} is currently <strong>inside the resistance zone</strong>.`;

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceLow)
                    ) {

                        const distanceBelow =
                            (
                                (
                                    resistanceLow -
                                    currentPrice
                                ) /
                                currentPrice
                            ) * 100;


                        positionText =
                            `${ticker} is approximately <strong>${number(distanceBelow)}% below the bottom of the resistance zone</strong>.`;

                    }


                    distanceText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Launch Pad Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                Current price:
                                <strong>${money(currentPrice)}</strong>.

                                EdgeBreak identified resistance around
                                <strong>${money(resistanceLow)}–${money(resistanceHigh)}</strong>.

                            </div>

                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Current position:
                                </strong>

                                ${positionText}

                            </div>

                        </div>

                    `;

                }


                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:12px;
                        ">
                            ${ticker} — Distance to Resistance
                        </div>

                        ${distanceText}

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            EdgeBreak provides technical research and market
                            information only. It does not provide financial advice
                            or buy, sell or hold recommendations.
                        </div>

                    </div>

                `;

            }

            /* =================================================
            QUICK ANSWER #6
            WHAT'S VOLUME DOING?
            ================================================= */

            else if (
                selectedQuestion === "volume"
            ) {

                let volumeText = "";


                /* =================================================
                CURRENT VOLUME SNAPSHOT
                ================================================= */

                if (latestIndicators) {

                    const averageVolume =
                        Number(
                            latestIndicators.average_volume_20
                        );

                    const relativeVolume =
                        Number(
                            latestIndicators.relative_volume
                        );

                    const obv =
                        Number(
                            latestIndicators.obv
                        );

                    const obvChange5 =
                        Number(
                            latestIndicators.obv_change_5d_percent
                        );

                    const obvChange20 =
                        Number(
                            latestIndicators.obv_change_20d_percent
                        );

                    const obvTrend =
                        String(
                            latestIndicators.obv_trend || ""
                        ).toLowerCase();


                    /* ---------------------------------------------
                    AVERAGE VOLUME
                    --------------------------------------------- */

                    let activityText = "";


                    if (Number.isFinite(averageVolume)) {

                        activityText += `

                            ${ticker}'s 20-day average volume is approximately

                            <strong>
                                ${Math.round(averageVolume).toLocaleString("en-US")}
                                shares per day
                            </strong>.

                        `;

                    }


                    /*
                    IMPORTANT:
                    Only interpret relative volume when it is
                    greater than zero.

                    We have seen zero values in the stored data
                    and do not want to describe those as meaningful
                    current trading activity until that calculation
                    has been separately verified.
                    */

                    if (
                        Number.isFinite(relativeVolume) &&
                        relativeVolume > 0
                    ) {

                        if (relativeVolume >= 2) {

                            activityText += `

                                Latest recorded volume was approximately

                                <strong>
                                    ${number(relativeVolume, 2)}×
                                    the 20-day average
                                </strong>,

                                showing substantially elevated trading
                                activity.

                            `;

                        } else if (relativeVolume >= 1.25) {

                            activityText += `

                                Latest recorded volume was approximately

                                <strong>
                                    ${number(relativeVolume, 2)}×
                                    the 20-day average
                                </strong>,

                                showing elevated trading activity.

                            `;

                        } else if (relativeVolume >= 0.75) {

                            activityText += `

                                Latest recorded volume was approximately

                                <strong>
                                    ${number(relativeVolume, 2)}×
                                    the 20-day average
                                </strong>,

                                putting activity relatively close to its
                                recent normal level.

                            `;

                        } else {

                            activityText += `

                                Latest recorded volume was approximately

                                <strong>
                                    ${number(relativeVolume, 2)}×
                                    the 20-day average
                                </strong>,

                                showing lighter-than-average trading
                                activity.

                            `;

                        }

                    }


                    if (activityText) {

                        volumeText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#38bdf8;
                                    margin-bottom:8px;
                                ">
                                    Trading Activity
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${activityText}
                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    OBV TREND
                    ================================================= */

                    let obvText = "";


                    if (obvTrend === "rising") {

                        obvText += `

                            EdgeBreak's On-Balance Volume trend is currently
                            <strong>rising</strong>.

                            This means volume has generally accumulated
                            more strongly on advancing days than declining
                            days over the recent period.

                        `;

                    } else if (obvTrend === "falling") {

                        obvText += `

                            EdgeBreak's On-Balance Volume trend is currently
                            <strong>falling</strong>.

                            This means volume has generally accumulated
                            more heavily on declining days than advancing
                            days over the recent period.

                        `;

                    } else if (obvTrend === "neutral") {

                        obvText += `

                            EdgeBreak's On-Balance Volume trend is currently
                            <strong>neutral</strong>.

                            Recent volume flow is not showing a strong
                            directional trend in either direction.

                        `;

                    }


                    /*
                    The absolute OBV number is intentionally NOT
                    displayed as bullish/bearish.

                    OBV begins from an arbitrary starting point,
                    so the direction of the series is more useful
                    than whether the raw value is positive or negative.
                    */


                    if (obvText) {

                        volumeText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#38bdf8;
                                    margin-bottom:8px;
                                ">
                                    Volume Trend
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${obvText}
                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    RECENT OBV CHANGE
                    ================================================= */

                    let recentChangeText = "";


                    if (
                        Number.isFinite(obvChange5) &&
                        Math.abs(obvChange5) <= 1000
                    ) {

                        if (obvChange5 > 0) {

                            recentChangeText += `

                                Over the latest five trading days,
                                OBV increased approximately
                                <strong>${number(obvChange5, 2)}%</strong>.

                            `;

                        } else if (obvChange5 < 0) {

                            recentChangeText += `

                                Over the latest five trading days,
                                OBV decreased approximately
                                <strong>${number(Math.abs(obvChange5), 2)}%</strong>.

                            `;

                        }

                    }


                    if (
                        Number.isFinite(obvChange20) &&
                        Math.abs(obvChange20) <= 1000
                    ) {

                        if (obvChange20 > 0) {

                            recentChangeText += `

                                Across the latest 20 trading days,
                                the stored OBV measure increased approximately
                                <strong>${number(obvChange20, 2)}%</strong>.

                            `;

                        } else if (obvChange20 < 0) {

                            recentChangeText += `

                                Across the latest 20 trading days,
                                the stored OBV measure decreased approximately
                                <strong>${number(Math.abs(obvChange20), 2)}%</strong>.

                            `;

                        }

                    }


                    if (recentChangeText) {

                        volumeText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#38bdf8;
                                    margin-bottom:8px;
                                ">
                                    Recent Volume Flow
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${recentChangeText}
                                </div>

                            </div>

                        `;

                    }

                }


                /* =================================================
                BREAKOUT VOLUME
                ================================================= */

                if (breakoutStock) {

                    const volumeRatio =
                        Number(
                            breakoutStock.volume_ratio
                        );


                    if (Number.isFinite(volumeRatio)) {

                        let breakoutVolumeText = "";


                        if (volumeRatio >= 2) {

                            breakoutVolumeText =
                                `The breakout was recorded with approximately <strong>${number(volumeRatio, 2)}× normal volume</strong>, representing a substantial increase in trading activity around the move through resistance.`;

                        } else if (volumeRatio >= 1.25) {

                            breakoutVolumeText =
                                `The breakout was recorded with approximately <strong>${number(volumeRatio, 2)}× normal volume</strong>, showing elevated trading activity around the move through resistance.`;

                        } else if (volumeRatio >= 1) {

                            breakoutVolumeText =
                                `The breakout was recorded with approximately <strong>${number(volumeRatio, 2)}× normal volume</strong>, putting activity around normal to slightly above normal levels.`;

                        } else {

                            breakoutVolumeText =
                                `The breakout was recorded with approximately <strong>${number(volumeRatio, 2)}× normal volume</strong>, meaning activity was below its normal comparison level at the time of the breakout.`;

                        }


                        volumeText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Breakout Volume
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${breakoutVolumeText}
                                </div>

                            </div>

                        `;

                    }

                }


                /* =================================================
                LIQUIDITY CONTEXT
                PRE-BREAKOUT DATA
                ================================================= */

                if (preBreakoutStock) {

                    const scannerAverageVolume =
                        Number(
                            preBreakoutStock.average_volume_20
                        );

                    const averageDollarVolume =
                        Number(
                            preBreakoutStock.average_dollar_volume_20
                        );


                    let liquidityText = "";


                    if (
                        Number.isFinite(scannerAverageVolume)
                    ) {

                        liquidityText += `

                            The Pre-Breakout Scanner records a 20-day
                            average of approximately

                            <strong>
                                ${Math.round(scannerAverageVolume).toLocaleString("en-US")}
                                shares per day
                            </strong>.

                        `;

                    }


                    if (
                        Number.isFinite(averageDollarVolume)
                    ) {

                        liquidityText += `

                            Average dollar volume is approximately

                            <strong>
                                $${Math.round(averageDollarVolume).toLocaleString("en-US")}
                                per day
                            </strong>.

                        `;

                    }


                    if (
                        preBreakoutStock.liquidity_group
                    ) {

                        liquidityText += `

                            EdgeBreak currently places the stock in the
                            <strong>${preBreakoutStock.liquidity_group}</strong>
                            liquidity group.

                        `;

                    }


                    if (liquidityText) {

                        volumeText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#22c55e;
                                    margin-bottom:8px;
                                ">
                                    Liquidity
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${liquidityText}
                                </div>

                            </div>

                        `;

                    }

                }


                /* =================================================
                FALLBACK
                ================================================= */

                if (!volumeText) {

                    volumeText = `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#cbd5e1;
                            line-height:1.7;
                        ">

                            EdgeBreak does not currently have enough
                            stored volume information to describe
                            ${ticker}'s recent volume behaviour reliably.

                        </div>

                    `;

                }


                /* =================================================
                FINAL ANSWER
                ================================================= */

                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:6px;
                        ">
                            ${ticker} — What's Volume Doing?
                        </div>

                        ${
                            indicatorDate
                                ? `
                                    <div style="
                                        color:#64748b;
                                        font-size:12px;
                                        margin-bottom:14px;
                                    ">
                                        Technical data through
                                        <strong style="color:#94a3b8;">
                                            ${indicatorDate}
                                        </strong>
                                    </div>
                                `
                                : ""
                        }

                        ${volumeText}

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            Volume measures trading activity, while
                            On-Balance Volume tracks how that activity
                            has accumulated across advancing and declining
                            price days. These measures provide technical
                            context and are not buy or sell signals.
                        </div>

                    </div>

                `;

            }

            /* =================================================
            QUICK ANSWER #5
            WHAT'S THE CHART DOING?
            ================================================= */

            else if (
                selectedQuestion === "chart-doing"
            ) {

                let chartText = "";


                /* =================================================
                SCANNER STRUCTURE
                ================================================= */

                if (breakoutStock) {

                    const distance =
                        Number(
                            breakoutStock.distance_above_resistance
                        );


                    let positionText = "";


                    if (Number.isFinite(distance)) {

                        if (distance <= 2) {

                            positionText =
                                `Price has recently moved through resistance and remains relatively close to the breakout area.`;

                        } else if (distance <= 5) {

                            positionText =
                                `Price has cleared resistance and moved moderately beyond the original breakout area.`;

                        } else {

                            positionText =
                                `Price has cleared resistance and is now ${number(distance)}% above the level EdgeBreak identified, so the chart has already moved some distance beyond the original breakout area.`;

                        }

                    }


                    chartText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Chart Structure
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified a
                                <strong>breakout structure</strong>
                                around resistance at
                                <strong>${money(breakoutStock.resistance)}</strong>.

                                The setup formed with
                                <strong>${breakoutStock.touches} resistance touches</strong>
                                and
                                <strong>${breakoutStock.higher_lows} higher lows</strong>.

                                ${positionText}

                            </div>

                        </div>

                    `;

                }


                else if (preBreakoutStock) {

                    const distance =
                        Number(
                            preBreakoutStock.distance_to_resistance
                        );


                    let positionText = "";


                    if (Number.isFinite(distance)) {

                        if (distance <= 1) {

                            positionText =
                                `Price is pressing very close to resistance while the higher-low structure remains active.`;

                        } else if (distance <= 3) {

                            positionText =
                                `Price is approaching resistance while maintaining the developing higher-low structure.`;

                        } else {

                            positionText =
                                `Price remains below resistance while EdgeBreak continues to track the repeated resistance tests and higher lows.`;

                        }

                    }


                    chartText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Chart Structure
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified a
                                <strong>pre-breakout structure</strong>
                                beneath resistance around
                                <strong>${money(preBreakoutStock.resistance_price)}</strong>.

                                Price is approximately
                                <strong>${number(distance)}% below resistance</strong>.

                                The structure has recorded
                                <strong>${preBreakoutStock.resistance_touches} resistance touches</strong>
                                and
                                <strong>${preBreakoutStock.higher_lows} higher lows</strong>.

                                ${positionText}

                            </div>

                        </div>

                    `;

                }


                else if (launchPadStock) {

                    const currentPrice =
                        Number(
                            launchPadStock.current_price
                        );

                    const supportLow =
                        Number(
                            launchPadStock.support_zone_low
                        );

                    const supportHigh =
                        Number(
                            launchPadStock.support_zone_high
                        );

                    const resistanceLow =
                        Number(
                            launchPadStock.resistance_zone_low
                        );

                    const resistanceHigh =
                        Number(
                            launchPadStock.resistance_zone_high
                        );


                    let positionText =
                        `Price is trading between the support and resistance areas of the base.`;


                    if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceHigh) &&
                        currentPrice > resistanceHigh
                    ) {

                        positionText =
                            `Price has moved above the resistance zone that originally defined the base.`;

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(supportLow) &&
                        currentPrice < supportLow
                    ) {

                        positionText =
                            `Price is currently below the support zone that originally defined the base.`;

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceLow) &&
                        currentPrice >= resistanceLow
                    ) {

                        positionText =
                            `Price is currently trading around the resistance area of the base.`;

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(supportHigh) &&
                        currentPrice <= supportHigh
                    ) {

                        positionText =
                            `Price is currently trading around the support area of the base.`;

                    }


                    chartText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Chart Structure
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified a
                                <strong>${launchPadStock.launchpad_days}-day Launch Pad base</strong>.

                                Support sits around
                                <strong>${money(supportLow)}–${money(supportHigh)}</strong>
                                and resistance around
                                <strong>${money(resistanceLow)}–${money(resistanceHigh)}</strong>.

                                The overall range is approximately
                                <strong>${number(launchPadStock.range_percent)}%</strong>.

                                ${positionText}

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                TREND — MOVING AVERAGES
                ================================================= */

                if (latestIndicators) {

                    const price =
                        Number(
                            latestIndicators.price
                        );

                    const sma20 =
                        Number(
                            latestIndicators.sma20
                        );

                    const sma50 =
                        Number(
                            latestIndicators.sma50
                        );

                    const sma200 =
                        Number(
                            latestIndicators.sma200
                        );


                    let trendText = "";


                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma20)
                    ) {

                        trendText +=
                            `Price is <strong>${price >= sma20 ? "above" : "below"}</strong> the 20-day SMA at <strong>${money(sma20)}</strong>. `;

                    }


                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma50)
                    ) {

                        trendText +=
                            `It is <strong>${price >= sma50 ? "above" : "below"}</strong> the 50-day SMA at <strong>${money(sma50)}</strong>. `;

                    }


                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma200)
                    ) {

                        trendText +=
                            `Price is also <strong>${price >= sma200 ? "above" : "below"}</strong> the 200-day SMA at <strong>${money(sma200)}</strong>.`;

                    } else if (
                        latestIndicators.sma200 == null
                    ) {

                        trendText +=
                            `A 200-day SMA is not yet available from the stored price history.`;

                    }


                    if (trendText) {

                        chartText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#38bdf8;
                                    margin-bottom:8px;
                                ">
                                    Trend
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${trendText}
                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    MOMENTUM — RSI + MACD
                    ================================================= */

                    const rsi =
                        Number(
                            latestIndicators.rsi14
                        );

                    const macd =
                        Number(
                            latestIndicators.macd
                        );

                    const macdSignal =
                        Number(
                            latestIndicators.macd_signal
                        );

                    const macdHistogram =
                        Number(
                            latestIndicators.macd_histogram
                        );


                    let momentumText = "";


                    if (Number.isFinite(rsi)) {

                        if (rsi >= 70) {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, showing strong recent momentum with an elevated reading. `;

                        } else if (rsi >= 55) {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, showing positive recent momentum. `;

                        } else if (rsi <= 30) {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, which is a relatively low momentum reading. `;

                        } else if (rsi < 45) {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, showing softer recent momentum. `;

                        } else {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, sitting in a relatively neutral range. `;

                        }

                    }


                    if (
                        Number.isFinite(macd) &&
                        Number.isFinite(macdSignal)
                    ) {

                        if (macd > macdSignal) {

                            momentumText +=
                                `MACD is above its signal line, which supports positive short-term momentum.`;

                        } else if (macd < macdSignal) {

                            momentumText +=
                                `MACD is below its signal line, indicating softer short-term momentum.`;

                        } else {

                            momentumText +=
                                `MACD is currently close to its signal line.`;

                        }


                        if (Number.isFinite(macdHistogram)) {

                            momentumText +=
                                ` The MACD histogram is <strong>${number(macdHistogram, 4)}</strong>.`;

                        }

                    }


                    if (momentumText) {

                        chartText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#38bdf8;
                                    margin-bottom:8px;
                                ">
                                    Momentum
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${momentumText}
                                </div>

                            </div>

                        `;

                    }


                    /* =================================================
                    BOLLINGER BANDS + ATR
                    ================================================= */

                    const bollingerUpper =
                        Number(
                            latestIndicators.bollinger_upper
                        );

                    const bollingerMiddle =
                        Number(
                            latestIndicators.bollinger_middle
                        );

                    const bollingerLower =
                        Number(
                            latestIndicators.bollinger_lower
                        );

                    const atr =
                        Number(
                            latestIndicators.atr14
                        );


                    let volatilityText = "";


                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(bollingerUpper) &&
                        Number.isFinite(bollingerMiddle) &&
                        Number.isFinite(bollingerLower)
                    ) {

                        if (price >= bollingerUpper) {

                            volatilityText +=
                                `Price is currently at or above the upper Bollinger Band at <strong>${money(bollingerUpper)}</strong>, placing it near the upper edge of its recent trading envelope. `;

                        } else if (price <= bollingerLower) {

                            volatilityText +=
                                `Price is currently at or below the lower Bollinger Band at <strong>${money(bollingerLower)}</strong>, placing it near the lower edge of its recent trading envelope. `;

                        } else if (price >= bollingerMiddle) {

                            volatilityText +=
                                `Price is trading in the upper half of the Bollinger Band range, between the middle band at <strong>${money(bollingerMiddle)}</strong> and upper band at <strong>${money(bollingerUpper)}</strong>. `;

                        } else {

                            volatilityText +=
                                `Price is trading in the lower half of the Bollinger Band range, between the lower band at <strong>${money(bollingerLower)}</strong> and middle band at <strong>${money(bollingerMiddle)}</strong>. `;

                        }

                    }


                    if (Number.isFinite(atr)) {

                        volatilityText +=
                            `ATR is approximately <strong>${money(atr)}</strong>, giving a measure of the stock's recent daily price movement.`;

                    }


                    if (volatilityText) {

                        chartText += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#38bdf8;
                                    margin-bottom:8px;
                                ">
                                    Price Position & Volatility
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">
                                    ${volatilityText}
                                </div>

                            </div>

                        `;

                    }

                }


                /* =================================================
                BUILD FINAL ANSWER
                ================================================= */

                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:6px;
                        ">
                            ${ticker} — What's the Chart Doing?
                        </div>

                        ${
                            indicatorDate
                                ? `
                                    <div style="
                                        color:#64748b;
                                        font-size:12px;
                                        margin-bottom:14px;
                                    ">
                                        Technical data through
                                        <strong style="color:#94a3b8;">
                                            ${indicatorDate}
                                        </strong>
                                    </div>
                                `
                                : ""
                        }

                        ${chartText}

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            This summary describes the current technical
                            structure and indicator data available to
                            EdgeBreak. It does not provide financial advice
                            or buy, sell or hold recommendations.
                        </div>

                    </div>

                `;

            }

            /* =================================================
            QUICK ANSWER #4
            WHERE IS SUPPORT?
            ================================================= */

            else if (
                selectedQuestion === "support"
            ) {

                let supportText = "";


                /* ---------------------------------------------
                LAUNCH PAD SUPPORT
                --------------------------------------------- */

                if (launchPadStock) {

                    const currentPrice =
                        Number(
                            launchPadStock.current_price
                        );

                    const supportLow =
                        Number(
                            launchPadStock.support_zone_low
                        );

                    const supportHigh =
                        Number(
                            launchPadStock.support_zone_high
                        );


                    let positionText = "";


                    if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(supportLow) &&
                        currentPrice < supportLow
                    ) {

                        const distanceBelow =
                            (
                                (
                                    supportLow -
                                    currentPrice
                                ) /
                                supportLow
                            ) * 100;


                        positionText = `
                            Price is currently
                            <strong>${number(distanceBelow)}% below the bottom of that support zone</strong>.
                        `;

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(supportHigh) &&
                        currentPrice <= supportHigh
                    ) {

                        positionText = `
                            Price is currently
                            <strong>inside the identified support zone</strong>.
                        `;

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(supportHigh)
                    ) {

                        const distanceAbove =
                            (
                                (
                                    currentPrice -
                                    supportHigh
                                ) /
                                supportHigh
                            ) * 100;


                        positionText = `
                            Price is currently approximately
                            <strong>${number(distanceAbove)}% above the top of that support zone</strong>.
                        `;

                    }


                    supportText = `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Launch Pad Support
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified a support zone for
                                <strong>${ticker}</strong> around
                                <strong>${money(supportLow)}–${money(supportHigh)}</strong>.

                                Current price is
                                <strong>${money(currentPrice)}</strong>.

                                ${positionText}

                                The zone has recorded
                                <strong>${launchPadStock.support_tests} support tests</strong>.

                            </div>

                        </div>

                    `;

                }


                /* ---------------------------------------------
                NO STORED SUPPORT LEVEL
                --------------------------------------------- */

                else {

                    supportText = `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#cbd5e1;
                            line-height:1.7;
                        ">

                            EdgeBreak does not currently have a stored
                            support zone for <strong>${ticker}</strong>
                            in today's scanner data.

                            ${
                                breakoutStock
                                    ? `
                                        The Breakout Scanner has identified
                                        resistance around
                                        <strong>${money(breakoutStock.resistance)}</strong>,
                                        but it does not store a separate
                                        support level for this setup.
                                    `
                                    : ""
                            }

                            ${
                                preBreakoutStock
                                    ? `
                                        The Pre-Breakout Scanner has identified
                                        resistance around
                                        <strong>${money(preBreakoutStock.resistance_price)}</strong>,
                                        but it does not store a separate
                                        support level for this setup.
                                    `
                                    : ""
                            }

                        </div>

                    `;

                }


                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:12px;
                        ">
                            ${ticker} — Support
                        </div>

                        ${supportText}

                        <div style="
                            margin-top:10px;
                            color:#94a3b8;
                            line-height:1.7;
                        ">

                            <strong style="color:#e2e8f0;">
                                What support means:
                            </strong>

                            Support is an area where price has previously
                            found buying interest or had difficulty moving
                            lower. EdgeBreak only reports a support level
                            here when that level exists in the scanner data.

                        </div>

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            EdgeBreak provides technical research and market
                            information only. It does not provide financial advice
                            or buy, sell or hold recommendations.
                        </div>

                    </div>

                `;

            }

            /* =================================================
            QUICK ANSWER #3
            WHERE IS RESISTANCE?
            ================================================= */

            else if (
                selectedQuestion === "resistance"
            ) {

                let currentPrice = null;
                let resistanceText = "";
                let resistanceExplanation = "";


                /* ---------------------------------------------
                BREAKOUT RESISTANCE
                --------------------------------------------- */

                if (breakoutStock) {

                    currentPrice =
                        Number(breakoutStock.price);

                    const resistance =
                        Number(breakoutStock.resistance);

                    const distance =
                        Number(
                            breakoutStock.distance_above_resistance
                        );


                    resistanceText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Breakout Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified resistance for
                                <strong>${ticker}</strong> around
                                <strong>${money(resistance)}</strong>.

                                Current price is
                                <strong>${money(currentPrice)}</strong>.

                                ${
                                    Number.isFinite(distance)
                                        ? `
                                            Price is currently
                                            <strong>${number(distance)}% above that resistance level</strong>.
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    `;

                }


                /* ---------------------------------------------
                PRE-BREAKOUT RESISTANCE
                --------------------------------------------- */

                if (preBreakoutStock) {

                    currentPrice =
                        Number(
                            preBreakoutStock.current_price
                        );

                    const resistance =
                        Number(
                            preBreakoutStock.resistance_price
                        );

                    const distance =
                        Number(
                            preBreakoutStock.distance_to_resistance
                        );


                    resistanceText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Pre-Breakout Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified resistance for
                                <strong>${ticker}</strong> around
                                <strong>${money(resistance)}</strong>.

                                Current price is
                                <strong>${money(currentPrice)}</strong>.

                                ${
                                    Number.isFinite(distance)
                                        ? `
                                            Price is currently approximately
                                            <strong>${number(distance)}% below resistance</strong>.
                                        `
                                        : ""
                                }

                                The level has recorded
                                <strong>${preBreakoutStock.resistance_touches} resistance touches</strong>.

                            </div>

                        </div>

                    `;

                }


                /* ---------------------------------------------
                LAUNCH PAD RESISTANCE
                --------------------------------------------- */

                if (launchPadStock) {

                    currentPrice =
                        Number(
                            launchPadStock.current_price
                        );

                    const resistanceLow =
                        Number(
                            launchPadStock.resistance_zone_low
                        );

                    const resistanceHigh =
                        Number(
                            launchPadStock.resistance_zone_high
                        );


                    let positionText = "";


                    if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceHigh) &&
                        currentPrice > resistanceHigh
                    ) {

                        const distanceAbove =
                            (
                                (
                                    currentPrice -
                                    resistanceHigh
                                ) /
                                resistanceHigh
                            ) * 100;

                        positionText =
                            `Price is currently <strong>${number(distanceAbove)}% above the top of that resistance zone</strong>.`;

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceLow) &&
                        currentPrice >= resistanceLow
                    ) {

                        positionText =
                            `Price is currently <strong>inside the identified resistance zone</strong>.`;

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceLow)
                    ) {

                        const distanceBelow =
                            (
                                (
                                    resistanceLow -
                                    currentPrice
                                ) /
                                currentPrice
                            ) * 100;

                        positionText =
                            `Price is currently approximately <strong>${number(distanceBelow)}% below the bottom of that resistance zone</strong>.`;

                    }


                    resistanceText += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Launch Pad Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                EdgeBreak identified a resistance zone for
                                <strong>${ticker}</strong> around
                                <strong>${money(resistanceLow)}–${money(resistanceHigh)}</strong>.

                                Current price is
                                <strong>${money(currentPrice)}</strong>.

                                ${positionText}

                                The zone has recorded
                                <strong>${launchPadStock.resistance_tests} resistance tests</strong>.

                            </div>

                        </div>

                    `;

                }


                /* ---------------------------------------------
                SUMMARY
                --------------------------------------------- */

                resistanceExplanation = `

                    <div style="
                        margin-top:10px;
                        color:#94a3b8;
                        line-height:1.7;
                    ">

                        <strong style="color:#e2e8f0;">
                            What resistance means:
                        </strong>

                        Resistance is an area where price has previously
                        had difficulty moving higher. EdgeBreak identifies
                        these levels from the technical structure detected
                        by its scanners.

                    </div>

                `;


                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:12px;
                        ">
                            ${ticker} — Resistance
                        </div>

                        ${resistanceText}

                        ${resistanceExplanation}

                        <div style="
                            margin-top:12px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            EdgeBreak provides technical research and market
                            information only. It does not provide financial advice
                            or buy, sell or hold recommendations.
                        </div>

                    </div>

                `;

            }

            /* =================================================
            QUICK ANSWER #2
            WHY DID THIS STOCK SCAN UP?
            ================================================= */

            else if (
                selectedQuestion === "why-scanned"
            ) {

                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:12px;
                        ">
                            Why EdgeBreak Found ${ticker}
                        </div>

                `;


                /* ---------------------------------------------
                BREAKOUT REASON
                --------------------------------------------- */

                if (breakoutStock) {

                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Breakout Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} scanned up because price
                                <strong>moved above the resistance level</strong>
                                identified by EdgeBreak at approximately
                                <strong>${money(breakoutStock.resistance)}</strong>.

                                The setup recorded
                                <strong>${breakoutStock.touches} resistance touches</strong>
                                and
                                <strong>${breakoutStock.higher_lows} higher lows</strong>
                                before the breakout.

                                Price is currently
                                <strong>${number(breakoutStock.distance_above_resistance)}% above resistance</strong>.

                                ${
                                    Number.isFinite(
                                        Number(breakoutStock.volume_ratio)
                                    )
                                        ? `
                                            Breakout volume was approximately
                                            <strong>${number(breakoutStock.volume_ratio)}× normal volume</strong>.
                                        `
                                        : ""
                                }

                            </div>


                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Why it qualified:
                                </strong>

                                EdgeBreak detected a tested resistance
                                level followed by price moving through
                                that level. The resistance tests and
                                higher-low structure are the technical
                                features that caused the stock to appear
                                in the Breakout Scanner.

                            </div>

                        </div>

                    `;

                }


                /* ---------------------------------------------
                PRE-BREAKOUT REASON
                --------------------------------------------- */

                if (preBreakoutStock) {

                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Pre-Breakout Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} scanned up because EdgeBreak
                                detected a developing structure beneath
                                resistance around
                                <strong>${money(preBreakoutStock.resistance_price)}</strong>.

                                The structure has recorded
                                <strong>${preBreakoutStock.resistance_touches} resistance touches</strong>
                                together with
                                <strong>${preBreakoutStock.higher_lows} higher lows</strong>.

                                Price is currently approximately
                                <strong>${number(preBreakoutStock.distance_to_resistance)}% below resistance</strong>.

                            </div>


                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Why it qualified:
                                </strong>

                                EdgeBreak found repeated testing of an
                                identified resistance level while the
                                stock continued forming higher lows.
                                That combination is the technical
                                structure the Pre-Breakout Scanner is
                                designed to detect.

                            </div>

                        </div>

                    `;

                }


                /* ---------------------------------------------
                LAUNCH PAD REASON
                --------------------------------------------- */

                if (launchPadStock) {

                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Launch Pad Scanner
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} scanned up because EdgeBreak
                                identified an established
                                <strong>${launchPadStock.launchpad_days}-day trading base</strong>.

                                Support was identified around
                                <strong>${money(launchPadStock.support_zone_low)}–${money(launchPadStock.support_zone_high)}</strong>,
                                while resistance was identified around
                                <strong>${money(launchPadStock.resistance_zone_low)}–${money(launchPadStock.resistance_zone_high)}</strong>.

                                The base recorded
                                <strong>${launchPadStock.support_tests} support tests</strong>
                                and
                                <strong>${launchPadStock.resistance_tests} resistance tests</strong>.

                                The total range was approximately
                                <strong>${number(launchPadStock.range_percent)}%</strong>.

                            </div>


                            <div style="
                                margin-top:10px;
                                color:#94a3b8;
                                line-height:1.7;
                            ">

                                <strong style="color:#e2e8f0;">
                                    Why it qualified:
                                </strong>

                                EdgeBreak detected a defined trading
                                range with repeated interaction around
                                both support and resistance. That
                                established base structure caused the
                                stock to appear in the Launch Pad
                                Scanner.

                            </div>

                        </div>

                    `;

                }


                /* ---------------------------------------------
                SMART MONEY CONTEXT
                --------------------------------------------- */

                if (smartMoneyStock) {

                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Additional EdgeBreak Context
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} has also appeared in the
                                <strong>EdgeBreak Smart Money Filter
                                ${smartMoneyStock.count}
                                ${
                                    Number(smartMoneyStock.count) === 1
                                        ? "time"
                                        : "times"
                                }</strong>.

                                ${
                                    smartMoneyStock.last_seen
                                        ? `
                                            Its most recent appearance was
                                            <strong>${formatDate(smartMoneyStock.last_seen)}</strong>.
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    `;

                }


                answer += `

                        <div style="
                            margin-top:4px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            EdgeBreak provides technical research and market
                            information only. It does not provide financial advice
                            or buy, sell or hold recommendations.
                        </div>

                    </div>

                `;

            }


            /* =================================================
            QUICK ANSWER #1
            30-SECOND RUNDOWN
            ================================================= */

            else {

                answer = `

                    <div class="edge-ai-rundown">

                        <div style="
                            font-size:18px;
                            font-weight:800;
                            color:#f8fafc;
                            margin-bottom:12px;
                        ">
                            ${ticker} — 30-Second Rundown
                        </div>

                        ${
                            indicatorDate
                                ? `
                                    <div style="
                                        color:#64748b;
                                        font-size:12px;
                                        margin-bottom:14px;
                                    ">
                                        Technical data through
                                        <strong style="color:#94a3b8;">
                                            ${indicatorDate}
                                        </strong>
                                    </div>
                                `
                                : ""
                        }

                `;


                /* =================================================
                BREAKOUT SCANNER
                ================================================= */

                if (breakoutStock) {

                    const distance =
                        Number(
                            breakoutStock.distance_above_resistance
                        );


                    let breakoutPosition = "";


                    if (Number.isFinite(distance)) {

                        if (distance <= 2) {

                            breakoutPosition =
                                `${ticker} remains relatively close to the breakout level.`;

                        } else if (distance <= 5) {

                            breakoutPosition =
                                `${ticker} has moved moderately beyond the original breakout level.`;

                        } else {

                            breakoutPosition =
                                `${ticker} is now ${number(distance)}% above the resistance level EdgeBreak identified, so price has already moved some distance beyond the original breakout area.`;

                        }

                    }


                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Breakout Setup
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} is trading at
                                <strong>${money(breakoutStock.price)}</strong>.

                                EdgeBreak identified resistance around
                                <strong>${money(breakoutStock.resistance)}</strong>,
                                with price currently
                                <strong>${number(breakoutStock.distance_above_resistance)}% above that level</strong>.

                                The breakout structure recorded
                                <strong>${breakoutStock.touches} resistance touches</strong>
                                and
                                <strong>${breakoutStock.higher_lows} higher lows</strong>.

                                ${breakoutPosition}

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                PRE-BREAKOUT SCANNER
                ================================================= */

                if (preBreakoutStock) {

                    const distance =
                        Number(
                            preBreakoutStock.distance_to_resistance
                        );


                    let preBreakoutPosition = "";


                    if (Number.isFinite(distance)) {

                        if (distance <= 1) {

                            preBreakoutPosition =
                                `${ticker} is trading very close to the resistance level while maintaining the higher-low structure detected by EdgeBreak.`;

                        } else if (distance <= 3) {

                            preBreakoutPosition =
                                `${ticker} remains close to resistance with the higher-low structure still active.`;

                        } else {

                            preBreakoutPosition =
                                `${ticker} remains below resistance while EdgeBreak continues to track the developing structure.`;

                        }

                    }


                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Pre-Breakout Setup
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} is trading at
                                <strong>${money(preBreakoutStock.current_price)}</strong>,
                                approximately
                                <strong>${number(preBreakoutStock.distance_to_resistance)}% below</strong>
                                EdgeBreak resistance at
                                <strong>${money(preBreakoutStock.resistance_price)}</strong>.

                                The structure has recorded
                                <strong>${preBreakoutStock.resistance_touches} resistance touches</strong>
                                and
                                <strong>${preBreakoutStock.higher_lows} higher lows</strong>.

                                ${preBreakoutPosition}

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                LAUNCH PAD SCANNER
                ================================================= */

                if (launchPadStock) {

                    const currentPrice =
                        Number(
                            launchPadStock.current_price
                        );

                    const supportLow =
                        Number(
                            launchPadStock.support_zone_low
                        );

                    const supportHigh =
                        Number(
                            launchPadStock.support_zone_high
                        );

                    const resistanceLow =
                        Number(
                            launchPadStock.resistance_zone_low
                        );

                    const resistanceHigh =
                        Number(
                            launchPadStock.resistance_zone_high
                        );


                    let rangePosition =
                        "Price remains within the broader base structure.";


                    if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceHigh) &&
                        currentPrice > resistanceHigh
                    ) {

                        rangePosition =
                            "Price has moved above the resistance zone originally identified in the base.";

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(supportLow) &&
                        currentPrice < supportLow
                    ) {

                        rangePosition =
                            "Price is currently below the support zone originally identified in the base.";

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(resistanceLow) &&
                        currentPrice >= resistanceLow
                    ) {

                        rangePosition =
                            "Price is currently trading around the resistance area of the base.";

                    } else if (
                        Number.isFinite(currentPrice) &&
                        Number.isFinite(supportHigh) &&
                        currentPrice <= supportHigh
                    ) {

                        rangePosition =
                            "Price is currently trading around the support area of the base.";

                    }


                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#22c55e;
                                margin-bottom:8px;
                            ">
                                Launch Pad Setup
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} is trading at
                                <strong>${money(launchPadStock.current_price)}</strong>.

                                EdgeBreak identified a
                                <strong>${launchPadStock.launchpad_days}-day base</strong>
                                with support around
                                <strong>
                                    ${money(launchPadStock.support_zone_low)}–${money(launchPadStock.support_zone_high)}
                                </strong>
                                and resistance around
                                <strong>
                                    ${money(launchPadStock.resistance_zone_low)}–${money(launchPadStock.resistance_zone_high)}
                                </strong>.

                                ${rangePosition}

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                INDICATOR SNAPSHOT
                ================================================= */

                if (latestIndicators) {

                    const rsi =
                        Number(
                            latestIndicators.rsi14
                        );

                    const macd =
                        Number(
                            latestIndicators.macd
                        );

                    const macdSignal =
                        Number(
                            latestIndicators.macd_signal
                        );

                    const price =
                        Number(
                            latestIndicators.price
                        );

                    const sma20 =
                        Number(
                            latestIndicators.sma20
                        );

                    const sma50 =
                        Number(
                            latestIndicators.sma50
                        );

                    const sma200 =
                        Number(
                            latestIndicators.sma200
                        );


                    /* ---------------------------------------------
                    MOMENTUM TEXT
                    --------------------------------------------- */

                    let momentumText = "";


                    if (Number.isFinite(rsi)) {

                        if (rsi >= 70) {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, showing strong recent momentum with an elevated reading. `;

                        } else if (rsi >= 55) {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, showing positive recent momentum. `;

                        } else if (rsi <= 30) {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, which is a relatively low momentum reading. `;

                        } else if (rsi < 45) {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, showing softer recent momentum. `;

                        } else {

                            momentumText +=
                                `RSI is <strong>${number(rsi, 1)}</strong>, sitting in a relatively neutral momentum range. `;

                        }

                    }


                    if (
                        Number.isFinite(macd) &&
                        Number.isFinite(macdSignal)
                    ) {

                        if (macd > macdSignal) {

                            momentumText +=
                                `MACD is currently above its signal line, indicating positive short-term momentum.`;

                        } else if (macd < macdSignal) {

                            momentumText +=
                                `MACD is currently below its signal line, indicating softer short-term momentum.`;

                        } else {

                            momentumText +=
                                `MACD is currently close to its signal line.`;

                        }

                    }


                    /* ---------------------------------------------
                    TREND TEXT
                    --------------------------------------------- */

                    let trendText = "";


                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma20)
                    ) {

                        trendText +=
                            `Price is ${price >= sma20 ? "above" : "below"} the 20-day SMA at <strong>${money(sma20)}</strong>. `;

                    }


                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma50)
                    ) {

                        trendText +=
                            `It is ${price >= sma50 ? "above" : "below"} the 50-day SMA at <strong>${money(sma50)}</strong>. `;

                    }


                    if (
                        Number.isFinite(price) &&
                        Number.isFinite(sma200)
                    ) {

                        trendText +=
                            `Price is also ${price >= sma200 ? "above" : "below"} the 200-day SMA at <strong>${money(sma200)}</strong>.`;

                    } else if (
                        latestIndicators.sma200 == null
                    ) {

                        trendText +=
                            `A 200-day SMA is not yet available from the stored price history.`;

                    }


                    /* ---------------------------------------------
                    VOLUME TEXT
                    --------------------------------------------- */

                    let volumeText = "";


                    const averageVolume =
                        Number(
                            latestIndicators.average_volume_20
                        );

                    const relativeVolume =
                        Number(
                            latestIndicators.relative_volume
                        );


                    if (Number.isFinite(averageVolume)) {

                        volumeText +=
                            `20-day average volume is approximately <strong>${Math.round(averageVolume).toLocaleString()}</strong> shares. `;

                    }


                    if (
                        Number.isFinite(relativeVolume) &&
                        relativeVolume > 0
                    ) {

                        volumeText +=
                            `Latest relative volume is approximately <strong>${number(relativeVolume, 2)}×</strong> the 20-day average. `;

                    }


                    if (
                        latestIndicators.obv_trend === "rising"
                    ) {

                        volumeText +=
                            `OBV is <strong>rising</strong>, meaning volume has generally accumulated on advancing days over the recent period.`;

                    } else if (
                        latestIndicators.obv_trend === "falling"
                    ) {

                        volumeText +=
                            `OBV is <strong>falling</strong>, meaning volume has generally accumulated more heavily on declining days over the recent period.`;

                    } else if (
                        latestIndicators.obv_trend === "neutral"
                    ) {

                        volumeText +=
                            `OBV is currently showing a relatively <strong>neutral</strong> recent trend.`;

                    }


                    /* ---------------------------------------------
                    INDICATOR DISPLAY
                    --------------------------------------------- */

                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#38bdf8;
                                margin-bottom:10px;
                            ">
                                Momentum
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">
                                ${momentumText || "Momentum data is currently unavailable."}
                            </div>

                        </div>


                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#38bdf8;
                                margin-bottom:10px;
                            ">
                                Trend
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">
                                ${trendText || "Moving-average data is currently unavailable."}
                            </div>

                        </div>


                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#38bdf8;
                                margin-bottom:10px;
                            ">
                                Volume
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">
                                ${volumeText || "Volume trend data is currently unavailable."}
                            </div>

                        </div>

                    `;


                    /* ---------------------------------------------
                    VOLATILITY
                    --------------------------------------------- */

                    const atr =
                        Number(
                            latestIndicators.atr14
                        );

                    const bollingerUpper =
                        Number(
                            latestIndicators.bollinger_upper
                        );

                    const bollingerLower =
                        Number(
                            latestIndicators.bollinger_lower
                        );


                    if (
                        Number.isFinite(atr) ||
                        (
                            Number.isFinite(bollingerUpper) &&
                            Number.isFinite(bollingerLower)
                        )
                    ) {

                        answer += `

                            <div style="
                                padding:14px 0;
                                border-top:1px solid rgba(148,163,184,.16);
                            ">

                                <div style="
                                    font-weight:800;
                                    color:#38bdf8;
                                    margin-bottom:10px;
                                ">
                                    Volatility
                                </div>

                                <div style="
                                    color:#cbd5e1;
                                    line-height:1.7;
                                ">

                                    ${
                                        Number.isFinite(atr)
                                            ? `ATR is approximately <strong>${money(atr)}</strong>, providing a measure of the stock's recent daily price movement.`
                                            : ""
                                    }

                                    ${
                                        Number.isFinite(bollingerUpper) &&
                                        Number.isFinite(bollingerLower)
                                            ? ` Bollinger Bands currently span approximately <strong>${money(bollingerLower)}–${money(bollingerUpper)}</strong>.`
                                            : ""
                                    }

                                </div>

                            </div>

                        `;

                    }

                }


                /* =================================================
                SMART MONEY
                ================================================= */

                if (smartMoneyStock) {

                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#a78bfa;
                                margin-bottom:8px;
                            ">
                                Smart Money Filter
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">

                                ${ticker} has appeared in the
                                EdgeBreak Smart Money Filter
                                <strong>
                                    ${smartMoneyStock.count}
                                    ${
                                        Number(smartMoneyStock.count) === 1
                                            ? "time"
                                            : "times"
                                    }
                                </strong>.

                                ${
                                    smartMoneyStock.last_seen
                                        ? `The most recent appearance was <strong>${formatDate(smartMoneyStock.last_seen)}</strong>.`
                                        : ""
                                }

                            </div>

                        </div>

                    `;

                }


                /* =================================================
                WHAT TO WATCH
                ================================================= */

                let watchText = "";


                if (preBreakoutStock) {

                    watchText =
                        `The main technical area EdgeBreak is tracking is resistance around <strong>${money(preBreakoutStock.resistance_price)}</strong>. Watch whether price, momentum and volume strengthen or weaken as the stock approaches that level.`;

                } else if (breakoutStock) {

                    watchText =
                        `The original breakout level around <strong>${money(breakoutStock.resistance)}</strong> remains an important technical reference. Watch whether price can maintain the move above that area and whether momentum and volume remain supportive.`;

                } else if (launchPadStock) {

                    watchText =
                        `The key technical areas are the Launch Pad support zone around <strong>${money(launchPadStock.support_zone_low)}–${money(launchPadStock.support_zone_high)}</strong> and resistance around <strong>${money(launchPadStock.resistance_zone_low)}–${money(launchPadStock.resistance_zone_high)}</strong>.`;

                }


                if (watchText) {

                    answer += `

                        <div style="
                            padding:14px 0;
                            border-top:1px solid rgba(148,163,184,.16);
                        ">

                            <div style="
                                font-weight:800;
                                color:#f8fafc;
                                margin-bottom:8px;
                            ">
                                What to Watch
                            </div>

                            <div style="
                                color:#cbd5e1;
                                line-height:1.7;
                            ">
                                ${watchText}
                            </div>

                        </div>

                    `;

                }


                /* =================================================
                DISCLAIMER
                ================================================= */

                answer += `

                        <div style="
                            margin-top:4px;
                            padding-top:12px;
                            border-top:1px solid rgba(148,163,184,.16);
                            color:#64748b;
                            font-size:12px;
                            line-height:1.6;
                        ">
                            EdgeBreak provides technical research and market
                            information only. It does not provide financial
                            advice or buy, sell or hold recommendations.
                        </div>

                    </div>

                `;

            }


            /* -------------------------------------------------
            DISPLAY ANSWER
            ------------------------------------------------- */

            const conversation =
                document.getElementById(
                    "edgeBreakChatConversation"
                );

            if (!conversation) {

                tickerMessage.textContent =
                    "Unable to display the Quick Rundown.";

                return;

            }


            /* -------------------------------------------------
            USER MESSAGE
            ------------------------------------------------- */

            const userMessage =
                document.createElement("div");

            userMessage.className =
                "edge-chat-message edge-chat-message-user";

            userMessage.innerHTML = `

                <div class="edge-chat-message-bubble">
                    <strong>
                        ${ticker} — ${selectedQuestionLabel}
                    </strong>
                </div>

            `;


            /* -------------------------------------------------
            AI MESSAGE
            ------------------------------------------------- */

            const aiMessage =
                document.createElement("div");

            aiMessage.className =
                "edge-chat-message edge-chat-message-ai";

            aiMessage.innerHTML = `

                <div class="edge-chat-message-icon">
                    ✦
                </div>

                <div class="edge-chat-message-bubble">
                    ${answer}
                </div>

            `;


            /* -------------------------------------------------
            CHANGE SCREEN
            ------------------------------------------------- */

            stockScreen.hidden = true;
            quickScreen.hidden = true;


            /* -------------------------------------------------
            ADD TO CHAT
            ------------------------------------------------- */

            conversation.appendChild(
                userMessage
            );

            conversation.appendChild(
                aiMessage
            );


            /* -------------------------------------------------
            BACK TO QUICK ANSWERS BUTTON
            ------------------------------------------------- */

            const answerBackRow =
                document.createElement("div");

            answerBackRow.style.cssText = `
                display:flex;
                justify-content:flex-start;
                margin:16px 0 8px 45px;
            `;


            const answerBackButton =
                document.createElement("button");

            answerBackButton.type =
                "button";

            answerBackButton.textContent =
                window.edgeBreakQuestionMode === "technical"
                    ? "← Back to Technical Setup"
                    : "← Back to Quick Answers";

            answerBackButton.style.cssText = `
                appearance:none;
                border:1px solid rgba(148,163,184,.22);
                background:#0f172a;
                color:#cbd5e1;
                border-radius:10px;
                padding:10px 14px;
                font-size:13px;
                font-weight:700;
                cursor:pointer;
                transition:.2s ease;
            `;


            answerBackButton.addEventListener(
                "mouseenter",
                function() {

                    answerBackButton.style.borderColor =
                        "rgba(34,197,94,.55)";

                    answerBackButton.style.color =
                        "#f8fafc";

                }
            );


            answerBackButton.addEventListener(
                "mouseleave",
                function() {

                    answerBackButton.style.borderColor =
                        "rgba(148,163,184,.22)";

                    answerBackButton.style.color =
                        "#cbd5e1";

                }
            );


            answerBackButton.addEventListener(
                "click",
                function() {

                    userMessage.remove();
                    aiMessage.remove();
                    answerBackRow.remove();

                    stockScreen.hidden = true;

                    const technicalScreen =
                        document.getElementById(
                            "edgeBreakTechnicalScreen"
                        );


                    /* -----------------------------------------
                    RETURN TO TECHNICAL SETUP
                    ----------------------------------------- */

                    if (
                        window.edgeBreakQuestionMode ===
                        "technical"
                    ) {

                        quickScreen.hidden = true;

                        if (technicalScreen) {
                            technicalScreen.hidden = false;
                        }

                    }


                    /* -----------------------------------------
                    RETURN TO QUICK ANSWERS
                    ----------------------------------------- */

                    else {

                        if (technicalScreen) {
                            technicalScreen.hidden = true;
                        }

                        quickScreen.hidden = false;

                    }


                    tickerInput.value = "";
                    tickerMessage.textContent = "";

                    conversation.scrollTop = 0;

                }
            );


            answerBackRow.appendChild(
                answerBackButton
            );

            conversation.appendChild(
                answerBackRow
            );


            /* -------------------------------------------------
            SCROLL TO ANSWER
            ------------------------------------------------- */

            setTimeout(
                function() {

                    conversation.scrollTop =
                        conversation.scrollHeight;

                },
                50
            );


            /* -------------------------------------------------
            SET ACTIVE STOCK
            ------------------------------------------------- */

            window.edgeBreakAIActiveSymbol =
                ticker;


            /* -------------------------------------------------
            SYNC MAIN CHART
            ------------------------------------------------- */

            if (
                typeof loadChart === "function"
            ) {

                loadChart(ticker);

            }

        }
    );

})();




/* =========================================================
   EDGEBREAK AI UNLIMITED
   SIDE PANEL INTEGRATION

   PHASE 6

   - EdgeBreak stock context
   - Rolling conversation memory
   - Approx. 1,500 word memory budget
   - Oldest complete exchanges removed first
   - Safer EdgeBreak ticker matching
========================================================= */

(function initEdgeBreakAIUnlimited() {

        /* =================================================
           MODE ELEMENTS
        ================================================= */

        const guidedBtn =
            document.getElementById(
                "edgeAIGuidedMode"
            );

        const unlimitedBtn =
            document.getElementById(
                "edgeAIUnlimitedMode"
            );

        const guidedContent =
            document.querySelector(
                ".edge-chat-intro"
            );

        const guidedConversation =
            document.getElementById(
                "edgeBreakChatConversation"
            );


        if (
            !guidedBtn ||
            !unlimitedBtn ||
            !guidedContent ||
            !guidedConversation
        ) {

            console.warn(
                "EdgeBreak AI mode switch elements not found."
            );

            return;

        }


        /* =================================================
           CREATE AI UNLIMITED PANEL
        ================================================= */

        const unlimitedContent =
            document.createElement(
                "div"
            );


        unlimitedContent.id =
            "edgeAIUnlimitedContent";


        unlimitedContent.style.display =
            "none";


        unlimitedContent.innerHTML = `

            <div class="edge-ai-unlimited-intro">

                <div class="edge-ai-unlimited-icon">
                    ✦
                </div>

                <h3>
                    AI Unlimited
                </h3>

                <p>
                    Ask EdgeBreak anything about a NASDAQ stock,
                    trading concept or market question.
                </p>

                <div
                    id="edgeAIUnlimitedAllowance"
                    style="
                        margin:0 0 16px;
                        padding:11px 14px;
                        background:rgba(34,197,94,.06);
                        border:1px solid rgba(34,197,94,.18);
                        border-radius:10px;
                        color:#94a3b8;
                        font-size:12px;
                        font-weight:700;
                        line-height:1.5;
                        text-align:center;
                    "
                >
                    Checking your AI Unlimited allowance...
                </div>

                <textarea
                    id="edgeAIUnlimitedQuestion"
                    placeholder="Ask a stock, trading or market question..."
                    rows="4"
                ></textarea>


                <button
                    type="button"
                    id="edgeAIUnlimitedAsk"
                    class="edge-ai-unlimited-ask"
                >
                    Ask EdgeBreak
                </button>


                <div
                    id="edgeAIUnlimitedStatus"
                    style="
                        margin-top:12px;
                        font-size:12px;
                        line-height:1.5;
                        color:#64748b;
                    "
                >
                    Loading EdgeBreak data...
                </div>


                <div
                    id="edgeAIUnlimitedAnswer"
                    style="
                        display:none;
                        margin-top:16px;
                        padding:16px;
                        text-align:left;
                        white-space:pre-wrap;
                        background:#0b1220;
                        border:1px solid #1e293b;
                        border-radius:10px;
                        color:#e2e8f0;
                        font-size:13px;
                        line-height:1.65;
                    "
                ></div>

            </div>

        `;


        /* =================================================
           PLACE AI UNLIMITED AS ITS OWN MODE
        ================================================= */

        const chatConversation =
            document.getElementById(
                "edgeBreakChatConversation"
            );


        if (
            !chatConversation
        ) {

            console.warn(
                "EdgeBreak chat conversation area not found."
            );

            return;

        }


        chatConversation.insertAdjacentElement(
            "afterend",
            unlimitedContent
        );


        /* =================================================
           UNLIMITED ELEMENTS
        ================================================= */

        const input =
            document.getElementById(
                "edgeAIUnlimitedQuestion"
            );


        const button =
            document.getElementById(
                "edgeAIUnlimitedAsk"
            );


        const answer =
            document.getElementById(
                "edgeAIUnlimitedAnswer"
            );


        const status =
            document.getElementById(
                "edgeAIUnlimitedStatus"
            );


        const allowanceStatus =
            document.getElementById(
                "edgeAIUnlimitedAllowance"
            );


        let unlimitedUsage =
            null;

        /* =================================================
        AUTHENTICATED EDGEBREAK SESSION
        ================================================= */

        async function getEdgeBreakSession() {

            const {
                data: {
                    session
                },
                error
            } =
                await window
                    .supabaseClient
                    .auth
                    .getSession();


            if (
                error ||
                !session?.access_token
            ) {

                throw new Error(
                    "Your EdgeBreak session has expired. Please log in again."
                );

            }


            return session;

        }    

        /* =================================================
        DISPLAY AI UNLIMITED ALLOWANCE
        ================================================= */

        function renderUnlimitedAllowance(
            data
        ) {

            if (
                !data ||
                !allowanceStatus
            ) {

                return;

            }


            unlimitedUsage = {

                accessLevel:
                    data.accessLevel,

                monthlyLimit:
                    data.monthlyLimit,

                used:
                    data.used,

                remaining:
                    data.remaining

            };


            /* =========================================
            FULL AI UNLIMITED PLAN
            ========================================= */

            if (
                data.accessLevel ===
                "unlimited"
            ) {

                allowanceStatus.textContent =
                    "AI Unlimited · Unlimited conversations";


                allowanceStatus.style.color =
                    "#4ade80";


                input.disabled =
                    false;


                button.disabled =
                    false;


                return;

            }


            /* =========================================
            INCLUDED 15 QUESTION PLAN
            ========================================= */

            const remaining =
                Math.max(
                    0,
                    Number(
                        data.remaining || 0
                    )
                );


            if (
                remaining === 0
            ) {

                allowanceStatus.textContent =
                    "0 of 15 AI Unlimited questions remaining this month · Resets on the 1st";


                allowanceStatus.style.color =
                    "#fbbf24";


                input.disabled =
                    true;


                button.disabled =
                    true;


                button.textContent =
                    "Monthly Limit Reached";


                return;

            }


            allowanceStatus.textContent =
                `${remaining} of 15 AI Unlimited ` +
                `${remaining === 1 ? "question" : "questions"} ` +
                `remaining this month · Resets on the 1st`;


            allowanceStatus.style.color =
                remaining <= 3
                    ? "#fbbf24"
                    : "#94a3b8";


            input.disabled =
                false;


            button.disabled =
                false;


            button.textContent =
                "Ask EdgeBreak";

        }

        /* =================================================
        LOAD ACCOUNT AI UNLIMITED ALLOWANCE
        ================================================= */

        async function loadUnlimitedAllowance() {

            try {

                allowanceStatus.textContent =
                    "Checking your AI Unlimited allowance...";


                const session =
                    await getEdgeBreakSession();


                const response =
                    await fetch(
                        "/api/ai-unlimited",
                        {

                            method:
                                "GET",

                            headers: {

                                "Authorization":
                                    `Bearer ${session.access_token}`

                            },

                            cache:
                                "no-store"

                        }
                    );


                let data;


                try {

                    data =
                        await response.json();

                }
                catch {

                    throw new Error(
                        "AI Unlimited allowance returned an invalid response."
                    );

                }


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data?.error ||
                        "Unable to check AI Unlimited allowance."
                    );

                }


                renderUnlimitedAllowance(
                    data
                );

            }
            catch (
                error
            ) {

                console.error(
                    "AI Unlimited allowance error:",
                    error
                );


                allowanceStatus.textContent =
                    "AI Unlimited allowance could not be checked.";


                allowanceStatus.style.color =
                    "#ef4444";


                input.disabled =
                    true;


                button.disabled =
                    true;

            }

        }

        /* =================================================
           CONVERSATION MEMORY

           Memory exists only while this page/session
           remains open.

           We retain recent user + assistant turns.

           Once the memory grows beyond the approximate
           word budget, the oldest COMPLETE exchange is
           removed first.
        ================================================= */

        const UNLIMITED_MEMORY_WORD_LIMIT =
            1500;


        let unlimitedConversationMemory =
            [];


        /* =================================================
           COUNT WORDS
        ================================================= */

        function countWords(
            value
        ) {

            const text =
                String(
                    value || ""
                )
                    .trim();


            if (
                !text
            ) {

                return 0;

            }


            return text
                .split(
                    /\s+/
                )
                .filter(
                    Boolean
                )
                .length;

        }


        /* =================================================
           MEMORY WORD COUNT
        ================================================= */

        function getConversationMemoryWordCount() {

            return unlimitedConversationMemory
                .reduce(
                    (
                        total,
                        turn
                    ) => {

                        return (
                            total +
                            countWords(
                                turn?.text
                            )
                        );

                    },
                    0
                );

        }


        /* =================================================
           TRIM CONVERSATION MEMORY

           Memory is stored as complete exchanges:

           user
           assistant
           user
           assistant

           Remove the oldest user + assistant pair
           whenever possible.
        ================================================= */

        function trimConversationMemory() {

            while (
                getConversationMemoryWordCount() >
                    UNLIMITED_MEMORY_WORD_LIMIT &&
                unlimitedConversationMemory.length >
                    2
            ) {

                /* =========================================
                   REMOVE OLDEST COMPLETE EXCHANGE
                ========================================= */

                if (
                    unlimitedConversationMemory[0]
                        ?.role === "user" &&
                    unlimitedConversationMemory[1]
                        ?.role === "assistant"
                ) {

                    unlimitedConversationMemory.splice(
                        0,
                        2
                    );

                }
                else {

                    /* =====================================
                       SAFETY FALLBACK

                       If memory ever becomes misaligned,
                       remove the oldest turn.
                    ===================================== */

                    unlimitedConversationMemory.shift();

                }

            }


            console.log(
                "AI Unlimited memory:",
                {

                    turns:
                        unlimitedConversationMemory.length,

                    words:
                        getConversationMemoryWordCount()

                }
            );

        }


        /* =================================================
           ADD COMPLETE EXCHANGE TO MEMORY
        ================================================= */

        function rememberExchange(
            userMessage,
            assistantAnswer
        ) {

            const cleanUserMessage =
                String(
                    userMessage || ""
                )
                    .trim();


            const cleanAssistantAnswer =
                String(
                    assistantAnswer || ""
                )
                    .trim();


            if (
                !cleanUserMessage ||
                !cleanAssistantAnswer
            ) {

                return;

            }


            unlimitedConversationMemory.push({

                role:
                    "user",

                text:
                    cleanUserMessage

            });


            unlimitedConversationMemory.push({

                role:
                    "assistant",

                text:
                    cleanAssistantAnswer

            });


            trimConversationMemory();

        }


        /* =================================================
           GET MEMORY FOR API

           Return a fresh copy so the current memory
           cannot be mutated accidentally by other code.
        ================================================= */

        function getConversationMemoryForApi() {

            trimConversationMemory();


            return unlimitedConversationMemory
                .map(
                    turn => ({

                        role:
                            turn.role,

                        text:
                            turn.text

                    })
                );

        }


        /* =================================================
           EDGEBREAK DATA STORES
        ================================================= */

        let unlimitedBreakoutData =
            [];


        let unlimitedPreBreakoutData =
            [];


        let unlimitedLaunchPadData =
            [];


        let unlimitedSmartMoneyData =
            [];


        let unlimitedIndicatorHistoryData =
            null;


        let unlimitedDataReady =
            false;


        /* =================================================
           LOAD JSON
        ================================================= */

        async function loadJsonFile(
            url
        ) {

            const response =
                await fetch(
                    url,
                    {
                        cache:
                            "no-store"
                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    `${url} returned ${response.status}`
                );

            }


            return await response.json();

        }


        /* =================================================
           FIND ARRAY
        ================================================= */

        function findArray(
            data,
            preferredKeys = []
        ) {

            if (
                Array.isArray(
                    data
                )
            ) {

                return data;

            }


            if (
                !data ||
                typeof data !==
                    "object"
            ) {

                return [];

            }


            for (
                const key
                of preferredKeys
            ) {

                if (
                    Array.isArray(
                        data[key]
                    )
                ) {

                    return data[key];

                }

            }


            for (
                const value
                of Object.values(
                    data
                )
            ) {

                if (
                    Array.isArray(
                        value
                    )
                ) {

                    return value;

                }

            }


            return [];

        }


        /* =================================================
           NORMALISE SYMBOL
        ================================================= */

        function normaliseSymbol(
            value
        ) {

            return String(
                value || ""
            )
                .trim()
                .toUpperCase();

        }


        /* =================================================
           LOAD ALL FIVE EDGEBREAK SOURCES
        ================================================= */

        async function loadUnlimitedData() {

            try {

                unlimitedDataReady =
                    false;


                status.textContent =
                    "Loading EdgeBreak data...";


                status.style.color =
                    "#64748b";


                const [

                    breakoutRaw,

                    preBreakoutRaw,

                    launchPadRaw,

                    smartMoneyRaw,

                    indicatorHistoryRaw

                ] =
                    await Promise.all([

                        loadJsonFile(
                            "/breakout_scanner.json"
                        ),

                        loadJsonFile(
                            "/scanner_database.json"
                        ),

                        loadJsonFile(
                            "/launchpad_database.json"
                        ),

                        loadJsonFile(
                            "/smart_money_filter.json"
                        ),

                        loadJsonFile(
                            "/scanner_indicator_history.json"
                        )

                    ]);


                /* =========================================
                   BREAKOUT
                ========================================= */

                unlimitedBreakoutData =
                    findArray(
                        breakoutRaw,
                        [
                            "stocks",
                            "results",
                            "scanner_data",
                            "data"
                        ]
                    );


                /* =========================================
                   PRE-BREAKOUT
                ========================================= */

                unlimitedPreBreakoutData =
                    findArray(
                        preBreakoutRaw,
                        [
                            "stocks",
                            "results",
                            "scanner_data",
                            "data"
                        ]
                    );


                /* =========================================
                   LAUNCH PAD
                ========================================= */

                unlimitedLaunchPadData =
                    findArray(
                        launchPadRaw,
                        [
                            "stocks",
                            "results",
                            "scanner_data",
                            "data"
                        ]
                    );


                /* =========================================
                   SMART MONEY
                ========================================= */

                unlimitedSmartMoneyData =
                    Array.isArray(
                        smartMoneyRaw
                    )
                        ? smartMoneyRaw
                        : findArray(
                            smartMoneyRaw,
                            [
                                "stocks",
                                "results",
                                "data"
                            ]
                        );


                /* =========================================
                   INDICATOR HISTORY
                ========================================= */

                unlimitedIndicatorHistoryData =
                    indicatorHistoryRaw;


                unlimitedDataReady =
                    true;


                status.textContent =
                    "EdgeBreak data ready.";


                status.style.color =
                    "#22c55e";


                console.log(
                    "AI Unlimited EdgeBreak data loaded:",
                    {

                        breakout:
                            unlimitedBreakoutData.length,

                        preBreakout:
                            unlimitedPreBreakoutData.length,

                        launchPad:
                            unlimitedLaunchPadData.length,

                        smartMoney:
                            unlimitedSmartMoneyData.length,

                        indicatorHistory:
                            Boolean(
                                unlimitedIndicatorHistoryData
                            )

                    }
                );

            }
            catch (
                error
            ) {

                unlimitedDataReady =
                    false;


                status.textContent =
                    "EdgeBreak data could not be loaded.";


                status.style.color =
                    "#ef4444";


                console.error(
                    "AI Unlimited data load error:",
                    error
                );

            }

        }


        /* =================================================
           CURRENT SCANNER LOOKUP
        ================================================= */

        function findCurrentScannerRecord(
            data,
            symbol
        ) {

            if (
                !Array.isArray(
                    data
                )
            ) {

                return null;

            }


            const ticker =
                normaliseSymbol(
                    symbol
                );


            return (
                data.find(
                    record =>
                        normaliseSymbol(
                            record?.symbol
                        ) === ticker
                ) ||
                null
            );

        }


        /* =================================================
           SMART MONEY LOOKUP
        ================================================= */

        function findSmartMoneyRecord(
            symbol
        ) {

            const ticker =
                normaliseSymbol(
                    symbol
                );


            if (
                !ticker ||
                !Array.isArray(
                    unlimitedSmartMoneyData
                )
            ) {

                return null;

            }


            return (
                unlimitedSmartMoneyData.find(
                    record =>
                        normaliseSymbol(
                            record?.symbol
                        ) === ticker
                ) ||
                null
            );

        }


        /* =================================================
           DEEP INDICATOR LOOKUP
        ================================================= */

        function deepFindSymbol(
            data,
            symbol,
            depth = 0
        ) {

            const ticker =
                normaliseSymbol(
                    symbol
                );


            if (
                !ticker ||
                !data ||
                depth > 12
            ) {

                return null;

            }


            /* =============================================
               ARRAY
            ============================================= */

            if (
                Array.isArray(
                    data
                )
            ) {

                for (
                    const item
                    of data
                ) {

                    if (
                        item &&
                        typeof item ===
                            "object"
                    ) {

                        const itemSymbol =
                            normaliseSymbol(

                                item?.symbol ??
                                item?.ticker ??
                                item?.stock

                            );


                        if (
                            itemSymbol ===
                            ticker
                        ) {

                            return item;

                        }

                    }

                }


                for (
                    const item
                    of data
                ) {

                    if (
                        item &&
                        typeof item ===
                            "object"
                    ) {

                        const found =
                            deepFindSymbol(
                                item,
                                ticker,
                                depth + 1
                            );


                        if (
                            found
                        ) {

                            return found;

                        }

                    }

                }


                return null;

            }


            /* =============================================
               OBJECT
            ============================================= */

            if (
                typeof data ===
                    "object"
            ) {

                for (
                    const [
                        key,
                        value
                    ]
                    of Object.entries(
                        data
                    )
                ) {

                    if (
                        normaliseSymbol(
                            key
                        ) === ticker
                    ) {

                        return value;

                    }

                }


                const objectSymbol =
                    normaliseSymbol(

                        data?.symbol ??
                        data?.ticker ??
                        data?.stock

                    );


                if (
                    objectSymbol ===
                    ticker
                ) {

                    return data;

                }


                for (
                    const value
                    of Object.values(
                        data
                    )
                ) {

                    if (
                        value &&
                        typeof value ===
                            "object"
                    ) {

                        const found =
                            deepFindSymbol(
                                value,
                                ticker,
                                depth + 1
                            );


                        if (
                            found
                        ) {

                            return found;

                        }

                    }

                }

            }


            return null;

        }


        /* =================================================
           INDICATOR LOOKUP
        ================================================= */

        function findIndicatorRecord(
            symbol
        ) {

            return deepFindSymbol(
                unlimitedIndicatorHistoryData,
                symbol
            );

        }


        /* =================================================
           BUILD COMPLETE EDGEBREAK STOCK CONTEXT
        ================================================= */

        function findEdgeBreakStock(
            symbol
        ) {

            const ticker =
                normaliseSymbol(
                    symbol
                );


            if (
                !ticker
            ) {

                return null;

            }


            const breakout =
                findCurrentScannerRecord(
                    unlimitedBreakoutData,
                    ticker
                );


            const preBreakout =
                findCurrentScannerRecord(
                    unlimitedPreBreakoutData,
                    ticker
                );


            const launchPad =
                findCurrentScannerRecord(
                    unlimitedLaunchPadData,
                    ticker
                );


            const smartMoney =
                findSmartMoneyRecord(
                    ticker
                );


            const indicators =
                findIndicatorRecord(
                    ticker
                );


            if (
                !breakout &&
                !preBreakout &&
                !launchPad &&
                !smartMoney &&
                !indicators
            ) {

                return null;

            }


            return {

                symbol:
                    ticker,


                scanners: {

                    breakout:
                        breakout,

                    preBreakout:
                        preBreakout,

                    launchPad:
                        launchPad

                },


                smartMoney:
                    smartMoney,


                indicators:
                    indicators

            };

        }


        /* =================================================
           KNOWN EDGEBREAK SYMBOLS

           Use actual symbols from EdgeBreak data rather
           than allowing ordinary English words such as
           RESISTANCE to be mistaken for tickers.
        ================================================= */

        function getKnownEdgeBreakSymbols() {

            const symbols =
                new Set();


            [

                unlimitedBreakoutData,

                unlimitedPreBreakoutData,

                unlimitedLaunchPadData,

                unlimitedSmartMoneyData

            ].forEach(
                data => {

                    if (
                        !Array.isArray(
                            data
                        )
                    ) {

                        return;

                    }


                    data.forEach(
                        record => {

                            const symbol =
                                normaliseSymbol(
                                    record?.symbol
                                );


                            if (
                                symbol
                            ) {

                                symbols.add(
                                    symbol
                                );

                            }

                        }
                    );

                }
            );


            return symbols;

        }


        /* =================================================
           EXTRACT CONFIRMED EDGEBREAK TICKERS

           This lookup is ONLY for deciding whether current
           EdgeBreak scanner context should be attached.

           Gemini can still research stocks that are not
           present in EdgeBreak's current data.
        ================================================= */

        function extractTickerCandidates(
            message
        ) {

            const words =
                String(
                    message || ""
                )
                    .toUpperCase()
                    .match(
                        /\b[A-Z][A-Z0-9.-]{0,9}\b/g
                    ) || [];


            const knownSymbols =
                getKnownEdgeBreakSymbols();


            return [
                ...new Set(

                    words.filter(
                        word =>
                            knownSymbols.has(
                                normaliseSymbol(
                                    word
                                )
                            )
                    )

                )
            ];

        }


        /* =================================================
           FIND FIRST CONFIRMED EDGEBREAK STOCK
        ================================================= */

        function getEdgeBreakContext(
            message
        ) {

            if (
                !unlimitedDataReady
            ) {

                return null;

            }


            const candidates =
                extractTickerCandidates(
                    message
                );


            console.log(
                "AI Unlimited confirmed EdgeBreak ticker candidates:",
                candidates
            );


            for (
                const candidate
                of candidates
            ) {

                const match =
                    findEdgeBreakStock(
                        candidate
                    );


                if (
                    match
                ) {

                    return match;

                }

            }


            return null;

        }


        /* =================================================
           SOURCE LIST
        ================================================= */

        function getContextSources(
            context
        ) {

            if (
                !context
            ) {

                return [];

            }


            const sources =
                [];


            if (
                context
                    ?.scanners
                    ?.breakout
            ) {

                sources.push(
                    "Breakout"
                );

            }


            if (
                context
                    ?.scanners
                    ?.preBreakout
            ) {

                sources.push(
                    "Pre-Breakout"
                );

            }


            if (
                context
                    ?.scanners
                    ?.launchPad
            ) {

                sources.push(
                    "Launch Pad"
                );

            }


            if (
                context?.smartMoney
            ) {

                sources.push(
                    "Smart Money"
                );

            }


            if (
                context?.indicators
            ) {

                sources.push(
                    "Indicators"
                );

            }


            return sources;

        }


        /* =================================================
           FORMAT AI ANSWER
        ================================================= */

        function escapeHtml(
            value
        ) {

            return String(
                value || ""
            )
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );

        }


        function formatUnlimitedAnswer(
            value
        ) {

            let formatted =
                escapeHtml(
                    value
                );


            /* =============================================
               **BOLD**
            ============================================= */

            formatted =
                formatted.replace(
                    /\*\*(.+?)\*\*/g,
                    "<strong>$1</strong>"
                );


            /* =============================================
               PARAGRAPH / LINE BREAKS
            ============================================= */

            formatted =
                formatted.replace(
                    /\n\n+/g,
                    "</p><p>"
                );


            formatted =
                formatted.replace(
                    /\n/g,
                    "<br>"
                );


            return (
                `<p>${formatted}</p>`
            );

        }


        /* =================================================
           ASK AI UNLIMITED
        ================================================= */

        async function askUnlimited() {

            const message =
                input.value.trim();


            if (
                !message
            ) {

                return;

            }


            button.disabled =
                true;


            button.textContent =
                "Thinking...";


            answer.style.display =
                "block";


            answer.textContent =
                "EdgeBreak AI is thinking...";


            try {

                /* =========================================
                   EDGEBREAK CONTEXT
                ========================================= */

                const edgeBreakContext =
                    getEdgeBreakContext(
                        message
                    );


                console.log(
                    "AI Unlimited complete EdgeBreak context:",
                    edgeBreakContext
                );


                /* =========================================
                   STATUS
                ========================================= */

                if (
                    edgeBreakContext
                        ?.symbol
                ) {

                    const sources =
                        getContextSources(
                            edgeBreakContext
                        );


                    status.textContent =
                        `${edgeBreakContext.symbol} · ` +
                        (
                            sources.length
                                ? sources.join(
                                    " + "
                                )
                                : "EdgeBreak data found"
                        );


                    status.style.color =
                        "#22c55e";

                }
                else {

                    status.textContent =
                        "No matching EdgeBreak scanner data — AI research available.";


                    status.style.color =
                        "#64748b";

                }


                /* =========================================
                   GET MEMORY BEFORE ADDING CURRENT QUESTION

                   The current question is sent separately,
                   so it must NOT already be inside history.
                ========================================= */

                const conversationHistory =
                    getConversationMemoryForApi();

                
                /* =========================================
                AUTHENTICATED EDGEBREAK SESSION
                ========================================= */

                const session =
                    await getEdgeBreakSession();


                /* =========================================
                API
                ========================================= */

                const response =
                    await fetch(
                        "/api/ai-unlimited",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${session.access_token}`

                            },

                            body:
                                JSON.stringify({

                                    message:
                                        message,

                                    conversationHistory:
                                        conversationHistory,

                                    edgeBreakContext:
                                        edgeBreakContext

                                })

                        }
                    );


                let data;


                try {

                    data =
                        await response.json();

                }
                catch {

                    throw new Error(
                        "AI Unlimited returned an invalid response."
                    );

                }


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data?.error ||
                        "AI Unlimited request failed."
                    );

                }


                if (
                    !data?.answer
                ) {

                    throw new Error(
                        "AI Unlimited returned no answer."
                    );

                }

                /* =========================================
                UPDATE MONTHLY ALLOWANCE
                ========================================= */

                renderUnlimitedAllowance(
                    data
                );


                /* =========================================
                   REMEMBER SUCCESSFUL EXCHANGE

                   Failed requests are deliberately NOT
                   added to conversation memory.
                ========================================= */

                rememberExchange(
                    message,
                    data.answer
                );


                /* =========================================
                   DISPLAY ANSWER
                ========================================= */

                answer.innerHTML =
                    formatUnlimitedAnswer(
                        data.answer
                    );


                /* =========================================
                   CLEAR INPUT AFTER SUCCESS
                ========================================= */

                input.value =
                    "";


                /* =========================================
                   SCROLL ANSWER INTO VIEW
                ========================================= */

                requestAnimationFrame(
                    () => {

                        answer.scrollIntoView({

                            behavior:
                                "smooth",

                            block:
                                "nearest"

                        });

                    }
                );

            }
            catch (
                error
            ) {

                console.error(
                    "AI Unlimited Error:",
                    error
                );


                answer.textContent =
                    "Error: " +
                    (
                        error?.message ||
                        "Unable to reach AI Unlimited."
                    );

            }
            finally {

                if (
                    unlimitedUsage?.accessLevel ===
                        "included" &&
                    Number(
                        unlimitedUsage?.remaining
                    ) <= 0
                ) {

                    button.disabled =
                        true;


                    button.textContent =
                        "Monthly Limit Reached";

                }
                else {

                    button.disabled =
                        false;


                    button.textContent =
                        "Ask EdgeBreak";

                }

            }

        }


        /* =================================================
           MODE SWITCH — GUIDED AI
        ================================================= */

        guidedBtn.addEventListener(
            "click",
            () => {

                guidedBtn.classList.add(
                    "active"
                );


                unlimitedBtn.classList.remove(
                    "active"
                );


                guidedContent.style.display =
                    "";


                guidedConversation.style.display =
                    "";


                unlimitedContent.style.display =
                    "none";

            }
        );


        /* =================================================
           MODE SWITCH — AI UNLIMITED
        ================================================= */

        unlimitedBtn.addEventListener(
            "click",
            () => {

                unlimitedBtn.classList.add(
                    "active"
                );


                guidedBtn.classList.remove(
                    "active"
                );


                guidedContent.style.display =
                    "none";


                guidedConversation.style.display =
                    "none";


                unlimitedContent.style.display =
                    "";


                input.focus();

            }
        );


        /* =================================================
           ASK BUTTON
        ================================================= */

        button.addEventListener(
            "click",
            askUnlimited
        );


        /* =================================================
           ENTER TO SEND

           Shift + Enter still allows a new line.
        ================================================= */

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                        "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();


                    askUnlimited();

                }

            }
        );


        /* =================================================
           START
        ================================================= */

        loadUnlimitedData();

        loadUnlimitedAllowance();

    
})();

