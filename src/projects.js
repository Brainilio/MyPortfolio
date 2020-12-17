import BurgerBuilder from "./resources/projects/burger-builder.webp"
import Salvame from "./resources/projects/salvame.webp"
import Lolmfc from "./resources/projects/lolmfc.webp"
import Natours from "./resources/projects/natours.webp"
import Thanosrunner from "./resources/projects/thanosrunner.webp"
import Paperinvaders from "./resources/projects/paperinvaders.webp"
import PokeDex from "./resources/projects/pokedex.png"
import Leidsman from "./resources/projects/leidsman.png"
import MariaBeautySalon from "./resources/projects/mariabeautysalon.png"
import Classifier from "./resources/projects/classifier.png"

// pictures...
import bb1 from "./resources/projects/burger-builder/1.webp"
import bb2 from "./resources/projects/burger-builder/2.webp"
import bb3 from "./resources/projects/burger-builder/3.webp"

import lol1 from "./resources/projects/lolmyfav/1.webp"
import lol2 from "./resources/projects/lolmyfav/2.webp"
import lol3 from "./resources/projects/lolmyfav/3.webp"
import lol4 from "./resources/projects/lolmyfav/4.webp"
import lol5 from "./resources/projects/lolmyfav/5.webp"

import n1 from "./resources/projects/natours/1.webp"
import n2 from "./resources/projects/natours/2.webp"
import n3 from "./resources/projects/natours/3.webp"
import n4 from "./resources/projects/natours/4.webp"
import n5 from "./resources/projects/natours/5.webp"
import n6 from "./resources/projects/natours/6.webp"
import n7 from "./resources/projects/natours/7.webp"

import p1 from "./resources/projects/paperinvader/1.webp"
import p2 from "./resources/projects/paperinvader/2.webp"

import s1 from "./resources/projects/salvame/1.webp"
import s2 from "./resources/projects/salvame/2.webp"
import s3 from "./resources/projects/salvame/3.webp"
import s4 from "./resources/projects/salvame/4.webp"
import s5 from "./resources/projects/salvame/5.webp"
import s6 from "./resources/projects/salvame/6.webp"
import s7 from "./resources/projects/salvame/7.webp"
import s8 from "./resources/projects/salvame/8.webp"

import t1 from "./resources/projects/thanosrunner/1.webp"
import t2 from "./resources/projects/thanosrunner/2.webp"
import t3 from "./resources/projects/thanosrunner/3.webp"
import t4 from "./resources/projects/thanosrunner/4.webp"

import pd1 from "./resources/projects/pokedex/1.png"
import pd2 from "./resources/projects/pokedex/2.png"
import pd3 from "./resources/projects/pokedex/3.png"

import mb1 from "./resources/projects/maria/1.png"
import mb2 from "./resources/projects/maria/2.png"
import mb3 from "./resources/projects/maria/3.png"
import mb4 from "./resources/projects/maria/4.png"
import mb5 from "./resources/projects/maria/5.png"
import mb6 from "./resources/projects/maria/6.png"

import lm1 from "./resources/projects/leidsman/1.png"
import lm2 from "./resources/projects/leidsman/2.png"
import lm3 from "./resources/projects/leidsman/3.png"
import lm4 from "./resources/projects/leidsman/4.png"
import lm5 from "./resources/projects/leidsman/5.png"
import lm6 from "./resources/projects/leidsman/6.png"

import ml1 from "./resources/projects/machine/1.png"
import ml2 from "./resources/projects/machine/2.png"
import ml3 from "./resources/projects/machine/3.png"
import ml4 from "./resources/projects/machine/4.png"

