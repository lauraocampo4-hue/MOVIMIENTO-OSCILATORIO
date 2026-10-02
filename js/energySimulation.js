/**
 * ENERGY SIMULATION JS - SIMULADOR INTERACTIVO DE CONSERVACIÓN DE LA ENERGÍA EN EL M.A.S.
 * Basado visual y analíticamente en la gráfica de pozo de potencial cuadrático y balance dinámico U(x) + K(x) = E_T.
 *
 * Autoras: Danna Arias & Laura Ocampo - Universidad Tecnológica de Pereira (UTP)
 */

class EnergyConservationSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parámetros Físicos
    this.A = 2.0;       // Amplitud (m)
    this.omega = 2.0;   // Frecuencia angular (rad/s)
    this.m = 1.0;       // Masa (kg)
    this.k = this.m * this.omega * this.omega; // k = m*omega^2 = 4.0 N/m
    this.phi = 0.0;     // Fase inicial (rad)

    // Estado Dinámico
    this.t = 0.0;       // Tiempo (s)
    this.isPlaying = true;
    this.speedMultiplier = 1.0;
    this.lastTimestamp = null;
    this.animationFrameId = null;

    // Arrastre manual interactivo
    this.isDragging = false;
    this.dragX = 0;

    // Configuración de visualización
    this.xMin = -3.2;
    this.xMax = 3.2;
    this.eMax = 12.5; // Escala vertical de energía (Joules)

    // Elementos DOM de control
    this.sliderA = document.getElementById('engSliderA');
    this.sliderOmega = document.getElementById('engSliderOmega');
    this.sliderM = document.getElementById('engSliderM');
    this.sliderK = document.getElementById('engSliderK');

    this.valA = document.getElementById('engValA');
    this.valOmega = document.getElementById('engValOmega');
    this.valM = document.getElementById('engValM');
    this.valK = document.getElementById('engValK');

    this.btnPlay = document.getElementById('engBtnPlay');
    this.btnPause = document.getElementById('engBtnPause');
    this.btnReset = document.getElementById('engBtnReset');

    this.hudTime = document.getElementById('engHudTime');
    this.hudEquation = document.getElementById('engHudEquation');

    this.barU = document.getElementById('engBarU');
    this.barK = document.getElementById('engBarK');
    this.barEt = document.getElementById('engBarEt');
    this.numU = document.getElementById('engNumU');
    this.numK = document.getElementById('engNumK');
    this.numEt = document.getElementById('engNumEt');

    this.initEventListeners();
    this.setupDPI();
    this.startLoop();
  }

  setupDPI() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.setupDPI());

    if (this.sliderA) {
      this.sliderA.addEventListener('input', (e) => {
        this.A = parseFloat(e.target.value);
        if (this.valA) this.valA.textContent = `${this.A.toFixed(1)} m`;
        this.updateDerivedParams();
      });
    }

    if (this.sliderOmega) {
      this.sliderOmega.addEventListener('input', (e) => {
        this.omega = parseFloat(e.target.value);
        if (this.valOmega) this.valOmega.textContent = `${this.omega.toFixed(1)} rad/s`;
        this.updateDerivedParams();
      });
    }

    if (this.sliderM) {
      this.sliderM.addEventListener('input', (e) => {
        this.m = parseFloat(e.target.value);
        if (this.valM) this.valM.textContent = `${this.m.toFixed(1)} kg`;
        this.updateDerivedParams();
      });
    }

    if (this.sliderK) {
      this.sliderK.addEventListener('input', (e) => {
        this.k = parseFloat(e.target.value);
        this.omega = Math.sqrt(this.k / this.m);
        if (this.valK) this.valK.textContent = `${this.k.toFixed(1)} N/m`;
        if (this.valOmega) this.valOmega.textContent = `${this.omega.toFixed(1)} rad/s`;
        if (this.sliderOmega) this.sliderOmega.value = this.omega.toFixed(1);
      });
    }

    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => {
        this.isPlaying = true;
        if (this.btnPlay) this.btnPlay.classList.add('active-ctrl');
        if (this.btnPause) this.btnPause.classList.remove('active-ctrl');
      });
    }

    if (this.btnPause) {
      this.btnPause.addEventListener('click', () => {
        this.isPlaying = false;
        if (this.btnPause) this.btnPause.classList.add('active-ctrl');
        if (this.btnPlay) this.btnPlay.classList.remove('active-ctrl');
      });
    }

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        this.t = 0.0;
        this.isPlaying = true;
        if (this.btnPlay) this.btnPlay.classList.add('active-ctrl');
        if (this.btnPause) this.btnPause.classList.remove('active-ctrl');
      });
    }

    // Botones de velocidad
    document.querySelectorAll('.eng-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.eng-speed-btn').forEach(b => b.classList.remove('active-speed'));
        btn.classList.add('active-speed');
        this.speedMultiplier = parseFloat(btn.dataset.speed || 1.0);
      });
    });

    // Interacción táctil y ratón sobre el canvas para arrastrar la partícula
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      return { px, py };
    };

    const startDrag = (e) => {
      const { px } = getPos(e);
      const mathX = this.pixelToMathX(px);
      if (Math.abs(mathX) <= this.A * 1.15) {
        this.isDragging = true;
        this.isPlaying = false;
        if (this.btnPause) this.btnPause.classList.add('active-ctrl');
        if (this.btnPlay) this.btnPlay.classList.remove('active-ctrl');
        this.setParticlePosition(mathX);
      }
    };

    const moveDrag = (e) => {
      if (!this.isDragging) return;
      const { px } = getPos(e);
      const mathX = Math.max(-this.A, Math.min(this.A, this.pixelToMathX(px)));
      this.setParticlePosition(mathX);
    };

    const endDrag = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    this.canvas.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', moveDrag, { passive: true });
    window.addEventListener('touchend', endDrag);
  }

  setParticlePosition(x) {
    const clampedX = Math.max(-this.A, Math.min(this.A, x));
    const ratio = clampedX / this.A;
    const theta = Math.acos(Math.max(-1, Math.min(1, ratio)));
    this.t = theta / this.omega;
  }

  updateDerivedParams() {
    this.k = this.m * this.omega * this.omega;
    if (this.valK) this.valK.textContent = `${this.k.toFixed(1)} N/m`;
    if (this.sliderK) this.sliderK.value = this.k.toFixed(1);
    const Et = 0.5 * this.k * this.A * this.A;
    this.eMax = Math.max(12.0, Et * 1.25);
  }

  mathToPixelX(x) {
    const paddingLeft = 46;
    const paddingRight = 24;
    const usableW = this.cssWidth - paddingLeft - paddingRight;
    return paddingLeft + ((x - this.xMin) / (this.xMax - this.xMin)) * usableW;
  }

  mathToPixelY(e) {
    const paddingTop = 26;
    const paddingBottom = 42;
    const usableH = this.cssHeight - paddingTop - paddingBottom;
    return this.cssHeight - paddingBottom - (e / this.eMax) * usableH;
  }

  pixelToMathX(px) {
    const paddingLeft = 46;
    const paddingRight = 24;
    const usableW = this.cssWidth - paddingLeft - paddingRight;
    return this.xMin + ((px - paddingLeft) / usableW) * (this.xMax - this.xMin);
  }

  startLoop() {
    const loop = (timestamp) => {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const dt = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
      this.lastTimestamp = timestamp;

      if (this.isPlaying && !this.isDragging) {
        this.t += dt * this.speedMultiplier;
      }

      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  render() {
    if (!this.ctx || !this.cssWidth || !this.cssHeight) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

    // Cálculos cinemáticos y energéticos
    const x = this.A * Math.cos(this.omega * this.t + this.phi);
    const v = -this.omega * this.A * Math.sin(this.omega * this.t + this.phi);
    const U = 0.5 * this.k * x * x;
    const K = 0.5 * this.m * v * v;
    const Et = 0.5 * this.k * this.A * this.A;

    // Actualizar HUD y barras DOM
    this.updateHUD(this.t, x, v, U, K, Et);

    // 1. DIBUJAR CUADRÍCULA Y EJES CARTESIANOS
    this.drawGrid(ctx);

    // 2. DIBUJAR LÍNEA DE ENERGÍA MECÁNICA TOTAL E_T (Verde esmeralda punteada)
    this.drawTotalEnergyLine(ctx, Et);

    // 3. DIBUJAR CURVA PARABÓLICA U(x) = 1/2 k x^2 (Naranja / Oro)
    this.drawPotentialParabola(ctx);

    // 4. DIBUJAR SEGMENTO DINÁMICO DE ENERGÍA CINÉTICA K(x)
    this.drawKineticSegment(ctx, x, U, Et);

    // 5. DIBUJAR PARTÍCULA Y PROYECCIONES
    this.drawParticle(ctx, x, U, Et);

    // 6. DIBUJAR LÍMITES DE OSCILACIÓN x = ±A
    this.drawAmplitudeLimits(ctx);
  }

  drawGrid(ctx) {
    const paddingLeft = 46;
    const paddingRight = 24;
    const paddingTop = 26;
    const paddingBottom = 42;

    ctx.save();

    // Líneas de cuadrícula suave
    ctx.strokeStyle = '#f1e8f5';
    ctx.lineWidth = 1;

    // Cuadrícula vertical (x)
    for (let gx = -3.0; gx <= 3.0; gx += 0.5) {
      const px = this.mathToPixelX(gx);
      ctx.beginPath();
      ctx.moveTo(px, paddingTop);
      ctx.lineTo(px, this.cssHeight - paddingBottom);
      ctx.stroke();
    }

    // Cuadrícula horizontal (E)
    const stepE = this.eMax > 15 ? 2.0 : 1.0;
    for (let ge = 0; ge <= this.eMax; ge += stepE) {
      const py = this.mathToPixelY(ge);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, py);
      ctx.lineTo(this.cssWidth - paddingRight, py);
      ctx.stroke();
    }

    // EJE HORIZONTAL (x = posición en metros)
    const pyZero = this.mathToPixelY(0);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(paddingLeft - 8, pyZero);
    ctx.lineTo(this.cssWidth - paddingRight + 12, pyZero);
    ctx.stroke();

    // Flecha eje x
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(this.cssWidth - paddingRight + 12, pyZero);
    ctx.lineTo(this.cssWidth - paddingRight + 4, pyZero - 4);
    ctx.lineTo(this.cssWidth - paddingRight + 4, pyZero + 4);
    ctx.fill();

    // EJE VERTICAL (E = energía en Joules)
    const pxZero = this.mathToPixelX(0);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, this.cssHeight - paddingBottom + 8);
    ctx.lineTo(paddingLeft, paddingTop - 12);
    ctx.stroke();

    // Flecha eje E
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop - 12);
    ctx.lineTo(paddingLeft - 4, paddingTop - 4);
    ctx.lineTo(paddingLeft + 4, paddingTop - 4);
    ctx.fill();

    // Etiquetas de los ejes
    ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let gx = -3.0; gx <= 3.0; gx += 0.5) {
      const px = this.mathToPixelX(gx);
      ctx.fillText(gx.toFixed(1), px, pyZero + 6);
    }
    ctx.fillText('Posición x (m)', this.cssWidth / 2, this.cssHeight - 16);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let ge = 0; ge <= this.eMax; ge += stepE) {
      const py = this.mathToPixelY(ge);
      ctx.fillText(ge.toFixed(1), paddingLeft - 8, py);
    }

    // Etiqueta vertical Energía (J)
    ctx.save();
    ctx.translate(14, this.cssHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Energía (J)', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  drawTotalEnergyLine(ctx, Et) {
    const py = this.mathToPixelY(Et);
    const pxLeft = this.mathToPixelX(this.xMin);
    const pxRight = this.mathToPixelX(this.xMax);

    ctx.save();
    ctx.strokeStyle = '#059669'; // Verde esmeralda
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(pxLeft, py);
    ctx.lineTo(pxRight, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Etiqueta izquierda de Energía Total
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#059669';
    ctx.textAlign = 'left';
    ctx.fillText('E_T = ½kA²', pxLeft + 10, py - 8);

    ctx.restore();
  }

  drawPotentialParabola(ctx) {
    const paddingLeft = 46;
    const paddingRight = 24;
    const paddingTop = 26;
    const paddingBottom = 42;

    ctx.save();
    ctx.strokeStyle = '#f59e0b'; // Naranja ámbar dorado
    ctx.lineWidth = 3.2;

    ctx.beginPath();
    let isFirst = true;
    for (let px = paddingLeft; px <= this.cssWidth - paddingRight; px += 2) {
      const x = this.pixelToMathX(px);
      const U = 0.5 * this.k * x * x;
      const py = this.mathToPixelY(U);
      if (py >= paddingTop - 5 && py <= this.cssHeight - paddingBottom + 5) {
        if (isFirst) {
          ctx.moveTo(px, py);
          isFirst = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
    }
    ctx.stroke();

    // Etiqueta de la curva U(x)
    const labelX = this.mathToPixelX(this.A * 0.7);
    const labelY = this.mathToPixelY(0.5 * this.k * Math.pow(this.A * 0.7, 2));
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#d97706';
    ctx.textAlign = 'left';
    ctx.fillText('U(x) = ½kx²', labelX + 12, labelY + 2);

    ctx.restore();
  }

  drawKineticSegment(ctx, x, U, Et) {
    const px = this.mathToPixelX(x);
    const pyBottom = this.mathToPixelY(U);
    const pyTop = this.mathToPixelY(Et);

    ctx.save();
    // Segmento vertical grueso color ámbar/dorado de energía cinética
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px, pyBottom);
    ctx.lineTo(px, pyTop);
    ctx.stroke();

    // Punto verde de anclaje superior en la línea de energía total
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(px, pyTop, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Etiqueta 'K' en el centro del segmento
    const pyMid = (pyBottom + pyTop) / 2;
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.textAlign = 'left';
    ctx.fillText('K', px + 7, pyMid);

    ctx.restore();
  }

  drawParticle(ctx, x, U, Et) {
    const px = this.mathToPixelX(x);
    const py = this.mathToPixelY(U);

    ctx.save();
    // Resplandor exterior (glow)
    const grad = ctx.createRadialGradient(px, py, 2, px, py, 14);
    grad.addColorStop(0, 'rgba(236, 72, 153, 0.9)');
    grad.addColorStop(0.5, 'rgba(244, 114, 182, 0.5)');
    grad.addColorStop(1, 'rgba(244, 114, 182, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();

    // Partícula esférica 3D rosa/magenta
    const sphereGrad = ctx.createRadialGradient(px - 2.5, py - 2.5, 1, px, py, 7);
    sphereGrad.addColorStop(0, '#fdf2f8');
    sphereGrad.addColorStop(0.3, '#f472b6');
    sphereGrad.addColorStop(0.8, '#db2777');
    sphereGrad.addColorStop(1, '#9d174d');

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(px, py, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Proyección punteada vertical hacia el eje x
    const pyZero = this.mathToPixelY(0);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, pyZero);
    ctx.stroke();

    // Marcador en el eje X
    ctx.fillStyle = '#db2777';
    ctx.beginPath();
    ctx.arc(px, pyZero, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawAmplitudeLimits(ctx) {
    const pxPlusA = this.mathToPixelX(this.A);
    const pxMinusA = this.mathToPixelX(-this.A);
    const pyTop = this.mathToPixelY(this.eMax);
    const pyBottom = this.mathToPixelY(0);

    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(pxPlusA, pyTop);
    ctx.lineTo(pxPlusA, pyBottom);
    ctx.moveTo(pxMinusA, pyTop);
    ctx.lineTo(pxMinusA, pyBottom);
    ctx.stroke();

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#db2777';
    ctx.textAlign = 'center';
    ctx.fillText('+A', pxPlusA, pyBottom + 18);
    ctx.fillText('-A', pxMinusA, pyBottom + 18);

    ctx.restore();
  }

  updateHUD(t, x, v, U, K, Et) {
    if (this.hudTime) {
      this.hudTime.textContent = `t = ${t.toFixed(2)}s`;
    }
    if (this.hudEquation) {
      this.hudEquation.textContent = `Conservación: E_T = U + K  (${Et.toFixed(2)} J = ${U.toFixed(2)} J + ${K.toFixed(2)} J)`;
    }

    if (this.numU) this.numU.textContent = `${U.toFixed(2)} J`;
    if (this.numK) this.numK.textContent = `${K.toFixed(2)} J`;
    if (this.numEt) this.numEt.textContent = `${Et.toFixed(2)} J`;

    const maxBarH = 65; // pixels
    if (this.barU) {
      const pctU = Et > 0 ? (U / Et) : 0;
      this.barU.style.height = `${Math.max(4, pctU * maxBarH)}px`;
    }
    if (this.barK) {
      const pctK = Et > 0 ? (K / Et) : 0;
      this.barK.style.height = `${Math.max(4, pctK * maxBarH)}px`;
    }
    if (this.barEt) {
      this.barEt.style.height = `${maxBarH}px`;
    }
  }
}

// Inicialización global
window.initEnergySimulator = function() {
  if (!window.energySimInstance && document.getElementById('energyCanvas')) {
    window.energySimInstance = new EnergyConservationSimulator('energyCanvas');
  } else if (window.energySimInstance) {
    window.energySimInstance.setupDPI();
  }
};
