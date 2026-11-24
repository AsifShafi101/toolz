# ---------------- Batch 7: developer tools ----------------
_DEV = ("devtools2.js",)

tool_page("regex-tester",
    "Regex Tester – Test Regular Expressions Online (JavaScript) | etoolbox",
    "Regex tester",
    "Test regular expressions as you type: matches are highlighted, with capture groups, named groups and a replace preview. Includes ready-made patterns for emails, UK postcodes, UK mobile numbers and dates. Runs in your browser.",
    """
  <form class="panel" data-regex novalidate>
    <div class="row3"><div style="grid-column:span 2"><label for="rx-p">Pattern</label><div class="rx-pat"><span>/</span><input type="text" id="rx-p" name="pattern" class="mono" value="\\b[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}\\b" spellcheck="false" autocomplete="off"><span>/</span></div></div>
    <div><label for="rx-pre">Common patterns</label><select id="rx-pre" name="preset"><option value="">Choose…</option><option value="email">Email address</option><option value="postcode">UK postcode</option><option value="phone">UK mobile number</option><option value="ni">UK National Insurance number</option><option value="url">Web address (URL)</option><option value="date">Date (dd/mm/yyyy)</option></select></div></div>
    <div class="checks"><label><input type="checkbox" name="fg" checked> g · all matches</label><label><input type="checkbox" name="fi" checked> i · ignore case</label><label><input type="checkbox" name="fm"> m · multiline</label><label><input type="checkbox" name="fs"> s · dot matches new line</label><label><input type="checkbox" name="fu"> u · unicode</label><button type="button" class="btn secondary sm" id="rx-copy">Copy /pattern/flags</button></div>
    <label for="rx-t">Test text</label><textarea id="rx-t" name="text" rows="6" class="mono" spellcheck="false">Our offices: 10 Downing St, London SW1A 2AA and 1 Princes St, Edinburgh EH2 2EQ.
Send post to ec1a 1bb before Friday.</textarea>
    <p class="hint" id="rx-msg" role="status" aria-live="polite"></p>
    <div class="rx-out mono" id="rx-out" aria-label="Text with matches highlighted"></div>
    <ol class="rx-list" id="rx-list"></ol>
    <label class="check"><input type="checkbox" name="userep"> Replace matches</label>
    <div id="rx-repbox" hidden><label for="rx-rep">Replace with <span class="muted">($1, $2 or $&lt;name&gt; for groups)</span></label><input type="text" id="rx-rep" name="rep" class="mono" value="[$&amp;]"><label for="rx-result">Result</label><textarea id="rx-result" rows="4" class="mono" readonly></textarea></div>
  </form>""",
    """<h2>Quick regex cheat sheet</h2><table class="sal-table"><thead><tr><th>Pattern</th><th>Matches</th></tr></thead><tbody>
<tr><td><code>\\d</code> <code>\\w</code> <code>\\s</code></td><td>A digit, a word character (letter, digit or _), a space</td></tr><tr><td><code>.</code></td><td>Any character except a new line</td></tr>
<tr><td><code>[abc]</code> <code>[^abc]</code> <code>[a-z]</code></td><td>One of a, b or c; anything except them; a lowercase letter</td></tr><tr><td><code>*</code> <code>+</code> <code>?</code> <code>{2,4}</code></td><td>0 or more, 1 or more, optional, 2 to 4 times</td></tr>
<tr><td><code>^</code> <code>$</code> <code>\\b</code></td><td>Start of text (or line with m), end, a word boundary</td></tr><tr><td><code>(…)</code> <code>(?&lt;name&gt;…)</code> <code>(?:…)</code></td><td>A capture group, a named group, a group that doesn't capture</td></tr>
<tr><td><code>a|b</code></td><td>a or b</td></tr><tr><td><code>(?=…)</code> <code>(?!…)</code></td><td>Followed by, not followed by</td></tr></tbody></table>
<p>This tester uses JavaScript's regex engine, which is the same as in Node.js and every browser. Most simple patterns also work in Python, PHP and Java, but look-behind, named groups and flags vary slightly.</p>
<p>A pattern that takes more than 1.5 seconds is stopped automatically, so a runaway expression can't freeze your browser.</p>""",
    [("Why doesn't my pattern match across lines?", "By default . doesn't match a new line and ^ and $ match the start and end of the whole text. Turn on s to let . match new lines, and m to make ^ and $ work on each line."),
     ("How do I match a full stop or bracket?", "Put a backslash before it: \\. matches a full stop and \\( an opening bracket."),
     ("Is my text sent anywhere?", "No. Matching happens in your browser.")],
    _DEV)

