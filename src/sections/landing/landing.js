import React, { useEffect } from "react"

import "./landing.scss"
import { gsap } from "gsap"

const Landing = () => {
	const titleRef = React.useRef(null)
	const iconRef = React.useRef(null)

	useEffect(() => {
		gsap.from(titleRef.current.children, {
			x: -200,
			opacity: 0,
			stagger: 0.5,
			duration: 0.5,
		})
		gsap.from(iconRef.current.children, {
			y: -500,
			rotateZ: 360,
			opacity: 0,
			ease: "power3",
			stagger: 0.5,
			duration: 2,
		})
	}, [titleRef, iconRef])

	return (
		<section className="landing">
			<div ref={titleRef} className="landing-title">
				<div className="landing-title-text">
					<span className="landing-title-text-name">
						Brainilio{" "}
						<span className="landing-emoji" role="img" aria-hidden>
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
			<div ref={iconRef} className="landing-icon">
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

export default Landing
