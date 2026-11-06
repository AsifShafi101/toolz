# Batch 7: maths – scientific calculator, number base converter, fraction calculator, statistics calculator

def key(label, k, sk=None, slabel=None, cls=""):
    k_attr = html.escape(k, quote=True)
    sk_attr = f' data-sk="{html.escape(sk, quote=True)}"' if sk else ""
    top = f'<small>{slabel}</small>' if slabel else ""
    return f'<button type="button" class="k {cls}" data-k="{k_attr}"{sk_attr}>{top}<span>{label}</span></button>'


SCI_KEYS = "".join([
    key("SHIFT", "shift", cls="k-fn k-shift").replace('class="k k-fn k-shift"', 'class="k k-fn k-shift" id="k-shift" aria-pressed="false"'),
    key("x²", "²", "√(", "√", "k-fn"), key("x³", "³", "∛(", "∛", "k-fn"), key("xʸ", "^(", None, None, "k-fn"),
    key("x⁻¹", "⁻¹", "!", "x!", "k-fn"), key("log", "log(", "10^(", "10ˣ", "k-fn"),
    key("ln", "ln(", "e^(", "eˣ", "k-fn"), key("sin", "sin(", "sin⁻¹(", "sin⁻¹", "k-fn"), key("cos", "cos(", "cos⁻¹(", "cos⁻¹", "k-fn"),
    key("tan", "tan(", "tan⁻¹(", "tan⁻¹", "k-fn"), key("(", "(", None, None, "k-fn"), key(")", ")", None, None, "k-fn"),
    key("S⇔D", "SD", None, None, "k-fn"), key("nCr", "C", "P", "nPr", "k-fn"), key("π", "π", "e", "e", "k-fn"),
    key("√", "√(", None, None, "k-fn"), key("%", "%", None, None, "k-fn"), key("|x|", "abs(", None, None, "k-fn"),
    key("M+", "M+", "M-", "M−", "k-fn"), key("MR", "MR", "MC", "MC", "k-fn"),
])
SCI_PAD = "".join([
    key("7", "7"), key("8", "8"), key("9", "9"), key("DEL", "DEL", cls="k-del"), key("AC", "AC", cls="k-del"),
    key("4", "4"), key("5", "5"), key("6", "6"), key("×", "×", cls="k-op"), key("÷", "÷", cls="k-op"),
    key("1", "1"), key("2", "2"), key("3", "3"), key("+", "+", cls="k-op"), key("−", "−", cls="k-op"),
    key("0", "0"), key(".", "."), key("×10ˣ", "×10^", cls="k-op"), key("Ans", "Ans", cls="k-op"), key("=", "=", cls="k-eq"),
])

