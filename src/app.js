/**
 * Aplicación: rutas (#/inicio, #/simulador…), simulador, ejemplos, editor, aprende y presentación.
 */
import {
  MaquinaTuring, crearDefinicion, validar, describirRegla, textoParada, cintaTraza,
  estadosDeParada, exportarJSON, importarJSON, parsearReglas, reglasATexto, EJEMPLOS, buscarEjemplo,
  textoEjemplo, ponerIdiomaMotor, tm, letraMov, enlaceMaquina, decodificarMaquina,
  EJERCICIOS, buscarEjercicio, solucionEjercicio, comprobarEjercicio,
  leerBiblioteca, guardarEnBiblioteca, borrarDeBiblioteca, buscarEnBiblioteca, serializarBiblioteca,
  LIMITE_PASOS, LIMITE_PASOS_MIN, LIMITE_PASOS_MAX, interpretarLimitePasos,
} from './motor/index.js';
import { Vista2D, escapar } from './ui/vista2d.js';
import { Vista3D } from './ui/vista3d.js';
import { TEMAS, LINEA_TIEMPO, REFERENCIAS } from './ui/aprende.js';
import { TEMAS_EN, LINEA_TIEMPO_EN } from './ui/aprende.en.js';
import { t, idioma, ponerIdioma, traducirPagina } from './i18n/index.js';

const $ = (s) => document.querySelector(s);
const CLAVE_EDITOR = 'maquina-turing:editor';
const CLAVE_VELOCIDAD = 'maquina-turing:velocidad';
const CLAVE_TEMA = 'maquina-turing:tema';
const CLAVE_IDIOMA = 'maquina-turing:idioma';
const CLAVE_GUARDADAS = 'maquina-turing:guardadas';
const CLAVE_EJERCICIOS = 'maquina-turing:ejercicios';
const RETARDOS = [1400, 1100, 850, 650, 480, 340, 220, 120, 50, 0]; // ms por paso, velocidad 1..10
const TOPE_TRAZA = 5000; // filas que se guardan; en pantalla se pintan las últimas 200

/* ---------- utilidades ---------- */
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } };
const cargar = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

let avisoTemporizador = 0;
/** Mensaje breve abajo de la pantalla (lo leen también los lectores de pantalla). */
function avisoGlobal(texto) {
  const el = $('#aviso-global');
  el.textContent = texto;
  el.classList.add('visible');
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => el.classList.remove('visible'), 5000);
}

/** Comparte un enlace: menú del sistema en el teléfono; si no, lo copia. */
async function compartirEnlace(url, nombre) {
  const titulo = t('comp.titulo', { n: nombre });
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ title: titulo, url }); return; } catch (e) { if (e?.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); avisoGlobal(t('comp.copiado')); } catch { prompt(t('comp.copia'), url); }
}

/** Nombre visible de la máquina del simulador (los ejemplos se traducen). */
function nombreEjemplo(id, def) {
  const ej = id && buscarEjemplo(id);
  return ej ? textoEjemplo(ej, idioma()).nombre : def.nombre;
}

function filaReglas(reglas, activa) {
  return reglas.map((r) => `<tr class="${r === activa ? 'activa' : ''}"><td>${escapar(r.estado)}</td><td>${escapar(r.lee)}</td><td>${escapar(r.escribe)}</td><td>${escapar(letraMov(r.mueve) ?? r.mueve)}</td><td>${escapar(r.nuevo)}</td></tr>`).join('');
}

function textoRegla(m) {
  const r = m.reglaActual();
  if (!r) return textoParada(m);
  return describirRegla(r, estadosDeParada(m.def).has(r.nuevo));
}

/* ---------- simulador ---------- */
const sim = {
  def: null,
  m: null,
  traza: [],
  corriendo: false,
  temporizador: 0,
  vista2d: null,
  vista3d: null,
  idEjemplo: null,
  limitePasos: LIMITE_PASOS,
};

function iniciarSimulador() {
  sim.vista2d = new Vista2D($('#cinta-2d'));
  const sel = $('#sel-ejemplo');
  llenarSelectEjemplos();
  sel.addEventListener('change', () => {
    if (sel.value === '__propia') cargarEnSimulador(definicionEditor(), '__propia');
    else cargarEnSimulador(crearDefinicion(buscarEjemplo(sel.value)), sel.value);
  });
  $('#form-entrada').addEventListener('submit', (ev) => {
    ev.preventDefault();
    sim.def.entrada = $('#in-cinta').value.replace(/\s/g, '_');
    reiniciar();
  });
  $('#b-paso').addEventListener('click', () => { pausar(); paso(); });
  $('#b-atras').addEventListener('click', () => { pausar(); pasoAtras(); });
  $('#b-ejecutar').addEventListener('click', ejecutar);
  $('#b-pausa').addEventListener('click', pausar);
  $('#b-reiniciar').addEventListener('click', reiniciar);
  $('#b-hasta-final').addEventListener('click', correrHastaElFinal);
  $('#in-limite').addEventListener('input', () => {
    const ok = aplicarLimiteCampo();
    if (!sim.m) return;
    if (ok) actualizar({ animar: false });
    else botones();
  });

  const vel = $('#in-velocidad');
  vel.value = cargar(CLAVE_VELOCIDAD) ?? 4;
  mostrarVelocidad();
  vel.addEventListener('input', () => { mostrarVelocidad(); guardar(CLAVE_VELOCIDAD, Number(vel.value)); });
  $('#b-compartir').addEventListener('click', () => {
    const def = { ...sim.def, nombre: nombreEjemplo(sim.idEjemplo, sim.def) };
    compartirEnlace(enlaceMaquina(location.href, def), def.nombre);
  });

  for (const id of ['2d', '3d']) {
    $(`#tab-${id}`).addEventListener('click', () => elegirPestana(id));
  }
  document.addEventListener('keydown', (ev) => {
    if (rutaActual() !== 'simulador' || ev.target.closest('input, select, textarea, button')) return;
    if (ev.key === 'ArrowRight') { pausar(); paso(); ev.preventDefault(); }
    else if (ev.key === 'ArrowLeft') { pausar(); pasoAtras(); ev.preventDefault(); }
    else if (ev.key === ' ') { if (sim.corriendo) pausar(); else ejecutar(); ev.preventDefault(); }
    else if (ev.key === 'r' || ev.key === 'R') reiniciar();
  });
}

