import React from "react"
import About from "./about/about"
import Contact from "./contact/contact"
import Landing from "./landing/landing"
import Projects from "./projects/projects"

const Main = () => {
	return (
		<section className="main-container">
			<Landing />
			<Projects />
			<About />
			<Contact />
		</section>
	)
}

export default Main
