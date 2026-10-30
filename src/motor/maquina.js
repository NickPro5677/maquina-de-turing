/**
 * Motor de la máquina de Turing.
 * Código puro: no usa el DOM, así que funciona igual en el navegador y en Node.
 */

/** Símbolo blanco: así se ve una casilla vacía de la cinta. */
export const BLANCO = '_';

/** Movimientos del cabezal: I = izquierda, D = derecha, N = no se mueve. */
export const MOVIMIENTOS = Object.freeze({ I: -1, D: 1, N: 0 });

/** Nombre legible de cada movimiento. */
export const NOMBRE_MOVIMIENTO = Object.freeze({ I: 'izquierda', D: 'derecha', N: 'no se mueve' });

/** Límite de pasos por defecto para no quedarse colgado en un bucle infinito. */
export const LIMITE_PASOS = 10000;

const ALIAS_MOVIMIENTO = {
  i: 'I', l: 'I', '<': 'I', izq: 'I', izquierda: 'I', left: 'I',
  d: 'D', r: 'D', '>': 'D', der: 'D', derecha: 'D', right: 'D',
  n: 'N', s: 'N', '-': 'N', '—': 'N', '–': 'N', '0': 'N', '': 'N', quieto: 'N', 'no se mueve': 'N', stay: 'N',
};

/**
 * Convierte cualquier forma aceptada de escribir un movimiento a I, D o N.
 * Devuelve null si no se reconoce.
 */
export function normalizarMovimiento(m) {
  const clave = String(m ?? '').trim().toLowerCase();
  return ALIAS_MOVIMIENTO[clave] ?? null;
}

/** Convierte un símbolo escrito por la persona: vacío o espacio cuentan como blanco. */
export function normalizarSimbolo(s, blanco = BLANCO) {
  const t = String(s ?? '').trim();
  return t === '' ? blanco : t;
}

/**
 * Crea una definición limpia a partir de un objeto (por ejemplo, el JSON importado).
 * Las reglas pueden venir como objetos {estado, lee, escribe, mueve, nuevo}
 * o como arreglos [estado, lee, escribe, mueve, nuevo].
 */
export function crearDefinicion(obj = {}) {
  const blanco = obj.blanco ? String(obj.blanco) : BLANCO;
  const reglas = (obj.reglas ?? []).map((r) => {
    const [estado, lee, escribe, mueve, nuevo] = Array.isArray(r)
      ? r
      : [r.estado, r.lee, r.escribe, r.mueve, r.nuevo];
    return {
      estado: String(estado ?? '').trim(),
      lee: normalizarSimbolo(lee, blanco),
      escribe: normalizarSimbolo(escribe, blanco),
      mueve: normalizarMovimiento(mueve) ?? String(mueve ?? '').trim(),
      nuevo: String(nuevo ?? '').trim(),
    };
  });
  const lista = (v) => (Array.isArray(v) ? v : String(v ?? '').split(','))
    .map((x) => String(x).trim()).filter(Boolean);
  return {
    nombre: String(obj.nombre ?? 'Mi máquina'),
    descripcion: String(obj.descripcion ?? ''),
    blanco,
    inicial: String(obj.inicial ?? 'q0').trim(),
    finales: lista(obj.finales ?? ['qF']),
    acepta: lista(obj.acepta ?? []),
    rechaza: lista(obj.rechaza ?? []),
    entrada: String(obj.entrada ?? ''),
    cabezal: Number.isInteger(obj.cabezal) ? obj.cabezal : 0,
    reglas,
  };
}

/** Todos los estados donde la máquina se detiene a propósito. */
export function estadosDeParada(def) {
  return new Set([...def.finales, ...def.acepta, ...def.rechaza]);
}

/**
 * Revisa una definición y explica los problemas en español.
 * - errores: impiden ejecutar (duplicados, estados desconocidos, campos vacíos...).
 * - avisos: se puede ejecutar, pero conviene revisarlos (reglas faltantes...).
 */