tool_page("scientific-calculator", "Scientific Calculator Online – Free GCSE-Style Calculator | etoolbox", "Scientific calculator",
    "A free online scientific calculator with fractions, surds, powers, roots, trigonometry, logs, nCr, memory and a table of values. Works on phone and computer, with keyboard support.",
    f"""
  <div class="sci-layout">
    <div class="sci" data-sci>
      <div class="sci-screen">
        <div class="sci-status"><span id="sci-mode">DEG</span><span id="sci-mem" hidden>M</span><span class="sci-shift-ind">S</span></div>
        <label for="sci-expr" class="sr-only">Calculation</label>
        <input id="sci-expr" class="sci-expr" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="e.g. 3/4 + 2√8 or sin(30)">
        <div class="sci-out" id="sci-out" aria-live="polite">0</div>
        <div class="sci-alt" id="sci-alt"></div>
      </div>
      <p class="sci-err" id="sci-err" role="status"></p>
      <div class="sci-modes" role="group" aria-label="Angle unit"><button type="button" data-mode="deg">DEG</button><button type="button" data-mode="rad">RAD</button><button type="button" data-mode="grad">GRAD</button>
        <button type="button" class="sci-copy" data-k="copy">Copy answer</button></div>
      <div class="sci-keys">{SCI_KEYS}</div>
      <div class="sci-pad">{SCI_PAD}</div>
    </div>
    <div class="sci-side">
      <div class="panel"><div class="ph-row" style="justify-content:space-between;margin:0 0 6px"><h3 style="margin:0">History</h3><button type="button" class="btn secondary small" id="sci-clear-hist">Clear</button></div>
        <ul class="sci-hist" id="sci-hist"></ul></div>
      <details class="panel tbl-panel" open><summary><h3 style="display:inline">Table of values</h3></summary>
        <form id="tbl-form" novalidate>
          <label for="fx">f(x) =</label><input type="text" id="fx" name="fx" placeholder="e.g. x²−3x+2" autocomplete="off">
          <div class="row"><div><label for="start">Start</label><input type="number" id="start" name="start" value="-3" step="any"></div><div><label for="end">End</label><input type="number" id="end" name="end" value="3" step="any"></div></div>
          <label for="step">Step</label><input type="number" id="step" name="step" value="1" step="any">
          <button class="btn" type="submit" style="margin-top:12px">Make table</button><p class="warn" id="tbl-msg"></p>
        </form><div id="tbl-out" class="tbl-out"></div></details>
    </div>
  </div>""",
    """<h2>How to use the scientific calculator</h2><ul>
<li>Tap the keys or <strong>type straight into the screen</strong> with your keyboard. Press <strong>Enter</strong> or <strong>=</strong> for the answer.</li>
<li><strong>SHIFT</strong> gives the second function shown above a key, e.g. SHIFT + x² for √, SHIFT + sin for sin⁻¹, SHIFT + log for 10ˣ.</li>
<li><strong>S⇔D</strong> switches the answer between a fraction, a mixed number, a surd (like 2√2) and a decimal.</li>
<li>Choose <strong>DEG</strong>, <strong>RAD</strong> or <strong>GRAD</strong> for angles. Degrees is the default for GCSE.</li>
<li>Press an operator straight after an answer to keep going with <strong>Ans</strong>. Brackets you forget to close at the end are closed for you.</li>
<li>The <strong>table of values</strong> works out f(x) for a range of x, handy for plotting graphs.</li></ul>
<h2>Functions included</h2><p>Fractions and decimals, x², x³, xʸ, √, ∛, x⁻¹, x!, logs (log, ln, 10ˣ, eˣ), sin, cos, tan and their inverses, π and e, nCr and nPr, percentages, standard form (×10ˣ), absolute value, memory (M+, M−, MR, MC) and the previous answer (Ans). These cover the GCSE and most A-level maths and science content.</p>
<p><strong>Good to know:</strong> online calculators can't be used in exams. For GCSE you'll need a physical calculator approved by your exam board. This is ideal for homework, revision and checking your working.</p>
<h2>More maths tools</h2><ul><li><a href="/fraction-calculator/">Fraction calculator</a> with working shown</li><li><a href="/statistics-calculator/">Statistics calculator</a>: mean, median, mode, range, quartiles and standard deviation</li><li><a href="/hex-to-decimal-converter/">Hex, binary and decimal converter</a></li><li><a href="/percentage-calculator/">Percentage calculator</a></li></ul>""",
    [("Is this the same as a Casio scientific calculator?", "It works in a similar way to the scientific calculators used at GCSE, such as the Casio fx-83GTCW and fx-85GTCW, with SHIFT functions, S⇔D, nCr and a table of values. It's an independent tool and isn't made by or affiliated with Casio."),
     ("Can I type with my keyboard?", "Yes. Type numbers and symbols, use * for × and / for ÷, ^ for powers, and press Enter for the answer. You can also type words like sqrt, sin, log and pi."),
     ("How do I get a fraction answer?", "Fraction answers are shown automatically when the result is an exact fraction. Press S⇔D to switch between fraction, mixed number, surd and decimal."),
     ("Is it free?", "Yes. No sign-up and no adverts in the calculator. Your history is saved only in your own browser.")],
    ("scicalc.js",))

