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

const Model = React.memo((props) => {
	const [model, setModel] = useState()

	useEffect(() => {
		new GLTFLoader().load("earth/scene.gltf", setModel)
	}, [])

	console.log(model)

	// Rotate mesh every frame, this is outside of React without overhead
	useFrame(() => {
		if (model) {
			model.scene.rotation.y = model.scene.rotation.x += 0.01
		}
	})

	return model ? <primitive position={[0, 0, 0]} object={model.scene} /> : null
}, [])

function App() {
	let location = useLocation()
	ReactGA.initialize(`${process.env.REACT_APP_TRACKING_URL}`)
	ReactGA.pageview("/")

	const handleScroll = () => {}
	return (
		<div onScroll={handleScroll}>
			<Rocketship />
			<div className="three-canvas">
				<Canvas pixelRatio="1" camera={{ position: [0, 10, 350] }}>
					<directionalLight intensity={1} />
					<ambientLight intensity={1} />
					<Suspense fallback="">
						<Model />
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
