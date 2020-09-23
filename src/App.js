import React from "react"
import DecorativeLine from "./components/decorativeLine/decorativeLine"

import About from "./sections/about/about"
import Contact from "./sections/contact/contact"
import Landing from "./sections/landing/landing"
import Projects from "./sections/projects/projects"
import Publicmessage from "./sections/publicmessage/publicmessage"
import Skill from "./sections/skill/skill"

function App() {
	return (
		<>
			<Publicmessage />
			<Contact />
			<DecorativeLine />
			<Landing />
			<Projects />
			<About />
			<Skill />
		</>
	)
}

export default App
