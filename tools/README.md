# Checks

Run from the repo root. No dependencies beyond a global Playwright.

| Script | What it guards |
| --- | --- |
| `node tools/check-tokens.js` | Every `var(--token)` without a fallback resolves. A dangling token is silent in CSS — the declaration is dropped and the element inherits, which is how a white button once ended up with white text. |
| `node tools/verify-home.js` | All 72 client-supplied strings render **verbatim** on `index.html`, measured against `innerText` so a stylistic `text-transform` that alters how a word renders is caught. Also lists any on-page text *not* in the supplied copy, plus overflow and JS errors. |
| `node tools/verify-contact.js` | Same for `contact.html`, plus every form control has a label and every internal link resolves. |
| `node tools/check-theme.js` | The System/Light/Dark control behaves: a first visit follows the OS and writes nothing, the OS can flip live while on System, the three modes cycle, and an explicit choice survives a reload and overrides the OS. 18 assertions. |
| `node tools/check-layout.js` | The hero headline is exactly one line from 768px up and is never clipped, all five people sit on one row, the nav sits right of the logo with the theme control last, column rules share a baseline, and nothing overflows at seven widths. |
| `node tools/check-reveal.js` | Scroll-reveal completes: every revealed element reaches full opacity after a scroll-through, and nothing is hidden with JavaScript disabled. |
| `node tools/check-logo.js` | Both logo files have transparent corners, a mostly-transparent background, no opaque black rectangle, orange ink for the O and dots, wordmark ink in the right colour, the correct aspect ratio and a sane file size. |
| `node tools/check-motion.js` | Motion settles and stays optional: nothing is left translated or scaled off its resting position after a scroll-through, the progress bar tracks scroll at both ends, and `prefers-reduced-motion: reduce` disables the ken-burns, removes the progress bar and hides nothing. |
| `node tools/check-hero-contrast.js` | Renders the hero, hides the text, samples the pixels behind each text block and reports the **worst-case** white-on-photo contrast. Re-run this after swapping the hero image. |

Run all nine before pushing.