tool_page("base64-encode-decode",
    "Base64 Encode & Decode – Text and Files Online | etoolbox",
    "Base64 encode & decode",
    "Encode text to Base64 or decode Base64 back to text, with full UTF-8 support and URL-safe Base64. Turn files and images into Base64 or data URIs, and save Base64 back as a file. Free, and nothing is uploaded.",
    """
  <form class="panel" data-b64 novalidate>
    <label for="b64-in">Text or Base64</label><textarea id="b64-in" name="inp" rows="5" class="mono" spellcheck="false">Hello from etoolbox — £5 off ✓</textarea>
    <div class="actions"><button type="button" class="btn" id="b64-enc">Encode ↓</button><button type="button" class="btn" id="b64-dec">Decode ↓</button><button type="button" class="btn secondary" id="b64-swap">⇅ Use result as input</button><label class="check"><input type="checkbox" name="urlsafe"> URL-safe (- and _, no =)</label></div>
    <p class="hint" id="b64-msg" role="status"></p>
    <label for="b64-out">Result</label><textarea id="b64-out" name="out" rows="5" class="mono" readonly></textarea>
    <div class="actions"><button type="button" class="btn secondary sm" id="b64-copy">Copy result</button></div>
    <h3>File to Base64</h3>
    <div class="actions"><label class="btn secondary" for="b64-file">Choose a file</label><input type="file" id="b64-file" class="sr-only"><label class="check"><input type="checkbox" name="datauri" checked> Include the data: prefix (for HTML and CSS)</label></div>
    <p class="hint" id="b64-fmsg"></p><textarea name="fout" rows="4" class="mono" readonly aria-label="File as Base64"></textarea>
    <div class="actions"><button type="button" class="btn secondary sm" id="b64-fcopy">Copy</button></div>
    <h3>Base64 to file</h3>
    <textarea name="fin" rows="3" class="mono" placeholder="Paste Base64 or a data: URI" aria-label="Base64 to turn into a file"></textarea>
    <div class="actions"><button type="button" class="btn secondary" id="b64-save">Save as file</button></div><p class="hint" id="b64-smsg"></p>
  </form>""",
    """<h2>What is Base64?</h2><p>Base64 turns any data, such as text, images or files, into plain letters, numbers, + and /. It's used to put images straight into HTML or CSS (data URIs), send attachments in email, and pass binary data through JSON and URLs. It is <strong>not encryption</strong>: anyone can decode it.</p>
<h2>Standard or URL-safe?</h2><p>Standard Base64 uses + and / and pads with =. URL-safe Base64 (used in JWTs and web links) swaps them for - and _ and drops the padding. The decoder here accepts both.</p>
<p>Decoding a JWT? Use the <a href="/jwt-decoder/">JWT decoder</a>. Need to encode a link? Use <a href="/url-encode-decode/">URL encode &amp; decode</a>.</p>""",
    [("Why is Base64 bigger than the original?", "Every 3 bytes become 4 characters, so Base64 is about a third larger."),
     ("Does it handle emoji and accents?", "Yes. Text is encoded as UTF-8 first, so £, é and emoji survive the round trip."),
     ("Are my files uploaded?", "No. Encoding and decoding happen in your browser.")],
    _DEV)

