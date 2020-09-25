import React from "react"
import DecorativeLine from "./components/decorativeLine/decorativeLine"

import About from "./sections/about/about"
import Contact from "./sections/contact/contact"
import Landing from "./sections/landing/landing"
import Projects from "./sections/projects/projects"
import Publicmessage from "./sections/publicmessage/publicmessage"
import Skill from "./sections/skill/skill"
import Particles from "react-particles-js"
import FallingStars from "./components/falling-stars/fallingStars"
import CrescentMoon from "./components/crescentmoon/crescentMoon"
import Rocketship from "./components/rocketship/rocketship"

function App() {
	return (
		<>
			<Rocketship />
			<Particles
				className="particles-background"
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
						links: {
							enable: false,
						},
					},
				}}
			/>
			<Publicmessage />
			<Contact />
			<DecorativeLine />
			<CrescentMoon />
			<Landing />
			<Projects />
			<About />
			<FallingStars />
			<Skill />
		</>
	)
}

export default App
