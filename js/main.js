(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  var themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');

  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () {
    setMenu(!nav.classList.contains('open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- Header border on scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Illustration slots ----------
     Catch images that failed before this script ran (onerror covers the rest). */
  document.querySelectorAll('.illustration img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) img.parentElement.classList.add('is-empty');
  });

  if (!('IntersectionObserver' in window)) return;

  /* ---------- Active nav link ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var navTargets = {};
  links.forEach(function (l) { navTargets[l.getAttribute('href').slice(1)] = l; });

  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var link = navTargets[entry.target.id];
      // Sections without their own nav link (about, background) keep the previous one
      if (!link) return;
      links.forEach(function (l) { l.classList.toggle('active', l === link); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(
    '.section-label, .section-title, .section-intro, .prose, .role-list, .timeline-item, ' +
    '.project, .stats, .repo-list, .skill, .edu, .principles, .contact-list, .illustration:not(.illustration--hero)'
  );
  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(function (el) {
    el.classList.add('reveal');
    revealer.observe(el);
  });

  /* ---------- Count-up stats ---------- */
  var counter = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      counter.unobserve(entry.target);
      var el = entry.target;
      var end = parseInt(el.getAttribute('data-count'), 10);
      var start = performance.now();
      var dur = 1100;
      (function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { counter.observe(el); });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
