import React, { useEffect } from "react"
import "./about.scss"
import profile from "../../resources/me.webp"
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
						Hi, I'm Brainilio and I'm known as a creative developer. I aim,
						every single day, to combine both technology and creativity together
						in order to create and develop excellent solutions to real life
						problems. Applied creativity is reflected in my everyday life in
						which I love to develop new recipes to cook, play around with
						Arduino, draw my own comic book and be active when it comes to
						playing instruments. My{" "}
						<a href="https://drive.google.com/file/d/1-Tc6Kt-0-HnnJP0XjTz7SeSmw6u3IQ6E/view?usp=sharing">
							strengths
						</a>{" "}
						reflect a desire in achieving, responsibility and developing with a
						restorative and deliberative attitude. I am a strong believer in
						values, ethics and empathy in the field of tech.{" "}
						<a href="mailto: brainilioir@gmail.com">Let's connect!</a>
					</p>
				</div>
				<div className="about-image">
					<div ref={imgRef} className="about-border-style-image"></div>
					<LazyLoad offset={100}>
						<img
							width="200"
							height="200"
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
