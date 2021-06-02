import React from "react"
import "./skill.scss"

import icons from "../../resources/icons.webp"

const Skill = () => {
	return (
		<section className="my-skills">
			<div className="skills-title-block">
				<h3>My skill set</h3>
				<p>
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
							<span>JavaScript, TypeScript, (No)SQL, PHP</span>
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
					</ul>
				</div>

				<div className="skill-hero-img">
					<img src={icons} width="200" alt="icons of different technologies" />
				</div>
			</div>
		</section>
	)
}

export default Skill
