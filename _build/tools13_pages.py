# ---------------- Batch 4: degree classification, final grade, Harvard referencing, text tools ----------------
tool_page("degree-classification-calculator",
    "Degree Classification Calculator UK – Will I Get a First or a 2:1? | etoolbox",
    "Degree classification calculator",
    "Work out your UK degree classification from your year marks or module marks, using your university's weighting (such as 40/60 or 1:2). See whether you're on track for a First, 2:1, 2:2 or Third, and exactly what you need in your final year.",
    """
  <div class="gen"><form class="panel" data-degree novalidate>
    <label for="dg-scheme">How your university weights each year</label>
    <select id="dg-scheme" name="scheme"><option value="0,40,60">Year 2: 40% · Final year: 60%</option><option value="0,33.3,66.7">Year 2: 1/3 · Final year: 2/3 (1:2)</option><option value="0,30,70">Year 2: 30% · Final year: 70%</option><option value="0,25,75">Year 2: 25% · Final year: 75%</option><option value="0,50,50">Year 2 and final year equally</option><option value="0,0,100">Final year only</option><option value="10,30,60">Year 1: 10% · Year 2: 30% · Final year: 60%</option><option value="0,20,30,50">4 years with placement or Scottish honours (20/30/50)</option></select>
    <p class="hint">Not sure? Check your course handbook. You can also type your own weights below.</p>
    <div id="dg-years"></div>
  </form><div class="panel" id="dg-out" aria-live="polite"></div></div>""",
    """<h2>UK degree classification boundaries</h2><table class="sal-table"><thead><tr><th>Classification</th><th>Weighted average</th></tr></thead><tbody><tr><td>First-class honours (1st)</td><td>70% and above</td></tr><tr><td>Upper second-class (2:1)</td><td>60–69%</td></tr><tr><td>Lower second-class (2:2)</td><td>50–59%</td></tr><tr><td>Third-class (3rd)</td><td>40–49%</td></tr></tbody></table>
<h2>How the calculation works</h2><p>Each year's average is the credit-weighted average of your module marks (a 40-credit dissertation counts twice as much as a 20-credit module). Your degree average is then the weighted average of the years that count, usually Year 2 and the final year. Most English universities don't count Year 1.</p>
<p>Universities differ. Some discount your lowest module, some use the better of two methods, and many apply a <strong>borderline</strong> rule: if you're within 1–2% of the next class, they may look at how many of your final-year credits are in the higher class. This calculator flags borderline marks, but your university's regulations always decide.</p>""",
    [("Is 69.5% a First?", "Many universities round 69.5% up to 70%, and some treat 68–69.9% as borderline. Check your university's rules on rounding and borderlines."),
     ("What do I need in my final year for a 2:1?", "Enter your Year 2 average and leave the final year blank. The calculator shows the average you need for each classification."),
     ("Does first year count?", "At most English universities, Year 1 only needs to be passed. Some, and many Scottish 4-year degrees, weight earlier years. Choose the scheme that matches your course.")],
    ("study.js",))

tool_page("final-grade-calculator",
    "Final Grade Calculator – What Do I Need on My Exam? | etoolbox",
    "Final grade calculator",
    "Find out what you need to score on your final exam to get the overall grade you want. Enter your current grade and how much the final is worth to see the mark you need, plus a table for every grade.",
    """
  <div class="gen"><form class="panel" data-final novalidate>
    <label for="fg-cur">Your current grade (%)</label><input type="number" id="fg-cur" name="current" min="0" max="100" step="0.1" value="65">
    <label for="fg-w">How much the final exam is worth (%)</label><input type="number" id="fg-w" name="weight" min="1" max="100" step="0.1" value="40">
    <label for="fg-t">The overall grade you want (%)</label><input type="number" id="fg-t" name="target" min="0" max="100" step="0.1" value="70">
  </form><div class="panel" id="fg-out" aria-live="polite"></div></div>""",
    """<h2>The formula</h2><p>Needed on the final = (target − current × (1 − final weight)) ÷ final weight. For example, with 65% so far and a final worth 40%, getting 70% overall needs (70 − 65 × 0.6) ÷ 0.4 = <strong>77.5%</strong> on the final.</p>
<p>Studying for a UK degree? Try the <a href="/degree-classification-calculator/">degree classification calculator</a> to see what you need for a First or 2:1.</p>""",
    [("What if I need more than 100%?", "Then the target can't be reached on the final alone. The calculator shows the best grade you can still achieve."),
     ("My course has several assessments left. What should I do?", "Add up the weight of everything left as the “final”, and use your current average for everything already marked.")],
    ("study.js",))