tool_page("url-encode-decode",
    "URL Encode & Decode Online – Percent-Encoding Tool | etoolbox",
    "URL encode & decode",
    "Percent-encode text for use in URLs and query strings, or decode %20-style URLs back to readable text. Paste a full URL to see its parts and every query parameter decoded. Free and private.",
    """
  <form class="panel" data-urlenc novalidate>
    <label for="ue-in">Text or URL</label><textarea id="ue-in" name="inp" rows="4" class="mono" spellcheck="false">https://example.co.uk/search?q=fish &amp; chips&amp;town=Bury St Edmunds</textarea>
    <label for="ue-mode">Mode</label><select id="ue-mode" name="mode"><option value="component">Component · for one query value (encodes / ? &amp; =)</option><option value="full">Whole URL · keeps / ? &amp; = and :</option><option value="form">Form data · spaces as +</option></select>
    <div class="actions"><button type="button" class="btn" id="ue-enc">Encode ↓</button><button type="button" class="btn" id="ue-dec">Decode ↓</button></div>
    <p class="hint" id="ue-msg" role="status"></p>
    <label for="ue-out">Result</label><textarea id="ue-out" name="out" rows="4" class="mono" readonly></textarea>
    <div class="actions"><button type="button" class="btn secondary sm" id="ue-copy">Copy result</button></div>
    <div id="ue-parts" hidden></div>
  </form>""",
    """<h2>Which mode should I use?</h2><ul><li><strong>Component</strong> for a single value you're putting into a link, such as a search term or a redirect URL. It encodes everything except letters, digits and - _ . ! ~ * ' ( ).</li><li><strong>Whole URL</strong> to tidy a full address with spaces or accents in it, without breaking its slashes and ?.</li><li><strong>Form data</strong> for application/x-www-form-urlencoded bodies, where spaces become +.</li></ul>
<h2>Common codes</h2><table class="sal-table"><tbody><tr><td><code>%20</code></td><td>space</td><td><code>%26</code></td><td>&amp;</td></tr><tr><td><code>%2F</code></td><td>/</td><td><code>%3F</code></td><td>?</td></tr><tr><td><code>%3D</code></td><td>=</td><td><code>%23</code></td><td>#</td></tr><tr><td><code>%C2%A3</code></td><td>£</td><td><code>%40</code></td><td>@</td></tr></tbody></table>
<p>Working with tokens? The <a href="/jwt-decoder/">JWT decoder</a> and <a href="/base64-encode-decode/">Base64 tool</a> can help.</p>""",
    [("Why does a space become %20 or +?", "In paths and most of a URL a space is %20. In form data and some query strings it's written as +. Both decode to a space."),
     ("Is my text sent anywhere?", "No. Everything runs in your browser.")],
    _DEV)

tool_page("uuid-generator",
    "UUID Generator – Random v4 and Time-Ordered v7 GUIDs | etoolbox",
    "UUID / GUID generator",
    "Generate random version 4 UUIDs or time-ordered version 7 UUIDs, one or a thousand at a time, in upper or lower case, with or without hyphens or braces. Check any UUID to see its version and when a v1 or v7 was made. Uses your browser's secure random generator.",
    """
  <form class="panel" data-uuid novalidate>
    <div class="row3"><div><label for="uu-ver">Version</label><select id="uu-ver" name="ver"><option value="4">v4 · random</option><option value="7">v7 · time-ordered (good for databases)</option></select></div>
    <div><label for="uu-n">How many</label><input type="number" id="uu-n" name="count" min="1" max="1000" value="5"></div></div>
    <div class="checks"><label><input type="checkbox" name="hyph" checked> Hyphens</label><label><input type="checkbox" name="upper"> Upper case</label><label><input type="checkbox" name="braces"> {Braces} (GUID style)</label></div>
    <textarea name="out" rows="7" class="mono" readonly aria-label="Generated UUIDs"></textarea>
    <div class="actions"><button type="button" class="btn" id="uu-gen">Generate new</button><button type="button" class="btn secondary" id="uu-copy">Copy all</button><button type="button" class="btn secondary" id="uu-dl">Download .txt</button></div>
    <label for="uu-check">Check a UUID</label><input type="text" id="uu-check" name="check" class="mono" placeholder="Paste a UUID" autocomplete="off"><p class="hint" id="uu-info" role="status"></p>
  </form>""",
    """<h2>v4 or v7?</h2><p><strong>Version 4</strong> UUIDs are 122 random bits: the chance of two ever clashing is negligible. <strong>Version 7</strong> (RFC 9562, 2024) starts with the time in milliseconds, so new IDs sort in order of creation. That keeps database indexes compact and fast, which is why many teams now use v7 for primary keys.</p>
<p>A UUID and a GUID are the same thing: GUID is Microsoft's name, often written in upper case inside braces.</p>
<p>Need random passwords instead? Use the <a href="/password-generator/">password generator</a>.</p>""",
    [("Are these UUIDs secure?", "They come from crypto.getRandomValues, your browser's cryptographically secure generator. Don't use UUIDs as passwords or secret tokens, though; use a proper token generator."),
     ("Will a UUID ever repeat?", "For v4, you'd need to make billions per second for many years to have a realistic chance of a duplicate."),
     ("Are they stored anywhere?", "No. They're made in your browser and never sent to us.")],
    _DEV)

