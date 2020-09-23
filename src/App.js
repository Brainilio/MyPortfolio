import React from "react"
import Skill from "./components/skill/skill"
import About from "./sections/about/about"
import Contact from "./sections/contact/contact"
import Landing from "./sections/landing/landing"
import Projects from "./sections/projects/projects"

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
