import React, { useState, useRef, useEffect } from "react"
import "./SideDrawer.scss"
import p1 from "../../resources/menu/menu-1.webp"
import p2 from "../../resources/menu/menu-2.webp"
import p3 from "../../resources/menu/menu-3.webp"
import p4 from "../../resources/menu/menu-4.webp"
import gsap from "gsap"
import { Link } from "react-scroll"

const staggerText = (node1, node2, node3, node4) => {
	gsap.from([node1, node2, node3, node4], {
		duration: 0.8,
		opacity: 0,
		y: 100,
		delay: 0.3,
		ease: "power3.inOut",
		stagger: {
			amount: 0.3,
		},
	})
}

const SideDrawer = (props) => {
	let attachedClasses = ["menu", "closed"]
	let attachedClasses1 = ["menu2", "closed"]
	let line1 = useRef(null)
	let line2 = useRef(null)
	let line3 = useRef(null)
	let line4 = useRef(null)

	let [currentImage, setcurrentImage] = useState("")
	let [currentImageClass, setCurrentImageClass] = useState("")

	if (props.show) {
		attachedClasses = ["menu", "open"]
		attachedClasses1 = ["menu2", "open"]
	}

	const backgroundHandler = (image) => {
		setcurrentImage(image)
		setCurrentImageClass("kenburn")
	}

	useEffect(() => {
		if (props.show) {
			staggerText(line1, line2, line3, line4)
		}
	}, [props.show])

	const resetImage = () => {
		setCurrentImageClass("")
		setcurrentImage("")
	}

	return (
		<>
			<div className={attachedClasses.join(" ")}>
				<div className="menu-items">
					<ul>
						<li>
							<Link
								activeClass="link-active"
								to="projects"
								smooth={true}
								offset={-150}
								duration={600}
							>
								<h1
									ref={(el) => (line1 = el)}
									onMouseLeave={resetImage}
									onMouseOver={() => backgroundHandler(p1)}
									onClick={() => props.clicked()}
								>
									Work
								</h1>
							</Link>
						</li>
						<li>
							<Link
								activeClass="link-active"
								to="about"
								smooth={true}
								offset={-150}
								duration={600}
							>
								<h1
									ref={(el) => (line2 = el)}
									onMouseLeave={resetImage}
									onMouseOver={() => backgroundHandler(p4)}
									onClick={props.clicked}
								>
									About
								</h1>
							</Link>
						</li>
						<li>
							<Link
								activeClass="link-active"
								to="my-skills"
								smooth={true}
								offset={-150}
								duration={600}
							>
								<h1
									ref={(el) => (line3 = el)}
									onMouseLeave={resetImage}
									onMouseOver={() => backgroundHandler(p2)}
									onClick={props.clicked}
								>
									Skills
								</h1>
							</Link>
						</li>
						<li>
							<Link
								activeClass="link-active"
								to="contact"
								smooth={true}
								offset={-150}
								duration={600}
							>
								<h1
									ref={(el) => (line4 = el)}
									onMouseLeave={resetImage}
									onMouseOver={() => backgroundHandler(p3)}
									onClick={() => props.clicked()}
								>
									Contact Me
								</h1>
							</Link>
						</li>
					</ul>
				</div>

				<img className={currentImageClass} src={currentImage} alt="" />
			</div>
			<div className={attachedClasses1.join(" ")}></div>
		</>
	)
}

export default SideDrawer
