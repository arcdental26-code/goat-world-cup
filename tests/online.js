// Two separate browsers play an online match on the live website, through the real connect server.
// Each run also forces the "relay" route, which is what friends on different Wi-Fi need when a direct link is blocked.
const { chromium } = require('playwright');
const URL = 'https://arcdental26-code.github.io/goat-world-cup/?t=' + Date.now();
const RUNS = {
  normal: null,
  relayPeerjs: {iceTransportPolicy: 'relay', iceServers: [{urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp'}]},
  relayOpenRelay: {iceTransportPolicy: 'relay', iceServers: [{urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject'}]},
  relayGameConfig: 'game',
};
(async () => {
  const b = await chromium.launch({channel: 'chrome'}); // the runner's own Chrome
  for (const [run, cfg] of Object.entries(RUNS)){
    const mk = async (name) => {
      const ctx = await b.newContext();
      if (cfg === 'game') await ctx.addInitScript(() => { window.FORCE_RELAY = 1; });
      else if (cfg) await ctx.addInitScript(c => { window.PEER_OPTS = {config: c}; }, cfg);
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
    console.log('RESULT', run, ok ? 'CONNECTED' : 'FAILED', JSON.stringify(g));
    await A.context().close(); await B.context().close();
  }
  await b.close();
})();