tool_page("hash-generator",
    "Hash Generator – MD5, SHA-1, SHA-256, SHA-512 for Text & Files | etoolbox",
    "Hash generator (MD5, SHA-256…)",
    "Make MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or any file, and check a download against its published checksum. Add a secret key for HMAC. Files up to 500 MB are hashed in your browser and never uploaded.",
    """
  <form class="panel" data-hash novalidate>
    <label for="hs-t">Text</label><textarea id="hs-t" name="text" rows="3" class="mono" spellcheck="false">hello</textarea>
    <div class="actions"><label class="btn secondary" for="hs-file">Or choose a file</label><input type="file" id="hs-file" class="sr-only"><label class="check"><input type="checkbox" name="upper"> Upper case</label></div>
    <div class="row3"><div><label for="hs-key">Secret key for HMAC <span class="muted">(optional)</span></label><input type="text" id="hs-key" name="key" class="mono" autocomplete="off"></div>
    <div style="grid-column:span 2"><label for="hs-cmp">Compare with a checksum <span class="muted">(optional)</span></label><input type="text" id="hs-cmp" name="cmp" class="mono" placeholder="Paste the published SHA-256 or MD5" autocomplete="off"></div></div>
    <p class="hint" id="hs-cmp-msg"><span id="hs-cmp"></span></p>
    <div id="hs-out" class="hs-out" aria-live="polite"></div>
  </form>""",
    """<h2>How to check a download</h2><ol><li>Find the checksum on the download page, usually labelled SHA-256.</li><li>Choose the downloaded file above and paste the checksum into <strong>Compare</strong>.</li><li>A ✓ means the file is exactly what the publisher released. Anything else means it's damaged or different.</li></ol>
<h2>Which hash should I use?</h2><ul><li><strong>SHA-256</strong> is the standard choice for checksums and signatures.</li><li><strong>MD5</strong> and <strong>SHA-1</strong> are fine for spotting accidental damage but are broken for security: people can create two files with the same hash.</li><li>Never store passwords with plain hashes. Use a slow password hash such as bcrypt or Argon2.</li></ul>""",
    [("Can a hash be reversed?", "No. A hash is one-way, but short or common inputs can be guessed by trying candidates, which is why plain hashes are unsafe for passwords."),
     ("Why does a single space change the hash completely?", "That's by design: any change to the input gives a completely different hash."),
     ("Is my file uploaded?", "No. Hashing happens in your browser.")],
    _DEV)

tool_page("unix-timestamp-converter",
    "Unix Timestamp Converter – Epoch to Date and UK Time | etoolbox",
    "Unix timestamp converter",
    "Convert Unix epoch timestamps to readable dates in UTC, UK time and your own time zone, and turn a date and time back into a timestamp. Seconds, milliseconds and microseconds are detected automatically, with British Summer Time handled for you.",
    """
  <form class="panel" data-unixts novalidate>
    <p class="ts-now">Current Unix time: <strong id="ts-now" class="mono"></strong> <button type="button" class="btn secondary sm" id="ts-copy">Copy</button></p>
    <label for="ts-in">Timestamp</label><div class="rd-q"><input type="text" id="ts-in" name="ts" class="mono" inputmode="numeric" autocomplete="off"><button type="button" class="btn secondary" id="ts-use">Now</button></div>
    <div id="ts-out"></div>
    <h3>Date and time to timestamp</h3>
    <div class="row3"><div><label for="ts-dt">Date and time</label><input type="datetime-local" id="ts-dt" name="dt" step="1"></div><div><label for="ts-tz">Time zone</label><select id="ts-tz" name="tz"><option value="Europe/London">UK time (GMT/BST)</option><option value="UTC">UTC</option><option value="local">My time zone</option></select></div></div>
    <div id="ts-back"></div>
  </form>""",
    """<h2>What is a Unix timestamp?</h2><p>It's the number of seconds since midnight UTC on 1 January 1970 (the "epoch"), ignoring leap seconds. Databases, APIs and log files use it because it's one number with no time zone. JavaScript and many APIs use milliseconds instead, which is a 13-digit number today.</p>
<h2>UK time and BST</h2><p>UK time is GMT (UTC+0) in winter and BST (UTC+1) from the last Sunday in March to the last Sunday in October. A timestamp is the same everywhere; only the way it's displayed changes. This tool applies the right offset for each date.</p>
<p>Working with dates rather than timestamps? Try <a href="/days-between-dates/">days between dates</a> or the <a href="/meeting-time-finder/">meeting time finder</a>.</p>""",
    [("What is the 2038 problem?", "Systems that store timestamps as 32-bit signed numbers run out at 03:14:07 UTC on 19 January 2038. Modern systems use 64-bit numbers, which last billions of years."),
     ("How do I tell seconds from milliseconds?", "Today's timestamps are 10 digits in seconds and 13 digits in milliseconds. The converter detects which one you've entered.")],
    _DEV)

