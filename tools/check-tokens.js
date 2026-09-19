#!/usr/bin/env node
/* Fails if any var(--token) used anywhere resolves to nothing.
   A dangling token is silent in CSS: the property is simply invalid and the
   element inherits, which is how a white button ended up with white text. */
const fs = require('fs'), path = require('path');

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.(css|html)$/.test(e.name)) files.push(f);
  }
})('.');

const tokensCss = fs.readFileSync('assets/css/tokens.css', 'utf8');
// Anywhere, not just line-start: several declarations often share a line.
const DECL = /(--[\w-]+)\s*:/g;
const defined = new Set([...tokensCss.matchAll(DECL)].map(m => m[1]));

// Locally-scoped custom properties, declared on a component rather than :root.
for (const f of files) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(DECL)) defined.add(m[1]);
}

let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8').split('\n');
  src.forEach((line, i) => {
    for (const m of line.matchAll(/var\(\s*(--[\w-]+)\s*(,|\))/g)) {
      if (m[2] === ',') continue;            // has a fallback, so it is safe
      if (!defined.has(m[1])) {
        console.error(`${f}:${i + 1}  undefined token ${m[1]}`);
        bad++;
      }
    }
  });
}
console.log(bad ? `\nFAIL — ${bad} dangling token reference(s)` : `OK — every var() resolves (${defined.size} tokens defined, ${files.length} files scanned)`);
process.exit(bad ? 1 : 0);
