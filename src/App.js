import React from "react"

import About from "./sections/about/about"
import Contact from "./sections/contact/contact"
import Landing from "./sections/landing/landing"
import Projects from "./sections/projects/projects"
import Skill from "./sections/skill/skill"


function App() {
	return (
		<>
			<Contact />
			<Landing />
			<Projects />
			<About />
			<Skill />
		</>
	)
}

export default App
