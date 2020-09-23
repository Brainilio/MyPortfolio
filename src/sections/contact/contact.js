import React from "react"
import "./contact.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const contact = () => {
	return (
		<div className="fixed-navigation">
			<div className="icons">
				<a
					href="https://github.com/brainilio"
					rel="noopener noreferrer"
					target="_blank"
					className="icon"
				>
					<FontAwesomeIcon icon={["fab", "github"]} size="2x" />
				</a>

				<a
					href="https://www.linkedin.com/in/brainilio/"
					rel="noopener noreferrer"
					target="_blank"
					className="icon"
				>
					<FontAwesomeIcon
						icon={["fab", "linkedin"]}
						size="2x"
						className="icon"
					/>
				</a>
				<a
					href="https://twitter.com/brainilio"
					rel="noopener noreferrer"
					target="_blank"
					className="icon"
				>
					<FontAwesomeIcon
						icon={["fab", "twitter"]}
						size="2x"
						className="icon"
					/>
				</a>
				<a
					href="https://drive.google.com/file/d/1kToIu2ptUTsBf6aCcKfsWp22zjHYV_Gw/view?usp=sharing"
					rel="noopener noreferrer"
					target="_blank"
					className="icon"
				>
					<FontAwesomeIcon
						icon={["fa", "paperclip"]}
						size="2x"
						className="icon"
					/>
				</a>
			</div>
			<span className="separator-line"></span>
		</div>
	)
}

export default contact
