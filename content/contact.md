# Contact page — content status

**The client has not supplied `/contact` page copy.** The page was built on
request anyway, under a strict rule: every string on it either comes from copy
already supplied, or is listed below as a placeholder to be replaced.

## Reused from supplied copy (verbatim, unaltered)

From the home page's footer block and body:

- `Stay in touch.` — used as the page `<h1>`
- `Accomplished professionals who understand access issues and develop practical
  solutions to deliver value and evidence as needed.` — used as the intro
- `Questions?` — heading above the form
- `TribecaOutcomes`
- `100 Claremont Ave,` / `New York, NY 10027`
- `Phone` / `(917) 558-0621`
- `Contact us`
- The four `Need …?` / `Want …?` lines and the `TribecaOutcomes can do it! …`
  paragraph, repeated as the closing band

## Placeholders — WRITTEN BY US, REPLACE THESE

Nothing here came from the client. Each is a 1:1 swap.

| Where | Current string |
| --- | --- |
| Form status line | `Placeholder form — not yet connected to a mail handler.` |
| Field label | `Name` |
| Field label | `Company` |
| Field label | `Email` |
| Field label | `Phone` |
| Field label | `Message` |
| Submit button | `Send message` |
| Honeypot label | `Do not fill this in` (never visible; screen-reader only) |

Also ours, as structural chrome consistent with the home page: `Skip to
content`, `Menu`, the `◐` theme glyph, `→` arrows, section numerals `01`/`02`,
`© <year> TribecaOutcomes`, `Back to top`.

## The form is not wired up

It posts nowhere and the submit button carries `disabled`. Pick a handler:

- **Netlify** — add `netlify` and `name="contact"` to the `<form>` tag
- **Formspree** — set `action="https://formspree.io/f/XXXXXXX"`
- **Custom** — point `action` at your own endpoint

Then remove `disabled` from the submit button and delete the status line.
A honeypot field (`website`) is already in place for spam; configure the
handler to discard any submission where it is non-empty.

## Open question

`Stay in touch.` now appears twice on this page — once as the `<h1>` and again
as the global footer heading. It reads fine but is redundant. Options: drop the
footer heading on this page only, or supply a real `/contact` headline. Flagged
rather than decided.
