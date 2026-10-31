/**
 * Ejercicios guiados: cada uno tiene un objetivo, casos de prueba que se comprueban solos,
 * pistas y una solución. Textos en español (es) e inglés (en).
 */
import { MaquinaTuring, crearDefinicion, validar } from './maquina.js';

/** Pasos máximos al comprobar un caso (para cortar bucles infinitos). */
export const LIMITE_EJERCICIO = 2000;

export const EJERCICIOS = [
  {
    id: 'borrar-todo',
    nivel: 1,
    es: {
      titulo: 'Borrar la cinta',
      objetivo: 'Empieza sobre el primer 1. Borra todos los unos (escribe _) y para en qF con la cinta vacía.',
      pistas: ['Con un solo estado q0 basta para recorrer la cinta hacia la derecha.', 'Si lees 1, escribe _ y sigue a la derecha. Si lees _, ya terminaste.'],
    },
    en: {
      titulo: 'Erase the tape',
      objetivo: 'Start on the first 1. Erase every 1 (write _) and halt in qF with an empty tape.',
      pistas: ['A single state q0 is enough to walk right along the tape.', 'If you read 1, write _ and keep moving right. If you read _, you are done.'],
    },
    plantilla: { nombre: 'Borrar la cinta', entrada: '111', inicial: 'q0', finales: ['qF'], reglas: [] },
    casos: [{ entrada: '111', resultado: '' }, { entrada: '1', resultado: '' }, { entrada: '', resultado: '' }, { entrada: '11111', resultado: '' }],
    solucion: [['q0', '1', '_', 'D', 'q0'], ['q0', '_', '_', 'N', 'qF']],
  },
  {
    id: 'todo-unos',
    nivel: 1,
    es: {
      titulo: 'Cambiar ceros por unos',
      objetivo: 'La cinta tiene ceros y unos. Cambia cada 0 por 1, deja los 1 como están y para en qF.',
      pistas: ['Necesitas tres reglas, todas en q0.', 'Al leer _ ya pasaste el final: para sin escribir nada.'],
    },
    en: {
      titulo: 'Turn zeros into ones',
      objetivo: 'The tape has zeros and ones. Change every 0 into 1, keep the 1s and halt in qF.',
      pistas: ['You need three rules, all in q0.', 'When you read _ you are past the end: halt without writing.'],
    },
    plantilla: { nombre: 'Cambiar ceros por unos', entrada: '0101', inicial: 'q0', finales: ['qF'], reglas: [] },
    casos: [{ entrada: '0101', resultado: '1111' }, { entrada: '000', resultado: '111' }, { entrada: '1', resultado: '1' }],
    solucion: [['q0', '0', '1', 'D', 'q0'], ['q0', '1', '1', 'D', 'q0'], ['q0', '_', '_', 'N', 'qF']],
  },
  {
    id: 'sumar-dos',
    nivel: 2,
    es: {
      titulo: 'Sumar 2 en unario',
      objetivo: 'En unario n se escribe con n unos. Convierte n en n + 2: 11 → 1111. La cinta vacía (0) debe quedar 11.',
      pistas: ['Primero ve al final del número, como en «Sumar 1».', 'Al encontrar el primer blanco escribe 1 y usa un segundo estado para escribir el otro 1.'],
    },
    en: {
      titulo: 'Add 2 in unary',
      objetivo: 'In unary, n is written with n ones. Turn n into n + 2: 11 → 1111. An empty tape (0) must become 11.',
      pistas: ['First go to the end of the number, as in “Add 1”.', 'At the first blank write 1, then use a second state to write the other 1.'],
    },
    plantilla: { nombre: 'Sumar 2', entrada: '11', inicial: 'q0', finales: ['qF'], reglas: [['q0', '1', '1', 'D', 'q0']] },
    casos: [{ entrada: '11', resultado: '1111' }, { entrada: '', resultado: '11' }, { entrada: '111', resultado: '11111' }],
    solucion: [['q0', '1', '1', 'D', 'q0'], ['q0', '_', '1', 'D', 'q1'], ['q1', '_', '1', 'N', 'qF']],
  },
  {
    id: 'restar-uno',
    nivel: 2,
    es: {
      titulo: 'Restar 1 en unario',
      objetivo: 'Convierte n en n − 1: 111 → 11. Si la cinta está vacía, déjala vacía. ¡Se puede con muy pocas reglas!',
      pistas: ['No importa qué 1 borres: todos valen lo mismo.', 'Borra el primer 1 (el que está bajo el cabezal) y para.'],
    },
    en: {
      titulo: 'Subtract 1 in unary',
      objetivo: 'Turn n into n − 1: 111 → 11. If the tape is empty, leave it empty. It takes very few rules!',
      pistas: ['It does not matter which 1 you erase: they are all the same.', 'Erase the first 1 (the one under the head) and halt.'],
    },
    plantilla: { nombre: 'Restar 1', entrada: '111', inicial: 'q0', finales: ['qF'], reglas: [] },
    casos: [{ entrada: '111', resultado: '11' }, { entrada: '1', resultado: '' }, { entrada: '', resultado: '' }],
    solucion: [['q0', '1', '_', 'N', 'qF'], ['q0', '_', '_', 'N', 'qF']],
  },
  {
    id: 'termina-en-uno',
    nivel: 3,
    es: {
      titulo: '¿Termina en 1?',
      objetivo: 'Acepta (estado qSi) si el número binario termina en 1, es decir, si es impar. Si no, rechaza (estado qNo). La cinta vacía se rechaza.',
      pistas: ['Ve hasta el final de la cinta y retrocede una casilla.', 'Ahora mira el último símbolo: 1 → qSi; 0 o _ → qNo.'],
    },
    en: {
      titulo: 'Does it end in 1?',
      objetivo: 'Accept (state qSi) if the binary number ends in 1, that is, if it is odd. Otherwise reject (state qNo). An empty tape is rejected.',
      pistas: ['Walk to the end of the tape and step back one cell.', 'Now look at the last symbol: 1 → qSi; 0 or _ → qNo.'],
    },
    plantilla: { nombre: 'Termina en 1', entrada: '101', inicial: 'q0', finales: [], acepta: ['qSi'], rechaza: ['qNo'], reglas: [] },
    casos: [{ entrada: '101', acepta: true }, { entrada: '10', acepta: false }, { entrada: '1', acepta: true }, { entrada: '', acepta: false }, { entrada: '1110', acepta: false }],
    solucion: [['q0', '0', '0', 'D', 'q0'], ['q0', '1', '1', 'D', 'q0'], ['q0', '_', '_', 'I', 'q1'], ['q1', '1', '1', 'N', 'qSi'], ['q1', '0', '0', 'N', 'qNo'], ['q1', '_', '_', 'N', 'qNo']],
  },
];

