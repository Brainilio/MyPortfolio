import React, { useState, useEffect, useRef } from "react"
import { Switch, Route, useLocation } from "react-router-dom"
// import Rocketship from "./components/rocketship/rocketship"
import * as THREE from "three"
import ReactGA from "react-ga"
import ProjectPage from "./pages/projectpage/ProjectPage"
import ProjectDetail from "./sections/projects/projectDetail"
import Main from "./sections/main"
import Layout from "./layout/Main"
import { Canvas, extend, useFrame, useLoader } from "react-three-fiber"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
// import { OrbitControls, Stars } from "@react-three/drei"
import { Suspense } from "react"
import EarthDayMap from "./resources/textures/8k_earth_daymap.jpg"
import EarthNormalMap from "./resources/textures/8k_earth_normal_map.jpg"
import EarthSpecularMap from "./resources/textures/8k_earth_specular_map.jpg"
import EarthCloudsMap from "./resources/textures/8k_earth_clouds.jpg"
import { TextureLoader } from "three"
// import FallingStars from "./components/falling-stars/fallingStars"

extend({ EffectComposer, RenderPass, UnrealBloomPass })

const ThreeModels = (props) => {
	const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(
		TextureLoader,
		[EarthDayMap, EarthNormalMap, EarthSpecularMap, EarthCloudsMap]
	)
	const earthRef = useRef()
	const cloudsRef = useRef()
	const [space, setSpace] = useState(null)
	// const { camera } = useThree()

	useEffect(() => {
		new GLTFLoader().load("need_some_space/scene.gltf", setSpace)
	}, [])

	// Rotate mesh every frame, this is outside of React without overhead
	useFrame(({ clock }) => {
		const elapsedTime = clock.getElapsedTime()

		if (space) {
			space.scene.rotation.y += 0.00003
			space.scene.position.z += 0.001
		}
		earthRef.current.rotation.y = elapsedTime / 6
		cloudsRef.current.rotation.y = elapsedTime / 6
	})

	return (
		<Suspense>
			{/* <mesh>
				<sphereGeometry
					args={[1, 32, 32]}
					position={[0, 0, 28 - props.posY * 0.0005]}
					rotation={[
						0,
						(earth.scene.rotation.y += props.scrollPos * 0.000002),
						0,
					]}
					receiveShadow
				/>
			</mesh> */}
			<pointLight color="#f6f3ea" position={[2, 0, 5]} intensity={1.2} />

			<mesh ref={cloudsRef} position={[0, 0, 28 - props.posY * 0.0005]}>
				<sphereGeometry args={[1.005, 32, 32]} />
				<meshPhongMaterial
					map={cloudsMap}
					opacity={0.4}
					depthWrite={true}
					transparent={true}
					side={THREE.DoubleSide}
				/>
			</mesh>
			<mesh ref={earthRef} position={[0, 0, 28 - props.posY * 0.0005]}>
				<sphereGeometry args={[1, 32, 32]} />
				<meshPhongMaterial specularMap={specularMap} />
				<meshStandardMaterial map={colorMap} normalMap={normalMap} />
			</mesh>
			{space && (
				<primitive
					receiveShadow
					position={[-100, -180, 100 + props.posY * 0.002]}
					rotation={[0.5, 0, 0]}
					object={space.scene}
				/>
			)}
		</Suspense>
	)
}

const ThreeJsCanvas = () => {
	const [scrollPos, setScrollPos] = useState(0)

	const scrollhandler = () => setScrollPos(window.pageYOffset)

	React.useEffect(() => {
		window.addEventListener("scroll", scrollhandler)
		return () => {
			window.removeEventListener("scroll", scrollhandler)
		}
	}, [])

	return (
		<div className="three-canvas">
			<Canvas camera={{ position: [0, 0, 30] }}>
				<Suspense fallback="">
					<pointLight intensity={2} />
					<spotLight
						intensity={0.5}
						position={[70, 70, 70]}
						penumbra={5}
						color="lightblue"
					/>
					<ambientLight intensity={0.3} />
					<spotLight intensity={1} position={[0, 0, 600]} />
					<ThreeModels scrollPos={scrollPos} posY={scrollPos} />
					{/* <OrbitControls /> */}
				</Suspense>
			</Canvas>
		</div>
	)
}

function App() {
	let location = useLocation()
	ReactGA.initialize(`${process.env.REACT_APP_TRACKING_URL}`)
	ReactGA.pageview("/")

	return (
		<div>
			<ThreeJsCanvas />
			<Layout>
				<Switch location={location}>
					<Route path="/" exact component={Main} />
					<Route path="/projects" component={ProjectPage} />
					<Route path="/project/:name" component={ProjectDetail}></Route>
				</Switch>
			</Layout>
		</div>
	)
}

export default App
