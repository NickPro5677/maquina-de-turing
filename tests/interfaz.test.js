import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { ponerIdioma, t } from '../src/i18n/index.js';
import { etiquetaCasilla } from '../src/ui/vista2d.js';
import { focoBloqueaAtajo, textoConfirmarBorrado } from '../src/app.js';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

function nodo({ etiqueta, tipo, padre }) {
  const el = {
    etiqueta,
    tipo,
    padre,
    getAttribute(nombre) { return nombre === 'type' ? (tipo ?? null) : null; },
    matches(selector) {
      return selector.split(',').some((parte) => parte.trim() === etiqueta);
    },
    closest(selector) {
      const partes = selector.split(',').map((parte) => parte.trim());
      if (partes.includes(etiqueta)) return el;
      return padre?.closest(selector) ?? null;
    },
  };
  return el;
}

test('cinta 2D: la etiqueta de cada casilla sale en español y en inglés', () => {
  ponerIdioma('es');
  assert.equal(etiquetaCasilla(2, '1', false, true), 'casilla 2: 1, bajo el cabezal');
  assert.equal(etiquetaCasilla(-1, '_', true, false), 'casilla -1: blanco');
  ponerIdioma('en');
  try {
    assert.equal(etiquetaCasilla(2, '1', false, true), 'cell 2: 1, under the head');
    assert.equal(etiquetaCasilla(0, '_', true, false), 'cell 0: blank');
    assert.equal(t('cinta.casilla', { i: 4, s: '0', extra: '' }, 'en'), 'cell 4: 0');
  } finally {
    ponerIdioma('es');
  }
});

test('cinta 2D: el dibujo ya no deja el texto fijo en español', () => {
  const vista = leer('../src/ui/vista2d.js');
  assert.match(vista, /etiquetaCasilla/);
  assert.doesNotMatch(vista, /bajo el cabezal/);
});

test('borrar una máquina guardada pide confirmación traducida', () => {
  ponerIdioma('es');
  assert.equal(textoConfirmarBorrado('Copiar'), '¿Borrar la máquina «Copiar»? No se puede deshacer.');
  ponerIdioma('en');
  try {
    assert.equal(textoConfirmarBorrado('Copy'), 'Delete the machine “Copy”? This cannot be undone.');
  } finally {
    ponerIdioma('es');
  }
  const app = leer('../src/app.js');
  assert.match(app, /confirm\(textoConfirmarBorrado\(nombre\)\)/);
});

test('atajos: un botón no los apaga; un campo de texto, textarea o select sí', () => {
  const boton = nodo({ etiqueta: 'button' });
  const dentro = nodo({ etiqueta: 'span', padre: boton });
  assert.equal(focoBloqueaAtajo(boton), false);
  assert.equal(focoBloqueaAtajo(dentro), false);
  assert.equal(focoBloqueaAtajo(nodo({ etiqueta: 'input', tipo: 'text' })), true);
  assert.equal(focoBloqueaAtajo(nodo({ etiqueta: 'input' })), true);
  assert.equal(focoBloqueaAtajo(nodo({ etiqueta: 'textarea' })), true);
  assert.equal(focoBloqueaAtajo(nodo({ etiqueta: 'select' })), true);
  assert.equal(focoBloqueaAtajo(nodo({ etiqueta: 'input', tipo: 'range' })), true);
  assert.equal(focoBloqueaAtajo(nodo({ etiqueta: 'div' })), false);

  const app = leer('../src/app.js');
  assert.match(app, /focoBloqueaAtajo\(ev\.target\)/);
  assert.doesNotMatch(app, /closest\('input, select, textarea, button'\)/);
});

test('pestañas 2D/3D: tablist, aria-selected y tabindex itinerante', () => {
  const html = leer('../index.html');
  assert.match(html, /class="pestanas" role="tablist"/);
  assert.match(html, /id="tab-2d" aria-selected="true" aria-controls="panel-2d" tabindex="0"/);
  assert.match(html, /id="tab-3d" aria-selected="false" aria-controls="panel-3d" tabindex="-1"/);
  const app = leer('../src/app.js');
  assert.match(app, /el\.tabIndex = activo \? 0 : -1/);
  assert.match(app, /ev\.key !== 'ArrowRight' && ev\.key !== 'ArrowLeft'/);
});

test('móvil: objetivos de 44 px, etiquetas visibles y área segura', () => {
  const css = leer('../css/estilos.css');
  assert.match(css, /env\(safe-area-inset-top/);
  assert.match(css, /env\(safe-area-inset-right/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /env\(safe-area-inset-left/);
  assert.match(css, /\.ajuste \{ min-width: 44px; height: 44px; min-height: 44px; padding: 0 12px; \}/);
  assert.match(css, /\.tabla-editor \.borrar \{ width: 44px; height: 44px; \}/);
  assert.match(css, /\.pistas summary \{ min-height: 44px; padding-top: 8px; padding-bottom: 8px; \}/);
  assert.match(css, /\.menu a \{[^}]*min-height: 44px/);
  assert.doesNotMatch(css, /min-height:\s*38px/);
  assert.doesNotMatch(css, /width: 36px; height: 40px/);
  assert.doesNotMatch(css, /form-entrada \.campo:nth-child\(2\) span/);
  const html = leer('../index.html');
  assert.match(html, /id="sel-ejemplo"[^>]*aria-label="Ejemplo"/);
  assert.match(html, /id="in-cinta"[^>]*placeholder="Cinta de entrada"/);
});

test('la versión del service worker coincide con package.json', () => {
  const version = JSON.parse(leer('../package.json')).version;
  assert.equal(version, '1.2.0');
  assert.match(leer('../sw.js'), new RegExp(`maquina-turing-v${version.replaceAll('.', '\\.')}`));
  assert.match(leer('../CHANGELOG.md'), new RegExp(`v${version.replaceAll('.', '\\.')}`));
});
