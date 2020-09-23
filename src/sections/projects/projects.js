import React, { useState } from "react"
import ProjectCard from "../../components/project-card/projectCard"
import "./projects.scss"

const Projects = () => {
	//project modelling
	const [projects, setProjects] = useState([
		{
			name: "",
			shortDescription: "",
			previewImage: "",
			livePreview: "",
			gitHub: "",
			tags: ["", "", ""],
			longerDescription: "",
			dateCreated: "",
			fullImages: ["", "", ""],
		},
	])

	return (
		<section className="projects">
			<div className="projects-title">
				<div className="projects-title-block"></div>
				<span className="projects-title-title" aria-hidden>
					MY WORK 💻
				</span>
			</div>
			<p className="projects-paragraph">
				Here are some of my projects.
				<br />
				To see more, visit my{" "}
				<a
					href="https://github.com/brainilio"
					rel="noopener noreferrer"
					target="_blank"
				>
					Github
				</a>
				.{" "}
			</p>
			<div className="project-cards">
				<ProjectCard />
				<ProjectCard />
				<ProjectCard />
			</div>
		</section>
	)
}

export default Projects
