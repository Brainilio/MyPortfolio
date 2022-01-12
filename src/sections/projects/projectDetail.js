import React, { useEffect } from "react"
import "./projectDetail.scss"
import { Redirect, useHistory } from "react-router-dom"
import Contact from "../contact/contact"
import SectionWrapper from "../../components/SectionWrapper/SectionWrapper"
// import Markdown from "../../components/Markdown/Markdown"

const StoryPart = ({ imageSrc, text, title, children, isVideo }) => {
	return (
		<div className="project-detail-story">
			<div className="p-story-img">
				<img src={imageSrc} width="350px" height="350px" alt="" />
			</div>
			<div className="p-story-text">
				<h2>{title}</h2>
				<p>{text}</p>
				{children}
			</div>
		</div>
	)
}

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
		// content = <Markdown source="test" />

		content = (
			<div className="full-page-project-detail">
				<SectionWrapper className="project-detail-wrapper no-snap">
					<button
						onClick={history.goBack}
						className="project-detail-close-modal"
					>
						X
					</button>
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
									<h2>Stack:</h2>
									<span>
										{props.location.project.tags.map((tag) => (
											<span key={tag} className="project-card-single-tag">
												<> {tag} &nbsp;</>
											</span>
										))}
									</span>
								</div>
							</div>
							<div className="p-buttons">
								{props.location.project.livePreview ? (
									<a
										rel="noopener noreferrer"
										target="_blank"
										href={props.location.project.livePreview}
										className="project-cards-single-button-2"
									>
										Live
									</a>
								) : null}
								<a
									rel="noopener noreferrer"
									target="_blank"
									href={props.location.project.gitHub}
									className="project-cards-single-button"
								>
									Code{" "}
								</a>
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

					<StoryPart
						imageSrc={props.location.project.fullImages[0]}
						title={"Process"}
						text={props.location.project.process}
					/>
					<StoryPart
						imageSrc={props.location.project.fullImages[1]}
						title="Challenges"
						text={props.location.project.challenges}
					/>
					<StoryPart
						imageSrc={props.location.project.fullImages[2]}
						title="What would I do differently?"
						text={props.location.project.differently}
					/>
					<StoryPart
						imageSrc={props.location.project.fullImages[3]}
						title="My take away"
						text={props.location.project.takeaway}
					/>
					{props.location.project.additionalLinks.length > 0 && (
						<StoryPart
							imageSrc={props.location.project.fullImages[4]}
							title="Additional Links"
						>
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
						</StoryPart>
					)}
				</SectionWrapper>
				<Contact className="no-snap" />
			</div>
		)
		// {/* <section className="project-detail-wrapper">
		// 	<button onClick={history.goBack} className="project-detail-close-modal">
		// 		X
		// 	</button>
		// 	<section className="p-header">

		// 		{/* arrow here */}
		// 	</section>
		// 	<section className="p-process">
		// 		<div className="p-process-img">
		// 			<img
		// 				src={props.location.project.fullImages[0]}
		// 				width="350px"
		// 				height="350px"
		// 				alt=""
		// 			/>
		// 		</div>
		// 		<div className="p-process-text">
		// 			<h1>Process</h1>
		// 			<p>{props.location.project.process}</p>
		// 		</div>
		// 	</section>
		// 	<section className="p-challenges">
		// 		<div className="p-challenges-img">
		// 			<img
		// 				src={props.location.project.fullImages[1]}
		// 				width="350px"
		// 				height="350px"
		// 				alt=""
		// 			/>
		// 		</div>
		// 		<div className="p-challenges-text">
		// 			<h1>Challenges</h1>
		// 			<p>{props.location.project.challenges}</p>
		// 		</div>
		// 	</section>
		// 	<section className="p-different">
		// 		<div className="p-different-img">
		// 			<img
		// 				src={props.location.project.fullImages[2]}
		// 				width="350px"
		// 				height="350px"
		// 				alt=""
		// 			/>
		// 		</div>
		// 		<div className="p-different-text">
		// 			<h1>What would I do differently?</h1>
		// 			<p> {props.location.project.differently}</p>
		// 		</div>
		// 	</section>
		// 	<section className="p-takeaway">
		// 		<div className="p-takeaway-img">
		// 			<img
		// 				src={props.location.project.fullImages[3]}
		// 				width="350px"
		// 				height="350px"
		// 				alt=""
		// 			/>
		// 		</div>
		// 		<div className="p-takeaway-text">
		// 			<h1>My takeaway</h1>
		// 			<p>{props.location.project.takeaway}</p>
		// 		</div>
		// 	</section>

		// 	{props.location.project.additionalLinks.length > 0 ? (
		// 		<>
		// 			<section className="p-additional">
		// 				<div className="p-additional-text">
		// 					<h1>Additional links</h1>
		// 					<ul>
		// 						{props.location.project.additionalLinks.map((link) => (
		// 							<li key={link.name}>
		// 								<a
		// 									rel="noopener noreferrer"
		// 									target="_blank"
		// 									href={link.link}
		// 								>
		// 									{link.name}
		// 								</a>
		// 							</li>
		// 						))}
		// 					</ul>
		// 				</div>

		// 				<div className="p-additional-img"></div>
		// 			</section>
		// 		</>
		// 	) : null}

		// 	<Contact className="no-snap" />
		// </section> */}
	}

	return content
}

export default React.memo(ProjectDetail)