tool_page("csv-to-json",
    "CSV to JSON Converter (and JSON to CSV) – Free Online | etoolbox",
    "CSV ↔ JSON converter",
    "Convert CSV to JSON or JSON to CSV in your browser. Handles quoted fields, commas inside values, semicolon and tab-separated files, numbers and true/false, and nested JSON (flattened to columns like address.city). Open a file or paste data; nothing is uploaded.",
    """
  <form class="panel" data-csvjson novalidate>
    <div class="actions"><label class="btn secondary" for="cj-file">Open a CSV or JSON file</label><input type="file" id="cj-file" accept=".csv,.tsv,.txt,.json,text/csv,application/json" class="sr-only"></div>
    <label for="cj-in">Input</label><textarea id="cj-in" name="inp" rows="7" class="mono" spellcheck="false">name,town,age,member
"Smith, Jane",Leeds,34,true
Ahmed Khan,Derby,29,false</textarea>
    <div class="row3"><div><label for="cj-d">Separator</label><select id="cj-d" name="delim"><option value="auto">Detect automatically</option><option value="comma">Comma ,</option><option value="semi">Semicolon ;</option><option value="tab">Tab</option><option value="pipe">Pipe |</option></select></div></div>
    <div class="checks"><label><input type="checkbox" name="header" checked> First row is headings</label><label><input type="checkbox" name="types" checked> Convert numbers and true/false</label><label><input type="checkbox" name="min"> Minify JSON</label></div>
    <div class="actions"><button type="button" class="btn" id="cj-tojson">CSV → JSON</button><button type="button" class="btn" id="cj-tocsv">JSON → CSV</button><button type="button" class="btn secondary" id="cj-swap">⇅ Use result as input</button></div>
    <p class="hint" id="cj-msg" role="status"></p>
    <label for="cj-out">Result</label><textarea id="cj-out" name="out" rows="9" class="mono" readonly></textarea>
    <div class="actions"><button type="button" class="btn secondary" id="cj-copy">Copy</button><button type="button" class="btn secondary" id="cj-dl">Download</button></div>
  </form>""",
    """<h2>Tips</h2><ul><li>Spreadsheets saved in the UK usually use commas; many European ones use semicolons. Leave the separator on <strong>Detect</strong>.</li><li>Values with commas, quotes or line breaks must be in double quotes in CSV, which this converter handles both ways.</li><li>Turn off <strong>Convert numbers</strong> to keep phone numbers and codes like 007 exactly as written.</li></ul>
<p>Need to check or tidy the JSON? Use the <a href="/json-formatter/">JSON formatter</a>.</p>""",
    [("Can I open the CSV in Excel?", "Yes. Download the CSV and open it in Excel, Google Sheets or Numbers."),
     ("How are nested objects handled?", "When converting JSON to CSV, nested objects become columns with dotted names, such as address.city. Arrays are kept as JSON text in one cell."),
     ("Is my data uploaded?", "No. Conversion happens in your browser.")],
    _DEV)

