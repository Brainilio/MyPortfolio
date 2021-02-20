import React from "react"
import Particles from "react-particles-js"
import Rocketship from "./components/rocketship/rocketship"
import { Switch, Route, useLocation } from "react-router-dom"
import ReactGA from "react-ga"
import ProjectPage from "./pages/projectpage/ProjectPage"
import ProjectDetail from "./sections/projects/projectDetail"
import Main from "./sections/main"
import { ReactComponent as TextSpinning } from "./resources/spinnertext.svg"

function App() {
	let location = useLocation()
	ReactGA.initialize(`${process.env.REACT_APP_TRACKING_URL}`)
	ReactGA.pageview("/")

	return (
		<>
			<TextSpinning className="spinning-text" />
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