tool_page("harvard-referencing-generator",
    "Harvard Referencing Generator – Free Cite Them Right Citations | etoolbox",
    "Harvard referencing generator",
    "Create Harvard references for books, journal articles and websites in the Cite Them Right style used by most UK universities. Get the in-text citation too, build a reference list sorted A–Z, and copy it with italics into Word or Google Docs.",
    """
  <div class="gen"><form class="panel" data-harvard novalidate>
    <label for="hv-type">Source type</label><select id="hv-type" name="type"><option value="book">Book</option><option value="journal">Journal article</option><option value="website">Web page</option></select>
    <label for="hv-auth">Author(s) <span class="muted">(one per line, e.g. Jane A. Smith)</span></label><textarea id="hv-auth" name="authors" rows="3" placeholder="Jane A. Smith&#10;Peter Jones"></textarea>
    <label class="check"><input type="checkbox" name="org"> The author is an organisation (e.g. NHS, BBC)</label>
    <div class="row"><div><label for="hv-year">Year</label><input type="text" id="hv-year" name="year" placeholder="2024" maxlength="12"></div><div data-for="book"><label for="hv-ed">Edition</label><input type="number" id="hv-ed" name="edition" min="1" max="50" placeholder="1"></div></div>
    <label for="hv-title"><span data-for="book">Book title</span><span data-for="journal" hidden>Article title</span><span data-for="website" hidden>Page title</span></label><input type="text" id="hv-title" name="title">
    <div data-for="book"><div class="row"><div><label for="hv-place">Place of publication</label><input type="text" id="hv-place" name="place" placeholder="London"></div><div><label for="hv-pub">Publisher</label><input type="text" id="hv-pub" name="publisher" placeholder="Penguin"></div></div></div>
    <div data-for="journal" hidden><label for="hv-jn">Journal name</label><input type="text" id="hv-jn" name="journal"><div class="row3"><div><label for="hv-vol">Volume</label><input type="text" id="hv-vol" name="volume"></div><div><label for="hv-iss">Issue</label><input type="text" id="hv-iss" name="issue"></div><div><label for="hv-pp">Pages</label><input type="text" id="hv-pp" name="pages" placeholder="12-30"></div></div>
      <label for="hv-doi">DOI <span class="muted">(if it has one)</span></label><input type="text" id="hv-doi" name="doi" placeholder="10.1000/xyz123"></div>
    <div data-for="website" hidden><label for="hv-site">Website name <span class="muted">(used if there's no author)</span></label><input type="text" id="hv-site" name="site" placeholder="BBC News"></div>
    <div data-for="journal website" hidden><label for="hv-url">URL</label><input type="url" id="hv-url" name="url" placeholder="https://"><label for="hv-acc">Date accessed</label><input type="date" id="hv-acc" name="accessed"></div>
  </form>
  <div class="panel"><h3 class="lb-h" style="margin-top:0">Your reference</h3><div id="hv-out" aria-live="polite"></div>
    <div class="actions"><button type="button" class="btn" id="hv-add">Add to reference list</button><button type="button" class="btn secondary" id="hv-copy">Copy reference</button></div>
    <h3 class="lb-h">Reference list</h3><ol class="hv-list" id="hv-list"></ol>
    <div class="actions"><button type="button" class="btn secondary" id="hv-copyall">Copy reference list</button><button type="button" class="btn ghost" id="hv-clear">Clear list</button></div>
    <p class="hint">Your list is saved in this browser only.</p></div></div>""",
    """<h2>Harvard referencing examples (Cite Them Right)</h2><ul><li><strong>Book:</strong> Smith, J. and Jones, P. (2020) <i>Understanding research</i>. 2nd edn. London: Sage.</li><li><strong>Journal article:</strong> Patel, R. (2023) 'Remote work and wellbeing', <i>Journal of Occupational Psychology</i>, 96(2), pp. 145–167. Available at: https://doi.org/10.1111/joop.12345.</li>
<li><strong>Web page:</strong> NHS (2024) <i>Healthy weight</i>. Available at: https://www.nhs.uk/live-well/healthy-weight/ (Accessed: 14 November 2026).</li></ul>
<h2>In-text citations</h2><p>Put the author's surname and the year in brackets: (Smith, 2020). Use “and” for two or three authors, (Smith and Jones, 2020), and “et al.” for four or more, (Smith et al., 2020). Add a page number for direct quotes: (Smith, 2020, p. 45).</p>
<p>Harvard is a family of styles, and universities tweak the details. This generator follows <strong>Cite Them Right</strong>, the most common version at UK universities. Always check your module handbook.</p>""",
    [("Are the references formatted with italics?", "Yes. “Copy reference” copies the reference with italics, ready to paste into Word or Google Docs."),
     ("How do I reference a source with no date?", "Leave the year empty and the generator uses “(no date)”, as Cite Them Right recommends."),
     ("Is my reference list saved?", "Yes, in your browser on this device, so it's still there when you come back. Nothing is uploaded.")],
    ("study.js",))

