import React from "react"
// import ProjectDetail from "../../sections/projects/projectDetail"
// import Modal from "../Modal/Modal"
import "./projectCard.scss"
// import LazyLoad from "react-lazyload"

const ProjectCard = (props) => {
	return (
		<>
			{/* {props.show ? (
				<Modal show={props.show} clicked={props.clicked}>
					<ProjectDetail name={props.information.name} />
				</Modal>
			) : null} */}

			<div className="project-cards-single-card">
				<img
					className="project-cards-image"
					src={props.information.previewImage}
					alt="preview of project"
					onClick={() => props.clicked(props.information)}
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
						<div key={tag} className="project-card-single-tag">
							{tag}
						</div>
					))}
				</div>
			</div>
		</>
	)
}

export default ProjectCard
