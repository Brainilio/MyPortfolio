import React, { useState, useRef, useEffect, useMemo } from "react"
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
// import * as THREE from "three"

const Model = (props) => {
	const [model, setModel] = useState(null)

	useEffect(() => {
		new GLTFLoader().load("earth/scene.gltf", setModel)
	}, [])

	// Rotate mesh every frame, this is outside of React without overhead
	useFrame(() => {
		if (model) {
			model.scene.rotation.y += 0.002
		}
	})

	return model ? (
		<primitive
			position={[0, 0, 250 - props.scrollPos * 0.03]}
			object={model.scene}
		/>
	) : null
}

const Moon = (props) => {
	const [model, setModel] = useState()

	useEffect(() => {
		new GLTFLoader().load("moon/scene.gltf", setModel)
	}, [])

	useFrame(() => {
		if (model) {
			// model.scene.rotation.x -= 0.0001
			// model.scene.position.y += 0.3
			console.log(model.scene.position.y)
		}
	})

	console.log()

	return model ? (
		<primitive
			rotation={[0, 0, 0]}
			position={[0, -800 + props.posY * 0.05, 0]}
			object={model.scene}
		/>
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

	const scrollhandler = () => {
		console.log(window.pageYOffset)
		setScrollPos(window.pageYOffset)
	}

	return (
		<div>
			<Rocketship />
			<div className="three-canvas">
				<Canvas pixelRatio="1" camera={{ position: [0, 30, 500] }}>
					<ambientLight position={[0, 30, 500]} />
					<Suspense fallback="">
						<ambientLight intensity={0.2} />
						<directionalLight intensity={1} />
						<Model scrollPos={scrollPos} />
						<Moon posY={scrollPos} />
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
			<Switch location={location}>
				<Route path="/" exact component={Main} />
				<Route path="/projects" component={ProjectPage} />
				<Route path="/project/:name" component={ProjectDetail}></Route>
			</Switch>
		</div>
	)
}

export default React.memo(App)
