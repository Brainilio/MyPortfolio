import React, { useEffect } from "react"

import "./landing.scss"
// import { gsap } from "gsap"
import { Link } from "react-scroll"

const Landing = () => {
	const titleRef = React.useRef(null)
	// const iconRef = React.useRef(null)
	// const readRef = React.useRef(null)

	useEffect(() => {
		// gsap.from(titleRef.current.children, {
		// 	x: -200,
		// 	opacity: 0,
		// 	stagger: 0.5,
		// 	duration: 0.5,
		// })
		// gsap.from(iconRef.current.children, {
		// 	y: -500,
		// 	rotateZ: 360,
		// 	opacity: 0,
		// 	ease: "power3",
		// 	stagger: 0.5,
		// 	duration: 2,
		// })
		// gsap.from(readRef.current, {
		// 	y: -500,
		// 	ease: "power",
		// 	opacity: 0,
		// 	duration: 5,
		// })
	}, [])

	return (
		<section className="landing">
			<div ref={titleRef} className="landing-title">
				<div className="landing-title-text">
					<span className="landing-title-text-name">Brainilio</span>
					<span className="landing-title-text-title">Creative Developer</span>
					{/* <span className="landing-title-text-mission">
						Driven by humility, empathy and creativity
					</span> */}
				</div>
				<div className="landing-title-cta-buttons">
					<Link
						smooth={true}
						duration={600}
						offset={-500}
						to="contact"
						className="landing-title-cta-my-work"
					>
						<strong>L E T ' S &nbsp; C H A T</strong>
					</Link>

					<button className="landing-title-cta-contact-me">
						<a
							rel="noopener noreferrer"
							target="_blank"
							href="https://drive.google.com/file/d/1TgOjKdYPxZr7SmBChUm1osO84EPkXSA8/view?usp=sharing"
						>
							<strong>R E S U M E</strong>
						</a>
					</button>
				</div>
			</div>
			{/* <div ref={iconRef} className="landing-icon">
				<div className="landing-icon-first"></div>
				<div className="landing-icon-second"></div>
			</div>*/}

			{/* <div ref={readRef} className="read-more">
				<span className="read-more-text">Read more</span>
				<span className="read-more-line"></span>
			</div> */}
		</section>
	)
}

export default Landing
