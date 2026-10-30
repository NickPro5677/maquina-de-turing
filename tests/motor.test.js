import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  MaquinaTuring, crearDefinicion, validar, traza, parsearReglas, reglasATexto,
  exportarJSON, importarJSON, normalizarMovimiento, describirRegla, buscarRegla,
  EJEMPLOS, buscarEjemplo, BLANCO,
} from '../src/motor/index.js';

const def = (id) => crearDefinicion(buscarEjemplo(id));
const correr = (id, entrada) => {
  const m = new MaquinaTuring(def(id), entrada === undefined ? {} : { entrada });
  m.ejecutar();
  return m;
};

describe('Ejemplo principal: sumar 1 en unario', () => {
  test('111 → 1111 en 4 pasos y termina en qF', () => {
    const m = correr('sumar-uno');
    assert.equal(m.resultado(), '1111');
    assert.equal(m.pasos, 4);
    assert.equal(m.estado, 'qF');
    assert.equal(m.motivo, 'final');
    assert.equal(m.cabezal, 3);
  });

  test('traza exacta de la guía (pasos 0 a 4)', () => {
    const filas = traza(def('sumar-uno'), '111');
    assert.deepEqual(filas, [
      { paso: 0, cinta: '[1] 1 1 _', estado: 'q0', regla: 'lee 1 → escribe 1, D' },
      { paso: 1, cinta: '1 [1] 1 _', estado: 'q0', regla: 'lee 1 → escribe 1, D' },
      { paso: 2, cinta: '1 1 [1] _', estado: 'q0', regla: 'lee 1 → escribe 1, D' },
      { paso: 3, cinta: '1 1 1 [_]', estado: 'q0', regla: 'lee _ → escribe 1, para' },
      { paso: 4, cinta: '1 1 1 [1]', estado: 'qF', regla: 'FIN: resultado 1111' },
    ]);
  });

  test('solo tiene las dos reglas de la guía', () => {
    assert.deepEqual(def('sumar-uno').reglas, [
      { estado: 'q0', lee: '1', escribe: '1', mueve: 'D', nuevo: 'q0' },
      { estado: 'q0', lee: '_', escribe: '1', mueve: 'N', nuevo: 'qF' },
    ]);
  });

  for (const [n, pasos] of [[0, 1], [1, 2], [5, 6], [10, 11]]) {
    test(`n = ${n} → n + 1 unos en ${pasos} pasos`, () => {
      const m = correr('sumar-uno', '1'.repeat(n));
      assert.equal(m.resultado(), '1'.repeat(n + 1));
      assert.equal(m.pasos, pasos);
    });
  }
});

describe('Ejemplos precargados', () => {
  test('todos son válidos (sin errores)', () => {
    for (const e of EJEMPLOS) {
      const v = validar(crearDefinicion(e));
      assert.equal(v.errores.length, 0, `${e.id}: ${JSON.stringify(v.errores)}`);
    }
  });

  test('los ids son únicos', () => {
    assert.equal(new Set(EJEMPLOS.map((e) => e.id)).size, EJEMPLOS.length);
  });

  const casos = [
    ['invertir-bits', '1011', '0100', 5, 'final'],
    ['invertir-bits', '000', '111', 4, 'final'],
    ['sumar-unarios', '11+111', '11111', 8, 'final'],
    ['sumar-unarios', '1+1', '11', 5, 'final'],
    ['incrementar-binario', '1011', '1100', 8, 'final'],
    ['incrementar-binario', '111', '1000', 8, 'final'],
    ['incrementar-binario', '0', '1', 3, 'final'],
  ];
  for (const [id, entrada, salida, pasos, motivo] of casos) {
    test(`${id}: ${entrada} → ${salida} en ${pasos} pasos`, () => {
      const m = correr(id, entrada);
      assert.equal(m.resultado(), salida);
      assert.equal(m.pasos, pasos);
      assert.equal(m.motivo, motivo);
    });
  }

  for (const [entrada, motivo] of [
    ['0110', 'acepta'], ['10101', 'acepta'], ['', 'acepta'], ['1', 'acepta'],
    ['011', 'rechaza'], ['10', 'rechaza'], ['0111', 'rechaza'],
  ]) {
    test(`palíndromo: «${entrada}» → ${motivo}`, () => {
      const m = correr('palindromo', entrada);
      assert.equal(m.motivo, motivo);
      assert.ok(m.detenida);
    });
  }

  test('palíndromo 0110 acepta en 15 pasos', () => {
    assert.equal(correr('palindromo', '0110').pasos, 15);
  });

  test('castor atareado de 2 estados: 4 unos en 6 pasos', () => {
    const m = correr('castor-2');
    assert.equal(m.contar('1'), 4);
    assert.equal(m.pasos, 6);
    assert.equal(m.estado, 'H');
  });

  test('castor atareado de 3 estados: 6 unos en 14 pasos', () => {
    const m = correr('castor-3');
    assert.equal(m.contar('1'), 6);
    assert.equal(m.pasos, 14);
    assert.equal(m.estado, 'H');
  });

  test('S(3) = 21: la máquina de 3 estados con más pasos para en 21 pasos con 5 unos', () => {
    const m = new MaquinaTuring(crearDefinicion({
      inicial: 'A', finales: ['H'],
      reglas: [['A', '_', '1', 'D', 'B'], ['A', '1', '1', 'D', 'H'], ['B', '_', '1', 'I', 'B'],
        ['B', '1', '_', 'D', 'C'], ['C', '_', '1', 'I', 'C'], ['C', '1', '1', 'I', 'A']],
    }));
    m.ejecutar();
    assert.equal(m.pasos, 21);
    assert.equal(m.contar('1'), 5);
  });

  test('bucle sin fin: se corta en el límite de pasos', () => {
    const m = new MaquinaTuring(def('bucle'), { limitePasos: 500 });
    assert.equal(m.ejecutar(), 500);
    assert.equal(m.motivo, 'limite');
    assert.equal(m.detenida, false);
    assert.equal(m.paso(), null);
  });

  test('buscarEjemplo devuelve null si no existe', () => {
    assert.equal(buscarEjemplo('no-existe'), null);
  });
});

