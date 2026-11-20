'use strict';

window.Tuberias3D = (() => {
  const number = value => (typeof value === 'number' || typeof value === 'string' && value.trim() !== '') && Number.isFinite(Number(value)) ? Number(value) : null;
  const normal = v => {
    const len = Math.hypot(...v);
    return len > 0 ? v.map(x => x / len) : [0, 0, 0];
  };
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];

  function reference(level, status, capacity, scale = 10, updated = '') {
    if (status !== 'actual' && status !== 'operando') return null;
    const meters = number(level), height = number(capacity);
    if (meters === null || meters < 0) return null;
    const calibrated = height !== null && height > 0;
    const full = calibrated ? height : scale;
    return {meters, full, calibrated, updated, fill: Math.min(1, meters / full)};
  }

  function frames(points) {
    const path = points.filter((p, i) => !i || p.some((v, k) => Math.abs(v - points[i - 1][k]) > 1e-6));
    if (path.length < 2) return [];
    return path.map((p, i) => {
      const before = path[Math.max(0, i-1)], after = path[Math.min(path.length-1, i+1)];
      const dir = normal(after.map((x, k) => x-before[k]));
      const side = normal(cross(Math.abs(dir[1]) > .999 ? [0,0,1] : [0,1,0], dir));
      return { p, dir, side, up: normal(cross(dir, side)) };
    });
  }

  function waterMesh(out, path, radius, fraction, compact) {
    if (!(fraction > 0) || path.length < 2) return;
    const segments = 20;
    const baseRadius = Math.max(.025, radius - (radius > .3 ? .08 : 0));
    const innerRadius = baseRadius * (.06 + .88 * fraction);
    const color = [.045,.40,.75];
    const emission = .09 + .11 * fraction;
    const vertex = (p,n,distance) => {
      out.push(...p,...n,...color);
      if (!compact) out.push(emission,distance,1,1);
    };
    let previous = null;
    let distance = 0;
    for (let frameIndex = 0; frameIndex < path.length; frameIndex++) {
      const frame = path[frameIndex];
      if (frameIndex) distance += Math.hypot(...frame.p.map((v,k) => v - path[frameIndex - 1].p[k]));
      const ring = Array.from({length:segments}, (_, i) => {
        const angle = 2 * Math.PI * i / segments;
        const x = Math.cos(angle), y = Math.sin(angle);
        const normal = frame.side.map((v,k) => v*x + frame.up[k]*y);
        return {p:frame.p.map((v,k) => v + innerRadius*normal[k]), n:normal};
      });
      if (previous) {
        for (let i = 0; i < segments; i++) {
          const next = (i + 1) % segments;
          const a = previous.ring[i], b = previous.ring[next], c = ring[next], d = ring[i];
          vertex(a.p,a.n,previous.distance);
          vertex(b.p,b.n,previous.distance);
          vertex(c.p,c.n,distance);
          vertex(a.p,a.n,previous.distance);
          vertex(c.p,c.n,distance);
          vertex(d.p,d.n,distance);
        }
      }
      previous = {ring,distance};
    }
  }

  function create(gl, attributes, compact = false) {
    const segments = new Map();
    const buffer = gl.createBuffer();
    let count = 0;
    let last = '';

    function add(id, points, radius, references = [], options = {}) {
      if (!segments.has(id)) segments.set(id, {references, source: options.source || null, flows: [], parts:[], value:null});
      segments.get(id).parts.push({path:frames(points), radius});
    }
    function distanceToPath(x, z, path) {
      let best = Infinity;
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1].p, b = path[i].p, dx = b[0] - a[0], dz = b[2] - a[2], len = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / len));
        best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t));
      }
      return best;
    }
    function attachFlows(meters, maxDistance = 1.6) {
      for (const meter of meters) {
        let best = null, bestDistance = maxDistance;
        for (const s of segments.values()) {
          for (const part of s.parts) {
            for (const [x, z] of meter.points) {
              const d = distanceToPath(x, z, part.path);
              if (d < bestDistance) { bestDistance = d; best = s; }
            }
          }
        }
        if (best && !best.flows.includes(meter.key)) best.flows.push(meter.key);
      }
    }
    function flowValue(s, flowLookup) {
      for (const key of s.flows) {
        const lps = number(flowLookup(key));
        if (lps === null) continue;
        if (lps > 0) return {fill: 1, lps};
      }
      return null;
    }
    function levelValue(s, lookup) {
      const names = s.source ? [s.source, ...s.references.filter(n => n !== s.source)] : s.references;
      let source = null, sourceName = null;
      for (const name of names) {
        const value = lookup ? lookup(name) : null;
        if (value === undefined) continue;
        source = value;
        sourceName = name;
        break;
      }
      if (!source || !(source.fill > .001)) return null;
      for (const name of s.references) {
        if (name !== sourceName && lookup(name) === null) return null;
      }
      return source;
    }
    function update(lookup, flowLookup) {
      const keys = [];
      for (const s of segments.values()) {
        s.value = s.flows.length && flowLookup ? flowValue(s, flowLookup) : levelValue(s, lookup);
        keys.push(s.value ? s.value.fill.toFixed(4) : '?');
      }
      const key = keys.join('|');
      if (key === last) return;
      last = key;
      const data = [];
      for (const s of segments.values()) {
        if (s.value) for (const part of s.parts) waterMesh(data,part.path,part.radius,s.value.fill,compact);
      }
      count = data.length / (compact ? 9 : 13);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);
    }
    function draw() {
      if (!count) return;
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      for (const [index,size,offset] of attributes) {
        if (index < 0) continue;
        gl.enableVertexAttribArray(index);
        gl.vertexAttribPointer(index,size,gl.FLOAT,false,compact ? 36 : 52,offset);
      }
      gl.drawArrays(gl.TRIANGLES,0,count);
    }
    return {add,attachFlows,update,draw};
  }
  return {create,reference};
})();
