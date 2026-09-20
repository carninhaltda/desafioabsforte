/* Animação de entrada das seções */
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -8%' });
  items.forEach(function (el) { io.observe(el); });
})();

/* FAQ: abre uma pergunta por vez */
(function () {
  var all = document.querySelectorAll('.faq details');
  all.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      all.forEach(function (other) { if (other !== d) other.open = false; });
    });
  });
})();
