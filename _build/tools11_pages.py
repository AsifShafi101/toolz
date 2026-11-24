# ---------------- Batch 2: wheel spinner, name picker, coin, dice, timers, working days ----------------
_fair = "<h2>Is it really random?</h2><p>Yes. Results use your browser's cryptographic random number generator (<code>crypto.getRandomValues</code>), the same source used for passwords, not the predictable <code>Math.random</code>. Every option has exactly the same chance, and nobody, including us, can influence the result.</p>"

tool_page("wheel-spinner",
    "Wheel Spinner – Free Random Picker Wheel for Names & Prizes | etoolbox",
    "Wheel spinner",
    "Type your options, one per line, and spin the wheel to pick a random winner. Great for classrooms, giveaways, team meetings and settling decisions. Share your wheel with a link, remove winners as you go, and spin as often as you like. Free, with no sign-up.",
    """
  <form class="wh-wrap" data-wheel novalidate>
    <div class="panel wh-side">
      <label for="wh-entries">Entries <span class="muted">(one per line)</span> · <span id="wh-count"></span></label>
      <textarea id="wh-entries" name="entries" rows="12" spellcheck="false">Ali
Beth
Chen
Dami
Ella
Finn
Grace
Hassan</textarea>
      <div class="actions"><button type="button" class="btn ghost sm" id="wh-shuffle">Shuffle</button><button type="button" class="btn ghost sm" id="wh-sort">Sort A–Z</button><button type="button" class="btn ghost sm" id="wh-share">Copy link to this wheel</button></div>
      <label class="check"><input type="checkbox" name="remove"> Remove the winner after each spin</label>
      <label class="check"><input type="checkbox" name="sound" checked> Sound</label>
      <h3 class="lb-h">Winners</h3><ol class="wh-hist" id="wh-hist"></ol>
    </div>
    <div class="panel wh-main">
      <div class="wh-stage" id="wh-stage"><canvas id="wh-canvas" tabindex="0" role="button" aria-label="Spin the wheel"></canvas></div>
      <button type="button" class="btn wh-spin" id="wh-spin">Spin the wheel</button>
      <div class="wh-result" id="wh-result" role="status" aria-live="polite"></div>
    </div>
  </form>""",
    """<h2>How to use the wheel spinner</h2><ol><li>Type or paste your options in the box, one per line: names, prizes, restaurants, chores, anything.</li><li>Click the wheel or press <strong>Spin the wheel</strong>.</li><li>The wheel slows down and lands on a winner. Tick <em>Remove the winner</em> to pick several different people in turn.</li><li>Use <strong>Copy link to this wheel</strong> to share it, or to save it for next time.</li></ol>
<h2>Ideas</h2><ul><li><strong>Teachers:</strong> pick who answers next, choose a class job or a reading order.</li><li><strong>Giveaways:</strong> draw a winner from entrants live on stream or video.</li><li><strong>Teams:</strong> choose who presents first at the stand-up meeting.</li><li><strong>Home:</strong> decide what's for dinner, which film to watch or whose turn it is to wash up.</li></ul>""" + _fair,
    [("Can I add lots of entries?", "Yes, up to 200. The text gets smaller as you add more."),
     ("Can I save my wheel?", "Click “Copy link to this wheel”. The link contains your entries, so opening it brings the same wheel back. Nothing is stored on our servers."),
     ("Is the wheel fair?", "Yes. The winner is chosen with your browser's cryptographic random generator, and every slice is exactly the same size."),
     ("Can I use it for a giveaway?", "Yes. Share your screen or record the spin so entrants can see the draw.")],
    ("fun.js",))

