/**
 * Pool de piezas de la cinta 3D.
 * La vista solo muestra unas pocas casillas a la vez. Este pool nunca crea
 * más piezas que las que caben en esa ventana: las que salen se reutilizan.
 */

/** Casillas visibles a cada lado del cabezal (sin contar el margen extra). */
export const RADIO_CINTA_3D = 11;

/** Casillas de más, para que el deslizamiento no se quede sin pieza. */
export const MARGEN_CINTA_3D = 2;

/** Piezas que hacen falta para la ventana: centro ± (radio + margen). */
export const TAMANO_POOL_3D = (RADIO_CINTA_3D + MARGEN_CINTA_3D) * 2 + 1;

/** Posiciones de cinta que se ven con el cabezal en `centro`. */
export function posicionesVisibles(centro, radio = RADIO_CINTA_3D, margen = MARGEN_CINTA_3D) {
  const a = centro - radio - margen;
  const b = centro + radio + margen;
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

export class PoolCasillas {
  constructor(capacidad) {
    if (!Number.isInteger(capacidad) || capacidad < 1) {
      throw new Error('La capacidad del pool debe ser un entero mayor que 0');
    }
    this.capacidad = capacidad;
    this.porPosicion = new Map();
    this.libres = [];
    this.creadas = 0;
  }

  get enUso() {
    return this.porPosicion.size;
  }

  /**
   * Deja activas exactamente esas posiciones.
   * @returns {{ mapa: Map<number, number>, nuevas: number[] }}
   * `mapa` es posición → id de pieza. `nuevas` son ids creados en esta llamada.
   */
  sincronizar(posiciones) {
    const queremos = new Set(posiciones);
    for (const [pos, id] of this.porPosicion) {
      if (!queremos.has(pos)) {
        this.porPosicion.delete(pos);
        this.libres.push(id);
      }
    }
    const mapa = new Map();
    const nuevas = [];
    for (const pos of queremos) {
      let id = this.porPosicion.get(pos);
      if (id === undefined) {
        if (this.libres.length) id = this.libres.pop();
        else {
          if (this.creadas >= this.capacidad) throw new Error('pool agotado');
          id = this.creadas++;
          nuevas.push(id);
        }
        this.porPosicion.set(pos, id);
      }
      mapa.set(pos, id);
    }
    return { mapa, nuevas };
  }

  /** Olvida las asignaciones. Devuelve cuántas piezas había creadas. */
  liberar() {
    const n = this.creadas;
    this.porPosicion.clear();
    this.libres = [];
    this.creadas = 0;
    return n;
  }
}
