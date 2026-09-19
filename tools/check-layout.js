#!/usr/bin/env node
/* Layout assertions that are easy to break by eye:
   - the hero headline occupies exactly one line on desktop widths
   - the five people sit on a single row on desktop
   - nav sits to the right of the logo
   - nothing overflows horizontally at any tested width */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
let fails = 0;
const check = (n, got, want) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ deviceScaleFactor: 1 });
  const p = await ctx.newPage();

  for (const w of [1920, 1440, 1280, 1024, 820, 768]) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.goto('file://' + process.cwd() + '/index.html', { waitUntil: 'load' });
    await p.waitForTimeout(700);           // webfont
    const r = await p.evaluate(() => {
      const h = document.querySelector('.hero__title');
      const cs = getComputedStyle(h);
      const lines = Math.round(h.getBoundingClientRect().height / parseFloat(cs.lineHeight));
      const fits = h.scrollWidth <= Math.ceil(h.clientWidth) + 1;
      return { lines, fits, size: Math.round(parseFloat(cs.fontSize)) };
    });
    check(`hero headline is 1 line @ ${w}px (${r.size}px type)`, r.lines, 1);
    check(`hero headline not clipped @ ${w}px`, r.fits, true);
  }

  // Team on one row, and nav to the right of the logo.
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('file://' + process.cwd() + '/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(400);
  const rows = await p.evaluate(() =>
    new Set([...document.querySelectorAll('.team-card')].map(e => Math.round(e.getBoundingClientRect().top))).size);
  check('all five people on one row @ 1440px', rows, 1);

  const navRight = await p.evaluate(() => {
    const brand = document.querySelector('.brand').getBoundingClientRect();
    const nav = document.querySelector('.header-right .nav').getBoundingClientRect();
    const toggle = document.querySelector('[data-theme-toggle]').getBoundingClientRect();
    return { afterBrand: nav.left > brand.right, rightHalf: nav.left > window.innerWidth / 2, toggleLast: toggle.left > nav.left };
  });
  check('nav sits right of the logo', navRight.afterBrand, true);
  check('nav sits in the right half', navRight.rightHalf, true);
  check('theme control is right-most', navRight.toggleLast, true);

  // Column heading rules must all land on the same y, whatever the wrap.
  for (const [label, sel] of [['who we work with', '#who-we-work-with'], ['what we do', '#what-we-do']]) {
    const ys = await p.evaluate((sel) =>
      [...document.querySelectorAll(sel + ' .col-heading')]
        .map(e => Math.round(e.getBoundingClientRect().bottom)), sel);
    check(`${label}: column rules share one baseline (${ys.join(', ')})`, new Set(ys).size, 1);
  }

  // No horizontal overflow anywhere.
  for (const w of [1920, 1440, 1024, 820, 600, 390, 360]) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.goto('file://' + process.cwd() + '/index.html', { waitUntil: 'load' });
    const of = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`no horizontal overflow @ ${w}px`, of, 0);
  }

  await b.close();
  console.log(fails ? `\nFAIL — ${fails} assertion(s)` : '\nOK — layout assertions hold');
  process.exit(fails ? 1 : 0);
})();