function mostrarVelocidad() {
  const vel = $('#in-velocidad');
  $('#out-velocidad').textContent = vel.value;
  vel.setAttribute('aria-valuetext', t('sim.velocidadTexto', { n: vel.value }));
}

function llenarSelectEjemplos() {
  const sel = $('#sel-ejemplo');
  const actual = sel.value;
  sel.innerHTML = EJEMPLOS.map((e) => `<option value="${e.id}">${escapar(textoEjemplo(e, idioma()).nombre)}</option>`).join('')
    + `<option value="__propia">${escapar(t('sim.propia'))}</option>`;
  if (actual) sel.value = actual;
}

function elegirPestana(id) {
  $('.sim-vistas').dataset.pestana = id;
  $('#tab-2d').setAttribute('aria-selected', String(id === '2d'));
  $('#tab-3d').setAttribute('aria-selected', String(id === '3d'));
  if (id === '3d') asegurar3D();
}

function asegurar3D() {
  if (!sim.vista3d) {
    sim.vista3d = new Vista3D($('#lienzo-3d'), { sin3d: t('sim.sin3d') });
    sim.vista3d.ponerTema?.(document.documentElement.dataset.tema === 'oscuro');
  }
  if (sim.m) sim.vista3d.mostrar(sim.m);
  sim.vista3d.redimensionar();
}

function retardo() { return RETARDOS[Number($('#in-velocidad').value) - 1]; }

function cargarEnSimulador(def, id = null) {
  pausar();
  sim.def = def;
  sim.idEjemplo = id;
  $('#sel-ejemplo').value = id && (buscarEjemplo(id) || id === '__propia') ? id : '__propia';
  textosSimulador();
  reiniciar();
}

function textosSimulador() {
  const ej = sim.idEjemplo && buscarEjemplo(sim.idEjemplo);
  $('#t-sim').textContent = nombreEjemplo(sim.idEjemplo, sim.def);
  $('#sim-descripcion').textContent = ej ? textoEjemplo(ej, idioma()).descripcion : (sim.def.descripcion || t('sim.descPropia'));
}

function reiniciar() {
  pausar();
  const escrito = interpretarLimitePasos($('#in-limite').value);
  if (escrito.ok) sim.limitePasos = escrito.n;
  const opciones = { entrada: sim.def.entrada, limitePasos: sim.limitePasos };
  const v = validar(sim.def);
  if (!v.valido) {
    sim.m = new MaquinaTuring(crearDefinicion({ ...sim.def, reglas: [] }), opciones);
    sim.m.motivo = 'invalida';
  } else sim.m = new MaquinaTuring(sim.def, opciones);
  sim.invalida = !v.valido ? v.errores : null;
  $('#in-cinta').value = sim.def.entrada;
  sim.traza = [filaTraza(sim.m)];
  sim.vista2d.olvidarPosicion();
  actualizar({ animar: false });
  sim.vista3d?.mostrar(sim.m);
}

function filaTraza(m) {
  return { paso: m.pasos, cinta: cintaTraza(m), estado: m.estado, regla: textoRegla(m) };
}

function paso({ rapido = false } = {}) {
  const m = sim.m;
  if (sim.invalida) return false;
  const antes = { pos: m.cabezal, simbolo: m.leer(), estado: m.estado };
  const r = m.paso();
  if (!r) { actualizar({ animar: false }); return false; }
  sim.traza.push(filaTraza(m));
  if (sim.traza.length > TOPE_TRAZA) sim.traza.splice(1, sim.traza.length - TOPE_TRAZA);
  if (!rapido) {
    const d = sim.corriendo ? Math.min(retardo() * 0.85, 900) : 900;
    actualizar({ animar: true, escrita: r.escribe !== antes.simbolo ? antes.pos : null, duracion: Math.min(d * 0.4, 320) });
    sim.vista3d?.animarPaso(m, antes, d);
  }
  return true;
}

function pasoAtras() {
  if (!sim.m.pasoAtras()) return;
  sim.traza.pop();
  if (sim.traza.length === 0 || sim.traza[sim.traza.length - 1].paso !== sim.m.pasos) sim.traza = rehacerTraza();
  actualizar({ animar: true });
  sim.vista3d?.mostrar(sim.m);
}

function rehacerTraza() {
  const objetivo = sim.m.pasos;
  const copia = new MaquinaTuring(sim.def, {
    entrada: sim.def.entrada,
    limitePasos: Math.max(sim.m.limitePasos, objetivo),
  });
  const filas = [filaTraza(copia)];
  // Se guarda el paso 0 y, como mucho, los últimos 4999. Al pasar de 5000
  // se suelta la fila más vieja (no el paso 0), así que queda un hueco.
  const desde = objetivo >= TOPE_TRAZA ? objetivo - (TOPE_TRAZA - 2) : 0;
  while (copia.pasos < objetivo && copia.paso()) {
    if (copia.pasos >= desde) filas.push(filaTraza(copia));
  }
  return filas;
}

