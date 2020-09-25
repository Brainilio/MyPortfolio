import React from "react"
import "./publicmessage.scss"

const Publicmessage = (props) => {
	return (
		<p onClick={props.show} aria-hidden className="public-message">
			Dear visitor 🙌🏽, <br />
			this site is currently under construction ⛑ <br />
			Did I peak your interest? <br />
			Feel free to reach out to me on one of <br /> the following outlets on
			your left 😁
			<br />
			Or e-mail me at:{" "}
			<a style={{ color: "black" }} href="mailto: brainilioir@gmail.com">
				Brainilioir@gmail.com
			</a>
		</p>
	)
}

export default Publicmessage
