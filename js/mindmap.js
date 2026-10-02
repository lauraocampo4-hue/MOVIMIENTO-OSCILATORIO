/**
 * MINDMAP JS - MAPA MENTAL CONCEPTUAL INTERACTIVO EN SVG (EDICIÓN CORREGIDA FULL VIEW)
 * Diagrama de red cognitiva con escala optimizada para pantalla completa sin recortes.
 * 
 * Autoras: Danna Arias y Laura Ocampo - Universidad Tecnológica de Pereira
 */

class InteractiveMindmap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.nodes = [
      // Nodo Central
      {
        id: 'root',
        label: 'Movimiento Oscilatorio y MAS',
        x: 460,
        y: 250,
        type: 'root',
        color: '#8b4f8c',
        desc: 'Fenómeno mecánico periódico donde un sistema oscila en torno a un punto de equilibrio estable bajo una fuerza restauradora conservativa.'
      },

      // 9 Ramas Principales con coordenadas optimizadas (sin salirse de los límites)
      {
        id: 'periodico',
        parent: 'root',
        label: '1. Movimiento Periódico',
        x: 180,
        y: 85,
        type: 'branch',
        color: '#2563eb',
        desc: 'Movimiento que se repite idénticamente a intervalos constantes de tiempo T. Todo MAS es periódico, pero no todo periódico es armónico.'
      },
      {
        id: 'elongacion',
        parent: 'root',
        label: '2. Elongación (x)',
        x: 460,
        y: 75,
        type: 'branch',
        color: '#7c3aed',
        desc: 'Posición instantánea de la partícula respecto al centro de equilibrio en cualquier instante t. Unidad SI: metro [m].'
      },
      {
        id: 'amplitud',
        parent: 'root',
        label: '3. Amplitud (A)',
        x: 730,
        y: 85,
        type: 'branch',
        color: '#d97706',
        desc: 'Máximo desplazamiento desde el equilibrio: A = |x_max|. Es siempre un escalar positivo. Unidad SI: metro [m].'
      },
      {
        id: 'periodo',
        parent: 'root',
        label: '4. Periodo (T)',
        x: 760,
        y: 200,
        type: 'branch',
        color: '#059669',
        desc: 'Tiempo necesario para completar un ciclo completo de ida y vuelta: T = 2π/ω = 2π√(m/k). Unidad SI: segundo [s].'
      },
      {
        id: 'frecuencia',
        parent: 'root',
        label: '5. Frecuencia (f)',
        x: 760,
        y: 320,
        type: 'branch',
        color: '#0891b2',
        desc: 'Número de oscilaciones completas por segundo: f = 1/T = ω/(2π). Unidad SI: Hertz [Hz = s⁻¹].'
      },
      {
        id: 'frec_angular',
        parent: 'root',
        label: '6. Frecuencia Angular (ω)',
        x: 670,
        y: 430,
        type: 'branch',
        color: '#dc2626',
        desc: 'Velocidad angular del fasor asociado: ω = 2π f = √(k/m). Determina la rapidez de oscilación. Unidad SI: [rad/s].'
      },
      {
        id: 'mas',
        parent: 'root',
        label: '7. M.A.S. (Hooke)',
        x: 460,
        y: 430,
        type: 'branch',
        color: '#9333ea',
        desc: 'Movimiento rectilíneo bajo una fuerza restauradora elástica proporcional y opuesta a la posición: F = -kx.'
      },
      {
        id: 'cinematica',
        parent: 'root',
        label: '8. Cinemática',
        x: 250,
        y: 430,
        type: 'branch',
        color: '#c026d3',
        desc: 'Ecuaciones analíticas: x(t)=A·cos(ωt+φ), v(t)=-ωA·sen(ωt+φ) y a(t)=-ω²x(t).'
      },
      {
        id: 'aplicaciones',
        parent: 'root',
        label: '9. Aplicaciones Reales',
        x: 150,
        y: 220,
        type: 'branch',
        color: '#4f46e5',
        desc: 'Amortiguadores vehiculares, péndulos sintonizados antisísmicos (Taipei 101), sismógrafos y diseño estructural.'
      },

      // Hojas de profundización matemática
      {
        id: 'sub_hooke',
        parent: 'mas',
        label: 'F = -k x',
        x: 390,
        y: 495,
        type: 'leaf',
        color: '#9333ea',
        desc: 'Ley de Hooke: la fuerza elástica siempre apunta hacia el origen restaurador.'
      },
      {
        id: 'sub_edo',
        parent: 'mas',
        label: 'ẍ + ω²x = 0',
        x: 530,
        y: 495,
        type: 'leaf',
        color: '#9333ea',
        desc: 'Ecuación diferencial lineal homogénea de segundo orden del MAS.'
      },
      {
        id: 'sub_desfase',
        parent: 'cinematica',
        label: 'Desfases: π/2 y π',
        x: 140,
        y: 490,
        type: 'leaf',
        color: '#c026d3',
        desc: 'La velocidad adelanta en 90° (π/2) a la posición; la aceleración está desfasada 180° (π).'
      },
      {
        id: 'sub_formula_t',
        parent: 'periodo',
        label: 'T = 1 / f',
        x: 820,
        y: 260,
        type: 'leaf',
        color: '#059669',
        desc: 'Relación recíproca exacta entre el periodo temporal y la frecuencia cíclica.'
      }
    ];

    this.render();
  }

  render() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 920 540');
    svg.setAttribute('class', 'mindmap-svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';

    // Capa de enlaces
    const linksGroup = document.createElementNS(svgNS, 'g');
    linksGroup.setAttribute('class', 'mindmap-links-layer');

    // Capa de nodos
    const nodesGroup = document.createElementNS(svgNS, 'g');
    nodesGroup.setAttribute('class', 'mindmap-nodes-layer');

    const nodeMap = {};
    this.nodes.forEach(n => { nodeMap[n.id] = n; });

    // Enlaces con curvas Bezier suaves
    this.nodes.forEach(node => {
      if (node.parent && nodeMap[node.parent]) {
        const p = nodeMap[node.parent];
        const path = document.createElementNS(svgNS, 'path');
        const mx = (node.x + p.x) / 2;
        const my = (node.y + p.y) / 2;
        const d = `M ${p.x} ${p.y} Q ${mx} ${p.y}, ${node.x} ${node.y}`;
        path.setAttribute('d', d);
        path.setAttribute('class', 'mindmap-link');
        path.setAttribute('stroke', node.color);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-width', node.type === 'leaf' ? '1.6' : '2.4');
        path.setAttribute('stroke-dasharray', node.type === 'leaf' ? '4,4' : 'none');
        path.setAttribute('opacity', '0.6');
        linksGroup.appendChild(path);
      }
    });

    // Nodos interactivos
    this.nodes.forEach(node => {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', `mindmap-node ${node.type}`);
      g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      g.style.cursor = 'pointer';

      const rect = document.createElementNS(svgNS, 'rect');
      let w = 150, h = 34;
      if (node.type === 'root') { w = 270; h = 48; }
      else if (node.type === 'branch') { w = 160; h = 34; }
      else if (node.type === 'leaf') { w = 115; h = 26; }

      rect.setAttribute('x', -w / 2);
      rect.setAttribute('y', -h / 2);
      rect.setAttribute('width', w);
      rect.setAttribute('height', h);
      rect.setAttribute('rx', node.type === 'root' ? 16 : 9);
      rect.setAttribute('ry', node.type === 'root' ? 16 : 9);

      if (node.type === 'root') {
        rect.setAttribute('fill', '#8b4f8c');
        rect.setAttribute('stroke', '#5c225e');
        rect.setAttribute('stroke-width', '2.5');
      } else {
        rect.setAttribute('fill', '#ffffff');
        rect.setAttribute('stroke', node.color);
        rect.setAttribute('stroke-width', node.type === 'branch' ? '2' : '1.5');
      }
      rect.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(78,42,85,0.12))');
      g.appendChild(rect);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.textContent = node.label;
      if (node.type === 'root') {
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '13.5');
        text.setAttribute('font-weight', '800');
        text.setAttribute('font-family', 'Outfit, sans-serif');
      } else if (node.type === 'branch') {
        text.setAttribute('fill', '#2d1a33');
        text.setAttribute('font-size', '10.5');
        text.setAttribute('font-weight', '700');
        text.setAttribute('font-family', 'Outfit, sans-serif');
      } else {
        text.setAttribute('fill', node.color);
        text.setAttribute('font-size', '9.5');
        text.setAttribute('font-weight', '600');
        text.setAttribute('font-family', 'JetBrains Mono, monospace');
      }
      g.appendChild(text);

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showNodeInfo(node);
      });
      g.addEventListener('mouseenter', () => {
        rect.setAttribute('stroke-width', '3.2');
      });
      g.addEventListener('mouseleave', () => {
        rect.setAttribute('stroke-width', node.type === 'branch' ? '2' : (node.type === 'root' ? '2.5' : '1.5'));
      });

      nodesGroup.appendChild(g);
    });

    svg.appendChild(linksGroup);
    svg.appendChild(nodesGroup);

    this.container.innerHTML = '';
    this.container.appendChild(svg);

    // Contenedor de telemetría flotante superior / inferior seguro
    this.infoBox = document.createElement('div');
    this.infoBox.className = 'mindmap-info-pill';
    this.infoBox.style.cssText = `
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px);
      padding: 6px 16px;
      border-radius: 20px;
      border: 1.5px solid var(--primary-accent);
      box-shadow: 0 4px 14px rgba(78, 42, 85, 0.12);
      font-size: 0.82rem;
      color: #3b1d42;
      font-weight: 600;
      transition: all 0.2s ease;
      text-align: center;
      max-width: 90%;
      z-index: 25;
      pointer-events: none;
    `;
    this.infoBox.innerHTML = '💡 <em>Haz clic en cualquier nodo para ver su concepto físico</em>';
    this.container.appendChild(this.infoBox);
  }

  showNodeInfo(node) {
    this.infoBox.innerHTML = `<strong style="color:${node.color}">${node.label}:</strong> ${node.desc}`;
    this.infoBox.style.borderColor = node.color;
  }
}

window.InteractiveMindmap = InteractiveMindmap;