/** Lee el campo del límite. Si no es válido, avisa y no cambia la máquina. */
function aplicarLimiteCampo() {
  const aviso = $('#limite-aviso');
  const campo = $('#in-limite');
  const r = interpretarLimitePasos(campo.value);
  if (!r.ok) {
    aviso.hidden = false;
    aviso.textContent = t(`sim.limiteErr.${r.error}`, {
      n: r.error === 'grande' ? LIMITE_PASOS_MAX : LIMITE_PASOS_MIN,
    });
    campo.setAttribute('aria-invalid', 'true');
    return false;
  }
  aviso.hidden = true;
  aviso.textContent = '';
  campo.removeAttribute('aria-invalid');
  sim.limitePasos = r.n;
  sim.m?.fijarLimite(r.n);
  return true;
}

/** Corre de una vez hasta parar o hasta el límite, sin animar cada paso. */
function correrHastaElFinal() {
  if (sim.corriendo || sim.invalida || !sim.m || sim.m.detenida) return;
  if (!aplicarLimiteCampo()) return;
  const m = sim.m;
  m.ejecutar();
  sim.traza = rehacerTraza();
  actualizar({ animar: false });
  sim.vista3d?.mostrar(m);
}

function ejecutar() {
  if (sim.corriendo || sim.invalida) return;
  if (sim.m.detenida || sim.m.motivo === 'limite') return;
  sim.corriendo = true;
  botones();
  const tic = () => {
    if (!sim.corriendo) return;
    const d = retardo();
    let siguio;
    if (d === 0) {
      // Velocidad máxima: varios pasos por cuadro, sin animar cada uno.
      for (let i = 0; i < 40 && (siguio = paso({ rapido: true })); i++);
      actualizar({ animar: false });
      sim.vista3d?.mostrar(sim.m);
    } else siguio = paso();
    if (!siguio || sim.m.detenida || sim.m.motivo === 'limite') { pausar(); return; }
    sim.temporizador = setTimeout(tic, d === 0 ? 16 : d);
  };
  tic();
}

function pausar() {
  sim.corriendo = false;
  clearTimeout(sim.temporizador);
  botones();
}

function botones() {
  const m = sim.m;
  if (!m) return;
  const fin = m.detenida || m.motivo === 'limite' || !!sim.invalida;
  const limiteMal = $('#in-limite').getAttribute('aria-invalid') === 'true';
  $('#b-paso').disabled = fin || sim.corriendo;
  $('#b-atras').disabled = m.pasos === 0 || sim.corriendo;
  $('#b-ejecutar').disabled = fin || sim.corriendo;
  $('#b-pausa').disabled = !sim.corriendo;
  $('#b-hasta-final').disabled = m.detenida || !!sim.invalida || sim.corriendo || limiteMal;
}

function actualizar(opciones) {
  const m = sim.m;
  sim.vista2d.dibujar(m, opciones);
  $('#ind-estado').textContent = m.estado;
  $('#ind-pasos').textContent = m.pasos;
  $('#ind-lee').textContent = m.leer();
  const activa = m.reglaActual();
  $('#tabla-reglas tbody').innerHTML = filaReglas(sim.def.reglas, sim.invalida ? null : activa);
  const paradas = [...sim.def.finales, ...sim.def.acepta.map((q) => `${q} ${t('sim.sufAcepta')}`), ...sim.def.rechaza.map((q) => `${q} ${t('sim.sufRechaza')}`)];
  $('#txt-paradas').textContent = paradas.join(', ') || t('sim.ninguno');

  const msg = $('#sim-mensaje');
  msg.className = 'mensaje';
  if (sim.invalida) {
    msg.textContent = t('sim.msgInvalida', { e: sim.invalida[0].mensaje });
    msg.classList.add('rechazo');
  } else if (m.motivo === 'final') {
    msg.textContent = t('sim.msgFinal', { q: m.estado, n: m.pasos, r: m.resultado() || t('sim.cintaVacia') });
    msg.classList.add('fin');
  } else if (m.motivo === 'acepta') {
    msg.textContent = t('sim.msgAcepta', { e: m.entrada || t('sim.vacia'), q: m.estado, n: m.pasos });
    msg.classList.add('fin');
  } else if (m.motivo === 'rechaza') {
    msg.textContent = t('sim.msgRechaza', { e: m.entrada || t('sim.vacia'), q: m.estado, n: m.pasos });
    msg.classList.add('rechazo');
  } else if (m.motivo === 'sin-regla') {
    msg.textContent = t('sim.msgSinRegla', { q: m.estado, s: m.leer() });
    msg.classList.add('alerta');
  } else if (m.motivo === 'limite') {
    msg.textContent = t('sim.msgLimite', { n: m.limitePasos });
    msg.classList.add('alerta');
  } else {
    msg.textContent = t('sim.msgProximo', { r: textoRegla(m) });
  }

  const filas = sim.traza.slice(-200);
  $('#tabla-traza tbody').innerHTML = filas.map((f, i) => `<tr class="${i === filas.length - 1 ? 'activa' : ''}"><td>${f.paso}</td><td>${escapar(f.cinta)}</td><td>${escapar(f.estado)}</td><td>${escapar(f.regla)}</td></tr>`).join('');
  const env = $('#tabla-traza').parentElement;
  env.scrollTop = env.scrollHeight;
  botones();
  // Datos para pruebas automáticas y lectores de pantalla.
  document.body.dataset.estado = m.estado;
  document.body.dataset.pasos = m.pasos;
  document.body.dataset.resultado = m.resultado();
}

