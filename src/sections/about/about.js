import React, { useEffect } from "react"
import "./about.scss"
import profile from "../../resources/profile.webp"
import LazyLoad from "react-lazyload"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/all"

const About = () => {
	const textRef = React.useRef(null)
	const imgRef = React.useRef(null)
	gsap.registerPlugin(ScrollTrigger)
	useEffect(() => {
		gsap.from(textRef.current, {
			scrollTrigger: {
				trigger: textRef.current,

				toggleActions: "restart",
			},
			x: -200,
			duration: 0.8,
			opacity: 0,
		})
		gsap.from(imgRef.current, {
			scrollTrigger: {
				trigger: imgRef.current,
				toggleActions: "restart",
			},
			rotateZ: 360,
			duration: 0.8,
			opacity: 0,
		})
	}, [])
	return (
		<section className="about">
			<div className="about-title">
				<div className="about-title-block"></div>
				<span className="about-title-title" aria-hidden>
					ABOUT ME ⚡️
				</span>
			</div>
			<div className="about-block">
				<div ref={textRef} className="about-text">
					<p aria-hidden>
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
					<div ref={imgRef} className="about-border-style-image"></div>
					<LazyLoad offset={100}>
						<img
							className="about-image-image"
							alt="an astronaut"
							src={profile}
						/>
					</LazyLoad>
				</div>
			</div>
		</section>
	)
}

export default About
