/**
 * Aplicación: rutas (#/inicio, #/simulador…), simulador, ejemplos, editor, aprende y presentación.
 */
import {
  MaquinaTuring, crearDefinicion, validar, describirRegla, textoParada, cintaTraza,
  estadosDeParada, exportarJSON, importarJSON, parsearReglas, reglasATexto, EJEMPLOS, buscarEjemplo,
} from './motor/index.js';
import { Vista2D, escapar } from './ui/vista2d.js';
import { Vista3D } from './ui/vista3d.js';
import { TEMAS, LINEA_TIEMPO, REFERENCIAS } from './ui/aprende.js';

const $ = (s) => document.querySelector(s);
const CLAVE_EDITOR = 'maquina-turing:editor';
const CLAVE_VELOCIDAD = 'maquina-turing:velocidad';
const RETARDOS = [1400, 1100, 850, 650, 480, 340, 220, 120, 50, 0]; // ms por paso, velocidad 1..10
const MOV = { I: 'I', D: 'D', N: 'N' };

/* ---------- utilidades ---------- */
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } };
const cargar = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

function codificar(def) {
  const bytes = new TextEncoder().encode(exportarJSON(def));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodificar(txt) {
  const bin = atob(txt.replace(/-/g, '+').replace(/_/g, '/'));
  return importarJSON(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
}

function filaReglas(reglas, activa) {
  return reglas.map((r) => `<tr class="${r === activa ? 'activa' : ''}"><td>${escapar(r.estado)}</td><td>${escapar(r.lee)}</td><td>${escapar(r.escribe)}</td><td>${MOV[r.mueve] ?? escapar(r.mueve)}</td><td>${escapar(r.nuevo)}</td></tr>`).join('');
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
};

function iniciarSimulador() {
  sim.vista2d = new Vista2D($('#cinta-2d'));
  const sel = $('#sel-ejemplo');
  sel.innerHTML = EJEMPLOS.map((e) => `<option value="${e.id}">${escapar(e.nombre)}</option>`).join('')
    + '<option value="__propia">Mi máquina (editor)</option>';
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

  const vel = $('#in-velocidad');
  vel.value = cargar(CLAVE_VELOCIDAD) ?? 4;
  const mostrarVel = () => { $('#out-velocidad').textContent = vel.value; vel.setAttribute('aria-valuetext', `${vel.value} de 10`); };
  mostrarVel();
  vel.addEventListener('input', () => { mostrarVel(); guardar(CLAVE_VELOCIDAD, Number(vel.value)); });

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

function elegirPestana(id) {
  $('.sim-vistas').dataset.pestana = id;
  $('#tab-2d').setAttribute('aria-selected', String(id === '2d'));
  $('#tab-3d').setAttribute('aria-selected', String(id === '3d'));
  if (id === '3d') asegurar3D();
}

function asegurar3D() {
  if (!sim.vista3d) sim.vista3d = new Vista3D($('#lienzo-3d'));
  if (sim.m) sim.vista3d.mostrar(sim.m);
  sim.vista3d.redimensionar();
}

function retardo() { return RETARDOS[Number($('#in-velocidad').value) - 1]; }

function cargarEnSimulador(def, id = null) {
  pausar();
  sim.def = def;
  sim.idEjemplo = id;
  $('#t-sim').textContent = def.nombre;
  const ej = id && buscarEjemplo(id);
  $('#sim-descripcion').textContent = ej ? ej.descripcion : (def.descripcion || 'Máquina creada en el editor.');
  $('#sel-ejemplo').value = id && (ej || id === '__propia') ? id : '__propia';
  reiniciar();
}

function reiniciar() {
  pausar();
  const v = validar(sim.def);
  if (!v.valido) {
    sim.m = new MaquinaTuring(crearDefinicion({ ...sim.def, reglas: [] }), { entrada: sim.def.entrada });
    sim.m.motivo = 'invalida';
  } else sim.m = new MaquinaTuring(sim.def, { entrada: sim.def.entrada });
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
  if (sim.traza.length > 5000) sim.traza.splice(1, sim.traza.length - 5000);
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
  const copia = new MaquinaTuring(sim.def, { entrada: sim.def.entrada });
  const filas = [filaTraza(copia)];
  while (copia.pasos < sim.m.pasos && copia.paso()) filas.push(filaTraza(copia));
  return filas;
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
  $('#b-paso').disabled = fin || sim.corriendo;
  $('#b-atras').disabled = m.pasos === 0 || sim.corriendo;
  $('#b-ejecutar').disabled = fin || sim.corriendo;
  $('#b-pausa').disabled = !sim.corriendo;
}

function actualizar(opciones) {
  const m = sim.m;
  sim.vista2d.dibujar(m, opciones);
  $('#ind-estado').textContent = m.estado;
  $('#ind-pasos').textContent = m.pasos;
  $('#ind-lee').textContent = m.leer();
  const activa = m.reglaActual();
  $('#tabla-reglas tbody').innerHTML = filaReglas(sim.def.reglas, sim.invalida ? null : activa);
  const paradas = [...sim.def.finales, ...sim.def.acepta.map((q) => `${q} (acepta)`), ...sim.def.rechaza.map((q) => `${q} (rechaza)`)];
  $('#txt-paradas').textContent = paradas.join(', ') || 'ninguno';

  const msg = $('#sim-mensaje');
  msg.className = 'mensaje';
  if (sim.invalida) {
    msg.textContent = `La máquina tiene errores: ${sim.invalida[0].mensaje} Corrígela en el editor.`;
    msg.classList.add('rechazo');
  } else if (m.motivo === 'final') {
    msg.textContent = `✓ Terminó en ${m.estado} después de ${m.pasos} pasos. Resultado: ${m.resultado() || '(cinta vacía)'}`;
    msg.classList.add('fin');
  } else if (m.motivo === 'acepta') {
    msg.textContent = `✓ Acepta: la entrada «${m.entrada || 'vacía'}» es un palíndromo (${m.pasos} pasos).`;
    msg.classList.add('fin');
  } else if (m.motivo === 'rechaza') {
    msg.textContent = `✕ Rechaza la entrada «${m.entrada}» (${m.pasos} pasos).`;
    msg.classList.add('rechazo');
  } else if (m.motivo === 'sin-regla') {
    msg.textContent = `Se detuvo: no hay regla para el estado ${m.estado} leyendo «${m.leer()}».`;
    msg.classList.add('alerta');
  } else if (m.motivo === 'limite') {
    msg.textContent = `Se alcanzó el límite de ${m.limitePasos} pasos. Puede que esta máquina no pare nunca: en general no hay forma de saberlo (problema de la parada).`;
    msg.classList.add('alerta');
  } else {
    msg.textContent = `Próximo paso: ${textoRegla(m)}`;
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
function iniciarEjemplos() {
  $('#lista-ejemplos').innerHTML = EJEMPLOS.map((e) => `
    <article class="tarjeta ejemplo">
      <h2>${escapar(e.nombre)}</h2>
      <p>${escapar(e.resumen)}</p>
      <div class="datos">Entrada: ${escapar(e.entrada || '(cinta vacía)')} · ${e.reglas.length} reglas</div>
      <div class="botones">
        <a class="boton primario" href="#/simulador?ejemplo=${e.id}">Abrir en el simulador</a>
        <button class="boton texto" data-editar="${e.id}">Editar</button>
      </div>
    </article>`).join('');
  $('#lista-ejemplos').addEventListener('click', (ev) => {
    const id = ev.target.closest('[data-editar]')?.dataset.editar;
    if (!id) return;
    ponerEnEditor(crearDefinicion(buscarEjemplo(id)));
    location.hash = '#/editor';
  });
}

/* ---------- editor ---------- */
const ed = { def: null };

function definicionEditor() { return crearDefinicion(ed.def); }

function iniciarEditor() {
  const guardada = cargar(CLAVE_EDITOR);
  ed.def = guardada ? crearDefinicion(guardada) : crearDefinicion({ ...buscarEjemplo('sumar-uno'), nombre: 'Mi máquina' });
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
    if (!validar(d).valido) { aviso('Corrige los errores marcados en rojo antes de probarla.'); return; }
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
    aviso('Archivo JSON descargado.');
  });
  $('#ed-archivo').addEventListener('change', async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    try { ponerEnEditor(importarJSON(await f.text())); aviso(`Importado: ${f.name}`); } catch (e) { aviso(e.message); }
    ev.target.value = '';
  });
  $('#ed-compartir').addEventListener('click', async () => {
    const url = `${location.href.split('#')[0]}#/simulador?m=${codificar(definicionEditor())}`;
    try { await navigator.clipboard.writeText(url); aviso('Enlace copiado. Quien lo abra verá tu máquina en el simulador.'); } catch { prompt('Copia este enlace:', url); }
  });
  const selEj = $('#ed-ejemplo');
  selEj.innerHTML = '<option value="">Elige un ejemplo…</option>' + EJEMPLOS.map((e) => `<option value="${e.id}">${escapar(e.nombre)}</option>`).join('');
  selEj.addEventListener('change', () => {
    if (!selEj.value) return;
    ponerEnEditor(crearDefinicion(buscarEjemplo(selEj.value)));
    aviso('Ejemplo copiado al editor. Tus cambios no modifican el original.');
    selEj.value = '';
  });
  $('#ed-aplicar-texto').addEventListener('click', () => {
    const { reglas, errores } = parsearReglas($('#ed-texto').value);
    if (errores.length) { aviso(errores.map((e) => e.mensaje).join(' ')); return; }
    ed.def.reglas = reglas;
    cambioEditor(true);
    aviso(`${reglas.length} reglas aplicadas.`);
  });
  ponerEnEditor(ed.def);
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
        <td data-l="Estado"><input type="text" data-campo="estado" value="${escapar(r.estado)}" aria-label="Fila ${i + 1}: estado" spellcheck="false"></td>
        <td data-l="Lee"><input type="text" data-campo="lee" value="${escapar(r.lee)}" maxlength="1" aria-label="Fila ${i + 1}: lee" spellcheck="false"></td>
        <td data-l="Escribe"><input type="text" data-campo="escribe" value="${escapar(r.escribe)}" maxlength="1" aria-label="Fila ${i + 1}: escribe" spellcheck="false"></td>
        <td data-l="Mueve"><select data-campo="mueve" aria-label="Fila ${i + 1}: mueve">
          ${['I', 'D', 'N'].map((x) => `<option value="${x}" ${r.mueve === x ? 'selected' : ''}>${x} · ${{ I: 'izquierda', D: 'derecha', N: 'no se mueve' }[x]}</option>`).join('')}
        </select></td>
        <td data-l="Nuevo estado"><input type="text" data-campo="nuevo" value="${escapar(r.nuevo)}" aria-label="Fila ${i + 1}: nuevo estado" spellcheck="false"></td>
        <td><button class="borrar" aria-label="Borrar fila ${i + 1}" title="Borrar">×</button></td>
      </tr>`).join('');
  }
  const d = definicionEditor();
  const v = validar(d);
  const filasError = new Set(v.errores.map((e) => e.fila).filter(Boolean));
  document.querySelectorAll('#tabla-editor tbody tr').forEach((tr) => tr.classList.toggle('con-error', filasError.has(Number(tr.dataset.i) + 1)));
  const lista = [];
  if (v.valido) lista.push(`<p class="ok">✓ La máquina es válida: ${d.reglas.length} reglas, alfabeto {${v.alfabeto.map(escapar).join(', ')}}.</p>`);
  v.errores.forEach((e) => lista.push(`<p class="error">✕ ${escapar(e.mensaje)}</p>`));
  v.avisos.forEach((a) => lista.push(`<p class="aviso">! ${escapar(a.mensaje)}</p>`));
  $('#ed-validacion').innerHTML = lista.join('');
  if (document.activeElement !== $('#ed-texto')) $('#ed-texto').value = reglasATexto(d.reglas);
  guardar(CLAVE_EDITOR, JSON.parse(exportarJSON(d)));
}

/* ---------- aprende ---------- */
function iniciarAprende() {
  $('#indice-aprende').innerHTML = [...TEMAS.map((t) => [t.id, t.titulo]), ['linea', 'Línea de tiempo'], ['referencias', 'Referencias']]
    .map(([id, t]) => `<a href="#/aprende?tema=${id}">${escapar(t)}</a>`).join('');
  $('#contenido-aprende').innerHTML = TEMAS.map((t) => `
    <article class="tarjeta tema" id="tema-${t.id}">
      <div class="grid">
        <div><h2>${t.titulo}</h2>${t.html}
          <a class="boton primario" href="${t.prueba.ruta}">${t.prueba.texto}</a></div>
        <aside>${t.lado}</aside>
      </div>
    </article>`).join('') + `
    <article class="tarjeta tema" id="tema-linea">
      <h2>Línea de tiempo</h2>
      <ol class="linea-tiempo">${LINEA_TIEMPO.map(([a, h]) => `<li><b>${a}</b><span>${h}</span></li>`).join('')}</ol>
    </article>
    <article class="tarjeta tema" id="tema-referencias">
      <h2>Referencias</h2>
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
  const titulos = { inicio: 'Máquina de Turing', simulador: 'Simulador', ejemplos: 'Ejemplos', editor: 'Editor', aprende: 'Aprende', presentacion: 'Presentación' };
  document.title = `${titulos[ruta]} · Máquina de Turing`;

  if (ruta === 'simulador') {
    if (p.get('m')) {
      try { const d = decodificar(p.get('m')); ponerEnEditor(d); cargarEnSimulador(d, '__propia'); } catch { cargarEnSimulador(crearDefinicion(buscarEjemplo('sumar-uno')), 'sumar-uno'); }
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
  } else window.scrollTo(0, 0);
  if (ruta !== 'inicio') $('#contenido').focus({ preventScroll: true });
}

function iniciar() {
  iniciarSimulador();
  iniciarEjemplos();
  iniciarEditor();
  iniciarAprende();
  iniciarPresentacion();
  addEventListener('hashchange', navegar);
  addEventListener('resize', () => { if (rutaActual() === 'simulador' && matchMedia('(min-width: 761px)').matches) asegurar3D(); });
  navegar();
  // Trabajo sin conexión en la web publicada (no aplica al archivo único abierto desde el teléfono).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.ARCHIVO_UNICO) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

iniciar();
