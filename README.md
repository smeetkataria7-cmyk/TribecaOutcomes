# TribecaOutcomes — site rebuild

A visual rebuild of **tribecaoutcomes.com**.

## The one rule

**Content is frozen at 0% edit.** Every heading, paragraph, list item, button
label, link text and footer line is reproduced verbatim from the existing site.
This rebuild changes *only* the presentation layer: markup structure, CSS,
typography, spacing, colour, imagery treatment, motion and accessibility.

If a wording change ever looks necessary, it gets raised as a question — never
made silently.

## Status

| Piece | State |
| --- | --- |
| Design system (tokens, base, layout, components) | ✅ built |
| `styleguide.html` specimen page | ✅ built |
| **Home page** (`index.html`) | ✅ built, copy verified verbatim |
| **Contact page** (`contact.html`) | ⚠️ built with placeholder form copy — see `content/contact.md` |
| Contact form handler | ⏳ not wired (Netlify / Formspree / custom) |
| Team portraits | ⏳ awaiting images (monogram placeholders in use) |
| Photography | ❌ **none** — see `assets/img/README.md` for the drop-in slots |

The build environment's network policy blocks all outbound traffic to
`tribecaoutcomes.com`, so the live site could not be scraped from here. Copy is
supplied by the client and lands in `content/` — see *Getting the content in*.

## Verifying the copy

`index.html` is checked against `content/home.md` mechanically, not by eye —
the page is rendered in headless Chromium and every supplied string is asserted
present in `document.body.innerText`, which reflects `text-transform`, so a
stylistic uppercase that would alter how a word renders is caught. The check
also lists any on-page text *not* in the supplied copy, so invented wording
cannot slip in unnoticed. It caught two real defects on the first run: the
footer rendering the brand as `TRIBECAOUTCOMES`, and an `inline-flex` gap
splitting the logo into "Tribeca Outcomes".

Non-supplied text currently on the home page, all of it structural chrome:
`Skip to content`, `Menu` (screen-reader only), the `◐` theme glyph, the `→`
arrow glyphs, the decorative section numerals `01`–`04`, `© <year>
TribecaOutcomes`, and `Back to top`. Say the word and any of these go.

## Preview

No build step, no dependencies. Open `styleguide.html` in a browser, or serve
the folder so that relative paths and the theme toggle behave exactly as they
will in production:

```sh
npx http-server . -p 8080 -c-1
# then open http://localhost:8080/styleguide.html
```

## Layout

```
assets/
  css/
    tokens.css       Design tokens — colour, type scale, space, shape, motion.
                     Includes the full dark-mode remap. Edit here, not below.
    base.css         Reset, base typography, focus styles, skip link.
    layout.css       Containers, sections, grids, stacks, measure helpers.
    components.css   Buttons, nav, hero, cards, stats, pills, quotes,
                     forms, footer, scroll-reveal.
  js/
    theme-init.js    Inline in <head>; applies the saved theme pre-paint.
    site.js          Mobile nav, sticky header, scroll reveal, theme toggle.
                     All progressive enhancement.
  img/               (empty — imagery lands here)
styleguide.html      Component specimen. Not a client-facing page.
```

Load order in every page: `tokens → base → layout → components`.

## Design decisions

- **Type.** Source Serif 4 for headings (research/publication authority), Inter
  for body (dense copy stays effortless). Sizes are fluid `clamp()` steps that
  interpolate between a 360px and a 1280px viewport, so nothing jumps at a
  breakpoint.
- **Colour.** A deep teal-blue brand ramp instead of generic corporate blue,
  on warm neutrals so the page reads as paper. A warm clay accent is held in
  reserve for emphasis only.
- **Contrast.** Every text/surface pair was measured. Body copy 15.2:1,
  muted 5.1:1, smallest caption 4.9:1, links 5.6:1 — all past WCAG AA, body
  past AAA. The dark palette clears AA throughout. `--n-400` is marked
  decorative-only because it does not.
- **Motion.** One scroll-reveal with a staggered group variant, plus small
  hover transforms. Everything is disabled under
  `prefers-reduced-motion: reduce`.
- **No-JS.** Reveal transitions are scoped to a `.js` class that `site.js` sets
  on `<html>`. If scripting is off or the file 404s, the class never lands and
  every element renders at full opacity — content is never hidden behind JS.
- **No build step.** Plain static HTML/CSS/JS, deployable to Netlify, Vercel,
  Cloudflare Pages or GitHub Pages as-is.

## Getting the content in

Any one of these unblocks the page templates:

1. Paste the copy per page (headings, body, CTAs, nav, footer) into the issue
   or chat.
2. Attach a `Ctrl+A → copy` text dump of each page, or the saved HTML.
3. Export the Squarespace site and share the export.
4. Grant the build environment egress to `tribecaoutcomes.com` so the pages can
   be pulled directly.

Once the copy lands it goes into `content/` as the canonical source, and the
templates are filled from it verbatim.