tool_page("lorem-ipsum-generator",
    "Lorem Ipsum Generator – Placeholder Text for Designs | etoolbox",
    "Lorem ipsum generator",
    "Generate lorem ipsum placeholder text by paragraphs, sentences or words, with or without HTML paragraph tags, ready to paste into designs, mockups and website templates.",
    """
  <form class="panel" data-lorem novalidate>
    <div class="row3"><div><label for="lo-n">How many</label><input type="number" id="lo-n" name="count" min="1" max="5000" value="3"></div><div><label for="lo-k">of</label><select id="lo-k" name="kind"><option value="paragraphs">paragraphs</option><option value="sentences">sentences</option><option value="words">words</option></select></div><div></div></div>
    <label class="check"><input type="checkbox" name="start" checked> Start with "Lorem ipsum dolor sit amet…"</label>
    <label class="check"><input type="checkbox" name="html"> Wrap paragraphs in &lt;p&gt; tags</label>
    <textarea id="lo-out" rows="12" readonly aria-label="Generated text"></textarea>
    <div class="actions"><button type="button" class="btn" id="lo-gen">Generate new text</button><button type="button" class="btn secondary" id="lo-copy">Copy text</button></div>
  </form>""",
    """<h2>What is lorem ipsum?</h2><p>Lorem ipsum is scrambled Latin used as placeholder text since the 1500s. It comes from Cicero's <i>De finibus bonorum et malorum</i>, written in 45 BC. Because it looks like readable text without meaning anything, it lets people judge a layout's fonts and spacing without being distracted by the words.</p>""",
    [("Can I get the text as HTML?", "Yes. Tick “Wrap paragraphs in <p> tags” to get HTML you can paste straight into a template."),
     ("Is it always the same text?", "The opening line is the classic “Lorem ipsum dolor sit amet”, and the rest is shuffled each time you generate.")],
    ("texttools.js",))

