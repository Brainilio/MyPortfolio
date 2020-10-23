import React from "react"
import "./projectDetail.scss"
import AliceCarousel from "react-alice-carousel"
import "react-alice-carousel/lib/alice-carousel.css"
import { Redirect, useHistory } from "react-router-dom"

const ProjectDetail = (props) => {
	//props.location.project == project you're working with.
	let history = useHistory()
	let content = <Redirect to="/" />

	if (props.location.project) {
		content = (
			<section className="project-detail-container">
				{/* <Link to="/"> */}
				<button onClick={history.goBack} className="project-detail-close-modal">
					X
				</button>
				{/* </Link> */}

				<div className="project-title-with-tags">
					<span className="project-detail-title">
						<div className="project-title-block"></div>
						{props.location.project.name}
					</span>
					<span className="project-detail-date">
						{props.location.project.dateCreated}
					</span>
					<div className="project-detail-tags-row">
						{props.location.project.tags.map((tag) => (
							<div key={tag} className="project-card-single-tag">
								{tag}
							</div>
						))}
					</div>
				</div>
				<div className="project-detail-buttons">
					<a
						rel="noopener noreferrer"
						target="_blank"
						href={props.location.project.gitHub}
						className="project-cards-single-button"
					>
						<button className="project-detail-single-button">CODE </button>
					</a>

					<a
						rel="noopener noreferrer"
						target="_blank"
						href={props.location.project.livePreview}
						className="project-cards-single-button"
					>
						<button className="project-detail-single-button">LIVE</button>
					</a>
				</div>

				<p className="project-detail-description">
					<h3>Description</h3>
					{props.location.project.description}
					<h3>Process</h3>
					{props.location.project.process}

					<AliceCarousel
						animationType={"fadeout"}
						autoPlay
						controlsStrategy={false}
						disableDotsControls
						infinite
						autoPlayInterval={3000}
					>
						{props.location.project.fullImages.map((image) => (
							<img key={image} className="image" src={image} alt="project" />
						))}
					</AliceCarousel>

					<h3>Challenges</h3>
					{props.location.project.challenges}
					<h3>What would I do differently?</h3>
					{props.location.project.differently}
					<h3>My takeaway</h3>
					{props.location.project.takeaway}
					{props.location.project.additionalLinks.length > 0 ? (
						<>
							<h1>Additional links</h1>
							<ul>
								{props.location.project.additionalLinks.map((link) => (
									<li key={link}>
										<a
											rel="noopener noreferrer"
											target="_blank"
											href={link.link}
										>
											{link.name}
										</a>
									</li>
								))}
							</ul>
						</>
					) : null}
				</p>
			</section>
		)
	}

	return content
}

export default ProjectDetail
