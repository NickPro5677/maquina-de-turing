/** Vista 2D: la cinta con casillas, el cabezal fijo en el centro y el estado debajo. */
import { t } from '../i18n/index.js';

/** Nombre accesible de una casilla, en el idioma activo. */
export function etiquetaCasilla(i, simbolo, esBlanco, bajoCabezal) {
  const s = esBlanco ? t('cinta.blanco') : simbolo;
  const extra = bajoCabezal ? t('cinta.bajo') : '';
  return t('cinta.casilla', { i, s, extra });
}

export class Vista2D {
  constructor(contenedor) {
    this.el = contenedor;
    this.tira = document.createElement('div');
    this.tira.className = 'cinta-tira';
    this.cabezal = document.createElement('div');
    this.cabezal.className = 'cabezal-2d';
    this.cabezal.innerHTML = '<span class="punta" aria-hidden="true">▲</span><span class="estado"></span>';
    this.el.append(this.tira, this.cabezal);
    this.ultimoCabezal = null;
    new ResizeObserver(() => this.m && this.dibujar(this.m, { animar: false })).observe(this.el);
  }

  /** Cuántas casillas caben a cada lado del cabezal. */
  radio() {
    const celda = parseFloat(getComputedStyle(this.el).getPropertyValue('--celda')) || 56;
    const ancho = this.el.clientWidth || 600;
    return Math.max(3, Math.ceil(ancho / celda / 2) + 1);
  }

  /**
   * Dibuja la cinta.
   * @param m máquina
   * @param opciones.animar desliza la cinta si el cabezal se movió
   * @param opciones.escrita posición de la casilla recién escrita (se ilumina)
   * @param opciones.duracion milisegundos del deslizamiento
   */
  dibujar(m, { animar = true, escrita = null, duracion = 300 } = {}) {
    this.m = m;
    const r = this.radio();
    const c = m.cabezal;
    const partes = [];
    for (let i = c - r; i <= c + r; i++) {
      const s = m.leer(i);
      const clases = ['celda'];
      if (s === m.def.blanco) clases.push('blanco');
      if (i === c) clases.push('cabezal');
      if (i === escrita) clases.push('escrita');
      const etiqueta = escapar(etiquetaCasilla(i, s, s === m.def.blanco, i === c));
      partes.push(`<div class="${clases.join(' ')}" aria-label="${etiqueta}">${escapar(s)}<small aria-hidden="true">${i}</small></div>`);
    }
    this.tira.innerHTML = partes.join('');
    this.cabezal.querySelector('.estado').textContent = m.estado;

    const desplazamiento = this.ultimoCabezal === null ? 0 : c - this.ultimoCabezal;
    this.ultimoCabezal = c;
    if (animar && desplazamiento && Math.abs(desplazamiento) <= 2 && duracion > 0) {
      const celda = this.tira.firstElementChild.getBoundingClientRect().width - 1;
      this.tira.classList.remove('deslizar');
      this.tira.style.transform = `translateX(${desplazamiento * celda}px)`;
      void this.tira.offsetWidth; // fuerza el recálculo para que la transición arranque
      this.tira.style.setProperty('--dur', `${duracion}ms`);
      this.tira.classList.add('deslizar');
      this.tira.style.transform = 'translateX(0)';
    } else {
      this.tira.classList.remove('deslizar');
      this.tira.style.transform = 'translateX(0)';
    }
  }

  olvidarPosicion() { this.ultimoCabezal = null; }
}

export function escapar(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
