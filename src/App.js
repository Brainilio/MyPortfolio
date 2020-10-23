import React, { useState } from "react"
import Particles from "react-particles-js"
import Rocketship from "./components/rocketship/rocketship"
import { Switch, Route, useLocation } from "react-router-dom"
import { TransitionGroup, CSSTransition } from "react-transition-group"
import ProjectDetail from "./sections/projects/projectDetail"
import Main from "./sections/main"

function App() {
	let location = useLocation()

	return (
		<>
			<Rocketship />
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
							direction: "none",
							speed: 1,
							random: false,
							straight: false,
						},
						links: {
							enable: false,
						},
					},
				}}
			/>

			<Switch location={location}>
				<Route path="/" exact component={Main} />
				<Route path="/project/:name" component={ProjectDetail} />
			</Switch>
		</>
	)
}

export default React.memo(App)
