import React, { useState, useEffect } from "react"
import Particles from "react-particles-js"
import Rocketship from "./components/rocketship/rocketship"
import { Switch, Route, useLocation } from "react-router-dom"
import ReactGA from "react-ga"
import ProjectPage from "./pages/projectpage/ProjectPage"
import ProjectDetail from "./sections/projects/projectDetail"
import Main from "./sections/main"
// import { ReactComponent as TextSpinning } from "./resources/spinnertext.svg"
import { Canvas, useFrame } from "react-three-fiber"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { Suspense } from "react"
import LoadingScreen from "./components/LoadingScreen/LoadingScreen"

const ThreeModels = (props) => {
	const [moon, setMoon] = useState(null)
	const [earth, setEarth] = useState(null)

	useEffect(() => {
		new GLTFLoader().load("moon/scene.gltf", setMoon)
		new GLTFLoader().load("earth/scene.gltf", setEarth)
	}, [])

	// Rotate mesh every frame, this is outside of React without overhead
	useFrame(() => {
		if (earth) {
			earth.scene.rotation.y += 0.002
		}
	})

	if (earth && moon) {
		props.ToggleRest()
	}

	return earth && moon ? (
		<>
			<primitive
				rotation={[0, 0, 0]}
				position={[0, -800 + props.posY * 0.05, 0]}
				object={moon.scene}
			/>
			<primitive
				position={[0, 0, 300 - props.scrollPos * 0.04]}
				object={earth.scene}
			/>
		</>
	) : null
}

function App() {
	let location = useLocation()
	const [scrollPos, setScrollPos] = useState(0)
	const [showRest, setShowRest] = useState(false)
	ReactGA.initialize(`${process.env.REACT_APP_TRACKING_URL}`)
	ReactGA.pageview("/")

	React.useEffect(() => {
		window.addEventListener("scroll", scrollhandler)
		return () => {
			window.removeEventListener("scroll", scrollhandler)
		}
	}, [])

	const scrollhandler = () => setScrollPos(window.pageYOffset)
	const ToggleRest = () => setShowRest(true)

	return (
		<div>
			<Rocketship />
			<div className="three-canvas">
				<Canvas pixelRatio="1" camera={{ position: [0, 30, 500] }}>
					<Suspense fallback="">
						<ambientLight position={[0, 30, 500]} />
						<ambientLight intensity={0.2} />
						<directionalLight intensity={1} />
						<ThreeModels
							ToggleRest={ToggleRest}
							scrollPos={scrollPos}
							posY={scrollPos}
						/>
					</Suspense>
				</Canvas>
			</div>
			<Particles
				className="particles-background"
				width="100vw"
				params={{
					interactivity: {
						detectsOn: "canvas",
						events: {
							resize: true,
						},
					},
					particles: {
						number: {
							value: 150,
							density: {
								enable: true,
								value_area: 2000,
							},
						},
						move: {
							speed: 0,
							random: false,
						},
						links: {
							enable: false,
						},
					},
				}}
			/>
			{showRest ? (
				<Switch location={location}>
					<Route path="/" exact component={Main} />
					<Route path="/projects" component={ProjectPage} />
					<Route path="/project/:name" component={ProjectDetail}></Route>
				</Switch>
			) : (
				<LoadingScreen />
			)}
		</div>
	)
}

export default React.memo(App)
