import React, { useEffect, useRef } from "react"
import ProjectCard from "../../components/project-card/projectCard"
import "./projects.scss"
import { NavLink } from "react-router-dom"
import projects from "../../projects"
import SectionWrapper from "../../components/SectionWrapper/SectionWrapper"

import { ScrollTrigger } from "gsap/all"
import gsap from "gsap"

const staggerText = (node1, node2, node4) => {
	gsap.from([node1, node2, node4], {
		scrollTrigger: {
			trigger: ".project-cards",
		},
		autoAlpha: 0,
		duration: 1.2,
		opacity: 0,
		y: 100,
		delay: 0.3,
		ease: "power3.inOut",
		stagger: {
			amount: 0.3,
		},
	})
}

const fadeIn = (nodes) => {
	gsap.from(nodes, {
		autoAlpha: 0,
		scrollTrigger: {
			trigger: ".projects",
		},
		duration: 1.2,
		opacity: 0,
		ease: "power3.inOut",
	})
}

const Projects = () => {
	let line1 = useRef(null)
	let line2 = useRef(null)

	gsap.registerPlugin(ScrollTrigger)

	useEffect(() => {
		staggerText(line1.childNodes)
		fadeIn(line2)
	}, [line1, line2])

	return (
		<SectionWrapper>
			<div className="projects">
				<div className="projects-title" ref={(el) => (line2 = el)}>
					<h2 className="projects-title-title" aria-hidden>
						Featured Work
					</h2>
					<p>
						Here are some of my featured projects. I primarily develop front-end
						applications using React and modern JavaScript technologies.
					</p>
					<NavLink
						className="all-projects-button"
						to={{
							pathname: "projects",
							projects: projects,
						}}
					>
						View all my projects
					</NavLink>
				</div>

				<div className="project-cards" ref={(el) => (line1 = el)}>
					{projects.slice(0, 3).map((project) => {
						return <ProjectCard key={project.name} information={project} />
					})}
				</div>
			</div>
		</SectionWrapper>
	)
}

export default React.memo(Projects)
