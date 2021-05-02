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
	const titleRef = useRef(null)
	// let pr = useRef(null)
	gsap.registerPlugin(ScrollTrigger)
	useEffect(() => {
		// gsap.from([projectRef.current.childNodes], {
		// 	scrollTrigger: {
		// 		trigger: projectRef.current,
		// 		start: "top center",
		// 	},
		// 	x: -500,
		// 	opacity: 0,
		// 	ease: "power1",
		// 	duration: 1,
		// })
		// gsap.from([titleRef.current.childNodes], {
		// 	scrollTrigger: {
		// 		trigger: titleRef.current,
		// 	},
		// 	duration: 0.8,
		// 	yPercent: 80,
		// 	delay: 0.8,
		// 	opacity: 0,
		// 	stagger: 0.08,
		// 	ease: "power4.easeinout",
		// })
		// pr.current.scrollLeft = 0
	}, [])

	// function scrollLeft() {
	// 	pr.current.scrollLeft += 250
	// }

	// function scrollRight() {
	// 	pr.current.scrollLeft = pr.current.scrollLeft - 250
	// }

	return (
		<section ref={projectRef} className="projects">
			<div className="projects-title">
				<span ref={titleRef} className="projects-title-title" aria-hidden>
					Featured Work
				</span>

				<NavLink
					to={{
						pathname: "projects",
						projects: projects,
					}}
				>
					<button className="all-projects-button">
						A L L &nbsp; P R O J E C T S
					</button>
				</NavLink>
			</div>

			{/* <span onClick={scrollLeft}>Scroll left</span>
			<span onClick={scrollRight}>Scroll right</span> */}
			<div className="project-cards">
				{projects.slice(0, 3).map((project) => {
					return <ProjectCard key={project.name} information={project} />
				})}
			</div>
		</section>
	)
}

export default React.memo(Projects)
