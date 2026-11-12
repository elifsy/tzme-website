const NS = 'http://www.w3.org/2000/svg';
const fixed = value => Number(value.toFixed(3));

// A short cloth ribbon, split into lit surfaces so a half turn visibly twists it.
export function createBadgeRibbon(svg) {
  const group = svg.querySelector('[data-ribbon-faces]');
  const texture = svg.querySelector('[data-ribbon-texture]');
  const edges = [...svg.querySelectorAll('[data-ribbon-edge]')];
  const seams = [...svg.querySelectorAll('[data-ribbon-seam]')];
  const label = svg.querySelector('[data-ribbon-label]');
  const shadow = svg.querySelector('[data-ribbon-shadow]');
  const count = 24;
  const faces = Array.from({ length: count }, () => {
    const face = document.createElementNS(NS, 'path');
    face.setAttribute('stroke-width', '.35');
    face.setAttribute('stroke-linejoin', 'round');
    group.appendChild(face);
    return face;
  });
  function draw(end, roll, flip) {
    const radians = roll * Math.PI / 180;
    const length = Math.max(5, Math.hypot(end.x - 44, end.y + 4));
    const handle = Math.min(12, length * .36);
    const p0 = { x: 44, y: -4 }, p1 = { x: 44, y: 4 };
    const p2 = { x: end.x + Math.sin(radians) * handle, y: end.y - Math.cos(radians) * handle };
    function sample(t) {
      const q = 1 - t;
      const x = q ** 3 * p0.x + 3 * q * q * t * p1.x + 3 * q * t * t * p2.x + t ** 3 * end.x;
      const y = q ** 3 * p0.y + 3 * q * q * t * p1.y + 3 * q * t * t * p2.y + t ** 3 * end.y;
      const dx = 3 * q * q * (p1.x - p0.x) + 6 * q * t * (p2.x - p1.x) + 3 * t * t * (end.x - p2.x);
      const dy = 3 * q * q * (p1.y - p0.y) + 6 * q * t * (p2.y - p1.y) + 3 * t * t * (end.y - p2.y);
      const magnitude = Math.hypot(dx, dy) || 1;
      const twist = flip * Math.PI / 180 * t ** 1.7;
      const cosine = Math.cos(twist), width = (Math.abs(cosine) < .045 ? Math.sign(cosine || 1) * .045 : cosine) * 6.5;
      const nx = dy / magnitude, ny = -dx / magnitude;
      return { x, y, nx, ny, cosine, twist, left: [x - nx * width, y - ny * width], right: [x + nx * width, y + ny * width] };
    }
    const points = Array.from({ length: count + 1 }, (_, i) => sample(i / count));
    const commands = [];
    for (let i = 0; i < count; i++) {
      const a = points[i], b = points[i + 1];
      const d = `M${a.left.map(fixed)}L${a.right.map(fixed)}L${b.right.map(fixed)}L${b.left.map(fixed)}Z`;
      const light = .66 + Math.abs(a.cosine) * .3 + Math.sin(a.twist + .5) * .1;
      const color = `rgb(${Math.round(17 * light)},${Math.round(114 * light)},${Math.round(127 * light)})`;
      faces[i].setAttribute('d', d); faces[i].setAttribute('fill', color); faces[i].setAttribute('stroke', color);
      commands.push(d);
    }
    texture.setAttribute('d', commands.join(''));
    const line = (side, inset = 1) => points.map((p, i) => {
      const edge = p[side];
      return `${i ? 'L' : 'M'}${fixed(p.x + (edge[0] - p.x) * inset)},${fixed(p.y + (edge[1] - p.y) * inset)}`;
    }).join('');
    edges.forEach((edge, i) => edge.setAttribute('d', line(i ? 'right' : 'left')));
    seams.forEach((seam, i) => seam.setAttribute('d', line(i ? 'right' : 'left', .76)));
    shadow.setAttribute('d', `M44 -4C44 4 ${fixed(p2.x)} ${fixed(p2.y)} ${fixed(end.x)} ${fixed(end.y)}`);
    const printed = sample(.45), angle = Math.atan2(printed.ny, printed.nx) * 180 / Math.PI;
    label.setAttribute('transform', `translate(${fixed(printed.x)} ${fixed(printed.y)}) rotate(${fixed(angle)}) scale(${fixed(Math.max(.08, Math.abs(printed.cosine)))} 1)`);
    label.setAttribute('opacity', String(fixed(.9 - Math.sin(printed.twist) ** 2 * .16)));
  }
  return { draw, dispose: () => faces.forEach(face => face.remove()) };
}