tool_page("random-name-picker",
    "Random Name Picker & Team Generator – Free for Classrooms | etoolbox",
    "Random name picker & team generator",
    "Paste a list of names to pick one or more at random, without repeats, or split everyone into fair random teams. Ideal for teachers, coaches, meetings and prize draws. Your list is saved on your device for next time.",
    """
  <form class="gen" data-picker novalidate>
    <div class="panel">
      <label for="np-names">Names <span class="muted">(one per line)</span> · <span id="np-count"></span></label>
      <textarea id="np-names" name="names" rows="12" spellcheck="false">Amelia
Ben
Charlotte
Daniel
Emily
Freddie
George
Harper
Isla
Jack</textarea>
      <div class="row"><div><label for="np-how">How many to pick</label><input type="number" id="np-how" name="howmany" min="1" max="100" value="1"></div>
      <div><label class="check" style="margin-top:34px"><input type="checkbox" name="norepeat" checked> Don't pick anyone twice</label></div></div>
      <label class="check"><input type="checkbox" name="sound" checked> Sound</label>
      <div class="actions"><button type="button" class="btn" id="np-pick">Pick a name</button><button type="button" class="btn ghost" id="np-shuffle">Shuffle list</button><button type="button" class="btn ghost" id="np-reset">Reset</button></div>
      <h3 class="lb-h">Make teams</h3>
      <div class="row"><div><label for="np-tn">Number</label><input type="number" id="np-tn" name="tn" min="1" max="50" value="2"></div>
      <div><label for="np-tby">Split into</label><select id="np-tby" name="tby"><option value="teams">teams</option><option value="size">people per team</option></select></div></div>
      <div class="actions"><button type="button" class="btn secondary" id="np-teams">Make random teams</button></div>
    </div>
    <div class="panel np-panel"><div id="np-out" class="np-out" role="status" aria-live="polite"></div><h3 class="lb-h">Already picked</h3><ol class="wh-hist" id="np-hist"></ol></div>
  </form>""",
    """<h2>How to pick a random name</h2><ol><li>Paste your class list, team or entrants, one name per line.</li><li>Choose how many names to pick and press <strong>Pick a name</strong>.</li><li>Keep <em>Don't pick anyone twice</em> ticked to go round everyone before anyone is picked again.</li></ol>
<h2>Making fair teams</h2><p>Enter how many teams you want (or how many people per team) and press <strong>Make random teams</strong>. Everyone is shuffled and shared out as evenly as possible. Press it again for a new mix, and copy the teams to paste into an email, chat or the class board.</p>""" + _fair,
    [("Is my class list saved?", "Only in your own browser, so it's there next time you visit on the same device. It's never uploaded."),
     ("Can I pick several winners at once?", "Yes. Set “How many to pick” to the number of winners you need."),
     ("What if the teams don't divide evenly?", "Names are shared out as evenly as possible, so some teams have one extra person.")],
    ("fun.js",))

tool_page("coin-flip",
    "Flip a Coin – Heads or Tails Online Coin Toss | etoolbox",
    "Flip a coin",
    "Heads or tails? Toss a virtual coin with a realistic flip. Truly random, with a running tally, streaks and history. Tap the coin or press the space bar.",
    """
  <form class="panel cf-wrap" data-coin novalidate>
    <div class="cf-stage"><button type="button" class="cf-coin" id="cf-coin" aria-label="Flip the coin"><span class="cf-face cf-h">H</span><span class="cf-face cf-t">T</span></button></div>
    <div class="cf-out" id="cf-out" role="status" aria-live="polite"></div>
    <div class="actions" style="justify-content:center"><button type="button" class="btn" id="cf-flip">Flip the coin</button><button type="button" class="btn ghost" id="cf-reset">Reset tally</button></div>
    <p class="cf-stats" id="cf-stats"></p><p class="cf-hist muted" id="cf-hist"></p>
  </form>""",
    """<h2>Is an online coin flip fair?</h2><p>Real coins are very slightly biased: studies have found a tossed coin lands the same way it started a little more often than half the time. This virtual coin uses your browser's cryptographic random number generator, so heads and tails each have exactly a 50% chance.</p>
<p>Streaks are normal. In 100 flips you'll usually see a run of 6 or 7 of the same side at some point, even though every flip is independent.</p>""",
    [("Can I flip with the keyboard?", "Yes. Press the space bar to flip."),
     ("What are the odds of heads?", "Exactly 50% on every flip. Previous flips have no effect on the next one.")],
    ("fun.js",))

