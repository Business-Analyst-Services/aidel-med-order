// Posts Playwright results back to each Jira story named in the test titles.
// For each story: a comment with pass/fail per test, screenshots attached,
// and a label tests-passed / tests-failed (used by the AIDEL "Approve Build" gate).
// Env: JIRA_BASE, JIRA_EMAIL, JIRA_API_TOKEN, RUN_URL, PREVIEW_URL, GIT_SHA
const fs = require('fs');
const path = require('path');

const { JIRA_BASE, JIRA_EMAIL, JIRA_API_TOKEN, RUN_URL = '', PREVIEW_URL = '', GIT_SHA = '' } = process.env;
if (!JIRA_BASE || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.log('Jira secrets not set - skipping report.');
  process.exit(0);
}
const auth = 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

function collect(suite, out = []) {
  for (const s of suite.suites || []) collect(s, out);
  for (const spec of suite.specs || []) {
    const m = spec.title.match(/\[(AIDEL-\d+)\]\[(REQ-\d+)\]\s*(.*)/);
    if (!m) continue;
    const ok = spec.tests.every((t) => t.results.every((r) => r.status === 'passed'));
    out.push({ key: m[1], req: m[2], title: m[3], ok });
  }
  return out;
}

const text = (t, marks) => ({ type: 'text', text: t, ...(marks ? { marks } : {}) });
const para = (...c) => ({ type: 'paragraph', content: c });
const link = (t, href) => text(t, [{ type: 'link', attrs: { href } }]);

async function jira(method, url, body, headers = {}) {
  const r = await fetch(JIRA_BASE + url, { method, headers: { Authorization: auth, Accept: 'application/json', ...headers }, body });
  if (!r.ok) console.error(method, url, r.status, await r.text());
  return r;
}

(async () => {
  const results = collect(JSON.parse(fs.readFileSync('results/results.json', 'utf8')));
  const byKey = results.reduce((a, r) => ((a[r.key] ||= []).push(r), a), {});

  for (const [key, tests] of Object.entries(byKey)) {
    const passed = tests.every((t) => t.ok);
    const items = tests.map((t) => ({
      type: 'listItem',
      content: [para(text(`${t.ok ? '✅ PASS' : '❌ FAIL'} · ${t.req} · ${t.title}`))],
    }));
    const doc = {
      type: 'doc', version: 1,
      content: [
        para(text(`Automated test run (${passed ? 'PASSED' : 'FAILED'})`, [{ type: 'strong' }])),
        { type: 'bulletList', content: items },
        para(
          text(`Commit ${GIT_SHA.slice(0, 7)} · `),
          ...(RUN_URL ? [link('Test run', RUN_URL), text(' · ')] : []),
          ...(PREVIEW_URL ? [link('Preview', PREVIEW_URL)] : []),
        ),
        para(text('Screenshots attached to this story.')),
      ],
    };
    await jira('POST', `/rest/api/3/issue/${key}/comment`, JSON.stringify({ body: doc }), { 'Content-Type': 'application/json' });

    // Screenshots
    for (const f of fs.readdirSync('screenshots').filter((f) => f.startsWith(key + '_'))) {
      const fd = new FormData();
      fd.append('file', new Blob([fs.readFileSync(path.join('screenshots', f))], { type: 'image/png' }), f);
      await jira('POST', `/rest/api/3/issue/${key}/attachments`, fd, { 'X-Atlassian-Token': 'no-check' });
    }

    // Label for the gate
    await jira('PUT', `/rest/api/3/issue/${key}`, JSON.stringify({
      update: { labels: [{ remove: passed ? 'tests-failed' : 'tests-passed' }, { add: passed ? 'tests-passed' : 'tests-failed' }] },
    }), { 'Content-Type': 'application/json' });
    console.log(`${key}: ${passed ? 'passed' : 'FAILED'} (${tests.length} tests)`);
  }
})();
