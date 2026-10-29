# 3D asset credits

## Rigged astronaut (the Lab, `/journey`)
- Creator: Quaternius.
- Source and license: https://poly.pizza/m/3hC2i0CTuO — CC0 1.0.
- Original GLB: https://static.poly.pizza/0076345b-bbea-42d5-931c-4a5ad2050b18.glb
- This is the helmeted human astronaut, replacing the initially evaluated novelty character.
- Changes: retained the 62-joint skeleton shared by four skinned suit parts and Idle, Idle_Neutral, Wave clips; removed unused clips; deduplicated, welded and pruned unused resources; Meshopt compression. No flattening or static joining of the skinned hierarchy.
- Output: `astronaut-rigged.glb`, 423,864 bytes, 10,558 triangles, 13 primitives, no textures. The rig is slightly over the preferred 60-bone target, with a small total geometry budget.
- Used by the Lab (`/journey`).

## NASA maps (journey prototype, `public/textures/`)
NASA imagery is generally not subject to copyright in the United States; NASA asks for a "NASA" credit and no implied endorsement (per NASA's media usage guidelines). No claim of endorsement.
- `moon-2k.jpg`: NASA Scientific Visualization Studio, CGI Moon Kit, LRO colour map `lroc_color_2k.jpg` (2048 × 1024), https://svs.gsfc.nasa.gov/4720. Unmodified.
- `earth-day-4k.jpg`: NASA Visible Earth, Blue Marble: Next Generation, `world.topo.bathy.200412.3x5400x2700.jpg`, downloaded from https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/. Resized to 4096 × 2048, JPEG quality 70. 4096 px exceeds the 1024 px default because the orbital camera sits close to the surface; shader-side noise adds finer grain.
- `earth-night-2k.jpg`: NASA Earth Observatory, Black Marble 2016, `BlackMarble_2016_01deg.jpg`, downloaded from https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/. Resized to 2048 × 1024, JPEG quality 80.
Originals are kept in the ignored `work/nasa/` folder.

## Floating island hero (the homepage `/`, `public/models/island/`)
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
- `moose.glb` — assembled from "Elk" by Poly by Google, https://poly.pizza/m/bO8XPdrAb5G, CC BY 3.0, and "Moose antlers" by Poly by Google, https://poly.pizza/m/cX6NECw97x7, CC BY 3.0. The elk's antlers removed and its coat darkened, the moose antler palms mounted on its head; texture baked to vertex colours; Meshopt (built by `work/island/moose.mjs`). 2,239 tris, 11 KB.
- `squirrel.glb` — "Squirrel" by Poly by Google, https://poly.pizza/m/caxos24uWC9, CC BY 3.0. Texture baked to vertex colours; Meshopt. 716 tris.
- `rabbit.glb` — "Cottontail rabbit" by Poly by Google, https://poly.pizza/m/3vvONbRCuEF, CC BY 3.0. Texture baked to vertex colours; Meshopt. 954 tris.
- `cougar.glb` — "Cougar" by Poly by Google, https://poly.pizza/m/8nuCN-gn2s-, CC BY 3.0. Texture baked to vertex colours; Meshopt; moves with the shared leg shader. 980 tris, 24 KB.
- `orca.glb` — "Killer Whale" by Poly by Google, https://poly.pizza/m/7pqZEQ9b_E-, CC BY 3.0. Texture baked to vertex colours; Meshopt. 636 tris, 11 KB.
- `sealion.glb` — "Sea lion" by Poly by Google, https://poly.pizza/m/45HRvXYpvUG, CC BY 3.0. Texture baked to vertex colours; Meshopt. 714 tris, 16 KB.
- `kayak.glb` — "Kayak" by Poly by Google, https://poly.pizza/m/6wu_h830iRe, CC BY 3.0. Texture baked to vertex colours; recoloured at runtime; Meshopt. 278 tris, 8 KB.
- `shark.glb` — "Shark" by Quaternius, https://poly.pizza/m/AyHTK3zUSG, CC0 1.0. Swim clip kept; resampled; Meshopt (built by `work/island/shark.mjs`). 644 tris, 24 KB.
- Attribution for the CC BY models above is required wherever the page is published (shown in the Contact section of the homepage). No endorsement implied.
The island terrain, river, waterfall, pines, clouds, birds and the flying eagle, and the prairie's ground, Garden-of-the-Gods sandstone fins, junipers and sagebrush, and the road trip's valley, forest pines, snags, grass, flowers, fences, park signs, hot springs, geyser and fish, and the hike's ranger bear (an original character), mountain, trail, stream, poppies, sun shafts and summit cairn, birds and leaves, and the coast's cliffs, ocean, sea stacks, arch bridge, lighthouse, beam, fog, paddlers and gulls, are procedural (Three.js), with no external assets.
