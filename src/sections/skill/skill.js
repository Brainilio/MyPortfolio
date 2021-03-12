import { ScrollTrigger } from "gsap/all"
import gsap from "gsap/gsap-core"
import React, { useEffect, useRef } from "react"
import "./skill.scss"

import icons from "../../resources/icons.webp"

const Skill = () => {
	//
	const skillsRef = useRef(null)
	const titleRef = useRef(null)
	gsap.registerPlugin(ScrollTrigger)
	useEffect(() => {
		gsap.from(skillsRef.current, {
			scrollTrigger: {
				trigger: skillsRef.current,
				toggleActions: "play",
				start: "top center",
			},
			duration: 0.8,
			y: 200,
			opacity: 0,
		})

		console.log(titleRef.current.childNodes)
		gsap.from([titleRef.current.childNodes], {
			scrollTrigger: {
				trigger: skillsRef.current,
				toggleActions: "play",
				start: "top bottom",
			},
			duration: 0.3,
			yPercent: 80,
			opacity: 0,
			delay: 1,
			stagger: 0.08,
			ease: "power4.easeinout",
		})
	}, [])

	return (
		<section className="my-skills">
			<div ref={skillsRef} className="skill-hero">
				<div className="skill-hero-text">
					<div className="skills-title-block">
						<span ref={titleRef} className="skills-title-title" aria-hidden>
							<span>S</span>
							<span>k</span>
							<span>i</span>
							<span>l</span>
							<span>l</span>
							<span>s</span>
						</span>

						<p>
							I am at my best when developing fullstack applications using
							Javascript and UX/UI designing. However, I don't like limiting
							myself to a particular stack. I am constantly learning and
							adapting to whatever end-users need.{" "}
						</p>
					</div>
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
					<img
						src={icons}
						width="500"
						height="450"
						alt="icons of different technologies"
					/>
				</div>
			</div>
		</section>
	)
}

export default Skill
