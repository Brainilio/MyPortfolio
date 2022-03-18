import React from "react"
import "./projectCard.scss"
import { NavLink } from "react-router-dom"

const ProjectCard = (props) => {
	return (
		<>
			<div className="project-cards-single-card">
				<div className="project-image">
					<img
						className="project-cards-image"
						src={props.information.previewImage}
						alt="preview of project"
					/>
				</div>

				<div className="descriptions">
					<h3 className="project-cards-description-title">
						{props.information.name}
					</h3>
					<p className="project-cards-description-paragraph">
						{props.information.shortDescription}
					</p>

					<NavLink
						className="read-more"
						to={{
							pathname: `/project/${props.information.slug}`,
							project: props.information,
						}}
					>
						Read more
					</NavLink>
				</div>

				<div className="project-cards-buttons">
					{props.information.livePreview && (
						<a
							rel="noopener noreferrer"
							target="_blank"
							href={props.information.livePreview}
							className="project-cards-single-button-2"
						>
							Live
						</a>
					)}

					{props.information.gitHub && (
						<a
							rel="noopener noreferrer"
							target="_blank"
							href={props.information.gitHub}
							className="project-cards-single-button"
						>
							Code
						</a>
					)}
				</div>
			</div>
		</>
	)
}

export default ProjectCard
