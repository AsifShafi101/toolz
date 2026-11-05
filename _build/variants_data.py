# Format-specific landing pages ("MP4 to MP3", "PNG to WebP"...). Each reuses a real tool's UI,
# with its own intro, steps and FAQ. Only conversions the underlying tool genuinely supports are listed.
# Fields: base, slug, label, h1, title, intro, about (paragraph), steps (3), faqs, ui_replace [(old, new)]

AV_ACC = ('accept="video/*,audio/*,.mkv,.mov,.m4a,.webm,.opus,.ogg,.wav"', None)
V2M_STEPS = lambda src: [f"Choose your {src} file, or drag it onto the box.", "Pick a quality. 128 kbps suits most things; use 320 kbps for music.",
                         "Press <strong>Convert to MP3</strong>. The MP3 downloads when it's done."]
V2M_PRIV = ("Is my file uploaded?", "No. It's converted in your browser, so it never leaves your device.")
V2M_LEN = ("Is there a length limit?", "No. The file is read in pieces, so 1–2 hour recordings work fine. Longer files just take a little longer.")

IMG_STEPS = lambda src, dst: [f"Choose your {src} images (up to 30), or drag them onto the box.", f"{dst} is already selected. Adjust the quality if you like.",
                              "Download each image, or all of them at once."]
IMG_PRIV = ("Are my images uploaded?", "No. They're converted in your browser and never leave your device.")


def _img_pick(fmt):
    # pre-select the output format in the converter's segmented control
    return [('value="jpeg" checked', 'value="jpeg"'), ('value="png" checked', 'value="png"'), ('value="webp" checked', 'value="webp"'),
            (f'value="{fmt}"', f'value="{fmt}" checked')]


