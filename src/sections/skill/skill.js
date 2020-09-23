import React, { useState, useEffect } from "react"
import SingleSkill from "../../components/singleSkill/singleSkill"
import "./skill.scss"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faAdobe, fab, faJs, faReact } from "@fortawesome/free-brands-svg-icons"
import { faMarker, faPen, faPenFancy } from "@fortawesome/free-solid-svg-icons"

const Skill = () => {
	library.add(fab, faReact, faJs, faMarker, faPen)

	const [iconSkills] = useState([
		{
			name: "REACTJS",
			icon: "react",
		},
		{
			name: "TYPESCRIPT",
			icon: "js",
		},
		{
			name: "JAVASCRIPT",
			icon: "js",
		},
		{
			name: "UX/UI",
			icon: "adobe",
		},
		{
			name: "NODEJS/EXPRESS",
			icon: "FaJavascript",
		},
		{
			name: "MONGODB/MONGOOSE",
			icon: "FaJavascript",
		},
		{
			name: "OBJECT-ORIENTED PROGRAMMING",
			icon: "FaJavascript",
		},
		{
			name: "DATASTRUCTURES & ALGORITHMS",
			icon: "FaJavascript",
		},
		{
			name: "JAVASCRIPT",
			icon: "FaJavascript",
		},
		{
			name: "AGILE & SCRUM METHODOLOGIES",
			icon: "FaJavascript",
		},
		{
			name: "PHP & LARAVEL",
			icon: "FaJavascript",
		},
		{
			name: "USABILITY TESTING AND UX RESEARCH",
			icon: "FaJavascript",
		},
		{
			name: "HTML/CSS",
			icon: "FaJavascript",
		},
		{
			name: "REST API AND WEBSERVICES",
			icon: "FaJavascript",
		},
		{
			name: "UNIT TESTING",
			icon: "FaJavascript",
		},
		{
			name: "THREEJS",
			icon: "FaJavascript",
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
					<SingleSkill iconName={icon.icon} name={icon.name} />
				))}
			</div>
		</section>
	)
}

export default Skill
