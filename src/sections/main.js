import React, { useState } from "react"
import About from "./about/about"
import Contact from "./contact/contact"
import Landing from "./landing/landing"
import Projects from "./projects/projects"
import Publicmessage from "./publicmessage/publicmessage"
import Skill from "./skill/skill"
import Footer from "./footer/footer"
import FallingStars from "../components/falling-stars/fallingStars"
import CrescentMoon from "../components/crescentmoon/crescentMoon"
import NavBar from "../components/NavBar/NavBar"
import SideDrawer from "../components/SideDrawer/SideDrawer"

const Main = () => {
	const [show, setShow] = useState(false)
	const togglePublicMessage = () => setShow((prevState) => !prevState)

	const [drawer, setsidedrawer] = useState(false)

	const handlesidedrawer = () => {
		setsidedrawer((prevstate) => !prevstate)
	}

	return (
		<>
			<SideDrawer clicked={handlesidedrawer} show={drawer} />
			<NavBar clicked={handlesidedrawer} show={drawer} />
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
