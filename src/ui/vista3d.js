/**
 * Vista 3D con Three.js: una máquina física.
 * - La cinta es una fila de casillas que se desliza bajo el cabezal.
 * - El cabezal es un pórtico con un brazo que baja, lee, escribe y sube.
 * - Se puede girar con el dedo o el ratón (OrbitControls).
 */
import * as THREE from '../../vendor/three/three.module.min.js';
import { OrbitControls } from '../../vendor/three/addons/OrbitControls.js';
import { PoolCasillas, posicionesVisibles, RADIO_CINTA_3D as RADIO, MARGEN_CINTA_3D, TAMANO_POOL_3D } from './poolCasillas.js';

const PASO = 1.08;          // distancia entre casillas
const AZUL = 0x0071e3;
const FONDO = 0xf2f2f5;

const reducirMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const suave = (t) => t * t * (3 - 2 * t);
const tramo = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));

export class Vista3D {
  constructor(contenedor, { sin3d = 'Este dispositivo no puede mostrar gráficos 3D. Usa la vista 2D.' } = {}) {
    this.el = contenedor;
    this.ok = false;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    } catch (e) {
      const p = document.createElement('p');
      p.className = 'sin-3d';
      p.textContent = sin3d;
      this.el.replaceChildren(p);
      return;
    }
    this.ok = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.el.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    this.escena = new THREE.Scene();
    this.escena.background = new THREE.Color(FONDO);
    this.escena.fog = new THREE.Fog(FONDO, 11, 22);

    this.camara = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camara.position.set(2.4, 3.7, 7.0);

    this.controles = new OrbitControls(this.camara, this.renderer.domElement);
    this.controles.target.set(0, 1.25, 0);
    this.controles.enablePan = false;
    this.controles.minDistance = 4;
    this.controles.maxDistance = 16;
    this.controles.maxPolarAngle = Math.PI * 0.48;
    this.controles.addEventListener('change', () => this.pedirDibujo());
    this.controles.update();

    this.crearLuces();
    this.crearBase();
    this.crearCabezal();
    this.texturas = new Map();
    this.casillas = new Map(); // posición visible -> malla
    this.pool = new PoolCasillas(TAMANO_POOL_3D);
    this.piezas = [];          // id del pool -> malla (como máximo las visibles)
    this.geoCasilla = null;
    this.matLado = null;
    this._maquina = null;
    this.cintaGrupo = new THREE.Group();
    this.escena.add(this.cintaGrupo);
    this.anim = null;
    this.brazoY = 0;

