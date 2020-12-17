import React from "react"
import { useHistory } from "react-router-dom"
import "./ProjectPage.scss"
import ProjectCard from "../../components/project-card/projectCard"
import projects from "../../projects"
import Filter from "../../components/Filter/Filter"

const ProjectPage = (props) => {
	let history = useHistory()

	React.useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	const [filter, setFilter] = React.useState({
		All: true,
		Development: false,
		Design: false,
		Art: false,
		Essays: false,
	})

	const buttonHandler = (value) => {
		let newItems = {}

		for (let item in filter) {
			if (item === value) {
				newItems[item] = true
			} else {
				newItems[item] = false
			}
		}

		setFilter(newItems)
	}

	return (
		<>
			<section className="all-projects">
				<button onClick={history.goBack} className="all-projects-button">
					&lt; Back
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

				<Filter clicked={buttonHandler} currentProject={filter} />

				<div className="projects">
					{filter.All || filter.Development ? (
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
					) : null}

					{filter.All || filter.Design ? (
						<div className="design-projects">
							<div className="project-page-title">
								<div className="project-page-title-block"></div>
								<span className="project-page-title-title" aria-hidden>
									UX/UI Design (N/A)
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
					) : null}

					{filter.All || filter.Art ? (
						<div className="art-projects">
							<div className="project-page-title">
								<div className="project-page-title-block"></div>
								<span className="project-page-title-title" aria-hidden>
									Art (N/A)
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
					) : null}

					{filter.All || filter.Essays ? (
						<div className="essay-projects">
							<div className="project-page-title">
								<div className="project-page-title-block"></div>
								<span className="project-page-title-title" aria-hidden>
									Essays/Research (N/A)
								</span>
								<br />
							</div>

							<div className="project-cards">
								{projects
									.filter((project) => project.category === "Essay")
									.map((project) => (
										<ProjectCard key={project.name} information={project} />
									))}
							</div>
						</div>
					) : null}
				</div>
			</section>
		</>
	)
}

export default React.memo(ProjectPage)
