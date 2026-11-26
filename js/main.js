(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Língua (PT por omissão, EN em data-en*) ---------- */
  // The Portuguese text lives in the HTML; English comes from data-en, data-en-alt and data-en-label.
  var TEXT = [['data-en', null], ['data-en-alt', 'alt'], ['data-en-label', 'aria-label']];
  var META = {
    pt: { title: 'The Architect — Cibersegurança e software', desc: 'Cibersegurança e software: construo sistemas e testo-os até partirem.' },
    en: { title: 'The Architect — Cybersecurity & software', desc: 'Cybersecurity and software: I build systems and test them until they break.' }
  };

  function setLang(lang) {
    TEXT.forEach(function (pair) {
      var attr = pair[0], target = pair[1];
      document.querySelectorAll('[' + attr + ']').forEach(function (el) {
        var store = attr + '-pt';
        if (!el.hasAttribute(store)) el.setAttribute(store, target ? (el.getAttribute(target) || '') : el.textContent);
        var value = lang === 'en' ? el.getAttribute(attr) : el.getAttribute(store);
        if (target) el.setAttribute(target, value); else el.textContent = value;
      });
    });
    root.lang = lang;
    document.title = META[lang].title;
    document.querySelector('meta[name="description"]').setAttribute('content', META[lang].desc);
    document.querySelectorAll('.lang').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    try { localStorage.setItem('lang', lang); } catch (e) {}
    renderKeys();
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
  document.querySelectorAll('.lang').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });

  /* ---------- Projetos: separadores ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.ptab'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab); });
    tab.addEventListener('keydown', function (e) {
      var to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(tabs[(to + tabs.length) % tabs.length], true);
    });
  });

  /* ---------- Ferramentas: o teclado ---------- */
  var kbd = document.querySelector('.kbd');
  var typed = [];

  function legend(key, which) {
    if (which === 'b') return key.dataset.b;
    return (root.lang === 'en' && key.dataset.xEn) || key.dataset.x;
  }

  function renderKeys() {
    if (!kbd) return;
    var breaking = kbd.dataset.mode === 'break';
    kbd.querySelectorAll('.key[data-b]').forEach(function (key) {
      var main = legend(key, breaking ? 'x' : 'b');
      var alt = legend(key, breaking ? 'b' : 'x');
      key.replaceChildren();
      var a = document.createElement('span'); a.className = 'alt mono'; a.textContent = alt;
      var m = document.createElement('span'); m.className = 'main'; m.textContent = main;
      key.append(a, m);
      key.classList.toggle('blank', !main);
      key.setAttribute('aria-label', main || '—');
      key.disabled = !main;
    });
    kbd.querySelector('.prompt').textContent = breaking ? 'root@break:~#' : 'architect@build:~$';
    kbd.querySelector('.typed').textContent = typed.join(' ');
    kbd.querySelectorAll('[data-mode-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.modeSet === kbd.dataset.mode));
    });
  }

  if (kbd) {
    kbd.addEventListener('click', function (e) {
      var mode = e.target.closest('[data-mode-set]');
      if (mode) {
        kbd.dataset.mode = mode.dataset.modeSet;
        typed = [];
        renderKeys();
        return;
      }
      var key = e.target.closest('.key[data-b]');
      if (!key || key.disabled) return;
      var word = key.getAttribute('aria-label').toLowerCase().replace(/\s+/g, '-');
      typed = typed.concat(word).slice(-5);
      kbd.querySelector('.typed').textContent = typed.join(' ');
    });
  }

  /* O teclado a sério também manda: Caps Lock liga o Quebrar, Shift troca enquanto está carregado. */
  if (kbd) {
    var caps = false, shift = false;
    var setMode = function () {
      var mode = caps !== shift ? 'break' : 'build';
      if (kbd.dataset.mode === mode) return;
      kbd.dataset.mode = mode;
      typed = [];
      renderKeys();
    };
    var press = function (sel, on) {
      var key = kbd.querySelector(sel);
      if (key) key.classList.toggle('down', on);
    };
    var sync = function (e) {
      if (typeof e.getModifierState !== 'function') return;
      caps = e.getModifierState('CapsLock');
      shift = e.shiftKey;
      press('[data-mode-set="build"]', shift);
      setMode();
    };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'CapsLock' || e.key === 'Shift') sync(e);
    });
    document.addEventListener('keyup', function (e) {
      if (e.key === 'CapsLock' || e.key === 'Shift') sync(e);
    });
    // Clicking the on-screen keys still works: it sets the mode as if Caps Lock had been toggled.
    kbd.addEventListener('click', function (e) {
      var mode = e.target.closest('[data-mode-set]');
      if (mode) caps = mode.dataset.modeSet === 'break';
    });
    window.addEventListener('blur', function () { shift = false; press('[data-mode-set="build"]', false); setMode(); });
  }

  var saved = 'pt';
  try { saved = localStorage.getItem('lang') === 'en' ? 'en' : 'pt'; } catch (e) {}
  if (saved === 'en') setLang('en'); else renderKeys();
})();
