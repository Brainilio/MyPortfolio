import React from "react"
import { NavLink } from "react-router-dom"
import "./ProjectPage.scss"

const ProjectPage = () => {
	return (
		<>
			<section>
				<NavLink style={{ textDecoration: "none" }} to="/">
					<button className="all-projects-button">Back</button>
				</NavLink>
				<div>projects</div>
			</section>
		</>
	)
}

export default ProjectPage
