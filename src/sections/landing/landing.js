import React from "react"
import "./landing.scss"

const landing = () => {
	return (
		<section className="landing">
			<div className="landing-title">
				<div className="landing-title-text">
					<span className="landing-title-text-name">Brainilio</span>
					<span className="landing-title-text-title">Creative Developer</span>
					<span className="landing-title-text-mission">
						Driven by humility, empathy and creativity
					</span>
				</div>
				<div className="landing-title-cta-buttons">
					<div className="landing-title-cta-contact-me">Contact me</div>
				</div>
			</div>
			<div className="landing-icon">
				<div className="landing-icon-first"></div>
				<div className="landing-icon-second"></div>
			</div>
		</section>
	)
}

export default landing