export function validar(def) {
  const errores = [];
  const avisos = [];
  const parada = estadosDeParada(def);
  const conReglas = new Set(def.reglas.map((r) => r.estado).filter(Boolean));
  const vistos = new Map();

  if (!def.inicial) errores.push({ tipo: 'inicial', mensaje: 'Falta el estado inicial.' });
  if (parada.size === 0) avisos.push({ tipo: 'sin-final', mensaje: 'No hay estados finales: la máquina solo parará cuando no encuentre regla.' });

  def.reglas.forEach((r, i) => {
    const fila = i + 1;
    if (!r.estado) errores.push({ tipo: 'vacio', fila, mensaje: `Fila ${fila}: falta el estado.` });
    if (!r.nuevo) errores.push({ tipo: 'vacio', fila, mensaje: `Fila ${fila}: falta el nuevo estado.` });
    for (const campo of ['lee', 'escribe']) {
      if ([...r[campo]].length !== 1) {
        errores.push({ tipo: 'simbolo', fila, mensaje: `Fila ${fila}: «${campo}» debe ser un solo símbolo (ahora es «${r[campo]}»).` });
      }
    }
    if (!MOVIMIENTOS.hasOwnProperty(r.mueve)) {
      errores.push({ tipo: 'movimiento', fila, mensaje: `Fila ${fila}: movimiento «${r.mueve}» no válido. Usa I (izquierda), D (derecha) o N (no se mueve).` });
    }
    if (r.estado) {
      const clave = `${r.estado}\u0000${r.lee}`;
      if (vistos.has(clave)) {
        errores.push({ tipo: 'duplicada', fila, mensaje: `Fila ${fila}: regla repetida para (${r.estado}, ${r.lee}); ya existe en la fila ${vistos.get(clave)}. La máquina debe ser determinista.` });
      } else vistos.set(clave, fila);
      if (parada.has(r.estado)) avisos.push({ tipo: 'regla-en-final', fila, mensaje: `Fila ${fila}: ${r.estado} es un estado de parada; esta regla nunca se usará.` });
    }
    if (r.nuevo && !conReglas.has(r.nuevo) && !parada.has(r.nuevo)) {
      errores.push({ tipo: 'estado-desconocido', fila, mensaje: `Fila ${fila}: el estado «${r.nuevo}» no tiene reglas ni es estado final.` });
    }
  });

  if (def.inicial && !conReglas.has(def.inicial) && !parada.has(def.inicial)) {
    errores.push({ tipo: 'estado-desconocido', mensaje: `El estado inicial «${def.inicial}» no tiene reglas.` });
  }

  // Alfabeto: símbolos que aparecen en las reglas, la entrada y el blanco.
  const alfabeto = new Set([def.blanco]);
  def.reglas.forEach((r) => { alfabeto.add(r.lee); alfabeto.add(r.escribe); });
  for (const s of def.entrada) {
    if (!alfabeto.has(s) && s !== ' ') {
      avisos.push({ tipo: 'entrada', mensaje: `La entrada usa «${s}», que ninguna regla lee ni escribe.` });
      alfabeto.add(s);
    }
  }
  // Reglas que faltan: combinaciones (estado, símbolo) sin regla.
  for (const q of conReglas) {
    if (parada.has(q)) continue;
    const faltan = [...alfabeto].filter((s) => !vistos.has(`${q}\u0000${s}`));
    if (faltan.length) {
      avisos.push({ tipo: 'faltante', estado: q, simbolos: faltan, mensaje: `En ${q} no hay regla para leer ${faltan.map((s) => `«${s}»`).join(', ')}: si ocurre, la máquina se detiene.` });
    }
  }
  return { valido: errores.length === 0, errores, avisos, alfabeto: [...alfabeto] };
}

/** Busca la regla para (estado, símbolo). */
export function buscarRegla(def, estado, simbolo) {
  return def.reglas.find((r) => r.estado === estado && r.lee === simbolo) ?? null;
}

/** Texto corto de una regla, como en la guía: «lee 1 → escribe 1, D». */
export function describirRegla(r, parada = false) {
  if (!r) return '';
  const partes = [`lee ${r.lee} → escribe ${r.escribe}`];
  if (r.mueve !== 'N') partes.push(r.mueve);
  else if (!parada) partes.push('no se mueve');
  if (parada) partes.push('para');
  else if (r.nuevo !== r.estado) partes.push(`pasa a ${r.nuevo}`);
  return partes.join(', ');
}

/** La máquina en marcha: cinta, cabezal, estado, contador e historial. */
export class MaquinaTuring {
  constructor(definicion, opciones = {}) {
    this.def = definicion.reglas && definicion.finales ? definicion : crearDefinicion(definicion);
    this.limitePasos = opciones.limitePasos ?? LIMITE_PASOS;
    this.reiniciar(opciones.entrada ?? this.def.entrada, opciones.cabezal ?? this.def.cabezal);
  }

