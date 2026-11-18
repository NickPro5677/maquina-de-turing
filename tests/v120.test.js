import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import {
  MaquinaTuring, crearDefinicion, buscarEjemplo, EJEMPLOS, cintaTraza, RADIO_TRAZA,
  interpretarLimitePasos, LIMITE_PASOS_MIN, LIMITE_PASOS_MAX,
} from '../src/motor/index.js';
import { DICCIONARIOS } from '../src/i18n/index.js';
import { PoolCasillas, posicionesVisibles, TAMANO_POOL_3D } from '../src/ui/poolCasillas.js';

const def = (id) => crearDefinicion(buscarEjemplo(id));

/** La cinta entera, como se mostraba antes de la ventana. */
function cintaEntera(m) {
  const k = [...m.cinta.keys()];
  const a = Math.min(0, m.cabezal, ...k);
  const b = Math.max(m.cabezal, ...k, [...m.entrada].length);
  const partes = [];
  for (let i = a; i <= b; i++) partes.push(i === m.cabezal ? `[${m.leer(i)}]` : m.leer(i));
  return partes.join(' ');
}

function cuerpo(cinta) {
  return cinta.split(' ').filter((t) => t !== '…').join(' ');
}

test('las cintas cortas se ven enteras, también si el cabezal va a la izquierda', () => {
  for (const id of ['sumar-uno', 'castor-2', 'castor-3', 'palindromo', 'bucle']) {
    const m = new MaquinaTuring(def(id), { limitePasos: id === 'bucle' ? 40 : 10000 });
    const revisar = () => {
      const cinta = cintaTraza(m);
      assert.equal(cinta, cintaEntera(m), `${id} paso ${m.pasos}`);
      assert.equal(cinta.includes('…'), false);
    };
    revisar();
    while (m.pasos < 40 && m.paso()) revisar();
  }
  for (const e of EJEMPLOS) {
    const m = new MaquinaTuring(crearDefinicion(e), { limitePasos: 80 });
    assert.equal(cintaTraza(m).includes('…'), false, e.id);
  }
});

