/**
 * Máquinas guardadas en el dispositivo. Funciones puras sobre una lista;
 * la app la guarda en localStorage.
 */
import { crearDefinicion, exportarJSON, validarObjetoMaquina } from './maquina.js';

export const MAX_GUARDADAS = 100;

/** Limpia lo leído de la memoria: descarta entradas dañadas. */
export function leerBiblioteca(valor) {
  if (!Array.isArray(valor)) return [];
  const out = [];
  for (const x of valor) {
    try {
      if (!x || typeof x.nombre !== 'string' || !x.nombre.trim()) continue;
      out.push({ nombre: x.nombre.trim(), fecha: Number(x.fecha) || 0, def: validarObjetoMaquina(x.def) });
    } catch { /* entrada dañada: se ignora */ }
  }
  return out;
}

/** Guarda (o reemplaza, si ya existe con ese nombre) y deja la más reciente primero. */
export function guardarEnBiblioteca(lista, def, nombre = def.nombre, fecha = Date.now()) {
  const n = String(nombre ?? '').trim() || 'Mi máquina';
  const limpia = JSON.parse(exportarJSON({ ...crearDefinicion(def), nombre: n }));
  const resto = lista.filter((x) => x.nombre.toLowerCase() !== n.toLowerCase());
  return [{ nombre: n, fecha, def: crearDefinicion(limpia) }, ...resto].slice(0, MAX_GUARDADAS);
}

export function borrarDeBiblioteca(lista, nombre) {
  const n = String(nombre).toLowerCase();
  return lista.filter((x) => x.nombre.toLowerCase() !== n);
}

export function buscarEnBiblioteca(lista, nombre) {
  const n = String(nombre).toLowerCase();
  return lista.find((x) => x.nombre.toLowerCase() === n) ?? null;
}

/** Forma para guardar en localStorage (JSON simple). */
export function serializarBiblioteca(lista) {
  return lista.map((x) => ({ nombre: x.nombre, fecha: x.fecha, def: JSON.parse(exportarJSON(x.def)) }));
}
