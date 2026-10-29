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

## NASA maps (journey prototype, `public/textures/`)
NASA imagery is generally not subject to copyright in the United States; NASA asks for a "NASA" credit and no implied endorsement (per NASA's media usage guidelines). No claim of endorsement.
- `moon-2k.jpg`: NASA Scientific Visualization Studio, CGI Moon Kit, LRO colour map `lroc_color_2k.jpg` (2048 × 1024), https://svs.gsfc.nasa.gov/4720. Unmodified.
- `earth-day-4k.jpg`: NASA Visible Earth, Blue Marble: Next Generation, `world.topo.bathy.200412.3x5400x2700.jpg`, downloaded from https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/. Resized to 4096 × 2048, JPEG quality 70. 4096 px exceeds the 1024 px default because the orbital camera sits close to the surface; shader-side noise adds finer grain.
- `earth-night-2k.jpg`: NASA Earth Observatory, Black Marble 2016, `BlackMarble_2016_01deg.jpg`, downloaded from https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/. Resized to 2048 × 1024, JPEG quality 80.
Originals are kept in the ignored `work/nasa/` folder.

## Floating island hero (`/homepage-test`, `public/models/island/`)
All by Quaternius, via Poly Pizza, license CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/). Originals are kept under ignored `work/island/src/`; build script `work/island/build.mjs`.
- `stag.glb` — "Stag", https://poly.pizza/m/tQdzbZ1Cmw. Kept Idle, Eating, Walk, Gallop (dropped other clips and the duplicate `AnimalArmature|` copies); resampled, deduplicated, welded, pruned, Meshopt (high). 3,667 tris, 38 joints.
- `deer.glb` — "Deer", https://poly.pizza/m/T6Cs7tmMHJ. Same processing. 2,096 tris, 46 joints.
- `fox.glb` — "Fox", https://poly.pizza/m/Bc97C66HKi. Same processing. 1,848 tris, 51 joints.
- `kit.glb` — one named node per prop: "Mountains" (https://poly.pizza/m/w9VBrh7Nz0), "Autumn Tree" (https://poly.pizza/m/2lRubrT6Na), "Birch Tree" (https://poly.pizza/m/k6cozoNfLH), "Rock" (https://poly.pizza/m/4MUaQTcDdc), "Rocks" (https://poly.pizza/m/Gl3pcrdnpW). Merged, flattened, joined, welded, pruned, Meshopt. 7,250 tris, 11 primitives, no textures.
- `bear.glb` — "Black bear" by Poly by Google, https://poly.pizza/m/56ym_pyVnel, license CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/). Changes: the 2048px texture was baked into flat per-face vertex colours and removed; welded, pruned, Meshopt. 666 tris. Walk/run is a vertex-shader leg swing (the model has no rig). Build script `work/island/bake.mjs`.
- `eagle.glb` — "Eagle" (bald eagle, perched) by Poly by Google, https://poly.pizza/m/d7CSLvsHULY, license CC BY 3.0. Same texture-to-vertex-colour bake. 499 tris. Used perched; the flying eagle is a procedural stand-in.
- `bison.glb` — "Bison" by Poly by Google, https://poly.pizza/m/9sTrha-TxdS, CC BY 3.0. 2048px texture baked to vertex colours; Meshopt. 1,492 tris. Walk is the shared vertex-shader leg swing.
- `prairiedog.glb` — "Gopher" by Poly by Google, https://poly.pizza/m/2IatILCJa3X, CC BY 3.0, used as a prairie dog. Texture baked to vertex colours. 616 tris.
- `boulder.glb` — "Desert boulder" by Leigh Garland, https://poly.pizza/m/dJvxGOx16m0, CC BY 3.0. Meshopt; recoloured at runtime. 192 tris.
- `hawk.glb` — "Hawk Lp Rigged" by Sherkiz, https://poly.pizza/m/RkN6MEbP6g, CC BY 3.0. Fly clip kept; 1024px texture baked to vertex colours; Meshopt. 9,956 tris, 58 joints.
- `wagon.glb` — "Loaded Wagon" by Eric Wilson, https://poly.pizza/m/2fwnYnnxB9d, CC BY 3.0. Deduplicated, welded, Meshopt; wheels spun in a vertex shader. 3,164 tris, 10 primitives.
- `antelope.glb` — "Antelope" by Poly by Google, https://poly.pizza/m/dC2-G-IF8rz, CC BY 3.0. Texture baked to vertex colours; Meshopt; walks with the shared leg shader. 1,168 tris.
- `wolf.glb` — "Wolf" by Quaternius, https://poly.pizza/m/P1gU3Qkr9r, CC0 1.0. Kept Idle, Walk, Gallop; resampled; Meshopt. 1,962 tris, 51 joints.
- Attribution for the CC BY models above is required wherever the page is published (currently pending on `/homepage-test`). No endorsement implied.
The island terrain, river, waterfall, pines, clouds, birds and the flying eagle, and the prairie's ground, Garden-of-the-Gods sandstone fins, junipers and sagebrush, are procedural (Three.js), with no external assets.
