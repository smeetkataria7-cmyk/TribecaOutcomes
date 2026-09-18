const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');

// Exact strings from the client's supplied copy, normalised the same way both sides.
const expected = [
  "Serving Pharmaceutical Companies:",
  "Health Economics and Outcomes Research (HEOR)",
  "Real World Evidence Studies (RWE)",
  "Real World Data (RWD)",
  "Clinical Development Services",
  "Accomplished professionals who understand access issues and develop practical solutions to deliver value and evidence as needed.",
  "Who we work with",
  "Outcomes",
  "HEOR", "Health Economists", "Medical Affairs", "Pharmacovigilance",
  "RWE/RWD Partnerships", "Value and Evidence",
  "Commercial",
  "National Accounts", "Market Access", "Marketing Analytics", "Business Insights",
  "Financial Forecasting", "Patient Journey Mapping",
  "Clinical Development",
  "Clinical Operations", "Clinical Innovation", "Clinical Project Management",
  "Clinical Trial Optimization", "Patient Recruitment & Retention", "Patient Engagement",
  "HEOR, RWE, RWD and Patient Recruitment",
  "Pharmaceutical industry know-how second to none",
  "What we do",
  "Outcomes and Commercial",
  "Conceive study designs", "Draft synopses and protocols", "Produce retrospective analyses",
  "Execute in-market pragmatic studies", "Offer payer and electronic health record data",
  "Complete comparative effectiveness studies",
  "10-year patient journeys (inpatient and outpatient)",
  "Clinical trial patient recruitment",
  "Specimen collection (any type), global",
  "30 clinics in the NYC area ready for activation",
  "Why work with TribecaOutcomes?",
  "Deep industry knowledge with tremendous competence in RWE/RWD and patient recruitment",
  "We know how to mitigate friction; so, we offer incredible efficiency, low fees and optimal output",
  "High level of trustworthiness including complete transparency about what to expect and when",
  "Urgency to activate quickly and to complete projects as promised or sooner",
  "We have completed and published over 100 studies, including groundbreaking decentralized studies.",
  "Need a synopsis in 24 hours?",
  "Need a study design and protocol drafted in 3 days?",
  "Need a manuscript in a pinch?",
  "Want to begin recruiting patients in a week?",
  "TribecaOutcomes can do it! We are doers with strategic acumen who get projects done right—without the excessive fees charged by traditional consultants and CROs.",
  "Lou Sanquini", "Founder & President",
  "Who are we?",
  "Rajesh Mehta", "Chief Scientific Officer",
  "Jeannine Sumba", "Chief Operations Officer",
  "Yashvi Vardhan", "Medical Director",
  "Sandeep Bhat", "Chief Digital & Clinical Strategy Advisor",
  "Stay in touch.",
  "TribecaOutcomes",
  "100 Claremont Ave,",
  "New York, NY 10027",
  "Phone",
  "(917) 558-0621",
  "Questions?",
  "Contact us",
];

const norm = s => s.replace(/\s+/g, ' ').trim();

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/index.html', { waitUntil: 'load' });
  await p.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-visible')));

  const rendered = norm(await p.evaluate(() => document.body.innerText));

  let missing = expected.filter(s => !rendered.includes(norm(s)));
  console.log(missing.length === 0
    ? `VERBATIM CHECK: all ${expected.length} source strings present in rendered page`
    : 'VERBATIM CHECK FAILED — missing:\n' + missing.map(m => '  · ' + m).join('\n'));

  // Reverse direction: what text is on the page that the client did NOT supply?
  const supplied = new Set(expected.map(norm));
  const onPage = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('h1,h2,h3,h4,p,li,span,a,address,cite').forEach(el => {
      if (el.querySelector('h1,h2,h3,h4,p,li,address')) return; // leaf nodes only
      const t = el.innerText && el.innerText.replace(/\s+/g, ' ').trim();
      if (t) out.push(t);
    });
    return out;
  });
  const extra = [...new Set(onPage)].filter(t => !supplied.has(t));
  console.log('\nTEXT ON PAGE NOT IN SUPPLIED COPY (must be chrome/structure only):');
  extra.forEach(t => console.log('  · ' + JSON.stringify(t)));

  for (const [name, w] of [['desktop', 1440], ['mobile', 390]]) {
    await p.setViewportSize({ width: w, height: 900 });
    const of = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`\n${name} horizontal overflow: ${of}px`);
  }
  console.log(errs.length ? 'JS ERRORS: ' + errs.join(' | ') : 'no JS errors');
  await b.close();
})();
