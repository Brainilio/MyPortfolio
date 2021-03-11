import React from "react"
import "./projectCard.scss"
import { Link } from "react-router-dom"

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
					<div className="project-cards-description">
						<span className="project-cards-description-title">
							{props.information.name}
						</span>
						<p className="project-cards-description-paragraph">
							{props.information.shortDescription}
						</p>

						<Link
							to={{
								pathname: `/project/${props.information.slug}`,
								project: props.information,
							}}
						>
							<span className="read-more">READ MORE</span>
						</Link>

						<div className="project-cards-buttons">
							<a
								rel="noopener noreferrer"
								target="_blank"
								href={props.information.gitHub}
								className="project-cards-single-button"
							>
								C O D E
							</a>

							{props.information.livePreview ? (
								<a
									rel="noopener noreferrer"
									target="_blank"
									href={props.information.livePreview}
									className="project-cards-single-button-2"
								>
									L I V E
								</a>
							) : null}
						</div>
					</div>
					{/* </Link> */}
				</div>
			</div>
		</>
	)
}

export default ProjectCard