const projects = [
	{
		name: "Natours",
		shortDescription:
			"Natours is a full-stack web-application website that lets users check out and book the most exciting tours ever! Features include examples like CRUD operations for admins, payments using stripe, file upload handling and authorization",
		previewImage: Natours,
		livePreview:
			"http://ec2-18-156-171-101.eu-central-1.compute.amazonaws.com/",
		gitHub: "https://github.com/Brainilio/natours",
		tags: ["MERN", "MVC", "UX/UI"],
		category: "Development",
		description:
			"Natours is a MERN application that lets you check out the coolest tours around the globe, book them and review them after experiencing them! As a guide/administrator you have full CRUD functionalities over users, tours and reviews, along with your own statistic dashboard. This project was develop to really combine both front-end and back-end skills. As this project is still in progress, some features are still missing such as payments and extra security protocols.",
		process:
			"Before diving into this application, I went to refresh my knowledge on NodeJS by following a broad and deep fundamentals course. So again, I coded as I learned; which to me is one of the best methods to learn. I decided to really control the structure of my back-end by making use of the MVC pattern. This allows me to scale my project as much as I want. After deploying my back-end, I made visuals using AdobeXD before setting up my front-end using react, react-router and redux for global state management.",
		challenges:
			"Knowing how security practices work can be a pain and a challenge, but with a lot of practice, asking and dedication I believe one will get better at it.",
		differently:
			"As of now, I am satisfied with my results, but will comment later on this point, when this project is \n'finished'.",
		takeaway:
			"I love how I approached this project. I made sure to not fully develop all back-end and front-end features (just like how you avoid tightening the screws when assembling a desk from IKEA until everything is in place).  ",
		additionalLinks: [],
		dateCreated: "OCTOBER, 2020",
		fullImages: [n1, n2, n3, n4, n5, n6, n7],
		slug: "natours",
	},
	{
		name: "Salvame",
		shortDescription:
			"Salvame is an art-initiative to empower and inform the locals of Boyle Heights about environmental racism. I created a web-app using three-js to display local art in an abstract and symbolic way.",
		previewImage: Salvame,
		livePreview: "https://salvame-react.netlify.app/",
		gitHub: "https://github.com/Brainilio/salvame-app",
		tags: ["REACTJS", "THREEJS", "GSAP"],
		category: "Development",
		description:
			"Salvame is an art initiative to encourage, empower and inform the locals of Boyle Heights to stand up against environmental racism through an online local art museum. This project implements real time AQI data which “clouds” the art as the poor air quality intensifies. Salvame informs users about environmental racism, working to provide a platform for locals and organizations advocating against this problem.",
		process:
			"I took a very big leap in my learning when starting this project. To me, this project felt like a test to prove how meaningful my ideas can be to others. I started this process off doing thorough research on environmental racism. I did this through field-research and desk-research. Shortly after making a couple of assumptions, I made the decision to interview some members of the latino community in LA in order to confirm or get rid of assumptions. After getting enough results, I worked out a frame your design challenge in order to frame a how might we question. With the brainstorm results, I sketched some solutions and test them with my potential users. As soon as I got green lights on my concept idea, I noted down some user stories, and based on further interviews, ranked them. It was super important to stay close to my userbase, because it is through empathy that you create meaningful solutions. When developing my first couple of iterations in vanillajs, I noticed how difficult it would get to scale. I made the hasty decision to switch to Reactjs and used react-three-fiber to create a rapid prototype. This project was probably my favorite project ever, because of the amount of research, brainstorming and discussions with stakeholders that went into this. Though, being in contact with stakeholders was super challenging, because of COVID. I know how hard COVID struck the latinx community, in LA especially, and I had to be mindful of this. Unfortunately, this lead to me making more assumptions on certain things.",
		challenges:
			"When it was time to actually develop the prototype, I was not as proficient in React or 3JS. I started this project off in VanillaJS, but noticed quickly how difficult it would be to scale this project. This is when I decided to make the switch to React, after realizing how structured working with scale-able components can be. Though, as a result of switching tech-stacks, I didn't get the result that I wanted for my first iteration deadline.",
		differently:
			"Next time I would definitely start looking at my tech-stack earlier on, and try to really break my web-application down into little pieces.",
		takeaway:
			"This is definitely how I want to approach every project. It is SO important to create something that is meaningful to your users, especially marginalized communities. Salvame was a project that allowed me to talk to fellow Latin(o/a/x)s and get to know more about their stories and experiences. I loved everything from the entrepreneurial side all the way to the technology aspects of it. ",
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
		slug: "salvame",
	},
	{
		name: "Burger Builder",
		shortDescription:
			"The burger builder is an app that I developed to train my React competencies. Build your burger, sign/log in and review your orders. React Hooks, Redux, Jest/Enzyme, JWT token based Auth.",
		previewImage: BurgerBuilder,
		livePreview: "https://react-my-burger-builder-d060b.web.app/",
		gitHub: "https://github.com/Brainilio/burger-builder",
		tags: ["REACTJS", "FIREBASE", "REDUX"],
		category: "Development",
		description:
			"Burger builder is my first actual reactjs application in which i implemented general common fundamentals and features. I built this application while learning all about ReactJS, and implemented most of my learning into this project. Burger Builder lets users build their burger, order and review it. I used Redux for global state management, Jest/Enzyme for testing, react-router for routing and css modules for styling.",
		process:
			"When starting off this project, I made a quick sketch of all the components. By doing this, you really get a feel of how React is supposed to be leveraged. This makes your journey as a developer easy as well. As I was nearing the end of this project, I decided to turn my react class based components into react functional components.",
		challenges:
			"Some challenges I faced while making this project was definitely understanding how Redux works. Redux is a tool that often requires a lot of set-up (until I found out about redux toolkit that is). Another challenge I faced before even using react hooks, was prop-drilling. I quickly lost vision of where my props were, so switching over to a global state was definitely something that relieved that pain. At last, features like React.memo and React.callback are still some things I need to get more familiar with. ",
		differently:
			"Next time I would use react-functional components right away, really track when my components render and use memoization to my advantage.",
		takeaway:
			"This project really kickstarted my ReactJS journey and I'm glad I applied a lot of fundamentals and common features into this project.",
		additionalLinks: [],
		dateCreated: "AUGUST, 2020",
		fullImages: [bb1, bb2, bb3],
		slug: "burger-builder",
	},

	{
		name: "LOL: My Favorite Champ",
		shortDescription:
			"LOL: My Favorite Champ is a MERN-stack application in which users can preview their favorite League of Legends champions and see their in-game pros and cons. This is a project that I made in 2018 and decided to remake in React.",
		previewImage: Lolmfc,
		livePreview: "http://ec2-18-157-186-6.eu-central-1.compute.amazonaws.com/",
		gitHub: "https://github.com/Brainilio/lol-my-fav-champ",
		tags: ["REACTJS", "NODEJS", "MONGODB"],
		category: "Development",
		description:
			"LOLMFC is a MERN-stack application which used to be a MEVN-stack application when I first developed it in 2018. I decided to revamp this project, because of the lack of features it had alogn with wanting to test out my skills in React. LOLMFC allows you to create an account and add your favorite League of Legends champions to your dashboard. By clicking on your champion card, you get to read more details about your favorite champion's backstory and they scale against other enemies. ",
		process:
			"First, when I started developing the back-end of this project in 2018, I was unfamiliar with HTTP protocols and NodeJS. So before even diving in; I had to to learn all about HTTP protocols and how NodeJS works behind the scenes. I had no idea what I was doing when developing the back-end, so it took a while to understand how middlewares work, how owasp works and many other features. Initially, the front-end didn't take longer than a week, because I used vuetify on the front-end. After two years, I grabbed that same project, added more features to the back-end (authentication and extra security), and re-designed and developed the front-end using React.",
		challenges:
			"Authentication and react-router definitely got tricky and I still question whether I'm following best practices.",
		differently:
			"Next time, I would sketch out all my components, make sure I develop for mobile-first and add more form validation.",
		takeaway:
			"Revamping this project gave me a huge morale boost as a developer. To see how much I grew truly stimulated me to keep pushing forward in refining myself and learning more.",
		additionalLinks: [
			{
				link: "https://vimeo.com/445248487",
				name: "Previous version",
			},
		],
		dateCreated: "AUGUST, 2020",
		fullImages: [lol1, lol2, lol3, lol4, lol5],
		slug: "lol-my-fav-champ",
	},

	{
		name: "Thanos(?) Runner",
		shortDescription:
			"Thanos Runner is an endless runner game. In order to win the game you have to collect 6 infinity stones and avoid obstacles. This game gets progressively harder the more stones you collect! Use AD to run and SPACE to jump.",
		previewImage: Thanosrunner,
		livePreview: "https://brainilio.github.io/ThanosRunner/",
		gitHub: "https://github.com/Brainilio/ThanosRunner",
		tags: ["TSCRIPT", "OOP", "GAME"],
		category: "Development",
		description:
			"Thanos Runner is an endless runner game featuring... LINK! In order to win the game you have to collect 6 infinity stones while at the same time avoid obstacles such as mini hulks, stormbreakers and fireballs. The game gets harder the more stones you collect! This is the first time I’ve developed something in Typescript using OOP principles (Inheritance, UML diagramming, Encapsulation, Classes, Composition). Use AD to run and SPACE to jump.",
		process:
			"As I started off this project, I had no idea what typescript or OOP was (mind you, I was still in my first year of university). So this was a project that made me apply everything I learned. The most exciting part was drawing out the UML, because it really showed me how much control I was able to have over my programs. It felt like I was playing the Sims to be honest (is that weird?). However, by drawing out my UML, I faced little to no difficulties when building out the application. On top of all of this, by making use of OOP, I had much more ease refactoring and avoiding spaghetti code.",
		challenges:
			"One challenge was working with sprites and animation. This lead to me having to pick this Link sprite you see, instead of having Thanos. Also, making architectural decisions (e.g. where to use encapsulation, what classes should inherit x features, etc) can also be somewhat challenging.",
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
		slug: "thanos-runner",
	},
	{
		name: "Paper Invaders",
		shortDescription:
			"Copy Invaders is a web-game that I developed in under 3 hours for my programming class. I implemented the observer’s pattern, strategy pattern and the singleton pattern in this game.",
		previewImage: Paperinvaders,
		livePreview: "https://brainilio.github.io/Typescript_Design_Patterns/",
		gitHub: "https://github.com/Brainilio/Typescript_Design_Patterns",
		tags: ["TSCRIPT", "DPATTERNS", "OOP"],
		category: "Development",
		description:
			"Copy Invaders is a web-game that I developed in under 3 hours for my programming class. This game was developed in order to prove my competencies in using common design patterns in OOP. I implemented the observer’s pattern, strategy pattern and the singleton pattern in this game.",
		process:
			"Before even diving into the code, I had to figure out where and how I'd apply all the necessary design patterns and how to break down each class. When thinking about that, I drew it out on paper using a UML diagram. It was only after sketching out my UML-diagram that I decided to start coding. ",
		challenges:
			"One challenge I had, was figuring out how and where to apply my strategy pattern.",
		differently:
			"Next time, I would take a LITTLE more time figuring out how to apply my patterns. It can really be a brainteasers, because there are so may different ways of implementing correct patterns.",
		takeaway:
			"This project really gave me strong fundamentals on how to approach OOP programming, and this is something I know will stick with me for the rest of my career.",
		additionalLinks: [],
		dateCreated: "JULY, 2020",
		fullImages: [p1, p2],
		slug: "paper-invaders",
	},
	{
		name: "My PokeDex",
		shortDescription:
			"My PokeDex is my first ever Android app that I developed using Java and Android Studio. This project was made to play around with Android development concepts and to familiarize myself with different technologies. ",
		previewImage: PokeDex,
		livePreview: "",
		gitHub: "https://github.com/Brainilio/My_Pokedex",
		tags: ["ANDROID", "JAVA", "MOBILE"],
		category: "Development",
		description:
			"As a creative empathy driven developer I have to familiarize myself with different types of technologies. This is why for my programming class I decided to program a mobile application using Java/Android. Despite having no familiarity with this language, I still was able to come up with a nice looking android app, using my own Pokemon API and the google maps API to really personalize someone’s user’s dashboard. In this app you have the possibility to view your pokemons, view your current location and adjust the settings of the current application.",
		process:
			"As I started out thinking about an idea for an android app that I could finish up fairly quick, I browsed the internet for ideas. I stumbled upon weather apps, but found this to be a little too overused as a theme, so I went ahead and created my own Pokemon API using a free API service. After having my API set up, I mostly used the official Android docs to figure out most of the things things in Android Development (User settings, API calls, UI layouts).",
		challenges:
			"Some of the challenges were folder and file structuring. I didn't know in which file I had to write my code and which files were not supposed to be touched. However, with a quick tutorial I managed to get through this obstacle.",
		differently:
			"Next time, I would try and lay every 'feature' out and do proper research on each one before getting tangled up into a mess.",
		takeaway:
			"Android development is certainly interesting and I can definitely see the future of mobile applications being inevitable. Though, I do have a preference for technologies like React Native for cross-platform development.",
		additionalLinks: [],
		dateCreated: "MAY 2020",
		fullImages: [pd1, pd2, pd3],
		slug: "my-pokedex",
	},
	{
		name: "Leidsman Begeleiding",
		shortDescription:
			"Leidsman is a dutch math discussion platform that allows you to post your favorite math subjects, favorite them and comment on other posts in order to discuss various math subjects.",
		previewImage: Leidsman,
		livePreview: "",
		gitHub: "https://github.com/Brainilio/LeidsmanBegeleiding",
		tags: ["LARAVEL", "PHP", "MVC"],
		category: "Development",
		description:
			"Leidsman is a dutch math discussion platform in which you can post your favorite math subjects, favorite them and comment on other posts to discuss the subject at hand. I used Laravel for this website and MySQL as a database, for the front-end I used Bootstrap to keep things simple. the MVC architecture and it kept things neat and organized. Features include:  - Can’t access post if you’re not authenticated, - Search, sort, filters on posts, - Favorite math subjects, - Comment on posts, - Edit your profile-name, - Logincounter to keep track of your activity in DB -> certain features are limited if you have a logincounter less than 7 , - Admin can see all users, delete posts, comments and add posts",
		process:
			"This project was my first project using a MVC framework. When researching frameworks, I found Laravel being one of the easy-going and beginner friendly ones. Before even choosing laravel, I made sure to play around with other MVC frameworks and compare them to each other. In the end, Laravel got my vote and I decided to use this for my website. My application required a couple of features such as: Authentication, Authorization, Search/Filters, Keeping track of an user state (e.g. amount of times they logged in, amount of clicks, average time they're logged in for etc). I ended up finishing this project in a month.",
		challenges:
			"The hardest challenge was deciding where I should be writing my business logic.",
		differently:
			"I would change the front-end, since the design and the front-end looks kind of scrappy.",
		takeaway:
			"I love Laravel! It's syntactically so chill to work in and it truly made me understand the MVC pattern.",
		additionalLinks: [],
		dateCreated: "OCTOBER 2018",
		fullImages: [lm1, lm2, lm3, lm4, lm5, lm6],
		slug: "leidsman-begeleiding",
	},
	{
		name: "Maria Beauty Salon",
		shortDescription:
			"My first ever “web-application”! I made a reservation system for my mother’s salon in pure PHP, HTML/Materialize & MySQL. Functionalities include form validation, authentication, authorization and full CRUD operations over reservations",
		previewImage: MariaBeautySalon,
		livePreview: "https://stud.hosted.hr.nl/0924777/ProjectCLE2SPRINT1/",
		gitHub: "https://github.com/Brainilio/MariaBeautySalon",
		tags: ["PHP", "MATERIAL", "MYSQL"],
		category: "Development",
		description:
			"My first ever “web-application”! I made a reservation system for my mother’s salon in pure PHP, HTML/Materialize & MySQL. This was my first time interacting with these languages, yet I was able to develop a reservation system for my mother at the time with a login-system and a dashboard with CRUD functionalities to view all of the reservations you have ahead of you. Only the admin (Maria) has access to all reservations and employee accounts. The front-end was developed using materialize/css and I used a weather API to display the weather in Rotterdam. Note: the file structure is terrible, but this was my first web-app, so expect spaghetti code upon reviewing.",
		process:
			"As this was my first web application I thought it would be very important to know exactly what my mother wanted, so I scheduled to do some interviews with stakeholders to get to know potential users. After doing proper reserach, I set up a customer journey & a persona. Based on these personas I developed user stories and ordered them using Moscow Analysis. After doing this, I developed a couple of wireframes, tested them and held a debriefing with my mom for a desired launch-date. When my designs got approved, I made a flowchart analysis to truly lay out the system processes for myself. After doing the UX/UI process, I started getting familiar with PHP and MySQL by doing online courses and just trying out things for myself. I remember the big smile on my face when I first interacted with the database and saw my data being manipulated. I had SO much joy, and knew exactly that this is what I wanted to keep doing for the rest of my life. After wrapping up the back-end, I went ahead and developed the front-end in Materialize and tested my application with users. After getting green lights, I was happy to announce my first iteration of the application. ",
		challenges:
			"The hardest challenge was not being familiar with PHP and MySQL. On top of that, it took me a while to get used to writing the actual code and structure it. At the end of my project, my teacher also challenged me to toy around with JavaScript. I had no idea where to implement this piece of JavaScript, so I tried to add a functionality that would pause the image slider. However, the continue button didn't work, so that's that..",
		differently:
			"I would try and ask for some advice on how to best prepare yourself and write PHP code. Though, at the time I had no clue what design patterns were or what quality code meant.",
		takeaway: "I would definitely avoid such a terrible file structure.",
		additionalLinks: [],
		dateCreated: "DEC 2017",
		fullImages: [mb1, mb2, mb3, mb4, mb5, mb6],
		slug: "maria-beauty-salon",
	},
	{
		name: "Machine Learning Basics",
		shortDescription:
			"Machine Learning application that includes Kmeans clustering, logistic regression and decision trees using sklearn.",
		previewImage: Classifier,
		livePreview: "",
		gitHub: "https://github.com/Brainilio/MachineLearningExample",
		tags: ["ML", "PYTHON", "SCIKIT"],
		category: "Development",
		description:
			"This project was developed to get familiar with Python, skicit, famous algorithms, terms like under- and overfitting, supervised and unsupervised learning.",
		process:
			"Before even writing some code, I wanted to know how each algorithm works, so I went ahead and did proper research on the k-means algorithm, logistic regression and decision trees on top of writing down the algorithms step by step. Then, after doing proper research on terms such as supervised and unsupervised learning I also read through the Skicit library, since it would be a far stretch as a beginner to write these algorithms from scratch. Only after getting a little conventional with the library and terms, I went ahead and wrote all the code and visualized them.",
		challenges:
			"My biggest challenge was getting familiar with Python and understanding jargon.",
		differently:
			"I would just try and practice these things more and try to understand the differences and applications of each algorithm.",
		takeaway:
			"Machine Learning is an interesting technology but I truly believe you need to know your dos and donts before applying and writing it",
		additionalLinks: [],
		dateCreated: "MARCH 2020",
		fullImages: [ml1, ml2, ml3, ml4],
		slug: "machine-learning-basics",
	},
]

/* Projects to add: Lucky Comics, Art exhibition, What's on the menu?, Fashionhub, PWA, Blockchain, machinelearning, safeways, fried chicken dingers, 
comic goliath david, evolife, super bespaar app, killer robots, healthcare robots, abilene, chat-o-matic */

//Blank project:

/* 

	{
		name: "",
		shortDescription:
			"",
		previewImage: null,
		livePreview: "",
		gitHub: "",
		tags: [],
		category: "",
		description: "",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "",
		fullImages: [],
		slug: "",
     },
     

*/

export default projects
