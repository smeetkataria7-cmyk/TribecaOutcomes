const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('file://' + process.cwd() + '/index.html', { waitUntil: 'load' });

  // Scroll the whole page the way a visitor would.
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await p.waitForTimeout(1200);

  const stuck = await p.evaluate(() => {
    const bad = [];
    // Split headings assemble word by word; a stuck word is as bad as a
    // stuck block, so every .w span is checked too.
    document.querySelectorAll('.split .w').forEach(w => {
      if (parseFloat(getComputedStyle(w).opacity) < 0.99) bad.push('word: ' + w.textContent);
    });
    document.querySelectorAll('[data-reveal]').forEach(el => {
      const targets = el.hasAttribute('data-reveal-group') ? [...el.children] : [el];
      targets.forEach(t => {
        if (parseFloat(getComputedStyle(t).opacity) < 0.99)
          bad.push((t.className || t.tagName).toString().slice(0, 40));
      });
    });
    return bad;
  });
  console.log(stuck.length ? 'STUCK INVISIBLE after scroll:\n  ' + stuck.join('\n  ')
                           : 'OK — every revealed element reached full opacity after scrolling');

  // And with JS disabled, nothing may be hidden at all.
  const ctx2 = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto('file://' + process.cwd() + '/index.html', { waitUntil: 'load' });
  const hidden = await p2.evaluate(() => {
    let n = 0;
    document.querySelectorAll('[data-reveal], [data-reveal] > *, [data-split], .split .w').forEach(el => {
      if (parseFloat(getComputedStyle(el).opacity) < 0.99) n++;
    });
    return n;
  });
  console.log(hidden === 0 ? 'OK — nothing hidden with JavaScript disabled'
                           : `FAIL — ${hidden} element(s) hidden with JS off`);
  await b.close();
})();
