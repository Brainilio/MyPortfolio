# Portfolio project guidance

## Scope and workflow
- Active project: this `MyPortfolio2022` checkout. Preserve unrelated local edits and archived sources.
- Keep design changes focused and incremental. Use Inter, natural heading spacing, violet accents, and the shared maximum content width.
- Use Iconbuddy's approved project assignments before searching; save semantic assignments and audit icon changes.
- Verify production changes with `npm run build` and inspect affected desktop/mobile layouts.

## Three.js and 3D models
Applies whenever adding or changing models, loaders, WebGL scenes, or animation in this project.

### Source and prepare
- Prefer lightweight, freely usable glTF 2.0 assets from an identifiable creator/platform. Verify each model's license; a free download alone is not a license.
- Ship self-contained `.glb` assets under `public/models/`; record author, source, license, modifications, and measured statistics in that directory.
- Keep downloaded source packs and temporary optimization dependencies under ignored `work/`; do not ship whole packs or add asset-processing tools to browser dependencies.
- Inspect models before integration: triangles, primitive/material count (potential draw calls), texture dimensions, animations, and required extensions.
- Aim well below 50,000 triangles and 10–20 draw calls per model, with lower budgets on mobile. These are ceilings, not goals.
- Default textures to at most 1024px; use 2048px only when the visual benefit is demonstrated. Avoid unnecessary rigs; prefer fewer than 30–60 bones if a rig is needed.
- Use glTF Transform to flatten static hierarchies, deduplicate, join compatible geometry, weld, prune unused data, and consolidate buffers before packing GLB.
- Prefer Meshopt geometry compression for small fast-decoding assets. Register `MeshoptDecoder` with `GLTFLoader`.
- Draco is an alternative; use `DRACOLoader` when the asset requires it. Never enable compression without its matching decoder.
- For large textured assets, evaluate KTX2/Basis plus `KTX2Loader.detectSupport(renderer)` for GPU-compressed textures. WebP/JPEG reduces transfer bytes but still decodes to uncompressed GPU texture memory.
- Do not add heavy codecs solely to save a few bytes on an already tiny asset. Compare transfer size, decode cost, and visual quality.

### Render and animate
- Prefer baked/unlit or matcap materials where appropriate. Use simple PBR lighting only when it materially improves the appearance; avoid expensive transmission, real-time shadows, and postprocessing for decorative elements.
- Cap renderer pixel ratio (normally 1–1.5 for decorative overlays, at most 2 for focused previews). Resize using the actual host dimensions.
- Lazy-load decorative assets near their section. Render on demand for scroll-driven movement; do not run a permanent frame loop for a scene that changes only on scroll.
- Pause rendering while offscreen or the document is hidden. Respect `prefers-reduced-motion`, including changes during the session.
- Drive scroll animations from normalized section progress, not elapsed time. Scrolling backward must reverse the path; resizing must preserve its layout.
- Keep decorative canvases `aria-hidden` and `pointer-events:none`; never block links, text selection, touch scrolling, or keyboard access.
- Smooth pointer tracking without React state updates per frame. Remove all observers, listeners, and animation callbacks on unmount.
- Dispose geometries, materials, textures, environment render targets, controls, and renderers; handle models arriving after unmount.
- Use InstancedMesh for repeated identical meshes and LOD for genuinely complex/distant content, not by default for a single tiny rocket.
- Profile actual frames/draw calls/texture memory on representative mobile and desktop hardware. Do not claim locked 60/120 FPS without measurement.

### Current assets
- `public/models/rocket.glb`: Kenney Space Kit rocket parts, CC0; assembled/optimized; see `CREDITS.md` and `model-stats.json`.
- `public/models/astronaut.glb`: Astronaut by Poly, CC BY 2.0, from Google's model-viewer shared assets; optimized with a 1024px WebP texture and Meshopt.
- Retain required visible attribution when redistributing CC BY models.

References: https://gltf-transform.dev/cli and https://threejs.org/docs/pages/GLTFLoader.html
