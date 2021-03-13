import React from "react"
import "./ContactHero.scss"
import david from "../../resources/david.jpg"

const ContactHero = () => {
	return (
		<div className="contact-hero">
			<img src={david} alt="golden gate bridge" />
			<h1>Let's work together!</h1>
		</div>
	)
}

export default ContactHero
