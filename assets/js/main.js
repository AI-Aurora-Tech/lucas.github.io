/* ============================================================
   Portfólio — Lucas Gabriel Silva dos Santos
   Idade automática, carrossel de vídeos e galeria de fotos.
   ============================================================ */
(function () {
  'use strict';

  var MIDIA = window.MIDIA || { logo: null, fotos: [], videos: [] };
  var NASCIMENTO = { ano: 2011, mes: 3, dia: 10 }; // 10/03/2011

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

  /* ---------- Logo vindo do media.js (caso tenha outra extensão) ---------- */
  if (MIDIA.logo) {
    document.querySelectorAll('.topo__logo, .hero__logo').forEach(function (img) {
      img.setAttribute('src', MIDIA.logo);
    });
  }

  /* ---------- Carrossel de vídeos ---------- */
  function montarCarrossel(videos) {
    var raiz = document.querySelector('[data-carrossel]');
    var aviso = document.querySelector('[data-vazio-videos]');
    if (!raiz) return;

    if (!videos.length) return; // mantém o aviso de pasta vazia

    aviso.hidden = true;
    raiz.hidden = false;

    var trilho = raiz.querySelector('[data-trilho]');
    var pontos = raiz.querySelector('[data-pontos]');
    var contador = raiz.querySelector('[data-contador]');
    var btnAnterior = raiz.querySelector('[data-anterior]');
    var btnProximo = raiz.querySelector('[data-proximo]');
    var atual = 0;

    videos.forEach(function (video, i) {
      var slide = document.createElement('div');
      slide.className = 'carrossel__slide';

      var el = document.createElement('video');
      el.controls = true;
      el.playsInline = true;
      el.preload = i === 0 ? 'metadata' : 'none';
      el.setAttribute('controlsList', 'nodownload');
      if (i === 0) el.src = video.src; // os demais carregam sob demanda
      el.dataset.src = video.src;
      slide.appendChild(el);

      var legenda = document.createElement('p');
      legenda.className = 'carrossel__legenda';
      legenda.innerHTML =
        '<b>Vídeo ' + (i + 1) + ' de ' + videos.length + '</b>' +
        '<span>' + (video.data ? video.data : escapar(video.nome)) + '</span>';
      slide.appendChild(legenda);

      trilho.appendChild(slide);

      // com muitos vídeos a fileira de pontos vira poluição: fica só o contador
      if (videos.length <= 20) {
        var ponto = document.createElement('button');
        ponto.type = 'button';
        ponto.className = 'carrossel__ponto';
        ponto.setAttribute('aria-label', 'Ir para o vídeo ' + (i + 1));
        ponto.addEventListener('click', function () { irPara(i); });
        pontos.appendChild(ponto);
      }
    });

    var slides = Array.prototype.slice.call(trilho.children);
    var listaPontos = Array.prototype.slice.call(pontos.children);

    function irPara(indice) {
      atual = Math.max(0, Math.min(indice, videos.length - 1));
      trilho.style.transform = 'translateX(' + (-100 * atual) + '%)';
      contador.textContent = (atual + 1) + ' / ' + videos.length;

      listaPontos.forEach(function (p, i) {
        p.classList.toggle('is-ativo', i === atual);
      });

      slides.forEach(function (slide, i) {
        var video = slide.querySelector('video');
        if (i === atual) {
          if (!video.getAttribute('src')) video.setAttribute('src', video.dataset.src);
          video.preload = 'metadata';
        } else if (!video.paused) {
          video.pause(); // não deixa dois vídeos tocando juntos
        }
      });

      btnAnterior.disabled = atual === 0;
      btnProximo.disabled = atual === videos.length - 1;
    }

    btnAnterior.addEventListener('click', function () { irPara(atual - 1); });
    btnProximo.addEventListener('click', function () { irPara(atual + 1); });

    // Teclado (quando o carrossel está em foco/visível)
    raiz.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { irPara(atual - 1); }
      if (e.key === 'ArrowRight') { irPara(atual + 1); }
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
      img.alt = 'Foto ' + (i + 1) + (foto.data ? ' — ' + foto.data : '');
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
      lbImg.alt = 'Foto ' + (indice + 1);
      lbLegenda.textContent =
        'Foto ' + (indice + 1) + ' de ' + fotos.length + (foto.data ? ' · ' + foto.data : '');
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

  function escapar(texto) {
    var div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  montarCarrossel(MIDIA.videos || []);
  montarGaleria(MIDIA.fotos || []);
  revelarSecoes();
})();
