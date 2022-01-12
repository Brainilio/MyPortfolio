import React, { useEffect, useRef } from "react"
import "./about.scss"
import profile from "../../resources/profile.webp"
// import sanfran from "../../resources/san-fran.webp"
// import rotterdam from "../../resources/rotterdam.webp"
import LazyLoad from "react-lazyload"
import { Link } from "react-scroll"
import Skill from "../../components/Skill/skill"
import SectionWrapper from "../../components/SectionWrapper/SectionWrapper"
import { ScrollTrigger } from "gsap/all"
import gsap from "gsap"

const slideFromLeft = (nodes) => {
	gsap.from(nodes, {
		scrollTrigger: {
			trigger: ".about",
			toggleActions: "restart",
		},
		duration: 1.2,
		opacity: 0,
		autoAlpha: 0,
		x: -100,
		ease: "power3.inOut",
		stagger: {
			amount: 0.3,
		},
	})
}

const fadeIn = (nodes) => {
	gsap.from([nodes], {
		scrollTrigger: {
			trigger: ".about",
			toggleActions: "restart",
		},
		duration: 1.2,
		opacity: 0,
		autoAlpha: 0,
		delay: 0.5,
		ease: "power3.inOut",
	})
}

const About = () => {
	let line1 = useRef(null)
	let line2 = useRef(null)
	gsap.registerPlugin(ScrollTrigger)

	useEffect(() => {
		slideFromLeft(line1.childNodes)
		fadeIn(line2)
	}, [])

	return (
		<SectionWrapper>
			<div className="about about-block">
				<div className="about-text" ref={(el) => (line1 = el)}>
					<h2 className="about-title">About</h2>
					<div className="short-bio">
						<h3>Who am I?</h3>
						<p>
							Hello there! I’m a creative developer who’s driven by user needs
							and creativity. In my career I specialize in Front-end
							development, but I'm also considerably exposed to Back-end dev and
							UX/UI. I always aim to get the best out of myself by staying up to
							date with latest trends and technologies, and standing firm in my
							values. I'm extremely fascinated by state of the art user
							interfaces, and WebGL in particular. In my free time, I’m busy
							with everything arts, from culinary to comics.
						</p>
						<div>
							<Link
								className="button-lets-chat"
								smooth={true}
								duration={600}
								offset={-500}
								to="contact"
							>
								Contact me
							</Link>
							<a
								className="button-resume-chat"
								rel="noopener noreferrer"
								target="_blank"
								href="https://drive.google.com/file/d/1TgOjKdYPxZr7SmBChUm1osO84EPkXSA8/view?usp=sharing"
							>
								Resume
							</a>
						</div>
					</div>
					<Skill />
				</div>
				<div className="about-image" ref={(el) => (line2 = el)}>
					<LazyLoad offset={100}>
						<img
							width="250"
							height="300"
							className="about-image-image"
							alt="brainilio"
							src={profile}
						/>
					</LazyLoad>
				</div>
			</div>
		</SectionWrapper>
	)
}

export default About
