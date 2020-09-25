import React from "react"
import rocket from "../../resources/rocket.svg"
import { ReactSVG } from "react-svg"
import "./rocketship.scss"

const rocketship = () => {
	return (
		<div className="rocket-ship">
			<ReactSVG src={rocket} />
		</div>
	)
}

export default rocketship