VARIANTS = [
    # ---- Video / audio → MP3 ----
    ("video-to-mp3", "mp4-to-mp3", "MP4 to MP3", "MP4 to MP3 converter", "MP4 to MP3 Converter – Free, Any Length, No Upload | etoolbox",
     "Convert MP4 videos to MP3 audio in your browser, even 1–2 hour recordings. It's free, there's no file size limit, and your video is never uploaded.",
     "MP4 is the most common video format, used by phones, cameras, Zoom and Teams recordings and most video editors. Turning it into an MP3 keeps just the sound, which is perfect for listening to a recorded meeting, lecture or webinar on the go. An hour of MP4 makes an MP3 of about 55 MB at 128 kbps.",
     V2M_STEPS("MP4"), [("Will the sound quality change?", "MP4 audio is usually AAC. Converting to MP3 at 192 or 320 kbps keeps it sounding the same to most ears."), V2M_PRIV, V2M_LEN], []),
    ("video-to-mp3", "mov-to-mp3", "MOV to MP3", "MOV to MP3 converter", "MOV to MP3 Converter – iPhone & Mac Videos, Free | etoolbox",
     "Get the audio from iPhone, iPad and Mac videos (.MOV) as an MP3. It's free, works with long recordings, and nothing is uploaded.",
     "MOV is Apple's video format: it's what iPhones, iPads and QuickTime on a Mac save by default. If you've filmed a talk, a band practice or a family message, converting the MOV to MP3 gives you a small audio file that plays anywhere, including Windows and Android.",
     V2M_STEPS("MOV"), [("My iPhone video won't open, what can I do?", "Videos sent from an iPhone are sometimes in HEVC format. Try the latest Chrome or Edge, which decode it on most computers. Only the audio is needed, so the picture doesn't matter here."), V2M_PRIV, V2M_LEN], []),
    ("video-to-mp3", "mkv-to-mp3", "MKV to MP3", "MKV to MP3 converter", "MKV to MP3 Converter – Extract Audio from MKV Free | etoolbox",
     "Extract the audio track from an MKV video as an MP3. Free, no file size limit, and the video never leaves your device.",
     "MKV (Matroska) is a flexible video container used by screen recorders like OBS and by many video tools. It can hold several audio tracks; this converter takes the main one and saves it as an MP3.",
     V2M_STEPS("MKV"), [("My MKV has several audio tracks. Which one is used?", "The main (default) audio track. If you need another one, set it as the default in a tool like MKVToolNix first."), V2M_PRIV, V2M_LEN], []),
    ("video-to-mp3", "webm-to-mp3", "WebM to MP3", "WebM to MP3 converter", "WebM to MP3 Converter – Free, No Upload | etoolbox",
     "Convert WebM videos and recordings to MP3. Great for screen recordings and audio saved from the web. Free and private: nothing is uploaded.",
     "WebM is the open video format used by browsers, screen recorders and many online recording tools. Its audio is usually Opus, which some music players and car stereos can't play. MP3 works on everything.",
     V2M_STEPS("WebM"), [("Why won't my WebM play in my music app?", "Many players don't support WebM or its Opus audio. Converting to MP3 fixes that."), V2M_PRIV, V2M_LEN], []),
    ("video-to-mp3", "m4a-to-mp3", "M4A to MP3", "M4A to MP3 converter", "M4A to MP3 Converter – iPhone Voice Memos, Free | etoolbox",
     "Convert M4A audio, such as iPhone Voice Memos, to MP3 so it plays on any device. Free, no upload, no sign-up.",
     "M4A is an audio-only MP4 file. iPhone Voice Memos, GarageBand exports and many recorders save as M4A. Some older players, car stereos and websites only accept MP3, so converting makes your recording play anywhere.",
     V2M_STEPS("M4A"), [("Can I convert songs bought from iTunes?", "Only songs without copy protection (DRM). Protected files can't be decoded."), V2M_PRIV,
                        ("Will it lose quality?", "Both are compressed formats. Choose 192 kbps or higher and you won't hear a difference.")], []),
    ("video-to-mp3", "wav-to-mp3", "WAV to MP3", "WAV to MP3 converter", "WAV to MP3 Converter – Shrink WAV Files Free | etoolbox",
     "Turn large WAV recordings into MP3s that are about 10 times smaller. Free, no upload, and long recordings are fine.",
     "WAV files are uncompressed, so an hour of CD-quality stereo takes about 600 MB. The same hour as a 128 kbps MP3 is about 55 MB, small enough to email, upload or keep on your phone.",
     V2M_STEPS("WAV"), [("How much smaller will my file be?", "At 128 kbps, roughly 10 times smaller than a CD-quality WAV. At 320 kbps, about 4 times smaller."), V2M_PRIV, V2M_LEN], []),
    ("video-to-mp3", "ogg-to-mp3", "OGG to MP3", "OGG to MP3 converter", "OGG to MP3 Converter – Free, No Upload | etoolbox",
     "Convert OGG and Opus audio files to MP3 so they play on any device. Free, private and quick.",
     "OGG files usually contain Vorbis or Opus audio. They sound good and are small, but iPhones, car stereos and some apps won't play them. MP3 is the format that works everywhere.",
     V2M_STEPS("OGG or Opus"), [("Does it work with .opus files?", "Yes. Opus files are a kind of OGG file and convert the same way."), V2M_PRIV, V2M_LEN], []),
    ("video-to-mp3", "whatsapp-audio-to-mp3", "WhatsApp audio to MP3", "WhatsApp voice note to MP3", "WhatsApp Voice Note to MP3 – Convert .opus Free | etoolbox",
     "Convert WhatsApp voice notes (.opus or .ogg) to MP3 so you can play, keep or share them anywhere. Free, and your audio never leaves your device.",
     "WhatsApp saves voice messages in Opus format. To get one out of WhatsApp, open the chat, long-press the voice note and choose Share (iPhone) or tap ⋮ → Share (Android), then save it to Files or your computer. Converting it to MP3 means it plays in any music app and can be kept safely.",
     ["Save the voice note from WhatsApp (long-press → Share → Save to Files, or send it to yourself by email).", "Choose the .opus or .ogg file here.", "Press <strong>Convert to MP3</strong> and download it."],
     [("Can you get voice notes straight from WhatsApp?", "No. WhatsApp messages are end-to-end encrypted, so you need to save the file from the app first, then convert it here."), V2M_PRIV,
      ("Which quality should I pick?", "Voice notes are speech, so 96 kbps mono gives a small file that still sounds clear.")], []),
    ("video-to-mp3", "extract-audio-from-video", "Extract audio", "Extract audio from video", "Extract Audio from Video – Save Sound as MP3 Free | etoolbox",
     "Pull the soundtrack out of any video and save it as an MP3. Works with MP4, MOV, MKV and WebM, any length, and nothing is uploaded.",
     "Extracting the audio is useful for turning recorded meetings, lessons and talks into something you can listen to, for making a podcast from a video, or for keeping the sound from your own phone videos. You can also cut out just the part you need.",
     V2M_STEPS("video"), [("Can I keep just one part of the audio?", "Yes. Open “Cut a section” and enter a start and end time, like 1:30 and 12:45."), V2M_PRIV, V2M_LEN], []),

    # ---- Image format conversions ----
    ("png-to-jpg", "png-to-webp", "PNG to WebP", "PNG to WebP converter", "PNG to WebP Converter – Smaller Images, Free | etoolbox",
     "Convert PNG images to WebP, which is often 25–35% smaller, for faster websites. Batch convert up to 30 at once; nothing is uploaded.",
     "WebP is the modern image format recommended by Google for websites. It keeps transparency like PNG but makes much smaller files, which helps pages load faster and can help your search rankings.",
     IMG_STEPS("PNG", "WebP"), [("Is transparency kept?", "Yes. WebP supports transparent backgrounds just like PNG."), IMG_PRIV], _img_pick("webp")),
    ("png-to-jpg", "jpg-to-webp", "JPG to WebP", "JPG to WebP converter", "JPG to WebP Converter – Free, Batch, No Upload | etoolbox",
     "Convert JPG photos to WebP for smaller files and faster web pages. Up to 30 at once, free and private.",
     "WebP photos are usually about 25–30% smaller than JPGs at the same visual quality. If you run a website or online shop, switching product photos to WebP is one of the easiest ways to speed it up.",
     IMG_STEPS("JPG", "WebP"), [("Do all browsers support WebP?", "Yes, every modern browser does, including Safari on iPhone and Mac."), IMG_PRIV], _img_pick("webp")),
    ("png-to-jpg", "webp-to-png", "WebP to PNG", "WebP to PNG converter", "WebP to PNG Converter – Keep Transparency, Free | etoolbox",
     "Convert WebP images to PNG, keeping transparent backgrounds. Free, batch, and nothing is uploaded.",
     "Saved an image from a website and got a .webp file? PNG opens in every app, including older editing software and Office, and keeps transparency, which makes it the best choice for logos and graphics.",
     IMG_STEPS("WebP", "PNG"), [("WebP to PNG or JPG?", "Choose PNG for logos, graphics and anything with a transparent background. Choose JPG for photos, as the files are smaller."), IMG_PRIV], _img_pick("png")),
    ("png-to-jpg", "avif-to-jpg", "AVIF to JPG", "AVIF to JPG converter", "AVIF to JPG Converter – Free, No Upload | etoolbox",
     "Convert AVIF images to JPG so they open in any app. Free, batch, and your images stay on your device.",
     "AVIF is a very efficient new image format that more and more websites use. Many apps, printers and older software can't open it yet, so JPG is the safer choice for sharing and printing.",
     IMG_STEPS("AVIF", "JPG"), [("Which browsers can read AVIF?", "Recent Chrome, Edge, Firefox and Safari (iOS 16 and later) all can."), IMG_PRIV],
     _img_pick("jpeg") + [('accept="image/jpeg,image/png,image/webp"', 'accept="image/avif,.avif,image/jpeg,image/png,image/webp"')]),
    ("png-to-jpg", "avif-to-png", "AVIF to PNG", "AVIF to PNG converter", "AVIF to PNG Converter – Free, No Upload | etoolbox",
     "Convert AVIF images to PNG, keeping transparency. Free, batch, private.",
     "PNG is lossless and opens everywhere, so it's the best choice when you want to edit an AVIF image further or keep a transparent background.",
     IMG_STEPS("AVIF", "PNG"), [("Is transparency kept?", "Yes. Transparent areas in the AVIF stay transparent in the PNG."), IMG_PRIV],
     _img_pick("png") + [('accept="image/jpeg,image/png,image/webp"', 'accept="image/avif,.avif,image/jpeg,image/png,image/webp"')]),
    ("png-to-jpg", "bmp-to-jpg", "BMP to JPG", "BMP to JPG converter", "BMP to JPG Converter – Shrink BMP Files Free | etoolbox",
     "Convert big BMP bitmap images to small JPGs. Free, batch, and nothing is uploaded.",
     "BMP is an old Windows format that stores images uncompressed, so files are huge. A JPG of the same picture is often 10 times smaller and works on every device and website.",
     IMG_STEPS("BMP", "JPG"), [("Why are BMP files so big?", "They store every pixel without compression. JPG compresses them with little visible difference."), IMG_PRIV],
     _img_pick("jpeg") + [('accept="image/jpeg,image/png,image/webp"', 'accept="image/bmp,.bmp,image/jpeg,image/png,image/webp"')]),
    ("png-to-jpg", "jfif-to-jpg", "JFIF to JPG", "JFIF to JPG converter", "JFIF to JPG Converter – Free, No Upload | etoolbox",
     "Turn .jfif images into normal .jpg files that every app and website accepts. Free and private.",
     "JFIF is really a JPEG image with a different file extension, often given by Windows when you save pictures from the web. Some upload forms and apps refuse .jfif files; converting gives you a standard .jpg.",
     IMG_STEPS("JFIF", "JPG"), [("Is JFIF the same as JPG?", "Almost. It's the same kind of image, just with a different extension. Converting makes sure every app accepts it."), IMG_PRIV],
     _img_pick("jpeg") + [('accept="image/jpeg,image/png,image/webp"', 'accept=".jfif,image/jpeg,image/png,image/webp"')]),
    ("heic-to-jpg", "heic-to-png", "HEIC to PNG", "HEIC to PNG converter", "HEIC to PNG Converter – iPhone Photos, Free | etoolbox",
     "Convert iPhone HEIC photos to lossless PNG. Up to 50 at once, zip download, and your photos never leave your device.",
     "PNG keeps every detail of your photo with no compression loss, which is useful if you're going to edit it further. For everyday sharing, JPG files are smaller.",
     ["Choose your .HEIC photos (up to 50).", "PNG is already selected.", "Download each one, or all of them as a zip."],
     [("PNG or JPG for iPhone photos?", "JPG for sharing (much smaller). PNG if you'll edit the photo and want no quality loss."), IMG_PRIV],
     [('<option value="image/jpeg">', '<option value="image/jpeg">'), ('<option value="image/png">', '<option value="image/png" selected>')]),

    # ---- Images → PDF, PDF → images ----
    ("jpg-to-pdf", "png-to-pdf", "PNG to PDF", "PNG to PDF converter", "PNG to PDF Converter – Combine PNGs into a PDF Free | etoolbox",
     "Turn PNG images, screenshots and scans into a single PDF. Reorder pages, choose page size, free and nothing is uploaded.",
     "Combining screenshots or scanned pages into one PDF makes them easy to email, print or upload to forms that only accept PDFs.",
     ["Choose your PNG images (you can add JPG and WebP too).", "Use the arrows to set the page order, and pick a page size.", "Download your PDF."],
     [("Can I mix PNG and JPG?", "Yes. Add any mix of PNG, JPG and WebP images."), ("Are my images uploaded?", "No. The PDF is made in your browser.")], []),
    ("jpg-to-pdf", "image-to-pdf", "Image to PDF", "Image to PDF converter", "Image to PDF Converter – JPG, PNG, WebP to PDF Free | etoolbox",
     "Convert photos and images to PDF: JPG, PNG and WebP, one image or many in one file. Free, no sign-up, nothing uploaded.",
     "Making a PDF from photos is handy for receipts, ID documents, homework, signed forms you've photographed, and anything an upload form wants as a PDF.",
     ["Choose your images, or drag them onto the box.", "Set the order with the arrows and choose A4, Letter or Same as image.", "Download the PDF."],
     [("Is it safe for ID documents?", "Yes. Nothing is uploaded: the PDF is created on your device."), ("How many images can I add?", "Up to 50 at a time.")], []),
    ("jpg-to-pdf", "webp-to-pdf", "WebP to PDF", "WebP to PDF converter", "WebP to PDF Converter – Free, No Upload | etoolbox",
     "Convert WebP images to PDF, one or many in a single file. Free and private.",
     "WebP images saved from websites can be awkward to print or send. Putting them in a PDF makes them easy to share, print and upload.",
     ["Choose your WebP images.", "Arrange the order and page size.", "Download your PDF."],
     [("Will the quality drop?", "No. Images are placed in the PDF at full resolution."), ("Are my images uploaded?", "No. Everything happens in your browser.")], []),
    ("pdf-to-jpg", "pdf-to-png", "PDF to PNG", "PDF to PNG converter", "PDF to PNG Converter – High Quality, Free | etoolbox",
     "Convert each PDF page into a sharp PNG image. Free, no upload, and you choose the resolution.",
     "PNG is lossless, so text and diagrams stay crisp, which makes it the better choice than JPG for slides, documents and anything with sharp lines.",
     ["Choose your PDF.", "PNG is already selected. Pick the resolution.", "Download each page, or all pages at once."],
     [("PNG or JPG?", "PNG for documents, slides and diagrams (sharper text). JPG for photo-heavy pages (smaller files)."), ("Is my PDF uploaded?", "No. Pages are rendered in your browser.")],
     [('<option value="png">PNG</option>', '<option value="png" selected>PNG</option>')]),
    ("compress-pdf", "compress-pdf-for-email", "Compress PDF for email", "Compress PDF for email", "Compress PDF for Email – Make PDFs Small Enough to Send | etoolbox",
     "Too big to attach? Shrink your PDF so it fits Gmail and Outlook limits. Free, and the file stays on your device.",
     "Gmail lets you attach up to 25 MB and Outlook.com up to 20 MB, and many work email systems allow only 10 MB. Scanned documents and PDFs full of photos are usually the culprits; 'Recommended' or 'Strong' compression normally brings them well under the limit.",
     ["Choose your PDF.", "Pick 'Strong' if it needs to be as small as possible.", "Download it and attach it to your email."],
     [("What's the attachment limit?", "Gmail 25 MB, Outlook.com 20 MB. Many company systems allow 10 MB."), ("Is my PDF uploaded?", "No. It's compressed in your browser.")], []),
]

for _v in VARIANTS:
    VARIANT_LINKS.setdefault(_v[0], []).append((_v[1], _v[2]))
# conversions that live under one tool family also show on their siblings
for _sib in ("jpg-to-png", "webp-to-jpg", "image-converter"):
    VARIANT_LINKS[_sib] = VARIANT_LINKS["png-to-jpg"]
