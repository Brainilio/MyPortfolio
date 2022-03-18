import React from "react"
import "./skill.scss"
import icons from "../../resources/icons.webp"

const Skill = () => {
	return (
		<section className="my-skills">
			<div className="skills-title-block">
				<h3>Skill set</h3>
				<p>
					I'm excellent at translating modern and complex UX/UI designs into
					functional and consumable Front-end applications. I use modern,
					industry-level Front-end technologies such as React, NextJs, Sass,
					HTML, GraphQL/Apollo, Redux, Framer, and ThreeJS. However, I don't
					like limiting myself to a particular stack, so I am constantly
					learning and adapting to end-user needs.
				</p>
			</div>
			<div className="skill-hero">
				<div className="skill-hero-text">
					<ul>
						<li>
							<span>
								<strong>Languages</strong>
							</span>
							<span>JavaScript, TypeScript, (No)SQL</span>
						</li>
						<li>
							<span>
								<strong>Front-End</strong>
							</span>
							<span>
								React, NextJS, Framer, GSAP, HTML5, CSS3, VueJS, Apollo,
								Component Libraries, THREE, StencilJS, StorybookJS
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
								<strong>Back-End</strong>
							</span>
							<span>NodeJS, MongoDB, ExpressJS, GraphQL, MySQL</span>
						</li>
						<li>
							<span>
								<strong>Tools</strong>
							</span>
							<span>Jest/Enzyme, AWS, Digital Ocean, Git</span>
						</li>
					</ul>
				</div>

				<div className="skill-hero-img">
					<img src={icons} width="250" alt="icons of different technologies" />
				</div>
			</div>
		</section>
	)
}

export default Skill