tool_page("dice-roller",
    "Dice Roller – Roll Virtual Dice Online (d4 to d20) | etoolbox",
    "Dice roller",
    "Roll up to 10 virtual dice at once: standard six-sided dice for board games, or d4, d8, d10, d12 and d20 for tabletop role-playing games. Fair, random results with a total and history.",
    """
  <form class="panel dc-wrap" data-dice novalidate>
    <div class="row"><div><label for="dc-count">Number of dice</label><select id="dc-count" name="count">""" + "".join(f'<option{" selected" if i == 2 else ""}>{i}</option>' for i in range(1, 11)) + """</select></div>
    <div><label for="dc-sides">Type of dice</label><select id="dc-sides" name="sides"><option value="6">6-sided (d6)</option><option value="4">d4</option><option value="8">d8</option><option value="10">d10</option><option value="12">d12</option><option value="20">d20</option></select></div></div>
    <div class="dc-tray" id="dc-tray" aria-live="polite"></div>
    <div class="dc-out" id="dc-out" role="status"></div>
    <div class="actions" style="justify-content:center"><button type="button" class="btn" id="dc-roll">Roll the dice</button></div>
    <h3 class="lb-h">History</h3><ol class="wh-hist" id="dc-hist"></ol>
  </form>""",
    """<h2>Uses</h2><ul><li><strong>Board games:</strong> Monopoly, Ludo, Snakes and Ladders, Yahtzee. Lost the dice? Roll here.</li><li><strong>Role-playing games:</strong> Dungeons &amp; Dragons and others use d4, d8, d10, d12 and d20.</li><li><strong>Teaching probability:</strong> roll lots of dice and compare the results with what you'd expect.</li></ul>""" + _fair,
    [("Are the dice fair?", "Yes. Every face has exactly the same chance, using cryptographic randomness."),
     ("What's the most common total with two dice?", "7. There are 6 ways to make 7 out of 36 combinations, so it comes up about 1 in 6 rolls.")],
    ("fun.js",))

_presets = "".join(f'<button type="button" class="btn ghost sm" data-preset="{s}">{n}</button>' for s, n in [(60, "1 min"), (180, "3 min"), (300, "5 min"), (600, "10 min"), (900, "15 min"), (1500, "25 min"), (1800, "30 min"), (3600, "1 hour")])
tool_page("countdown-timer",
    "Countdown Timer – Free Online Timer with Alarm | etoolbox",
    "Countdown timer",
    "Set a countdown for any length of time, or count down to a date and time, with an alarm when it ends. Full-screen mode for classrooms, presentations and workouts. Keeps accurate time even in a background tab.",
    f"""
  <form class="panel cd-wrap" data-countdown novalidate>
    <div class="cd-stage" id="cd-stage"><div class="cd-time" id="cd-time" role="timer" aria-live="off">0:00</div><div class="cd-bar"><i id="cd-bar"></i></div></div>
    <div class="actions" style="justify-content:center"><button type="button" class="btn" id="cd-start">Start</button><button type="button" class="btn secondary" id="cd-reset">Reset</button><button type="button" class="btn ghost" id="cd-full">Full screen</button><button type="button" class="btn ghost" id="cd-link">Copy link</button></div>
    <div class="cd-presets">{_presets}</div>
    <div class="row"><div><label for="cd-mode">Count down</label><select id="cd-mode" name="mode"><option value="dur">for a length of time</option><option value="date">to a date and time</option></select></div><div></div></div>
    <div class="row3" data-cd-mode="dur"><div><label for="cd-h">Hours</label><input type="number" id="cd-h" name="h" min="0" max="99" value="0"></div><div><label for="cd-m">Minutes</label><input type="number" id="cd-m" name="m" min="0" max="59" value="5"></div><div><label for="cd-s">Seconds</label><input type="number" id="cd-s" name="s" min="0" max="59" value="0"></div></div>
    <div data-cd-mode="date" hidden><label for="cd-to">Date and time</label><input type="datetime-local" id="cd-to" name="to"></div>
    <label class="check"><input type="checkbox" name="sound" checked> Play an alarm when time is up</label>
    <label class="check"><input type="checkbox" name="notify"> Show a notification if I'm in another tab</label>
    <p class="hint">Keyboard: Space to start or pause, R to reset, F for full screen.</p>
  </form>""",
    """<h2>How to use the countdown timer</h2><ol><li>Pick a preset or type hours, minutes and seconds. To count down to an event, choose <em>to a date and time</em>.</li><li>Press <strong>Start</strong>. The time also shows in the browser tab title.</li><li>When time is up, the alarm sounds and the screen flashes. Press Reset to stop it.</li></ol>
<p>Use <strong>Copy link</strong> to share a ready-made timer. For example, send a 10-minute break timer to a class, or a countdown to a launch, birthday or wedding.</p>
<h2>Popular timers</h2><p><a href="/countdown-timer/?t=300">5 minutes</a> · <a href="/countdown-timer/?t=600">10 minutes</a> · <a href="/countdown-timer/?t=900">15 minutes</a> · <a href="/countdown-timer/?t=1800">30 minutes</a> · <a href="/countdown-timer/?t=3600">1 hour</a> · <a href="/pomodoro-timer/">Pomodoro timer</a> · <a href="/stopwatch/">Stopwatch</a></p>""",
    [("Will the timer keep going if I switch tabs?", "Yes. It uses the clock rather than counting ticks, so it stays accurate in a background tab. Tick the notification option to get a pop-up when time is up."),
     ("Why didn't I hear the alarm?", "Browsers only play sound after you've interacted with the page, so start the timer with a click or the space bar, and check your device isn't muted."),
     ("Can I count down to Christmas or New Year?", "Yes. Choose “to a date and time” and pick the date. Days are shown when there's more than 24 hours to go.")],
    ("timers.js",))

