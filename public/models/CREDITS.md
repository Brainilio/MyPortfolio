# 3D asset credits

## Rocket
- Creator: Kenney (https://kenney.nl).
- Source: https://kenney.nl/assets/space-kit
- Source download: https://kenney.nl/media/pages/assets/space-kit/20874c75ac-1677698978/kenney_space-kit.zip
- License: CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/
- Changes: assembled rocket_baseA, rocket_sidesA and rocket_topA; flattened, deduplicated, joined compatible primitives, welded, pruned, and Meshopt-compressed into one GLB. No textures or rig.

## Astronaut
- Title/creator: Astronaut by Poly.
- Original source: https://poly.google.com/view/dLHpzNdygsg (historic source).
- Redistribution source: https://modelviewer.dev/shared-assets/models/Astronaut.glb
- License evidence: https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/ATTRIBUTIONS.md
- License: CC BY 2.0, https://creativecommons.org/licenses/by/2.0/
- Changes: flattened and optimized static geometry; texture resized to 1024px and converted to WebP; geometry Meshopt-compressed. No claim of endorsement.
- Attribution is displayed in the About section.

Measured output sizes, triangle counts, and primitive counts are in model-stats.json. Primitive counts do not include the rocket's two instanced exhaust draw calls (four flame cones and 24 fading smoke puffs). Decoder and JavaScript bundle sizes are additional to model bytes.

## Scroll-story prototype
The homepage reuses the same optimized rocket and astronaut in one shared perspective scene. Clouds use a shared procedural texture; stars use one Points draw call; planets are texture-free low-poly geometry. The black-hole ring is procedural. Movement follows scroll, with an explicit 2.3-second ending preview. The prototype does not submit contact messages.

The contact black hole uses an original procedural shader for stylized lensing, a turbulent warm accretion disk, a photon ring and soft analytic glow. One Points draw call animates 240 inward particles. It is an artistic effect, not a physical simulation or a film asset. Only the visible contact chapter runs a continuous animation; reduced motion freezes the effect and disables particle movement.

The current simplified story omits the planet and Nika events. Its rocket stays upright and centered during Projects, then recedes. Boosters use two small rounded flame meshes and one instanced draw call for 24 expanding/fading smoke puffs; there is no arrow/cone trail. Boosters animate only while the rocket is visible and stop for reduced motion.

The opening now uses a procedural Earth horizon (two 64 × 32 sphere meshes, ocean/land/cloud shader and thin blue atmosphere), authored in Three.js without external assets. The hero first zooms its existing mountain photograph, then reveals the cloud ascent. There is no cloud band attached to the hero. Astronaut/rocket entrances are staged outside the camera frame; departure pitches the rocket into depth without scaling its model down.

## Rigged astronaut — evaluated, currently unused
- Creator: Quaternius.
- Source and license: https://poly.pizza/m/3hC2i0CTuO — CC0 1.0.
- Original GLB: https://static.poly.pizza/0076345b-bbea-42d5-931c-4a5ad2050b18.glb
- This is the helmeted human astronaut, replacing the initially evaluated novelty character.
- Changes: retained the 62-joint skeleton shared by four skinned suit parts and Idle, Idle_Neutral, Wave clips; removed unused clips; deduplicated, welded and pruned unused resources; Meshopt compression. No flattening or static joining of the skinned hierarchy.
- Output: `astronaut-rigged.glb`, 423,864 bytes, 10,558 triangles, 13 primitives, no textures. Full statistics in model-stats.json. The rig is slightly over the preferred 60-bone target, with a small total geometry budget.
- Evaluated with a custom skeletal float cycle and a source wave. This model is currently unused; the active story uses the original Poly astronaut.