/* ---------- ejemplos ---------- */
function dibujarEjemplos() {
  $('#lista-ejemplos').innerHTML = EJEMPLOS.map((e) => {
    const tx = textoEjemplo(e, idioma());
    return `
    <article class="tarjeta ejemplo">
      <h2>${escapar(tx.nombre)}</h2>
      <p>${escapar(tx.resumen)}</p>
      <div class="datos">${escapar(t('ej.datos', { e: e.entrada || t('sim.cintaVacia'), n: e.reglas.length }))}</div>
      <div class="botones">
        <a class="boton primario" href="#/simulador?ejemplo=${e.id}">${escapar(t('ej.abrir'))}</a>
        <button class="boton texto" data-editar="${e.id}" aria-label="${escapar(`${t('ej.editar')}: ${tx.nombre}`)}">${escapar(t('ej.editar'))}</button>
      </div>
    </article>`;
  }).join('');
}

function iniciarEjemplos() {
  dibujarEjemplos();
  $('#lista-ejemplos').addEventListener('click', (ev) => {
    const id = ev.target.closest('[data-editar]')?.dataset.editar;
    if (!id) return;
    ponerEnEditor({ ...crearDefinicion(buscarEjemplo(id)), nombre: textoEjemplo(buscarEjemplo(id), idioma()).nombre });
    location.hash = '#/editor';
  });
}

/* ---------- editor ---------- */
const ed = { def: null, biblioteca: [], ejercicio: null };

function definicionEditor() { return crearDefinicion(ed.def); }

function iniciarEditor() {
  const guardada = cargar(CLAVE_EDITOR);
  ed.def = guardada ? crearDefinicion(guardada) : crearDefinicion({ ...buscarEjemplo('sumar-uno'), nombre: t('ed.nuevoNombre') });
  ed.biblioteca = leerBiblioteca(cargar(CLAVE_GUARDADAS));
  const campos = { '#ed-nombre': 'nombre', '#ed-entrada': 'entrada', '#ed-inicial': 'inicial', '#ed-finales': 'finales', '#ed-acepta': 'acepta', '#ed-rechaza': 'rechaza' };
  for (const [sel, clave] of Object.entries(campos)) {
    $(sel).addEventListener('input', (ev) => {
      const v = ev.target.value;
      ed.def[clave] = ['finales', 'acepta', 'rechaza'].includes(clave) ? v.split(',').map((x) => x.trim()).filter(Boolean) : v;
      cambioEditor(false);
    });
  }
  const tbody = $('#tabla-editor tbody');
  tbody.addEventListener('input', (ev) => {
    const tr = ev.target.closest('tr');
    if (!tr) return;
    const r = ed.def.reglas[Number(tr.dataset.i)];
    r[ev.target.dataset.campo] = ev.target.value.trim() || (['lee', 'escribe'].includes(ev.target.dataset.campo) ? '_' : '');
    cambioEditor(false);
  });
  tbody.addEventListener('click', (ev) => {
    const b = ev.target.closest('.borrar');
    if (!b) return;
    ed.def.reglas.splice(Number(b.closest('tr').dataset.i), 1);
    cambioEditor(true);
  });
  $('#ed-anadir').addEventListener('click', () => {
    const ult = ed.def.reglas[ed.def.reglas.length - 1];
    ed.def.reglas.push({ estado: ult?.estado ?? ed.def.inicial, lee: '_', escribe: '_', mueve: 'D', nuevo: ult?.nuevo ?? 'qF' });
    cambioEditor(true);
    tbody.lastElementChild?.querySelector('input')?.focus();
  });
  $('#ed-probar').addEventListener('click', () => {
    const d = definicionEditor();
    if (!validar(d).valido) { aviso(t('ed.corrige')); return; }
    sim.pendiente = d;
    location.hash = '#/simulador?propia=1';
  });
  $('#ed-exportar').addEventListener('click', () => {
    const blob = new Blob([exportarJSON(definicionEditor())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(ed.def.nombre || 'maquina').normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'maquina'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    aviso(t('ed.descargado'));
  });
  $('#ed-archivo').addEventListener('change', async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    try { ponerEnEditor(importarJSON(await f.text())); aviso(t('ed.importado', { n: f.name })); } catch (e) { aviso(`✕ ${e.message}`); }
    ev.target.value = '';
  });
  $('#ed-compartir').addEventListener('click', () => {
    const d = definicionEditor();
    compartirEnlace(enlaceMaquina(location.href, d), d.nombre);
  });
  $('#ed-guardar').addEventListener('click', () => {
    const d = definicionEditor();
    ed.biblioteca = guardarEnBiblioteca(ed.biblioteca, d);
    guardarBiblioteca();
    aviso(t('ed.guardada', { n: ed.biblioteca[0].nombre }));
  });
  $('#ed-guardadas').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-accion]');
    if (!b) return;
    const nombre = b.closest('li').dataset.nombre;
    if (b.dataset.accion === 'abrir') {
      const x = buscarEnBiblioteca(ed.biblioteca, nombre);
      if (x) { ponerEnEditor(x.def); aviso(t('ed.abierta', { n: nombre })); }
    } else {
      ed.biblioteca = borrarDeBiblioteca(ed.biblioteca, nombre);
      guardarBiblioteca();
      aviso(t('ed.borrada', { n: nombre }));
      $('#ed-guardar').focus();
    }
  });
  const selEj = $('#ed-ejemplo');
  llenarSelectEditor();
  selEj.addEventListener('change', () => {
    if (!selEj.value) return;
    const ej = buscarEjemplo(selEj.value);
    ponerEnEditor({ ...crearDefinicion(ej), nombre: textoEjemplo(ej, idioma()).nombre });
    aviso(t('ed.ejemploCopiado'));
    selEj.value = '';
  });
  $('#ed-ejercicio').addEventListener('click', (ev) => {
    if (ev.target.closest('[data-comprobar]')) comprobarDesdeEditor();
  });
  $('#ed-aplicar-texto').addEventListener('click', () => {
    const { reglas, errores } = parsearReglas($('#ed-texto').value);
    if (errores.length) { aviso(errores.map((e) => e.mensaje).join(' ')); return; }
    ed.def.reglas = reglas;
    cambioEditor(true);
    aviso(t('ed.aplicadas', { n: reglas.length }));
  });
  ponerEnEditor(ed.def);
  dibujarBiblioteca();
}