tool_page("find-and-replace-text",
    "Find and Replace Text Online – With Regex Support | etoolbox",
    "Find and replace text",
    "Find and replace words or phrases in any text, with options for case-sensitive and whole-word matching, or powerful regular expressions. See every match highlighted before you replace.",
    """
  <form class="panel" data-findrep novalidate>
    <label for="fr-text">Your text</label><textarea id="fr-text" name="text" rows="10">The quick brown fox jumps over the lazy dog. The dog sleeps.</textarea>
    <div class="row"><div><label for="fr-find">Find</label><input type="text" id="fr-find" name="find" value="dog"></div><div><label for="fr-rep">Replace with</label><input type="text" id="fr-rep" name="rep" value="cat"></div></div>
    <div class="fr-opts"><label class="check"><input type="checkbox" name="cs"> Match case</label><label class="check"><input type="checkbox" name="word"> Whole words only</label><label class="check"><input type="checkbox" name="regex"> Regular expression</label></div>
    <p class="hint" id="fr-msg" role="status"></p>
    <div class="fr-prev" id="fr-prev" aria-label="Matches highlighted"></div>
    <div class="actions"><button type="button" class="btn" id="fr-go">Replace all</button><button type="button" class="btn secondary" id="fr-copy">Copy text</button></div>
  </form>""",
    """<h2>Using regular expressions</h2><p>Tick <strong>Regular expression</strong> for pattern matching. Use <code>$1</code>, <code>$2</code> in the replacement for captured groups, and <code>\\n</code> for a new line. Examples:</p>
<ul><li><code>\\s+</code> → a single space: collapse repeated spaces.</li><li><code>(\\w+)@(\\w+)</code> → <code>$1 at $2</code>: rewrite email addresses.</li><li><code>^\\d+\\.\\s*</code> → nothing: remove numbering from the start of lines.</li></ul>""",
    [("Is my text uploaded?", "No. Everything happens in your browser."),
     ("Can I undo a replacement?", "Press Ctrl+Z (Cmd+Z on a Mac) in the text box, or paste your original text again.")],
    ("texttools.js",))

tool_page("sort-lines-remove-duplicates",
    "Sort Lines & Remove Duplicate Lines Online | etoolbox",
    "Sort lines & remove duplicates",
    "Sort a list alphabetically, by length or at random, remove duplicate lines and empty lines, and trim spaces. Ideal for email lists, keywords, names and data. Numbers sort naturally (2 before 10).",
    """
  <form class="gen" data-sortlines novalidate>
    <div class="panel"><label for="so-text">Your list <span class="muted">(one item per line)</span></label><textarea id="so-text" name="text" rows="14">banana
Apple
cherry
apple
item 10
item 2

banana</textarea>
      <label for="so-sort">Sort</label><select id="so-sort" name="sort"><option value="az">A → Z</option><option value="za">Z → A</option><option value="len">Shortest first</option><option value="lenr">Longest first</option><option value="rev">Reverse the order</option><option value="shuffle">Shuffle randomly</option><option value="none">Don't sort</option></select>
      <label class="check"><input type="checkbox" name="dedupe" checked> Remove duplicate lines</label><label class="check"><input type="checkbox" name="ci" checked> Ignore upper and lower case</label>
      <label class="check"><input type="checkbox" name="trim" checked> Trim spaces</label><label class="check"><input type="checkbox" name="empty" checked> Remove empty lines</label></div>
    <div class="panel"><label for="so-out">Result</label><textarea id="so-out" rows="14" readonly></textarea><p class="hint" id="so-msg" role="status"></p>
      <div class="actions"><button type="button" class="btn" id="so-copy">Copy result</button><button type="button" class="btn ghost" id="so-shuffle">Shuffle again</button></div></div>
  </form>""",
    """<h2>Tips</h2><ul><li>Paste a column from Excel or Google Sheets. Each cell becomes a line.</li><li>Untick <em>Ignore upper and lower case</em> to keep “Apple” and “apple” as separate items.</li><li>Choose <em>Don't sort</em> to remove duplicates but keep your original order.</li></ul>""",
    [("How many lines can it handle?", "Hundreds of thousands. It all runs in your browser."),
     ("Does it keep the first or last copy of a duplicate?", "The first one, in its original position, before sorting.")],
    ("texttools.js",))

