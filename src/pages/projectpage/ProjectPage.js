import React from "react"
import { Link } from "react-router-dom"
import "./ProjectPage.scss"
import ProjectCard from "../../components/project-card/projectCard"
import projects from "../../projects"
import Contact from "../../sections/contact/contact"

const ProjectPage = (props) => {
	React.useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	return (
		<section className="main-container">
			<section className="all-projects">
				<div className="project-page-title">
					<span className="project-page-title-title" aria-hidden>
						All Projects
					</span>
					<Link className="link-back" to="/">
						Back to homepage
					</Link>
				</div>

				<div className="projects">
					<div className="project-cards">
						{projects
							.filter((project) => project.category === "Development")
							.map((project) => (
								<ProjectCard key={project.name} information={project} />
							))}
					</div>
				</div>

				<Contact className="no-snap" />
			</section>
		</section>
	)
}

export default React.memo(ProjectPage)
