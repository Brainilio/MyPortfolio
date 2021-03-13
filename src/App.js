import React, { useState, useEffect, useRef, useMemo } from "react"
import Rocketship from "./components/rocketship/rocketship"
import { Switch, Route, useLocation } from "react-router-dom"
import ReactGA from "react-ga"
import ProjectPage from "./pages/projectpage/ProjectPage"
import ProjectDetail from "./sections/projects/projectDetail"
import Main from "./sections/main"
import {
	Canvas,
	extend,
	useFrame,
	useResource,
	useThree,
} from "react-three-fiber"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { Suspense } from "react"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
extend({ EffectComposer, RenderPass, UnrealBloomPass })

function Bloom({ children }) {
	const { gl, camera, size } = useThree()
	const ref = useResource()
	const composer = useRef()
	const aspect = useMemo(() => new THREE.Vector2(size.width, size.height), [
		size,
	])
	useEffect(
		() => void ref.current && composer.current.setSize(size.width, size.height),
		[size]
	)
	return (
		<>
			<scene ref={ref}>{children}</scene>
			<effectComposer ref={composer} args={[gl]}>
				<unrealBloomPass attachArray="passes" args={[aspect, 6, 2, 3]} />
			</effectComposer>
		</>
	)
}

const ThreeModels = (props) => {
	const [moon, setMoon] = useState(null)
	const [space, setSpace] = useState(null)
	const [earth, setEarth] = useState(null)
	const [astro, setAstro] = useState(null)
	const { camera } = useThree()
	const [shouldTurn, setShouldTurn] = useState(false)

	useEffect(() => {
		new GLTFLoader().load("rock/scene.gltf", setMoon)
		new GLTFLoader().load("need_some_space/scene.gltf", setSpace)
		new GLTFLoader().load("planet/scene.gltf", setEarth)
		new GLTFLoader().load("astronaut_helmet/scene.gltf", setAstro)
	}, [])

	// Rotate mesh every frame, this is outside of React without overhead
	useFrame(() => {
		if (earth) {
			earth.scene.rotation.y += 0.002
		}
		if (space) {
			space.scene.rotation.y += 0.00003
			space.scene.position.z += 0.001
		}
		if (astro && !shouldTurn && astro.scene.rotation.y > 2.5) {
			astro.scene.rotation.y -= 0.001
		}

		if (astro && astro.scene.rotation.y <= 2.5) {
			setShouldTurn(true)
		}

		if (astro && shouldTurn && astro.scene.rotation.y < 3.6) {
			astro.scene.rotation.y += 0.001
		}

		if (astro && astro.scene.rotation.y >= 3.6) {
			setShouldTurn(false)
		}
		if (moon) {
			// moon.scene.position.z += 5
		}
	})

	return earth && space && moon && astro ? (
		<>
			<primitive
				receiveShadow
				position={[-100, -180, 100 + props.posY * 0.002]}
				rotation={[0.5, 0, 0]}
				object={space.scene}
			/>

			<primitive
				receiveShadow
				position={[-2, -2.3, 30.5 - props.posY * 0.0005]}
				rotation={[0, 3.6, 6]}
				scale={[0.05, 0.05, 0.05]}
				object={astro.scene}
			/>

			<primitive
				rotation={[0, 0, 0]}
				position={[150, -1200 + props.posY * 0.1, 20]}
				scale={[0.2, 0.2, 0.2]}
				object={moon.scene}
			/>

			<primitive
				position={[0, 0, 28 - props.posY * 0.0005]}
				rotation={[
					0,
					(earth.scene.rotation.y += props.scrollPos * 0.000002),
					0,
				]}
				object={earth.scene}
				castShadow
			/>
		</>
	) : null
}

function App() {
	let location = useLocation()
	const [scrollPos, setScrollPos] = useState(0)
	ReactGA.initialize(`${process.env.REACT_APP_TRACKING_URL}`)
	ReactGA.pageview("/")

	React.useEffect(() => {
		window.addEventListener("scroll", scrollhandler)
		return () => {
			window.removeEventListener("scroll", scrollhandler)
		}
	}, [])

	const scrollhandler = () => setScrollPos(window.pageYOffset)

	return (
		<div>
			<Rocketship />
			<div className="three-canvas">
				<Canvas camera={{ position: [0, 0, 30] }}>
					<Suspense fallback="">
						<OrbitControls />
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
					</Suspense>
				</Canvas>
			</div>
			<Switch location={location}>
				<Route path="/" exact component={Main} />
				<Route path="/projects" component={ProjectPage} />
				<Route path="/project/:name" component={ProjectDetail}></Route>
			</Switch>
		</div>
	)
}

export default App
