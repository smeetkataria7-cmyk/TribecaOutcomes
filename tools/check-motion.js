#!/usr/bin/env node
/* Motion must always settle and must always be optional.
   Guards: nothing left translated/scaled off its resting position after a
   scroll-through, reduced-motion disables the lot, and the progress bar
   tracks scroll. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
let fails = 0;
const check = (n, got, want) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};
const URL = () => 'file://' + process.cwd() + '/index.html';

const scrollThrough = p => p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 350) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 55));
  }
  window.scrollTo(0, document.body.scrollHeight);
});

(async () => {
  const b = await chromium.launch();

  // --- Normal motion -----------------------------------------------------
  let ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  let p = await ctx.newPage();
  await p.goto(URL(), { waitUntil: 'load' });
  await scrollThrough(p);
  await p.waitForTimeout(1600);

  const unsettled = await p.evaluate(() => {
    const bad = [];
    const sel = '.reasons > li, .question-list > li, .team-grid > *, [data-reveal], [data-reveal] > *, .split .w';
    document.querySelectorAll(sel).forEach(el => {
      const t = getComputedStyle(el).transform;
      if (t && t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)') {
        // Tolerate hover-free resting states that are legitimately identity-ish.
        const m = t.match(/matrix\(([^)]+)\)/);
        if (!m) return;
        const [a, b2, c, d, e, f] = m[1].split(',').map(Number);
        if (Math.abs(a - 1) > 0.01 || Math.abs(d - 1) > 0.01 || Math.abs(e) > 0.5 || Math.abs(f) > 0.5)
          bad.push(`${(el.className || el.tagName).toString().slice(0, 32)} → ${t}`);
      }
    });
    return bad;
  });
  check('every animated element settles to its resting transform', unsettled.length, 0);
  if (unsettled.length) unsettled.slice(0, 6).forEach(u => console.log('    ' + u));

  const prog = await p.evaluate(() => {
    const bar = document.querySelector('[data-progress]');
    return bar ? parseFloat(getComputedStyle(bar).getPropertyValue('--p')) : -1;
  });
  check('progress bar reads ~1 at the bottom of the page', prog > 0.95, true);

  // behavior:'instant' because base.css sets scroll-behavior: smooth on <html>,
  // so a plain scrollTo animates and the bar is still mid-travel when sampled.
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await p.waitForTimeout(400);
  const progTop = await p.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector('[data-progress]')).getPropertyValue('--p')));
  check('progress bar reads ~0 at the top', progTop < 0.05, true);
  await ctx.close();

  // --- Reduced motion ----------------------------------------------------
  ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  p = await ctx.newPage();
  await p.goto(URL(), { waitUntil: 'load' });
  await p.waitForTimeout(500);

  const reduced = await p.evaluate(() => {
    const hidden = [...document.querySelectorAll('[data-reveal], [data-reveal] > *, [data-split]')]
      .filter(el => parseFloat(getComputedStyle(el).opacity) < 0.99).length;
    // Under reduced motion the splitter must not run at all.
    const wordSpans = document.querySelectorAll('.split .w').length;
    const heroImg = document.querySelector('.hero__media img');
    const anim = getComputedStyle(heroImg).animationName;
    return { hidden, anim, wordSpans, bar: !!document.querySelector('[data-progress]') };
  });
  check('reduced motion: nothing hidden', reduced.hidden, 0);
  check('reduced motion: headings are not word-split', reduced.wordSpans, 0);
  check('reduced motion: hero ken-burns disabled', reduced.anim, 'none');
  check('reduced motion: progress bar removed', reduced.bar, false);
  await ctx.close();

  await b.close();
  console.log(fails ? `\nFAIL — ${fails} assertion(s)` : '\nOK — motion settles and is fully optional');
  process.exit(fails ? 1 : 0);
})();
