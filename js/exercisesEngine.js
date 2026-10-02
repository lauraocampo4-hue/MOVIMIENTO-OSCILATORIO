/**
 * EXERCISES ENGINE - SUITE DE 5 EJERCICIOS RESUELTOS INTERACTIVOS (SERWAY CAP. 15)
 * Con explicaciones paso a paso tipo profesor universitario, calculadoras en tiempo real,
 * diagramas dinámicos SVG y análisis conceptual de examen.
 * 
 * Autoras: Danna Arias y Laura Ocampo - Universidad Tecnológica de Pereira
 */

class SolvedExercisesManager {
  constructor() {
    this.initAll();
  }

  initAll() {
    this.initProblem43();
    this.initProblem44();
    this.initProblem45();
    this.initProblem46();
    this.initProblem47();
  }

  // =========================================================================
  // PROBLEMA 43: RODILLO DE JARDÍN CON RESORTE (RODADURA PURA + MAS)
  // =========================================================================
  initProblem43() {
    const sliderM = document.getElementById('p43SliderM');
    const sliderK = document.getElementById('p43SliderK');
    const sliderN = document.getElementById('p43SliderN');

    const update = () => {
      const M = sliderM ? parseFloat(sliderM.value) : 400;
      const k = sliderK ? parseFloat(sliderK.value) : 3500;
      const N = sliderN ? parseInt(sliderN.value, 10) : 10;

      const valM = document.getElementById('p43ValM');
      const valK = document.getElementById('p43ValK');
      const valN = document.getElementById('p43ValN');

      if (valM) valM.textContent = `${M} kg`;
      if (valK) valK.textContent = `${k} N/m`;
      if (valN) valN.textContent = `${N} pasadas`;

      // Inercia de cilindro macizo I = 1/2 M R^2.
      // E = 1/2 M v^2 + 1/2 (1/2 M R^2)(v/R)^2 + 1/2 k x^2 = 3/4 M v^2 + 1/2 k x^2.
      // dE/dt = (3/2 M a + k x) v = 0 => a = -(2k / 3M) x => omega = sqrt(2k / 3M).
      const omega = Math.sqrt((2 * k) / (3 * M));
      const T = (2 * Math.PI) / omega;
      const f = 1 / T;
      
      // Cada pasada completa por el centro de ida y vuelta es 1 ciclo T.
      // Si cada pasada se refiere a cruzar una sección (medio ciclo T/2), 10 pasadas = 5T.
      const tHalf = (N / 2) * T;
      const tFull = N * T;

      const resT = document.getElementById('p43ResT');
      const resOmega = document.getElementById('p43ResOmega');
      const resTime = document.getElementById('p43ResTime');

      if (resT) resT.textContent = `${T.toFixed(3)} s`;
      if (resOmega) resOmega.textContent = `${omega.toFixed(3)} rad/s`;
      if (resTime) resTime.textContent = `${tHalf.toFixed(2)} s (ó ${tFull.toFixed(2)} s en ciclos compl.)`;
    };

    if (sliderM) sliderM.addEventListener('input', update);
    if (sliderK) sliderK.addEventListener('input', update);
    if (sliderN) sliderN.addEventListener('input', update);
    update();
  }

