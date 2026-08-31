/* ============================================================
   Portfólio — Lucas Gabriel Silva dos Santos
   Idade automática, carrossel de vídeos e galeria de fotos.
   ============================================================ */
(function () {
  'use strict';

  var NASCIMENTO = { ano: 2011, mes: 3, dia: 10 }; // 10/03/2011

  /**
   * A lista de mídia vem do assets/media.json, buscado com o cache desligado:
   * o GitHub Pages guarda os arquivos por 10 minutos no navegador, e sem isso
   * uma foto recém-enviada só apareceria depois desse tempo. Se o fetch não
   * estiver disponível (index.html aberto direto do disco, em file://), vale a
   * lista do assets/media.js, carregado pela tag <script> do index.html.
   */
  /** Busca um JSON do site sem passar pelo cache; devolve null se não der. */
  function buscarJson(caminho) {
    var naWeb = location.protocol === 'http:' || location.protocol === 'https:';
    if (!naWeb || typeof window.fetch !== 'function') return Promise.resolve(null);

    return fetch(caminho, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function carregarMidia() {
    var reserva = window.MIDIA || { logo: null, fotos: [], videos: [] };
    var naWeb = location.protocol === 'http:' || location.protocol === 'https:';

    if (!naWeb || typeof window.fetch !== 'function') {
      return Promise.resolve(reserva);
    }

    return buscarJson('assets/media.json').then(function (dados) {
      return dados && dados.fotos && dados.videos ? dados : reserva;
    });
  }

  /* ---------- Idade automática ---------- */
  function calcularIdade() {
    var hoje = new Date();
    var idade = hoje.getFullYear() - NASCIMENTO.ano;
    var mesAtual = hoje.getMonth() + 1;
    // ainda não fez aniversário este ano
    if (mesAtual < NASCIMENTO.mes || (mesAtual === NASCIMENTO.mes && hoje.getDate() < NASCIMENTO.dia)) {
      idade--;
    }
    return idade;
  }

  document.querySelectorAll('[data-idade]').forEach(function (el) {
    el.textContent = calcularIdade();
  });

  document.querySelectorAll('[data-ano]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Logo apontado pela lista (caso tenha outra extensão) ---------- */
  function aplicarLogo(caminho) {
    if (!caminho) return;
    document.querySelectorAll('.topo__logo, .hero__logo').forEach(function (img) {
      if (img.getAttribute('src') !== caminho) img.setAttribute('src', caminho);
    });
  }

  /* ---------- Dados do atleta (assets/dados.json) ---------- */

  function texto(seletor, valor) {
    if (valor === undefined || valor === null || valor === '') return;
    var el = document.querySelector(seletor);
    if (el) el.textContent = valor;
  }

  /** Repõe uma lista inteira a partir de um array, usando um molde por item. */
  function repovoarLista(seletor, itens, molde) {
    var ul = document.querySelector(seletor);
    if (!ul || !Array.isArray(itens) || !itens.length) return;
    ul.innerHTML = '';
    itens.forEach(function (item) {
      var li = document.createElement('li');
      molde(li, item);
      ul.appendChild(li);
    });
  }

  function dataPorExtenso(iso) {
    var partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return partes ? partes[3] + '/' + partes[2] + '/' + partes[1] : null;
  }

  function aplicarDados(dados) {
    if (!dados) return;
    var atleta = dados.atleta || {};

    if (atleta.nascimento) {
      var d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(atleta.nascimento);
      if (d) {
        NASCIMENTO = { ano: Number(d[1]), mes: Number(d[2]), dia: Number(d[3]) };
        document.querySelectorAll('[data-idade]').forEach(function (el) {
          el.textContent = calcularIdade();
        });
      }
      texto('[data-campo-nascimento]', dataPorExtenso(atleta.nascimento));
    }

    if (atleta.nome) {
      // as duas primeiras palavras ficam em branco; o resto, em verde
      var palavras = atleta.nome.trim().split(/\s+/);
      var inicio = palavras.slice(0, 2).join(' ');
      var resto = palavras.slice(2).join(' ');
      var h1 = document.querySelector('[data-nome]');
      if (h1) {
        h1.textContent = inicio;
        if (resto) {
          h1.appendChild(document.createElement('br'));
          var span = document.createElement('span');
          span.textContent = resto;
          h1.appendChild(span);
        }
      }
      texto('[data-marca]', inicio);
      texto('[data-campo-nome]', atleta.nome);
      document.title = atleta.nome + ' — Portfólio';
      var rodapeNome = document.querySelector('.rodape strong');
      if (rodapeNome) rodapeNome.textContent = atleta.nome;
    }

    if (Array.isArray(atleta.posicoes) && atleta.posicoes.length) {
      texto('[data-posicoes]', atleta.posicoes.join(' · '));
      repovoarLista('[data-chips-posicoes]', atleta.posicoes, function (li, nome) {
        li.textContent = nome;
      });
    }

    texto('[data-stat-altura]', atleta.altura);
    texto('[data-stat-peso]', atleta.peso);
    texto('[data-stat-perna]', atleta.pernaBoa);
    texto('[data-campo-altura]', atleta.altura ? atleta.altura + ' m' : null);
    texto('[data-campo-peso]', atleta.peso ? atleta.peso + ' kg' : null);
    texto('[data-campo-perna]', atleta.pernaBoa);
    texto('[data-campo-categoria]', atleta.categoria);
    texto('[data-campo-situacao]', atleta.situacao);

    repovoarLista('[data-lista-times]', dados.times, function (li, time) {
      var nome = document.createElement('strong');
      nome.textContent = time.nome || time;
      li.appendChild(nome);

      // período em branco significa que ele ainda está no clube
      var periodo = (time.periodo || '').trim();
      var span = document.createElement('span');
      span.className = 'periodo' + (periodo ? '' : ' periodo--atual');
      span.textContent = periodo || 'Atual';
      li.appendChild(span);

      if (time.marcador) {
        var marcador = document.createElement('em');
        marcador.textContent = time.marcador;
        li.appendChild(marcador);
      }
    });

    repovoarLista('[data-lista-torneios]', dados.torneios, function (li, nome) {
      li.textContent = nome;
    });

    repovoarLista('[data-lista-titulos]', dados.titulos, function (li, titulo) {
      var taca = document.createElement('span');
      taca.className = 'taca';
      taca.setAttribute('aria-hidden', 'true');
      taca.textContent = '🏆';
      li.appendChild(taca);

      var nome = document.createElement('strong');
      nome.textContent = titulo.nome || titulo;
      li.appendChild(nome);

      if (titulo.detalhe) {
        var detalhe = document.createElement('em');
        detalhe.textContent = titulo.detalhe;
        li.appendChild(detalhe);
      }
    });
  }

  /**
   * Cruza os arquivos que existem de fato (media.json) com as legendas e a
   * ordem definidas no painel (dados.json). Arquivo sem ordem definida vai
   * para o fim da fila, mantendo a ordem alfabética do nome.
   */
  function ordenarComMetadados(arquivos, metadados) {
    var meta = metadados || {};
    return arquivos
      .map(function (arquivo, posicao) {
        var info = meta[arquivo.src] || {};
        return {
          src: arquivo.src,
          nome: arquivo.nome,
          data: arquivo.data,
          legenda: info.legenda || '',
          ordem: typeof info.ordem === 'number' ? info.ordem : Infinity,
          alfabetica: posicao,
        };
      })
      .sort(function (a, b) {
        return a.ordem - b.ordem || a.alfabetica - b.alfabetica;
      });
  }

  /* ---------- Carrossel de vídeos ---------- */

  /**
   * Um único elemento <video> serve todos os vídeos, trocando a fonte a cada
   * passagem. É o que permite a emenda automática: uma vez que a pessoa deu
   * play, esse elemento fica autorizado a tocar, e a autorização acompanha as
   * trocas de fonte. Com um elemento por vídeo, o Safari do iPhone barraria a
   * reprodução do seguinte, por não ter vindo de um toque.
   */
  function montarCarrossel(videos) {
    var raiz = document.querySelector('[data-carrossel]');
    var aviso = document.querySelector('[data-vazio-videos]');
    if (!raiz || !videos.length) return; // sem vídeos, fica o aviso de pasta vazia

    aviso.hidden = true;
    raiz.hidden = false;

    var palco = raiz.querySelector('[data-palco]');
    var player = raiz.querySelector('[data-video]');
    var legendaTitulo = raiz.querySelector('[data-legenda-titulo]');
    var legendaDetalhe = raiz.querySelector('[data-legenda-detalhe]');
    var pontos = raiz.querySelector('[data-pontos]');
    var contador = raiz.querySelector('[data-contador]');
    var btnAnterior = raiz.querySelector('[data-anterior]');
    var btnProximo = raiz.querySelector('[data-proximo]');
    var atual = -1;

    // com muitos vídeos a fileira de pontos vira poluição: fica só o contador
    var listaPontos = [];
    if (videos.length <= 20) {
      videos.forEach(function (video, i) {
        var ponto = document.createElement('button');
        ponto.type = 'button';
        ponto.className = 'carrossel__ponto';
        ponto.setAttribute('aria-label', 'Ir para o vídeo ' + (i + 1));
        ponto.addEventListener('click', function () { irPara(i); });
        pontos.appendChild(ponto);
        listaPontos.push(ponto);
      });
    }

    function irPara(indice, tocar) {
      atual = Math.max(0, Math.min(indice, videos.length - 1));
      var video = videos[atual];

      palco.classList.add('is-trocando');
      player.src = video.src;
      player.load();

      if (tocar) {
        var reproducao = player.play();
        // navegador pode recusar a reprodução automática; aí fica pausado
        if (reproducao && reproducao.catch) reproducao.catch(function () {});
      }

      legendaTitulo.textContent =
        video.legenda || 'Vídeo ' + (atual + 1) + ' de ' + videos.length;
      legendaDetalhe.textContent = video.legenda
        ? 'Vídeo ' + (atual + 1) + ' de ' + videos.length + (video.data ? ' · ' + video.data : '')
        : video.data || video.nome;

      contador.textContent = (atual + 1) + ' / ' + videos.length;
      listaPontos.forEach(function (p, i) { p.classList.toggle('is-ativo', i === atual); });

      btnAnterior.disabled = atual === 0;
      btnProximo.disabled = atual === videos.length - 1;
    }

    function revelar() { palco.classList.remove('is-trocando'); }
    player.addEventListener('loadeddata', revelar);
    player.addEventListener('error', revelar);

    // fim do vídeo: emenda no próximo, como uma playlist
    player.addEventListener('ended', function () {
      if (atual >= videos.length - 1) return; // no último, para por aqui
      irPara(atual + 1, true);
    });

    // perto do fim, adianta o download do seguinte para a emenda não engasgar
    var adiantados = {};
    player.addEventListener('timeupdate', function () {
      if (atual >= videos.length - 1 || !player.duration) return;
      if (player.duration - player.currentTime > 8) return;

      var proximo = videos[atual + 1].src;
      if (adiantados[proximo]) return;
      adiantados[proximo] = true;

      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = proximo;
      document.head.appendChild(link);
    });

    btnAnterior.addEventListener('click', function () { irPara(atual - 1); });
    btnProximo.addEventListener('click', function () { irPara(atual + 1); });

    raiz.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') irPara(atual - 1);
      if (e.key === 'ArrowRight') irPara(atual + 1);
    });

    // Arrastar com o dedo
    var toqueX = null;
    raiz.addEventListener('touchstart', function (e) {
      toqueX = e.changedTouches[0].clientX;
    }, { passive: true });
    raiz.addEventListener('touchend', function (e) {
      if (toqueX === null) return;
      var delta = e.changedTouches[0].clientX - toqueX;
      if (Math.abs(delta) > 55) irPara(delta < 0 ? atual + 1 : atual - 1);
      toqueX = null;
    }, { passive: true });

    irPara(0);
  }

  /* ---------- Galeria de fotos + lightbox ---------- */
  function montarGaleria(fotos) {
    var galeria = document.querySelector('[data-galeria]');
    var aviso = document.querySelector('[data-vazio-fotos]');
    if (!galeria) return;

    if (!fotos.length) return;

    aviso.hidden = true;
    galeria.hidden = false;

    fotos.forEach(function (foto, i) {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'galeria__item';
      botao.setAttribute('aria-label', 'Ampliar foto ' + (i + 1));

      var img = document.createElement('img');
      img.src = foto.src;
      img.alt = foto.legenda || 'Foto ' + (i + 1) + (foto.data ? ' — ' + foto.data : '');
      img.loading = 'lazy';
      img.decoding = 'async';
      // esconde a miniatura se o arquivo não abrir (ex.: .heic sem suporte)
      img.addEventListener('error', function () { botao.remove(); });

      botao.appendChild(img);
      botao.addEventListener('click', function () { abrirLightbox(i); });
      galeria.appendChild(botao);
    });

    var lightbox = document.querySelector('[data-lightbox]');
    var lbImg = lightbox.querySelector('[data-lb-img]');
    var lbLegenda = lightbox.querySelector('[data-lb-legenda]');
    var indice = 0;

    function abrirLightbox(i) {
      indice = i;
      atualizarLightbox();
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    function fecharLightbox() {
      lightbox.hidden = true;
      lbImg.src = '';
      document.body.style.overflow = '';
    }

    function atualizarLightbox() {
      var foto = fotos[indice];
      lbImg.src = foto.src;
      lbImg.alt = foto.legenda || 'Foto ' + (indice + 1);
      lbLegenda.textContent =
        (foto.legenda ? foto.legenda + ' · ' : '') +
        'Foto ' + (indice + 1) + ' de ' + fotos.length +
        (foto.data ? ' · ' + foto.data : '');
    }

    function navegar(passo) {
      indice = (indice + passo + fotos.length) % fotos.length;
      atualizarLightbox();
    }

    lightbox.querySelector('[data-fechar]').addEventListener('click', fecharLightbox);
    lightbox.querySelector('[data-lb-anterior]').addEventListener('click', function () { navegar(-1); });
    lightbox.querySelector('[data-lb-proximo]').addEventListener('click', function () { navegar(1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) fecharLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') fecharLightbox();
      if (e.key === 'ArrowLeft') navegar(-1);
      if (e.key === 'ArrowRight') navegar(1);
    });
  }

  /* ---------- Animação de entrada das seções ---------- */
  function revelarSecoes() {
    var alvos = document.querySelectorAll('.secao, .hero__stats, .card');
    if (!('IntersectionObserver' in window)) return;

    alvos.forEach(function (el) { el.classList.add('revela'); });

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visivel');
          observador.unobserve(entrada.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    alvos.forEach(function (el) { observador.observe(el); });
  }

  revelarSecoes();

  Promise.all([carregarMidia(), buscarJson('assets/dados.json')]).then(function (r) {
    var midia = r[0];
    var dados = r[1];

    aplicarDados(dados);
    aplicarLogo(midia.logo);

    var meta = dados && dados.midia;
    montarCarrossel(ordenarComMetadados(midia.videos || [], meta));
    montarGaleria(ordenarComMetadados(midia.fotos || [], meta));
  });
})();
