# Three.js (incluido en el repo)

- Versión: **r170** (paquete npm `three@0.170.0`), licencia MIT (ver `LICENSE`).
- `three.module.min.js`: copia sin cambios de `build/three.module.min.js`.
- `addons/OrbitControls.js`: copia de `examples/jsm/controls/OrbitControls.js`; solo se cambió la
  línea `from 'three'` por `from '../three.module.min.js'` para que funcione sin «import map» y sin internet.