tool_page("slug-generator",
    "URL Slug Generator – SEO-Friendly URLs from Titles | etoolbox",
    "URL slug generator",
    "Turn titles into clean, SEO-friendly URL slugs: lower case, hyphens, no accents or symbols, optional stop-word removal and a length limit. Paste several titles at once, one per line.",
    """
  <form class="gen" data-slug novalidate>
    <div class="panel"><label for="sg-text">Titles <span class="muted">(one per line)</span></label><textarea id="sg-text" name="text" rows="8">10 Best Cafés in Manchester – A Local's Guide!
How to Write a CV & Cover Letter</textarea>
      <div class="row"><div><label for="sg-sep">Separator</label><select id="sg-sep" name="sep"><option value="-">Hyphen (-)</option><option value="_">Underscore (_)</option><option value="">None</option></select></div><div><label for="sg-max">Max length</label><input type="number" id="sg-max" name="max" min="0" max="200" placeholder="No limit"></div></div>
      <label class="check"><input type="checkbox" name="lower" checked> Lower case</label><label class="check"><input type="checkbox" name="stop"> Remove short words (a, the, and, of…)</label></div>
    <div class="panel"><label for="sg-out">Slugs</label><textarea id="sg-out" rows="8" readonly></textarea><p class="hint">Preview: <code id="sg-url"></code></p><div class="actions"><button type="button" class="btn" id="sg-copy">Copy slugs</button></div></div>
  </form>""",
    """<h2>What makes a good URL slug?</h2><ul><li>Short and descriptive, ideally 3–5 words.</li><li>Lower case, with words separated by hyphens. Google treats hyphens as spaces, but not underscores.</li><li>No dates or numbers that might change, unless they matter.</li><li>Includes the main keyword people search for.</li></ul>""",
    [("What happens to accents and symbols?", "Accents are removed (café → cafe), “&” becomes “and”, and other symbols are dropped."),
     ("Should I remove stop words?", "Often, yes: “how-write-cv-cover-letter” is shorter than “how-to-write-a-cv-and-cover-letter”. Keep them if the slug reads badly without them.")],
    ("texttools.js",))

tool_page("text-diff-checker",
    "Text Diff Checker – Compare Two Texts and Highlight Differences | etoolbox",
    "Text diff checker",
    "Paste two versions of a text to see exactly what changed: added, removed and edited lines, with the changed words highlighted. Useful for contracts, essays, code and copy edits. Free and private.",
    """
  <form class="panel" data-diff novalidate>
    <div class="row"><div><label for="df-a">Original text</label><textarea id="df-a" name="a" rows="10" spellcheck="false">The meeting is on Monday at 10am.
Please bring the sales report.
Lunch will be provided.</textarea></div>
    <div><label for="df-b">Changed text</label><textarea id="df-b" name="b" rows="10" spellcheck="false">The meeting is on Tuesday at 10am.
Please bring the sales report.
Lunch will be provided.
Parking is available.</textarea></div></div>
    <div class="fr-opts"><label class="check"><input type="checkbox" name="ci"> Ignore upper and lower case</label><label class="check"><input type="checkbox" name="ws"> Ignore extra spaces</label><button type="button" class="btn ghost sm" id="df-swap">Swap texts</button></div>
    <p class="hint" id="df-msg" role="status"></p>
    <div class="df-wrap" id="df-out"></div>
  </form>""",
    """<h2>How to read the result</h2><ul><li><span class="df-add">Green</span> lines were added in the changed text.</li><li><span class="df-del">Red</span> lines were removed.</li><li>Changed lines show the removed words struck through on the left and the new words highlighted on the right.</li></ul>
<p>Comparing Word or PDF files? Use <a href="/compare-documents/">Compare documents</a>, which reads the files for you.</p>""",
    [("Is my text uploaded?", "No. The comparison runs entirely in your browser, so it's safe for confidential documents."),
     ("Can it compare code?", "Yes. It compares line by line, so it works well for code, CSV files and configuration files.")],
    ("texttools.js",))