tool_page("sql-formatter",
    "SQL Formatter – Beautify and Minify SQL Queries Online | etoolbox",
    "SQL formatter",
    "Format messy SQL into clean, readable queries with each clause on its own line, columns and conditions indented and keywords in capitals. Or minify a query to one line. Works with MySQL, PostgreSQL, SQL Server, SQLite and BigQuery; runs in your browser.",
    """
  <form class="panel" data-sqlfmt novalidate>
    <label for="sq-in">SQL</label><textarea id="sq-in" name="inp" rows="7" class="mono" spellcheck="false">select o.id, c.name, sum(i.qty*i.price) as total from orders o join customers c on c.id=o.customer_id left join items i on i.order_id=o.id where o.created_at >= '2026-01-01' and (c.country='UK' or c.vip=true) group by o.id, c.name having sum(i.qty*i.price)>100 order by total desc limit 20;</textarea>
    <div class="row3"><div><label for="sq-mode">Style</label><select id="sq-mode" name="mode"><option value="fmt">Format (beautify)</option><option value="min">Minify to one line</option></select></div>
    <div><label for="sq-ind">Indent</label><select id="sq-ind" name="indent"><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option></select></div>
    <div><label class="check" style="margin-top:30px"><input type="checkbox" name="upper" checked> Keywords in CAPITALS</label></div></div>
    <div class="actions"><button type="button" class="btn" id="sq-run">Format SQL</button></div>
    <label for="sq-out">Result</label><textarea id="sq-out" name="out" rows="14" class="mono" readonly></textarea>
    <div class="actions"><button type="button" class="btn secondary" id="sq-copy">Copy</button></div>
  </form>""",
    """<h2>What the formatter does</h2><ul><li>Starts each clause (SELECT, FROM, JOIN, WHERE, GROUP BY, ORDER BY…) on a new line.</li><li>Puts each selected column and each AND / OR condition on its own indented line.</li><li>Indents subqueries and leaves strings, quoted names and comments exactly as they were.</li></ul>
<p>The formatter only changes spacing and keyword case, so your query does exactly the same thing. It doesn't check that the SQL is valid; run it in your database to find errors.</p>""",
    [("Is my SQL sent to a server?", "No. Formatting happens in your browser, so it's safe for queries that mention internal tables."),
     ("Does it change my data or table names?", "No. Only SQL keywords change case; names, strings and numbers are left alone.")],
    _DEV)

tool_page("cron-expression-generator",
    "Cron Expression Generator & Explainer – Crontab in Plain English | etoolbox",
    "Cron expression generator",
    "Build a cron schedule or paste one to see what it means in plain English, with the next five run times. Supports ranges, lists, steps like */15, month and day names, and shortcuts such as @daily. Free.",
    """
  <form class="panel" data-cron novalidate>
    <label for="cr-e">Cron expression</label><div class="rd-q"><input type="text" id="cr-e" name="expr" class="mono cr-expr" value="30 9 * * 1-5" spellcheck="false" autocomplete="off"><button type="button" class="btn secondary" id="cr-copy">Copy</button></div>
    <div class="cr-fields"><label>Minute<input type="text" name="cmin" class="mono"></label><label>Hour<input type="text" name="chour" class="mono"></label><label>Day of month<input type="text" name="cdom" class="mono"></label><label>Month<input type="text" name="cmon" class="mono"></label><label>Day of week<input type="text" name="cdow" class="mono"></label></div>
    <div id="cr-out" class="cr-out" aria-live="polite"></div>
    <h3>Next runs <span class="muted">(your time zone)</span></h3><ol id="cr-next" class="cr-next"></ol>
    <p class="hint">Examples: <button type="button" class="chip" data-cx="*/15 * * * *">Every 15 minutes</button> <button type="button" class="chip" data-cx="0 * * * *">Hourly</button> <button type="button" class="chip" data-cx="0 2 * * *">Daily at 2am</button> <button type="button" class="chip" data-cx="0 9 * * 1">Mondays 9am</button> <button type="button" class="chip" data-cx="0 0 1 * *">1st of the month</button> <button type="button" class="chip" data-cx="0 18 * * 5">Fridays 6pm</button></p>
  </form>""",
    """<h2>Cron syntax</h2><table class="sal-table"><thead><tr><th>Field</th><th>Values</th><th>Example</th></tr></thead><tbody>
<tr><td>Minute</td><td>0–59</td><td><code>*/10</code> every 10 minutes</td></tr><tr><td>Hour</td><td>0–23</td><td><code>9-17</code> 9am to 5pm</td></tr><tr><td>Day of month</td><td>1–31</td><td><code>1,15</code> the 1st and 15th</td></tr>
<tr><td>Month</td><td>1–12 or JAN–DEC</td><td><code>*/3</code> every quarter</td></tr><tr><td>Day of week</td><td>0–6 or SUN–SAT (7 is also Sunday)</td><td><code>MON-FRI</code> weekdays</td></tr></tbody></table>
<p>When both day of month and day of week are set, standard cron runs on days matching <em>either</em> one. Cron runs in the server's time zone, which is often UTC, so a job set for 09:00 may run at 10:00 UK time in summer.</p>""",
    [("What does */5 mean?", "Every 5th value: in the minute field, at minutes 0, 5, 10 and so on."),
     ("Does this support seconds or years?", "No. This uses the standard 5-field cron found in Linux crontab, GitHub Actions, Kubernetes and most hosting panels. Quartz and AWS use 6 or 7 fields.")],
    _DEV)

