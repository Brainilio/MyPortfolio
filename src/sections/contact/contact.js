import React from "react"
import "./contact.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const contact = () => {
	return (
		<div className="fixed-navigation">
			<div className="icons">
				<a
					href="www.google.com"
					className="icon"
					onClick={() => console.log("hi")}
				>
					<FontAwesomeIcon icon={["fab", "github"]} size="2x" />
				</a>

				<FontAwesomeIcon
					icon={["fab", "linkedin"]}
					size="2x"
					className="icon"
				/>
				<FontAwesomeIcon icon={["fab", "twitter"]} size="2x" className="icon" />
				<FontAwesomeIcon
					icon={["fa", "paperclip"]}
					size="2x"
					className="icon"
				/>
			</div>
			<span className="separator-line"></span>
		</div>
	)
}

export default contact