describe('Paso a paso y paso atrás', () => {
  test('paso atrás deshace todo hasta el paso 0', () => {
    const m = new MaquinaTuring(def('incrementar-binario'), { entrada: '1011' });
    const inicial = JSON.stringify([...m.cinta]);
    m.ejecutar();
    while (m.pasoAtras());
    assert.equal(m.pasos, 0);
    assert.equal(m.estado, 'q0');
    assert.equal(m.cabezal, 0);
    assert.equal(JSON.stringify([...m.cinta]), inicial);
    assert.equal(m.motivo, null);
  });

  test('paso atrás en el paso 0 devuelve false', () => {
    assert.equal(new MaquinaTuring(def('sumar-uno')).pasoAtras(), false);
  });

  test('ir y volver reproduce la misma traza', () => {
    const m = new MaquinaTuring(def('palindromo'), { entrada: '0110' });
    const fotos = [m.cintaConCabezal()];
    while (m.paso()) fotos.push(m.cintaConCabezal());
    for (let i = fotos.length - 1; i >= 0; i--) {
      assert.equal(m.cintaConCabezal(), fotos[i]);
      m.pasoAtras();
    }
  });

  test('paso atrás después de parar permite seguir', () => {
    const m = correr('sumar-uno');
    assert.ok(m.detenida);
    m.pasoAtras();
    assert.equal(m.detenida, false);
    assert.equal(m.leer(), BLANCO);
    assert.ok(m.paso());
    assert.equal(m.resultado(), '1111');
  });

  test('una máquina detenida no da más pasos', () => {
    const m = correr('sumar-uno');
    assert.equal(m.paso(), null);
    assert.equal(m.pasos, 4);
  });

  test('reglaActual es la regla activa y null al parar', () => {
    const m = new MaquinaTuring(def('sumar-uno'));
    assert.deepEqual(m.reglaActual(), buscarRegla(m.def, 'q0', '1'));
    m.ejecutar();
    assert.equal(m.reglaActual(), null);
  });

  test('el cabezal puede ir a posiciones negativas', () => {
    const m = correr('castor-2');
    assert.ok(m.limites()[0] < 0);
    assert.equal(m.resultado(), '1111');
  });

  test('para sin regla y lo explica', () => {
    const m = new MaquinaTuring(crearDefinicion({ inicial: 'q0', finales: ['qF'], reglas: [['q0', '1', '1', 'D', 'q0']] }), { entrada: '11' });
    m.ejecutar();
    assert.equal(m.motivo, 'sin-regla');
    assert.equal(m.pasos, 2);
  });

  test('reiniciar con otra entrada', () => {
    const m = correr('sumar-uno');
    m.reiniciar('11');
    assert.equal(m.pasos, 0);
    m.ejecutar();
    assert.equal(m.resultado(), '111');
  });

  test('los espacios en la entrada cuentan como blanco', () => {
    const m = new MaquinaTuring(def('sumar-uno'), { entrada: '1 1' });
    assert.equal(m.leer(1), BLANCO);
  });

  test('foto() resume el estado', () => {
    const f = new MaquinaTuring(def('sumar-uno')).foto();
    assert.equal(f.pasos, 0);
    assert.equal(f.estado, 'q0');
    assert.equal(f.leido, '1');
    assert.equal(f.detenida, false);
  });
});

