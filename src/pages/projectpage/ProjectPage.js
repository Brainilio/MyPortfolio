import React from "react"
import { Link, useHistory } from "react-router-dom"
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
			</section>
		</>
	)
}

export default React.memo(ProjectPage)
