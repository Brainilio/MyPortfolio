import React, { useEffect } from "react"

import "./landing.scss"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/all"
import { Link } from "react-scroll"

const Landing = () => {
	let titleRef = React.useRef(null)
	let buttonsRef = React.useRef(null)
	let subTitle = React.useRef(null)
	let fullPage = React.useRef(null)
	gsap.registerPlugin(ScrollTrigger)

	useEffect(() => {
		// let topass = []
		// let wholebody = document.querySelector("body")
		// for (const child of titleRef.children) {
		// 	topass.push(child)
		// }
		// gsap.from(wholebody, {
		// 	overflow: "hidden",
		// 	duration: 3,
		// })
		// gsap.from(fullPage, {
		// 	backgroundColor: "black",
		// 	duration: 3,
		// })
		// gsap.to(fullPage, {
		// 	scrollTrigger: {
		// 		trigger: fullPage,
		// 		start: "bottom bottom",
		// 		scrub: true,
		// 		toggleActions: "play none none none",
		// 	},
		// 	opacity: 0,
		// 	delay: 3,
		// 	y: -300,
		// 	duration: 0.8,
		// })
		// gsap.from(topass, {
		// 	duration: 0.6,
		// 	yPercent: 80,
		// 	opacity: 0,
		// 	stagger: 0.08,
		// 	ease: "power4.easeinout",
		// })
		// gsap.from(buttonsRef, {
		// 	duration: 0.8,
		// 	delay: 0.6,
		// 	xPercent: -100,
		// 	opacity: 0,
		// })
		// gsap.from(subTitle, {
		// 	duration: 0.9,
		// 	yPercent: 300,
		// 	opacity: 0,
		// })
	}, [])

	return (
		<section className="landing" ref={(el) => (fullPage = el)}>
			<div className="landing-title">
				<div className="landing-title-text">
					<h1 className="landing-title-text-name" ref={(el) => (titleRef = el)}>
						<span>B</span>
						<span>r</span>
						<span>a</span>
						<span>i</span>
						<span>n</span>
						<span>i</span>
						<span>l</span>
						<span>i</span>
						<span>o</span>
					</h1>
					<span
						className="landing-title-text-title"
						ref={(el) => (subTitle = el)}
					>
						Creative Full-stack Developer specializing in JavaScript
						technologies and UX/UI
					</span>
				</div>
				<div
					className="landing-title-cta-buttons"
					ref={(el) => (buttonsRef = el)}
				>
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
		</section>
	)
}

export default Landing
