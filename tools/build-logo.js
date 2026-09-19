const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const uri = 'data:image/png;base64,' + fs.readFileSync(process.env.SG + '/images/3.png').toString('base64');
  await p.goto('about:blank');

  const out = await p.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, W, H).data;

    // The source already carries an alpha channel, so cropping is just the
    // bounding box of anything not fully transparent. No keying needed.
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    const pad = 2;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;

    const TARGET = 700;
    function build(navyToWhite) {
      const o = document.createElement('canvas');
      o.width = cw; o.height = ch;
      const og = o.getContext('2d');
      const px = og.createImageData(cw, ch);
      let navy = 0, orange = 0;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const si = ((y + y0) * W + (x + x0)) * 4;
        const di = (y * cw + x) * 4;
        const a = d[si + 3];
        if (a === 0) { px.data[di + 3] = 0; continue; }
        let r = d[si], gg = d[si + 1], bb = d[si + 2];
        const isNavy = bb > r;           // navy is blue-dominant, orange red-dominant
        if (isNavy) navy++; else orange++;
        if (navyToWhite && isNavy) { r = 255; gg = 255; bb = 255; }
        px.data[di] = r; px.data[di + 1] = gg; px.data[di + 2] = bb;
        px.data[di + 3] = a;             // alpha preserved exactly as authored
      }
      og.putImageData(px, 0, 0);

      const s2 = document.createElement('canvas');
      s2.width = TARGET;
      s2.height = Math.round(ch * (TARGET / cw));
      const sg = s2.getContext('2d');
      sg.imageSmoothingEnabled = true;
      sg.imageSmoothingQuality = 'high';
      sg.drawImage(o, 0, 0, s2.width, s2.height);

      // Confirm the export really is transparent where it should be.
      const check = sg.getImageData(0, 0, 1, 1).data[3];
      return { url: s2.toDataURL('image/png'), navy, orange, w: s2.width, h: s2.height, cornerAlpha: check };
    }
    const light = build(false), dark = build(true);
    return { cw, ch, light, dark };
  }, uri);

  fs.writeFileSync('assets/img/logo.png', Buffer.from(out.light.url.split(',')[1], 'base64'));
  fs.writeFileSync('assets/img/logo-on-dark.png', Buffer.from(out.dark.url.split(',')[1], 'base64'));
  console.log(`crop ${out.cw}x${out.ch} → export ${out.light.w}x${out.light.h}  aspect ${(out.cw / out.ch).toFixed(3)}`);
  console.log(`ink pixels: navy ${out.light.navy}, orange ${out.light.orange}`);
  console.log(`top-left alpha after export: ${out.light.cornerAlpha} (0 = transparent, correct)`);
  for (const f of ['assets/img/logo.png', 'assets/img/logo-on-dark.png'])
    console.log(' ', f, Math.round(fs.statSync(f).size / 1024) + 'KB');
  await b.close();
})();
