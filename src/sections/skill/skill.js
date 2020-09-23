import React, { useState } from "react"
import SingleSkill from "../../components/singleSkill/singleSkill"
import "./skill.scss"

const Skill = () => {
	const [iconSkills] = useState([
		{
			name: "REACTJS",
			icon: "react",
			type: "fab",
		},
		{
			name: "TYPESCRIPT",
			icon: "js",
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
			name: "NODEJS/EXPRESS",
			icon: "node-js",
			type: "fab",
		},
		{
			name: "MONGODB/MONGOOSE",
			icon: "database",
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
			name: "PHP & LARAVEL",
			icon: "php",
			type: "fab",
		},
		{
			name: "USABILITY TESTING AND UX RESEARCH",
			icon: "vial",
			type: "fa",
		},
		{
			name: "HTML/CSS",
			icon: "file-code",
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
			name: "THREEJS",
			icon: "cube",
			type: "fa",
		},
		{
			name: "DESIGN PATTERNS",
			icon: "shoe-prints",
			type: "fa",
		},
	])

	return (
		<section className="my-skills">
			<div className="skills-title">
				<div className="skills-title-block"></div>
				<span className="skills-title-title" aria-hidden>
					MY SKILLS 🛠
				</span>
			</div>
			<p>
				Most of my skills would bring the assumption that I'm a Full-Stack or
				UX/UI Developer.
				<br />
				However, I don't like limiting myself to a title. I am constantly
				learning and adapting to whatever users need.{" "}
			</p>

			<div className="skills-column">
				{iconSkills.map((icon) => (
					<SingleSkill type={icon.type} iconName={icon.icon} name={icon.name} />
				))}
			</div>
		</section>
	)
}

export default Skill