  // =========================================================================
  // PROBLEMA 44: ¿POR QUÉ ES IMPOSIBLE? (OSCILADOR AMORTIGUADO PEQUEÑO)
  // =========================================================================
  initProblem44() {
    const sliderB = document.getElementById('p44SliderB');

    const update = () => {
      const bFactor = sliderB ? parseFloat(sliderB.value) : 1.0;
      const k = 10.0; // N/m
      const m = 0.001; // kg (1.00 g)
      const bBase = 0.120; // kg/s (para decaer a 25% en 23.1 ms)
      const b = bBase * bFactor;

      const bc = 2 * Math.sqrt(k * m); // bc = 2 * sqrt(0.01) = 0.200 kg/s
      const gamma = b / (2 * m);
      const omega0 = Math.sqrt(k / m); // 100 rad/s

      const valB = document.getElementById('p44ValB');
      const resBc = document.getElementById('p44ResBc');
      const resState = document.getElementById('p44ResState');
      const resExplanation = document.getElementById('p44ResExplanation');

      if (valB) valB.textContent = `${b.toFixed(3)} kg/s (${bFactor.toFixed(1)}× b₀)`;
      if (resBc) resBc.textContent = `${bc.toFixed(3)} kg/s`;

      if (resState && resExplanation) {
        if (b < bc) {
          const omegaPrime = Math.sqrt(omega0 * omega0 - gamma * gamma);
          resState.innerHTML = `<span class="seq-badge" style="background:#ecfdf5; color:#065f46; font-size:0.75rem;">✔ Subamortiguado (Oscila: ω' = ${omegaPrime.toFixed(1)} rad/s)</span>`;
          resExplanation.textContent = `El sistema experimenta oscilaciones con envolvente exponencial decreciente.`;
        } else if (Math.abs(b - bc) < 0.005) {
          resState.innerHTML = `<span class="seq-badge" style="background:#fef3c7; color:#92400e; font-size:0.75rem;">⚖ Amortiguamiento Crítico (b = bc)</span>`;
          resExplanation.textContent = `Retorno más rápido al equilibrio sin oscilar.`;
        } else {
          resState.innerHTML = `<span class="seq-badge" style="background:#fee2e2; color:#991b1b; font-size:0.75rem;">🚨 SOBREAMORTIGUADO (¡IMPOSIBLE QUE OSCILE!)</span>`;
          resExplanation.innerHTML = `<strong>¡Razón Física de la Imposibilidad!</strong> Al duplicar $b$ a $0.240\\text{ kg/s}$, $b > b_c = 0.200\\text{ kg/s}$. El discriminante de la EDO $(\\gamma^2 - \\omega_0^2 > 0)$ produce raíces reales puras. <strong>El objeto se frena exponencialmente y NUNCA cruza el equilibrio</strong>, haciendo imposible cumplir el objetivo de diseño de tener 'muchas oscilaciones'.`;
        }
      }

      this.drawDampingCanvas(b, bc, m, k);
    };

    if (sliderB) sliderB.addEventListener('input', update);
    update();
  }

