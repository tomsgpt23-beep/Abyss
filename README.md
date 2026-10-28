# The Abyss Archive

A self-contained Dell Abyss paperback catalogue and personal collection tracker. No accounts, API keys, database, build step, or application dependencies.

## Run in Chrome

Install Python 3, open a terminal in this directory, and run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000` in Chrome. Stop with Ctrl+C. Always use the same address and port: browser storage is tied to that origin. A local server is needed because browsers restrict JSON fetches from `file://` pages. `npm start` is an alternative when Node is installed (binds all interfaces for cloud development).

## The catalogue

All **45 rows** were transcribed from the user-supplied **macabrary.com-Dell Abyss (2).pdf**, pages 2–5: 13 + 13 + 13 + 6 records. The PDF is the authoritative starting source. Foundational bibliography is credited to **The Macabrary and Mark Hennion**, https://macabrary.com/catalogue/dell-abyss/ . An extracted reference transcription is in `docs/source-catalogue.txt`.

`data/catalogue.json` is the canonical bibliography. IDs are stable; don't change an ID when correcting a title or ISBN. `sourceRecord` preserves the transcribed original fields, original position, and PDF page. `publication` normalizes the source month to YYYY-MM, while `sourceRecord.publicationDate` retains source wording, including the Post Mortem reprint note. `editions` reserves room for future editions. Corrections should update display fields and add notes without overwriting the original `sourceRecord`.

Source ambiguities are deliberately preserved:

- Metahorror / Shadow Man share `0-440-21202-2`.
- Dark Dance / Heart-Beast share `0-440-21455-6`.
- Darker Saints has the shortened `0-440-2113-1`.
- Whipping Boy and Bad Brains both say March 1992; their source row order is retained.
- Post Mortem's table editor credit differs from later prose; both are documented.
- Kathryn Kristin Rusch and Harrowgate's Michael Gower are retained exactly and flagged for verification.

The five records with duplicate or malformed ISBNs use title-and-author bookseller searches. No bibliographic value was silently corrected, and physical editions have not been independently checked.

The default gallery uses the real records. The optional demonstration checkbox loads **three explicitly fictional records** from `data/demo.json`, with separate personal storage. Demonstrations never enter the canonical catalogue.

## Catalogue import without rebuilding

Use **The archivist’s desk → Import canonical catalogue JSON**. A validated import replaces the active catalogue after confirmation and is saved in this browser. Export active catalogue saves the JSON for another device. Alternatively replace `data/catalogue.json` and reload; no compilation is needed. A previously imported browser override takes precedence over the bundled file: import the updated file in the UI to replace that override.

The JSON format is:

```json
{
  "version": 1,
  "books": [
    {
      "id": "dell-abyss-001",
      "imprint": "dell-abyss",
      "position": 1,
      "title": "The Cipher",
      "author": "Kathe Koja",
      "publication": "1991-02",
      "isbn10": "0-440-20782-7",
      "isbnUnreliable": false,
      "sourceUrl": "https://macabrary.com/catalogue/dell-abyss/",
      "verificationNotes": []
    }
  ]
}
```

Use the full bundled file as the template for the 45-record catalogue, including provenance and imprint metadata. Import validates required fields, unique IDs and positions, publication format, and source URLs. It does not independently authenticate bibliographic claims. ISBN strings are intentionally preserved even if questionable; set `isbnUnreliable: true` and explain them. Imports that omit IDs with existing collection notes are rejected to prevent accidental data loss.

## Add or replace artwork without code changes

There are **no verified cover scans bundled**. All 45 books currently use intentionally typographic placeholders, never fictional cover art or unrelated editions. The source PDF contains no complete set of individual covers suitable for this gallery.

Put image files under `artwork/` and edit `data/artwork.json`, or use **Import artwork JSON**. Paths resolve relative to the application root. Metadata is separate from bibliography:

```json
{
  "version": 1,
  "books": {
    "dell-abyss-001": [
      {
        "type": "front",
        "url": "artwork/cipher-front.jpg",
        "credit": "Your scan / rights holder",
        "source": "Your provenance or source URL"
      },
      {
        "type": "stepback",
        "url": "artwork/cipher-stepback.jpg",
        "credit": "Your scan / rights holder"
      }
    ]
  }
}
```

Add restored-front, wraparound, spine, back, and original-scan entries with any descriptive `type`; only entries present appear in the viewer. Use `front` for the gallery thumbnail. Images display at their available resolution in a full-screen overlay with previous/next controls and provenance. Unavailable front images fall back to the title/author placeholder; unavailable viewer images show an explicit message. HTTP(S) image URLs are supported, but local files make the archive work offline and avoid future remote image changes. Artwork import replaces all metadata after confirmation; export a copy first. It does not upload image files: copy those into the served directory yourself.

## Personal collection and backups

Owned/read/wanted, condition, CAD purchase price, purchase date, and notes save automatically to browser-local storage. Personal information never changes the canonical catalogue or goes to a server. Export collection JSON regularly; clearing site data or using a different browser loses local notes unless restored. Imports validate shape, types, known book IDs, price and dates, and ask before replacing existing data. Demo and real collections have separate storage keys; a demo backup cannot be imported into the real catalogue.

Booksellers are configured in `data/booksellers.json` and can be extended with an ISBN/title search URL prefix. Amazon.ca, ThriftBooks, and AbeBooks open in new tabs; no prices are scraped and no purchases are performed. External marketplace availability is not established by local tests.

## Validation

With Node 20+:

```sh
npm test
```

This runs catalogue/provenance, source anomaly, search/filter/sort, import validation, backup round-trip, and bookseller URL tests without installing packages.

The browser suite requires Playwright and Chromium in your test environment. The cloud runtime already supplies them. On a local machine, install Playwright outside this checkout and set `NODE_PATH` to that node_modules directory, or install it locally without saving dependency declarations. Run the server first:

```sh
npm install --no-save --package-lock=false playwright
CHROMIUM_PATH=/path/to/chromium node tests/browser.cjs
```

The suite uses a fresh browser context and test fixtures; it doesn't modify canonical files. It verifies all 45 default records, search/sort/filter behavior, collection changes and reload persistence, export/import and rejection, demonstration separation, catalogue/artwork imports, full-screen viewer and broken-image fallbacks, all three seller link constructions, Escape behavior, and desktop/mobile overflow. Browser tests do not verify external seller results or physical edition accuracy.

## Save to GitHub

The files live in the connected `tomsgpt23-beep/Abyss` checkout. If network access is unavailable, preserve the complete folder or a source ZIP first. On a connected machine, clone the repository, copy the project files into it (not its `.git` directory), then run:

```sh
git add .
git commit -m "Build The Abyss Archive with PDF-sourced catalogue"
git push origin HEAD
```

Use a branch and pull request when the remote already has work. Do not force-push or replace an existing branch. A source ZIP excludes personal browser-local collection data; export that separately.
