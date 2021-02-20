import React, { useEffect } from "react"
import "./projectDetail.scss"
import { Redirect, useHistory } from "react-router-dom"
import Contact from "../Contact/Contact"

const ProjectDetail = (props) => {
	//props.location.project == project you're working with.
	let history = useHistory()
	let content = <Redirect to="/" />

	useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	if (
		props.location.project &&
		props.location.project.category === "Development"
	) {
		content = (
			<>
				<button onClick={history.goBack} className="project-detail-close-modal">
					X
				</button>
				<section className="p-header">
					<div className="p-landing">
						<div className="p-text">
							<h1>{props.location.project.name}</h1>
							<p>{props.location.project.description}</p>
							<div className="p-info">
								<div>
									<h2>Date</h2>
									<span>{props.location.project.dateCreated}</span>
								</div>
								<div>
									<h2>Tags</h2>
									<span>
										{props.location.project.tags.map((tag) => (
											<span key={tag} className="project-card-single-tag">
												#{tag}{" "}
											</span>
										))}
									</span>
								</div>
							</div>
							<div className="p-buttons">
								<button className="project-cards-single-button">
									C O D E{" "}
								</button>
								<button className="project-cards-single-button-2">
									L I V E{" "}
								</button>
							</div>
						</div>
						<div className="p-image">
							<img
								src={props.location.project.previewImage}
								width="450px"
								height="450px"
								alt="process"
							/>
						</div>
					</div>
					{/* arrow here */}
				</section>
				<section className="p-process">
					<div className="p-process-img">
						<img
							src={props.location.project.fullImages[0]}
							width="350px"
							height="350px"
							alt="process"
						/>
					</div>
					<div className="p-process-text">
						<h1>Process</h1>
						<p>{props.location.project.process}</p>
					</div>
				</section>
				<section className="p-challenges">
					<div className="p-challenges-img">
						<img
							src={props.location.project.fullImages[1]}
							width="350px"
							height="350px"
							alt="process"
						/>
					</div>
					<div className="p-challenges-text">
						<h1>Challenges</h1>
						<p>{props.location.project.challenges}</p>
					</div>
				</section>
				<section className="p-different">
					<div className="p-different-img">
						<img
							src={props.location.project.fullImages[2]}
							width="350px"
							height="350px"
							alt="process"
						/>
					</div>
					<div className="p-different-text">
						<h1>What would I do differently?</h1>
						<p> {props.location.project.differently}</p>
					</div>
				</section>
				<section className="p-takeaway">
					<div className="p-takeaway-img">
						<img
							src={props.location.project.fullImages[3]}
							width="350px"
							height="350px"
							alt="process"
						/>
					</div>
					<div className="p-takeaway-text">
						<h1>My takeaway</h1>
						<p>{props.location.project.takeaway}</p>
					</div>
				</section>

				{props.location.project.additionalLinks.length > 0 ? (
					<>
						<section className="p-additional">
							<div className="p-additional-text">
								<h1>Additional links</h1>
								<ul>
									{props.location.project.additionalLinks.map((link) => (
										<li key={link.name}>
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
							</div>

							<div className="p-additional-img"></div>
						</section>
					</>
				) : null}

				<Contact />
			</>
		)
	}

	return content
}

export default React.memo(ProjectDetail)
