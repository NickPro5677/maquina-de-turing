# El motor

`src/motor/maquina.js` contiene toda la lógica. No usa el DOM: se puede usar en el navegador o en Node.

## Definición de una máquina

```js
import { crearDefinicion } from './src/motor/index.js';

const def = crearDefinicion({
  nombre: 'Sumar 1 en unario',
  inicial: 'q0',
  finales: ['qF'],          // paran con «resultado»
  acepta: [],               // paran aceptando (opcional)
  rechaza: [],              // paran rechazando (opcional)
  blanco: '_',
  entrada: '111',
  cabezal: 0,               // casilla inicial del cabezal
  reglas: [
    ['q0', '1', '1', 'D', 'q0'],
    ['q0', '_', '1', 'N', 'qF'],
  ],
});
```

Movimientos: `I` (izquierda), `D` (derecha), `N` (no se mueve). También se aceptan `L`, `R`, `S`, `<`, `>`, `-` y `—`.

## Ejecutar

```js
import { MaquinaTuring } from './src/motor/index.js';

const m = new MaquinaTuring(def);
m.paso();          // da un paso y devuelve la regla aplicada (o null)
m.pasoAtras();     // deshace el último paso
m.ejecutar();      // corre hasta parar o hasta el límite
m.resultado();     // '1111'
m.estado;          // 'qF'
m.pasos;           // 4
m.motivo;          // 'final' | 'acepta' | 'rechaza' | 'sin-regla' | 'limite' | null
```

- **Cinta**: un `Map` posición → símbolo. Las casillas en blanco no se guardan, así que la cinta es ilimitada hacia ambos lados (posiciones negativas incluidas).
- **Paso atrás**: antes de cada paso se guarda la posición, el símbolo anterior, el estado y la regla. Deshacer es restaurar eso.
- **Parada**: al entrar en un estado final, de aceptación o de rechazo; o si no hay regla para *(estado, símbolo)*.
- **Límite de pasos**: 10 000 por defecto (`new MaquinaTuring(def, { limitePasos: 500 })`). Al llegar, `motivo` es `'limite'`. `fijarLimite(n)` lo cambia sin reiniciar la cinta. `interpretarLimitePasos(texto)` acepta un entero entre 1 y 1 000 000.

## Validar

`validar(def)` devuelve `{ valido, errores, avisos, alfabeto }`.

Errores (impiden ejecutar): reglas duplicadas para el mismo *(estado, símbolo)*, estados desconocidos (un «nuevo estado» sin reglas que no es final), estado inicial sin reglas, movimientos no válidos, símbolos de más de un carácter y campos vacíos.

Avisos: combinaciones *(estado, símbolo)* sin regla, símbolos de la entrada que ninguna regla usa, reglas en estados finales y máquinas sin estados finales.

## Traza, texto y JSON

- `traza(def, entrada)`: la tabla paso a paso, como en el ejemplo del README. `cintaTraza(m)` muestra la cinta con el cabezal entre corchetes. Si tiene más de 61 casillas, solo guarda 30 a cada lado y pone `…` donde hay más. Las cintas cortas se ven enteras.
- `parsearReglas(texto)` / `reglasATexto(reglas)`: reglas como texto `q0, 1 -> 1, D, q0`.
- `exportarJSON(def)` / `importarJSON(texto)`: guardar y cargar máquinas.

## Datos verificados por las pruebas

| Ejemplo | Entrada | Salida | Pasos |
|---|---|---|---|
| Sumar 1 en unario | 111 | 1111 | 4 |
| Invertir bits | 1011 | 0100 | 5 |
| Sumar unarios | 11+111 | 11111 | 8 |
| Incrementador binario | 1011 | 1100 | 8 |
| Palíndromo | 0110 | acepta | 15 |
| Castor atareado, 2 estados | vacía | 4 unos | 6 |
| Castor atareado, 3 estados | vacía | 6 unos | 14 |

Para 3 estados, el máximo de **unos** es 6 (Σ(3) = 6) y el máximo de **pasos** es 21 (S(3) = 21), pero los consiguen máquinas distintas; la de 21 pasos deja 5 unos. Ambas están en las pruebas.
