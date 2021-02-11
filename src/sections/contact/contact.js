import React from "react"
import ContactHero from "../../components/ContactHero/ContactHero"
import Contactinstructions from "../../components/ContactInstructions/Contactinstructions"
import Form from "../../components/Form/Form"
import "./Contact.scss"

const Contact = () => {
	return (
		<section className="contact">
			<ContactHero />
			<div className="contact-part">
				<Contactinstructions />
				<Form />
			</div>
		</section>
	)
}

export default Contact