function llenarSelectEditor() {
  $('#ed-ejemplo').innerHTML = `<option value="">${escapar(t('ed.elige'))}</option>`
    + EJEMPLOS.map((e) => `<option value="${e.id}">${escapar(textoEjemplo(e, idioma()).nombre)}</option>`).join('');
}

function guardarBiblioteca() {
  guardar(CLAVE_GUARDADAS, serializarBiblioteca(ed.biblioteca));
  dibujarBiblioteca();
}

function dibujarBiblioteca() {
  const ul = $('#ed-guardadas');
  if (!ed.biblioteca.length) { ul.innerHTML = `<li class="vacia">${escapar(t('ed.ninguna'))}</li>`; return; }
  const fecha = new Intl.DateTimeFormat(idioma() === 'en' ? 'en' : 'es', { dateStyle: 'medium', timeStyle: 'short' });
  ul.innerHTML = ed.biblioteca.map((x) => `
    <li data-nombre="${escapar(x.nombre)}">
      <div><strong>${escapar(x.nombre)}</strong><span>${escapar(t('ed.reglasN', { n: x.def.reglas.length }))}${x.fecha ? ` · ${escapar(fecha.format(x.fecha))}` : ''}</span></div>
      <button class="boton secundario chico" data-accion="abrir" aria-label="${escapar(t('ed.cargarA', { n: x.nombre }))}">${escapar(t('ed.cargar'))}</button>
      <button class="boton texto chico" data-accion="borrar" aria-label="${escapar(t('ed.borrarA', { n: x.nombre }))}">${escapar(t('ed.borrarG'))}</button>
    </li>`).join('');
}

/** Antes de reemplazar el borrador (por un ejercicio o un enlace), lo guarda en la lista. */
function respaldarBorrador() {
  const d = definicionEditor();
  if (!d.reglas.length) return;
  const igual = buscarEnBiblioteca(ed.biblioteca, d.nombre);
  if (igual && exportarJSON(igual.def) === exportarJSON(d)) return;
  ed.biblioteca = guardarEnBiblioteca(ed.biblioteca, d);
  guardarBiblioteca();
}

function aviso(t) { $('#ed-aviso').textContent = t; }

function ponerEnEditor(def) {
  ed.def = crearDefinicion(def);
  $('#ed-nombre').value = ed.def.nombre;
  $('#ed-entrada').value = ed.def.entrada;
  $('#ed-inicial').value = ed.def.inicial;
  $('#ed-finales').value = ed.def.finales.join(', ');
  $('#ed-acepta').value = ed.def.acepta.join(', ');
  $('#ed-rechaza').value = ed.def.rechaza.join(', ');
  cambioEditor(true);
}

function cambioEditor(redibujar) {
  if (redibujar) {
    $('#tabla-editor tbody').innerHTML = ed.def.reglas.map((r, i) => `
      <tr data-i="${i}">
        <td>${i + 1}</td>
        <td data-l="${escapar(t('col.estado'))}"><input type="text" data-campo="estado" value="${escapar(r.estado)}" aria-label="${escapar(t('ed.fila', { i: i + 1, c: t('col.estado') }))}" spellcheck="false"></td>
        <td data-l="${escapar(t('col.lee'))}"><input type="text" data-campo="lee" value="${escapar(r.lee)}" maxlength="1" aria-label="${escapar(t('ed.fila', { i: i + 1, c: t('col.lee') }))}" spellcheck="false"></td>
        <td data-l="${escapar(t('col.escribe'))}"><input type="text" data-campo="escribe" value="${escapar(r.escribe)}" maxlength="1" aria-label="${escapar(t('ed.fila', { i: i + 1, c: t('col.escribe') }))}" spellcheck="false"></td>
        <td data-l="${escapar(t('col.mueve'))}"><select data-campo="mueve" aria-label="${escapar(t('ed.fila', { i: i + 1, c: t('col.mueve') }))}">
          ${['I', 'D', 'N'].map((x) => `<option value="${x}" ${r.mueve === x ? 'selected' : ''}>${letraMov(x)} · ${escapar(tm(`mov.${x}`))}</option>`).join('')}
        </select></td>
        <td data-l="${escapar(t('col.nuevo'))}"><input type="text" data-campo="nuevo" value="${escapar(r.nuevo)}" aria-label="${escapar(t('ed.fila', { i: i + 1, c: t('col.nuevo') }))}" spellcheck="false"></td>
        <td><button class="borrar" aria-label="${escapar(t('ed.borrarFila', { i: i + 1 }))}" title="${escapar(t('ed.borrar'))}">×</button></td>
      </tr>`).join('');
  }
  const d = definicionEditor();
  const v = validar(d);
  const filasError = new Set(v.errores.map((e) => e.fila).filter(Boolean));
  document.querySelectorAll('#tabla-editor tbody tr').forEach((tr) => tr.classList.toggle('con-error', filasError.has(Number(tr.dataset.i) + 1)));
  const lista = [];
  if (v.valido) lista.push(`<p class="ok">${escapar(t('ed.valida', { n: d.reglas.length, a: v.alfabeto.join(', ') }))}</p>`);
  v.errores.forEach((e) => lista.push(`<p class="error">✕ ${escapar(e.mensaje)}</p>`));
  v.avisos.forEach((a) => lista.push(`<p class="aviso">! ${escapar(a.mensaje)}</p>`));
  $('#ed-validacion').innerHTML = lista.join('');
  if (document.activeElement !== $('#ed-texto')) $('#ed-texto').value = reglasATexto(d.reglas);
  guardar(CLAVE_EDITOR, JSON.parse(exportarJSON(d)));
}

