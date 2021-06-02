import React from "react"
import ProjectCard from "../../components/project-card/projectCard"
import "./projects.scss"
import { NavLink } from "react-router-dom"
import projects from "../../projects"

const Projects = () => {
	return (
		<section className="projects">
			<div className="projects-title">
				<h2 className="projects-title-title" aria-hidden>
					Featured Work
				</h2>
				<p>
					Here are some of my featured projects. I love to develop front-end
					applications in React.
					<i> My projects do range from PHP to MERN stack applications</i>
				</p>
				<NavLink
					className="all-projects-button"
					to={{
						pathname: "projects",
						projects: projects,
					}}
				>
					View all my projects
				</NavLink>
			</div>

			<div className="project-cards">
				{projects.slice(0, 3).map((project) => {
					return <ProjectCard key={project.name} information={project} />
				})}
			</div>
		</section>
	)
}

export default React.memo(Projects)
