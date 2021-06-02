import React from "react"
import ContactHero from "../../components/ContactHero/ContactHero"
import Contactinstructions from "../../components/ContactInstructions/Contactinstructions"
import Form from "../../components/Form/Form"
import SectionWrapper from "../../components/SectionWrapper/SectionWrapper"
import "./contact.scss"

const Contact = () => {
	return (
		<SectionWrapper>
			<section className="contact">
				<ContactHero />
				<div className="contact-part">
					<Contactinstructions />
					<Form />
				</div>
			</section>
		</SectionWrapper>
	)
}

export default Contact
