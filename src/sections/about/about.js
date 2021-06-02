import React from "react"
import "./about.scss"
import profile from "../../resources/profile.webp"
// import sanfran from "../../resources/san-fran.webp"
// import rotterdam from "../../resources/rotterdam.webp"
import LazyLoad from "react-lazyload"
import { Link } from "react-scroll"
import Skill from "../../components/Skill/skill"
import SectionWrapper from "../../components/SectionWrapper/SectionWrapper"

const About = () => {
	return (
		<SectionWrapper>
			<div className="about-block">
				<div className="about-text">
					<h2 className="about-title">About</h2>
					<div className="short-bio">
						<h3>Who am I?</h3>
						<p>
							Hi! I’m a creative developer who’s driven by empathy and
							creativity. In my career I specialize in Front-end development,
							yet I’m not shy from back-end or UX/UI either. I always aim to get
							the best out of myself by staying up to date with latest trends
							and technologies, and I stand firm in my values. I'm extremely
							fascinated by user interfaces, and design systems in particular.
							In my free time, I’m busy with everything arts! From cooking to
							drawing my comics.
						</p>
						<div>
							<Link
								className="button-lets-chat"
								smooth={true}
								duration={600}
								offset={-500}
								to="contact"
							>
								Contact me
							</Link>
							<a
								className="button-resume-chat"
								rel="noopener noreferrer"
								target="_blank"
								href="https://drive.google.com/file/d/1TgOjKdYPxZr7SmBChUm1osO84EPkXSA8/view?usp=sharing"
							>
								Resume
							</a>
						</div>
					</div>
					<Skill />
				</div>
				<div className="about-image">
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
			</div>
		</SectionWrapper>
	)
}

export default About
