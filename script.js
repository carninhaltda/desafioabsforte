/* ==========================================================================
   DESAFIO AMFH — comportamento da página
   Entradas com fade, barra de progresso, grade dos 21 dias, popup e Clarity.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Grade dos 21 dias ---------- */
  (function () {
    var grid = $('#dias-grid');
    if (!grid) return;
    var marcos = [1, 8, 15, 21];
    for (var i = 1; i <= 21; i++) {
      var d = document.createElement('div');
      d.className = 'dia' + (marcos.indexOf(i) !== -1 ? ' dia--marco' : '');
      d.textContent = i;
      grid.appendChild(d);
    }
  })();

  /* ---------- Fotos: fade quando carregam ---------- */
  $$('.frame img, .cover__media img').forEach(function (img) {
    var host = img.closest('.frame') || img.parentElement;
    var pronto = function () { host.classList.add('is-loaded'); };
    if (img.complete && img.naturalWidth) pronto();
    else { img.addEventListener('load', pronto); img.addEventListener('error', pronto); }
  });

  /* ---------- Vídeos: tocam quando entram em cena ---------- */
  (function () {
    var videos = $$('video[autoplay]');
    if (!videos.length) return;
    var tocar = function (v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* navegador bloqueou: fica no poster */ });
    };
    if (!('IntersectionObserver' in window)) { videos.forEach(tocar); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) tocar(e.target);
        else e.target.pause();
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { io.observe(v); });
  })();

  /* ---------- Entradas ao rolar ---------- */
  (function () {
    var alvos = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduz) {
      alvos.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    alvos.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Barra de progresso + chrome ---------- */
  (function () {
    var barra = $('.progress span');
    var chrome = $('.chrome');
    if (!barra && !chrome) return;
    var tick = false;
    var aoRolar = function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (chrome) chrome.classList.toggle('is-scrolled', y > 40);
        if (barra) barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      });
    };
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar);
    aoRolar();
  })();

  /* ---------- FAQ: uma pergunta aberta por vez ---------- */
  (function () {
    var itens = $$('.faq details');
    itens.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        itens.forEach(function (outro) { if (outro !== d) outro.open = false; });
      });
    });
  })();

  /* ==========================================================================
     POPUP DE CAPTURA
     ========================================================================== */
  (function () {
    var WEBHOOK = 'https://script.google.com/macros/s/AKfycbyLtE9ZqB4wr9gRsJQCRYRSgXUxaVM-vXKFCmRf5qoz-F5HlSVcoV1HS7cDZnTSQWsC/exec?k=070707';

    var modal = $('#modal-lead');
    var form = $('#form-lead');
    if (!modal || !form) return;

    var campoNome = $('#lead-nome');
    var campoEmail = $('#lead-email');
    var campoTel = $('#lead-telefone');
    var isca = $('#lead-isca');
    var erro = $('#lead-erro');
    var botao = $('#lead-enviar');
    var botaoTxt = $('.btn__txt', botao);
    var destino = '';
    var focoAnterior = null;

    function jaEnviou() {
      try { return localStorage.getItem('amfh_lead') === '1'; } catch (e) { return false; }
    }
    function marcarEnviado() {
      try { localStorage.setItem('amfh_lead', '1'); } catch (e) { /* modo privado */ }
    }

    function abrir(url) {
      destino = url;
      focoAnterior = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-aberto');
      setTimeout(function () { campoNome.focus(); }, 40);
    }
    function fechar() {
      modal.hidden = true;
      document.body.classList.remove('modal-aberto');
      if (focoAnterior) focoAnterior.focus();
    }

    function mascara(valor) {
      var d = valor.replace(/\D/g, '').slice(0, 11);
      if (d.length <= 2) return d.length ? '(' + d : '';
      if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    }
    campoTel.addEventListener('input', function () {
      campoTel.value = mascara(campoTel.value);
      campoTel.setAttribute('aria-invalid', 'false');
      erro.hidden = true;
    });
    campoEmail.addEventListener('input', function () {
      campoEmail.setAttribute('aria-invalid', 'false');
      erro.hidden = true;
    });

    function telefoneValido(valor) {
      var d = valor.replace(/\D/g, '');
      return d.length === 11 || d.length === 10;
    }

    $$('a.btn[href*="pay.hotmart.com"]').forEach(function (link) {
      link.addEventListener('click', function (ev) {
        if (!WEBHOOK || jaEnviou()) return;
        ev.preventDefault();
        abrir(link.href);
      });
    });

    $$('[data-fechar]', modal).forEach(function (el) { el.addEventListener('click', fechar); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !modal.hidden) fechar();
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (isca.value) { window.location.href = destino; return; }

      var nome = campoNome.value.trim();
      if (nome.length < 2) {
        erro.textContent = 'Escreve seu nome pra eu saber como te chamar.';
        erro.hidden = false;
        campoNome.setAttribute('aria-invalid', 'true');
        campoNome.focus();
        return;
      }
      var email = campoEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        erro.textContent = 'Confere o e-mail: é por ele que o acesso também chega.';
        erro.hidden = false;
        campoEmail.setAttribute('aria-invalid', 'true');
        campoEmail.focus();
        return;
      }
      if (!telefoneValido(campoTel.value)) {
        erro.textContent = 'Confere o número: precisa ter DDD e o número completo.';
        erro.hidden = false;
        campoTel.setAttribute('aria-invalid', 'true');
        campoTel.focus();
        return;
      }

      erro.hidden = true;
      botao.setAttribute('disabled', 'disabled');
      if (botaoTxt) botaoTxt.textContent = 'Só um segundo...';

      var dados = {
        tipo: 'lead',
        nome: nome,
        email: email,
        telefone: campoTel.value.replace(/\D/g, ''),
        origem: location.pathname + location.search,
        referrer: document.referrer || '',
        quando: new Date().toISOString()
      };

      var seguiu = false;
      function seguir() {
        if (seguiu) return;
        seguiu = true;
        marcarEnviado();
        window.location.href = destino;
      }

      // text/plain evita o preflight de CORS — o Apps Script não responde a OPTIONS
      fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(dados),
        keepalive: true
      }).then(seguir).catch(seguir);
      setTimeout(seguir, 2500);
    });
  })();

  /* ---------- Microsoft Clarity ---------- */
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', 'ymb467hfz5');

})();
