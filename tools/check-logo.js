#!/usr/bin/env node
/* Guards the logo assets. The bug this exists to catch: the source PNG has a
   transparent background, and processing it as though it were white produced a
   fully opaque BLACK rectangle behind the mark. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
let fails = 0;
const check = (n, got, want) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('about:blank');

  for (const [file, inkName] of [['assets/img/logo.png', 'navy'], ['assets/img/logo-on-dark.png', 'white']]) {
    const uri = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
    const r = await p.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const corners = [
        [0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1],
      ].map(([x, y]) => d[(y * c.width + x) * 4 + 3]);
      let transparent = 0, orange = 0, navy = 0, white = 0, black = 0;
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3];
        if (a === 0) { transparent++; continue; }
        if (a < 200) continue;
        const [r0, g0, b0] = [d[i], d[i + 1], d[i + 2]];
        if (r0 > 180 && g0 > 60 && g0 < 190 && b0 < 110) orange++;
        else if (b0 > r0 + 30 && b0 < 200) navy++;
        else if (r0 > 225 && g0 > 225 && b0 > 225) white++;
        else if (r0 < 30 && g0 < 30 && b0 < 30) black++;
      }
      return { w: c.width, h: c.height, corners, transparent, orange, navy, white, black,
               total: d.length / 4 };
    }, uri);

    console.log(`\n${file}  ${r.w}x${r.h}`);
    check('  all four corners transparent', r.corners.every(a => a === 0), true);
    check('  background is mostly transparent', r.transparent / r.total > 0.5, true);
    check('  no opaque black rectangle', r.black < r.total * 0.01, true);
    check('  orange ink present (the O and five dots)', r.orange > 500, true);
    check(`  ${inkName} wordmark ink present`, (inkName === 'navy' ? r.navy : r.white) > 5000, true);
    check('  aspect ratio matches the source crop', Math.abs(r.w / r.h - 5.371) < 0.05, true);
    check('  file under 120KB', fs.statSync(file).size < 120 * 1024, true);
  }

  await b.close();
  console.log(fails ? `\nFAIL — ${fails} assertion(s)` : '\nOK — logo assets are sound');
  process.exit(fails ? 1 : 0);
})();
