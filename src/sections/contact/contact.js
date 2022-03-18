import React from "react"
import ContactHero from "../../components/ContactHero/ContactHero"
import Contactinstructions from "../../components/ContactInstructions/Contactinstructions"
import Form from "../../components/Form/Form"
import Footer from "../footer/footer"
import "./contact.scss"

const Contact = ({ className }) => {
	return (
		<section className="background-black-reverse">
			<section className="contact">
				<ContactHero />
				<div className="contact-part">
					<Contactinstructions />
					<Form />
				</div>
			</section>
			<Footer />
		</section>
	)
}

export default Contact