  /** Vuelve al paso 0 con una entrada (por defecto, la del ejemplo). */
  reiniciar(entrada = this.entrada, cabezal = this.def.cabezal) {
    this.entrada = String(entrada ?? '');
    this.cinta = new Map();
    [...this.entrada].forEach((s, i) => {
      const sim = s === ' ' ? this.def.blanco : s;
      if (sim !== this.def.blanco) this.cinta.set(i, sim);
    });
    this.cabezal = cabezal;
    this.estado = this.def.inicial;
    this.pasos = 0;
    this.historial = [];
    this.motivo = null;
    this.ultimaRegla = null;
    this._paradas = estadosDeParada(this.def);
    this._comprobarParada();
    return this;
  }

  leer(pos = this.cabezal) {
    return this.cinta.get(pos) ?? this.def.blanco;
  }

  escribir(pos, simbolo) {
    if (simbolo === this.def.blanco) this.cinta.delete(pos);
    else this.cinta.set(pos, simbolo);
  }

  /** Regla que se aplicará en el próximo paso (la «regla activa»). */
  reglaActual() {
    if (this._paradas.has(this.estado)) return null;
    return buscarRegla(this.def, this.estado, this.leer());
  }

  get detenida() {
    return this.motivo !== null && this.motivo !== 'limite';
  }

  _comprobarParada() {
    if (this.def.acepta.includes(this.estado)) this.motivo = 'acepta';
    else if (this.def.rechaza.includes(this.estado)) this.motivo = 'rechaza';
    else if (this.def.finales.includes(this.estado)) this.motivo = 'final';
    else if (!this.reglaActual()) this.motivo = 'sin-regla';
    else this.motivo = null;
  }

  /** Da un paso. Devuelve la regla aplicada, o null si la máquina ya paró. */
  paso() {
    if (this.detenida) return null;
    if (this.pasos >= this.limitePasos) { this.motivo = 'limite'; return null; }
    const regla = this.reglaActual();
    const pos = this.cabezal;
    this.historial.push({ pos, simbolo: this.leer(pos), estado: this.estado, motivo: this.motivo, regla: this.ultimaRegla });
    this.escribir(pos, regla.escribe);
    this.cabezal += MOVIMIENTOS[regla.mueve];
    this.estado = regla.nuevo;
    this.pasos += 1;
    this.ultimaRegla = regla;
    this._comprobarParada();
    if (!this.motivo && this.pasos >= this.limitePasos) this.motivo = 'limite';
    return regla;
  }

  /** Deshace el último paso. Devuelve false si ya estaba en el paso 0. */
  pasoAtras() {
    const h = this.historial.pop();
    if (!h) return false;
    this.escribir(h.pos, h.simbolo);
    this.cabezal = h.pos;
    this.estado = h.estado;
    this.pasos -= 1;
    this.ultimaRegla = h.regla;
    this._comprobarParada();
    return true;
  }

  /** Ejecuta hasta parar o hasta el límite. Devuelve el número de pasos dados. */
  ejecutar(maximo = this.limitePasos) {
    let n = 0;
    while (n < maximo && this.paso()) n += 1;
    return n;
  }

  /** Extremos ocupados de la cinta (incluye siempre la posición del cabezal). */
  limites() {
    const pos = [...this.cinta.keys(), this.cabezal];
    return [Math.min(...pos), Math.max(...pos)];
  }

  /** Símbolos de la cinta entre a y b (incluidos). */
  ventana(a, b) {
    const out = [];
    for (let i = a; i <= b; i++) out.push(this.leer(i));
    return out;
  }

  /** Contenido de la cinta sin blancos a los lados, p. ej. «1111». */
  resultado() {
    if (this.cinta.size === 0) return '';
    const k = [...this.cinta.keys()];
    return this.ventana(Math.min(...k), Math.max(...k)).join('');
  }

  /** Cuántas veces aparece un símbolo en la cinta. */
  contar(simbolo) {
    let n = 0;
    for (const s of this.cinta.values()) if (s === simbolo) n += 1;
    return n;
  }

  /** Cinta como texto con el cabezal entre corchetes: «1 [1] 1 _». */
  cintaConCabezal(margen = 0) {
    let [a, b] = this.limites();
    if (this.cinta.size === 0) { a = this.cabezal; b = this.cabezal; }
    a = Math.min(a, this.cabezal) - margen;
    b = Math.max(b, this.cabezal) + margen;
    const partes = [];
    for (let i = a; i <= b; i++) partes.push(i === this.cabezal ? `[${this.leer(i)}]` : this.leer(i));
    return partes.join(' ');
  }

  /** Foto del estado actual (útil para dibujar y para la traza). */
  foto() {
    return {
      pasos: this.pasos,
      estado: this.estado,
      cabezal: this.cabezal,
      leido: this.leer(),
      regla: this.reglaActual(),
      motivo: this.motivo,
      detenida: this.detenida,
    };
  }
}

