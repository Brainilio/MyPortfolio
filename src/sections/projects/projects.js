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
				<span className="projects-title" aria-hidden>
					My Work 💻
				</span>
			</div>
			<p className="projects-paragraph">
				Here are my featured projects. Click on the the project card for more
				information! To see more code, visit my{" "}
				<a
					href="https://github.com/brainilio"
					rel="noopener noreferrer"
					target="_blank"
				>
					Github
				</a>
			</p>

			<NavLink
				style={{ textDecoration: "none" }}
				to={{
					pathname: "projects",
					projects: projects,
				}}
			>
				<p className="projects-paragraph">
					Click down below to see all my projects. All of my work ranges from
					development to UX/UI design and art!
					<br />
				</p>
				<button className="all-projects-button">P R O J E C T S</button>
			</NavLink>

			<div ref={projectRef} className="project-cards">
				{projects.slice(0, 6).map((project) => {
					return <ProjectCard key={project.name} information={project} />
				})}
			</div>
		</section>
	)
}

export default React.memo(Projects)
