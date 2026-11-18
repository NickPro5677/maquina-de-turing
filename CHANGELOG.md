# Cambios

## v1.2.0 · 2026-11-18

- Traza con cintas largas: cada fila guarda solo 30 casillas a cada lado del cabezal. Si hay más, se ve «…». Las cintas cortas se ven igual que antes y el paso atrás sigue funcionando. Con 5000 unos, armar la traza bajó de unos 1,03 s a unos 21 ms (el motor sigue en unos 4 ms).
- Vista 3D: las casillas se reutilizan (solo las que se ven) y, al reiniciar o cambiar de máquina, se liberan las geometrías y los materiales.
- Botón **Correr hasta el final** y un campo para el límite de pasos (antes fijo en 10 000). Acepta un entero entre 1 y 1 000 000, en español y en inglés.

## v1.2.0 · 2026-11-18 (English)

- Long-tape trace rows keep only 30 cells on each side of the head (`…` marks the rest). Short tapes look the same. Tracing 5000 ones dropped from about 1.03 s to about 21 ms.
- The 3D tape reuses a pool of the visible cells and frees geometries and materials when you reset or switch machines.
- **Run to the end** button and an editable step limit (a whole number from 1 to 1 000 000).

## v1.1.0 · 2026-10-30

- Compartir: la máquina va dentro del enlace (`#/simulador?m=…`) y se abre al entrar. Botón **Compartir** en el simulador y el editor; en el teléfono usa el menú de compartir. Un enlace dañado muestra un aviso y abre el ejemplo principal.
- Máquinas guardadas: guarda varias con nombre en el dispositivo, ábrelas o bórralas. Exportar a `.json` e importar con validación del esquema.
- 3 ejemplos nuevos: copiar una cadena, paridad y doblar un binario (11 en total).
- Sección **Ejercicios**: 5 retos con objetivo, casos que se comprueban solos con límite de pasos, pistas en orden y solución.
- Modo oscuro: sigue al sistema, con botón para cambiarlo. 2D y 3D adaptados; sin errores graves de accesibilidad en los dos temas.
- Inglés: interfaz, teoría, ejemplos y mensajes del motor en español e inglés (en inglés los movimientos son L/R/S). README en inglés.
- Pruebas nuevas: enlaces, importación, ejercicios, máquinas guardadas y paridad de traducciones.

## v1.1.0 · 2026-10-30 (English)

- Share links carry the machine; Share button (system share sheet on phones); broken links show a notice.
- Saved machines library, JSON export and validated import.
- 3 new examples (copy, parity, binary double) and an Exercises section with auto-checked tests, hints and solutions.
- Dark mode (system + toggle) for 2D and 3D; English UI and theory texts.

## v1.0.1 · 2026-10-30

- Móvil: el menú superior se muestra en dos filas y ya no se desplaza de lado.
- Móvil: cada regla del editor se muestra como una tarjeta; la tabla ya no se desplaza de lado.
- Accesibilidad: mejor contraste en la cinta y en las pestañas 2D/3D, etiquetas de los campos legibles por lectores de pantalla y tablas desplazables que se pueden enfocar con el teclado.
- Sin internet: el service worker ahora busca primero la versión nueva y usa la copia guardada solo si no hay conexión, así las mejoras llegan sin borrar datos.
- README: insignias de CI, Pages y licencia; capturas actualizadas.

## v1.0.0 · 2026-10-30

Primera versión.

- Motor de la máquina de Turing en JavaScript puro (`src/motor/`): paso, paso atrás, ejecutar, detección de parada, límite de pasos, validador de reglas y JSON.
- Simulador con vista 2D (cinta, cabezal, estado, tabla de transiciones con la regla activa y traza paso a paso).
- Vista 3D con Three.js: brazo que baja, lee y escribe, y cinta que se desliza. Se puede girar con el dedo o el ratón.
- 8 ejemplos: sumar 1 en unario, invertir bits, sumar dos números unarios, incrementador binario, palíndromo, castores atareados de 2 y 3 estados, y un bucle sin fin.
- Editor de reglas con validación en vivo, guardado local, JSON y enlace para compartir.
- Sección «Aprende» con historia, máquina universal, tesis de Church–Turing, problema de la parada, línea de tiempo y referencias.
- Modo presentación para proyector y control remoto (Av Pág / Re Pág).
- Funciona sin internet: service worker en la web y archivo único `maquina-turing.html`.
- 58 pruebas con `node --test`; CI y publicación en GitHub Pages con GitHub Actions.
