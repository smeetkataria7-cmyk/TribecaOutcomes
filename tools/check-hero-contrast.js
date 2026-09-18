const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('file://' + process.cwd() + '/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(400);

  // Boxes of the white text we care about.
  const boxes = await p.evaluate(() => {
    const sel = ['.hero--image .hero__title', '.hero--image .list-lead li', '.hero--image .lede'];
    const out = [];
    sel.forEach(s => document.querySelectorAll(s).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 4 && r.height > 4 && r.top < 900)
        out.push({ sel: s, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
    }));
    return out;
  });

  // Hide the text, keep photo + scrim, then sample what sits behind it.
  await p.evaluate(() => {
    document.querySelectorAll('.hero--image .container').forEach(e => e.style.visibility = 'hidden');
  });
  const shot = await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } });
  const bg = 'data:image/png;base64,' + shot.toString('base64');

  const results = await p.evaluate(async ({ bg, boxes }) => {
    const img = new Image(); img.src = bg; await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = (r, gg, b) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
    return boxes.map(bx => {
      const d = g.getImageData(bx.x, bx.y, Math.min(bx.w, c.width - bx.x), Math.min(bx.h, c.height - bx.y)).data;
      let worst = 21, lightest = 0;
      for (let i = 0; i < d.length; i += 4) {
        const l = L(d[i], d[i+1], d[i+2]);
        const ratio = 1.05 / (l + 0.05);       // white text vs this pixel
        if (ratio < worst) worst = ratio;
        if (l > lightest) lightest = l;
      }
      return { sel: bx.sel, y: bx.y, worst: +worst.toFixed(2) };
    });
  }, { bg, boxes });

  results.forEach(r => {
    const tag = r.worst >= 4.5 ? 'AA' : r.worst >= 3 ? 'AA-large only' : 'FAIL';
    console.log(`${r.sel.padEnd(34)} y=${String(r.y).padEnd(4)} worst-pixel contrast ${String(r.worst).padStart(5)}  ${tag}`);
  });
  await b.close();
})();
