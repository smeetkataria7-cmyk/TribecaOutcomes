#!/usr/bin/env node
/* Behavioural test for the System/Light/Dark control.
   The regression it exists to catch: writing a stored preference on first
   load, which silently pins the theme and stops it following the OS. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const URL = 'file://' + process.cwd() + '/index.html';
let fails = 0;

function check(name, got, want) {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
}

const isDark = p => p.evaluate(() => {
  const c = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number);
  return (c[0] + c[1] + c[2]) / 3 < 128;
});
const state = p => p.evaluate(() => ({
  attr: document.documentElement.getAttribute('data-theme'),
  stored: (() => { try { return localStorage.getItem('theme'); } catch (e) { return 'ERR'; } })(),
  mode: document.querySelector('[data-theme-toggle]').getAttribute('data-mode'),
  label: document.querySelector('[data-theme-toggle]').getAttribute('aria-label'),
}));

(async () => {
  const b = await chromium.launch();

  // 1. First ever visit, OS dark.
  let ctx = await b.newContext({ colorScheme: 'dark' });
  let p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' });
  let s = await state(p);
  check('fresh visit / OS dark  → follows OS (dark)', await isDark(p), true);
  check('fresh visit           → no data-theme pinned', s.attr, null);
  check('fresh visit           → nothing written to storage', s.stored, null);
  check('fresh visit           → button reads System', s.mode, 'system');
  check('system label names the resolved theme', /System \(Dark\)/.test(s.label), true);
  await ctx.close();

  // 2. First ever visit, OS light.
  ctx = await b.newContext({ colorScheme: 'light' });
  p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' });
  check('fresh visit / OS light → follows OS (light)', await isDark(p), false);
  await ctx.close();

  // 3. OS flips while the page is open, with no explicit choice made.
  ctx = await b.newContext({ colorScheme: 'light' });
  p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' });
  await p.emulateMedia({ colorScheme: 'dark' });
  await p.waitForTimeout(120);
  check('OS flips live on System → page follows', await isDark(p), true);
  check('OS flips live on System → label updates', /System \(Dark\)/.test((await state(p)).label), true);
  await ctx.close();

  // 4. Cycling through all three modes.
  ctx = await b.newContext({ colorScheme: 'dark' });
  p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' });
  await p.click('[data-theme-toggle]');
  check('click 1 → Light', (await state(p)).mode, 'light');
  check('click 1 → renders light', await isDark(p), false);
  await p.click('[data-theme-toggle]');
  check('click 2 → Dark', (await state(p)).mode, 'dark');
  check('click 2 → renders dark', await isDark(p), true);
  await p.click('[data-theme-toggle]');
  s = await state(p);
  check('click 3 → back to System', s.mode, 'system');
  check('click 3 → storage key removed', s.stored, null);
  check('click 3 → follows OS dark again', await isDark(p), true);

  // 5. An explicit choice survives a reload and overrides the OS.
  await p.click('[data-theme-toggle]');           // → light, while OS is dark
  await p.reload({ waitUntil: 'load' });
  check('explicit Light persists over OS dark', await isDark(p), false);
  check('explicit Light persists in storage', (await state(p)).stored, 'light');

  // 6. Explicit choice must NOT follow the OS.
  await p.emulateMedia({ colorScheme: 'light' });
  await p.emulateMedia({ colorScheme: 'dark' });
  await p.waitForTimeout(120);
  check('explicit Light ignores OS flip', await isDark(p), false);
  await ctx.close();

  await b.close();
  console.log(fails ? `\nFAIL — ${fails} assertion(s)` : '\nOK — theme control behaves correctly');
  process.exit(fails ? 1 : 0);
})();
