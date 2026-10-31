/**
 * Enlaces para compartir una máquina: la definición va dentro del enlace (#/simulador?m=…),
 * como JSON compacto en base64url. No necesita servidor.
 */
import { crearDefinicion, validarObjetoMaquina } from './maquina.js';
import { tm } from './textos.js';

/** Largo máximo aceptado para el código del enlace. */
export const MAX_ENLACE = 20000;

function aBase64url(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64url(codigo) {
  if (!/^[A-Za-z0-9_-]+$/.test(codigo)) throw new Error('base64url');
  const bin = atob(codigo.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Convierte una definición en el código corto que va en el enlace. */
export function codificarMaquina(def) {
  const d = crearDefinicion(def);
  const o = { v: 1, n: d.nombre, i: d.inicial, f: d.finales, e: d.entrada, t: d.reglas.map((r) => [r.estado, r.lee, r.escribe, r.mueve, r.nuevo]) };
  if (d.acepta.length) o.a = d.acepta;
  if (d.rechaza.length) o.r = d.rechaza;
  if (d.blanco !== '_') o.b = d.blanco;
  if (d.cabezal) o.c = d.cabezal;
  return aBase64url(JSON.stringify(o));
}

/**
 * Lee el código de un enlace y devuelve la definición.
 * Acepta también el formato anterior (JSON completo). Lanza Error si no es válido.
 */
export function decodificarMaquina(codigo) {
  const c = String(codigo ?? '').trim();
  if (!c || c.length > MAX_ENLACE) throw new Error(tm('enlace.noValido'));
  let obj;
  try { obj = JSON.parse(deBase64url(c)); } catch { throw new Error(tm('enlace.noValido')); }
  if (obj && obj.v === 1 && Array.isArray(obj.t)) {
    obj = { nombre: obj.n, inicial: obj.i, finales: obj.f ?? [], acepta: obj.a ?? [], rechaza: obj.r ?? [], entrada: obj.e ?? '', blanco: obj.b, cabezal: obj.c, reglas: obj.t };
  }
  try { return validarObjetoMaquina(obj); } catch { throw new Error(tm('enlace.noValido')); }
}

/** Enlace completo a partir de la dirección base de la página. */
export function enlaceMaquina(base, def) {
  return `${String(base).split('#')[0]}#/simulador?m=${codificarMaquina(def)}`;
}