/* ---------- ejercicios ---------- */
function superados() { return new Set(cargar(CLAVE_EJERCICIOS) ?? []); }

function textoEsperado(c) {
  if ('acepta' in c) return t(c.acepta ? 'ejr.acepta' : 'ejr.rechaza');
  return c.resultado || t('ejr.vacia');
}

function dibujarEjercicios() {
  const hechos = superados();
  $('#lista-ejercicios').innerHTML = EJERCICIOS.map((e) => {
    const tx = e[idioma()] ?? e.es;
    return `
    <article class="tarjeta ejercicio" id="ejr-${e.id}" data-ejercicio="${e.id}" aria-labelledby="ejr-t-${e.id}">
      <div class="ejr-cabecera"><span class="nivel">${escapar(t('ejr.nivel', { n: e.nivel }))}</span>
        <span class="insignia" ${hechos.has(e.id) ? '' : 'hidden'}>${escapar(t('ejr.superado'))}</span></div>
      <h2 id="ejr-t-${e.id}">${escapar(tx.titulo)}</h2>
      <p>${escapar(tx.objetivo)}</p>
      <div class="tabla-envoltura"><table class="tabla casos">
        <caption class="oculto">${escapar(t('ejr.casos'))}</caption>
        <thead><tr><th scope="col">${escapar(t('ejr.entrada'))}</th><th scope="col">${escapar(t('ejr.esperado'))}</th><th scope="col">${escapar(t('ejr.obtenido'))}</th></tr></thead>
        <tbody>${e.casos.map((c, i) => `<tr data-caso="${i}"><td>${escapar(c.entrada || t('ejr.vacia'))}</td><td>${escapar(textoEsperado(c))}</td><td class="obtenido">—</td></tr>`).join('')}</tbody>
      </table></div>
      <div class="botones">
        <button class="boton secundario" data-accion="empezar">${escapar(t('ejr.empezar'))}</button>
        <button class="boton primario" data-accion="comprobar">${escapar(t('ejr.comprobar'))}</button>
      </div>
      <p class="resultado-ejr" role="status" aria-live="polite"></p>
      <div class="pistas">
        ${tx.pistas.map((p, i) => `<details class="pista-ejr" data-pista="${i}" ${i > 0 ? 'hidden' : ''}><summary>${escapar(t('ejr.pista', { n: i + 1 }))}</summary><p>${escapar(p)}</p></details>`).join('')}
        <details class="solucion" hidden><summary>${escapar(t('ejr.solucion'))}</summary>
          <pre>${escapar(reglasATexto(solucionEjercicio(e).reglas))}</pre>
          <button class="boton texto" data-accion="solucion">${escapar(t('ejr.cargarSol'))}</button>
        </details>
      </div>
    </article>`;
  }).join('');
}

function iniciarEjercicios() {
  dibujarEjercicios();
  const lista = $('#lista-ejercicios');
  lista.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-accion]');
    if (!b) return;
    const ej = buscarEjercicio(b.closest('[data-ejercicio]').dataset.ejercicio);
    if (b.dataset.accion === 'empezar') abrirEjercicio(ej, crearDefinicion(ej.plantilla));
    else if (b.dataset.accion === 'solucion') abrirEjercicio(ej, solucionEjercicio(ej));
    else comprobar(ej);
  });
  // Las pistas se abren en orden; la solución aparece después de la última pista.
  lista.addEventListener('toggle', (ev) => {
    const d = ev.target;
    if (!d.open || !d.classList?.contains('pista-ejr')) return;
    const sig = d.nextElementSibling;
    if (sig) sig.hidden = false;
  }, true);
}

function abrirEjercicio(ej, def) {
  respaldarBorrador();
  ed.ejercicio = ej.id;
  const tx = ej[idioma()] ?? ej.es;
  ponerEnEditor({ ...def, nombre: tx.titulo });
  location.hash = '#/editor';
  aviso(t('ejr.cargado', { t: tx.titulo }));
  bannerEjercicio();
}

function bannerEjercicio(resumen = '') {
  const el = $('#ed-ejercicio');
  const ej = ed.ejercicio && buscarEjercicio(ed.ejercicio);
  el.hidden = !ej;
  if (!ej) return;
  const tx = ej[idioma()] ?? ej.es;
  el.innerHTML = `<span>${escapar(t('ejr.activo', { t: tx.titulo }))} ${escapar(tx.objetivo)}</span>
    <span class="botones"><button class="boton primario chico" data-comprobar>${escapar(t('ejr.comprobar'))}</button>
    <a class="boton secundario chico" href="#/ejercicios?id=${ej.id}">${escapar(t('ejr.volver'))}</a></span>
    <strong class="resumen" role="status" aria-live="polite">${escapar(resumen)}</strong>`;
}

function comprobarDesdeEditor() {
  const ej = buscarEjercicio(ed.ejercicio);
  if (ej) bannerEjercicio(comprobar(ej));
}