describe('Validador', () => {
  const tipos = (d) => validar(crearDefinicion(d)).errores.map((e) => e.tipo);

  test('detecta reglas duplicadas', () => {
    const v = validar(crearDefinicion({ reglas: [['q0', '1', '1', 'D', 'qF'], ['q0', '1', '0', 'I', 'qF']] }));
    assert.equal(v.valido, false);
    assert.equal(v.errores[0].tipo, 'duplicada');
    assert.equal(v.errores[0].fila, 2);
  });

  test('detecta estados desconocidos', () => {
    assert.ok(tipos({ reglas: [['q0', '1', '1', 'D', 'q9']] }).includes('estado-desconocido'));
  });

  test('detecta estado inicial sin reglas', () => {
    assert.ok(tipos({ inicial: 'qX', reglas: [['q0', '1', '1', 'D', 'qF']] }).includes('estado-desconocido'));
  });

  test('detecta movimientos inválidos', () => {
    assert.ok(tipos({ reglas: [['q0', '1', '1', 'X', 'qF']] }).includes('movimiento'));
  });

  test('detecta símbolos de más de un carácter', () => {
    assert.ok(tipos({ reglas: [['q0', '11', '1', 'D', 'qF']] }).includes('simbolo'));
  });

  test('detecta campos vacíos', () => {
    assert.ok(tipos({ reglas: [['', '1', '1', 'D', '']] }).includes('vacio'));
  });

  test('detecta falta de estado inicial', () => {
    assert.ok(tipos({ inicial: '', reglas: [['q0', '1', '1', 'D', 'qF']] }).includes('inicial'));
  });

  test('avisa de reglas faltantes', () => {
    const v = validar(crearDefinicion({ entrada: '10', reglas: [['q0', '1', '1', 'D', 'q0'], ['q0', '_', '_', 'N', 'qF']] }));
    assert.ok(v.valido);
    const f = v.avisos.find((a) => a.tipo === 'faltante');
    assert.deepEqual(f.simbolos, ['0']);
  });

  test('avisa de símbolos de la entrada que no usa ninguna regla', () => {
    const v = validar(crearDefinicion({ entrada: '1x', reglas: [['q0', '1', '1', 'D', 'qF']] }));
    assert.ok(v.avisos.some((a) => a.tipo === 'entrada'));
  });

  test('avisa de reglas en un estado final y de máquinas sin estados finales', () => {
    const v = validar(crearDefinicion({ finales: ['qF'], reglas: [['q0', '1', '1', 'D', 'qF'], ['qF', '1', '1', 'D', 'qF']] }));
    assert.ok(v.avisos.some((a) => a.tipo === 'regla-en-final'));
    const w = validar(crearDefinicion({ finales: [], reglas: [['q0', '1', '1', 'D', 'q0']] }));
    assert.ok(w.avisos.some((a) => a.tipo === 'sin-final'));
  });

  test('una máquina correcta es válida', () => {
    assert.equal(validar(def('sumar-uno')).valido, true);
  });
});

describe('Lectura de reglas y JSON', () => {
  test('normalizarMovimiento acepta varias formas', () => {
    for (const m of ['I', 'i', 'L', '<', 'izquierda']) assert.equal(normalizarMovimiento(m), 'I');
    for (const m of ['D', 'R', '>', 'derecha']) assert.equal(normalizarMovimiento(m), 'D');
    for (const m of ['N', 'S', '-', '—', '']) assert.equal(normalizarMovimiento(m), 'N');
    assert.equal(normalizarMovimiento('X'), null);
  });

  test('parsearReglas lee texto y lo vuelve a escribir igual', () => {
    const texto = '# sumar 1\nq0, 1 -> 1, D, q0\n\nq0, _ → 1, —, qF';
    const { reglas, errores } = parsearReglas(texto);
    assert.equal(errores.length, 0);
    assert.deepEqual(reglas, def('sumar-uno').reglas);
    assert.equal(reglasATexto(reglas), 'q0, 1 -> 1, D, q0\nq0, _ -> 1, N, qF');
  });

  test('parsearReglas informa líneas malas', () => {
    const { errores } = parsearReglas('hola\nq0, 1 -> 1, Z, q0');
    assert.equal(errores.length, 2);
    assert.equal(errores[0].linea, 1);
  });

  test('exportar e importar JSON conserva la máquina', () => {
    for (const e of EJEMPLOS) {
      const d = crearDefinicion(e);
      assert.deepEqual(importarJSON(exportarJSON(d)), d);
    }
  });

  test('importarJSON da errores claros', () => {
    assert.throws(() => importarJSON('{malo'), /no es un JSON válido/);
    assert.throws(() => importarJSON('{"a":1}'), /reglas/);
  });

  test('crearDefinicion acepta reglas como objetos y celdas vacías como blanco', () => {
    const d = crearDefinicion({ reglas: [{ estado: 'q0', lee: '', escribe: ' ', mueve: 'derecha', nuevo: 'qF' }], finales: 'qF, qG' });
    assert.deepEqual(d.reglas[0], { estado: 'q0', lee: '_', escribe: '_', mueve: 'D', nuevo: 'qF' });
    assert.deepEqual(d.finales, ['qF', 'qG']);
  });

  test('describirRegla', () => {
    assert.equal(describirRegla({ estado: 'q0', lee: '1', escribe: '0', mueve: 'I', nuevo: 'q1' }), 'lee 1 → escribe 0, I, pasa a q1');
    assert.equal(describirRegla({ estado: 'q0', lee: '1', escribe: '0', mueve: 'N', nuevo: 'q0' }), 'lee 1 → escribe 0, no se mueve');
    assert.equal(describirRegla(null), '');
  });
});
