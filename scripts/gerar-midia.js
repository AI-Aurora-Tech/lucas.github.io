#!/usr/bin/env node
/**
 * Varre as pastas midia/fotos, midia/videos e midia/logo e gera assets/media.js
 * com a lista completa de arquivos encontrados.
 *
 * Uso: node scripts/gerar-midia.js
 *
 * O arquivo gerado e carregado pelo index.html via <script>, entao o site
 * funciona tanto no GitHub Pages quanto abrindo o index.html direto no navegador.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PASTA_FOTOS = path.join(RAIZ, 'midia', 'fotos');
const PASTA_VIDEOS = path.join(RAIZ, 'midia', 'videos');
const PASTA_LOGO = path.join(RAIZ, 'midia', 'logo');
const SAIDA = path.join(RAIZ, 'assets', 'media.js');

const EXT_FOTO = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.heic', '.heif'];
const EXT_VIDEO = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.m4v', '.3gp', '.mkv'];

/** Lista arquivos de uma pasta (recursivo) filtrando pelas extensoes aceitas. */
function listar(pasta, extensoes) {
  if (!fs.existsSync(pasta)) return [];

  const encontrados = [];

  (function varrer(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name.startsWith('.')) continue;
      const completo = path.join(dir, item.name);
      if (item.isDirectory()) {
        varrer(completo);
      } else if (extensoes.includes(path.extname(item.name).toLowerCase())) {
        encontrados.push(completo);
      }
    }
  })(pasta);

  return encontrados
    .map((completo) => {
      const relativo = path.relative(RAIZ, completo).split(path.sep).join('/');
      return {
        src: relativo,
        nome: path.basename(completo),
        data: extrairData(path.basename(completo)),
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
}

/**
 * Arquivos baixados do WhatsApp costumam ter a data no nome
 * (ex.: "WhatsApp Video 2025-11-03 at 19.42.10.mp4"). Quando da, vira legenda.
 */
function extrairData(nome) {
  const iso = nome.match(/(20\d{2})[-_.]?(\d{2})[-_.]?(\d{2})/);
  if (!iso) return null;
  const [, ano, mes, dia] = iso;
  const numMes = Number(mes);
  const numDia = Number(dia);
  if (numMes < 1 || numMes > 12 || numDia < 1 || numDia > 31) return null;
  return `${dia}/${mes}/${ano}`;
}

/** O logo e sempre o Logo.jpeg; se o arquivo tiver outra extensao, pega o primeiro da pasta. */
function acharLogo() {
  const preferido = listar(PASTA_LOGO, EXT_FOTO).find((f) => /^logo\./i.test(f.nome));
  if (preferido) return preferido.src;
  const qualquer = listar(PASTA_LOGO, EXT_FOTO)[0];
  return qualquer ? qualquer.src : null;
}

const midia = {
  gerado_em: new Date().toISOString(),
  logo: acharLogo(),
  fotos: listar(PASTA_FOTOS, EXT_FOTO),
  videos: listar(PASTA_VIDEOS, EXT_VIDEO),
};

const conteudo =
  '/* Arquivo gerado automaticamente por scripts/gerar-midia.js — nao edite a mao. */\n' +
  'window.MIDIA = ' +
  JSON.stringify(midia, null, 2) +
  ';\n';

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, conteudo, 'utf8');

console.log(`Logo:   ${midia.logo || '(nenhum encontrado em midia/logo)'}`);
console.log(`Fotos:  ${midia.fotos.length}`);
console.log(`Videos: ${midia.videos.length}`);
console.log(`Gerado: ${path.relative(RAIZ, SAIDA)}`);
