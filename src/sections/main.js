import React, { useState } from "react"
import About from "./about/about"
import Contact from "./Contact/Contact"
import Landing from "./landing/landing"
import Projects from "./projects/projects"
import Publicmessage from "./publicmessage/publicmessage"
import Skill from "./skill/skill"
import Footer from "./footer/footer"
import FallingStars from "../components/falling-stars/fallingStars"
import CrescentMoon from "../components/crescentmoon/crescentMoon"

const Main = () => {
	const [show, setShow] = useState(false)
	const togglePublicMessage = () => setShow((prevState) => !prevState)

	return (
		<>
			<CrescentMoon />
			<FallingStars />
			{show ? <Publicmessage show={togglePublicMessage} /> : null}
			<Landing />
			<Projects />
			<About />
			<Skill />
			<Contact />
			<Footer />
		</>
	)
}

export default Main
