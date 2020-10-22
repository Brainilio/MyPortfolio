import React from "react"
import "./projectDetail.scss"
import Carousel from "@brainhubeu/react-carousel"
import "@brainhubeu/react-carousel/lib/style.css"

const projectDetail = (props) => {
	//props.project == project you're working with.
	const items = []
	props.project.fullImages.map((image) =>
		items.push({
			original: image,
			thumbnail: image,
			originalClass: "project-detail-images",
		})
	)

	return (
		<div className="project-detail-container">
			<button onClick={props.clicked} className="project-detail-close-modal">
				X
			</button>
			<Carousel autoPlay={6000} centered infinite offset={20}>
				{props.project.fullImages.map((image) => (
					<img key={image} className="image" src={image} alt="project" />
				))}
			</Carousel>

			<div className="project-title-with-tags">
				<span className="project-detail-title">{props.project.name}</span>
				<span className="project-detail-date">{props.project.dateCreated}</span>
				<div className="project-detail-tags-row">
					{props.project.tags.map((tag) => (
						<div key={tag} className="project-card-single-tag">
							{tag}
						</div>
					))}
				</div>
			</div>
			<p className="project-detail-description">
				<h3>Description</h3>
				{props.project.description}
				<h3>Process</h3>
				{props.project.process}
				<h3>Challenges</h3>
				{props.project.challenges}
				<h3>What would I do differently?</h3>
				{props.project.differently}
				<h3>My takeaway</h3>
				{props.project.takeaway}
				{props.project.additionalLinks.length > 0 ? (
					<>
						<h1>Additional links</h1>
						<ul>
							{props.project.additionalLinks.map((link) => (
								<li key={link}>
									<a rel="noopener noreferrer" target="_blank" href={link.link}>
										{link.name}
									</a>
								</li>
							))}
						</ul>
					</>
				) : null}
			</p>
			<div className="project-detail-buttons">
				<a
					rel="noopener noreferrer"
					target="_blank"
					href={props.project.gitHub}
					className="project-cards-single-button"
				>
					<button className="project-detail-single-button">CODE </button>
				</a>

				<a
					rel="noopener noreferrer"
					target="_blank"
					href={props.project.livePreview}
					className="project-cards-single-button"
				>
					<button className="project-detail-single-button">LIVE</button>
				</a>
			</div>
		</div>
	)
}

export default projectDetail
