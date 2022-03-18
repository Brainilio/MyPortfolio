import React from "react"
import "./ContactInstructions.scss"
import { FaLinkedin, FaTwitter, FaEnvelope } from "react-icons/fa"

const Contactinstructions = () => {
	return (
		<div className="contact-instructions">
			<h2>What can you expect from me?</h2>

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
						Before I make decisions or choices, I take serious care in thinking
						about, and anticipating obstacles.
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
			<ul>
				<li>
					<h3>You can also find or contact me at</h3>
				</li>
				<li className="socials-row">
					<ol>
						<a
							href="mailto:brainilioir@gmail.com"
							rel="noopener noreferrer"
							target="_blank"
						>
							<FaEnvelope size={30} />
						</a>
					</ol>
					<ol>
						<a
							href="https://linkedin.com/in/brainilio"
							rel="noopener noreferrer"
							target="_blank"
						>
							<FaLinkedin size={30} />
						</a>
					</ol>
					<ol>
						<a
							href="https://twitter.com/brainilio"
							rel="noopener noreferrer"
							target="_blank"
						>
							<FaTwitter size={30} />
						</a>
					</ol>
				</li>
			</ul>
		</div>
	)
}

export default Contactinstructions