export function buscarEjercicio(id) { return EJERCICIOS.find((e) => e.id === id) ?? null; }

/** Solución como definición lista para el editor. */
export function solucionEjercicio(ej) { return crearDefinicion({ ...ej.plantilla, reglas: ej.solucion }); }

/**
 * Prueba una máquina con todos los casos del ejercicio.
 * Devuelve { aprobado, casos: [{ entrada, ok, esperado, obtenido, motivo, pasos }] }.
 */
export function comprobarEjercicio(ej, definicion, { limite = LIMITE_EJERCICIO } = {}) {
  const def = crearDefinicion(definicion);
  const v = validar(def);
  if (!v.valido) return { aprobado: false, invalida: v.errores, casos: [] };
  const casos = ej.casos.map((c) => {
    const m = new MaquinaTuring(def, { entrada: c.entrada, limitePasos: limite });
    m.ejecutar(limite);
    const base = { entrada: c.entrada, motivo: m.motivo, pasos: m.pasos };
    if ('acepta' in c) {
      const ok = c.acepta ? m.motivo === 'acepta' : m.motivo === 'rechaza';
      return { ...base, ok, esperado: c.acepta ? 'acepta' : 'rechaza', obtenido: m.motivo };
    }
    const obtenido = m.resultado().replace(/^_+|_+$/g, '');
    const ok = m.motivo === 'final' && obtenido === c.resultado;
    return { ...base, ok, esperado: c.resultado, obtenido };
  });
  return { aprobado: casos.every((c) => c.ok), casos };
}
