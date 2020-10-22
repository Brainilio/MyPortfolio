import React from "react"
// import AliceCarousel from "react-alice-carousel"
import Slider from "react-animated-slider"
import "react-animated-slider/build/horizontal.css"
import "./projectDetail.scss"

const projectDetail = (props) => {
	//props.project == project you're working with.
	// const items = []
	// props.project.fullImages.map((image) =>
	// 	items.push(<img key={image} src={image} alt="project" />)
	// )

	return (
		<div className="project-detail-container">
			<button onClick={props.clicked} className="project-detail-close-modal">
				X
			</button>
			<div className="project-detail-images">
				<Slider autoplay={3000}>
					{props.project.fullImages.map((image) => (
						<img key={image} src={image} alt="project" />
					))}
				</Slider>
			</div>

			<div className="project-title-with-tags">
				<span className="project-detail-title">{props.project.name}</span>
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
				lorem, sed pellentesque mauris suscipit sit amet. Morbi convallis est
				venenatis iaculis tempus. Vivamus lacinia justo et felis sollicitudin
				mollis. Morbi sodales accumsan dui sed varius. Sed tempor enim eget
				accumsan condimentum. Cras et quam eget dolor posuere malesuada. Donec
				dapibus mauris vitae ipsum egestas, vel molestie turpis viverra. Nulla
				sapien nisi,
				<h3>Process</h3>
				vestibulum a sapien et, sodales feugiat risus. Donec ac malesuada nisi,
				eget ornare ex. Pellentesque semper placerat vehicula. Etiam semper
				accumsan purus non lobortis. Cras rutrum scelerisque faucibus. Morbi
				imperdiet eros ex. Morbi sed elit vel urna luctus pulvinar sit amet eu
				velit. Vestibulum diam sem, cursus et efficitur at, porttitor et lacus.
				Sed dapibus sit amet enim eu efficitur. Nunc dictum malesuada varius.
				Praesent bibendum vel sem sit amet ferme
				<h3>Challenges</h3>
				non lobortis. Cras rutrum scelerisque faucibus. Morbi imperdiet eros ex.
				Morbi sed elit vel urna luctus pulvinar sit amet eu velit. Vestibulum
				diam sem, cursus et efficitur at, porttitor et lacus. Sed dapibus sit
				amet enim eu efficitur. Nunc dictum malesuada varius. Praesent bibendum
				vel sem sit amet ferme
				<h3>What would I do differently?</h3>
				purus non lobortis. Cras rutrum scelerisque faucibus. Morbi imperdiet
				eros ex. Morbi sed elit vel urna luctus pulvinar sit amet eu velit.
				Vestibulum diam sem, cursus et efficitur at, porttitor et lacus. Sed
				dapibus sit amet enim eu efficitur. Nunc dictum malesuada varius.
				Praesent bibendum vel sem sit amet ferme
				<h3>My takeaway</h3>
				varius vestibulum lobortis. Praesent vulputate facilisis arcu, in
				malesuada velit lacinia et. Duis sagittis dapibus augue, vitae ultrices
				urna suscipit et. Sed a venenatis ante, semper tempor lacus.
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