    new ResizeObserver(() => this.redimensionar()).observe(this.el);
    this.redimensionar();
  }

  /** Colores del fondo y de la base según el tema (claro u oscuro). */
  ponerTema(oscuro) {
    if (!this.ok) return;
    const fondo = oscuro ? 0x1c1c1e : FONDO;
    this.escena.background.set(fondo);
    this.escena.fog.color.set(fondo);
    this.metal?.color.set(oscuro ? 0x636366 : 0xd8d8de);
    this.pedirDibujo();
  }

  crearLuces() {
    this.escena.add(new THREE.HemisphereLight(0xffffff, 0xdcdce4, 1.6));
    const sol = new THREE.DirectionalLight(0xffffff, 2.2);
    sol.position.set(4, 9, 6);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -10, right: 10, top: 6, bottom: -6, near: 1, far: 30 });
    sol.shadow.radius = 4;
    this.escena.add(sol);
  }

  crearBase() {
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.ShadowMaterial({ opacity: 0.12 }));
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.y = -0.3;
    suelo.receiveShadow = true;
    this.escena.add(suelo);

    const metal = new THREE.MeshStandardMaterial({ color: 0xd8d8de, roughness: 0.45, metalness: 0.3 });
    this.metal = metal;
    const riel = new THREE.Mesh(new THREE.BoxGeometry(60, 0.14, 1.3), metal);
    riel.position.y = -0.2;
    riel.receiveShadow = true;
    riel.castShadow = true;
    this.escena.add(riel);

    // Marco azul fijo que marca la casilla bajo el cabezal.
    const marco = new THREE.Mesh(
      new THREE.RingGeometry(0.74, 0.82, 4, 1, Math.PI / 4),
      new THREE.MeshBasicMaterial({ color: AZUL, side: THREE.DoubleSide }),
    );
    marco.rotation.x = -Math.PI / 2;
    marco.position.y = 0.14;
    marco.scale.set(1, 1, 1);
    this.escena.add(marco);
  }

  crearCabezal() {
    const blanco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.05 });
    const gris = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.4, metalness: 0.5 });
    const azul = new THREE.MeshStandardMaterial({ color: AZUL, roughness: 0.3, metalness: 0.2, emissive: AZUL, emissiveIntensity: 0.25 });
    const g = new THREE.Group();
    // Columna detrás de la cinta y un brazo horizontal que llega hasta encima de la casilla.
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.2, 40), gris);
    pie.position.set(0, -0.2, -1.45);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.2, 0.34), blanco);
    col.position.set(0, 1.4, -1.45);
    col.castShadow = true;
    const viga = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.34, 1.95), blanco);
    viga.position.set(0, 2.85, -0.62);
    viga.castShadow = true;
    const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.36, 32), blanco);
    tapa.position.set(0, 2.85, 0);
    g.add(pie, col, viga, tapa);

    // Brazo que baja y sube.
    this.brazo = new THREE.Group();
    const vastago = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 24), gris);
    vastago.position.y = 0.75;
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.42, 40), blanco);
    cuerpo.castShadow = true;
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 12, 48), azul);
    anillo.rotation.x = Math.PI / 2;
    anillo.position.y = -0.2;
    const punta = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 0.22, 24), azul);
    punta.position.y = -0.31;
    this.brazo.add(vastago, cuerpo, anillo, punta);
    this.brazo.position.y = 1.55;
    g.add(this.brazo);
    this.anillo = anillo;

    // Pantalla con el estado actual.
    this.lienzoEstado = document.createElement('canvas');
    this.lienzoEstado.width = 256;
    this.lienzoEstado.height = 128;
    this.texEstado = new THREE.CanvasTexture(this.lienzoEstado);
    this.texEstado.colorSpace = THREE.SRGBColorSpace;
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), new THREE.MeshBasicMaterial({ map: this.texEstado, transparent: true }));
    pantalla.position.set(0, 3.45, -0.2);
    g.add(pantalla);
    this.escena.add(g);
  }

  dibujarEstado(texto) {
    const c = this.lienzoEstado.getContext('2d');
    c.clearRect(0, 0, 256, 128);
    c.fillStyle = '#0071e3';
    redondeado(c, 8, 16, 240, 96, 48);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = '600 56px ui-monospace, Menlo, Consolas, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(texto.length > 7 ? `${texto.slice(0, 6)}…` : texto, 128, 66);
    this.texEstado.needsUpdate = true;
  }

  texturaSimbolo(s, blanco) {
    const clave = `${s}|${s === blanco}`;
    if (this.texturas.has(clave)) return this.texturas.get(clave);
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, 128, 128);
    x.strokeStyle = '#d2d2d7';
    x.lineWidth = 4;
    x.strokeRect(2, 2, 124, 124);
    x.fillStyle = s === blanco ? '#c7c7cc' : '#1d1d1f';
    x.font = `${s === blanco ? 400 : 700} 92px ui-monospace, Menlo, Consolas, monospace`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(s, 64, s === blanco ? 50 : 72);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 });
    this.texturas.set(clave, mat);
    return mat;
  }

  /** Malla del pool. La geometría y el material de los lados se comparten. */
  asegurarPieza(id) {
    const ya = this.piezas[id];
    if (ya) return ya;
    if (!this.geoCasilla) {
      this.geoCasilla = new THREE.BoxGeometry(0.96, 0.22, 0.96);
      this.matLado = new THREE.MeshStandardMaterial({ color: 0xf7f7f9, roughness: 0.6 });
    }
    const lado = this.matLado;
    const c = new THREE.Mesh(this.geoCasilla, [lado, lado, lado, lado, lado, lado]);
    c.castShadow = true;
    c.receiveShadow = true;
    this.cintaGrupo.add(c);
    this.piezas[id] = c;
    return c;
  }

  casilla(i) {
    return this.casillas.get(i);
  }

  /**
   * Suelta las piezas de la cinta y libera geometría, materiales y texturas.
   * Se llama al reiniciar o al cambiar de máquina, no en cada paso.
   */
  liberar() {
    if (!this.ok) return;
    this.anim = null;
    for (const c of this.piezas) if (c) this.cintaGrupo.remove(c);
    this.geoCasilla?.dispose();
    this.geoCasilla = null;
    this.matLado?.dispose();
    this.matLado = null;
    for (const mat of this.texturas.values()) {
      mat.map?.dispose();
      mat.dispose();
    }
    this.texturas.clear();
    this.piezas = [];
    this.casillas.clear();
    this.pool.liberar();
  }

  ponerSimbolo(i, s, blanco) {
    const c = this.casilla(i);
    if (c.userData.s !== s) {
      c.material[2] = this.texturaSimbolo(s, blanco);
      c.userData.s = s;
    }
  }

  /** Pone las casillas visibles con lo que hay en la cinta, reciclando el pool. */
  sincronizar(m, centro = m.cabezal, excepto = null) {
    const { mapa } = this.pool.sincronizar(posicionesVisibles(centro, RADIO, MARGEN_CINTA_3D));
    const usados = new Set(mapa.values());
    this.casillas.clear();
    for (const [i, id] of mapa) {
      const c = this.asegurarPieza(id);
      c.visible = true;
      c.position.x = i * PASO;
      if (c.userData.pos !== i) {
        c.userData.pos = i;
        c.userData.s = undefined;
        c.scale.set(1, 1, 1);
      }
      this.casillas.set(i, c);
      if (i !== excepto) this.ponerSimbolo(i, m.leer(i), m.def.blanco);
    }
    for (let id = 0; id < this.piezas.length; id++) {
      if (this.piezas[id] && !usados.has(id)) this.piezas[id].visible = false;
    }
  }

  /** Muestra la máquina sin animación (al cargar, reiniciar o ir atrás). */
  mostrar(m) {
    if (!this.ok) return;
    // Máquina nueva (reinicio o ejemplo distinto): soltar las piezas de la anterior.
    if (this._maquina !== m) {
      this.liberar();
      this._maquina = m;
    }
    this.anim = null;
    this.m = m;
    this.sincronizar(m);
    this.cintaGrupo.position.x = -m.cabezal * PASO;
    this.cintaGrupo.children.forEach((c) => c.scale.set(1, 1, 1));
    this.brazo.position.y = 1.55;
    this.dibujarEstado(m.estado);
    this.pedirDibujo();
  }

  /**
   * Anima un paso: el brazo baja, la casilla cambia de símbolo, el brazo sube y la cinta se desliza.
   * @param antes {pos, simbolo, estado} justo antes del paso
   */
  animarPaso(m, antes, duracion = 900) {
    if (!this.ok) return;
    if (duracion < 120 || reducirMovimiento() || document.hidden) { this.mostrar(m); return; }
    this.m = m;
    this.sincronizar(m, antes.pos, antes.pos);
    this.sincronizar(m, m.cabezal, antes.pos);
    this.ponerSimbolo(antes.pos, antes.simbolo, m.def.blanco);
    this.dibujarEstado(antes.estado);
    this.anim = {
      inicio: performance.now(), duracion, pos: antes.pos,
      nuevo: m.leer(antes.pos), cambia: m.leer(antes.pos) !== antes.simbolo,
      desde: -antes.pos * PASO, hasta: -m.cabezal * PASO, escrito: false, estado: m.estado,
    };
    this.pedirDibujo();
  }

  pedirDibujo() {
    if (!this.ok || this.pendiente) return;
    this.pendiente = requestAnimationFrame((t) => { this.pendiente = 0; this.cuadro(t); });
  }

  cuadro(ahora) {
    const a = this.anim;
    if (a) {
      const p = Math.min(1, (ahora - a.inicio) / a.duracion);
      // 0–0.3 baja · 0.3–0.5 escribe · 0.5–0.7 sube · 0.7–1 se desliza la cinta
      const baja = suave(tramo(p, 0, 0.3)) - suave(tramo(p, 0.5, 0.7));
      this.brazo.position.y = 1.55 - baja * 1.05;
      this.anillo.material.emissiveIntensity = 0.25 + baja * 0.9;
      const c = this.casilla(a.pos);
      const golpe = Math.sin(tramo(p, 0.3, 0.5) * Math.PI);
      c.scale.y = 1 - golpe * 0.35;
      if (!a.escrito && p >= 0.4) {
        this.ponerSimbolo(a.pos, a.nuevo, this.m.def.blanco);
        this.dibujarEstado(a.estado);
        a.escrito = true;
      }
      this.cintaGrupo.position.x = a.desde + (a.hasta - a.desde) * suave(tramo(p, 0.7, 1));
      if (p >= 1) { c.scale.y = 1; this.anim = null; this.sincronizar(this.m); }
    }
    this.renderer.render(this.escena, this.camara);
    if (this.anim) this.pedirDibujo();
  }

  redimensionar() {
    if (!this.ok) return;
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    // En pantallas estrechas se aleja un poco la cámara para que se vea el pórtico completo.
    this.camara.fov = w / h < 1 ? 56 : 40;
    this.camara.updateProjectionMatrix();
    this.pedirDibujo();
  }
}

function redondeado(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
