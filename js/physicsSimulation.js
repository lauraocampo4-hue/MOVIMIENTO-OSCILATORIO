/**
 * PHYSICS SIMULATION - SUITE DE 4 SIMULACIONES INTERACTIVAS PREMIUM
 * 
 * Requerimiento 19:
 * 1. Simulación 1 — Masa-resorte: masa, resorte, pos equilibrio, elongación, velocidad, aceleración,
 *    controles m, k, A, play/pause/reset, x(t), v(t), a(t) y T = 2π√(m/k).
 * 2. Simulación 2 — MAS: partícula oscilando con osciloscopio en vivo de posición, velocidad y aceleración.
 * 3. Simulación 3 — Círculo fasorial: MCU proyectado sobre MAS, ángulo θ, radio A, proyección, coseno.
 * 4. Simulación 4 — Péndulo simple: oscilación, control de longitud L, período T = 2π√(L/g).
 * 
 * Autoras: Danna Arias y Laura Ocampo - Universidad Tecnológica de Pereira
 */

class PhysicsOscillatorSimulation {
  constructor(canvasId1, canvasId2) {
    this.canvas1 = document.getElementById(canvasId1);
    this.canvas2 = document.getElementById(canvasId2);
    if (!this.canvas1 || !this.canvas2) return;

    this.ctx1 = this.canvas1.getContext('2d');
    this.ctx2 = this.canvas2.getContext('2d');

    // Modo activo: 'spring-phasor' (1 y 3) o 'oscilloscope' (2) o 'pendulum' (4)
    this.activeMode = 'spring-phasor';

    // Parámetros físicos Masa-Resorte / MAS
    this.m = 1.0;      // kg
    this.k = 9.0;      // N/m
    this.A = 1.2;      // m
    this.phi = 0.0;    // rad
    this.time = 0.0;
    this.isPlaying = true;

    // Parámetros Péndulo
    this.pendulumLength = 1.5; // metros
    this.pendulumG = 9.806;     // m/s²
    this.pendulumTheta0 = 0.35; // radianes (~20°)

    // Historial osciloscopio
    this.history = [];
    this.maxHistory = 220;

    this.setupDPI();
    this.lastTimestamp = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupDPI() {
    [this.canvas1, this.canvas2].forEach(c => {
      if (!c) return;
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = (rect.width || 340) * dpr;
      c.height = (rect.height || 210) * dpr;
      c.getContext('2d').scale(dpr, dpr);
    });
  }

  setMode(mode) {
    this.activeMode = mode;
    this.history = [];
    this.setupDPI();
  }

  getOmega() {
    return Math.sqrt(this.k / this.m);
  }

  getPeriod() {
    return (2 * Math.PI) / this.getOmega();
  }

  getPendulumPeriod() {
    return 2 * Math.PI * Math.sqrt(this.pendulumLength / this.pendulumG);
  }

  getPendulumOmega() {
    return Math.sqrt(this.pendulumG / this.pendulumLength);
  }

  getCurrentState() {
    const omega = this.getOmega();
    const theta = omega * this.time + this.phi;
    const x = this.A * Math.cos(theta);
    const v = -this.A * omega * Math.sin(theta);
    const a = -omega * omega * x;
    const Ek = 0.5 * this.m * v * v;
    const Ep = 0.5 * this.k * x * x;
    const Em = Ek + Ep;

    return { x, v, a, theta, omega, Ek, Ep, Em, T: this.getPeriod() };
  }

  // Dibujar resorte helicoidal realista
  drawSpring(ctx, startX, startY, endX, endY, coils = 13, radius = 15) {
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const leadIn = 18;
    const leadOut = 18;
    const activeLength = length - leadIn - leadOut;

    ctx.moveTo(0, 0);
    ctx.lineTo(leadIn, 0);

    const step = activeLength / coils;
    for (let i = 0; i < coils; i++) {
      const cx1 = leadIn + i * step + step * 0.25;
      const cy1 = -radius;
      const cx2 = leadIn + i * step + step * 0.75;
      const cy2 = radius;
      ctx.lineTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
    }

    ctx.lineTo(length - leadOut, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.restore();
  }

  // SIMULACIÓN 1: Masa-Resorte
  renderSpringCanvas(state) {
    const ctx = this.ctx1;
    const rect = this.canvas1.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fbf8fc';
    ctx.fillRect(0, 0, w, h);

    const tableY = h - 42;
    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.moveTo(0, tableY);
    ctx.lineTo(w, tableY);
    ctx.stroke();

    // Pared fija
    const wallX = 32;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(wallX - 12, 18, 12, tableY - 18);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallX - 12, 18, 12, tableY - 18);

    const eqX = w / 2 + 10;
    const pxPerM = 52;
    const massX = eqX + state.x * pxPerM;
    const massSize = 42;
    const massY = tableY - massSize;

    // Línea de equilibrio
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(139, 79, 140, 0.45)';
    ctx.moveTo(eqX, 15);
    ctx.lineTo(eqX, tableY);
    ctx.stroke();
    ctx.fillStyle = '#8b4f8c';
    ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('x = 0 (Equilibrio)', eqX, tableY + 20);
    ctx.restore();

    // Resorte
    this.drawSpring(ctx, wallX, massY + massSize / 2, massX, massY + massSize / 2);

    // Bloque de masa
    const grad = ctx.createLinearGradient(massX, massY, massX + massSize, massY + massSize);
    grad.addColorStop(0, '#ab6fb0');
    grad.addColorStop(1, '#5a255c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(massX, massY, massSize, massSize, 7);
    ctx.fill();
    ctx.strokeStyle = '#431946';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Outfit"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.m.toFixed(1)} kg`, massX + massSize / 2, massY + massSize / 2);

    // Vectores cinemáticos
    const vX = massX + massSize / 2;
    const vY = massY - 10;
    const vLen = state.v * 11;

    // Vector v (verde)
    if (Math.abs(vLen) > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2.8;
      ctx.moveTo(vX, vY);
      ctx.lineTo(vX + vLen, vY);
      ctx.stroke();

      const dir = Math.sign(vLen);
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.moveTo(vX + vLen, vY);
      ctx.lineTo(vX + vLen - dir * 6, vY - 4);
      ctx.lineTo(vX + vLen - dir * 6, vY + 4);
      ctx.fill();
    }

    // Vector a (rojo)
    const aLen = state.a * 4.5;
    const aY = vY - 14;
    if (Math.abs(aLen) > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.4;
      ctx.moveTo(vX, aY);
      ctx.lineTo(vX + aLen, aY);
      ctx.stroke();

      const dirA = Math.sign(aLen);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(vX + aLen, aY);
      ctx.lineTo(vX + aLen - dirA * 6, aY - 4);
      ctx.lineTo(vX + aLen - dirA * 6, aY + 4);
      ctx.fill();
    }
  }

  // SIMULACIÓN 3: Círculo Fasorial (MCU -> MAS)
  renderPhasorCanvas(state) {
    const ctx = this.ctx2;
    const rect = this.canvas2.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#faf6fb';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.36;

    // Ejes cartesianos
    ctx.beginPath();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.moveTo(cx - radius - 18, cy);
    ctx.lineTo(cx + radius + 18, cy);
    ctx.moveTo(cx, cy - radius - 18);
    ctx.lineTo(cx, cy + radius + 18);
    ctx.stroke();

    // Círculo
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139, 79, 140, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const tipX = cx + radius * Math.cos(state.theta);
    const tipY = cy - radius * Math.sin(state.theta);

    // Fasor rotatorio (vector lila)
    ctx.beginPath();
    ctx.strokeStyle = '#8b4f8c';
    ctx.lineWidth = 3;
    ctx.moveTo(cx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Punto fasorial
    ctx.fillStyle = '#6b21a8';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Proyección sobre el eje X
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.setLineDash([4, 3]);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX, cy);
    ctx.stroke();

    // Partícula del MAS en el eje X
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(tipX, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ángulo theta
    ctx.fillStyle = '#4a2153';
    ctx.font = 'bold 10px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(`θ = ${(state.theta % (2 * Math.PI)).toFixed(2)} rad | x = A·cos(θ)`, cx, cy + radius + 22);
  }

  // SIMULACIÓN 2: MAS con Osciloscopio Multitrace x(t), v(t), a(t)
  renderOscilloscope(state) {
    // Canvas 1: Partícula oscilando en 1D
    const ctx1 = this.ctx1;
    const rect1 = this.canvas1.getBoundingClientRect();
    const w1 = rect1.width;
    const h1 = rect1.height;

    ctx1.clearRect(0, 0, w1, h1);
    ctx1.fillStyle = '#faf8fc';
    ctx1.fillRect(0, 0, w1, h1);

    const centerY1 = h1 / 2;
    const centerX1 = w1 / 2;
    const scaleX = 60;
    const pX = centerX1 + state.x * scaleX;

    // Eje horizontal de movimiento
    ctx1.beginPath();
    ctx1.strokeStyle = '#cbd5e1';
    ctx1.lineWidth = 2;
    ctx1.moveTo(20, centerY1);
    ctx1.lineTo(w1 - 20, centerY1);
    ctx1.stroke();

    // Marcas de límites -A, 0, +A
    [-this.A, 0, this.A].forEach(pos => {
      const xPos = centerX1 + pos * scaleX;
      ctx1.beginPath();
      ctx1.strokeStyle = '#8b4f8c';
      ctx1.lineWidth = 1.5;
      ctx1.moveTo(xPos, centerY1 - 12);
      ctx1.lineTo(xPos, centerY1 + 12);
      ctx1.stroke();

      ctx1.fillStyle = '#64748b';
      ctx1.font = '10px "JetBrains Mono"';
      ctx1.textAlign = 'center';
      const label = pos === 0 ? 'x=0' : (pos > 0 ? `+A (${pos.toFixed(1)}m)` : `-A (${pos.toFixed(1)}m)`);
      ctx1.fillText(label, xPos, centerY1 + 25);
    });

    // Partícula
    ctx1.fillStyle = '#7c3aed';
    ctx1.beginPath();
    ctx1.arc(pX, centerY1, 12, 0, Math.PI * 2);
    ctx1.fill();
    ctx1.strokeStyle = '#4c1d95';
    ctx1.lineWidth = 2.5;
    ctx1.stroke();

    // Rótulo
    ctx1.fillStyle = '#2e1065';
    ctx1.font = 'bold 11px "Outfit"';
    ctx1.fillText('Partícula en MAS 1D', centerX1, 24);

    // Canvas 2: Osciloscopio en tiempo real
    const ctx2 = this.ctx2;
    const rect2 = this.canvas2.getBoundingClientRect();
    const w2 = rect2.width;
    const h2 = rect2.height;

    ctx2.clearRect(0, 0, w2, h2);
    ctx2.fillStyle = '#0f172a'; // Pantalla oscura de osciloscopio profesional
    ctx2.fillRect(0, 0, w2, h2);

    // Cuadrícula de osciloscopio
    ctx2.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx2.lineWidth = 1;
    const midY2 = h2 / 2;
    for (let x = 0; x < w2; x += 30) {
      ctx2.beginPath();
      ctx2.moveTo(x, 0);
      ctx2.lineTo(x, h2);
      ctx2.stroke();
    }
    for (let y = 0; y < h2; y += 25) {
      ctx2.beginPath();
      ctx2.moveTo(0, y);
      ctx2.lineTo(w2, y);
      ctx2.stroke();
    }

    // Eje central
    ctx2.strokeStyle = 'rgba(148, 163, 184, 0.8)';
    ctx2.lineWidth = 1.5;
    ctx2.beginPath();
    ctx2.moveTo(0, midY2);
    ctx2.lineTo(w2, midY2);
    ctx2.stroke();

    // Guardar en historial
    this.history.push({ x: state.x, v: state.v, a: state.a });
    if (this.history.length > this.maxHistory) this.history.shift();

    // Dibujar trazas continuas
    const step = w2 / this.maxHistory;

    // Curva x(t) (Azul cian)
    ctx2.beginPath();
    ctx2.strokeStyle = '#38bdf8';
    ctx2.lineWidth = 2.2;
    this.history.forEach((pt, i) => {
      const px = i * step;
      const py = midY2 - pt.x * 24;
      if (i === 0) ctx2.moveTo(px, py);
      else ctx2.lineTo(px, py);
    });
    ctx2.stroke();

    // Curva v(t) (Verde esmeralda)
    ctx2.beginPath();
    ctx2.strokeStyle = '#34d399';
    ctx2.lineWidth = 1.8;
    this.history.forEach((pt, i) => {
      const px = i * step;
      const py = midY2 - pt.v * 8;
      if (i === 0) ctx2.moveTo(px, py);
      else ctx2.lineTo(px, py);
    });
    ctx2.stroke();

    // Curva a(t) (Rojo fucsia)
    ctx2.beginPath();
    ctx2.strokeStyle = '#f43f5e';
    ctx2.lineWidth = 1.5;
    this.history.forEach((pt, i) => {
      const px = i * step;
      const py = midY2 - pt.a * 3;
      if (i === 0) ctx2.moveTo(px, py);
      else ctx2.lineTo(px, py);
    });
    ctx2.stroke();

    // Leyenda de osciloscopio
    ctx2.font = 'bold 9px "JetBrains Mono"';
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('■ x(t) Posición', 10, 16);
    ctx2.fillStyle = '#34d399';
    ctx2.fillText('■ v(t) Velocidad', 100, 16);
    ctx2.fillStyle = '#f43f5e';
    ctx2.fillText('■ a(t) Aceleración', 200, 16);
  }

  // SIMULACIÓN 4: Péndulo Simple
  renderPendulum(state) {
    const ctx1 = this.ctx1;
    const rect1 = this.canvas1.getBoundingClientRect();
    const w1 = rect1.width;
    const h1 = rect1.height;

    ctx1.clearRect(0, 0, w1, h1);
    ctx1.fillStyle = '#faf8fc';
    ctx1.fillRect(0, 0, w1, h1);

    const omegaP = this.getPendulumOmega();
    const theta = this.pendulumTheta0 * Math.cos(omegaP * this.time);
    const pivotX = w1 / 2;
    const pivotY = 25;
    const pixelLen = 35 + this.pendulumLength * 55;
    const bobX = pivotX + pixelLen * Math.sin(theta);
    const bobY = pivotY + pixelLen * Math.cos(theta);

    // Soporte techo
    ctx1.fillStyle = '#475569';
    ctx1.fillRect(pivotX - 35, 12, 70, 8);

    // Eje vertical equilibrio punteado
    ctx1.beginPath();
    ctx1.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx1.setLineDash([4, 4]);
    ctx1.moveTo(pivotX, pivotY);
    ctx1.lineTo(pivotX, pivotY + pixelLen + 20);
    ctx1.stroke();
    ctx1.setLineDash([]);

    // Cuerda
    ctx1.beginPath();
    ctx1.strokeStyle = '#64748b';
    ctx1.lineWidth = 2;
    ctx1.moveTo(pivotX, pivotY);
    ctx1.lineTo(bobX, bobY);
    ctx1.stroke();

    // Lenteja del péndulo
    ctx1.fillStyle = '#d97706';
    ctx1.beginPath();
    ctx1.arc(bobX, bobY, 14, 0, Math.PI * 2);
    ctx1.fill();
    ctx1.strokeStyle = '#78350f';
    ctx1.lineWidth = 2;
    ctx1.stroke();

    // Canvas 2: Datos y período del péndulo
    const ctx2 = this.ctx2;
    const rect2 = this.canvas2.getBoundingClientRect();
    const w2 = rect2.width;
    const h2 = rect2.height;

    ctx2.clearRect(0, 0, w2, h2);
    ctx2.fillStyle = '#fdfafc';
    ctx2.fillRect(0, 0, w2, h2);

    const T = this.getPendulumPeriod();
    const f = 1 / T;

    ctx2.fillStyle = '#3b1c42';
    ctx2.font = 'bold 13px "Outfit"';
    ctx2.textAlign = 'center';
    ctx2.fillText('Dinámica del Péndulo Simple', w2 / 2, 28);

    ctx2.font = '12px "JetBrains Mono"';
    ctx2.fillStyle = '#8b4f8c';
    ctx2.fillText(`T = 2π√(L/g) = ${T.toFixed(3)} s`, w2 / 2, 60);
    ctx2.fillText(`f = 1/T = ${f.toFixed(3)} Hz`, w2 / 2, 85);
    ctx2.fillText(`Longitud L = ${this.pendulumLength.toFixed(2)} m`, w2 / 2, 110);
    ctx2.fillText(`Gravedad g = ${this.pendulumG.toFixed(2)} m/s²`, w2 / 2, 135);
    ctx2.fillText(`Ángulo θ(t) = ${(theta * 180 / Math.PI).toFixed(1)}°`, w2 / 2, 160);

    ctx2.fillStyle = '#059669';
    ctx2.font = '10.5px "Plus Jakarta Sans"';
    ctx2.fillText('✨ El período depende SOLO de L y g (isocronismo de Galileo)', w2 / 2, 185);
  }


  // SIMULACIÓN 3: Fasor MCU Proyectado en Vivo (MCU <-> MAS)
  renderPhasorMCUMode(state) {
    // Canvas 1: Movimiento Circular Uniforme (MCU) con vectores cinemáticos rotatorios
    const ctx1 = this.ctx1;
    const rect1 = this.canvas1.getBoundingClientRect();
    const w1 = rect1.width;
    const h1 = rect1.height;

    ctx1.clearRect(0, 0, w1, h1);
    ctx1.fillStyle = '#faf6fd';
    ctx1.fillRect(0, 0, w1, h1);

    const cx1 = w1 / 2;
    const cy1 = h1 / 2;
    const radius1 = Math.min(w1, h1) * 0.35;

    // Ejes cartesianos MCU
    ctx1.beginPath();
    ctx1.strokeStyle = '#cbd5e1';
    ctx1.lineWidth = 1;
    ctx1.moveTo(cx1 - radius1 - 25, cy1);
    ctx1.lineTo(cx1 + radius1 + 25, cy1);
    ctx1.moveTo(cx1, cy1 - radius1 - 25);
    ctx1.lineTo(cx1, cy1 + radius1 + 25);
    ctx1.stroke();

    // Círculo de referencia de radio A
    ctx1.beginPath();
    ctx1.arc(cx1, cy1, radius1, 0, Math.PI * 2);
    ctx1.strokeStyle = 'rgba(139, 79, 140, 0.4)';
    ctx1.lineWidth = 2;
    ctx1.stroke();

    const tipX = cx1 + radius1 * Math.cos(state.theta);
    const tipY = cy1 - radius1 * Math.sin(state.theta);

    // Sector angular θ(t)
    ctx1.save();
    ctx1.beginPath();
    ctx1.moveTo(cx1, cy1);
    ctx1.arc(cx1, cy1, radius1 * 0.28, 0, -state.theta, true);
    ctx1.closePath();
    ctx1.fillStyle = 'rgba(217, 70, 239, 0.18)';
    ctx1.fill();
    ctx1.restore();

    // Fasor rotatorio (Vector posición angular)
    ctx1.beginPath();
    ctx1.strokeStyle = '#8b4f8c';
    ctx1.lineWidth = 3.2;
    ctx1.moveTo(cx1, cy1);
    ctx1.lineTo(tipX, tipY);
    ctx1.stroke();

    // Partícula rotante en el MCU
    ctx1.fillStyle = '#6b21a8';
    ctx1.beginPath();
    ctx1.arc(tipX, tipY, 7, 0, Math.PI * 2);
    ctx1.fill();
    ctx1.strokeStyle = '#ffffff';
    ctx1.lineWidth = 2;
    ctx1.stroke();

    // Vector velocidad tangencial v (verde esmeralda, perpendicular al radio)
    const vLen = 28;
    const vAngle = state.theta + Math.PI / 2;
    const vEndX = tipX + vLen * Math.cos(vAngle);
    const vEndY = tipY - vLen * Math.sin(vAngle);

    ctx1.beginPath();
    ctx1.strokeStyle = '#059669';
    ctx1.lineWidth = 2.4;
    ctx1.moveTo(tipX, tipY);
    ctx1.lineTo(vEndX, vEndY);
    ctx1.stroke();

    // Flecha velocidad
    const vDir = Math.atan2(tipY - vEndY, vEndX - tipX);
    ctx1.fillStyle = '#059669';
    ctx1.beginPath();
    ctx1.moveTo(vEndX, vEndY);
    ctx1.lineTo(vEndX - 6 * Math.cos(vDir - 0.5), vEndY + 6 * Math.sin(vDir - 0.5));
    ctx1.lineTo(vEndX - 6 * Math.cos(vDir + 0.5), vEndY + 6 * Math.sin(vDir + 0.5));
    ctx1.fill();

    // Vector aceleración centrípeta ac (rojo coral, hacia el centro)
    const acLen = 26;
    const acEndX = tipX - acLen * Math.cos(state.theta);
    const acEndY = tipY + acLen * Math.sin(state.theta);

    ctx1.beginPath();
    ctx1.strokeStyle = '#dc2626';
    ctx1.lineWidth = 2.2;
    ctx1.moveTo(tipX, tipY);
    ctx1.lineTo(acEndX, acEndY);
    ctx1.stroke();

    // Proyección punteada vertical hacia el eje X
    ctx1.save();
    ctx1.beginPath();
    ctx1.strokeStyle = '#2563eb';
    ctx1.setLineDash([4, 3]);
    ctx1.moveTo(tipX, tipY);
    ctx1.lineTo(tipX, cy1);
    ctx1.stroke();

    // Partícula proyectada sobre el eje X
    ctx1.fillStyle = '#1d4ed8';
    ctx1.beginPath();
    ctx1.arc(tipX, cy1, 6.5, 0, Math.PI * 2);
    ctx1.fill();
    ctx1.restore();

    // Rótulos explicativos en Canvas 1
    ctx1.fillStyle = '#4a1d6d';
    ctx1.font = 'bold 11px "Outfit"';
    ctx1.textAlign = 'center';
    ctx1.fillText('MCU: Fasor Rotatorio & Vectores', cx1, 20);

    ctx1.font = '10px "JetBrains Mono"';
    ctx1.fillStyle = '#6b21a8';
    ctx1.fillText(`θ = ${(state.theta % (2 * Math.PI)).toFixed(2)} rad (${((state.theta * 180 / Math.PI) % 360).toFixed(0)}°)`, cx1, cy1 + radius1 + 22);

    // Canvas 2: Proyección MAS y Desglose Armónico Directo
    const ctx2 = this.ctx2;
    const rect2 = this.canvas2.getBoundingClientRect();
    const w2 = rect2.width;
    const h2 = rect2.height;

    ctx2.clearRect(0, 0, w2, h2);
    ctx2.fillStyle = '#fdfbfe';
    ctx2.fillRect(0, 0, w2, h2);

    const midY2 = h2 / 2 - 10;
    const scaleX2 = 65;
    const projX = (w2 / 2) + (state.x / this.A) * (w2 * 0.35);

    // Riel del MAS
    ctx2.beginPath();
    ctx2.strokeStyle = '#cbd5e1';
    ctx2.lineWidth = 2;
    ctx2.moveTo(25, midY2);
    ctx2.lineTo(w2 - 25, midY2);
    ctx2.stroke();

    // Marcas -A, 0, +A
    [-1, 0, 1].forEach(k => {
      const markX = (w2 / 2) + k * (w2 * 0.35);
      ctx2.beginPath();
      ctx2.strokeStyle = '#8b4f8c';
      ctx2.lineWidth = 1.5;
      ctx2.moveTo(markX, midY2 - 10);
      ctx2.lineTo(markX, midY2 + 10);
      ctx2.stroke();

      ctx2.fillStyle = '#64748b';
      ctx2.font = '9.5px "JetBrains Mono"';
      ctx2.textAlign = 'center';
      const txt = k === 0 ? 'x=0' : (k > 0 ? '+A' : '-A');
      ctx2.fillText(txt, markX, midY2 + 22);
    });

    // Masa oscilante proyectada
    ctx2.fillStyle = '#2563eb';
    ctx2.beginPath();
    ctx2.arc(projX, midY2, 11, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = '#1e3a8a';
    ctx2.lineWidth = 2;
    ctx2.stroke();

    // Rótulo del valor x(t)
    ctx2.fillStyle = '#1e40af';
    ctx2.font = 'bold 10px "JetBrains Mono"';
    ctx2.textAlign = 'center';
    ctx2.fillText(`x(t) = ${state.x.toFixed(2)} m`, projX, midY2 - 16);

    // Resumen analítico inferior
    ctx2.fillStyle = '#3b1c42';
    ctx2.font = 'bold 11px "Outfit"';
    ctx2.textAlign = 'center';
    ctx2.fillText('Proyección Unidimensional del MCU en el MAS', w2 / 2, 20);

    const boxY = h2 - 64;
    ctx2.fillStyle = '#f5e9f8';
    ctx2.roundRect(14, boxY, w2 - 28, 54, 6);
    ctx2.fill();
    ctx2.strokeStyle = '#dfb0c7';
    ctx2.lineWidth = 1;
    ctx2.stroke();

    ctx2.fillStyle = '#4a1d6d';
    ctx2.font = '10px "JetBrains Mono"';
    ctx2.textAlign = 'left';
    ctx2.fillText(`• Posición:  x(t) = A·cos(ωt) = ${state.x.toFixed(2)} m`, 22, boxY + 16);
    ctx2.fillText(`• Velocidad: v(t) = -ωA·sen(ωt) = ${state.v.toFixed(2)} m/s`, 22, boxY + 32);
    ctx2.fillText(`• Aceleración: a(t) = -ω²A·cos(ωt) = ${state.a.toFixed(2)} m/s²`, 22, boxY + 48);
  }

  animate(timestamp) {
    const dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    if (this.isPlaying) {
      this.time += dt;
    }

    const state = this.getCurrentState();

    if (this.activeMode === 'spring-phasor') {
      this.renderSpringCanvas(state);
      this.renderPhasorCanvas(state);
    } else if (this.activeMode === 'oscilloscope') {
      this.renderOscilloscope(state);
    } else if (this.activeMode === 'phasor') {
      this.renderPhasorMCUMode(state);
    } else if (this.activeMode === 'pendulum') {
      this.renderPendulum(state);
    }

    // Actualizar telemetría HTML
    const readoutX = document.getElementById('simReadoutX');
    const readoutV = document.getElementById('simReadoutV');
    const readoutA = document.getElementById('simReadoutA');
    const readoutE = document.getElementById('simReadoutE');
    const readoutT = document.getElementById('simReadoutT');

    if (readoutX) readoutX.textContent = `${state.x.toFixed(3)} m`;
    if (readoutV) readoutV.textContent = `${state.v.toFixed(3)} m/s`;
    if (readoutA) readoutA.textContent = `${state.a.toFixed(3)} m/s²`;
    if (readoutE) readoutE.textContent = `${state.Em.toFixed(3)} J`;
    if (readoutT) readoutT.textContent = `${state.T.toFixed(3)} s`;

    requestAnimationFrame(this.animate);
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  reset() {
    this.time = 0;
    this.history = [];
  }
}

window.PhysicsOscillatorSimulation = PhysicsOscillatorSimulation;
