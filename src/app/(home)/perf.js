// Adaptive resolution: watches a scene's frame time while it renders and nudges the renderer's pixel ratio down a
// step when frames keep running long (under ~48 fps for two windows in a row) and back up only after a sustained run
// of fast frames (over ~70 fps for four windows), between a floor and the usual cap. Each change resizes the canvas,
// so it's kept rare (that hysteresis) and never happens during a section hand-off, where it would flash.
export function adaptivePixelRatio(renderer, { max = 1.5, min = .85, onChange } = {}) {
  const ceiling = () => Math.min(window.devicePixelRatio || 1, max);
  let ratio = ceiling(), time = 0, frames = 0, slow = 0, fast = 0;
  renderer.setPixelRatio(ratio);
  return (dt, steady = true) => {
    time += dt; frames++;
    if (time < 1.5) return;
    const average = time / frames; time = 0; frames = 0;
    slow = average > 1 / 48 ? slow + 1 : 0; fast = average < 1 / 70 ? fast + 1 : 0;
    if (!steady) return;
    let next = ratio;
    if (slow >= 2) { next = Math.max(min, ratio - .15); slow = 0; }
    else if (fast >= 4) { next = Math.min(ceiling(), ratio + .1); fast = 0; }
    if (Math.abs(next - ratio) > .01) { ratio = next; renderer.setPixelRatio(ratio); onChange?.(); }
  };
}

// Moves a point by less than one shadow-map texel so that a shadow camera following it (along a fixed light
// direction) always lands on the texel grid: without this, shadow edges crawl and shimmer as the camera moves.
const UP = { x: 0, y: 1, z: 0 };
export function snapToTexels(point, direction, texel) {
  const dx = direction.x, dy = direction.y, dz = direction.z;
  let rx = UP.y * dz - UP.z * dy, ry = UP.z * dx - UP.x * dz, rz = UP.x * dy - UP.y * dx;
  const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl;
  const ux = dy * rz - dz * ry, uy = dz * rx - dx * rz, uz = dx * ry - dy * rx;
  const a = point.x * rx + point.y * ry + point.z * rz, b = point.x * ux + point.y * uy + point.z * uz;
  const da = Math.round(a / texel) * texel - a, db = Math.round(b / texel) * texel - b;
  point.x += rx * da + ux * db; point.y += ry * da + uy * db; point.z += rz * da + uz * db;
  return point;
}