tool_page("hex-to-decimal-converter", "Hex to Decimal Converter – Binary, Octal & Decimal | etoolbox", "Hex, binary, octal &amp; decimal converter",
    "Convert between hexadecimal, decimal, binary and octal instantly. Type in any box and the others update. Includes two's complement, any base from 2 to 36 and a bitwise calculator (AND, OR, XOR, NOT, shifts).",
    """
  <div class="gen">
    <form class="panel" data-base novalidate autocomplete="off">
      <label for="dec">Decimal <span class="hint">(base 10)</span></label><input type="text" id="dec" name="dec" class="mono" placeholder="e.g. 255">
      <label for="hex">Hexadecimal <span class="hint">(base 16)</span></label><input type="text" id="hex" name="hex" class="mono" placeholder="e.g. FF">
      <label for="bin">Binary <span class="hint">(base 2)</span></label><input type="text" id="bin" name="bin" class="mono" placeholder="e.g. 11111111">
      <label for="oct">Octal <span class="hint">(base 8)</span></label><input type="text" id="oct" name="oct" class="mono" placeholder="e.g. 377">
      <div class="row"><div><label for="bits">Word size</label><select id="bits" name="bits"><option value="8">8-bit</option><option value="16">16-bit</option><option value="32" selected>32-bit</option><option value="64">64-bit</option></select></div>
      <div><label for="custom">Also show base</label><input type="number" id="custom" name="custom" min="2" max="36" value="36"></div></div>
      <p id="base-msg" class="warn" role="status"></p>
    </form>
    <div class="panel"><h3 style="margin:0 0 8px">Details</h3><div class="calc-out" id="base-extra"><p class="calc-empty">Type a number in any box.</p></div>
      <h3 style="margin:18px 0 8px">Bitwise calculator</h3>
      <form id="bw-form" novalidate autocomplete="off">
        <div class="row"><div><label for="bwbase">Numbers are in</label><select id="bwbase" name="bwbase"><option value="16">Hex</option><option value="10">Decimal</option><option value="2">Binary</option></select></div>
        <div><label for="op">Operation</label><select id="op" name="op"><option>AND</option><option>OR</option><option>XOR</option><option>NOT</option><option value="<<">Shift left (&lt;&lt;)</option><option value=">>">Shift right (&gt;&gt;)</option><option>+</option><option>-</option><option value="*">×</option></select></div></div>
        <div class="row"><div><label for="a">A</label><input type="text" id="a" name="a" class="mono"></div><div><label for="b">B</label><input type="text" id="b" name="b" class="mono"></div></div>
        <p id="bw-out" class="bw-out" aria-live="polite"></p>
      </form></div>
  </div>""",
    """<h2>How to convert hex to decimal</h2><p>Each hex digit is worth 16 times the one to its right. For <strong>2F</strong>: 2 × 16 + 15 = <strong>47</strong>. The letters A–F stand for 10–15.</p>
<h2>How to convert decimal to binary</h2><p>Keep dividing by 2 and write down the remainders from bottom to top. For 13: 13→6 r1, 6→3 r0, 3→1 r1, 1→0 r1, so 13 = <strong>1101</strong>.</p>
<h2>Handy for</h2><ul><li>Computer science GCSE and A-level homework</li><li>Colour codes (#FF6B35 = 255, 107, 53). Try our <a href="/colour-picker/">colour picker</a>.</li><li>Programming, networking (subnet masks) and electronics</li></ul>""",
    [("Can it handle very large numbers?", "Yes. It uses exact whole-number maths, so numbers of any length convert without rounding."),
     ("What is two's complement?", "It's how computers store negative numbers. Type a negative decimal (e.g. -5) and choose the word size to see its two's complement binary."),
     ("Can I use 0x or 0b prefixes?", "Yes. 0xFF, 0b1010 and 0o17 are accepted, and spaces or underscores between digits are ignored.")],
    ("scicalc.js",))

tool_page("fraction-calculator", "Fraction Calculator – Add, Subtract, Multiply & Divide Fractions | etoolbox", "Fraction calculator",
    "Add, subtract, multiply and divide fractions and mixed numbers, with the answer simplified and the working shown. Also gives the decimal and percentage.",
    """
  <div class="gen">
    <form class="panel" data-frac novalidate autocomplete="off">
      <label for="fexpr">Calculation</label>
      <input type="text" id="fexpr" name="fexpr" class="frac-input" value="1 1/2 + 3/4" placeholder="e.g. 2/3 × 3/8">
      <div class="chips" style="margin-top:10px"><button type="button" class="wm-chip" data-ins=" + ">+</button><button type="button" class="wm-chip" data-ins=" − ">−</button><button type="button" class="wm-chip" data-ins=" × ">×</button><button type="button" class="wm-chip" data-ins=" ÷ ">÷</button><button type="button" class="wm-chip" data-ins="/">/ (fraction)</button><button type="button" class="wm-chip" data-ins="(">(</button><button type="button" class="wm-chip" data-ins=")">)</button><button type="button" class="wm-chip" data-ins="^">power</button></div>
      <p class="hint" style="margin-top:12px">Write mixed numbers with a space, like <strong>2 1/3</strong>. Decimals like 0.25 work too.</p>
      <p id="fr-msg" class="warn" role="status"></p>
    </form>
    <div class="panel"><h3 style="margin:0 0 8px">Answer</h3><div class="calc-out" id="fr-out" aria-live="polite"></div></div>
  </div>""",
    """<h2>How to add fractions</h2><ol><li>Find a common denominator (the lowest common multiple of the bottoms).</li><li>Convert each fraction so they share that denominator.</li><li>Add the tops, keep the bottom, then simplify.</li></ol>
<p>Example: 1/2 + 1/3 = 3/6 + 2/6 = <strong>5/6</strong>.</p>
<h2>Multiplying and dividing fractions</h2><p>To multiply, multiply the tops and the bottoms. To divide, flip the second fraction and multiply ("keep, change, flip").</p>
<p>For anything more, use our <a href="/scientific-calculator/">scientific calculator</a>, which shows fraction answers too.</p>""",
    [("Does it simplify the answer?", "Yes. Answers are always given in lowest terms, plus as a mixed number when the fraction is top-heavy."),
     ("Can I do more than two fractions?", "Yes. Type a whole calculation like 1/2 + 1/3 − 1/4 × 2. Brackets and powers work too."),
     ("Is the answer exact?", "Yes. Fractions are calculated exactly, without rounding, however big the numbers get.")],
    ("scicalc.js",))