/** Prueba la máquina del editor con el ejercicio y pinta el resultado. Devuelve el resumen. */
function comprobar(ej) {
  const r = comprobarEjercicio(ej, definicionEditor());
  const tarjeta = document.getElementById(`ejr-${ej.id}`);
  let resumen;
  if (r.invalida) resumen = t('ejr.invalida', { e: r.invalida[0].mensaje });
  else {
    const ok = r.casos.filter((c) => c.ok).length;
    resumen = r.aprobado ? t('ejr.aprobado', { n: r.casos.length }) : t('ejr.fallo', { ok, n: r.casos.length });
    r.casos.forEach((c, i) => {
      const celda = tarjeta.querySelector(`tr[data-caso="${i}"] .obtenido`);
      const obtenido = ('acepta' in ej.casos[i]) ? t(`ejr.motivo.${c.motivo}`) : (c.motivo === 'final' ? (c.obtenido || t('ejr.vacia')) : t(`ejr.motivo.${c.motivo}`));
      celda.textContent = `${c.ok ? '✓' : '✕'} ${obtenido}`;
      celda.className = `obtenido ${c.ok ? 'ok' : 'mal'}`;
    });
  }
  if (r.aprobado) {
    const hechos = superados();
    hechos.add(ej.id);
    guardar(CLAVE_EJERCICIOS, [...hechos]);
    tarjeta.querySelector('.insignia').hidden = false;
  }
  const p = tarjeta.querySelector('.resultado-ejr');
  p.textContent = resumen;
  p.className = `resultado-ejr ${r.aprobado ? 'ok' : 'mal'}`;
  document.body.dataset.ejercicio = r.aprobado ? 'aprobado' : 'pendiente';
  return resumen;
}

/* ---------- tema e idioma ---------- */
function temaPreferido() {
  const guardado = cargar(CLAVE_TEMA);
  if (guardado === 'oscuro' || guardado === 'claro') return guardado;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

function aplicarTema(tema) {
  const oscuro = tema === 'oscuro';
  document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro';
  $('#b-tema').setAttribute('aria-pressed', String(oscuro));
  $('#tema-icono').textContent = oscuro ? '☀' : '☾';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#000000' : '#f5f5f7');
  sim.vista3d?.ponerTema?.(oscuro);
}

function aplicarIdioma(l, { redibujar = true } = {}) {
  ponerIdioma(l);
  ponerIdiomaMotor(l);
  document.documentElement.lang = idioma();
  traducirPagina();
  const b = $('#b-idioma');
  b.textContent = t('idioma.boton');
  b.setAttribute('aria-label', t('idioma.aria'));
  b.setAttribute('lang', t('idioma.lang'));
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('doc.descripcion'));
  if (!redibujar) return;
  llenarSelectEjemplos();
  llenarSelectEditor();
  dibujarEjemplos();
  dibujarEjercicios();
  iniciarAprende();
  dibujarBiblioteca();
  bannerEjercicio();
  cambioEditor(true);
  mostrarVelocidad();
  if ($('#in-limite').getAttribute('aria-invalid') === 'true') aplicarLimiteCampo();
  if (sim.def) {
    textosSimulador();
    const v = validar(sim.def);
    sim.invalida = v.valido ? null : v.errores;
    sim.traza = rehacerTraza();
    actualizar({ animar: false });
  }
  if (pr.m) prDibujar({ animar: false });
  navegarTitulo();
}

function navegarTitulo() {
  const ruta = rutaActual();
  document.title = ruta === 'inicio' || !document.querySelector(`[data-vista="${ruta}"]`) ? t('app') : `${t(`ruta.${ruta}`)} · ${t('app')}`;
}

function iniciarAjustes() {
  aplicarTema(temaPreferido());
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (!cargar(CLAVE_TEMA)) aplicarTema(temaPreferido()); });
  $('#b-tema').addEventListener('click', () => {
    const nuevo = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
    guardar(CLAVE_TEMA, nuevo);
    aplicarTema(nuevo);
  });
  $('#b-idioma').addEventListener('click', () => {
    const nuevo = idioma() === 'es' ? 'en' : 'es';
    guardar(CLAVE_IDIOMA, nuevo);
    aplicarIdioma(nuevo);
  });
}

