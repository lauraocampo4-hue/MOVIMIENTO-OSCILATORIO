/**
 * GEOGEBRA ENGINE - MOTOR DE PLANOS CARTESIANOS Y GRÁFICAS INTERACTIVAS
 * Estilo GeoGebra con cuadrícula milimetrada, reglas en los ejes, zoom/pan gestual,
 * paleta de estilos y sincronización con modal ampliado.
 * 
 * Desarrollado por el Equipo Multidisciplinar de IAs para Laura Ocampo y Danna Arias (UTP)
 */

class GeoGebraPlotter {
  constructor(canvasId, options = {}) {
    this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.options = Object.assign({
      originX: null,
      originY: null,
      scaleX: 60, // píxeles por unidad física
      scaleY: 60,
      minScale: 10,
      maxScale: 600,
      xLabel: 't (s)',
      yLabel: 'x (m)',
      enablePan: true,
      enableZoom: true,
      showMinorGrid: true,
      showLegend: true,
      syncWithModal: true
    }, options);

    // Estado del plano cartesiano
    this.scaleX = this.options.scaleX;
    this.scaleY = this.options.scaleY;
    this.originX = this.options.originX !== null ? this.options.originX : 80;
    this.originY = this.options.originY !== null ? this.options.originY : 160;

    // Estado de interacción
    this.isDragging = false;
    this.dragMode = 'pan'; // 'pan', 'scaleX', 'scaleY', 'select'
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.hoverX = null;
    this.hoverY = null;
    this.selectedTool = 'pan'; // 'pan', 'select', 'palette'

    // Estilos gráficos configurables mediante la paleta
    this.styles = {
      curveColor: '#7c3aed',
      vColor: '#059669',
      aColor: '#dc2626',
      lineWidth: 2.5,
      lineDash: [], // [] = solid, [6, 4] = dashed, [2, 3] = dotted
      showVelocity: false,
      showAcceleration: false,
      showTangent: true,
      showMilimeterGrid: true
    };

    // Parámetros físicos del MAS para la curva
    this.params = {
      A: 1.5,      // Amplitud (m)
      omega: 2.0,  // Frecuencia angular (rad/s)
      phi: 0.0,    // Fase inicial (rad)
      time: 0.0    // Tiempo actual para el rastreador / fasor
    };

    this.curves = [];
    this.setupDPI();
    this.initEvents();
    this.render();
  }

