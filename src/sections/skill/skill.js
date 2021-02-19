import { ScrollTrigger } from "gsap/all"
import gsap from "gsap/gsap-core"
import React, { useEffect, useRef } from "react"
import "./skill.scss"

import icons from "../../resources/icons.webp"

const Skill = () => {
	const skillsRef = useRef(null)
	const textRef = useRef(null)
	gsap.registerPlugin(ScrollTrigger)
	useEffect(() => {
		// gsap.from(skillsRef.current.children, {
		// 	scrollTrigger: {
		// 		trigger: skillsRef.current.children,
		// 		toggleActions: "play",
		// 		start: "top center",
		// 	},
		// 	duration: 0.8,
		// 	x: 300,
		// 	opacity: 0,
		// })
		// gsap.from(textRef.current, {
		// 	scrollTrigger: {
		// 		trigger: textRef.current,
		// 		toggleActions: "play",
		// 		start: "top center",
		// 	},
		// 	duration: 0.8,
		// 	x: -200,
		// 	opacity: 0,
		// })
	}, [])

	return (
		<section className="my-skills">
			<div className="skills-title-block">
				<div className="skills-title">
					<span className="skills-title-title" aria-hidden>
						My Skills
					</span>
				</div>
				<p ref={textRef}>
					I am at my best when developing fullstack applications using
					Javascript and UX/UI designing. However, I don't like limiting myself
					to a particular stack. I am constantly learning and adapting to
					whatever end-users need.{" "}
				</p>
			</div>

			<div className="skill-hero">
				<div className="skill-hero-text">
					<ul>
						<li>
							<span>
								<strong>Languages</strong>
							</span>
							<span>JavaScript, TypeScript, Python, SQL, PHP</span>
						</li>
						<li>
							<span>
								<strong>Front-End</strong>
							</span>
							<span>
								React, HTML5, CSS3, VueJS, Bootstrap, Apollo, Material UI, THREE
							</span>
						</li>
						<li>
							<span>
								<strong>Back-End</strong>
							</span>
							<span>NodeJS, MongoDB, ExpressJS, Laravel, GraphQL, MySQL</span>
						</li>
						<li>
							<span>
								<strong>Tools</strong>
							</span>
							<span>
								Jest/Enzyme, Terminal, AWS, Wordpress, Digital Ocean, Git
							</span>
						</li>
						<li>
							<span>
								<strong>UX/UI</strong>
							</span>
							<span>
								Creative Cloud, Gamification, Low and High fidelity prototyping
							</span>
						</li>
						<li>
							<span>
								<strong>Other</strong>
							</span>
							<span>
								Object Oriented Programming, Datastructures & Algorithms, Agile
								& Scrum methodologies, Unit Testing, Design patterns
							</span>
						</li>
					</ul>
				</div>
				{/* img right here */}
				<div className="skill-hero-img">
					<img src={icons} width="400" height="400" />
				</div>
			</div>
		</section>
	)
}

export default Skill
