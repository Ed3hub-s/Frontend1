// Run against a local Next dev server. Uses fake API/SDK responses: validates
// initialization, default UI, retries and cleanup, not real WebRTC transmission.
// CLASSROOM_TEST_PLAYWRIGHT can point to an existing playwright-core installation.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CLASSROOM_TEST_PLAYWRIGHT || 'playwright');
const base = process.env.CLASSROOM_TEST_URL || 'http://localhost:3100';

const fakeSdk = `
window.classroomChecks = { inits: [], leaves: 0 };
customElements.define('rtk-meeting', class extends HTMLElement {});
window.RealtimeKitClient = { init: async (options) => {
  window.classroomChecks.inits.push(options);
  if (window.delayClassroomInit) await new Promise(resolve => { window.resolveClassroomInit = resolve; });
  return {
    self: { on() {}, removeListener() {} },
    leave: async () => { window.classroomChecks.leaves++; },
  };
} };
`;

async function scenario(browser, { failFirst = false, delayInit = false } = {}) {
  const context = await browser.newContext();
  const page = await context.newPage();
  let joins = 0;
  let sdkLoads = 0;
  const attendanceClosed = [];
  let resolveAttendance;
  const allAttendanceClosed = new Promise(resolve => { resolveAttendance = resolve; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.addInitScript(({ delayInit }) => {
    localStorage.setItem('access_token', 'local-test-token');
    window.delayClassroomInit = delayInit;
  }, { delayInit });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/me/') {
      return route.fulfill({ json: { id: 2, role: 'learner', username: 'student', first_name: 'Test', last_name: 'Student' } });
    }
    if (url.pathname.endsWith('/classroom-check/join/')) {
      joins++;
      return route.fulfill({ json: { auth_token: 'participant-test-token', attendance_id: joins, meeting_id: 'shared-room', role: 'learner' } });
    }
    if (url.pathname.endsWith('/classroom-check/leave/')) {
      attendanceClosed.push(route.request().postDataJSON().attendance_id);
      if (attendanceClosed.length === (failFirst ? 2 : 1)) resolveAttendance();
      return route.fulfill({ json: { status: 'ok' } });
    }
    if (url.pathname === '/api/live-classes/classroom-check/') return route.fulfill({ status: 404, json: {} });
    if (url.href.includes('@cloudflare/realtimekit@')) {
      sdkLoads++;
      if (failFirst && sdkLoads === 1) return route.abort('failed');
      return route.fulfill({ contentType: 'application/javascript', body: fakeSdk });
    }
    if (url.origin !== base && !url.pathname.startsWith('/api/')) return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({ json: {} });
    return route.continue();
  });
  await page.goto(`${base}/live-classes/classroom/classroom-check`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  if (failFirst) {
    await page.getByRole('heading', { name: 'Classroom unavailable' }).waitFor();
    await page.waitForFunction(() => !document.querySelector('script[src*="@cloudflare/realtimekit@"]'));
    await page.getByRole('button', { name: 'Retry classroom' }).click();
  }
  if (delayInit) {
    await page.waitForFunction(() => !!window.resolveClassroomInit);
    await page.getByRole('link', { name: 'Class details' }).click();
    await page.waitForURL(`${base}/live-classes/classroom-check`);
    await page.evaluate(() => window.resolveClassroomInit());
  } else {
    await page.locator('rtk-meeting').waitFor({ state: 'attached' });
    const configuration = await page.locator('rtk-meeting').evaluate(element => ({
      fullLayout: element.loadConfigFromPreset === false,
      setup: element.showSetupScreen,
      ownsCleanup: element.leaveOnUnmount === false,
      options: window.classroomChecks.inits[0],
    }));
    assert.equal(configuration.fullLayout, true);
    assert.equal(configuration.setup, true);
    assert.equal(configuration.ownsCleanup, true);
    assert.deepEqual(configuration.options, { authToken: 'participant-test-token', defaults: { audio: false, video: false } });
    await page.getByRole('link', { name: 'Class details' }).click();
    await page.waitForURL(`${base}/live-classes/classroom-check`);
  }
  await page.waitForFunction(() => window.classroomChecks.leaves === 1);
  const timeout = setTimeout(() => resolveAttendance(), 10000);
  await allAttendanceClosed;
  clearTimeout(timeout);
  assert.equal(joins, failFirst ? 2 : 1, 'Strict Mode must not authorize a duplicate join');
  assert.deepEqual(attendanceClosed, failFirst ? [1, 2] : [1]);
  assert.deepEqual(errors, []);
  console.log(`PASS: ${delayInit ? 'navigation during SDK initialization' : failFirst ? 'SDK failure, retry, and cleanup' : 'one join, full UI, devices off, and cleanup'}`);
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    await scenario(browser);
    await scenario(browser, { failFirst: true });
    await scenario(browser, { delayInit: true });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
