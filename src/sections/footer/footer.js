import React from "react"
import "./footer.scss"
import austronaut from "../../resources/astronaut.svg"
import { ReactSVG } from "react-svg"

const Footer = () => {
	return (
		<>
			{/* <ReactSVG className="astro" src={austronaut} /> */}
			<footer className="footer">
				<div className="moon-ground">
					<span className="text-footer" aria-hidden>
						Developed and Designed with 🖤 by Brainilio
					</span>
				</div>
			</footer>
		</>
	)
}

export default Footer
