import React from "react"
import "./projectCard.scss"

const ProjectCard = (props) => {
	return (
		<div className="project-cards-single-card">
			<div className="project-cards-image"></div>

			<div className="project-cards-description">
				<span className="project-cards-description-title">Salvame</span>
				<p className="project-cards-description-paragraph">
					In dapibus vehicula odio ut condimentum. Fusce vel libero quis nisl
					malesuada sollicitudin. Fusce pharetra, neque id lacinia vehicula,
					massa augue consectetur lorem,
				</p>
			</div>

			<div className="project-cards-buttons">
				<div className="project-cards-single-button">CODE</div>
				<div className="project-cards-single-button">LIVE</div>
			</div>
			<div className="project-cards-tags-row">
				<div className="project-card-single-tag">REACT</div>
				<div className="project-card-single-tag">FIREBASE</div>
				<div className="project-card-single-tag">REDUX</div>
			</div>
		</div>
	)
}

export default ProjectCard
