/** Idioma de la interfaz: español (es, por defecto) o inglés (en). */
import { ES } from './es.js';
import { EN } from './en.js';

export const DICCIONARIOS = { es: ES, en: EN };
export const IDIOMAS = ['es', 'en'];

let actual = 'es';
export function idioma() { return actual; }
export function ponerIdioma(l) { actual = IDIOMAS.includes(l) ? l : 'es'; return actual; }

/** Texto traducido. t('ej.datos', { e: '111', n: 2 }). Las llaves dobles {{a}} dejan una llave literal. */
export function t(clave, p = {}, l = actual) {
  const txt = DICCIONARIOS[l][clave] ?? ES[clave] ?? clave;
  return txt.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (m, doble, simple) => {
    const k = doble ?? simple;
    if (!(k in p)) return m;
    return doble ? `{${p[k]}}` : String(p[k]);
  });
}

/** Aplica los textos a los elementos con data-i18n, data-i18n-aria, data-i18n-title y data-i18n-ph. */
export function traducirPagina(raiz = document) {
  raiz.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  raiz.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  raiz.querySelectorAll('[data-i18n-title]').forEach((el) => el.setAttribute('title', t(el.dataset.i18nTitle)));
  raiz.querySelectorAll('[data-i18n-ph]').forEach((el) => el.setAttribute('placeholder', t(el.dataset.i18nPh)));
}
