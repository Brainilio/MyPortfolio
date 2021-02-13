import React, { useState } from "react"
import Particles from "react-particles-js"
import Rocketship from "./components/rocketship/rocketship"
import { Switch, Route, useLocation } from "react-router-dom"
// import { TransitionGroup, CSSTransition } from "react-transition-group"
import ProjectPage from "./pages/projectpage/ProjectPage"
import ProjectDetail from "./sections/projects/projectDetail"
import Main from "./sections/main"
import NavBar from "./components/NavBar/NavBar"
import SideDrawer from "./components/SideDrawer/SideDrawer"

function App() {
	let location = useLocation()
	const [drawer, setsidedrawer] = useState(false)

	const handlesidedrawer = () => {
		setsidedrawer((prevstate) => !prevstate)
	}

	return (
		<>
			<SideDrawer clicked={handlesidedrawer} show={drawer} />
			<NavBar clicked={handlesidedrawer} show={drawer} />
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
							speed: 0,
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
				<Route path="/projects" component={ProjectPage} />
				<Route path="/project/:name" component={ProjectDetail}></Route>
			</Switch>
		</>
	)
}

export default React.memo(App)