test('una cinta larga guarda solo la ventana alrededor del cabezal', () => {
  const corta = new MaquinaTuring(def('sumar-uno'), { entrada: '1'.repeat(60) });
  assert.equal(cintaTraza(corta).includes('…'), false);
  assert.equal(cintaTraza(corta).split(' ').length, RADIO_TRAZA * 2 + 1);

  const larga = new MaquinaTuring(def('sumar-uno'), { entrada: '1'.repeat(200) });
  const alInicio = cintaTraza(larga);
  assert.ok(alInicio.startsWith('[1]'));
  assert.ok(alInicio.endsWith('…'));
  assert.equal(cuerpo(alInicio).split(' ').length, RADIO_TRAZA + 1);
  assert.ok(cintaEntera(larga).startsWith(cuerpo(alInicio)));

  const alPaso0 = cintaTraza(larga);
  larga.paso();
  assert.notEqual(cintaTraza(larga), alPaso0);
  larga.pasoAtras();
  assert.equal(cintaTraza(larga), alPaso0);
  assert.equal(larga.pasos, 0);

  while (larga.pasos < 100) larga.paso();
  const enMedio = cintaTraza(larga);
  assert.match(enMedio, /^… /);
  assert.match(enMedio, / …$/);
  assert.equal(cuerpo(enMedio).split(' ').length, RADIO_TRAZA * 2 + 1);
  assert.equal((enMedio.match(/\[/g) || []).length, 1);
  assert.ok(cintaEntera(larga).includes(cuerpo(enMedio)));

  larga.ejecutar();
  const alFinal = cintaTraza(larga);
  assert.match(alFinal, /^… /);
  assert.match(alFinal, /\[1\]$/);
  assert.equal(alFinal.includes(' …'), false);
  assert.ok(cintaEntera(larga).endsWith(cuerpo(alFinal)));
});

test('la traza de 5000 unos cabe en filas cortas y tarda menos de 500 ms', () => {
  const entrada = '1'.repeat(5000);
  const m = new MaquinaTuring(def('sumar-uno'), { entrada });
  const t0 = performance.now();
  const filas = [cintaTraza(m)];
  while (m.paso()) {
    filas.push(cintaTraza(m));
    if (filas.length > 5000) filas.splice(1, filas.length - 5000);
  }
  const pintadas = filas.slice(-200).join('');
  const ms = performance.now() - t0;
  assert.equal(m.pasos, 5001);
  assert.equal(filas.length, 5000);
  assert.ok(pintadas.length > 0);
  for (const cinta of filas) {
    assert.ok(cinta.length < 250, `fila de ${cinta.length} caracteres`);
    assert.equal((cinta.match(/\[/g) || []).length, 1);
  }
  assert.match(filas.at(-1), /\[1\]$/);
  assert.match(filas.at(-1), /^… /);
  assert.ok(ms < 500, `la traza tardó ${ms.toFixed(0)} ms`);
});

test('el límite de pasos se lee como un entero entre 1 y 1 000 000', () => {
  assert.deepEqual(interpretarLimitePasos('10000'), { ok: true, n: 10000 });
  assert.deepEqual(interpretarLimitePasos(' 42 '), { ok: true, n: 42 });
  assert.deepEqual(interpretarLimitePasos('00010'), { ok: true, n: 10 });
  assert.equal(interpretarLimitePasos(String(LIMITE_PASOS_MIN)).n, 1);
  assert.equal(interpretarLimitePasos(String(LIMITE_PASOS_MAX)).n, 1000000);
  for (const malo of ['', '10.5', '-1', '1e3', '1_000', 'mil', '  ']) {
    assert.equal(interpretarLimitePasos(malo).error, 'formato', malo);
  }
  assert.equal(interpretarLimitePasos('0').error, 'pequeno');
  assert.equal(interpretarLimitePasos('1000001').error, 'grande');
});

test('fijarLimite deja seguir o corta, y no revive una máquina que ya paró', () => {
  const bucle = new MaquinaTuring(def('bucle'), { limitePasos: 10 });
  assert.equal(bucle.ejecutar(), 10);
  assert.equal(bucle.motivo, 'limite');
  bucle.fijarLimite(interpretarLimitePasos('15').n);
  assert.equal(bucle.motivo, null);
  assert.equal(bucle.ejecutar(), 5);
  assert.equal(bucle.pasos, 15);
  bucle.fijarLimite(12);
  assert.equal(bucle.motivo, 'limite');
  assert.equal(bucle.paso(), null);

  const suma = new MaquinaTuring(def('sumar-uno'));
  suma.ejecutar();
  assert.equal(suma.motivo, 'final');
  suma.fijarLimite(100);
  assert.equal(suma.motivo, 'final');
  assert.equal(suma.paso(), null);
});

test('el pool 3D recicla piezas y no pasa del tamaño visible', () => {
  assert.equal(posicionesVisibles(0).length, TAMANO_POOL_3D);
  assert.equal(TAMANO_POOL_3D, 27);
  const pool = new PoolCasillas(TAMANO_POOL_3D);
  let anterior = null;
  for (let centro = 0; centro < 1000; centro++) {
    const { mapa, nuevas } = pool.sincronizar(posicionesVisibles(centro));
    assert.equal(mapa.size, TAMANO_POOL_3D);
    assert.ok(pool.creadas <= TAMANO_POOL_3D);
    assert.equal(nuevas.length, centro === 0 ? TAMANO_POOL_3D : 0);
    if (anterior) {
      for (const [pos, id] of mapa) {
        if (anterior.has(pos)) assert.equal(id, anterior.get(pos));
      }
    }
    anterior = mapa;
  }
  assert.equal(pool.creadas, TAMANO_POOL_3D);
  assert.equal(pool.enUso, TAMANO_POOL_3D);
  assert.equal(pool.liberar(), TAMANO_POOL_3D);
  assert.equal(pool.creadas, 0);
  assert.equal(pool.enUso, 0);
  pool.sincronizar(posicionesVisibles(80));
  assert.equal(pool.creadas, TAMANO_POOL_3D);
  assert.throws(() => new PoolCasillas(2).sincronizar([0, 1, 2]), /pool agotado/);
});

test('la vista 3D usa el pool y libera geometrías y materiales', () => {
  const src = readFileSync(new URL('../src/ui/vista3d.js', import.meta.url), 'utf8');
  assert.match(src, /new PoolCasillas\(TAMANO_POOL_3D\)/);
  assert.match(src, /this\.pool\.sincronizar/);
  assert.match(src, /geoCasilla\?\.dispose\(\)/);
  assert.match(src, /mat\.dispose\(\)/);
  assert.match(src, /this\._maquina !== m/);
});

test('la interfaz tiene el botón de correr hasta el final y el límite, en los dos idiomas', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="b-hasta-final"/);
  assert.match(html, /id="in-limite"/);
  assert.match(html, /data-i18n="sim\.hastaFinal"/);
  assert.match(html, /data-i18n="sim\.limite"/);
  assert.equal(DICCIONARIOS.es['sim.hastaFinal'], 'Correr hasta el final');
  assert.equal(DICCIONARIOS.en['sim.hastaFinal'], 'Run to the end');
  assert.ok(DICCIONARIOS.es['sim.limiteErr.formato']);
  assert.ok(DICCIONARIOS.en['sim.limiteErr.grande'].includes('{n}'));
  assert.equal(
    (DICCIONARIOS.es['sim.limiteErr.grande'].match(/\{\w+\}/g) || []).join(),
    (DICCIONARIOS.en['sim.limiteErr.grande'].match(/\{\w+\}/g) || []).join(),
  );
});
