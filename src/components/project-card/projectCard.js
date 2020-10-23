import React from "react"
// import ProjectDetail from "../../sections/projects/projectDetail"
// import Modal from "../Modal/Modal"
import "./projectCard.scss"
import { Link } from "react-router-dom"
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
				<Link
					style={{
						position: "relative",
						textDecoration: "none",
					}}
					to={{
						pathname: `/project/${props.information.slug}`,
						project: props.information,
					}}
				>
					<img
						className="project-cards-image"
						src={props.information.previewImage}
						alt="preview of project"
						// onClick={() => props.clicked(props.information)}
					/>

					<div className="project-cards-description">
						<span className="project-cards-description-title">
							{props.information.name}
						</span>
						<p className="project-cards-description-paragraph">
							{props.information.shortDescription}
						</p>
						<div className="project-cards-tags-row">
							{props.information.tags.map((tag) => (
								<div key={tag} className="project-card-single-tag">
									{tag}
								</div>
							))}
						</div>
					</div>
				</Link>
				{/* <div className="project-cards-tags-row">
						{props.information.tags.map((tag) => (
							<div key={tag} className="project-card-single-tag">
								{tag}
							</div>
						))}
					</div> */}

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
			</div>
		</>
	)
}

export default ProjectCard
