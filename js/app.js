/**
 * APP JS - CONTROLADOR DEL CUADERNO DIGITAL FÍSICO ABIERTO DE DOBLE PÁGINA (SPREADS)
 * Con animación de volteo 3D (Page-Flip), sonido de papel físico, cuestionarios interactivos
 * de la vida real, renderizado matemático KaTeX y GeoGebra.
 * 
 * Autoras: Danna Arias y Laura Ocampo - Universidad Tecnológica de Pereira
 * Equipo Multidisciplinar de IAs
 */

function initNotebookApp() {
  if (!window.notebookApp) {
    window.notebookApp = new SpreadNotebookManager();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotebookApp);
} else {
  initNotebookApp();
}

class SpreadNotebookManager {
  constructor() {
    this.spreads = document.querySelectorAll('.book-spread');
    this.totalSpreads = this.spreads.length; // 10 pliegos = 20 páginas
    this.currentSpreadIndex = 0;
    this.isAnimating = false;
    this.animationTimer = null;

    // Elementos de navegación
    this.prevBtn = document.getElementById('spreadPrevBtn');
    this.nextBtn = document.getElementById('spreadNextBtn');
    this.homeBtn = document.getElementById('spreadHomeBtn');
    this.spreadSelect = document.getElementById('spreadSelect');
    this.spreadIndicator = document.getElementById('spreadIndicator');
    this.fullscreenBtn = document.getElementById('spreadFullscreenBtn');
    this.bookContainer = document.querySelector('.notebook-open-book');

    // Sub-motores
    this.plotterInstances = {};
    this.simulationInstance = null;
    this.mindmapInstance = null;

    this.initAudio();
    this.initNavigation();
    this.initRealWorldQuizzes();
    this.initModal();
    this.updateControls(0);
    this.onSpreadSettled(0);
    this.renderKaTeX();
  }

  // Generador sintético de sonido sutil de volteo de hoja (Web Audio API)
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  playPageFlipSound() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const bufferSize = this.audioCtx.sampleRate * 0.15; // 150ms
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Ruido blanco suave modulado
        const decay = Math.exp(-i / (bufferSize * 0.35));
        data[i] = (Math.random() * 2 - 1) * decay * 0.12;
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      // Filtro paso banda para simular el roce del papel
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 1.2;

