# Cambios

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
