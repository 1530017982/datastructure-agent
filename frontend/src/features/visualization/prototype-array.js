// Adapted from prototype01/web/js/arrayView.js (render1D).
// Draw the original SVG axes, ticks and value bars from a workbench snapshot.
const SVG_NS = 'http://www.w3.org/2000/svg';

function svgElement(name, attributes, text) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

const MARKERS = [
  { key: 'left', label: 'L', y: 14 },
  { key: 'right', label: 'R', y: 14 },
  { key: 'mid', label: 'M', y: 34 },
];

function markerIndex(variables, key) {
  if (!variables || (key !== 'mid' && variables.left > variables.right)) return null;
  return variables[key];
}

function markerX(variables, key, center) {
  const index = markerIndex(variables, key);
  if (!Number.isInteger(index)) return null;
  const overlap = key !== 'mid' && variables.left === variables.right;
  return center(index) + (overlap ? (key === 'left' ? -9 : 9) : 0);
}

export function buildPrototypeArrayFrame(step, { previous, enter, reduced }) {
  // Let the shared renderer handle both the no-run state and the empty array.
  if (!step?.array.length) return null;

  const { array, variables, event, result } = step;
  const { left, right } = variables;
  const sorting = step.algorithm === 'bubble-sort';
  const adjacent = previous && Math.abs(previous.stepIndex - step.stepIndex) === 1;
  const swapIndex = !enter && adjacent
    ? (step.stepIndex > previous.stepIndex && event === 'swap' ? variables.index
      : step.stepIndex < previous.stepIndex && previous.event === 'swap' ? previous.variables.index : null)
    : null;
  const count = array.length;
  const spacing = Math.max(26, Math.min(56, Math.floor(640 / count)));
  const padLeft = 34;
  const width = padLeft + spacing * count + 18;
  const height = 202;
  const top = 64;
  const bottom = 158;
  const min = Math.min(0, ...array);
  const max = Math.max(0, ...array);
  const yFor = value => bottom - ((value - min) / (max - min || 1)) * (bottom - top);
  const zero = yFor(0);
  const center = index => padLeft + (index + 0.5) * spacing;

  const chart = svgElement('svg', {
    class: 'prototype-array', width, height, viewBox: `0 0 ${width} ${height}`,
    role: 'img', 'aria-label': '按数值绘制的数组柱形图',
  });
  const xEnd = width - 10;
  chart.append(
    svgElement('path', {
      class: 'prototype-array-axis',
      d: `M ${padLeft} ${zero} H ${xEnd} m -4 -4 l 4 4 -4 4 M ${padLeft} ${bottom} V ${top - 6} m -4 4 l 4 -4 4 4`,
    }),
    svgElement('text', { x: xEnd - 4, y: zero - 9 }, 'X'),
    svgElement('text', { x: padLeft - 10, y: top - 2 }, 'Y'),
  );

  const barWidth = spacing * 0.6;
  array.forEach((value, index) => {
    const x = center(index);
    const y = yFor(value);
    const excluded = !sorting && (index < left || index > right);
    const cell = svgElement('g', { class: 'prototype-array-cell', 'data-index': index });
    if (excluded) cell.classList.add('is-excluded');
    if (index === variables.mid) cell.classList.add('is-mid');
    if (event === 'found' && index === result) cell.classList.add('is-found');
    if (sorting) {
      if (index >= variables.sortedFrom) cell.classList.add('is-sorted');
      if (variables.index !== null && (index === variables.index || index === variables.index + 1)) {
        cell.classList.add('is-comparing');
      }
    }

    const label = String(value);
    const valueLabel = svgElement('text', { class: 'prototype-array-value', x, y: value < 0 ? y + 13 : y - 6 }, label);
    if (label.length > Math.floor((spacing - 4) / 6)) {
      valueLabel.setAttribute('textLength', String(spacing - 4));
      valueLabel.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    const valueMark = svgElement('g', {});
    valueMark.append(
      svgElement('rect', {
        x: x - barWidth / 2, y: value === 0 ? zero - 2 : Math.min(y, zero),
        width: barWidth, height: Math.max(2, Math.abs(zero - y)), rx: 2,
      }),
      valueLabel,
    );
    cell.append(
      valueMark,
      svgElement('path', { class: 'prototype-array-axis', d: `M ${x} ${zero} v 4` }),
      svgElement('text', { x, y: 187 }, index),
    );
    chart.append(cell);

    const wasExcluded = !sorting && previous && (index < previous.variables.left || index > previous.variables.right);
    if (enter || (previous && excluded !== wasExcluded) || cell.classList.contains('is-found')) {
      if (!reduced) cell.animate([{ opacity: enter || !excluded ? 0.2 : 1 }, { opacity: excluded ? 0.4 : 1 }], {
        duration: 260, easing: 'ease-out', delay: enter ? (index % 8) * 35 : 0,
      });
    }
    if (!reduced && swapIndex !== null && (index === swapIndex || index === swapIndex + 1)) {
      const offset = index === swapIndex ? spacing : -spacing;
      valueMark.animate([{ transform: `translateX(${offset}px)` }, { transform: 'translateX(0)' }], {
        duration: 320, easing: 'ease-out',
      });
    }
  });

  for (const { key, label, y } of MARKERS) {
    const x = markerX(variables, key, center);
    if (x === null) continue;
    const marker = svgElement('g', { class: `prototype-marker is-${key}`, 'data-ptr': key });
    marker.append(
      svgElement('rect', { x: x - 8, y: y - 9, width: 16, height: 16, rx: 4 }),
      svgElement('text', { x, y: y + 2 }, label),
    );
    chart.append(marker);
    const from = enter ? null : markerX(previous?.variables, key, center);
    if (!reduced && from !== x) {
      const start = from === null ? { opacity: 0 } : { transform: `translateX(${from - x}px)` };
      marker.animate([start, { opacity: 1, transform: 'translateX(0)' }], { duration: 260, easing: 'ease-out' });
    }
  }

  return { cells: [chart], pointers: new Map() };
}
