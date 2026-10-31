import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EJEMPLOS, crearDefinicion, importarJSON, exportarJSON, validarObjetoMaquina, MAX_REGLAS,
  codificarMaquina, decodificarMaquina, enlaceMaquina, MAX_ENLACE,
  EJERCICIOS, buscarEjercicio, solucionEjercicio, comprobarEjercicio,
  leerBiblioteca, guardarEnBiblioteca, borrarDeBiblioteca, buscarEnBiblioteca, serializarBiblioteca, MAX_GUARDADAS,
  MENSAJES_MOTOR, ponerIdiomaMotor, describirRegla, EJEMPLOS as LISTA,
} from '../src/motor/index.js';
import { DICCIONARIOS, t } from '../src/i18n/index.js';
import { TEMAS, LINEA_TIEMPO } from '../src/ui/aprende.js';
import { TEMAS_EN, LINEA_TIEMPO_EN } from '../src/ui/aprende.en.js';

const sinDescripcion = (d) => ({ ...crearDefinicion(d), descripcion: '' });

/* Enlaces para compartir */
test('enlace: ida y vuelta conserva todos los ejemplos', () => {
  for (const e of EJEMPLOS) {
    const def = crearDefinicion(e);
    const vuelta = decodificarMaquina(codificarMaquina(def));
    assert.deepEqual(sinDescripcion(vuelta), sinDescripcion(def), e.id);
  }
});
test('enlace: el código es seguro para URL y la ruta apunta al simulador', () => {
  const def = crearDefinicion(EJEMPLOS[0]);
  const url = enlaceMaquina('https://x.test/app/index.html#/editor', def);
  assert.match(url, /^https:\/\/x\.test\/app\/index\.html#\/simulador\?m=[A-Za-z0-9_-]+$/);
  assert.deepEqual(sinDescripcion(decodificarMaquina(url.split('m=')[1])), sinDescripcion(def));
});
test('enlace: acentos y símbolos raros sobreviven', () => {
  const def = crearDefinicion({ nombre: 'Máquina ñ «π»', estadoInicial: 'q0', finales: ['qF'], entrada: 'ab',
    reglas: [['q0', 'a', 'b', 'D', 'q0'], ['q0', 'b', 'a', 'D', 'q0'], ['q0', '_', '_', 'N', 'qF']] });
  assert.equal(decodificarMaquina(codificarMaquina(def)).nombre, 'Máquina ñ «π»');
});
test('enlace: entradas malformadas lanzan un error claro', () => {
  for (const malo of ['', '!!!', 'aGVsbG8', codificarMaquina(crearDefinicion(EJEMPLOS[0])).slice(0, 20), 'A'.repeat(MAX_ENLACE + 1)]) {
    assert.throws(() => decodificarMaquina(malo), /enlace/i, JSON.stringify(malo.slice(0, 30)));
  }
});

/* Validación al importar */
test('importar: acepta lo que exporta', () => {
  for (const e of EJEMPLOS) assert.deepEqual(importarJSON(exportarJSON(crearDefinicion(e))).reglas, crearDefinicion(e).reglas);
});
test('importar: rechaza JSON roto, formato ajeno y reglas mal formadas', () => {
  const casos = [
    'no es json', '[]', '{}', '{"reglas":"x"}', '{"formato":"otra-cosa/9","reglas":[]}',
    '{"reglas":[["q0","1"]]}', '{"reglas":[{"estado":"q0"}]}', '{"nombre":{},"reglas":[]}',
    '{"finales":[1],"reglas":[]}', JSON.stringify({ reglas: Array.from({ length: MAX_REGLAS + 1 }, (_, i) => ['q' + i, '1', '1', 'D', 'q0']) }),
  ];
  for (const c of casos) assert.throws(() => importarJSON(c), undefined, c.slice(0, 40));
});
test('importar: validarObjetoMaquina acepta reglas como objetos', () => {
  assert.doesNotThrow(() => validarObjetoMaquina({ reglas: [{ estado: 'q0', lee: '1', escribe: '1', mueve: 'D', nuevo: 'q0' }] }));
});

/* Ejercicios */
test('ejercicios: cada solución supera todos sus casos', () => {
  for (const e of EJERCICIOS) {
    const r = comprobarEjercicio(e, solucionEjercicio(e));
    assert.equal(r.aprobado, true, e.id);
    assert.equal(r.casos.length, e.casos.length);
  }
});
test('ejercicios: la plantilla vacía no aprueba y se explica por qué', () => {
  for (const e of EJERCICIOS) assert.equal(comprobarEjercicio(e, crearDefinicion(e.plantilla)).aprobado, false, e.id);
});
test('ejercicios: una máquina que no para queda frenada por el límite de pasos', () => {
  const e = buscarEjercicio('sumar-dos');
  const bucle = crearDefinicion({ ...e.plantilla, reglas: [['q0', '1', '1', 'D', 'q0'], ['q0', '_', '_', 'D', 'q0']] });
  const r = comprobarEjercicio(e, bucle, { limite: 50 });
  assert.equal(r.aprobado, false);
  assert.ok(r.casos.every((c) => c.motivo === 'limite' && c.pasos <= 50));
});
test('ejercicios: una respuesta equivocada marca el caso que falla', () => {
  const e = buscarEjercicio('sumar-dos');
  const sumaUno = crearDefinicion({ ...e.plantilla, reglas: [['q0', '1', '1', 'D', 'q0'], ['q0', '_', '1', 'N', 'qF']] });
  const r = comprobarEjercicio(e, sumaUno);
  assert.equal(r.aprobado, false);
  assert.ok(r.casos.some((c) => !c.ok && c.motivo === 'final'));
});
test('ejercicios: textos completos en los dos idiomas', () => {
  for (const e of EJERCICIOS) for (const l of ['es', 'en']) {
    assert.ok(e[l].titulo && e[l].objetivo && e[l].pistas.length >= 1, `${e.id} ${l}`);
    assert.equal(e[l].pistas.length, e.es.pistas.length);
  }
});

/* Máquinas guardadas */
test('biblioteca: guardar, reemplazar sin importar mayúsculas, buscar y borrar', () => {
  const d = crearDefinicion(EJEMPLOS[0]);
  let l = guardarEnBiblioteca([], d, 'Uno', 1);
  l = guardarEnBiblioteca(l, d, 'Dos', 2);
  l = guardarEnBiblioteca(l, d, 'uno', 3);
  assert.deepEqual(l.map((x) => x.nombre), ['uno', 'Dos']);
  assert.ok(buscarEnBiblioteca(l, 'UNO'));
  l = borrarDeBiblioteca(l, 'Dos');
  assert.deepEqual(l.map((x) => x.nombre), ['uno']);
  assert.deepEqual(leerBiblioteca(serializarBiblioteca(l)).map((x) => x.nombre), ['uno']);
});
test('biblioteca: ignora datos corruptos y respeta el máximo', () => {
  assert.deepEqual(leerBiblioteca('basura'), []);
  assert.deepEqual(leerBiblioteca([{ nombre: 'x', def: { reglas: 'no' } }]), []);
  let l = [];
  for (let i = 0; i < MAX_GUARDADAS + 5; i++) l = guardarEnBiblioteca(l, crearDefinicion(EJEMPLOS[0]), 'm' + i, i);
  assert.equal(l.length, MAX_GUARDADAS);
});

/* Idiomas */
const claves = (o) => Object.keys(o).sort();
test('i18n: la interfaz tiene las mismas claves en español e inglés', () => {
  assert.deepEqual(claves(DICCIONARIOS.en), claves(DICCIONARIOS.es));
  for (const k of Object.keys(DICCIONARIOS.es)) {
    const ph = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    assert.equal(ph(DICCIONARIOS.en[k]), ph(DICCIONARIOS.es[k]), `marcadores de ${k}`);
  }
});
test('i18n: los mensajes del motor tienen las mismas claves', () => {
  assert.deepEqual(claves(MENSAJES_MOTOR.en), claves(MENSAJES_MOTOR.es));
});
test('i18n: cada data-i18n de index.html existe', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const usadas = [...html.matchAll(/data-i18n(?:-aria|-title|-ph)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(usadas.length > 50);
  for (const k of usadas) assert.ok(k in DICCIONARIOS.es, k);
});
test('i18n: teoría, línea de tiempo y ejemplos traducidos', () => {
  assert.deepEqual(TEMAS_EN.map((x) => x.id), TEMAS.map((x) => x.id));
  assert.equal(LINEA_TIEMPO_EN.length, LINEA_TIEMPO.length);
  for (const e of LISTA) assert.ok(e.en?.nombre && e.en.resumen && e.en.descripcion, e.id);
  assert.equal(t('ruta.simulador', {}, 'en'), 'Simulator');
});
test('i18n: el motor muestra L/R/S en inglés', () => {
  ponerIdiomaMotor('en');
  try { assert.match(describirRegla({ estado: 'q0', lee: '1', escribe: '0', mueve: 'D', nuevo: 'q1' }), /R/); } finally { ponerIdiomaMotor('es'); }
});