tool_page("statistics-calculator", "Statistics Calculator – Mean, Median, Mode, Range & SD | etoolbox", "Mean, median, mode &amp; range calculator",
    "Paste a list of numbers to get the mean, median, mode, range, quartiles, interquartile range, standard deviation and variance instantly. Handles frequency tables too.",
    """
  <div class="gen">
    <form class="panel" data-stats novalidate>
      <label for="data">Your numbers <span class="hint">(separated by commas, spaces or new lines)</span></label>
      <textarea id="data" name="data" rows="8" class="mono">4, 8, 15, 16, 23, 42, 8</textarea>
      <label class="check" style="margin-top:10px"><input type="checkbox" name="freq"> Frequency table: one <em>value, frequency</em> pair per line (e.g. <code>3, 5</code>)</label>
      <p id="st-msg" class="hint" role="status"></p>
    </form>
    <div class="panel"><h3 style="margin:0 0 8px">Results</h3><div class="calc-out" id="st-out" aria-live="polite"></div></div>
  </div>""",
    """<h2>What do they mean?</h2><ul>
<li><strong>Mean</strong>: add all the numbers and divide by how many there are.</li>
<li><strong>Median</strong>: the middle number when they're in order (the average of the middle two if there's an even count).</li>
<li><strong>Mode</strong>: the number that appears most often. There can be more than one, or none.</li>
<li><strong>Range</strong>: the largest number minus the smallest.</li>
<li><strong>Quartiles</strong>: the medians of the lower and upper halves. The interquartile range (Q3 − Q1) shows the spread of the middle half.</li>
<li><strong>Standard deviation</strong>: how spread out the numbers are. Use the <em>population</em> value (σ) for a whole group, and the <em>sample</em> value (s) for a sample of a bigger group.</li></ul>
<p>Quartile methods differ slightly between textbooks and calculators. This tool uses the common GCSE method of taking the median of each half.</p>""",
    [("Can I paste from Excel or Google Sheets?", "Yes. Copy a column and paste it in. Numbers on separate lines are read automatically, and £, $ and % signs are ignored."),
     ("What's the difference between sample and population standard deviation?", "Population divides by n and is used when you have every value. Sample divides by n − 1 and is used when your numbers are a sample of a larger group."),
     ("Is my data uploaded?", "No. Everything is calculated in your browser.")],
    ("scicalc.js",))

