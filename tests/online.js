// Two separate browsers play an online match on the live website, through the real connect server.
const { chromium } = require('playwright');
const URL = 'https://arcdental26-code.github.io/goat-world-cup/?t=' + Date.now();
(async () => {
  const b = await chromium.launch({channel: 'chrome'}); // the runner's own Chrome
  const mk = async (name) => {
    const p = await (await b.newContext()).newPage();
    p.on('console', m => console.log(name, 'console', m.type(), m.text()));
    p.on('pageerror', e => console.log(name, 'pageerror', String(e)));
    await p.goto(URL); await p.waitForTimeout(3000);
    await p.selectOption('#gfx', '2d'); await p.fill('#on-nick', name);
    console.log(name, 'online box visible:', await p.isVisible('#on-body'), 'Peer loaded:', await p.evaluate(() => typeof window.Peer));
    return p;
  };
  const A = await mk('Host'), B = await mk('Guest');
  await A.click('#on-make'); await A.waitForTimeout(5000);
  const st = await A.textContent('#on-status'); console.log('Host status:', st);
  const code = (st.match(/\d{4}/) || [''])[0];
  await B.fill('#on-code', code); await B.click('#on-join');
  for (let i = 0; i < 12; i++){
    await B.waitForTimeout(2500);
    const g = await B.evaluate(() => ({ov: !document.getElementById('ov').hidden && document.getElementById('ov-card').textContent, step: (document.getElementById('join-step')||{}).textContent}));
    const h = await A.evaluate(() => !document.getElementById('ov').hidden && document.getElementById('ov-card').textContent);
    console.log('t', i, 'guest:', JSON.stringify(g), '| host overlay:', JSON.stringify(h), '| host clock', await A.textContent('#sb-clock'));
  }
  await b.close();
})();
