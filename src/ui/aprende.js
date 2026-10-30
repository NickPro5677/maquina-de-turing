/** Contenido de la sección «Aprende». Cada tema tiene un botón «Pruébalo». */
export const TEMAS = [
  {
    id: 'que-es',
    titulo: '¿Qué es una máquina de Turing?',
    prueba: { texto: 'Pruébalo: sumar 1 en unario', ruta: '#/simulador?ejemplo=sumar-uno' },
    html: `
      <p>Es un <strong>modelo matemático de cálculo</strong>: una máquina imaginaria, muy sencilla, que sirve para definir con precisión qué significa «calcular».</p>
      <ul>
        <li><strong>Cinta</strong>: una tira dividida en casillas, ilimitada hacia ambos lados. Cada casilla tiene un símbolo o está en blanco (<code>_</code>).</li>
        <li><strong>Cabezal</strong>: está sobre una casilla; la lee, puede escribir en ella y se mueve una casilla a la izquierda (I), a la derecha (D) o no se mueve (N).</li>
        <li><strong>Estados</strong>: la máquina está en un solo estado a la vez, de una lista finita (q0, q1… y uno o más estados de parada).</li>
        <li><strong>Tabla de transiciones</strong>: el «programa». Cada regla dice: «si estoy en el estado q y leo s, escribo s′, me muevo y paso al estado q′».</li>
      </ul>
      <p>Funciona paso a paso y es <strong>determinista</strong>: con la misma entrada hace siempre lo mismo.</p>`,
    lado: `<div class="destacado"><strong>Ejemplo: sumar 1 en unario</strong>
      En unario, 3 se escribe 111. Dos reglas bastan:<br>
      <code>q0, 1 → 1, D, q0</code><br><code>q0, _ → 1, N, qF</code><br>
      111 se convierte en 1111 en 4 pasos.</div>`,
  },
  {
    id: 'turing-1936',
    titulo: 'Turing en 1936',
    prueba: { texto: 'Pruébalo: incrementador binario', ruta: '#/simulador?ejemplo=incrementar-binario' },
    html: `
      <p>En 1936 Alan Turing, con 24 años, escribió en Cambridge el artículo <em>«On Computable Numbers, with an Application to the Entscheidungsproblem»</em>. Se presentó a la London Mathematical Society en 1936 y se publicó en sus <em>Proceedings</em> (serie 2, volumen 42, 1936–1937).</p>
      <p>Quería responder al <strong>Entscheidungsproblem</strong> («problema de la decisión») planteado por David Hilbert y Wilhelm Ackermann en 1928: ¿existe un método mecánico que decida si cualquier enunciado de la lógica es demostrable? Para responder, primero definió qué es un «método mecánico»: lo que puede hacer una persona que calcula siguiendo reglas fijas con lápiz y papel. Esa idea es la máquina de Turing.</p>
      <p>Su respuesta fue <strong>no</strong>: ese método general no existe. Alonzo Church llegó a la misma conclusión casi al mismo tiempo con otro modelo, el cálculo lambda.</p>`,
    lado: `<div class="destacado"><strong>La idea clave</strong>Turing imaginó a una persona calculando y la redujo a lo mínimo: mirar una casilla, escribir, moverse y recordar en qué «estado» está.</div>`,
  },
  {
    id: 'universal',
    titulo: 'La máquina universal',
    prueba: { texto: 'Pruébalo: crea tu propia máquina', ruta: '#/editor' },
    html: `
      <p>En el mismo artículo de 1936 Turing describió una <strong>máquina universal</strong>: una sola máquina que lee en su cinta la descripción (la tabla de reglas) de <em>otra</em> máquina, junto con su entrada, y la imita paso a paso.</p>
      <p>Es la idea del <strong>computador de propósito general</strong> y del <strong>programa almacenado</strong>: no hace falta construir una máquina distinta para cada tarea; basta cambiar el programa. Esa idea pasó a la práctica en los años 40 con el informe EDVAC (1945), el diseño del ACE del propio Turing (1945–46) y la Manchester «Baby» (1948), el primer computador que ejecutó un programa guardado en su memoria.</p>
      <p>Este simulador es, en cierto modo, una máquina universal: recibe cualquier tabla de reglas y la ejecuta.</p>`,
    lado: `<div class="destacado"><strong>Hoy</strong>Tu teléfono es una versión física, con memoria finita, de la máquina universal: el mismo hardware ejecuta cualquier aplicación.</div>`,
  },
  {
    id: 'church-turing',
    titulo: 'La tesis de Church–Turing',
    prueba: { texto: 'Pruébalo: sumar dos números', ruta: '#/simulador?ejemplo=sumar-unarios' },
    html: `
      <p>La tesis dice: <strong>todo lo que se puede calcular mediante un procedimiento efectivo (un algoritmo) lo puede calcular una máquina de Turing</strong>.</p>
      <p>Es una <em>tesis</em> y no un teorema, porque «procedimiento efectivo» es una idea intuitiva que no se puede demostrar formalmente. Pero tiene un gran respaldo: todos los modelos propuestos (cálculo lambda de Church, funciones recursivas, máquinas de registros, lenguajes de programación) calculan exactamente lo mismo que una máquina de Turing.</p>
      <p>Por eso se dice que un lenguaje o sistema es <strong>Turing-completo</strong> cuando puede simular cualquier máquina de Turing (suponiendo memoria suficiente). C, Python o Java lo son.</p>`,
    lado: `<div class="destacado"><strong>¿Y la computación cuántica?</strong>Puede resolver algunos problemas mucho más rápido, pero no calcula nada que una máquina de Turing no pueda calcular en principio: cambia la eficiencia, no el límite.</div>`,
  },
  {
    id: 'parada',
    titulo: 'El problema de la parada',
    prueba: { texto: 'Pruébalo: un bucle sin fin', ruta: '#/simulador?ejemplo=bucle' },
    html: `
      <p>¿Se puede escribir un programa que, mirando <em>cualquier</em> máquina y su entrada, diga si se detendrá o seguirá para siempre? <strong>No.</strong> Ese problema es <strong>indecidible</strong>.</p>
      <p>La idea de la demostración: si existiera ese «detector», se podría construir una máquina que le pregunte al detector por sí misma y haga lo contrario de lo que él predice. Esa contradicción muestra que el detector no puede existir. Turing demostró en 1936 un resultado de este tipo; el nombre «problema de la parada» se popularizó después.</p>
      <p>Por eso este simulador usa un <strong>límite de pasos</strong>: si una máquina no para, no hay forma general de saberlo de antemano; solo podemos cortarla.</p>
      <p>Los <strong>castores atareados</strong> lo muestran de forma curiosa: la cantidad máxima de pasos que puede dar una máquina de n estados antes de parar crece tan rápido que no existe un algoritmo que la calcule para todo n. Con 2 estados son 6 pasos; con 3, 21; con 5, 47 176 870 (demostrado en 2024).</p>`,
    lado: `<div class="destacado"><strong>Pruébalo también</strong><a href="#/simulador?ejemplo=castor-3">Castor atareado de 3 estados</a>: 6 unos en 14 pasos sobre una cinta vacía.</div>`,
  },
  {
    id: 'importancia',
    titulo: 'Importancia hoy',
    prueba: { texto: 'Pruébalo: palíndromos', ruta: '#/simulador?ejemplo=palindromo' },
    html: `
      <ul>
        <li><strong>Fundó la teoría de la computación</strong>: la computabilidad (qué se puede calcular) y, más tarde, la complejidad (cuánto cuesta calcularlo).</li>
        <li><strong>Lenguajes y compiladores</strong>: un intérprete o compilador es una máquina universal: lee un programa y lo ejecuta o lo traduce.</li>
        <li><strong>Límites del software</strong>: la indecidibilidad explica por qué no existe un detector perfecto de errores o de bucles infinitos.</li>
        <li><strong>Inteligencia artificial</strong>: los modelos actuales corren en computadoras Turing-completas; en 1950 Turing propuso además la famosa «prueba de Turing».</li>
        <li><strong>Premio Turing</strong>: desde 1966 la ACM entrega este premio, considerado el «Nobel de la informática».</li>
      </ul>`,
    lado: `<div class="destacado"><strong>En una frase</strong>La máquina de Turing dice qué puede hacer cualquier computadora y, también, qué no podrá hacer nunca.</div>`,
  },
];

