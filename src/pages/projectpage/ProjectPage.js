import React from "react"
// import { NavLink } from "react-router-dom"
import "./ProjectPage.scss"

const ProjectPage = (props) => {
	return (
		<>
			<section className="all-projects">
				{/* <NavLink style={{ textDecoration: "none" }} to="/">
					<button className="all-projects-button">Back</button>
				</NavLink> */}
				<div className="project-page-title">
					<div className="project-page-title-block"></div>
					<span className="project-page-title-title" aria-hidden>
						All Projects 💻
					</span>
				</div>
				<p className="all-projects-paragraph">
					Hey there! This page is dedicated to all of my work. My projects are
					divided in three categories: Development (coding), UX/UI Design and
					even Art! If you want to filter on a specific category, click on the
					respective pill below.
				</p>

				<div className="development-projects">
					<div className="project-page-title">
						<div className="project-page-title-block"></div>
						<span className="project-page-title-title" aria-hidden>
							Development
						</span>
					</div>
				</div>
				<div className="design-projects">
					<div className="project-page-title">
						<div className="project-page-title-block"></div>
						<span className="project-page-title-title" aria-hidden>
							UX/UI Design
						</span>
					</div>
				</div>
				<div className="art-projects">
					<div className="project-page-title">
						<div className="project-page-title-block"></div>
						<span className="project-page-title-title" aria-hidden>
							Art
						</span>
					</div>
				</div>
			</section>
		</>
	)
}

export default ProjectPage