tool_page("stopwatch",
    "Online Stopwatch with Laps – Free & Accurate | etoolbox",
    "Stopwatch",
    "A simple, accurate online stopwatch with lap and split times, to the hundredth of a second. Full screen for sport and classrooms, keyboard shortcuts, and copy your laps to a spreadsheet.",
    """
  <form class="panel cd-wrap" data-stopwatch novalidate>
    <div class="cd-stage" id="sw-stage"><div class="cd-time sw-time" id="sw-time" role="timer" aria-live="off">0:00.00</div></div>
    <div class="actions" style="justify-content:center"><button type="button" class="btn" id="sw-start">Start</button><button type="button" class="btn secondary" id="sw-lap">Lap</button><button type="button" class="btn ghost" id="sw-full">Full screen</button></div>
    <table class="sw-laps"><thead><tr><th>Lap</th><th>Lap time</th><th>Total</th></tr></thead><tbody id="sw-laps"></tbody></table>
    <div class="actions"><button type="button" class="btn ghost sm" id="sw-copy" hidden>Copy laps</button></div>
    <p class="hint">Keyboard: Space to start or stop, L for a lap. The fastest lap shows in green and the slowest in red.</p>
  </form>""",
    """<h2>How to use the stopwatch</h2><p>Press <strong>Start</strong> (or the space bar). Press <strong>Lap</strong> to record a split without stopping. Press <strong>Stop</strong> to pause, then <strong>Reset</strong> to clear it. Copy your laps and paste them straight into Excel or Google Sheets.</p>
<p>Need to count down instead? Try the <a href="/countdown-timer/">countdown timer</a> or the <a href="/pomodoro-timer/">Pomodoro timer</a>.</p>""",
    [("How accurate is it?", "It uses your device's high-resolution clock, so it's accurate to well under a hundredth of a second. Real-world accuracy depends on how quickly you press the button."),
     ("Does it keep running in the background?", "Yes. The time is worked out from the clock, so it stays correct if you switch tabs.")],
    ("timers.js",))

tool_page("pomodoro-timer",
    "Pomodoro Timer – Free Online Focus Timer (25/5) | etoolbox",
    "Pomodoro timer",
    "Work in focused 25-minute sessions with short breaks in between, and a longer break after every four. Adjustable times, sound and desktop notifications, and a count of today's sessions. Free, with no sign-up.",
    """
  <form class="gen" data-pomodoro novalidate>
    <div class="panel po-main"><div class="po-stage" id="po-stage" data-phase="work">
      <div class="po-tabs"><button type="button" data-phase-btn="work">Focus</button><button type="button" data-phase-btn="short">Short break</button><button type="button" data-phase-btn="long">Long break</button></div>
      <div class="po-ringwrap"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="po-track"/><circle cx="60" cy="60" r="54" class="po-ring" id="po-ring"/></svg>
        <div class="po-center"><div class="po-time" id="po-time" role="timer">25:00</div><div class="po-phase" id="po-phase">Focus</div></div></div>
      <div class="actions" style="justify-content:center"><button type="button" class="btn" id="po-start">Start</button><button type="button" class="btn secondary" id="po-skip">Skip</button><button type="button" class="btn ghost" id="po-reset">Reset</button></div>
      <p class="muted" id="po-done" style="text-align:center"></p></div></div>
    <div class="panel">
      <div class="row3"><div><label for="po-work">Focus (min)</label><input type="number" id="po-work" name="work" min="1" max="120" value="25"></div><div><label for="po-short">Short break</label><input type="number" id="po-short" name="short" min="1" max="60" value="5"></div><div><label for="po-long">Long break</label><input type="number" id="po-long" name="long" min="1" max="90" value="15"></div></div>
      <label for="po-every">Long break after every</label><select id="po-every" name="every"><option value="2">2 sessions</option><option value="3">3 sessions</option><option value="4" selected>4 sessions</option><option value="5">5 sessions</option></select>
      <label class="check"><input type="checkbox" name="auto" checked> Start the next session automatically</label>
      <label class="check"><input type="checkbox" name="sound" checked> Sound at the end of each session</label>
      <label class="check"><input type="checkbox" name="notify"> Desktop notifications</label>
    </div>
  </form>""",
    """<h2>What is the Pomodoro technique?</h2><p>Created by Francesco Cirillo in the late 1980s and named after his tomato-shaped kitchen timer, it's a simple way to beat procrastination: work on one task for 25 minutes, take a 5-minute break, and after four rounds take a longer break of 15–30 minutes. Short, timed bursts make big tasks feel manageable and keep your focus fresh.</p>
<h2>Tips</h2><ul><li>Pick one task before you start, and put your phone out of reach.</li><li>If something pops into your head, jot it down and carry on.</li><li>Use breaks to stand up, stretch and look away from the screen.</li><li>Studying or doing deep work? Try 50 minutes of focus with 10-minute breaks.</li></ul>""",
    [("Does it work in the background?", "Yes. The time is based on the clock, so it stays accurate in another tab. Turn on desktop notifications to know when a session ends."),
     ("Are my sessions saved?", "Today's session count is kept in your browser and resets the next day. Nothing is uploaded.")],
    ("timers.js",))