/**
 * Traza completa paso a paso, como la tabla de la guía.
 * Cada fila: { paso, cinta, estado, regla } donde «regla» es lo que hace en ese paso.
 * Se calcula sobre una copia: no cambia la máquina original.
 */
export function traza(def, entrada, { maximo = 200 } = {}) {
  const m = new MaquinaTuring(def, { entrada });
  const filas = [];
  const fila = () => {
    const r = m.reglaActual();
    let texto;
    if (m.detenida || !r) texto = textoParada(m);
    else texto = describirRegla(r, estadosDeParada(m.def).has(r.nuevo));
    filas.push({ paso: m.pasos, cinta: cintaTraza(m), estado: m.estado, regla: texto });
  };
  fila();
  while (filas.length <= maximo && m.paso()) fila();
  return filas;
}

/** Cinta para la traza: muestra la entrada original más una casilla, el cabezal y lo escrito. */
export function cintaTraza(m) {
  const k = [...m.cinta.keys()];
  const a = Math.min(0, m.cabezal, ...k);
  const b = Math.max(m.cabezal, ...k, [...m.entrada].length);
  const partes = [];
  for (let i = a; i <= b; i++) partes.push(i === m.cabezal ? `[${m.leer(i)}]` : m.leer(i));
  return partes.join(' ');
}

/** Frase final según por qué paró la máquina. */
export function textoParada(m) {
  const res = m.resultado() || '(cinta vacía)';
  switch (m.motivo) {
    case 'acepta': return `FIN: acepta (${m.estado})`;
    case 'rechaza': return `FIN: rechaza (${m.estado})`;
    case 'final': return `FIN: resultado ${res}`;
    case 'sin-regla': return `Se detiene: no hay regla para (${m.estado}, ${m.leer()})`;
    case 'limite': return `Límite de ${m.limitePasos} pasos alcanzado`;
    default: return '';
  }
}

/**
 * Lee reglas escritas como texto, una por línea:
 *   q0, 1 -> 1, D, q0
 * Las líneas vacías y las que empiezan con # se ignoran.
 */
export function parsearReglas(texto) {
  const reglas = [];
  const errores = [];
  String(texto).split(/\r?\n/).forEach((linea, i) => {
    const l = linea.replace(/#.*$/, '').trim();
    if (!l) return;
    const m = l.match(/^(.*?)\s*,\s*(.*?)\s*(?:->|→)\s*(.*?)\s*,\s*(.*?)\s*,\s*(.*?)$/);
    if (!m) {
      errores.push({ linea: i + 1, mensaje: `Línea ${i + 1}: no se entiende «${l}». Formato: estado, lee -> escribe, mueve, nuevo` });
      return;
    }
    const mueve = normalizarMovimiento(m[4]);
    if (!mueve) {
      errores.push({ linea: i + 1, mensaje: `Línea ${i + 1}: movimiento «${m[4]}» no válido (usa I, D o N).` });
      return;
    }
    reglas.push({ estado: m[1], lee: normalizarSimbolo(m[2]), escribe: normalizarSimbolo(m[3]), mueve, nuevo: m[5] });
  });
  return { reglas, errores };
}

/** Reglas como texto (lo inverso de parsearReglas). */
export function reglasATexto(reglas) {
  return reglas.map((r) => `${r.estado}, ${r.lee} -> ${r.escribe}, ${r.mueve}, ${r.nuevo}`).join('\n');
}

/** Exporta una definición a JSON bonito. */
export function exportarJSON(def) {
  const d = crearDefinicion(def);
  return JSON.stringify({
    formato: 'maquina-de-turing/1',
    nombre: d.nombre,
    descripcion: d.descripcion,
    blanco: d.blanco,
    inicial: d.inicial,
    finales: d.finales,
    acepta: d.acepta,
    rechaza: d.rechaza,
    entrada: d.entrada,
    cabezal: d.cabezal,
    reglas: d.reglas.map((r) => [r.estado, r.lee, r.escribe, r.mueve, r.nuevo]),
  }, null, 2);
}

/** Importa una definición desde JSON. Lanza un Error con mensaje claro si falla. */
export function importarJSON(texto) {
  let obj;
  try { obj = JSON.parse(texto); } catch { throw new Error('El archivo no es un JSON válido.'); }
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.reglas)) {
    throw new Error('El JSON no tiene una lista «reglas».');
  }
  return crearDefinicion(obj);
}
