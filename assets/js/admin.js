/* ============================================================
   Painel de edição — Portfólio Lucas Gabriel

   Lê assets/dados.json e assets/media.json, deixa editar tudo e devolve um
   dados.json novo para o usuário enviar no GitHub. Não grava em lugar nenhum
   sozinho: site estático não tem permissão para escrever no repositório.
   ============================================================ */
(function () {
  'use strict';

  var REPO = 'AI-Aurora-Tech/lucas.github.io';
  var BRANCH = 'claude/soccer-player-portfolio-9k2i21';

  var PADRAO = {
    atleta: {
      nome: '',
      nascimento: '',
      altura: '',
      peso: '',
      pernaBoa: '',
      categoria: '',
      situacao: '',
      posicoes: [],
    },
    times: [],
    torneios: [],
    titulos: [],
    midia: {},
  };

  var dados = JSON.parse(JSON.stringify(PADRAO));
  var midia = { fotos: [], videos: [] };

  /* ---------- Utilidades ---------- */

  function buscarJson(caminho) {
    if (typeof window.fetch !== 'function') return Promise.resolve(null);
    return fetch(caminho, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function avisar(mensagem, erro) {
    var caixa = document.querySelector('[data-aviso]');
    caixa.textContent = mensagem;
    caixa.classList.toggle('aviso--erro', !!erro);
    caixa.hidden = false;
    clearTimeout(avisar.temporizador);
    avisar.temporizador = setTimeout(function () { caixa.hidden = true; }, 3200);
  }

  function criar(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  /** Botão pequeno com ícone, já com o clique ligado. */
  function botaoMini(rotulo, titulo, classe, aoClicar) {
    var b = criar('button', 'mini' + (classe ? ' ' + classe : ''), rotulo);
    b.type = 'button';
    b.title = titulo;
    b.setAttribute('aria-label', titulo);
    b.addEventListener('click', aoClicar);
    return b;
  }

  function campoTexto(valor, marcador, aoMudar) {
    var input = criar('input');
    input.type = 'text';
    input.value = valor || '';
    if (marcador) input.placeholder = marcador;
    input.addEventListener('input', function () {
      aoMudar(input.value);
      atualizarPrevia();
    });
    return input;
  }

  function mover(lista, de, para) {
    if (para < 0 || para >= lista.length) return false;
    var item = lista.splice(de, 1)[0];
    lista.splice(para, 0, item);
    return true;
  }

  /* ---------- Listas simples (posições, torneios, times, títulos) ---------- */

  // Cada lista descreve como um item vira campos na tela.
  var LISTAS = {
    posicoes: {
      vazio: '',
      marcadores: ['Ex.: Volante'],
      ler: function (item) { return [item]; },
      escrever: function (valores) { return valores[0]; },
    },
    torneios: {
      vazio: '',
      marcadores: ['Ex.: Paulista U17'],
      ler: function (item) { return [item]; },
      escrever: function (valores) { return valores[0]; },
    },
    times: {
      vazio: { nome: '', periodo: '', marcador: '' },
      marcadores: [
        'Nome do time',
        'Período — em branco vira “Atual”',
        'Selo (opcional) — ex.: Federado',
      ],
      ler: function (item) { return [item.nome, item.periodo, item.marcador]; },
      escrever: function (valores) {
        return { nome: valores[0], periodo: valores[1], marcador: valores[2] };
      },
    },
    titulos: {
      vazio: { nome: '', detalhe: '' },
      marcadores: ['Nome do torneio', 'Detalhe — ex.: Sub-15 · 2026 · Campeão'],
      ler: function (item) { return [item.nome, item.detalhe]; },
      escrever: function (valores) { return { nome: valores[0], detalhe: valores[1] }; },
    },
  };

  function alvoDaLista(chave) {
    return chave === 'posicoes' ? dados.atleta.posicoes : dados[chave];
  }

  function desenharLista(chave) {
    var config = LISTAS[chave];
    var lista = alvoDaLista(chave);
    var ul = document.querySelector('[data-lista="' + chave + '"]');
    ul.innerHTML = '';

    lista.forEach(function (item, i) {
      var li = criar('li', 'item');
      var valores = config.ler(item);

      var setas = criar('div', 'mover');
      var subir = botaoMini('▲', 'Subir', null, function () {
        if (mover(lista, i, i - 1)) { desenharLista(chave); atualizarPrevia(); }
      });
      var descer = botaoMini('▼', 'Descer', null, function () {
        if (mover(lista, i, i + 1)) { desenharLista(chave); atualizarPrevia(); }
      });
      subir.disabled = i === 0;
      descer.disabled = i === lista.length - 1;
      setas.appendChild(subir);
      setas.appendChild(descer);
      li.appendChild(setas);

      var campos = criar('div', 'item__campos');
      if (valores.length > 1) campos.style.gridTemplateColumns = 'repeat(' + valores.length + ', 1fr)';
      valores.forEach(function (valor, indice) {
        campos.appendChild(campoTexto(valor, config.marcadores[indice], function (novo) {
          valores[indice] = novo;
          lista[i] = config.escrever(valores);
        }));
      });
      li.appendChild(campos);

      li.appendChild(botaoMini('✕', 'Remover', 'mini--remover', function () {
        lista.splice(i, 1);
        desenharLista(chave);
        atualizarPrevia();
      }));

      ul.appendChild(li);
    });
  }

  /* ---------- Mídia: legenda e ordem ---------- */

  /**
   * Junta os arquivos que existem de fato com a ordem salva no dados.json.
   * Um arquivo sem ordem definida entra no fim, como o site também faz.
   */
  function ordenarMidia(arquivos) {
    return arquivos
      .map(function (arquivo, posicao) {
        var info = dados.midia[arquivo.src] || {};
        return {
          src: arquivo.src,
          nome: arquivo.nome,
          data: arquivo.data,
          legenda: info.legenda || '',
          ordem: typeof info.ordem === 'number' ? info.ordem : Infinity,
          alfabetica: posicao,
        };
      })
      .sort(function (a, b) { return a.ordem - b.ordem || a.alfabetica - b.alfabetica; });
  }

  var ordens = { fotos: [], videos: [] };

  function desenharMidia(tipo) {
    var ul = document.querySelector('[data-midia="' + tipo + '"]');
    var vazio = document.querySelector('[data-vazio="' + tipo + '"]');
    var itens = ordens[tipo];

    ul.innerHTML = '';
    vazio.hidden = itens.length > 0;

    itens.forEach(function (item, i) {
      var li = criar('li', 'midia');

      var setas = criar('div', 'mover');
      var subir = botaoMini('▲', 'Subir', null, function () {
        if (mover(itens, i, i - 1)) { desenharMidia(tipo); atualizarPrevia(); }
      });
      var descer = botaoMini('▼', 'Descer', null, function () {
        if (mover(itens, i, i + 1)) { desenharMidia(tipo); atualizarPrevia(); }
      });
      subir.disabled = i === 0;
      descer.disabled = i === itens.length - 1;
      setas.appendChild(subir);
      setas.appendChild(descer);
      li.appendChild(setas);

      li.appendChild(criar('span', 'midia__posicao', String(i + 1)));

      if (tipo === 'fotos') {
        var img = criar('img', 'midia__capa');
        img.src = item.src;
        img.alt = '';
        img.loading = 'lazy';
        li.appendChild(img);
      } else {
        li.appendChild(criar('div', 'midia__capa midia__capa--video', '🎬'));
      }

      var corpo = criar('div', 'midia__corpo');
      var arquivo = criar('span', 'midia__arquivo', item.nome + (item.data ? ' · ' + item.data : ''));
      arquivo.title = item.nome;
      corpo.appendChild(arquivo);
      corpo.appendChild(campoTexto(item.legenda, 'Legenda (opcional)', function (valor) {
        item.legenda = valor;
      }));
      li.appendChild(corpo);

      ul.appendChild(li);
    });
  }

  /* ---------- Montar o dados.json final ---------- */

  function montarSaida() {
    var saida = {
      atleta: {
        nome: dados.atleta.nome,
        nascimento: dados.atleta.nascimento,
        altura: dados.atleta.altura,
        peso: dados.atleta.peso,
        pernaBoa: dados.atleta.pernaBoa,
        categoria: dados.atleta.categoria,
        situacao: dados.atleta.situacao,
        posicoes: dados.atleta.posicoes.filter(naoVazio),
      },
      times: dados.times.filter(function (t) { return naoVazio(t.nome); }),
      torneios: dados.torneios.filter(naoVazio),
      titulos: dados.titulos.filter(function (t) { return naoVazio(t.nome); }),
      midia: {},
    };

    // Se a ordem de um tipo foi mexida, ela é gravada para todos os arquivos
    // daquele tipo — gravar só os que mudaram de índice deixaria a fila
    // inconsistente. Sem reordenação, grava-se apenas quem tem legenda, e
    // assim um arquivo novo continua entrando pela ordem alfabética.
    ['videos', 'fotos'].forEach(function (tipo) {
      var reordenado = ordens[tipo].some(function (item, i) {
        return i !== item.alfabetica;
      });
      ordens[tipo].forEach(function (item, i) {
        if (!reordenado && !item.legenda) return;
        var registro = { legenda: item.legenda };
        if (reordenado) registro.ordem = i;
        saida.midia[item.src] = registro;
      });
    });

    return saida;
  }

  function naoVazio(valor) {
    return typeof valor === 'string' && valor.trim() !== '';
  }

  function textoDaSaida() {
    return JSON.stringify(montarSaida(), null, 2) + '\n';
  }

  function atualizarPrevia() {
    document.querySelector('[data-previa]').textContent = textoDaSaida();
  }

  /* ---------- Preencher a tela ---------- */

  function preencherCampos() {
    document.querySelectorAll('[data-campo]').forEach(function (input) {
      var chave = input.dataset.campo;
      input.value = dados.atleta[chave] || '';
      input.addEventListener('input', function () {
        dados.atleta[chave] = input.value;
        atualizarPrevia();
      });
    });
  }

  function ligarBotoes() {
    document.querySelectorAll('[data-adicionar]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        var chave = botao.dataset.adicionar;
        var vazio = LISTAS[chave].vazio;
        alvoDaLista(chave).push(typeof vazio === 'object' ? Object.assign({}, vazio) : vazio);
        desenharLista(chave);
        atualizarPrevia();
        var campos = document.querySelectorAll('[data-lista="' + chave + '"] input');
        if (campos.length) campos[campos.length - (LISTAS[chave].marcadores.length)].focus();
      });
    });

    document.querySelectorAll('.aba').forEach(function (aba) {
      aba.addEventListener('click', function () {
        document.querySelectorAll('.aba').forEach(function (a) { a.classList.remove('is-ativa'); });
        document.querySelectorAll('.painel').forEach(function (p) { p.classList.remove('is-ativo'); });
        aba.classList.add('is-ativa');
        document.querySelector('[data-painel="' + aba.dataset.aba + '"]').classList.add('is-ativo');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    document.querySelectorAll('[data-link-upload]').forEach(function (link) {
      link.href = 'https://github.com/' + REPO + '/upload/' + BRANCH + '/' + link.dataset.linkUpload;
    });

    document.querySelector('[data-baixar]').addEventListener('click', function () {
      var blob = new Blob([textoDaSaida()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'dados.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      avisar('Arquivo baixado. Agora envie na pasta assets.');
    });

    document.querySelector('[data-recarregar]').addEventListener('click', function () {
      location.reload();
    });

    document.querySelector('[data-copiar]').addEventListener('click', function () {
      var texto = textoDaSaida();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(
          function () { avisar('Conteúdo copiado.'); },
          function () { avisar('Não deu para copiar — selecione o texto da conferência.', true); }
        );
      } else {
        avisar('Não deu para copiar — selecione o texto da conferência.', true);
      }
    });
  }

  /* ---------- Início ---------- */

  Promise.all([
    buscarJson('assets/dados.json'),
    buscarJson('assets/media.json'),
  ]).then(function (r) {
    var salvos = r[0];
    var arquivos = r[1] || window.MIDIA || { fotos: [], videos: [] };

    if (salvos) {
      dados = {
        atleta: Object.assign({}, PADRAO.atleta, salvos.atleta || {}),
        times: salvos.times || [],
        torneios: salvos.torneios || [],
        titulos: salvos.titulos || [],
        midia: salvos.midia || {},
      };
      if (!Array.isArray(dados.atleta.posicoes)) dados.atleta.posicoes = [];
    } else {
      avisar('Não achei o assets/dados.json — começando do zero.', true);
    }

    midia = arquivos;
    ordens.videos = ordenarMidia(midia.videos || []);
    ordens.fotos = ordenarMidia(midia.fotos || []);

    var agora = new Date();
    document.querySelector('[data-carimbo]').textContent =
      'dados lidos às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    preencherCampos();
    Object.keys(LISTAS).forEach(desenharLista);
    desenharMidia('videos');
    desenharMidia('fotos');
    ligarBotoes();
    atualizarPrevia();
  });
})();
