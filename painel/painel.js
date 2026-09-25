/* Painel dos 21 dias — progresso salvo no próprio aparelho */
(function () {
  'use strict';

  var CHAVE = 'amfh_painel_v1';

  var SEMANAS = [
    { nome: 'Semana 1', regra: '30 segundos ligado, 30 desligado', primeiro: 1, ultimo: 7 },
    { nome: 'Semana 2', regra: '12 minutos direto', primeiro: 8, ultimo: 14 },
    { nome: 'Semana 3', regra: 'Em breve', primeiro: 15, ultimo: 21 }
  ];

  var TREINOS = {
    1:  ['Canivete alternado', 'Oblíquo tocando o chão', 'Remador'],
    2:  ['Abdominal infra com as pernas estendidas', 'Abdominal bicicleta', 'Prancha'],
    3:  ['Abdominal tocando os calcanhares', 'Remador com apoios (alternado)', 'Toca o pé com a perna estendida'],
    4:  ['Abdominal tesoura', 'Abdominal supra', 'Lombar Superman'],
    5:  ['Canoa', 'Remador com apoios', 'Oblíquo unilateral'],
    6:  ['Canivete', 'Supra braços estendidos', 'Prancha alta'],
    7:  ['Abdominal supra alternados com a perna cruzada', 'Remador cruzado com cone', 'Prancha com balanço'],
    8:  ['Prancha alta bate dentro bate fora — 10', 'Remador tocando as mãos debaixo das pernas (alternado) — 20', 'Oblíquo unilateral — 15'],
    9:  ['Extensão lombar com as mãos nas orelhas', 'Isometria canoa trazendo os joelhos (alternado)', 'Oblíquo tocando o chão'],
    10: ['Canivete alternado', 'Toca o pé com a perna estendida', 'Infra com as pernas estendidas'],
    11: ['Supra braços estendidos', 'Canoa cruzando as pernas', 'Superman isométrico com flexão e extensão dos braços'],
    12: ['Prancha cotovelo sobe e desce', 'Remador tocando as mãos debaixo das pernas', 'Abdominal bicicleta'],
    13: ['Remador cruzado', 'Abdominal nadador', 'Flexão — 15'],
    14: ['Remador com apoios (alternado)', 'Abdominal infra com as pernas estendidas', 'Superman cruzado (nadador)']
  };

  var $ = function (s) { return document.querySelector(s); };

  /* ---------- Estado ---------- */
  function ler() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (!bruto) return { feitos: [], ultimo: null, ignorarAviso: false };
      var d = JSON.parse(bruto);
      return { feitos: d.feitos || [], ultimo: d.ultimo || null, ignorarAviso: !!d.ignorarAviso };
    } catch (e) { return { feitos: [], ultimo: null, ignorarAviso: false }; }
  }
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* modo privado */ }
  }
  var estado = ler();

  function semanaDo(dia) {
    for (var i = 0; i < SEMANAS.length; i++) if (dia >= SEMANAS[i].primeiro && dia <= SEMANAS[i].ultimo) return SEMANAS[i];
    return SEMANAS[0];
  }
  function proximoDia() {
    for (var d = 1; d <= 21; d++) if (estado.feitos.indexOf(d) === -1) return d;
    return 21;
  }
  function diasParado() {
    if (!estado.ultimo) return 0;
    return Math.floor((Date.now() - estado.ultimo) / 86400000);
  }

  /* ---------- Desenho ---------- */
  function desenhar() {
    var grade = $('#grade');
    grade.innerHTML = '';
    var proximo = proximoDia();

    for (var d = 1; d <= 21; d++) {
      var b = document.createElement('button');
      var feito = estado.feitos.indexOf(d) !== -1;
      var temTreino = !!TREINOS[d];
      b.type = 'button';
      b.className = 'dia' + (feito ? ' dia--feito' : '') + (!feito && d === proximo ? ' dia--hoje' : '') + (!temTreino ? ' dia--espera' : '');
      b.innerHTML = '<small>Dia</small>' + d;
      b.setAttribute('aria-label', 'Dia ' + d + (feito ? ' — concluído' : ''));
      b.dataset.dia = d;
      grade.appendChild(b);
    }

    var feitos = estado.feitos.length;
    $('#feitos').textContent = feitos;
    $('#barra-preenche').style.width = (feitos / 21 * 100) + '%';
    $('#resumo').textContent = feitos === 0
      ? 'Marque cada treino concluído. O progresso fica salvo neste aparelho.'
      : (feitos === 21 ? 'Desafio fechado. 21 de 21.' : 'Você está no Dia ' + proximo + ' de 21.');
    $('#sequencia').textContent = feitos === 21 ? 'Desafio completo 🔥'
      : (feitos === 0 ? 'Comece pelo Dia 1' : 'Próximo: Dia ' + proximo);

    // Aviso de retomada: 2 dias ou mais sem marcar, com desafio em andamento
    var mostrar = feitos > 0 && feitos < 21 && diasParado() >= 2 && !estado.ignorarAviso;
    $('#retomada').hidden = !mostrar;
  }

  /* ---------- Modal do dia ---------- */
  var modal = $('#modal-dia');
  var diaAberto = null;

  function abrirDia(d) {
    diaAberto = d;
    var s = semanaDo(d);
    var lista = TREINOS[d];
    $('#dia-semana').textContent = s.nome;
    $('#dia-titulo').textContent = 'Dia ' + d;
    $('#dia-regra').textContent = lista ? s.regra : 'Treino ainda não liberado';
    var ol = $('#dia-exercicios');
    ol.innerHTML = '';
    if (lista) {
      lista.forEach(function (ex) {
        var li = document.createElement('li');
        li.textContent = ex;
        ol.appendChild(li);
      });
    } else {
      var li = document.createElement('li');
      li.textContent = 'Os treinos da Semana 3 entram aqui assim que forem gravados.';
      ol.appendChild(li);
    }
    var feito = estado.feitos.indexOf(d) !== -1;
    $('#btn-concluir').hidden = feito || !lista;
    $('#btn-desmarcar').hidden = !feito;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function fecharDia() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  /* ---------- Eventos ---------- */
  $('#grade').addEventListener('click', function (ev) {
    var b = ev.target.closest('.dia');
    if (b) abrirDia(parseInt(b.dataset.dia, 10));
  });

  Array.prototype.forEach.call(modal.querySelectorAll('[data-fechar]'), function (el) {
    el.addEventListener('click', fecharDia);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !modal.hidden) fecharDia();
  });

  $('#btn-concluir').addEventListener('click', function () {
    if (estado.feitos.indexOf(diaAberto) === -1) estado.feitos.push(diaAberto);
    estado.ultimo = Date.now();
    estado.ignorarAviso = false;
    salvar(); desenhar(); fecharDia();
  });

  $('#btn-desmarcar').addEventListener('click', function () {
    estado.feitos = estado.feitos.filter(function (d) { return d !== diaAberto; });
    salvar(); desenhar(); fecharDia();
  });

  // Errou? Volta pro Dia 1.
  $('#btn-voltar').addEventListener('click', function () {
    estado = { feitos: [], ultimo: Date.now(), ignorarAviso: false };
    salvar(); desenhar();
  });
  $('#btn-continuar').addEventListener('click', function () {
    estado.ignorarAviso = true;
    salvar(); desenhar();
  });

  $('#btn-zerar').addEventListener('click', function () {
    if (!confirm('Isso apaga todos os treinos marcados. Tem certeza?')) return;
    estado = { feitos: [], ultimo: null, ignorarAviso: false };
    salvar(); desenhar();
  });

  desenhar();
})();
