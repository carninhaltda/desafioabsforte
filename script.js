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

/* Popup de captura do WhatsApp antes do checkout */
(function () {
  // COLE AQUI A URL DE PRODUÇÃO DO WEBHOOK DO n8n.
  // Enquanto estiver vazia, o popup coleta e segue pro checkout sem gravar.
  var WEBHOOK = '';

  var modal = document.getElementById('modal-lead');
  var form = document.getElementById('form-lead');
  if (!modal || !form) return;

  var campoNome = document.getElementById('lead-nome');
  var campoTel = document.getElementById('lead-telefone');
  var isca = document.getElementById('lead-isca');
  var erro = document.getElementById('lead-erro');
  var botao = document.getElementById('lead-enviar');
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

  /* Máscara de telefone brasileira */
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

  function telefoneValido(valor) {
    var d = valor.replace(/\D/g, '');
    // DDD (2) + 8 ou 9 dígitos; celular começa com 9
    return d.length === 11 || d.length === 10;
  }

  /* Intercepta todos os CTAs que vão pro checkout */
  document.querySelectorAll('a.btn[href*="pay.hotmart.com"]').forEach(function (link) {
    link.addEventListener('click', function (ev) {
      if (!WEBHOOK || jaEnviou()) return; // sem webhook configurado (ou já informou): segue direto
      ev.preventDefault();
      abrir(link.href);
    });
  });

  modal.querySelectorAll('[data-fechar]').forEach(function (el) {
    el.addEventListener('click', fechar);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !modal.hidden) fechar();
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    if (isca.value) { window.location.href = destino; return; } // robô

    var nome = campoNome.value.trim();
    if (nome.length < 2) {
      erro.textContent = 'Escreve seu nome pra eu saber como te chamar.';
      erro.hidden = false;
      campoNome.setAttribute('aria-invalid', 'true');
      campoNome.focus();
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
    botao.textContent = 'Só um segundo...';

    var dados = {
      nome: nome,
      telefone: campoTel.value.replace(/\D/g, ''),
      origem: location.pathname + location.search,
      referrer: document.referrer || '',
      quando: new Date().toISOString()
    };

    function seguir() {
      marcarEnviado();
      window.location.href = destino;
    }

    if (!WEBHOOK) { seguir(); return; }

    // keepalive garante o envio mesmo com a navegação acontecendo em seguida
    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
      keepalive: true
    }).then(seguir).catch(seguir); // falhou o registro? a venda não pode ser perdida
    setTimeout(seguir, 2500); // rede lenta: não segura a pessoa
  });
})();
