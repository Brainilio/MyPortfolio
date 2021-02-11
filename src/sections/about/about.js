import React, { useEffect } from "react"
import "./about.scss"
import profile from "../../resources/me.webp"
import sanfran from "../../resources/san-fran.webp"
import rotterdam from "../../resources/rotterdam.webp"
import LazyLoad from "react-lazyload"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/all"

const About = () => {
	const textRef = React.useRef(null)
	const imgRef = React.useRef(null)
	gsap.registerPlugin(ScrollTrigger)
	useEffect(() => {
		// gsap.from(textRef.current, {
		// 	scrollTrigger: {
		// 		trigger: textRef.current,
		// 		toggleActions: "restart",
		// 	},
		// 	x: -200,
		// 	duration: 0.8,
		// 	opacity: 0,
		// })
		// gsap.from(imgRef.current, {
		// 	scrollTrigger: {
		// 		trigger: imgRef.current,
		// 		toggleActions: "restart",
		// 	},
		// 	rotateZ: 360,
		// 	duration: 0.8,
		// 	opacity: 0,
		// })
	}, [])

	return (
		<section className="about">
			<div className="about-block">
				<div ref={textRef} className="about-text">
					<span className="about-title" aria-hidden>
						About Me
					</span>
					<p aria-hidden>
						I am a creative developer driven by empathy, creativity, and
						humility, specializing in Full-stack and UX/UI development. I aim to
						combine these two special powers of my to create and develop
						meaningful solutions for users. Applied creativity is reflected in
						my everyday life in which I love to develop new recipes to cook,
						play around with Arduino, draw my own comic book and be active when
						it comes to playing instruments. My{" "}
						<a
							rel="noopener noreferrer"
							target="_blank"
							href="https://drive.google.com/file/d/153Y-GmPSOaq0zd6MRoqXq1BPZsdXWcUy/view?usp=sharing"
						>
							strengths
						</a>{" "}
						reflect a desire for achievement, responsibility, and collaboration.
						I stand firm in my values and work to bring ethics and empathy to
						the tech field. Interested in talking?{" "}
						{/* <a href="mailto: brainilioir@gmail.com">Let's connect</a> or check
						out my{" "}
						<a
							rel="noopener noreferrer"
							target="_blank"
							href="https://drive.google.com/file/d/1TgOjKdYPxZr7SmBChUm1osO84EPkXSA8/view?usp=sharing"
							alt="resume"
						>
							resume!
						</a> */}
					</p>
					<div>
						<button className="button-lets-chat">L E T ' S C H A T</button>
						<button className="button-resume-chat">R E S U M E</button>
					</div>
				</div>
				<div className="about-image">
					<div>
						<LazyLoad offset={100}>
							<img
								width="200"
								height="250"
								className="about-image-sanfran"
								alt="san francisco"
								src={sanfran}
							/>
						</LazyLoad>
						<LazyLoad offset={100}>
							<img
								width="200"
								height="250"
								className="about-image-image"
								alt="brainilio"
								src={profile}
							/>
						</LazyLoad>
					</div>
					<div>
						<LazyLoad offset={100}>
							<img
								width="420"
								height="200"
								className="about-image-rotterdam"
								alt="rotterdam"
								src={rotterdam}
							/>
						</LazyLoad>
					</div>
				</div>
			</div>
		</section>
	)
}

export default About
