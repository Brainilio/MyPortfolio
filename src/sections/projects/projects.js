import React, { useEffect, useRef } from "react"
import ProjectCard from "../../components/project-card/projectCard"
import "./projects.scss"
import gsap from "gsap"
import { NavLink } from "react-router-dom"
import { ScrollTrigger } from "gsap/all"
import projects from "../../projects"

const Projects = () => {
	//project modelling
	const projectRef = useRef(null)
	gsap.registerPlugin(ScrollTrigger)

	useEffect(() => {
		// gsap.from(projectRef.current, {
		// 	scrollTrigger: {
		// 		trigger: projectRef.current,
		// 	},
		// 	x: -200,
		// 	opacity: 0,
		// 	ease: "power1",
		// 	duration: 1,
		// })
	}, [])

	return (
		<section className="projects">
			<div className="projects-title">
				<span className="projects-title-title" aria-hidden>
					My Work
				</span>
				<p className="projects-paragraph">
					Here are my featured projects.
					<strong> Click on a project card for more details! </strong>
					Click down below to see all my projects. All of my work ranges from
					development to UX/UI design and art!
					<br />
				</p>

				<button className="all-projects-button">
					<NavLink
						to={{
							pathname: "projects",
							projects: projects,
						}}
					>
						A L L &nbsp; P R O J E C T S
					</NavLink>
				</button>
			</div>

			<div ref={projectRef} className="project-cards">
				{projects.slice(0, 3).map((project) => {
					return <ProjectCard key={project.name} information={project} />
				})}
			</div>
		</section>
	)
}

export default React.memo(Projects)
