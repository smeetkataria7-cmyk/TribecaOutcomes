# Images

## Brand colours (sampled from the logo, not guessed)

| Role | Hex | Notes |
| --- | --- | --- |
| Navy | `#283282` | The "Tribeca" wordmark. 11.24:1 on white — safe for any text. |
| Orange | `#fa7b24` | The "Outcomes" wordmark and dot arc. **2.65:1 on white — never put text in it.** Bullets, rules and dots only. |
| Orange (text) | `#a84e13` | Use when orange must carry words. 5.58:1. |

## 1. Hero photograph — REPLACE THIS

`assets/img/hero-placeholder.jpg` was **cropped out of a screenshot** of the
live site. It is screenshot-resolution and will look soft on a large display.

Replace it with the original file from Squarespace, same filename, and nothing
else needs to change. To find it: open the live site, right-click the hero
image → "Save image as…", or pull it from the Squarespace media library at full
size. Aim for 2400px wide or more.

**If you swap in a different image, re-check the scrim.** White text sits on
top. The current scrim keeps every hero text block above 6.7:1 against its
worst pixel; a brighter photo can break that. `assets/css/components.css` →
`.hero__scrim` controls it.

## 2. Team portraits

Each `.team-card` in `index.html` currently shows a monogram. Swap:

```html
<div class="team-card__avatar" aria-hidden="true">LS</div>
```

for:

```html
<img class="team-card__avatar" src="assets/img/team/lou-sanquini.jpg" alt="Lou Sanquini">
```

The class already sets `aspect-ratio: 1`, `object-fit: cover` and the pill
radius, so square crops at 400×400 or larger just work.

**These are real people.** Their portraits must be actual photographs of them —
never generated, never stock stand-ins.

## 3. Logo

The header wordmark is currently live text (navy + orange spans) with the dot
arc drawn as inline SVG. That keeps it crisp at every size and themeable. If
you would rather use the real logo file, drop in an SVG and replace the
`.brand` anchor's contents.

## Formats

Prefer `.webp` with a `.jpg` fallback via `<picture>` for anything large. Add
`loading="lazy"` and `decoding="async"` below the fold; the hero is already
`fetchpriority="high"`.
