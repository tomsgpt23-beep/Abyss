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

`data/catalogue.json` is the canonical bibliography. IDs are stable; don't change an ID when correcting a title or ISBN. `sourceRecord` preserves the transcribed original fields (including hyphenated source ISBNs), original position, and PDF page. `publication` normalizes the source month to YYYY-MM, while `sourceRecord.publicationDate` retains source wording, including the Post Mortem reprint note. `editions` reserves room for future editions. Corrections should update display fields and add notes without overwriting the original `sourceRecord`.

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

Use the full bundled file as the template for the 45-record catalogue, including provenance and imprint metadata. Import validates required fields, unique IDs and positions, publication format, and source URLs. It does not independently authenticate bibliographic claims. Normalized ISBN strings are retained even if questionable; set `isbnUnreliable: true` and explain them. Imports that omit IDs with existing collection notes are rejected to prevent accidental data loss.

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

## Version 1.1 — Open Library enrichment

The **ENRICH CATALOGUE** panel is below the archivist’s desk. It leaves the main gallery design and personal collection keys unchanged.

1. Select a book and choose **Check this book**, or check the complete catalogue sequentially. Invalid ISBNs are flagged without sending a request. Duplicate/suspicious source ISBNs can be checked but remain prominently flagged.
2. Compare the proposed edition against title, author, publisher, date, and ISBNs. Missing Dell publisher confirmation, differing title/year/author, and unconfirmed ISBNs produce warnings. **An ISBN match does not verify the Abyss imprint or original cover.** Inspect the edition/source yourself.
3. Approve or reject metadata. Approval shows a clearly attributed Open Library supplement inside the detail panel; it never changes the Macabrary record, record ID, or personal notes.
4. Inspect potential cover thumbnails and the large-image link, then approve/reject each separately. Metadata approval does not approve a cover. Approved covers fill an empty front-cover slot; existing manual front covers retain priority, with discoveries available in the artwork viewer. Removing approval removes only the derived discovery.
5. Export approved additions, or export a full review backup (including pending/rejected/failed records). Import validates the format/provenance and asks before replacing enrichment state. Neither import modifies your personal collection or manually supplied artwork.

The client uses the official edition route `https://openlibrary.org/isbn/{normalizedISBN}.json`, author routes `/authors/{id}.json`, and cover-ID image routes `https://covers.openlibrary.org/b/id/{coverID}-M.jpg?default=false` (thumbnail) / `-L.jpg?default=false` (large). Positive cover identifiers come from the returned edition. No cover is guessed from a different edition. A book with no returned cover IDs keeps its placeholder or existing artwork.

Requests are queued at no more than one per 1.1 seconds, with 15-second timeouts. Edition and author results (including missing editions) are cached for seven days in browser storage. Network/HTTP errors are not cached. A batch stops on an edition/network/storage error or rate limit, and can be stopped after the current book. Already approved/rejected records are skipped to preserve review decisions. Rechecking an individual reviewed record asks before resetting its decisions; it may use the seven-day cache.

Reference documentation and policies:

- https://openlibrary.org/developers/api
- https://openlibrary.org/dev/docs/api/books
- https://openlibrary.org/dev/docs/api/covers
- https://openlibrary.org/developers/api#guidelines

Cover availability is not a license grant. Verify the scan, edition, artist/rights holder, and your intended image use; unknown artist attribution remains explicit. There is no bulk cover crawler or automatic cover replacement.

### ISBN handling

Canonical display ISBNs are now normalized strings with hyphens/whitespace removed and uppercase ISBN-10 X retained. `sourceRecord.isbn10` deliberately keeps the original PDF transcription for provenance. Neither stable IDs nor unrelated bibliographic fields changed. ISBN-10 mod-11 and ISBN-13 weighted mod-10 checks run locally. Invalid/flagged identifiers use title-and-author bookseller searches. ISBN-10 and ISBN-13 search works with or without separators. Existing browser-imported catalogue overrides are normalized in memory; no migration touches personal notes.

### Browser-local versus GitHub data

- `data/catalogue.json`: shared canonical bibliography in GitHub.
- `data/artwork.json`: shared manual artwork metadata in GitHub.
- `data/enrichment.json`: shared, separately attributed enrichment seed in GitHub; initially empty.
- `abyss-enrichment-v1`: browser-local review results and decisions. A local enrichment file takes precedence over the repository seed, so future repository updates do not erase a collector’s approvals.
- `abyss-ol-cache:*`: browser-local temporary API responses.
- Existing `abyss-collection-v1`, `abyss-demo-collection-v1`, catalogue override, and artwork override keys retain their original meanings.

To share approved additions on GitHub Pages, export **approved additions**, rename the file to `enrichment.json`, replace `data/enrichment.json` in the repository, then commit and push it. Other browsers without a local enrichment override will load that seed. Existing browsers can import the exported file explicitly after reviewing it. Personal collection data is never included in enrichment exports. Export personal collection backups separately before clearing site data or changing site address.

The application uses relative local assets and HTTPS external requests; it needs no backend or API key and works under a GitHub Pages project path such as `/Abyss/`. Open Library must allow the browser’s cross-origin request; a blocked/offline/failed request appears in the management panel while browsing and collection tracking remain usable. No JSONP or proxy-bypass fallback is used.

### Version 1.1 validation and limits

`npm test` covers ISBN algorithms, normalization, both ISBN lengths, clean seller URLs, catalogue preservation, attributed candidates/conflicts, caching/queueing, approval imports, and missing/invalid/network/HTTP cases. With the server running and Playwright/Chromium available:

```sh
node tests/browser.cjs
node tests/enrichment-browser.cjs
```

The enrichment suite uses **synthetic fixtures**, not live bibliographic claims. It checks individual lookup, the full cached 45-record batch, approval/rejection, cover priority, export/import, refresh persistence, preservation of a pre-existing v1 personal collection, responsive layout, and project-path static serving.

During development, the environment returned HTTP 403 for the official Open Library documentation and live ISBN endpoint. Live lookup, external cover availability, and production GitHub Pages deployment were therefore **not verified**. Successful fixture tests establish application behavior, not successful live API access. Test a known ISBN in the deployed site and manually verify every proposed edition/cover before approval.
