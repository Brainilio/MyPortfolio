import React from "react"
import "./projectCard.scss"

const projectCard = () => {
	return (
		<div className="project-cards-single-card">
			<div className="project-cards-image"></div>
			<div className="project-cards-tags-row">
				<div className="project-card-single-tag">REACT</div>
				<div className="project-card-single-tag">FIREBASE</div>
				<div className="project-card-single-tag">REDUX</div>
			</div>
			<div className="project-cards-buttons">
				<div className="project-cards-single-button">CODE</div>
				<div className="project-cards-single-button">LIVE</div>
			</div>
		</div>
	)
}

export default projectCard