  drawDampingCanvas(b, bc, m, k) {
    const canvas = document.getElementById('p44Canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1e1b2e';
    ctx.fillRect(0, 0, w, h);

    const midY = h / 2;
    // Eje central
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    const gamma = b / (2 * m);
    const omega0 = Math.sqrt(k / m);
    const isUnder = b < bc;

    ctx.beginPath();
    ctx.strokeStyle = isUnder ? '#38bdf8' : '#f43f5e';
    ctx.lineWidth = 2.2;

    const A0 = (h / 2) * 0.75;
    for (let px = 0; px < w; px++) {
      const t = (px / w) * 0.08; // 0 a 80 ms
      let x = 0;
      if (isUnder) {
        const omegaPrime = Math.sqrt(omega0 * omega0 - gamma * gamma);
        x = A0 * Math.exp(-gamma * t) * Math.cos(omegaPrime * t);
      } else {
        const r1 = -gamma + Math.sqrt(gamma * gamma - omega0 * omega0);
        const r2 = -gamma - Math.sqrt(gamma * gamma - omega0 * omega0);
        x = A0 * (0.5 * Math.exp(r1 * t) + 0.5 * Math.exp(r2 * t));
      }
      const py = midY - x;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Rótulo
    ctx.fillStyle = isUnder ? '#38bdf8' : '#f43f5e';
    ctx.font = 'bold 10px "JetBrains Mono"';
    ctx.fillText(isUnder ? 'x(t) con Oscilaciones' : 'x(t) Decaimiento sin Oscilación', 10, 18);
  }

  // =========================================================================
  // PROBLEMA 45: BLOQUE CON DOS RESORTES (PARALELO Y SERIE)
  // =========================================================================
  initProblem45() {
    const sliderK1 = document.getElementById('p45SliderK1');
    const sliderK2 = document.getElementById('p45SliderK2');
    const sliderM = document.getElementById('p45SliderM');

    const update = () => {
      const k1 = sliderK1 ? parseFloat(sliderK1.value) : 200;
      const k2 = sliderK2 ? parseFloat(sliderK2.value) : 300;
      const m = sliderM ? parseFloat(sliderM.value) : 1.0;

      const valK1 = document.getElementById('p45ValK1');
      const valK2 = document.getElementById('p45ValK2');
      const valM = document.getElementById('p45ValM');

      if (valK1) valK1.textContent = `${k1} N/m`;
      if (valK2) valK2.textContent = `${k2} N/m`;
      if (valM) valM.textContent = `${m.toFixed(1)} kg`;

      // Caso (a): Paralelo / Opuestos -> keq = k1 + k2
      const keqA = k1 + k2;
      const Ta = 2 * Math.PI * Math.sqrt(m / keqA);

      // Caso (b): Serie -> keq = (k1 * k2) / (k1 + k2)
      const keqB = (k1 * k2) / (k1 + k2);
      const Tb = 2 * Math.PI * Math.sqrt(m / keqB);

      const ratio = Tb / Ta;

      const resKeqA = document.getElementById('p45ResKeqA');
      const resTa = document.getElementById('p45ResTa');
      const resKeqB = document.getElementById('p45ResKeqB');
      const resTb = document.getElementById('p45ResTb');
      const resRatio = document.getElementById('p45ResRatio');

      if (resKeqA) resKeqA.textContent = `${keqA.toFixed(1)} N/m`;
      if (resTa) resTa.textContent = `${Ta.toFixed(3)} s`;
      if (resKeqB) resKeqB.textContent = `${keqB.toFixed(1)} N/m`;
      if (resTb) resTb.textContent = `${Tb.toFixed(3)} s`;
      if (resRatio) resRatio.textContent = `${ratio.toFixed(2)}× más lento en serie`;
    };

    if (sliderK1) sliderK1.addEventListener('input', update);
    if (sliderK2) sliderK2.addEventListener('input', update);
    if (sliderM) sliderM.addEventListener('input', update);
    update();
  }

  // =========================================================================
  // PROBLEMA 46: GLOBO DE HELIO (PÉNDULO SIMPLE INVERTIDO)
  // =========================================================================
  initProblem46() {
    const sliderL = document.getElementById('p46SliderL');
    const sliderRhoHe = document.getElementById('p46SliderRhoHe');

    const update = () => {
      const L = sliderL ? parseFloat(sliderL.value) : 3.00;
      const rhoHe = sliderRhoHe ? parseFloat(sliderRhoHe.value) : 0.179;
      const rhoAir = 1.20;
      const g = 9.80;

      const valL = document.getElementById('p46ValL');
      const valRhoHe = document.getElementById('p46ValRhoHe');

      if (valL) valL.textContent = `${L.toFixed(2)} m`;
      if (valRhoHe) valRhoHe.textContent = `${rhoHe.toFixed(3)} kg/m³`;

      // Demostración:
      // Fuerza neta vertical = (rho_air - rho_He) * V * g.
      // Torque = -(rho_air - rho_He) * V * g * L * sin(theta) ~ -(rho_air - rho_He) V g L theta.
      // I = m L^2 = (rho_He * V) * L^2.
      // I * d2theta/dt2 + torque_restaurador = 0
      // d2theta/dt2 + [ (rho_air - rho_He) * g / (rho_He * L) ] theta = 0.
      const omega = Math.sqrt(((rhoAir - rhoHe) * g) / (rhoHe * L));
      const T = 2 * Math.PI / omega;
      const f = 1 / T;
      const TNormal = 2 * Math.PI * Math.sqrt(L / g);

      const resOmega = document.getElementById('p46ResOmega');
      const resT = document.getElementById('p46ResT');
      const resComp = document.getElementById('p46ResComp');

      if (resOmega) resOmega.textContent = `${omega.toFixed(3)} rad/s`;
      if (resT) resT.textContent = `${T.toFixed(3)} s`;
      if (resComp) resComp.textContent = `(vs ${TNormal.toFixed(3)} s de péndulo regular sin empuje)`;
    };

    if (sliderL) sliderL.addEventListener('input', update);
    if (sliderRhoHe) sliderRhoHe.addEventListener('input', update);
    update();
  }

  // =========================================================================
  // PROBLEMA 47: PARTÍCULA CON RESORTE Y V_MAX HACIA LA IZQUIERDA
  // =========================================================================
  initProblem47() {
    const sliderM = document.getElementById('p47SliderM');
    const sliderK = document.getElementById('p47SliderK');
    const sliderV = document.getElementById('p47SliderV');

    const update = () => {
      const m = sliderM ? parseFloat(sliderM.value) : 0.500;
      const k = sliderK ? parseFloat(sliderK.value) : 50.0;
      const vmax = sliderV ? parseFloat(sliderV.value) : 20.0;

      const valM = document.getElementById('p47ValM');
      const valK = document.getElementById('p47ValK');
      const valV = document.getElementById('p47ValV');

      if (valM) valM.textContent = `${m.toFixed(3)} kg`;
      if (valK) valK.textContent = `${k.toFixed(1)} N/m`;
      if (valV) valV.textContent = `${vmax.toFixed(1)} m/s`;

      const omega = Math.sqrt(k / m); // 10.0 rad/s
      const A = vmax / omega; // 2.00 m
      const T = (2 * Math.PI) / omega;
      
      // (b) Ep = 3 Ek -> 1/2 k x^2 = 3/4 (1/2 k A^2) -> x = sqrt(3)/2 * A
      const xEp3Ek = (Math.sqrt(3) / 2) * A;

      // (c) t de x=0 a x=1.00 m:
      // x(t) = -A sin(omega t) ó en magnitud x(t') = A sin(omega t') = 1.00
      // sin(omega t') = 1.00 / A -> t' = arcsin(1.00 / A) / omega
      const tMin = (Math.asin(1.00 / A) / omega);

      // (d) Péndulo con mismo periodo: omega^2 = g / L -> L = g / omega^2
      const Lpend = 9.80 / (omega * omega);

      const resEq = document.getElementById('p47ResEq');
      const resXEp = document.getElementById('p47ResXEp');
      const resTMin = document.getElementById('p47ResTMin');
      const resLpend = document.getElementById('p47ResLpend');

      if (resEq) resEq.textContent = `x(t) = -${A.toFixed(2)}·sen(${omega.toFixed(1)}t) m`;
      if (resXEp) resXEp.textContent = `±${xEp3Ek.toFixed(3)} m (±√3 m)`;
      if (resTMin) resTMin.textContent = `${(tMin * 1000).toFixed(1)} ms (${tMin.toFixed(4)} s)`;
      if (resLpend) resLpend.textContent = `${(Lpend * 100).toFixed(2)} cm (${Lpend.toFixed(4)} m)`;
    };

    if (sliderM) sliderM.addEventListener('input', update);
    if (sliderK) sliderK.addEventListener('input', update);
    if (sliderV) sliderV.addEventListener('input', update);
    update();
  }
}

window.SolvedExercisesManager = SolvedExercisesManager;

document.addEventListener('DOMContentLoaded', () => {
  if (!window.solvedExercisesApp) {
    window.solvedExercisesApp = new SolvedExercisesManager();
  }
});
