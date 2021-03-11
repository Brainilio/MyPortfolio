import React, { useEffect } from "react"
import "./about.scss"
import profile from "../../resources/me.webp"
import sanfran from "../../resources/san-fran.webp"
import rotterdam from "../../resources/rotterdam.webp"
import LazyLoad from "react-lazyload"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/all"
import { Link } from "react-scroll"

const About = () => {
	const textRef = React.useRef(null)
	const titleRef = React.useRef(null)

	gsap.registerPlugin(ScrollTrigger)
	useEffect(() => {
		gsap.from(textRef.current, {
			scrollTrigger: {
				trigger: textRef.current,
			},
			x: 500,
			opacity: 0,
			ease: "power1",
			duration: 2,
		})

		gsap.from([titleRef.current.childNodes], {
			scrollTrigger: {
				trigger: titleRef.current,
			},
			duration: 0.8,
			yPercent: 80,
			opacity: 0,
			delay: 1.5,
			stagger: 0.08,
			ease: "power4.easeinout",
		})
	}, [])

	return (
		<section ref={textRef} className="about">
			<div className="about-block">
				<div className="about-text">
					<span ref={titleRef} className="about-title" aria-hidden>
						<span>A</span>
						<span>b</span>
						<span>o</span>
						<span>u</span>
						<span>t</span>
					</span>
					<p aria-hidden>
						I am a creative developer driven by empathy, creativity, and
						humility, specializing in Full-stack and UX/UI development. I aim to
						combine these two special powers of my to create and develop
						meaningful solutions for users. Applied creativity is reflected in
						my everyday life in which I love to develop new recipes to cook,
						play around with Arduino, draw my own comic book and be active when
						it comes to playing instruments. My strengths reflect a desire for
						achievement, responsibility, and collaboration. I stand firm in my
						values and work to bring ethics and empathy to the tech field.
						Interested in talking?{" "}
					</p>
					<div>
						<Link smooth={true} duration={600} offset={-500} to="contact">
							<button className="button-lets-chat">
								L E T ' S &nbsp; C H A T
							</button>
						</Link>
						<a
							rel="noopener noreferrer"
							target="_blank"
							href="https://drive.google.com/file/d/1TgOjKdYPxZr7SmBChUm1osO84EPkXSA8/view?usp=sharing"
						>
							<button className="button-resume-chat">R E S U M E</button>
						</a>
					</div>
				</div>
				<div className="about-image">
					<div>
						<LazyLoad offset={100}>
							<img
								width="250"
								height="300"
								className="about-image-sanfran"
								alt="san francisco"
								src={sanfran}
							/>
						</LazyLoad>
						<LazyLoad offset={100}>
							<img
								width="250"
								height="300"
								className="about-image-image"
								alt="brainilio"
								src={profile}
							/>
						</LazyLoad>
					</div>
					<div>
						<LazyLoad offset={100}>
							<img
								width="530"
								height="300"
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
