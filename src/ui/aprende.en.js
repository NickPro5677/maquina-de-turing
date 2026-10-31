/** English content for the “Learn” section (same structure as aprende.js). */
export const TEMAS_EN = [
  {
    id: 'que-es',
    titulo: 'What is a Turing machine?',
    prueba: { texto: 'Try it: add 1 in unary', ruta: '#/simulador?ejemplo=sumar-uno' },
    html: `
      <p>It is a <strong>mathematical model of computation</strong>: an imaginary, very simple machine used to define precisely what “to compute” means.</p>
      <ul>
        <li><strong>Tape</strong>: a strip divided into cells, unlimited in both directions. Each cell holds a symbol or is blank (<code>_</code>).</li>
        <li><strong>Head</strong>: it sits over one cell; it reads it, can write on it and moves one cell left (L), right (R) or stays (S).</li>
        <li><strong>States</strong>: the machine is in exactly one state at a time, from a finite list (q0, q1… and one or more halting states).</li>
        <li><strong>Transition table</strong>: the “program”. Each rule says: “if I am in state q and read s, I write s′, move and go to state q′”.</li>
      </ul>
      <p>It works step by step and is <strong>deterministic</strong>: with the same input it always does the same thing.</p>`,
    lado: `<div class="destacado"><strong>Example: add 1 in unary</strong>
      In unary, 3 is written 111. Two rules are enough:<br>
      <code>q0, 1 → 1, R, q0</code><br><code>q0, _ → 1, S, qF</code><br>
      111 becomes 1111 in 4 steps.</div>`,
  },
  {
    id: 'turing-1936',
    titulo: 'Turing in 1936',
    prueba: { texto: 'Try it: binary increment', ruta: '#/simulador?ejemplo=incrementar-binario' },
    html: `
      <p>In 1936 Alan Turing, aged 24, wrote in Cambridge the paper <em>“On Computable Numbers, with an Application to the Entscheidungsproblem”</em>. It was presented to the London Mathematical Society in 1936 and published in its <em>Proceedings</em> (series 2, volume 42, 1936–1937).</p>
      <p>He wanted to answer the <strong>Entscheidungsproblem</strong> (“decision problem”) posed by David Hilbert and Wilhelm Ackermann in 1928: is there a mechanical method that decides whether any statement of logic is provable? To answer, he first defined what a “mechanical method” is: what a person can do calculating with fixed rules, pencil and paper. That idea is the Turing machine.</p>
      <p>His answer was <strong>no</strong>: such a general method does not exist. Alonzo Church reached the same conclusion almost at the same time with another model, the lambda calculus.</p>`,
    lado: `<div class="destacado"><strong>The key idea</strong>Turing imagined a person calculating and reduced it to the minimum: look at one cell, write, move and remember which “state” they are in.</div>`,
  },
  {
    id: 'universal',
    titulo: 'The universal machine',
    prueba: { texto: 'Try it: build your own machine', ruta: '#/editor' },
    html: `
      <p>In the same 1936 paper Turing described a <strong>universal machine</strong>: a single machine that reads on its tape the description (the rule table) of <em>another</em> machine, together with its input, and imitates it step by step.</p>
      <p>It is the idea of the <strong>general-purpose computer</strong> and the <strong>stored program</strong>: you do not need to build a different machine for each task; you just change the program. The idea became practice in the 1940s with the EDVAC report (1945), Turing’s own ACE design (1945–46) and the Manchester “Baby” (1948), the first computer to run a program stored in its memory.</p>
      <p>This simulator is, in a way, a universal machine: it takes any rule table and runs it.</p>`,
    lado: `<div class="destacado"><strong>Today</strong>Your phone is a physical version, with finite memory, of the universal machine: the same hardware runs any app.</div>`,
  },
  {
    id: 'church-turing',
    titulo: 'The Church–Turing thesis',
    prueba: { texto: 'Try it: add two numbers', ruta: '#/simulador?ejemplo=sumar-unarios' },
    html: `
      <p>The thesis says: <strong>everything that can be computed by an effective procedure (an algorithm) can be computed by a Turing machine</strong>.</p>
      <p>It is a <em>thesis</em> and not a theorem, because “effective procedure” is an intuitive idea that cannot be formally proved. But it has strong support: every model proposed (Church’s lambda calculus, recursive functions, register machines, programming languages) computes exactly the same as a Turing machine.</p>
      <p>That is why a language or system is called <strong>Turing-complete</strong> when it can simulate any Turing machine (given enough memory). C, Python and Java are.</p>`,
    lado: `<div class="destacado"><strong>What about quantum computing?</strong>It can solve some problems much faster, but it computes nothing a Turing machine cannot compute in principle: it changes efficiency, not the limit.</div>`,
  },
  {
    id: 'parada',
    titulo: 'The halting problem',
    prueba: { texto: 'Try it: an endless loop', ruta: '#/simulador?ejemplo=bucle' },
    html: `
      <p>Can you write a program that, looking at <em>any</em> machine and its input, says whether it will halt or run forever? <strong>No.</strong> That problem is <strong>undecidable</strong>.</p>
      <p>The idea of the proof: if such a “detector” existed, you could build a machine that asks the detector about itself and does the opposite of what it predicts. That contradiction shows the detector cannot exist. Turing proved a result of this kind in 1936; the name “halting problem” became popular later.</p>
      <p>That is why this simulator uses a <strong>step limit</strong>: if a machine does not halt, there is no general way to know in advance; we can only stop it.</p>
      <p>The <strong>busy beavers</strong> show it in a curious way: the maximum number of steps an n-state machine can take before halting grows so fast that no algorithm can compute it for every n. With 2 states it is 6 steps; with 3, 21; with 5, 47,176,870 (proved in 2024).</p>`,
    lado: `<div class="destacado"><strong>Try this too</strong><a href="#/simulador?ejemplo=castor-3">3-state busy beaver</a>: 6 ones in 14 steps on an empty tape.</div>`,
  },
  {
    id: 'importancia',
    titulo: 'Why it matters today',
    prueba: { texto: 'Try it: palindromes', ruta: '#/simulador?ejemplo=palindromo' },
    html: `
      <ul>
        <li><strong>It founded the theory of computation</strong>: computability (what can be computed) and, later, complexity (how much it costs to compute).</li>
        <li><strong>Languages and compilers</strong>: an interpreter or compiler is a universal machine: it reads a program and runs or translates it.</li>
        <li><strong>Limits of software</strong>: undecidability explains why there is no perfect detector of bugs or infinite loops.</li>
        <li><strong>Artificial intelligence</strong>: today’s models run on Turing-complete computers; in 1950 Turing also proposed the famous “Turing test”.</li>
        <li><strong>Turing Award</strong>: since 1966 the ACM gives this award, considered the “Nobel Prize of computing”.</li>
      </ul>`,
    lado: `<div class="destacado"><strong>In one sentence</strong>The Turing machine tells us what any computer can do and also what it will never be able to do.</div>`,
  },
];

export const LINEA_TIEMPO_EN = [
  ['1900', 'Hilbert presents his 23 problems in Paris.'],
  ['1928', 'Hilbert and Ackermann pose the Entscheidungsproblem.'],
  ['1931', 'Gödel publishes his incompleteness theorems.'],
  ['1936', 'Turing writes “On Computable Numbers”: Turing machine and universal machine. Church reaches the same result with the lambda calculus.'],
  ['1937–38', 'Turing’s PhD at Princeton, supervised by Church.'],
  ['1939–45', 'Bletchley Park: breaking Enigma; the Bombe (1940).'],
  ['1945–46', 'EDVAC report (von Neumann) and Turing’s ACE design.'],
  ['1948–49', 'Manchester “Baby” and Manchester Mark 1.'],
  ['1950', '“Computing Machinery and Intelligence”: the Turing test.'],
  ['1954', 'Alan Turing dies (7 June).'],
  ['1966', 'First ACM Turing Award.'],
  ['2024', 'The value of the 5-state busy beaver is proved.'],
];
