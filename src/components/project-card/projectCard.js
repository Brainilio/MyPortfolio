import React from "react"
import "./projectCard.scss"

const ProjectCard = (props) => {
	return (
		<div className="project-cards-single-card">
			<img
				className="project-cards-image"
				src={props.information.previewImage}
				alt="preview of project"
			/>

			<div className="project-cards-description">
				<span className="project-cards-description-title">
					{props.information.name}
				</span>
				<p className="project-cards-description-paragraph">
					{props.information.shortDescription}
				</p>
			</div>

			<div className="project-cards-buttons">
				<a
					rel="noopener noreferrer"
					target="_blank"
					href={props.information.gitHub}
					className="project-cards-single-button"
				>
					CODE
				</a>

				<a
					rel="noopener noreferrer"
					target="_blank"
					href={props.information.livePreview}
					className="project-cards-single-button"
				>
					LIVE
				</a>
			</div>

			<div className="project-cards-tags-row">
				{props.information.tags.map((tag) => (
					<div className="project-card-single-tag">{tag}</div>
				))}
			</div>
		</div>
	)
}

export default ProjectCard
