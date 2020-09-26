import React, { useEffect, useRef, useState } from "react"
import ProjectCard from "../../components/project-card/projectCard"
import "./projects.scss"

import BurgerBuilder from "../../resources/projects/burger-builder.webp"
import Salvame from "../../resources/projects/salvame.webp"
import Lolmfc from "../../resources/projects/lolmfc.webp"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/all"

const Projects = () => {
	//project modelling
	const projectRef = useRef(null)
	gsap.registerPlugin(ScrollTrigger)
	useEffect(() => {
		gsap.from(projectRef.current, {
			scrollTrigger: {
				trigger: projectRef.current,
				toggleActions: "restart none none none",
			},
			x: -200,
			opacity: 0,
			ease: "power1",
			duration: 1,
		})
	}, [])
	const [projects] = useState([
		{
			name: "Burger Builder",
			shortDescription:
				"The burger builder is an app that I developed to train my React competencies. Build your burger, sign/log in and review your orders. React Hooks, Redux, Jest/Enzyme, JWT token based Auth.",
			previewImage: BurgerBuilder,
			livePreview: "https://react-my-burger-builder-d060b.web.app/",
			gitHub: "https://github.com/Brainilio/burger-builder",
			tags: ["REACTJS", "FIREBASE", "REDUX"],
			category: "Front-End",
			longerDescription: "",
			dateCreated: "AUGUST 5, 2020",
			fullImages: ["", "", ""],
		},
		{
			name: "Salvame",
			shortDescription:
				"Salvame is an art-initiative to engage the people of Boyle Heights with environmental racism. I developed a web-application using three-js to display local art, in a very abstract and symbolic way.",
			previewImage: Salvame,
			livePreview: "https://salvame-react.netlify.app/",
			gitHub: "https://github.com/Brainilio/salvame-app",
			tags: ["REACTJS", "THREEJS", "STARTUP"],
			category: "Front-End",
			longerDescription: "",
			dateCreated: "JULY 30, 2020",
			fullImages: ["", "", ""],
		},
		{
			name: "LOL: My Favorite Champ",
			shortDescription:
				"LOL: My Favorite Champ is a MERN-stack application in which you can preview your favorite League of Legends champions and see their in-game pros and cons. This is a project that I made in 2018 and decided to remake in React.",
			previewImage: Lolmfc,
			livePreview: "https://github.com/Brainilio/lol-my-fav-champ",
			gitHub: "https://github.com/Brainilio/lol-my-fav-champ",
			tags: ["REACTJS", "NODEJS", "MONGODB"],
			category: "Full-Stack",
			longerDescription: "",
			dateCreated: "AUGUST 30, 2020",
			fullImages: ["", "", ""],
		},
	])

	return (
		<section className="projects">
			<div className="projects-title">
				<div className="projects-title-block"></div>
				<span className="projects-title-title" aria-hidden>
					MY WORK 💻
				</span>
			</div>
			<p className="projects-paragraph">
				Here are some of my projects.
				<br />
				To see more, visit my{" "}
				<a
					href="https://github.com/brainilio"
					rel="noopener noreferrer"
					target="_blank"
				>
					Github
				</a>
				.{" "}
			</p>
			<div ref={projectRef} className="project-cards">
				{projects.map((project) => {
					return <ProjectCard key={project.name} information={project} />
				})}
			</div>
		</section>
	)
}

export default Projects
