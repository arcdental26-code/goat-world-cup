// Two separate browsers play an online match on the live website, through the real connect server.
// The second run forces the relay route, which friends on different Wi-Fi need when a direct link is blocked.
const { chromium } = require('playwright');
const URL = 'https://arcdental26-code.github.io/goat-world-cup/?t=' + Date.now();
const RUNS = {
  direct: null,
  relay: 'force',   // pretend the Wi-Fi blocks a direct link, so the game must use the relay
};
(async () => {
  const b = await chromium.launch({channel: 'chrome'}); // the runner's own Chrome
  for (const [run, cfg] of Object.entries(RUNS)){
    const mk = async (name) => {
      const ctx = await b.newContext();
      if (cfg === 'force') await ctx.addInitScript(() => { window.FORCE_RELAY = 1; });
      const p = await ctx.newPage();
      p.on('pageerror', e => console.log(run, name, 'pageerror', String(e)));
      await p.goto(URL); await p.waitForTimeout(2500);
      await p.selectOption('#gfx', '2d'); await p.fill('#on-nick', name);
      return p;
    };
    const A = await mk('Host'), B = await mk('Guest');
    await A.click('#on-make'); await A.waitForTimeout(4000);
    const code = ((await A.textContent('#on-status')).match(/\d{4}/) || [''])[0];
    await B.fill('#on-code', code); await B.click('#on-join');
    let ok = false, g;
    for (let i = 0; i < 10 && !ok; i++){
      await B.waitForTimeout(2500);
      g = await B.evaluate(() => ({ov: !document.getElementById('ov').hidden && document.getElementById('ov-card').textContent, step: (document.getElementById('join-step')||{}).textContent}));
      ok = !g.ov && (await A.evaluate(() => document.getElementById('ov').hidden));
    }
    if (ok){ await B.waitForTimeout(6000); console.log(run, 'clocks after 6s: host', await A.textContent('#sb-clock'), 'guest', await B.textContent('#sb-clock')); }
    console.log('RESULT', run, ok ? 'CONNECTED' : 'FAILED', JSON.stringify(g));
    await A.context().close(); await B.context().close();
  }
  await b.close();
})();
