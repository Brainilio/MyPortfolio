import React from "react"
import "./ContactInstructions.scss"

const Contactinstructions = () => {
	return (
		<div className="contact-instructions">
			<h1>What can you expect from me?</h1>
			<h2>
				Thanks for willing to contact me, let’s get the ball rolling! There are
				a couple of things you can expect when working together with me.
			</h2>

			<ul>
				<li>
					<h3>Responsibility</h3>
					<p>
						I take psychological and full ownership of what I say and do. I’m
						committed to stable values such as honesty and loyalty.
					</p>
				</li>
				<li>
					<h3>Deliberation</h3>
					<p>
						Before I make decisions or choices, I take serious care thinking and
						anticipating obstacles.
					</p>
				</li>
				<li>
					<h3>Development</h3>
					<p>
						I recognize and cultivate potential in not only myself, but also in
						others. I derive satisfaction from evidence of progress.
					</p>
				</li>

				<li>
					<h3>Hard-working & Achieving</h3>
					<p>
						I love hard work and possess a great deal of stamina. I take immense
						satisfaction in being busy and productive.
					</p>
				</li>
			</ul>
		</div>
	)
}

export default Contactinstructions
