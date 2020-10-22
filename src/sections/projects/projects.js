import React, { useEffect, useRef, useState } from "react"
import ProjectCard from "../../components/project-card/projectCard"
import "./projects.scss"
import BurgerBuilder from "../../resources/projects/burger-builder.webp"
import Salvame from "../../resources/projects/salvame.webp"
import Lolmfc from "../../resources/projects/lolmfc.webp"
import gsap from "gsap"
import Natours from "../../resources/projects/natours.webp"
import Thanosrunner from "../../resources/projects/thanosrunner.webp"
import Paperinvaders from "../../resources/projects/paperinvaders.webp"
import { ScrollTrigger } from "gsap/all"
import Modal from "../../components/Modal/Modal"
import ProjectDetail from "./projectDetail"

// pictures...
import bb1 from "../../resources/projects/burger-builder/1.webp"
import bb2 from "../../resources/projects/burger-builder/2.webp"
import bb3 from "../../resources/projects/burger-builder/3.webp"

import lol1 from "../../resources/projects/lolmyfav/1.webp"
import lol2 from "../../resources/projects/lolmyfav/2.webp"
import lol3 from "../../resources/projects/lolmyfav/3.webp"
import lol4 from "../../resources/projects/lolmyfav/4.webp"
import lol5 from "../../resources/projects/lolmyfav/5.webp"

import n1 from "../../resources/projects/natours/1.webp"
import n2 from "../../resources/projects/natours/2.webp"
import n3 from "../../resources/projects/natours/3.webp"
import n4 from "../../resources/projects/natours/4.webp"
import n5 from "../../resources/projects/natours/5.webp"
import n6 from "../../resources/projects/natours/6.webp"
import n7 from "../../resources/projects/natours/7.webp"

import p1 from "../../resources/projects/paperinvader/1.webp"
import p2 from "../../resources/projects/paperinvader/2.webp"

import s1 from "../../resources/projects/salvame/1.webp"
import s2 from "../../resources/projects/salvame/2.webp"
import s3 from "../../resources/projects/salvame/3.webp"
import s4 from "../../resources/projects/salvame/4.webp"
import s5 from "../../resources/projects/salvame/5.webp"
import s6 from "../../resources/projects/salvame/6.webp"
import s7 from "../../resources/projects/salvame/7.webp"
import s8 from "../../resources/projects/salvame/8.webp"

import t1 from "../../resources/projects/thanosrunner/1.webp"
import t2 from "../../resources/projects/thanosrunner/2.webp"
import t3 from "../../resources/projects/thanosrunner/3.webp"
import t4 from "../../resources/projects/thanosrunner/4.webp"

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
			name: "Salvame",
			shortDescription:
				"Salvame is an art-initiative to empower and inform the locals of Boyle Heights about environmental racism. I created a web-app using three-js to display local art in an abstract and symbolic way.",
			previewImage: Salvame,
			livePreview: "https://salvame-react.netlify.app/",
			gitHub: "https://github.com/Brainilio/salvame-app",
			tags: ["REACTJS", "THREEJS", "GSAP"],
			category: "Front-End",
			longerDescription: "",
			dateCreated: "JULY, 2020",
			fullImages: [s1, s2, s3, s4, s5, s6, s7, s8],
		},
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
			dateCreated: "AUGUST, 2020",
			fullImages: [bb1, bb2, bb3],
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
			dateCreated: "AUGUST, 2020",
			fullImages: [lol1, lol2, lol3, lol4, lol5],
		},
		{
			name: "Natours <Still in DEV>",
			shortDescription:
				"Natours is a full-stack web-application website for booking the most exciting tours ever! Features include CRUD operations for admins, payments using stripe, file upload handling, authentication etc!",
			previewImage: Natours,
			livePreview: "https://github.com/Brainilio/natours",
			gitHub: "https://github.com/Brainilio/natours",
			tags: ["MERN", "REDUX", "UX/UI"],
			category: "Full-Stack",
			longerDescription: "",
			dateCreated: "OCTOBER, 2020",
			fullImages: [n1, n2, n3, n4, n5, n6, n7],
		},
		{
			name: "Thanos(?) Runner",
			shortDescription:
				"Thanos Runner is an endless runner game where you have to avoid getting hit by flying objects. In order to win the game you have to collect 6 infinity stones. The game gets harder the more stones you collect! Use AD to run and SPACE to jump.",
			previewImage: Thanosrunner,
			livePreview: "https://brainilio.github.io/ThanosRunner/",
			gitHub: "https://github.com/Brainilio/ThanosRunner",
			tags: ["TSCRIPT", "OOP", "GAME"],
			category: "Games",
			longerDescription: "",
			dateCreated: "JULY, 2018",
			fullImages: [t1, t2, t3, t4],
		},
		{
			name: "Paper Invaders",
			shortDescription:
				"Copy Invaders is a web-game that I developed in under 3 hours for my programming class. I’ve implemented the observer’s pattern, strategy pattern and the singleton pattern in this game.",
			previewImage: Paperinvaders,
			livePreview: "https://brainilio.github.io/Typescript_Design_Patterns/",
			gitHub: "https://github.com/Brainilio/Typescript_Design_Patterns",
			tags: ["TSCRIPT", "DPATTERNS", "OOP"],
			category: "Games",
			longerDescription: "",
			dateCreated: "JULY, 2020",
			fullImages: [p1, p2],
		},
	])

	const [modalOpen, setModalOpen] = useState(false)
	const [project, setproject] = useState(null)

	const modalHandler = (project = null) => {
		setModalOpen((prevstate) => !prevstate)
		setproject(project)
	}

	return (
		<section className="projects">
			<div className="projects-title">
				<div className="projects-title-block"></div>
				<span className="projects-title-title" aria-hidden>
					MY WORK 💻
				</span>
			</div>
			<p className="projects-paragraph">
				Here are some of my best projects.
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

			{modalOpen ? (
				<Modal show={modalOpen} clicked={modalHandler}>
					<ProjectDetail clicked={modalHandler} project={project} />
				</Modal>
			) : null}

			<div ref={projectRef} className="project-cards">
				{projects.map((project) => {
					return (
						<ProjectCard
							clicked={modalHandler}
							show={modalOpen}
							key={project.name}
							information={project}
						/>
					)
				})}
			</div>
		</section>
	)
}

export default Projects