  setupDPI() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 600;
    this.height = rect.height || 300;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);

    if (this.options.originX === null) {
      this.originX = 70;
    }
    if (this.options.originY === null) {
      this.originY = this.height / 2;
    }
  }

  resize() {
    this.setupDPI();
    this.render();
  }

  // Transformaciones de coordenadas
  toScreenX(mathX) {
    return this.originX + mathX * this.scaleX;
  }

  toScreenY(mathY) {
    return this.originY - mathY * this.scaleY;
  }

  toMathX(screenX) {
    return (screenX - this.originX) / this.scaleX;
  }

  toMathY(screenY) {
    return (this.originY - screenY) / this.scaleY;
  }

  // Cálculo de intervalos óptimos para la cuadrícula estilo GeoGebra
  getNiceStep(scale) {
    const minPixelDistance = 50;
    const rawStep = minPixelDistance / scale;
    const power = Math.floor(Math.log10(rawStep));
    const fraction = rawStep / Math.pow(10, power);
    let niceFraction = 1;
    if (fraction > 5) niceFraction = 10;
    else if (fraction > 2) niceFraction = 5;
    else if (fraction > 1) niceFraction = 2;
    return niceFraction * Math.pow(10, power);
  }

  // Dibujado del plano cartesiano milimetrado estilo GeoGebra
  drawGrid() {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    ctx.clearRect(0, 0, width, height);

    const stepX = this.getNiceStep(this.scaleX);
    const stepY = this.getNiceStep(this.scaleY);

    const minX = this.toMathX(0);
    const maxX = this.toMathX(width);
    const minY = this.toMathY(height);
    const maxY = this.toMathY(0);

    // 1. CUADRÍCULA MENOR (Papel Milimetrado)
    if (this.styles.showMilimeterGrid) {
      const subDivs = 5;
      const subStepX = stepX / subDivs;
      const subStepY = stepY / subDivs;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(185, 210, 240, 0.45)';
      ctx.lineWidth = 0.6;

      const firstSubX = Math.floor(minX / subStepX) * subStepX;
      for (let x = firstSubX; x <= maxX; x += subStepX) {
        const sx = this.toScreenX(x);
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
      }

      const firstSubY = Math.floor(minY / subStepY) * subStepY;
      for (let y = firstSubY; y <= maxY; y += subStepY) {
        const sy = this.toScreenY(y);
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
      }
      ctx.stroke();
    }

    // 2. CUADRÍCULA MAYOR
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(125, 160, 215, 0.75)';
    ctx.lineWidth = 1.0;

    const firstMajorX = Math.floor(minX / stepX) * stepX;
    for (let x = firstMajorX; x <= maxX; x += stepX) {
      const sx = this.toScreenX(x);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }

    const firstMajorY = Math.floor(minY / stepY) * stepY;
    for (let y = firstMajorY; y <= maxY; y += stepY) {
      const sy = this.toScreenY(y);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();

    // 3. EJES CARTESIANOS PRINCIPALES
    ctx.beginPath();
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1.6;

    // Eje X
    const axisY = Math.max(15, Math.min(height - 15, this.originY));
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);

    // Eje Y
    const axisX = Math.max(25, Math.min(width - 25, this.originX));
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, height);
    ctx.stroke();

    // Flechas de los ejes
    ctx.fillStyle = '#2d3748';
    // Flecha X
    ctx.beginPath();
    ctx.moveTo(width, axisY);
    ctx.lineTo(width - 8, axisY - 4);
    ctx.lineTo(width - 8, axisY + 4);
    ctx.fill();

    // Flecha Y
    ctx.beginPath();
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX - 4, 8);
    ctx.lineTo(axisX + 4, 8);
    ctx.fill();

    // 4. TICKS Y ETIQUETAS NUMÉRICAS
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4a5568';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Ticks en X
    for (let x = firstMajorX; x <= maxX; x += stepX) {
      if (Math.abs(x) < 1e-6) continue;
      const sx = this.toScreenX(x);
      // Marca de regla
      ctx.beginPath();
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1.2;
      ctx.moveTo(sx, axisY - 4);
      ctx.lineTo(sx, axisY + 4);
      ctx.stroke();

      const label = Number(x.toFixed(2)).toString();
      ctx.fillText(label, sx, axisY + 6);
    }

    // Ticks en Y
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = firstMajorY; y <= maxY; y += stepY) {
      if (Math.abs(y) < 1e-6) continue;
      const sy = this.toScreenY(y);
      // Marca de regla
      ctx.beginPath();
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1.2;
      ctx.moveTo(axisX - 4, sy);
      ctx.lineTo(axisX + 4, sy);
      ctx.stroke();

      const label = Number(y.toFixed(2)).toString();
      ctx.fillText(label, axisX - 6, sy);
    }

    // Origen (0,0)
    ctx.fillText('0', axisX - 6, axisY + 6);

    // Rótulos de los ejes
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.fillStyle = '#2d1b38';
    ctx.textAlign = 'right';
    ctx.fillText(this.options.xLabel, width - 12, axisY - 10);
    ctx.textAlign = 'left';
    ctx.fillText(this.options.yLabel, axisX + 8, 12);
  }

  // Dibujar curvas cinemáticas del MAS
  drawCurves() {
    const ctx = this.ctx;
    const { A, omega, phi, time } = this.params;
    const width = this.width;

    const minX = Math.max(0, this.toMathX(0));
    const maxX = this.toMathX(width);

    // Función de elongación: x(t) = A * cos(omega * t + phi)
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = this.styles.curveColor;
    ctx.lineWidth = this.styles.lineWidth;
    ctx.setLineDash(this.styles.lineDash);

    const stepPx = 1.5;
    let started = false;

    for (let px = 0; px <= width; px += stepPx) {
      const t = this.toMathX(px);
      if (t < 0) continue;
      const x = A * Math.cos(omega * t + phi);
      const py = this.toScreenY(x);

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Si está activa la curva de Velocidad: v(t) = -omega * A * sin(omega * t + phi)
    if (this.styles.showVelocity) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = this.styles.vColor;
      ctx.lineWidth = Math.max(1.5, this.styles.lineWidth - 0.5);
      ctx.setLineDash([5, 3]);

      let vStarted = false;
      for (let px = 0; px <= width; px += stepPx) {
        const t = this.toMathX(px);
        if (t < 0) continue;
        const v = -omega * A * Math.sin(omega * t + phi);
        const py = this.toScreenY(v);

        if (!vStarted) {
          ctx.moveTo(px, py);
          vStarted = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // Si está activa la curva de Aceleración: a(t) = -omega^2 * A * cos(omega * t + phi)
    if (this.styles.showAcceleration) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = this.styles.aColor;
      ctx.lineWidth = Math.max(1.5, this.styles.lineWidth - 0.5);
      ctx.setLineDash([2, 2]);

      let aStarted = false;
      for (let px = 0; px <= width; px += stepPx) {
        const t = this.toMathX(px);
        if (t < 0) continue;
        const a = -omega * omega * A * Math.cos(omega * t + phi);
        const py = this.toScreenY(a);

        if (!aStarted) {
          ctx.moveTo(px, py);
          aStarted = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // RASTREADOR / PUNTO INSTANTÁNEO EN EL TIEMPO
    if (time >= 0) {
      const curX = A * Math.cos(omega * time + phi);
      const curV = -omega * A * Math.sin(omega * time + phi);
      const curA = -omega * omega * curX;

      const ptScreenX = this.toScreenX(time);
      const ptScreenY = this.toScreenY(curX);

      // Si el punto cae dentro del canvas
      if (ptScreenX >= 0 && ptScreenX <= width) {
        // Línea vertical punteada al eje t
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.moveTo(ptScreenX, this.originY);
        ctx.lineTo(ptScreenX, ptScreenY);
        ctx.stroke();

        // Punto de posición
        ctx.beginPath();
        ctx.fillStyle = this.styles.curveColor;
        ctx.arc(ptScreenX, ptScreenY, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Vector velocidad tangente (si está activo)
        if (this.styles.showTangent) {
          const vScale = 0.15 * this.scaleY;
          const vVectorY = ptScreenY - curV * 0.08 * this.scaleY;
          ctx.beginPath();
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 2.5;
          ctx.moveTo(ptScreenX, ptScreenY);
          ctx.lineTo(ptScreenX, vVectorY);
          ctx.stroke();

          // Flecha
          const arrowDir = curV >= 0 ? -1 : 1;
          ctx.beginPath();
          ctx.fillStyle = '#059669';
          ctx.moveTo(ptScreenX, vVectorY);
          ctx.lineTo(ptScreenX - 3, vVectorY - arrowDir * 6);
          ctx.lineTo(ptScreenX + 3, vVectorY - arrowDir * 6);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // Línea de cursor de inspección (hover)
    if (this.selectedTool === 'select' && this.hoverX !== null) {
      const hoverMathT = this.toMathX(this.hoverX);
      if (hoverMathT >= 0) {
        const hoverMathX = A * Math.cos(omega * hoverMathT + phi);
        const hoverScreenY = this.toScreenY(hoverMathX);

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(234, 88, 12, 0.6)';
        ctx.setLineDash([4, 3]);
        ctx.moveTo(this.hoverX, 0);
        ctx.lineTo(this.hoverX, this.height);
        ctx.moveTo(0, hoverScreenY);
        ctx.lineTo(this.width, hoverScreenY);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = '#ea580c';
        ctx.arc(this.hoverX, hoverScreenY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  render() {
    this.drawGrid();
    this.drawCurves();
  }

  // Eventos interactivos del canvas: Pan, Zoom, Re-escalado de ejes
  initEvents() {
    const canvas = this.canvas;

    // Zoom con rueda del ratón alrededor del cursor
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      this.zoomAtPoint(mouseX, mouseY, zoomFactor);
    }, { passive: false });

    // Puntero / Touch Start
    const handlePointerDown = (x, y) => {
      this.isDragging = true;
      this.lastMouseX = x;
      this.lastMouseY = y;

      // Detectar si el usuario cliqueó cerca de los ejes para re-escalamiento manual
      const nearXAxis = Math.abs(y - this.originY) < 18;
      const nearYAxis = Math.abs(x - this.originX) < 18;

      if (nearXAxis && !nearYAxis) {
        this.dragMode = 'scaleX';
      } else if (nearYAxis && !nearXAxis) {
        this.dragMode = 'scaleY';
      } else {
        this.dragMode = 'pan';
      }
    };

    // Puntero / Touch Move
    const handlePointerMove = (x, y) => {
      this.hoverX = x;
      this.hoverY = y;

      if (!this.isDragging) {
        if (this.selectedTool === 'select') {
          this.render();
          this.updateCoordinateBadge(x, y);
        }
        return;
      }

      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;

      if (this.dragMode === 'pan') {
        this.originX += dx;
        this.originY += dy;
      } else if (this.dragMode === 'scaleX') {
        const factor = 1 + dx * 0.008;
        this.scaleX = Math.max(this.options.minScale, Math.min(this.options.maxScale, this.scaleX * factor));
      } else if (this.dragMode === 'scaleY') {
        const factor = 1 - dy * 0.008;
        this.scaleY = Math.max(this.options.minScale, Math.min(this.options.maxScale, this.scaleY * factor));
      }

      this.lastMouseX = x;
      this.lastMouseY = y;
      this.render();
      this.updateCoordinateBadge(x, y);
    };

    const handlePointerUp = () => {
      this.isDragging = false;
      this.dragMode = 'pan';
    };

    // Mouse listeners
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      handlePointerDown(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging || this.selectedTool === 'select') {
        const rect = canvas.getBoundingClientRect();
        handlePointerMove(e.clientX - rect.left, e.clientY - rect.top);
      }
    });

    window.addEventListener('mouseup', handlePointerUp);

    // Touch listeners para móviles y tablets
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        handlePointerDown(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        handlePointerMove(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    }, { passive: true });

    canvas.addEventListener('touchend', handlePointerUp);
  }

  zoomAtPoint(x, y, factor) {
    const mathX = this.toMathX(x);
    const mathY = this.toMathY(y);

    this.scaleX = Math.max(this.options.minScale, Math.min(this.options.maxScale, this.scaleX * factor));
    this.scaleY = Math.max(this.options.minScale, Math.min(this.options.maxScale, this.scaleY * factor));

    this.originX = x - mathX * this.scaleX;
    this.originY = y + mathY * this.scaleY;

    this.render();
  }

  // Controles de la barra de herramientas GeoGebra
  zoomIn() {
    this.zoomAtPoint(this.width / 2, this.height / 2, 1.25);
  }

  zoomOut() {
    this.zoomAtPoint(this.width / 2, this.height / 2, 0.8);
  }

  resetView() {
    this.scaleX = this.options.scaleX;
    this.scaleY = this.options.scaleY;
    this.originX = 70;
    this.originY = this.height / 2;
    this.render();
  }

  setParams(newParams) {
    Object.assign(this.params, newParams);
    this.render();
  }

  setStyles(newStyles) {
    Object.assign(this.styles, newStyles);
    this.render();
  }

  updateCoordinateBadge(screenX, screenY) {
    const t = this.toMathX(screenX);
    const x = this.toMathY(screenY);
    const badge = this.canvas.parentElement.querySelector('.geogebra-coord-pill');
    if (badge) {
      badge.textContent = `t: ${t.toFixed(2)} s, x: ${x.toFixed(2)} m`;
    }
  }
}

window.GeoGebraPlotter = GeoGebraPlotter;
