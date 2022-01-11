import React from "react"
import ContactHero from "../../components/ContactHero/ContactHero"
import Contactinstructions from "../../components/ContactInstructions/Contactinstructions"
import Form from "../../components/Form/Form"
import SectionWrapper from "../../components/SectionWrapper/SectionWrapper"
import "./contact.scss"

const Contact = ({ className }) => {
	return (
		<section className="background-black-reverse">
			<SectionWrapper className={className}>
				<section className="contact">
					<ContactHero />
					<div className="contact-part">
						<Contactinstructions />
						<Form />
					</div>
				</section>
			</SectionWrapper>
		</section>
	)
}

export default Contact