/* ---------- aprende ---------- */
function iniciarAprende() {
  const en = idioma() === 'en';
  const temas = en ? TEMAS_EN : TEMAS;
  const linea = en ? LINEA_TIEMPO_EN : LINEA_TIEMPO;
  $('#indice-aprende').innerHTML = [...temas.map((x) => [x.id, x.titulo]), ['linea', t('ap.linea')], ['referencias', t('ap.referencias')]]
    .map(([id, x]) => `<a href="#/aprende?tema=${id}">${escapar(x)}</a>`).join('');
  $('#contenido-aprende').innerHTML = temas.map((t) => `
    <article class="tarjeta tema" id="tema-${t.id}">
      <div class="grid">
        <div><h2>${t.titulo}</h2>${t.html}
          <a class="boton primario" href="${t.prueba.ruta}">${t.prueba.texto}</a></div>
        <aside>${t.lado}</aside>
      </div>
    </article>`).join('') + `
    <article class="tarjeta tema" id="tema-linea">
      <h2>${escapar(t('ap.linea'))}</h2>
      <ol class="linea-tiempo">${linea.map(([a, h]) => `<li><b>${a}</b><span>${h}</span></li>`).join('')}</ol>
    </article>
    <article class="tarjeta tema" id="tema-referencias">
      <h2>${escapar(t('ap.referencias'))}</h2>
      <ol class="referencias">${REFERENCIAS.map(([t, u]) => `<li>${escapar(t)} <a href="${u}" rel="noopener" target="_blank">${escapar(u.replace(/^https:\/\//, ''))}</a></li>`).join('')}</ol>
    </article>`;
}

/* ---------- presentación ---------- */
const pr = { m: null, vista: null };

function iniciarPresentacion() {
  pr.vista = new Vista2D($('#pr-cinta'));
  const def = crearDefinicion(buscarEjemplo('sumar-uno'));
  pr.m = new MaquinaTuring(def);
  $('#pr-paso').addEventListener('click', () => prPaso());
  $('#pr-atras').addEventListener('click', () => prAtras());
  $('#pr-reiniciar').addEventListener('click', () => prReiniciar());
  $('#pr-pantalla').addEventListener('click', pantallaCompleta);
  document.addEventListener('keydown', (ev) => {
    if (rutaActual() !== 'presentacion') return;
    if (['ArrowRight', 'PageDown', ' ', 'Enter', 'ArrowDown'].includes(ev.key)) { prPaso(); ev.preventDefault(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace', 'ArrowUp'].includes(ev.key)) { prAtras(); ev.preventDefault(); }
    else if (['r', 'R', 'Home'].includes(ev.key)) prReiniciar();
    else if (ev.key === 'f' || ev.key === 'F') pantallaCompleta();
    else if (ev.key === 'Escape' && !document.fullscreenElement) location.hash = '#/simulador';
  });
}

function prDibujar(op = {}) {
  const m = pr.m;
  pr.vista.dibujar(m, { duracion: 380, ...op });
  $('#pr-pasos').textContent = m.pasos;
  $('#pr-estado').textContent = m.estado;
  $('#pr-regla').textContent = textoRegla(m);
  $('#pr-tabla tbody').innerHTML = filaReglas(m.def.reglas, m.reglaActual());
}
function prPaso() {
  const antes = pr.m.leer();
  const pos = pr.m.cabezal;
  const r = pr.m.paso();
  if (r) prDibujar({ escrita: r.escribe !== antes ? pos : null });
}
function prAtras() { if (pr.m.pasoAtras()) prDibujar(); }
function prReiniciar() { pr.m.reiniciar('111'); pr.vista.olvidarPosicion(); prDibujar({ animar: false }); }
function pantallaCompleta() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

/* ---------- rutas ---------- */
function rutaActual() { return (location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'inicio'; }
function parametros() { return new URLSearchParams(location.hash.split('?')[1] || ''); }

function navegar() {
  let ruta = rutaActual();
  if (!document.querySelector(`[data-vista="${ruta}"]`)) ruta = 'inicio';
  document.querySelectorAll('.vista').forEach((v) => v.classList.toggle('activa', v.dataset.vista === ruta));
  document.querySelectorAll('.menu a').forEach((a) => (a.dataset.ruta === ruta ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  document.body.classList.toggle('presentando', ruta === 'presentacion');
  const p = parametros();
  document.title = ruta === 'inicio' ? t('app') : `${t(`ruta.${ruta}`)} · ${t('app')}`;

  if (ruta === 'simulador') {
    if (p.get('m')) {
      if (p.get('m') !== sim.enlace) {
        sim.enlace = p.get('m');
        try {
          const d = decodificarMaquina(p.get('m'));
          respaldarBorrador();
          ponerEnEditor(d);
          cargarEnSimulador(d, '__propia');
          avisoGlobal(t('comp.abierta', { n: d.nombre }));
        } catch {
          cargarEnSimulador(crearDefinicion(buscarEjemplo('sumar-uno')), 'sumar-uno');
          avisoGlobal(t('comp.malo'));
        }
      }
    } else if (p.get('propia') && sim.pendiente) {
      cargarEnSimulador(sim.pendiente, '__propia');
      sim.pendiente = null;
    } else if (p.get('ejemplo') && buscarEjemplo(p.get('ejemplo'))) {
      cargarEnSimulador(crearDefinicion(buscarEjemplo(p.get('ejemplo'))), p.get('ejemplo'));
    } else if (!sim.m) cargarEnSimulador(crearDefinicion(buscarEjemplo('sumar-uno')), 'sumar-uno');
    // En pantallas anchas la vista 3D está siempre a la vista.
    if (matchMedia('(min-width: 761px)').matches || $('.sim-vistas').dataset.pestana === '3d') asegurar3D();
    sim.vista2d.dibujar(sim.m, { animar: false });
  } else pausar();
  if (ruta === 'presentacion') prReiniciar();
  if (ruta === 'aprende' && p.get('tema')) {
    document.getElementById(`tema-${p.get('tema')}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (ruta === 'ejercicios' && p.get('id')) {
    document.getElementById(`ejr-${p.get('id')}`)?.scrollIntoView({ block: 'start' });
  } else window.scrollTo(0, 0);
  if (ruta !== 'inicio') $('#contenido').focus({ preventScroll: true });
}

function iniciar() {
  const l = cargar(CLAVE_IDIOMA) === 'en' ? 'en' : 'es';
  aplicarIdioma(l, { redibujar: false });
  iniciarSimulador();
  iniciarEjemplos();
  iniciarEditor();
  iniciarEjercicios();
  iniciarAprende();
  iniciarPresentacion();
  iniciarAjustes();
  addEventListener('hashchange', navegar);
  addEventListener('resize', () => { if (rutaActual() === 'simulador' && matchMedia('(min-width: 761px)').matches) asegurar3D(); });
  navegar();
  // Trabajo sin conexión en la web publicada (no aplica al archivo único abierto desde el teléfono).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.ARCHIVO_UNICO) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

iniciar();
