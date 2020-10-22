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
			description:
				"Salvame is an art-initiative to engage the people of Boyle Heights with environmental racism. My solution is a web-application using three-js to display the art of Boyle Heights in a virtual world. However, it is very hard for the user to see the art because of toxic-like fog covering the art. This toxic fog represents the pollution in the area and it is actually based on the actual AQI in Boyle Heights. I use an official air quality index API. So the worse the actual air quality, the harder it would be to see the art. With this visual representation, I hope to awaken the fact that people would love to preserve, and here it comes, SAVE the culture, the neighborhood, the art, the people, and the lives of Boyle Heights by getting in action against environmental racism, this also explains the name SALVAME. ",
			process:
				"I took a very big leap in my learning when starting this project. To me, this project felt like a test to prove how meaningful my creations can be to others. I started this process off doing thorough research on environmental racism. I did this through field-research and desk-research. Shortly after making a couple of assumptions for myself, I decided to interview some members of the latino community in LA in order to confirm or get rid of assumptions I made. After getting enough results, I decided to do a frame your design challenge in order to frame a how might we question. After doing brainstorming, I decided to sketch some solutions and test them with my potential users. After getting green lights on the current salvame idea. I noted down some user stories, and based on further interviews I prioritized them. It was super important to stay close to my userbase, because that is how you create the best solutions, through empathy. After developing my first couple of iterations in vanillajs, i noticed how difficult it would be to scale this. I decided to switch to reactjs and used react-three-fiber to create the current prototype. This project was probably my favorite project ever, because of the amount of research and brainstorming that went into this. Secondly, being in contact with stakeholders was extra hard, because of COVID. I know how hard COVID has struck the latin community, in LA especially, and I had to be mindful of this. This lead to me making more assumptions on certain solutions.",
			challenges:
				"When it was time to actually develop the prototype, I was not as proficient in React or 3JS. I started this project off in VanillaJS, but noticed quickly how difficult it was to work with different components. This is when I decided to make the switch to React, knowing how amazing working with components can be. Though, as a result of switching tech-stacks, I didn't get the result that I wanted for my first iteration deadline.",
			differently:
				"Next time I would definitely start looking at my tech-stack earlier on, and try to really break my web-application down into little pieces. On top of this, I would probably",
			takeaway:
				"This is definitely how I want to approach every project. It is SO important to create something that is meaningful to marginalized communities. Salvame was a project that allowed me to talk to fellow Latin(o/a/x)s and get to know more about their stories. I loved everything from the entrepreneurial side all the way to the technology aspects of it. ",
			additionalLinks: [
				{
					link:
						"https://drive.google.com/file/d/1nwHwIIIn6-dzKIlBzooOL5XXjlql2UK7/view?usp=sharing",
					name: "Teaser trailer",
				},
				{
					link:
						"https://docs.google.com/document/d/12sID1tdnp5DRrCH0kw9jucZTqgWUZTiBcZcCAA-QBNU/edit?usp=sharing",
					name: "User stories",
				},
				{
					link:
						"https://docs.google.com/presentation/d/1kgoKBqwh1GhQosHqDB0XlKh-0hEbrd1vAJxy1KWRR9I/edit?usp=sharing",
					name: "Pitch deck",
				},
				{
					link:
						"https://drive.google.com/file/d/1yoR-Z9RDGxQXIaVY_V2IwmC8XrcRbVb2/view?usp=sharing",
					name: "Pitch in front of dragons",
				},
				{
					link:
						"https://drive.google.com/drive/folders/1Fpd3B_ogXf3KyZdbbQuaGJba8qjwfJar?usp=sharing",
					name: "Frame your design challenge",
				},
				{
					link:
						"https://drive.google.com/file/d/1NrkKX2QYba0TBcbk4SsJxwdLKppaHY2A/view?usp=sharing",
					name: "Executive Summary",
				},
			],
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
			description:
				"Burger Builder is my first ever ReactJS application. I built this application while learning all about ReactJS, using Academind's React fundamentals course. Burger Builder lets you to build your burger, order and review it. I used Redux for global state management, Jest/Enzyme for testing, react-router for routing and css modules for styling.",
			process:
				"When starting off this project, I made a quick sketch of all the components. By doing this, you really get a feel of how React is supposed to be leveraged. This makes your journey as a developer easy as well. Nearing the end of this project, I decided to turn my react class based components into react functional components.",
			challenges:
				"Some challenges I faced making this project was definitely Redux. Redux is a tool that often requires a lot of set-up (until I found out about redux toolkit that is). Another challenge I faced before even using react hooks, was prop-drilling. I quickly lost vision of where my props were and how they were called, so switching over to a global state was definitely something I recommend to everyone. At last, knowing when my components render and how to use React.memo and React.callback are still two features I still need to get more familiar with.",
			differently:
				"Next time I would use react-functional components right from the start, really track when my components render and how to use memoization to my advantage.",
			takeaway:
				"This project really kickstarted my ReactJS journey and I'm glad I applied a lot of fundamentals into this project.",
			additionalLinks: [],
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
			description:
				"LOLMFC is a MERN-stack application which used to be a MEVN-stack application when I first developed it in 2018. I decided to revamp this project, because of the lack of features it had back in July and I wanted to test out my skills in React. LOLMFC allows you to create an account and add your favorite League of Legends champions to your dashboard. By clicking on your champion, you get to read about your favorite champion's backstory and its advantages and disadvantages against other enemies. ",
			process:
				"First, when I started developing the back-end of this project in 2018, I was unfamiliar with HTTP protocols and NodeJS. So before even diving in; I decided to learn all about HTTP protocols and how NodeJS works behind the scenes. I had no idea what I was doing when developing the back-end, so this took a long while to understand how middlewares work, how owasp works etc. The front-end didn't take longer than a week, because I used vuetify on the front-end. 2 Years later and now a dedicated developer, I decided to grab that project, add more features to the back-end (authentication and extra security), and re-design and develop the front-end using React this time.",
			challenges:
				"Authentication and react-router definitely can get tricky and I often question whether I'm following best practices.",
			differently:
				"Next time, I would sketch out all my components and make sure I develop for mobile-first, because right now it can only be used on a desktop screen.",
			takeaway:
				"Revamping this project gave me a huge morale boost as a developer. To see how much I grew truly stimulated me to keep pushing forward in this field of tech.",
			additionalLinks: [
				{
					link: "https://vimeo.com/445248487",
					name: "Previous version",
				},
			],
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
			tags: ["MERN", "MVC", "UX/UI"],
			category: "Full-Stack",
			description:
				"Natours is a MERN application that lets you check out the coolest tours around the globe and book them! As a guide/administrator you have full CRUD functionalities over each user and tour. This project was created to really combine all of my skills on the front-end and back-end. As this project is still in progress, some features are still missing such as payments and extra security protocols.",
			process:
				"Before diving into this application, I went to refresh my knowledge on NodeJS by following a broad and deep fundamentals course. So again, I coded as I learned; which to me is one of the best methods to learn. I decided to really control the structure of my back-end by making use of the MVC pattern. This will allow me to scale my project as much as I want. After deploying my back-end, I made visuals using AdobeXD before setting up my front-end using react, react-router and redux for global state management.",
			challenges:
				"Knowing how security practices work can be a pain in the rear, but I know that with a lot of practice, I will get better at it.",
			differently:
				"As of now, I am satisfied with my results so far and will comment later on this point, when I decide this project is \n'finished'.",
			takeaway:
				"I love how I approached this project. I made sure to not fully develop all back-end and front-end features (kind of like not really tightening the screws when assembling a desk from IKEA).  ",
			additionalLinks: [],
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
			description:
				"Thanos Runner is an endless runner game in which you have to avoid getting hit by hulks, fireballs and stormbreakers. In order to win the game you have to collect 6 infinity stones. The game gets harder the more stones you collect! This is the first time I’ve developed something in Typescript using OOP principles (Inheritance, UML diagramming, Encapsulation, Classes, Composition). Use AD to run and SPACE to jump. P.S. I know it’s Link.",
			process:
				"When starting off this project, I had no idea what typescript or oop was. So this was also a project in which I applied everything I learned. The most exciting part was drawing out the UML, because it really showed me how much control I could have over my programs. It felt like I was playing the Sims to be honest (is that weird?). However, by drawing out my UML, I faced little to no difficulties when building out the application.",
			challenges:
				"One challenge was working with sprites and animation. This lead to me having to pick this Link sprite you see, instead of having Thanos.",
			differently:
				"Next time I would make more use of Typescript's type-checking advantages.",
			takeaway:
				"Really sticking to certain OOP principles is important to ensure best practices.",
			additionalLinks: [
				{
					link:
						"https://raw.githubusercontent.com/Brainilio/ThanosRunner/master/UMLklassendiagram.png",
					name: "UML Diagram",
				},
			],
			dateCreated: "JULY, 2018",
			fullImages: [t1, t2, t3, t4],
		},
		{
			name: "Paper Invaders",
			shortDescription:
				"Copy Invaders is a web-game that I developed in under 3 hours for my programming class. I implemented the observer’s pattern, strategy pattern and the singleton pattern in this game.",
			previewImage: Paperinvaders,
			livePreview: "https://brainilio.github.io/Typescript_Design_Patterns/",
			gitHub: "https://github.com/Brainilio/Typescript_Design_Patterns",
			tags: ["TSCRIPT", "DPATTERNS", "OOP"],
			category: "Games",
			description:
				"Copy Invaders is a web-game that I developed in under 3 hours for my programming class. This game was to prove my competencies in using common design patterns using Typescript. I implemented the observer’s pattern, strategy pattern and the singleton pattern in this game.",
			process:
				"Before even diving into the code, I had to figure out where I'd apply all the necessary design patterns and how to break down each class. When I did that, I drew it out on paper in a UML diagram. Only after doing that, I decided to start coding. ",
			challenges:
				"One challenge I had, was figuring out how and where to apply my strategy pattern.",
			differently:
				"Next time, I would take a LITTLE more time figuring out how to apply my patterns. It can really be a brainteasers, because there are so may different ways of implementing correct patterns.",
			takeaway:
				"This project really gave me strong fundamentals on how to approach OOP programming, and this is something I know will stick with me for the rest of my career.",
			additionalLinks: [],
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
				Here are some of my best projects. Click on the images to read more
				about it.
				<br />
				To see more projects, visit my{" "}
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
				<>
					<button onClick={modalHandler} className="project-detail-close-modal">
						X
					</button>
					<Modal show={modalOpen} clicked={modalHandler}>
						<ProjectDetail clicked={modalHandler} project={project} />
					</Modal>
				</>
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