# ---------------- Video to MP3 ----------------
tool_page("video-to-mp3",
    "Video to MP3 Converter – Extract Audio from MP4, MOV, MKV Free, No Upload | etoolbox",
    "Video to MP3 converter",
    "Extract the audio from any video as an MP3, even 1–2 hour recordings. Works with MP4, MOV, MKV, WebM and more. It's free, there's no file size limit, and your video never leaves your device.",
    """
  <div class="gen">
    <form class="panel" data-v2m novalidate>
      <label class="drop" id="v2m-drop" for="v2m-input"><strong>Choose a video or drop it here</strong><span class="muted">MP4, MOV, MKV, WebM, AVI* or audio files · any length · never uploaded</span>
        <input type="file" id="v2m-input" accept="video/*,audio/*,.mkv,.mov,.m4a,.webm,.opus,.ogg,.wav" class="sr-only"></label>
      <p id="v2m-info" class="v2m-info"></p>
      <div class="row"><div><label for="bitrate">MP3 quality</label><select id="bitrate" name="bitrate">
        <option value="96">96 kbps · speech, smallest</option><option value="128" selected>128 kbps · recommended</option>
        <option value="192">192 kbps · high</option><option value="320">320 kbps · best for music</option></select></div>
      <div><label for="channels">Channels</label><select id="channels" name="channels"><option value="2">Stereo</option><option value="1">Mono · talks, half size</option></select></div></div>
      <details class="style-opts"><summary>Cut a section (optional)</summary>
        <div class="row" style="margin-top:10px"><div><label for="start">Start at</label><input type="text" id="start" name="start" placeholder="e.g. 0:30" inputmode="numeric"></div>
        <div><label for="end">End at</label><input type="text" id="end" name="end" placeholder="e.g. 1:02:45" inputmode="numeric"></div></div></details>
      <p id="v2m-est" class="hint"></p>
      <div class="v2m-actions"><button type="button" class="btn" id="v2m-go" disabled>Convert to MP3</button><button type="button" class="btn ghost" id="v2m-cancel" hidden>Cancel</button></div>
      <div class="v2m-bar" id="v2m-bar" hidden><i></i></div>
      <p id="v2m-msg" class="hint" role="status" aria-live="polite" style="margin-top:10px"></p>
    </form>
    <div class="panel"><h3 style="margin:0">Your MP3</h3>
      <p class="muted" style="margin:8px 0 0">Your audio will appear here, ready to play and download.</p>
      <div id="v2m-out" hidden><audio id="v2m-audio" controls preload="metadata" style="width:100%;margin-top:12px"></audio>
        <p id="v2m-res" class="hint"></p><a class="btn" id="v2m-dl" href="#">Download MP3</a></div></div>
  </div>""",
    """<h2>How to convert a video to MP3</h2><ol><li>Choose your video file, or drag it onto the box.</li><li>Pick a quality. 128 kbps is fine for most things; use 320 kbps for music.</li><li>Press <strong>Convert to MP3</strong>. When it's done, the MP3 downloads automatically.</li></ol>
<h2>Long videos are fine</h2><p>The video is read a piece at a time, so 60-minute or even 2-hour recordings work without filling up your computer's memory. On a typical laptop, an hour of video converts in a minute or two. Keep the tab open until it finishes.</p>
<h2>Good uses</h2><ul><li>Turn a recorded meeting, lecture or webinar into audio to listen to on the go.</li><li>Get the soundtrack from your own phone videos.</li><li>Make a podcast file from a video recording.</li><li>YouTube creators: download your own video from <em>YouTube Studio → Content → Download</em>, then convert it here.</li></ul>
<p class="note">Only convert videos you own or have permission to use. This tool doesn't download from YouTube or other websites: downloading other people's videos breaks YouTube's terms and can break copyright law.</p>
<p class="note">*AVI and some older formats depend on your browser. MP3 encoding uses <a href="https://lame.sourceforge.io/" rel="noopener">LAME</a> (LGPL) via <a href="https://mediabunny.dev/" rel="noopener">Mediabunny</a> (MPL-2.0).</p>""",
    [("Is my video uploaded?", "No. The conversion happens entirely in your browser, so your video never leaves your device."),
     ("Is there a size or length limit?", "No set limit. Because the file is read in pieces, multi-gigabyte, 1–2 hour videos work. Very long files just take a little longer."),
     ("Can I convert a YouTube link?", "No. Downloading other people's YouTube videos breaks YouTube's terms. If it's your own video, download it from YouTube Studio and convert the file here."),
     ("Which browsers work?", "The latest Chrome, Edge and Firefox on computers and Android. On iPhone and Mac, Safari 26 or newer."),
     ("How big will the MP3 be?", "At 128 kbps it's about 1 MB per minute, so a 60-minute video gives roughly a 58 MB MP3. Choose mono or 96 kbps for a smaller file.")],
    (), extra='<script type="importmap">{"imports":{"mediabunny":"/assets/vendor/mediabunny/mediabunny.min.mjs"}}</script>\n<script type="module" src="' + ver("video2mp3.js") + '"></script>\n')
