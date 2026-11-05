
(() => {
  'use strict';

  /* ───────── signature settings ───────── */
  const HINT = {
    label: 900,    // "Sign here" shown alone before the hint starts
    draw1: 3600,   // main signature stroke
    lift:  350,    // finger lifts and moves to the underline
    draw2: 1000,   // underline stroke
    hold:  1400,   // finished signature stays on screen
    out:   600,    // fade out / "Sign here" returns
    rest:  500     // pause before it loops
  };

  // Copy shown above the device. 
  const COPY = {
    tap:      'Click the card reader to simulate a tap.',
    hintLead: 'Showing the motion of signing encourages guests to sign.',
    hintBody: 'No more “where do I sign?” moments. Guests who don’t realize a signature is expected, ' +
              'like international visitors, older guests, or anyone who’s had a drink, ' +
              'get a cue that needs no translation.',
    hintOff:  'Hint is off, so this is how the screen behaves today.',
    done:     'End of demo. Thanks for watching.'
  };

  // pos values
  const SUBTOTAL = 15;                                  
  const DEFAULT_TIP = 20;                                
  const LOGO_CANDIDATES = ['assets/toast-logo.svg', 'assets/toast-logo.png'];

  /* ───────── helpers + elements ───────── */
  const $ = s => document.querySelector(s);
  const root = document.documentElement;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const money = n => '$' + n.toFixed(2);

  const stage = $('#stage');
  const payLayer = $('#payLayer'), tipLayer = $('#tipLayer'), doneLayer = $('#doneLayer');
  const reader = $('#reader'), payPrompt = $('#payPrompt');
  const totalLine = $('#totalLine');
  const tipBtns = [...document.querySelectorAll('.tbtn[data-pct]')];
  const continueBtn = $('#continueBtn'), snack = $('#snack');
  const hintToggle = $('#hintToggle'), caption = $('#caption');
  const stepEls = [...document.querySelectorAll('#steps li')];

  let step = 1, busy = false, hintOn = true, tipPct = null;

  /* ───────── logo slot on the device chin ───────── */
  (function loadLogo(){
    const chin = $('#chin'), img = $('#chinLogo');
    let i = 0;
    const next = () => { if (i < LOGO_CANDIDATES.length) img.src = LOGO_CANDIDATES[i++]; };
    img.addEventListener('load', () => chin.classList.add('has-logo'));
    img.addEventListener('error', next);
    next();
  })();

  /* ───────── fits device to window ───────── */
  let inkScale = 1;
  function fit(){
    const r = stage.getBoundingClientRect(), pad = 24;
    const s = Math.max(.2, Math.min((r.height - pad) / 956, (r.width - pad) / 494, 1.3));
    root.style.setProperty('--s', s.toFixed(4));
    inkScale = Math.max(1, s);
    resizeCanvas();
  }
  new ResizeObserver(fit).observe(stage);        

  /* ───────── progress pills + caption ───────── */
  function setStep(n){
    step = n;
    stepEls.forEach(li => {
      const i = +li.dataset.step;
      li.classList.toggle('on', i === n);
      li.classList.toggle('done', i < n);
    });
    updateCaption();
  }
  function updateCaption(){
    if (step === 2 && hintOn){
      caption.innerHTML = `<div class="in"><strong>${COPY.hintLead}</strong>${COPY.hintBody}</div>`;
    } else {
      const text = step === 1 ? COPY.tap : step === 2 ? COPY.hintOff : COPY.done;
      caption.innerHTML = `<div class="in">${text}</div>`;
    }
  }

  /* ───────── tip buttons ───────── */
  tipBtns.forEach(b => {
    const p = +b.dataset.pct;
    if (p > 0) b.innerHTML = `<b>${p}%</b><span>${money(SUBTOTAL * p / 100)}</span>`;
  });
  // A tip choice (including "No tip") is always selected. Tapping another one switches it; nothing clears it.
  function selectTip(p){
    tipPct = p;
    tipBtns.forEach(b => b.classList.toggle('sel', +b.dataset.pct === p));
    if (p){
      const tip = SUBTOTAL * p / 100;
      totalLine.innerHTML = `Total: ${money(SUBTOTAL + tip)} <span class="dim">(${money(SUBTOTAL)} + ${money(tip)} tip)</span>`;
    } else {
      totalLine.textContent = `Total: ${money(SUBTOTAL)}`;
    }
    updateContinue();
  }
  tipBtns.forEach(b => b.addEventListener('click', () => selectTip(+b.dataset.pct)));

  // Continue needs BOTH a signature and a tip choice.
  function updateContinue(){
    const ok = signed && tipPct !== null;
    continueBtn.disabled = !ok;
    continueBtn.classList.toggle('enabled', ok);
  }

  let snackT;
  $('#customTip').addEventListener('click', () => {
    snack.classList.add('show'); clearTimeout(snackT);
    snackT = setTimeout(() => snack.classList.remove('show'), 1800);
  });

  /* ───────── signature pad ───────── */
  const pad = $('#pad'), ctx = pad.getContext('2d');
  const PW = 402, PH = 236;                    // logical size, matches the CSS
  let strokes = [], cur = null, inkLen = 0, signed = false;

  function resizeCanvas(){
    const k = inkScale * (window.devicePixelRatio || 1);
    pad.width = Math.round(PW * k); pad.height = Math.round(PH * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    redraw();
  }
  function inkStyle(){
    ctx.strokeStyle = ctx.fillStyle = '#f4f4f7';
    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }
  function redraw(){
    ctx.clearRect(0, 0, PW, PH); inkStyle();
    for (const s of strokes){
      if (s.length === 1){ ctx.beginPath(); ctx.arc(s[0].x, s[0].y, 1.3, 0, 7); ctx.fill(); continue; }
      ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length - 1; i++){
        ctx.quadraticCurveTo(s[i].x, s[i].y, (s[i].x + s[i+1].x) / 2, (s[i].y + s[i+1].y) / 2);
      }
      ctx.lineTo(s[s.length-1].x, s[s.length-1].y); ctx.stroke();
    }
  }
  function drawTail(s, final){
    const n = s.length; inkStyle(); ctx.beginPath();
    if (n === 2){ ctx.moveTo(s[0].x, s[0].y); ctx.lineTo(s[1].x, s[1].y); }
    else if (n >= 3){
      const a = s[n-3], b = s[n-2], c = s[n-1];
      ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
      if (final) ctx.lineTo(c.x, c.y);
    } else return;
    ctx.stroke();
  }
  function pt(e){
    const r = pad.getBoundingClientRect();
    return { x: (e.clientX - r.left) * PW / r.width, y: (e.clientY - r.top) * PH / r.height };
  }

  pad.addEventListener('pointerdown', e => {
    if (step !== 2) return;
    e.preventDefault();
    pad.setPointerCapture(e.pointerId);
    stopHint();                                 
    cur = [pt(e)]; strokes.push(cur);
    inkStyle(); ctx.beginPath(); ctx.arc(cur[0].x, cur[0].y, 1.3, 0, 7); ctx.fill();
  });
  pad.addEventListener('pointermove', e => {
    if (!cur) return;
    const p = pt(e), l = cur[cur.length - 1];
    const d = Math.hypot(p.x - l.x, p.y - l.y);
    if (d < 1) return;
    inkLen += d; cur.push(p); drawTail(cur, false);
    if (!signed && inkLen > 30){                // enough ink to count as a signature
      signed = true; updateContinue();
    }
  });
  const endStroke = () => { if (cur){ drawTail(cur, true); cur = null; } };
  pad.addEventListener('pointerup', endStroke);
  pad.addEventListener('pointercancel', endStroke);

  function clearInk(){
    strokes = []; cur = null; inkLen = 0; signed = false;
    ctx.clearRect(0, 0, PW, PH);
    updateContinue();
  }
  $('#clear').addEventListener('click', () => {
    if (step !== 2) return;
    clearInk();
    setLabel(1);
    sleep(500).then(() => { if (step === 2 && !signed && !cur) startHint(); });
  });

  /* ───────── the handwriting hint ───────── */
  const hintSvg = $('#hint'), hp1 = $('#hp1'), hp2 = $('#hp2'), finger = $('#finger'), label = $('#signLabel');
  const L1 = hp1.getTotalLength(), L2 = hp2.getTotalLength();
  hp1.style.strokeDasharray = L1; hp2.style.strokeDasharray = L2;

  // cumulative phase boundaries
  const B1 = HINT.label, B2 = B1 + HINT.draw1, B3 = B2 + HINT.lift, B4 = B3 + HINT.draw2,
        B5 = B4 + HINT.hold, B6 = B5 + HINT.out, TOTAL = B6 + HINT.rest;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = p => p * p * (3 - 2 * p);

  let raf = 0, t0 = 0, running = false;
  const setHint = a => { hintSvg.style.opacity = a; };
  const setLabel = a => { label.style.opacity = a; };

  function frame(now){
    const t = (now - t0) % TOTAL;
    const p1 = ease(clamp01((t - B1) / HINT.draw1));
    const p2 = ease(clamp01((t - B3) / HINT.draw2));
    hp1.style.strokeDashoffset = L1 * (1 - p1);
    hp2.style.strokeDashoffset = L2 * (1 - p2);

    // hint opacity, crossfading with the "Sign here" label
    let a = 0;
    if (t >= B1 && t < B5) a = clamp01((t - B1) / 250);
    else if (t >= B5 && t < B6) a = 1 - (t - B5) / HINT.out;
    setHint(a); setLabel(1 - a);

    // the "pointer / finger"
    let x = 0, y = 0, op = 0, sc = 1, pos;
    if (t >= B1 && t < B2){
      pos = hp1.getPointAtLength(L1 * p1); x = pos.x; y = pos.y; op = clamp01((t - B1) / 200);
    } else if (t >= B2 && t < B3){
      const lp = (t - B2) / HINT.lift, e = hp1.getPointAtLength(L1), s = hp2.getPointAtLength(0);
      x = e.x + (s.x - e.x) * ease(lp); y = e.y + (s.y - e.y) * ease(lp);
      op = 1 - .75 * Math.sin(Math.PI * lp); sc = 1 - .3 * Math.sin(Math.PI * lp);
    } else if (t >= B3 && t < B4){
      pos = hp2.getPointAtLength(L2 * p2); x = pos.x; y = pos.y; op = 1;
    } else if (t >= B4 && t < B4 + 250){
      pos = hp2.getPointAtLength(L2); x = pos.x; y = pos.y; op = 1 - (t - B4) / 250;
    }
    if (op > 0) finger.setAttribute('transform', `translate(${x} ${y}) scale(${sc})`);
    finger.setAttribute('opacity', op);

    raf = requestAnimationFrame(frame);
  }

  function startHint(){
    if (!hintOn || running || signed || cur || step !== 2) return;
    running = true;
    hintSvg.classList.remove('settle'); label.classList.remove('settle');
    t0 = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stopHint(){
    if (running){ cancelAnimationFrame(raf); running = false; }
    hintSvg.classList.add('settle'); label.classList.add('settle');
    setHint(0); setLabel(0); finger.setAttribute('opacity', 0);
  }
  function resetHintVisuals(){
    hp1.style.strokeDashoffset = L1; hp2.style.strokeDashoffset = L2;
    finger.setAttribute('opacity', 0); setHint(0); setLabel(1);
  }

  hintToggle.addEventListener('change', () => {
    hintOn = hintToggle.checked;
    updateCaption();
    if (step !== 2) return;
    if (!hintOn){ stopHint(); if (!signed && !cur) setLabel(1); }
    else startHint();
  });

  /* ───────── the flow ───────── */
  async function tap(){
    if (step !== 1 || busy) return;
    busy = true;
    payLayer.classList.add('approved');
    payPrompt.textContent = 'Approved';
    await sleep(1000);
    payLayer.classList.remove('on');
    tipLayer.classList.add('on');
    setStep(2);
    resetHintVisuals();
    await sleep(200);                           
    startHint();
    await sleep(500);                           
    busy = false;
  }
  reader.addEventListener('click', tap);

  async function finish(){
    if (step !== 2 || !signed || tipPct === null || busy) return;
    busy = true; stopHint();
    tipLayer.classList.remove('on');
    doneLayer.classList.remove('play'); void doneLayer.offsetWidth;   // restart the CSS animations
    doneLayer.classList.add('on', 'play');
    setStep(3);
    await sleep(600); busy = false;
  }
  continueBtn.addEventListener('click', () => { if (!continueBtn.disabled) finish(); });

  async function reset(){
    if (busy && step === 1) return;
    busy = true; stopHint();
    tipLayer.classList.remove('on'); doneLayer.classList.remove('on', 'play');
    payLayer.classList.add('on');
    clearInk(); selectTip(DEFAULT_TIP); resetHintVisuals();
    payLayer.classList.remove('approved'); payPrompt.textContent = 'Tap, insert, or swipe to pay';
    setStep(1);
    await sleep(600);
    busy = false;
  }
  $('#restart').addEventListener('click', reset);
  $('#replay').addEventListener('click', reset);

  /* ───────── init ───────── */
  fit(); updateCaption(); selectTip(DEFAULT_TIP); resetHintVisuals();
  window.__demo = {  
    get step(){ return step; }, get signed(){ return signed; }, get hintRunning(){ return running; },
    get tip(){ return tipPct; }
  };
})();