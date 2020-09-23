import React from "react"
import ProjectCard from "../../components/project-card/projectCard"
import "./projects.scss"

const projects = () => {
	return (
		<section className="projects">
			<div className="projects-title">
				<div className="projects-title-block"></div>
				<span className="projects-title-title" aria-hidden>
					MY WORK 💻
				</span>
			</div>
			<div className="project-cards">
				<ProjectCard />
				<ProjectCard />
				<ProjectCard />
			</div>
		</section>
	)
}

export default projects
