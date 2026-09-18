const { chromium } = require('/opt/node22/lib/node_modules/playwright');

// Strings on contact.html that DO come from the client's supplied copy.
const supplied = [
  "Stay in touch.",
  "Accomplished professionals who understand access issues and develop practical solutions to deliver value and evidence as needed.",
  "Questions?",
  "TribecaOutcomes",
  "100 Claremont Ave,",
  "New York, NY 10027",
  "Phone",
  "(917) 558-0621",
  "Contact us",
  // Nav labels, now matching the live site rather than page section headings.
  "Home", "Contact",
  "Need a synopsis in 24 hours?",
  "Need a study design and protocol drafted in 3 days?",
  "Need a manuscript in a pinch?",
  "Want to begin recruiting patients in a week?",
  "TribecaOutcomes can do it! We are doers with strategic acumen who get projects done right—without the excessive fees charged by traditional consultants and CROs.",
];
const norm = s => s.replace(/\s+/g, ' ').trim();

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/contact.html', { waitUntil: 'load' });
  await p.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-visible')));

  const rendered = norm(await p.evaluate(() => document.body.innerText));
  const missing = supplied.filter(s => !rendered.includes(norm(s)));
  console.log(missing.length === 0
    ? `SUPPLIED-STRING CHECK: all ${supplied.length} present and unaltered`
    : 'FAILED — missing:\n' + missing.map(m => '  · ' + m).join('\n'));

  const set = new Set(supplied.map(norm));
  const onPage = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('h1,h2,h3,h4,p,li,span,a,address,label,button').forEach(el => {
      if (el.querySelector('h1,h2,h3,h4,p,li,address,label,button')) return;
      const t = el.innerText && el.innerText.replace(/\s+/g, ' ').trim();
      if (t) out.push(t);
    });
    return out;
  });
  console.log('\nNON-SUPPLIED TEXT ON contact.html:');
  [...new Set(onPage)].filter(t => !set.has(t)).forEach(t => console.log('  · ' + JSON.stringify(t)));

  // Accessibility: every control must have an accessible name.
  const unlabelled = await p.evaluate(() => {
    const bad = [];
    document.querySelectorAll('input, textarea, select').forEach(el => {
      const lab = el.labels && el.labels.length ? el.labels[0].innerText.trim() : null;
      if (!lab && !el.getAttribute('aria-label')) bad.push(el.name || el.id || el.type);
    });
    return bad;
  });
  console.log('\nform controls without a label: ' + (unlabelled.length ? unlabelled.join(', ') : 'none'));

  for (const [name, w] of [['desktop', 1440], ['mobile', 390]]) {
    await p.setViewportSize({ width: w, height: 900 });
    const of = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`${name} horizontal overflow: ${of}px`);
  }

  // Internal links must resolve to real files.
  const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')));
  const fs = require('fs');
  const broken = [...new Set(hrefs)]
    .filter(h => h && !/^(#|https?:|tel:|mailto:)/.test(h))
    .map(h => h.split('#')[0])
    .filter(f => f && !fs.existsSync(f));
  console.log('broken internal links: ' + (broken.length ? broken.join(', ') : 'none'));
  console.log(errs.length ? 'JS ERRORS: ' + errs.join(' | ') : 'no JS errors');
  await b.close();
})();
