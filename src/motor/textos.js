/**
 * Textos del motor en español (por defecto) e inglés.
 * El motor no usa el DOM: la app elige el idioma con ponerIdiomaMotor('en').
 */
let idioma = 'es';

export function ponerIdiomaMotor(l) { idioma = l === 'en' ? 'en' : 'es'; }
export function idiomaMotor() { return idioma; }

const q = (s) => `«${s}»`;
const qe = (s) => `“${s}”`;

export const MENSAJES_MOTOR = {
  es: {
    'mov.I': 'izquierda', 'mov.D': 'derecha', 'mov.N': 'no se mueve',
    'letra.I': 'I', 'letra.D': 'D', 'letra.N': 'N',
    'val.inicial': 'Falta el estado inicial.',
    'val.sinFinal': 'No hay estados finales: la máquina solo parará cuando no encuentre regla.',
    'val.faltaEstado': ({ fila }) => `Fila ${fila}: falta el estado.`,
    'val.faltaNuevo': ({ fila }) => `Fila ${fila}: falta el nuevo estado.`,
    'val.simbolo': ({ fila, campo, valor }) => `Fila ${fila}: ${q(campo === 'lee' ? 'lee' : 'escribe')} debe ser un solo símbolo (ahora es ${q(valor)}).`,
    'val.movimiento': ({ fila, valor }) => `Fila ${fila}: movimiento ${q(valor)} no válido. Usa I (izquierda), D (derecha) o N (no se mueve).`,
    'val.duplicada': ({ fila, estado, lee, otra }) => `Fila ${fila}: regla repetida para (${estado}, ${lee}); ya existe en la fila ${otra}. La máquina debe ser determinista.`,
    'val.reglaEnFinal': ({ fila, estado }) => `Fila ${fila}: ${estado} es un estado de parada; esta regla nunca se usará.`,
    'val.estadoDesconocido': ({ fila, estado }) => `Fila ${fila}: el estado ${q(estado)} no tiene reglas ni es estado final.`,
    'val.inicialSinReglas': ({ estado }) => `El estado inicial ${q(estado)} no tiene reglas.`,
    'val.entrada': ({ s }) => `La entrada usa ${q(s)}, que ninguna regla lee ni escribe.`,
    'val.faltante': ({ estado, simbolos }) => `En ${estado} no hay regla para leer ${simbolos.map(q).join(', ')}: si ocurre, la máquina se detiene.`,
    'regla.lee': ({ lee, escribe }) => `lee ${lee} → escribe ${escribe}`,
    'regla.quieto': 'no se mueve', 'regla.para': 'para', 'regla.pasa': ({ nuevo }) => `pasa a ${nuevo}`,
    'fin.vacia': '(cinta vacía)',
    'fin.acepta': ({ estado }) => `FIN: acepta (${estado})`,
    'fin.rechaza': ({ estado }) => `FIN: rechaza (${estado})`,
    'fin.final': ({ res }) => `FIN: resultado ${res}`,
    'fin.sinRegla': ({ estado, s }) => `Se detiene: no hay regla para (${estado}, ${s})`,
    'fin.limite': ({ n }) => `Límite de ${n} pasos alcanzado`,
    'txt.noSeEntiende': ({ n, l }) => `Línea ${n}: no se entiende ${q(l)}. Formato: estado, lee -> escribe, mueve, nuevo`,
    'txt.movimiento': ({ n, m }) => `Línea ${n}: movimiento ${q(m)} no válido (usa I, D o N).`,
    'json.noValido': 'El archivo no es un JSON válido.',
    'json.sinReglas': 'El JSON no tiene una lista «reglas».',
    'json.formato': ({ f }) => `Formato desconocido ${q(f)}: se esperaba «maquina-de-turing/1».`,
    'json.regla': ({ n }) => `Regla ${n}: debe ser [estado, lee, escribe, mueve, nuevo] o un objeto con esos campos.`,
    'json.texto': ({ campo }) => `El campo ${q(campo)} debe ser texto.`,
    'json.lista': ({ campo }) => `El campo ${q(campo)} debe ser una lista de estados.`,
    'json.grande': ({ max }) => `Demasiadas reglas (máximo ${max}).`,
    'enlace.noValido': 'El enlace no contiene una máquina válida.',
  },
  en: {
    'mov.I': 'left', 'mov.D': 'right', 'mov.N': 'stay',
    'letra.I': 'L', 'letra.D': 'R', 'letra.N': 'S',
    'val.inicial': 'The start state is missing.',
    'val.sinFinal': 'There are no final states: the machine will only stop when it finds no rule.',
    'val.faltaEstado': ({ fila }) => `Row ${fila}: the state is missing.`,
    'val.faltaNuevo': ({ fila }) => `Row ${fila}: the next state is missing.`,
    'val.simbolo': ({ fila, campo, valor }) => `Row ${fila}: ${qe(campo === 'lee' ? 'read' : 'write')} must be a single symbol (now it is ${qe(valor)}).`,
    'val.movimiento': ({ fila, valor }) => `Row ${fila}: move ${qe(valor)} is not valid. Use L (left), R (right) or S (stay).`,
    'val.duplicada': ({ fila, estado, lee, otra }) => `Row ${fila}: repeated rule for (${estado}, ${lee}); it already exists in row ${otra}. The machine must be deterministic.`,
    'val.reglaEnFinal': ({ fila, estado }) => `Row ${fila}: ${estado} is a halting state; this rule will never be used.`,
    'val.estadoDesconocido': ({ fila, estado }) => `Row ${fila}: state ${qe(estado)} has no rules and is not a final state.`,
    'val.inicialSinReglas': ({ estado }) => `The start state ${qe(estado)} has no rules.`,
    'val.entrada': ({ s }) => `The input uses ${qe(s)}, which no rule reads or writes.`,
    'val.faltante': ({ estado, simbolos }) => `In ${estado} there is no rule for reading ${simbolos.map(qe).join(', ')}: if that happens, the machine stops.`,
    'regla.lee': ({ lee, escribe }) => `read ${lee} → write ${escribe}`,
    'regla.quieto': 'stay', 'regla.para': 'halt', 'regla.pasa': ({ nuevo }) => `go to ${nuevo}`,
    'fin.vacia': '(empty tape)',
    'fin.acepta': ({ estado }) => `END: accepts (${estado})`,
    'fin.rechaza': ({ estado }) => `END: rejects (${estado})`,
    'fin.final': ({ res }) => `END: result ${res}`,
    'fin.sinRegla': ({ estado, s }) => `Stops: no rule for (${estado}, ${s})`,
    'fin.limite': ({ n }) => `Limit of ${n} steps reached`,
    'txt.noSeEntiende': ({ n, l }) => `Line ${n}: cannot understand ${qe(l)}. Format: state, read -> write, move, next`,
    'txt.movimiento': ({ n, m }) => `Line ${n}: move ${qe(m)} is not valid (use L, R or S).`,
    'json.noValido': 'The file is not valid JSON.',
    'json.sinReglas': 'The JSON has no “reglas” (rules) list.',
    'json.formato': ({ f }) => `Unknown format ${qe(f)}: expected “maquina-de-turing/1”.`,
    'json.regla': ({ n }) => `Rule ${n}: must be [state, read, write, move, next] or an object with those fields.`,
    'json.texto': ({ campo }) => `Field ${qe(campo)} must be text.`,
    'json.lista': ({ campo }) => `Field ${qe(campo)} must be a list of states.`,
    'json.grande': ({ max }) => `Too many rules (maximum ${max}).`,
    'enlace.noValido': 'The link does not contain a valid machine.',
  },
};

/** Texto del motor en el idioma actual. */
export function tm(clave, p = {}) {
  const v = MENSAJES_MOTOR[idioma][clave] ?? MENSAJES_MOTOR.es[clave];
  return typeof v === 'function' ? v(p) : v;
}

/** Letra del movimiento para mostrar: I/D/N en español, L/R/S en inglés. */
export const letraMov = (m) => tm(`letra.${m}`) ?? m;
