import { ScrollTrigger } from "gsap/all"
import gsap from "gsap/gsap-core"
import React, { useEffect, useRef, useState } from "react"
import SingleSkill from "../../components/singleSkill/singleSkill"
import "./skill.scss"
import { ReactComponent as Express } from "../../resources/icons/expressjs-icon.svg"
import { ReactComponent as Html } from "../../resources/icons/w3_html5-icon.svg"
import { ReactComponent as Css } from "../../resources/icons/css3.svg"
import { ReactComponent as Cc } from "../../resources/icons/creative-cloud.svg"
import { ReactComponent as Jest } from "../../resources/icons/jestjsio-icon.svg"
import { ReactComponent as Laravel } from "../../resources/icons/laravel-ar21.svg"
import { ReactComponent as Php } from "../../resources/icons/php-ar21.svg"
import { ReactComponent as MongoDB } from "../../resources/icons/mongodb-icon.svg"
import { ReactComponent as Typescript } from "../../resources/icons/typescriptlang-icon.svg"
import { ReactComponent as Vue } from "../../resources/icons/vuejs-icon.svg"
import { ReactComponent as Node } from "../../resources/icons/nodejs-icon.svg"
import { ReactComponent as Re } from "../../resources/icons/reactjs-icon.svg"
import { ReactComponent as Python } from "../../resources/icons/python-ar21.svg"

const Skill = () => {
	const skillsRef = useRef(null)
	const textRef = useRef(null)
	gsap.registerPlugin(ScrollTrigger)
	useEffect(() => {
		gsap.from(skillsRef.current.children, {
			scrollTrigger: {
				trigger: skillsRef.current.children,
				toggleActions: "play",
				start: "top center",
			},
			duration: 0.8,
			x: 300,
			opacity: 0,
		})
		gsap.from(textRef.current, {
			scrollTrigger: {
				trigger: textRef.current,
				toggleActions: "play",
				start: "top center",
			},
			duration: 0.8,
			x: -200,
			opacity: 0,
		})
	}, [])
	const [iconSkills] = useState([
		{
			name: "REACTJS",
			icon: "react",
			type: "fab",
		},
		{
			name: "JAVASCRIPT",
			icon: "js",
			type: "fab",
		},
		{
			name: "UX/UI",
			icon: "pen",
			type: "fa",
		},
		{
			name: "THREEJS",
			icon: "cube",
			type: "fa",
		},
		{
			name: "OBJECT-ORIENTED PROGRAMMING",
			icon: "object-group",
			type: "fa",
		},
		{
			name: "DATASTRUCTURES & ALGORITHMS",
			icon: "brain",
			type: "fa",
		},
		{
			name: "AGILE & SCRUM METHODOLOGIES",
			icon: "project-diagram",
			type: "fa",
		},

		{
			name: "USABILITY TESTING AND UX RESEARCH",
			icon: "vial",
			type: "fa",
		},
		{
			name: "REST API AND WEBSERVICES",
			icon: "network-wired",
			type: "fa",
		},
		{
			name: "UNIT TESTING",
			icon: "suitcase",
			type: "fa",
		},

		{
			name: "DESIGN PATTERNS",
			icon: "shoe-prints",
			type: "fa",
		},
	])

	/*
{iconSkills.map((icon) => (
					<SingleSkill
						key={icon.name}
						type={icon.type}
						iconName={icon.icon}
						name={icon.name}
					/>
				))}

	*/

	return (
		<section className="my-skills">
			<div className="skills-title">
				<div className="skills-title-block"></div>
				<span className="skills-title-title" aria-hidden>
					MY SKILLS 🛠
				</span>
			</div>
			<p ref={textRef}>
				I am at my best when developing fullstack applications using Javascript
				and UX/UI designing. However, I don't like limiting myself to a
				particular stack. I am constantly learning and adapting to whatever
				end-users need.{" "}
			</p>

			<div ref={skillsRef} className="skills-column">
				<div>
					<Re />
					<span>REACT</span>
				</div>
				<div>
					<Node />
					<span>NODE.JS</span>
				</div>
				<div>
					<MongoDB />
					<span>MONGODB/MONGOOSE</span>
				</div>
				<div>
					<Express />
					<span>EXPRESS.JS</span>
				</div>
				<div>
					<Typescript />
					<span>TYPESCRIPT</span>
				</div>
				<div>
					<Html />
					<span>HTML5</span>
				</div>
				<div>
					<Css />
					<span>CSS3</span>
				</div>
				{iconSkills.map((icon) => (
					<SingleSkill
						key={icon.name}
						type={icon.type}
						iconName={icon.icon}
						name={icon.name}
					/>
				))}
				<div>
					<Laravel />
					<span>LARAVEL</span>
				</div>
				<div>
					<Php />
					<span>PHP</span>
				</div>

				<div>
					<Python />
					<span>PYTHON</span>
				</div>
				<div>
					<Vue />
					<span>VUEJS</span>
				</div>
				<div>
					<Cc />
					<span>CREATIVE CLOUD</span>
				</div>

				<div>
					<Jest />
					<span>JEST/ENZYME</span>
				</div>
			</div>
		</section>
	)
}

export default Skill
