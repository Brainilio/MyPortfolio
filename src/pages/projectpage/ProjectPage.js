import React from "react"
import { useHistory } from "react-router-dom"
import "./ProjectPage.scss"
import ProjectCard from "../../components/project-card/projectCard"
import projects from "../../projects"

const ProjectPage = (props) => {
	let history = useHistory()

	// const [filter, setFilter] = React.useState("all")

	return (
		<>
			<section className="all-projects">
				<button onClick={history.goBack} className="all-projects-button">
					Back
				</button>

				<div className="project-page-title">
					<div className="project-page-title-block"></div>
					<span className="project-page-title-title" aria-hidden>
						All Projects 💻
					</span>
				</div>
				<p className="all-projects-paragraph">
					Hey there! This page is dedicated to all of my work. My projects are
					divided into three categories: Development (coding), UX/UI Design and
					even Art! If you want to filter on a specific category, click on the
					respective pill below.
				</p>

				<div className="projects">
					<div className="development-projects">
						<div className="project-page-title">
							<div className="project-page-title-block"></div>
							<span className="project-page-title-title" aria-hidden>
								Development
							</span>
						</div>

						<div className="project-cards">
							{projects
								.filter((project) => project.category === "Development")
								.map((project) => (
									<ProjectCard key={project.name} information={project} />
								))}
						</div>
					</div>
					<div className="design-projects">
						<div className="project-page-title">
							<div className="project-page-title-block"></div>
							<span className="project-page-title-title" aria-hidden>
								UX/UI Design
							</span>
						</div>

						<div className="project-cards">
							{projects
								.filter((project) => project.category === "Design")
								.map((project) => (
									<ProjectCard key={project.name} information={project} />
								))}
						</div>
					</div>
					<div className="art-projects">
						<div className="project-page-title">
							<div className="project-page-title-block"></div>
							<span className="project-page-title-title" aria-hidden>
								Art
							</span>
						</div>

						<div className="project-cards">
							{projects
								.filter((project) => project.category === "Art")
								.map((project) => (
									<ProjectCard key={project.name} information={project} />
								))}
						</div>
					</div>
				</div>
			</section>
		</>
	)
}

export default React.memo(ProjectPage)