export const LINEA_TIEMPO = [
  ['1900', 'Hilbert presenta sus 23 problemas en París.'],
  ['1928', 'Hilbert y Ackermann plantean el Entscheidungsproblem.'],
  ['1931', 'Gödel publica sus teoremas de incompletitud.'],
  ['1936', 'Turing escribe «On Computable Numbers»: máquina de Turing y máquina universal. Church llega al mismo resultado con el cálculo lambda.'],
  ['1937–38', 'Doctorado de Turing en Princeton, dirigido por Church.'],
  ['1939–45', 'Bletchley Park: descifrado de Enigma; la Bombe (1940).'],
  ['1945–46', 'Informe EDVAC (von Neumann) y diseño del ACE de Turing.'],
  ['1948–49', 'Manchester «Baby» y Manchester Mark 1.'],
  ['1950', '«Computing Machinery and Intelligence»: la prueba de Turing.'],
  ['1954', 'Muere Alan Turing (7 de junio).'],
  ['1966', 'Primer Premio Turing de la ACM.'],
  ['2024', 'Se demuestra el valor del castor atareado de 5 estados.'],
];

export const REFERENCIAS = [
  ['Turing, A. M. (1937). On Computable Numbers, with an Application to the Entscheidungsproblem. Proceedings of the London Mathematical Society, s2-42(1), 230–265 (leído en 1936).', 'https://doi.org/10.1112/plms/s2-42.1.230'],
  ['De Mol, L. Turing Machines. Stanford Encyclopedia of Philosophy.', 'https://plato.stanford.edu/entries/turing-machine/'],
  ['Copeland, B. J. The Church-Turing Thesis. Stanford Encyclopedia of Philosophy.', 'https://plato.stanford.edu/entries/church-turing/'],
  ['Encyclopaedia Britannica. Turing machine.', 'https://www.britannica.com/technology/Turing-machine'],
  ['The Turing Digital Archive (King’s College, Cambridge).', 'https://turingarchive.kings.cam.ac.uk/'],
];
