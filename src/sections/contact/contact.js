import React, { useEffect, useRef } from "react"
import "./contact.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { gsap } from "gsap"

const Contact = () => {
	const icons = useRef(null)
	const line = useRef(null)

	useEffect(() => {
		gsap.from(icons.current, {
			y: -300,
			duration: 0.8,
			ease: "power",
		})
		gsap.from(line.current, { y: -300, duration: 0.8, ease: "power" })
	})

	return (
		<div className="fixed-navigation">
			<div ref={icons} className="icons">
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
					href="mailto: brainilioir@gmail.com"
					rel="noopener noreferrer"
					target="_blank"
					className="icon"
				>
					<FontAwesomeIcon
						icon={["fa", "envelope"]}
						size="2x"
						className="icon"
					/>
				</a>
				<a
					href="https://drive.google.com/file/d/153Y-GmPSOaq0zd6MRoqXq1BPZsdXWcUy/view?usp=sharing"
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
			<span ref={line} className="separator-line"></span>
		</div>
	)
}

export default Contact