      noise.connect(filter);
      filter.connect(this.audioCtx.destination);
      noise.start();
    } catch (e) {}
  }

  initNavigation() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prevSpread());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextSpread());
    }
    if (this.homeBtn) {
      this.homeBtn.addEventListener('click', () => this.goToSpread(0));
    }
    if (this.spreadSelect) {
      this.spreadSelect.addEventListener('change', (e) => {
        this.goToSpread(parseInt(e.target.value, 10));
      });
    }

    // Botón de abrir en la portada y clic en la portada misma
    const openBtn = document.getElementById('coverOpenBtn');
    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goToSpread(1);
      });
    }

    const coverPage = document.getElementById('page-1');
    if (coverPage) {
      coverPage.style.cursor = 'pointer';
      coverPage.addEventListener('click', () => {
        if (this.currentSpreadIndex === 0) {
          this.goToSpread(1);
        }
      });
    }

    // Atajos de teclado
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        return;
      }
      if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        this.nextSpread();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        this.prevSpread();
      } else if (e.key === 'Home') {
        this.goToSpread(0);
      } else if (e.key === 'End') {
        this.goToSpread(this.totalSpreads - 1);
      }
    });

    // Soporte táctil swipe
    let touchStartX = 0;
    if (this.bookContainer) {
      this.bookContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      this.bookContainer.addEventListener('touchend', (e) => {
        const diffX = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diffX) > 60) {
          if (diffX < 0) this.nextSpread();
          else this.prevSpread();
        }
      }, { passive: true });
    }

    // Pantalla completa
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  goToSpread(targetIndex, animate = true) {
    if (targetIndex < 0 || targetIndex >= this.totalSpreads) return;
    if (targetIndex === this.currentSpreadIndex && this.spreads[targetIndex].classList.contains('active') && !animate) {
      this.updateControls(targetIndex);
      return;
    }

    const isForward = targetIndex > this.currentSpreadIndex;
    
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }

    this.spreads.forEach((s, idx) => {
      s.classList.remove('flip-next', 'flip-prev');
      if (idx !== targetIndex) {
        s.classList.remove('active');
      }
    });

    const targetSpread = this.spreads[targetIndex];
    targetSpread.classList.add('active');

    if (animate) {
      this.isAnimating = true;
      this.playPageFlipSound();
      targetSpread.classList.add(isForward ? 'flip-next' : 'flip-prev');

      this.animationTimer = setTimeout(() => {
        targetSpread.classList.remove('flip-next', 'flip-prev');
        this.isAnimating = false;
        this.onSpreadSettled(targetIndex);
      }, 240);
    } else {
      this.isAnimating = false;
      this.onSpreadSettled(targetIndex);
    }

    this.updateControls(targetIndex);
  }

  updateControls(targetIndex) {
    this.currentSpreadIndex = targetIndex;
    const pageStart = targetIndex * 2 + 1;
    const totalPages = this.totalSpreads * 2;
    const pageEnd = Math.min(totalPages, pageStart + 1);

    if (this.prevBtn) {
      this.prevBtn.disabled = (targetIndex === 0);
      this.prevBtn.style.opacity = (targetIndex === 0) ? '0.45' : '1';
      this.prevBtn.style.cursor = (targetIndex === 0) ? 'not-allowed' : 'pointer';
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = (targetIndex === this.totalSpreads - 1);
      this.nextBtn.style.opacity = (targetIndex === this.totalSpreads - 1) ? '0.45' : '1';
      this.nextBtn.style.cursor = (targetIndex === this.totalSpreads - 1) ? 'not-allowed' : 'pointer';
    }
    if (this.spreadSelect) {
      this.spreadSelect.value = String(targetIndex);
    }
    if (this.spreadIndicator) {
      this.spreadIndicator.textContent = `Páginas ${pageStart}-${pageEnd} de ${totalPages}`;
    }
  }

  nextSpread() {
    if (this.currentSpreadIndex < this.totalSpreads - 1) {
      this.goToSpread(this.currentSpreadIndex + 1, true);
    }
  }

  prevSpread() {
    if (this.currentSpreadIndex > 0) {
      this.goToSpread(this.currentSpreadIndex - 1, true);
    }
  }

  onSpreadSettled(spreadIndex) {
    // Scroll al tope de ambas páginas del pliego
    const activePages = this.spreads[spreadIndex].querySelectorAll('.book-page');
    activePages.forEach(p => { p.scrollTop = 0; });

    // Pliego 3 (Índice 2): Mapa Mental
    if (spreadIndex === 2 && !this.mindmapInstance) {
      setTimeout(() => {
        this.mindmapInstance = new InteractiveMindmap('mindmapContainer');
      }, 100);
    }

    // Pliego 7 (Índice 6): Laboratorio GeoGebra (Pág. 13) y Simulador Físico 4-en-1 (Pág. 14)
    if (spreadIndex === 6) {
      setTimeout(() => {
        if (!this.plotterInstances['mainGeoGebra']) {
          this.initMainGeoGebra();
        } else {
          this.plotterInstances['mainGeoGebra'].resize();
        }

        if (!this.simulationInstance) {
          this.initPhysicsSimulation();
        } else {
          this.simulationInstance.setupDPI();
        }
      }, 100);
    }

    this.renderKaTeX();
  }

  // ==========================================================================
  // SECCIÓN: 🌎 ¿DÓNDE ENCONTRAMOS ESTO EN LA VIDA REAL? (MINI-QUIZZES)
  // ==========================================================================
  initRealWorldQuizzes() {
    const quizContainers = document.querySelectorAll('.real-world-quiz');
    quizContainers.forEach(quiz => {
      const optionBtns = quiz.querySelectorAll('.quiz-option-btn');
      const feedbackBox = quiz.querySelector('.quiz-feedback-box');

      optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          // Desactivar botones hermanos
          optionBtns.forEach(b => {
            b.classList.remove('selected-correct', 'selected-incorrect');
          });

          const isCorrect = btn.dataset.correct === 'true';
          const explanation = btn.dataset.explanation || '';

          if (isCorrect) {
            btn.classList.add('selected-correct');
            feedbackBox.className = 'quiz-feedback-box correct';
            feedbackBox.innerHTML = `<strong>✅ ¡Correcto!</strong> ${explanation}`;
          } else {
            btn.classList.add('selected-incorrect');
            feedbackBox.className = 'quiz-feedback-box incorrect';
            feedbackBox.innerHTML = `<strong>❌ Incorrecto.</strong> ${explanation}`;
          }
        });
      });
    });

    // Soporte para pestañas interactivas de casos reales
    document.querySelectorAll('.case-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.book-page');
        if (!parent) return;
        parent.querySelectorAll('.case-tab-btn').forEach(b => b.classList.remove('active'));
        parent.querySelectorAll('.case-content-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.target;
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  // ==========================================================================
  // INICIALIZACIÓN GEOGEBRA Y MODAL
  // ==========================================================================
  initMainGeoGebra() {
    const canvas = document.getElementById('geogebraCanvas');
    if (!canvas) return;

    const plotter = new GeoGebraPlotter(canvas, {
      xLabel: 't (s)',
      yLabel: 'x (m)',
      scaleX: 65,
      scaleY: 60
    });

    this.plotterInstances['mainGeoGebra'] = plotter;

    const zoomInBtn = document.getElementById('geoZoomInBtn');
    const zoomOutBtn = document.getElementById('geoZoomOutBtn');
    const resetBtn = document.getElementById('geoResetBtn');
    const selectBtn = document.getElementById('geoSelectBtn');
    const paletteBtn = document.getElementById('geoPaletteBtn');
    const modalExpandBtn = document.getElementById('geoModalExpandBtn');
    const palettePopup = document.getElementById('geoPalettePopup');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => plotter.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => plotter.zoomOut());
    if (resetBtn) resetBtn.addEventListener('click', () => plotter.resetView());

    if (selectBtn) {
      selectBtn.addEventListener('click', () => {
        plotter.selectedTool = plotter.selectedTool === 'select' ? 'pan' : 'select';
        selectBtn.classList.toggle('active', plotter.selectedTool === 'select');
      });
    }

    if (paletteBtn && palettePopup) {
      paletteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        palettePopup.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!palettePopup.contains(e.target) && e.target !== paletteBtn) {
          palettePopup.classList.remove('open');
        }
      });
    }

    // Colores
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        plotter.setStyles({ curveColor: swatch.dataset.color });
      });
    });

    // Grosor
    const widthSlider = document.getElementById('strokeWidthSlider');
    if (widthSlider) {
      widthSlider.addEventListener('input', (e) => {
        plotter.setStyles({ lineWidth: parseFloat(e.target.value) });
      });
    }

    // Curvas
    const toggleV = document.getElementById('toggleCurveV');
    const toggleA = document.getElementById('toggleCurveA');
    if (toggleV) toggleV.addEventListener('change', (e) => plotter.setStyles({ showVelocity: e.target.checked }));
    if (toggleA) toggleA.addEventListener('change', (e) => plotter.setStyles({ showAcceleration: e.target.checked }));

    // Sliders
    const sliderA = document.getElementById('sliderParamA');
    const sliderOmega = document.getElementById('sliderParamOmega');
    const sliderPhi = document.getElementById('sliderParamPhi');

    const updateParams = () => {
      const A = sliderA ? parseFloat(sliderA.value) : 1.5;
      const omega = sliderOmega ? parseFloat(sliderOmega.value) : 2.0;
      const phi = sliderPhi ? parseFloat(sliderPhi.value) : 0.0;

      const valA = document.getElementById('valParamA');
      const valOmega = document.getElementById('valParamOmega');
      const valPhi = document.getElementById('valParamPhi');

      if (valA) valA.textContent = `${A.toFixed(1)} m`;
      if (valOmega) valOmega.textContent = `${omega.toFixed(1)} rad/s`;
      if (valPhi) valPhi.textContent = `${phi.toFixed(2)} rad`;

      plotter.setParams({ A, omega, phi });
    };

    if (sliderA) sliderA.addEventListener('input', updateParams);
    if (sliderOmega) sliderOmega.addEventListener('input', updateParams);
    if (sliderPhi) sliderPhi.addEventListener('input', updateParams);

    if (modalExpandBtn) {
      modalExpandBtn.addEventListener('click', () => this.openModalWithPlotter(plotter));
    }
  }

  initPhysicsSimulation() {
    this.simulationInstance = new PhysicsOscillatorSimulation('simSpringCanvas', 'simPhasorCanvas');

    const playBtn = document.getElementById('simPlayBtn');
    const resetBtn = document.getElementById('simResetBtn');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const isPlaying = this.simulationInstance.togglePlay();
        playBtn.innerHTML = isPlaying ? '⏸ Pausar' : '▶ Reanudar';
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.simulationInstance.reset());
    }

    // Pestañas de modos de simulación (Masa-Resorte, Osciloscopio MAS, Círculo Fasorial, Péndulo)
    const tabBtns = document.querySelectorAll('.sim-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode || 'spring-phasor';
        this.simulationInstance.setMode(mode);

        const springControls = document.getElementById('simSpringControls');
        const pendControls = document.getElementById('simPendulumControls');
        if (mode === 'pendulum') {
          if (springControls) springControls.style.display = 'none';
          if (pendControls) pendControls.style.display = 'flex';
        } else {
          if (springControls) springControls.style.display = 'flex';
          if (pendControls) pendControls.style.display = 'none';
        }
      });
    });

    const simMass = document.getElementById('simSliderMass');
    const simK = document.getElementById('simSliderK');
    const simA = document.getElementById('simSliderA');
    const simL = document.getElementById('simSliderL');

    const updateSim = () => {
      if (simMass) this.simulationInstance.m = parseFloat(simMass.value);
      if (simK) this.simulationInstance.k = parseFloat(simK.value);
      if (simA) this.simulationInstance.A = parseFloat(simA.value);
      if (simL) this.simulationInstance.pendulumLength = parseFloat(simL.value);

      const valM = document.getElementById('simValMass');
      const valK = document.getElementById('simValK');
      const valA = document.getElementById('simValA');
      const valL = document.getElementById('simValL');

      if (valM) valM.textContent = `${this.simulationInstance.m.toFixed(1)} kg`;
      if (valK) valK.textContent = `${this.simulationInstance.k.toFixed(1)} N/m`;
      if (valA) valA.textContent = `${this.simulationInstance.A.toFixed(1)} m`;
      if (valL) valL.textContent = `${this.simulationInstance.pendulumLength.toFixed(2)} m`;
    };

    if (simMass) simMass.addEventListener('input', updateSim);
    if (simK) simK.addEventListener('input', updateSim);
    if (simA) simA.addEventListener('input', updateSim);
    if (simL) simL.addEventListener('input', updateSim);
  }

  initModal() {
    this.modalOverlay = document.getElementById('geogebraModal');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
    this.modalCanvas = document.getElementById('modalGeoCanvas');

    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) this.closeModal();
      });
    }
  }

  openModalWithPlotter(sourcePlotter) {
    if (!this.modalOverlay || !this.modalCanvas) return;
    this.modalOverlay.classList.add('open');

    if (!this.plotterInstances['modalGeoGebra']) {
      this.plotterInstances['modalGeoGebra'] = new GeoGebraPlotter(this.modalCanvas, {
        scaleX: 80,
        scaleY: 75,
        xLabel: 'Tiempo t (s)',
        yLabel: 'Amplitud (m)'
      });
    }

    const modalPlotter = this.plotterInstances['modalGeoGebra'];
    modalPlotter.setParams(sourcePlotter.params);
    modalPlotter.setStyles(sourcePlotter.styles);
    modalPlotter.resize();
  }

  closeModal() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('open');
    }
  }

  renderKaTeX() {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }
}