tool_page("css-gradient-generator",
    "CSS Gradient Generator – Linear, Radial & Conic | etoolbox",
    "CSS gradient generator",
    "Design linear, radial and conic CSS gradients with up to 8 colours, see a live preview, and copy the CSS with a solid-colour fallback. Start from presets or a random gradient, and download it as a PNG background image.",
    """
  <form class="panel" data-gradient novalidate>
    <div class="gr-preview" id="gr-preview" role="img" aria-label="Gradient preview"></div>
    <div class="gr-presets" id="gr-presets"></div>
    <div class="row3"><div><label for="gr-type">Type</label><select id="gr-type" name="type"><option value="linear">Linear</option><option value="radial">Radial</option><option value="conic">Conic</option></select></div>
    <div id="gr-angbox"><label for="gr-angle">Angle <span id="gr-ang" class="muted"></span></label><input type="range" id="gr-angle" name="angle" min="0" max="360" value="135"></div>
    <div id="gr-shapebox" hidden><label for="gr-shape">Shape</label><select id="gr-shape" name="shape"><option value="circle">Circle</option><option value="ellipse">Ellipse</option></select></div>
    <div id="gr-posbox" hidden><label for="gr-pos">Centre</label><select id="gr-pos" name="pos"><option value="center">Centre</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option><option value="top left">Top left</option><option value="bottom right">Bottom right</option></select></div></div>
    <label>Colours</label><div id="gr-stops" class="gr-stops"></div>
    <div class="actions"><button type="button" class="btn secondary sm" id="gr-add">+ Add colour</button><button type="button" class="btn secondary sm" id="gr-rand">🎲 Random</button></div>
    <label for="gr-css">CSS</label><textarea id="gr-css" name="css" rows="3" class="mono" readonly></textarea>
    <div class="actions"><button type="button" class="btn" id="gr-copy">Copy CSS</button><input type="number" name="w" value="1920" min="16" max="8000" aria-label="PNG width" class="gr-dim"> × <input type="number" name="h" value="1080" min="16" max="8000" aria-label="PNG height" class="gr-dim"><button type="button" class="btn secondary" id="gr-png">Download PNG</button></div>
  </form>""",
    """<h2>How to use the CSS</h2><p>Paste the two lines into any CSS rule, for example on <code>body</code> or a hero section. The first line is a solid colour for very old browsers; every current browser uses the gradient on the second line.</p>
<h2>Tips for good gradients</h2><ul><li>Colours next to each other on the colour wheel blend smoothly; opposite colours can look muddy in the middle. Add a third colour stop to fix it.</li><li>Keep text readable: check contrast with the <a href="/colour-picker/">colour picker</a>.</li><li>Want colours from a photo or logo? Use <a href="/colour-palette-from-image/">colour palette from image</a>.</li></ul>""",
    [("Do CSS gradients work in all browsers?", "Linear and radial gradients work in every current browser. Conic gradients work in all modern browsers since 2020."),
     ("Can I use the gradient in Canva or PowerPoint?", "Yes. Download it as a PNG at the size you need and use it as a background image.")],
    _DEV)
