import React from "react"
import "./about.scss"

const about = () => {
	return (
		<section className="about">
			<div className="about-title">
				<div className="about-title-block"></div>
				<span className="about-title-title" aria-hidden>
					ABOUT ME ⚡️
				</span>
			</div>
			<div className="about-block">
				<div className="about-text">
					<p>
						Hi there 👋🏽, Lorem ipsum dolor sit amet, consectetur adipiscing
						elit. In dapibus vehicula odio ut condimentum. Fusce vel libero quis
						nisl malesuada sollicitudin. Fusce pharetra, neque id lacinia
						vehicula, massa augue consectetur lorem, at venenatis eros libero ut
						lectus. Curabitur commodo turpis id laoreet rhoncus. Nulla sed
						dignissim neque. Suspendisse vel urna justo. Praesent sit amet risus
						non velit commodo auctor eu ac ante. Sed sit amet est sed est
						volutpat viverra nec nec felis.
					</p>
				</div>
				<div className="about-image">
					<div className="about-border-style-image"></div>
					<div className="about-image-image"></div>
				</div>
			</div>
		</section>
	)
}

export default about
