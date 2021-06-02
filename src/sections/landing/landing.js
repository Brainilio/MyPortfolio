import React from "react"
import "./landing.scss"
import { Link } from "react-scroll"

const Landing = () => {
	return (
		<section className="landing">
			<div className="landing-title">
				<div className="landing-title-text">
					<h1 className="landing-title-text-name">Brainilio</h1>
					<h3 className="landing-title-text-title">
						Creative Developer dedicated to tailoring user-friendly experiences
					</h3>
				</div>
				<div className="landing-title-cta-buttons">
					<Link
						smooth={true}
						duration={600}
						offset={-500}
						to="contact"
						className="landing-title-cta-contact-me"
					>
						Contact me
					</Link>

					<a
						className="landing-title-resume"
						rel="noopener noreferrer"
						target="_blank"
						href="https://drive.google.com/file/d/1TgOjKdYPxZr7SmBChUm1osO84EPkXSA8/view?usp=sharing"
					>
						Resume
					</a>
				</div>
			</div>
		</section>
	)
}

export default Landing
