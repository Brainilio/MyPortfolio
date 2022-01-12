import React, { useRef, useEffect } from "react"
import "./landing.scss"
import { Link } from "react-scroll"
import SectionWrapper from "../../components/SectionWrapper/SectionWrapper"
import { ScrollTrigger } from "gsap/all"
import gsap from "gsap"

const staggerText = (nodes) => {
	gsap.from([...nodes], {
		scrollTrigger: {
			trigger: ".landing-title",
			toggleActions: "restart",
		},
		duration: 1.2,
		autoAlpha: 0,
		opacity: 0,
		y: 200,
		delay: 0.2,
		ease: "power3.inOut",
		stagger: {
			amount: 0.3,
		},
	})
}

const fadeIn = (nodes) => {
	gsap.from(nodes, {
		scrollTrigger: {
			trigger: ".landing-title",
			toggleActions: "restart",
		},
		autoAlpha: 0,
		duration: 1.2,
		opacity: 0,
		delay: 0.5,
		ease: "power3.inOut",
	})
}

const Landing = () => {
	let line1 = useRef(null)
	let line2 = useRef(null)
	let line3 = useRef(null)
	gsap.registerPlugin(ScrollTrigger)

	useEffect(() => {
		staggerText(line1.childNodes)
		fadeIn(line2)
		fadeIn(line3)
	}, [])

	return (
		<section className="background-black">
			<SectionWrapper>
				<div className="landing-title">
					<div className="landing-title-text">
						<h1 className="landing-title-text-name" ref={(el) => (line1 = el)}>
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
						<h3 className="landing-title-text-title" ref={(el) => (line2 = el)}>
							Creative Developer specializing in tailoring sophisticated
							user-oriented experiences.
						</h3>
					</div>
					<div className="landing-title-cta-buttons" ref={(el) => (line3 = el)}>
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
			</SectionWrapper>
		</section>
	)
}

export default Landing
