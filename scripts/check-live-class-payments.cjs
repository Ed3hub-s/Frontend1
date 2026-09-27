// Local browser regression checks with mocked Paystack/backend responses.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CLASSROOM_TEST_PLAYWRIGHT || 'playwright');
const base = process.env.CLASSROOM_TEST_URL || 'http://localhost:3100';

async function scenario(browser, callback) {
  const context = await browser.newContext();
  const page = await context.newPage();
  let active = false;
  let checks = 0;
  let checkouts = 0;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.addInitScript(() => localStorage.setItem('access_token', 'test-session'));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/me/') return route.fulfill({ json: { id: 2, role: 'learner', username: 'student' } });
    if (url.pathname.endsWith('/paid-test/verify-payment/')) {
      checks++;
      assert.equal(route.request().postDataJSON().reference, 'LC-test');
      if (checks === 1) return route.fulfill({ status: 400, json: { detail: 'Payment pending' } });
      active = true;
      return route.fulfill({ json: { access_status: 'active' } });
    }
    if (url.pathname.endsWith('/paid-test/register/')) {
      checkouts++;
      return route.fulfill({ json: { checkout: { authorization_url: 'https://checkout.paystack.com/test' } } });
    }
    if (url.pathname === '/api/live-classes/paid-test/') return route.fulfill({ json: {
      id: 1, slug: 'paid-test', title: 'Paid test class', description: 'Test',
      educator: { id: 1, name: 'Teacher', avatar: null }, category: 'Technology', level: 'beginner',
      starts_at: new Date().toISOString(), duration_minutes: 60, capacity: 10, available_spaces: 9,
      access_type: 'paid', price: '2500.00', currency: 'NGN', status: 'published',
      is_joinable: true, viewer_access_status: active ? 'active' : callback ? 'pending' : null,
    } });
    if (url.pathname.endsWith('/recordings/')) return route.fulfill({ json: [] });
    if (url.hostname === 'checkout.paystack.com') return route.fulfill({ contentType: 'text/html', body: '<p>Simulated checkout</p>' });
    if (url.pathname.startsWith('/api/')) return route.fulfill({ json: {} });
    if (url.origin !== base) return route.abort();
    return route.continue();
  });
  await page.goto(`${base}/live-classes/paid-test${callback ? '?payment=verify&reference=LC-test' : ''}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  if (callback) {
    await page.getByRole('status').filter({ hasText: 'could not confirm' }).waitFor();
    assert.equal(checks, 1);
    assert.equal(await page.getByRole('link', { name: 'Join classroom' }).count(), 0);
    await page.getByRole('button', { name: 'Check payment', exact: true }).click();
    await page.getByRole('link', { name: 'Join classroom' }).waitFor();
    await page.waitForURL(`${base}/live-classes/paid-test`);
    assert.equal(checks, 2);
    assert.equal(checkouts, 0);
    console.log('PASS: pending callback, explicit retry, confirmed access, callback cleared');
  } else {
    await page.getByRole('button', { name: /Buy access/ }).click();
    await page.waitForURL('https://checkout.paystack.com/test');
    assert.equal(checkouts, 1);
    console.log('PASS: paid class opens backend-provided hosted checkout');
  }
  assert.deepEqual(errors, []);
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try { await scenario(browser, false); await scenario(browser, true); }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
