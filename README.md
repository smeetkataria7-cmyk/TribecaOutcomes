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

The first pass was built blind — the live site was unreachable and no
screenshots had been supplied — so the palette and type were invented. Once
screenshots arrived, the direction was corrected to match the real site:

- **Colour.** Sampled from the logo, not guessed: navy `#283282` from the
  "Tribeca" wordmark, orange `#fa7b24` from "Outcomes" and the dot arc.
  Orange measures **2.65:1 on white**, so it is a graphic colour only —
  bullets, rules, dots, never text. `--highlight-text` (`#a84e13`, 5.58:1)
  exists for the cases where words must be orange.
- **Type.** Inter throughout, because the live site is sans-serif throughout.
  Large section headings at weight 500 and column headings at 700, matching
  the live hierarchy. Sizes are fluid `clamp()` steps interpolating between a
  360px and a 1280px viewport, so nothing jumps at a breakpoint.
- **Hero.** Full-bleed aerial photograph of Lower Manhattan with a dark scrim
  and white copy, as on the live site. The scrim is tuned so every hero text
  block clears **6.7:1 at its worst pixel**.
- **Navigation.** Home and Contact only, matching the live header.
- **Contrast.** Measured across the palette: body 18.1:1, muted 6.3:1,
  smallest caption 5.4:1, navy links 11.2:1. `--n-400` is marked
  decorative-only because it fails as text.
- **Theme.** A single header control cycles **System → Light → Dark**.
  System is the default and is stored as the *absence* of a preference, so a
  visitor who never touches it keeps following their OS — including when the
  OS flips while the page is open. Light and Dark are explicit overrides that
  persist. `theme-init.js` runs inline in `<head>` so there is no flash of the
  wrong scheme.
- **Motion.** One scroll reveal with a staggered group variant plus small
  hover transforms, all disabled under `prefers-reduced-motion: reduce`.
- **No-JS.** Reveal transitions are scoped to a `.js` class set by `site.js`.
  If scripting is off the class never lands and everything renders at full
  opacity — content is never hidden behind JS.
- **No build step.** Plain static HTML/CSS/JS, deployable as-is.

## Checks

Five scripts under `tools/` guard the things that are easy to break silently —
verbatim copy, dangling design tokens, hero contrast, form labelling. See
`tools/README.md`. Run all five before pushing.

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
