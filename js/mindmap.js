/**
 * MINDMAP JS - MAPA MENTAL CONCEPTUAL INTERACTIVO EN SVG
 * Diagrama de red cognitiva de alta resolución para Movimiento Oscilatorio y MAS.
 * 
 * Requerimiento 13:
 * Nodo central: Movimiento Oscilatorio y MAS
 * Ramas:
 * 1. Movimiento periódico
 * 2. Amplitud
 * 3. Elongación
 * 4. Periodo
 * 5. Frecuencia
 * 6. Frecuencia angular
 * 7. MAS
 * 8. Cinemática
 * 9. Aplicaciones
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
        x: 410,
        y: 240,
        type: 'root',
        color: '#8b4f8c',
        desc: 'Fenómeno mecánico periódico donde un sistema oscila en torno a un punto de equilibrio estable bajo la acción de una fuerza restauradora elástica.'
      },

      // 9 Ramas Principales solicitadas
      {
        id: 'periodico',
        parent: 'root',
        label: '1. Movimiento Periódico',
        x: 170,
        y: 70,
        type: 'branch',
        color: '#2563eb',
        desc: 'Movimiento que se repite idénticamente en intervalos regulares de tiempo T. Todo movimiento oscilatorio es periódico, pero no todo periódico es oscilatorio.'
      },
      {
        id: 'elongacion',
        parent: 'root',
        label: '2. Elongación (x)',
        x: 410,
        y: 60,
        type: 'branch',
        color: '#7c3aed',
        desc: 'Posición vectorial instantánea de la partícula respecto al punto de equilibrio en cualquier instante de tiempo t. Unidad SI: metro [m].'
      },
      {
        id: 'amplitud',
        parent: 'root',
        label: '3. Amplitud (A)',
        x: 650,
        y: 70,
        type: 'branch',
        color: '#d97706',
        desc: 'Máximo desplazamiento que alcanza la partícula desde su equilibrio: A = |x_max|. Es siempre un escalar estrictamente positivo.'
      },
      {
        id: 'periodo',
        parent: 'root',
        label: '4. Periodo (T)',
        x: 710,
        y: 180,
        type: 'branch',
        color: '#059669',
        desc: 'Tiempo empleado en completar un ciclo u oscilación de ida y vuelta. En el sistema masa-resorte: T = 2π√(m/k). Unidad SI: segundo [s].'
      },
      {
        id: 'frecuencia',
        parent: 'root',
        label: '5. Frecuencia (f)',
        x: 710,
        y: 310,
        type: 'branch',
        color: '#0891b2',
        desc: 'Número de oscilaciones completas efectuadas en cada unidad de tiempo: f = 1/T. Unidad SI: Hertz [Hz = s⁻¹].'
      },
      {
        id: 'frec_angular',
        parent: 'root',
        label: '6. Frecuencia Angular (ω)',
        x: 580,
        y: 410,
        type: 'branch',
        color: '#dc2626',
        desc: 'Rapidez de rotación del vector fasor asociado: ω = 2π f = 2π/T = √(k/m). Unidad SI: rad/s.'
      },
      {
        id: 'mas',
        parent: 'root',
        label: '7. M.A.S. (Hooke)',
        x: 410,
        y: 425,
        type: 'branch',
        color: '#9333ea',
        desc: 'Movimiento oscilatorio rectilíneo originado por una fuerza conservativa proporcional y opuesta a la elongación: F = -kx.'
      },
      {
        id: 'cinematica',
        parent: 'root',
        label: '8. Cinemática',
        x: 230,
        y: 410,
        type: 'branch',
        color: '#c026d3',
        desc: 'Ecuaciones temporales continuas: Posición x(t)=A·cos(ωt+φ), Velocidad v(t)=-ωA·sin(ωt+φ) y Aceleración a(t)=-ω²x(t).'
      },
      {
        id: 'aplicaciones',
        parent: 'root',
        label: '9. Aplicaciones Reales',
        x: 110,
        y: 220,
        type: 'branch',
        color: '#4f46e5',
        desc: 'Sistemas de suspensión automotriz, sintonizadores antisísmicos en rascacielos (Taipei 101), maquinaria industrial, relojes y acústica musical.'
      },

      // Hojas explicativas de profundización
      {
        id: 'sub_hooke',
        parent: 'mas',
        label: 'F = -k x',
        x: 410,
        y: 470,
        type: 'leaf',
        color: '#9333ea',
        desc: 'Ley de Hooke: rigidez elástica que siempre apunta hacia el centro de equilibrio.'
      },
      {
        id: 'sub_edo',
        parent: 'mas',
        label: 'ẍ + ω²x = 0',
        x: 510,
        y: 460,
        type: 'leaf',
        color: '#9333ea',
        desc: 'Ecuación diferencial lineal homogénea fundamental de la oscilación libre.'
      },
      {
        id: 'sub_desfase',
        parent: 'cinematica',
        label: 'Desfases: π/2 y π',
        x: 100,
        y: 350,
        type: 'leaf',
        color: '#c026d3',
        desc: 'La velocidad adelanta en 90° a la posición; la aceleración se encuentra en oposición exacta de fase (180°).'
      },
      {
        id: 'sub_formula_t',
        parent: 'periodo',
        label: 'T = 1 / f',
        x: 770,
        y: 240,
        type: 'leaf',
        color: '#059669',
        desc: 'Relación recíproca exacta entre el período temporal y la frecuencia cíclica.'
      }
    ];

    this.render();
  }

  render() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 830 500');
    svg.setAttribute('class', 'mindmap-svg');
    svg.style.width = '100%';
    svg.style.height = '100%';

    // Capa de conexiones
    const linksGroup = document.createElementNS(svgNS, 'g');
    linksGroup.setAttribute('class', 'mindmap-links-layer');

    // Capa de nodos
    const nodesGroup = document.createElementNS(svgNS, 'g');
    nodesGroup.setAttribute('class', 'mindmap-nodes-layer');

    const nodeMap = {};
    this.nodes.forEach(n => { nodeMap[n.id] = n; });

    // Dibujar enlaces curvas Bezier suaves
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
        path.setAttribute('stroke-width', node.type === 'leaf' ? '1.5' : '2.2');
        path.setAttribute('stroke-dasharray', node.type === 'leaf' ? '4,4' : 'none');
        path.setAttribute('opacity', '0.55');
        linksGroup.appendChild(path);
      }
    });

    // Dibujar nodos interactivos
    this.nodes.forEach(node => {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', `mindmap-node ${node.type}`);
      g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      g.style.cursor = 'pointer';

      const rect = document.createElementNS(svgNS, 'rect');
      let w = 150, h = 34;
      if (node.type === 'root') { w = 270; h = 48; }
      else if (node.type === 'branch') { w = 160; h = 36; }
      else if (node.type === 'leaf') { w = 110; h = 26; }

      rect.setAttribute('x', -w / 2);
      rect.setAttribute('y', -h / 2);
      rect.setAttribute('width', w);
      rect.setAttribute('height', h);
      rect.setAttribute('rx', node.type === 'root' ? 16 : 10);
      rect.setAttribute('ry', node.type === 'root' ? 16 : 10);

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
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', '700');
        text.setAttribute('font-family', 'Outfit, sans-serif');
      } else {
        text.setAttribute('fill', node.color);
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', '600');
        text.setAttribute('font-family', 'JetBrains Mono, monospace');
      }
      g.appendChild(text);

      // Evento de interacción al hacer clic o hover
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showNodeInfo(node);
      });
      g.addEventListener('mouseenter', () => {
        rect.setAttribute('stroke-width', '3');
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

    // Contenedor flotante de telemetría conceptual
    this.infoBox = document.createElement('div');
    this.infoBox.className = 'mindmap-info-pill';
    this.infoBox.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px);
      padding: 8px 18px;
      border-radius: 20px;
      border: 1.5px solid var(--primary-accent);
      box-shadow: 0 4px 16px rgba(78, 42, 85, 0.15);
      font-size: 0.84rem;
      color: #3b1d42;
      font-weight: 600;
      transition: all 0.25s ease;
      text-align: center;
      max-width: 92%;
      z-index: 20;
    `;
    this.infoBox.innerHTML = '💡 <em>Haz clic en cualquier rama o nodo para ver su fundamento físico</em>';
    this.container.appendChild(this.infoBox);
  }

  showNodeInfo(node) {
    this.infoBox.innerHTML = `<strong style="color:${node.color}">${node.label}:</strong> ${node.desc}`;
    this.infoBox.style.borderColor = node.color;
    this.infoBox.style.transform = 'translateX(-50%) scale(1.02)';
    setTimeout(() => {
      this.infoBox.style.transform = 'translateX(-50%) scale(1)';
    }, 200);
  }
}

window.InteractiveMindmap = InteractiveMindmap;
