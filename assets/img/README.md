# Image slots

The site currently ships **no photography**. Nothing here was available: the
build environment cannot reach tribecaoutcomes.com, and no image files have
been supplied. What is on the page instead is deliberate placeholder artwork —
inline SVG that inherits the theme colours — clearly marked in the HTML.

Every slot below is a one-line swap.

## 1. Hero artwork → hero photograph

`index.html`, inside `.hero__grid`. Replace the entire `<div class="art">…</div>`
block with:

```html
<div class="media-slot"><img src="assets/img/hero.jpg" alt=""></div>
```

Use `alt=""` if the image is decorative; write real alt text if it carries
meaning. Recommended: 1600×1200 or wider, 3:2 or 4:3.

## 2. Positioning band texture → full-bleed photograph

`index.html`, the `.has-band-art` section. The `<div class="band-art">` holds a
measurement-grid SVG. Swap in an image and keep it behind the text:

```html
<div class="band-art" aria-hidden="true">
  <img src="assets/img/band.jpg" alt="" style="width:100%;height:100%;object-fit:cover">
</div>
```

Keep it dark or lower `.band-art { opacity }` — white text sits on top and the
contrast has to hold.

## 3. Team monograms → portraits

`index.html`, each `.team-card`. Replace:

```html
<div class="team-card__avatar" aria-hidden="true">LS</div>
```

with:

```html
<img class="team-card__avatar" src="assets/img/team/lou-sanquini.jpg" alt="Lou Sanquini">
```

The class already sets `aspect-ratio: 1`, `object-fit: cover` and the pill
radius, so square-ish crops at 400×400 or larger just work.

**These are real people.** Their portraits must be actual photographs of them —
never generated, never stock stand-ins.

## Formats

Prefer `.webp` with a `.jpg` fallback via `<picture>` for anything large. Add
`loading="lazy"` and `decoding="async"` to every image below the fold; leave
the hero eager so it is not delayed.
