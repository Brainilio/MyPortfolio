import React from "react"
import "./landing.scss"

const landing = () => {
	return (
		<section className="landing">
			<div className="landing-title">
				<div className="landing-title-text">
					<span className="landing-title-text-name">
						Brainilio{" "}
						<span role="img" aria-hidden>
							👋🏽
						</span>
					</span>
					<span className="landing-title-text-title">Creative Developer</span>
					<span className="landing-title-text-mission">
						Driven by humility, empathy and creativity
					</span>
				</div>
				<div className="landing-title-cta-buttons">
					<div className="landing-title-cta-contact-me">MY WORK</div>
				</div>
			</div>
			<div className="landing-icon">
				<div className="landing-icon-first"></div>
				<div className="landing-icon-second"></div>
			</div>

			<div className="read-more">
				<span className="read-more-text">Read more</span>
				<span className="read-more-line"></span>
			</div>
		</section>
	)
}

export default landing