tool_page("working-days-calculator",
    "Working Days Calculator UK – Business Days Excluding Bank Holidays | etoolbox",
    "Working days calculator",
    "Count the working days between two dates, or add working days to a date, skipping weekends and UK bank holidays for England and Wales, Scotland or Northern Ireland. Useful for notice periods, deadlines, delivery dates and payroll.",
    """
  <div class="gen">
    <form class="panel" data-workdays novalidate>
      <label for="wd-region">Bank holidays for</label><select id="wd-region" name="region"><option value="ew">England and Wales</option><option value="sc">Scotland</option><option value="ni">Northern Ireland</option></select>
      <label for="wd-mode">I want to</label><select id="wd-mode" name="mode"><option value="between">count working days between two dates</option><option value="add">add or subtract working days</option></select>
      <div data-wd-mode="between"><div class="row"><div><label for="wd-from">Start date</label><input type="date" id="wd-from" name="from"></div><div><label for="wd-to">End date</label><input type="date" id="wd-to" name="to"></div></div>
        <label class="check"><input type="checkbox" name="incl" checked> Include the end date</label></div>
      <div data-wd-mode="add" hidden><label for="wd-start">Start date</label><input type="date" id="wd-start" name="start">
        <div class="row"><div><label for="wd-n">Working days</label><input type="number" id="wd-n" name="n" min="0" max="2000" value="10"></div><div><label for="wd-dir">Direction</label><select id="wd-dir" name="dir"><option value="add">after the start date</option><option value="sub">before the start date</option></select></div></div></div>
    </form>
    <div class="panel" id="wd-out" aria-live="polite"></div>
  </div>""",
    """<h2>How working days are counted</h2><p>Working days are Monday to Friday, excluding bank holidays. Bank holidays differ across the UK: Scotland has 2 January and St Andrew's Day but not Easter Monday, and its summer bank holiday is in early August. Northern Ireland adds St Patrick's Day and the Battle of the Boyne. When a holiday falls at a weekend, the next weekday becomes a substitute day off.</p>
<p>The holidays are calculated from these rules for any year. Occasionally the government adds a special one-off bank holiday, so always double-check dates that matter legally on <a href="https://www.gov.uk/bank-holidays" target="_blank" rel="noopener">GOV.UK bank holidays</a>.</p>
<h2>Common uses</h2><ul><li><strong>Notice periods:</strong> when does a one-month or 20-working-day notice end?</li><li><strong>Payment terms and deliveries:</strong> what date is "10 working days" from today?</li><li><strong>HR and payroll:</strong> how many working days are in a month, for pro-rata pay or holiday?</li></ul>""",
    [("Does the start date count?", "When counting between two dates, both dates are included unless you untick “Include the end date”. When adding working days, counting starts from the next day."),
     ("Are bank holidays the same everywhere in the UK?", "No. England and Wales, Scotland and Northern Ireland each have their own. Choose your nation at the top."),
     ("What about my own company's closure days?", "The calculator doesn't know about company shutdowns. Subtract those days yourself.")],
    ("workdays.js",))
