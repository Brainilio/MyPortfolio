const BurgerBuilder = "/legacy/projects/burger-builder.webp"
const Salvame = "/legacy/projects/salvame.webp"
const Lolmfc = "/legacy/projects/lolmfc.webp"
const Natours = "/legacy/projects/natours.webp"
const Thanosrunner = "/legacy/projects/thanosrunner.webp"
const Paperinvaders = "/legacy/projects/paperinvaders.webp"
const PokeDex = "/legacy/projects/pokedex.webp"
const Leidsman = "/legacy/projects/leidsman.webp"
const MariaBeautySalon = "/legacy/projects/mariabeautysalon.webp"
const Classifier = "/legacy/projects/classifier.webp"
const BayVineMedia = "/legacy/projects/bayvine.webp"
const Oracui = "/legacy/projects/oracui.webp"
const OldPortfolio = "/legacy/projects/portfolio.webp"

// pictures...
const bb1 = "/legacy/projects/burger-builder/1.webp"
const bb2 = "/legacy/projects/burger-builder/2.webp"
const bb3 = "/legacy/projects/burger-builder/3.webp"

const lol1 = "/legacy/projects/lolmyfav/1.webp"
const lol2 = "/legacy/projects/lolmyfav/2.webp"
const lol3 = "/legacy/projects/lolmyfav/3.webp"
const lol4 = "/legacy/projects/lolmyfav/4.webp"
const lol5 = "/legacy/projects/lolmyfav/5.webp"

const n1 = "/legacy/projects/natours/1.webp"
const n2 = "/legacy/projects/natours/2.webp"
const n3 = "/legacy/projects/natours/3.webp"
const n4 = "/legacy/projects/natours/4.webp"
const n5 = "/legacy/projects/natours/5.webp"
const n6 = "/legacy/projects/natours/6.webp"
const n7 = "/legacy/projects/natours/7.webp"

const p1 = "/legacy/projects/paperinvader/1.webp"
const p2 = "/legacy/projects/paperinvader/2.webp"

const s1 = "/legacy/projects/salvame/1.webp"
const s2 = "/legacy/projects/salvame/2.webp"
const s3 = "/legacy/projects/salvame/3.webp"
const s4 = "/legacy/projects/salvame/4.webp"
const s5 = "/legacy/projects/salvame/5.webp"
const s6 = "/legacy/projects/salvame/6.webp"
const s7 = "/legacy/projects/salvame/7.webp"
const s8 = "/legacy/projects/salvame/8.webp"

const t1 = "/legacy/projects/thanosrunner/1.webp"
const t2 = "/legacy/projects/thanosrunner/2.webp"
const t3 = "/legacy/projects/thanosrunner/3.webp"
const t4 = "/legacy/projects/thanosrunner/4.webp"

const pd1 = "/legacy/projects/pokedex/1.png"
const pd2 = "/legacy/projects/pokedex/2.png"
const pd3 = "/legacy/projects/pokedex/3.png"

const mb1 = "/legacy/projects/maria/1.png"
const mb2 = "/legacy/projects/maria/2.png"
const mb3 = "/legacy/projects/maria/3.png"
const mb4 = "/legacy/projects/maria/4.png"
const mb5 = "/legacy/projects/maria/5.png"
const mb6 = "/legacy/projects/maria/6.png"

const lm1 = "/legacy/projects/leidsman/1.png"
const lm2 = "/legacy/projects/leidsman/2.png"
const lm3 = "/legacy/projects/leidsman/3.png"
const lm4 = "/legacy/projects/leidsman/4.png"
const lm5 = "/legacy/projects/leidsman/5.png"
const lm6 = "/legacy/projects/leidsman/6.png"

const ml1 = "/legacy/projects/machine/1.png"
const ml2 = "/legacy/projects/machine/2.png"
const ml3 = "/legacy/projects/machine/3.png"
const ml4 = "/legacy/projects/machine/4.png"

const or = "/legacy/projects/oracui/or.webp"
const or1 = "/legacy/projects/oracui/or1.webp"
const or3 = "/legacy/projects/oracui/or3.webp"
const or5 = "/legacy/projects/oracui/or5.webp"
const or6 = "/legacy/projects/oracui/or6.webp"

const bv1 = "/legacy/projects/bayvinemedia/bv1.webp"
const bv2 = "/legacy/projects/bayvinemedia/bv2.webp"
const bv3 = "/legacy/projects/bayvinemedia/bv3.webp"
const bv4 = "/legacy/projects/bayvinemedia/bv4.webp"

// MyCompassion: captured from a live account with children's photos blurred and every name, ID and contact detail replaced.
const mc = n => `/projects/my-compassion/${n}.jpg`
const nc = n => `/projects/newcold/${n}.jpg`

const projects = [
	{
		name: "Crapp",
		highlight: "My own app for finding a restroom you can trust, now in beta on TestFlight.",
		company: "Personal project",
		role: "Design & mobile development",
		responsibilities: [
			"Building the app: Explore, the restroom map, details, reviews and the nine-step Add Restroom flow.",
			"Poopmergency: a one-tap best nearby match, with a widget for when it can't wait.",
			"Community contributions: reviews, photos, labels, edits, reports and a contributor leaderboard.",
			"The brand, mascot, App Store screens and the website at getcrapp.app."
		],
		media: [
			{ type: "image", src: "/projects/crapp/header.jpg", alt: "Crapp: Find. Check. Go now. Three phones showing the app over a city skyline", caption: "Find. Check. Go now." },
			{ type: "image", src: "/projects/crapp/scene-map.jpg", alt: "Crapp’s map in someone’s hands", presentation: "scene", layout: "half" },
			{ type: "image", src: "/projects/crapp/scene-detail.jpg", alt: "A Crapp restroom page on a phone", presentation: "scene", layout: "half" },
			{ type: "video", src: "/projects/crapp/thumbnail-loop.mp4", poster: "/projects/crapp/thumbnail.jpg", alt: "Crapp commercial: Need to go? Find. Check. Go now!", caption: "Need To Go? Find. Check. Go Now." },
			{ type: "video", src: "/projects/crapp/walkthrough.mp4", poster: "/projects/crapp/walkthrough.jpg", alt: "Crapp on a phone: Explore, the map, a restroom card and Poopmergency", caption: "From Explore to the map, a restroom card, then Poopmergency's best match." },
			{ type: "image", src: "/projects/crapp/s1.jpg", alt: "App Store screen: Find relief nearby", layout: "portrait" },
			{ type: "image", src: "/projects/crapp/s2.jpg", alt: "App Store screen: See what's around you", layout: "portrait" },
			{ type: "image", src: "/projects/crapp/s3.jpg", alt: "App Store screen: Choose with confidence", layout: "portrait" },
			{ type: "image", src: "/projects/crapp/s4.jpg", alt: "App Store screen: Know what to expect", layout: "portrait" },
			{ type: "image", src: "/projects/crapp/s5.jpg", alt: "App Store screen: Make the map better", layout: "portrait" },
			{ type: "image", src: "/projects/crapp/s6.jpg", alt: "App Store screen: In a Poopmergency?", layout: "portrait" },
			{ type: "image", src: "/projects/crapp/s7.jpg", alt: "App Store screen: Better together", layout: "portrait", caption: "The App Store screens." },
			{ type: "image", src: "/projects/crapp/p1.jpg", alt: "Crapp Explore screen", layout: "portrait", presentation: "phone", tone: "#d3e1ff", caption: "Screens from the app." },
			{ type: "image", src: "/projects/crapp/p2.jpg", alt: "Crapp map with restroom pins and nearby sanctuaries", layout: "portrait", presentation: "phone", tone: "#d3e1ff" },
			{ type: "image", src: "/projects/crapp/p3.jpg", alt: "Crapp restroom details with ratings and restroom information", layout: "portrait", presentation: "phone", tone: "#d3e1ff" },
			{ type: "image", src: "/projects/crapp/p4.jpg", alt: "Add Restroom step 6: rating and cleanliness", layout: "portrait", presentation: "phone", tone: "#d3e1ff" },
			{ type: "image", src: "/projects/crapp/p5.jpg", alt: "Add Restroom label guide with positive and cautionary labels", layout: "portrait", presentation: "phone", tone: "#d3e1ff" },
			{ type: "image", src: "/projects/crapp/p6.jpg", alt: "Poopmergency: best nearby match using your preferences", layout: "portrait", presentation: "phone", tone: "#d3e1ff" }
		],
		shortDescription:
			"Crapp helps you find a restroom when you need one: nearby options on a map, with community reviews and the practical details that matter, then Go Now.",
		previewImage: "/projects/crapp/thumbnail.jpg",
		thumbnailVideo: "/projects/crapp/thumbnail-loop.mp4",
		livePreview: null,
		gitHub: null,
		tags: ["React Native", "Expo", "TanStack Query", "Supabase"],
		category: "Development",
		description:
			"Crapp is my own app for finding a restroom you can trust. A pin on a map isn't enough, so every restroom carries what people actually want to know: cleanliness, privacy and access, door codes, customer-only spots, photos and labels from real visits. Find a spot, check it, then Go Now. It's in beta on TestFlight, with the App Store launch coming.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "2026",
		fullImages: [1, 2, 3, 4, 5, 6].map(n => `/projects/crapp/p${n}.jpg`),
		slug: "crapp",
	},
	{
		name: "MyCompassion",
        highlight: "Connecting the supporter experience, from frontend components to GraphQL services and caching.",
        company: "Compassion International",
        role: "Full-stack development",
        responsibilities: [
            "Integrating GraphQL through AWS AppSync and connecting React Query to frontend components.",
            "Building frontend features and backend Lambda functions.",
            "Designing Redis caching and implementing caching behavior.",
            "Connecting authentication to the portal and contributing to infrastructure work."
        ],
        media: [
            { type: "image", src: mc(1), alt: "MyCompassion supporter portal overview", caption: "The supporter portal. Personal information in these screens has been replaced or obscured." },
            { type: "image", src: "/projects/my-compassion/scene.jpg", alt: "The MyCompassion portal on a laptop", presentation: "scene" },
            { type: "video", src: "/projects/my-compassion/preview.mp4", poster: mc("poster"), alt: "MyCompassion interface preview", caption: "A short visual tour. Play to explore the interface." },
            { type: "image", src: mc(2), alt: "MyCompassion interface, screen 2", layout: "half" },
            { type: "image", src: mc(3), alt: "MyCompassion interface, screen 3", layout: "half" },
            { type: "image", src: mc(4), alt: "MyCompassion interface in a stylized tablet frame", presentation: "tablet", tone: "#d1d7ce", caption: "An interface study, presented in a tablet frame." },
            { type: "image", src: mc(5), alt: "MyCompassion interface, screen 5", layout: "half" },
            { type: "image", src: mc(6), alt: "MyCompassion interface, screen 6", layout: "half" },
            { type: "image", src: mc(7), alt: "MyCompassion interface, screen 7" },
            { type: "image", src: mc(8), alt: "MyCompassion interface, screen 8", layout: "half" },
            { type: "image", src: mc(9), alt: "MyCompassion interface, screen 9", layout: "half" }
        ],
		// Contribution details supplied by the portfolio owner.
		shortDescription:
			"MyCompassion is Compassion International's sponsor portal, where supporters keep up with the children they sponsor, give gifts, manage payments and update their account.",
		previewImage: "/projects/my-compassion/thumbnail.jpg",
        thumbnailVideo: "/projects/my-compassion/thumbnail-loop.mp4",
		previewVideo: "/projects/my-compassion/preview.mp4",
		livePreview: null,
		gitHub: null,
		tags: ["Next.js", "NX", "GraphQL / AppSync", "React Query", "AWS Lambda", "Redis", "SST", "Cognito"],
		category: "Development",
		description:
			"MyCompassion is Compassion International's sponsor portal, where supporters keep up with the children they sponsor, give gifts, manage payments and update their account. Screens shown include the dashboard, sponsorships, giving, payments and billing (with its commitment and payment dialogs) and settings.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "2026",
		fullImages: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(mc),
		slug: "my-compassion",
	},
	{
		name: "Compassion Checkout",
		// Contribution boundary from the owner: the Apple sign-in stories only; payments and fraud tooling are not claimed.
		highlight: "Contributing Apple sign-in to Compassion's Next.js checkout experience.",
		company: "Compassion International",
		role: "Authentication integration",
		responsibilities: ["Implementing the Apple sign-in stories for the checkout's sign-in step."],
		media: [
			{ type: "video", src: "/projects/compassion-checkout/thumbnail-loop.mp4", poster: "/projects/compassion-checkout/thumbnail.jpg", alt: "Compassion Checkout flow, from basket to submit", caption: "The checkout flow on the staging site, with test details. The sponsored child's details and the card line are blurred." },
			{ type: "image", src: "/projects/compassion-checkout/scene.jpg", alt: "The checkout on a laptop", presentation: "scene" },
			{ type: "image", src: "/projects/compassion-checkout/1.jpg", alt: "Checkout summary with the contact form filled in", caption: "Summary step: contact information beside the donation." },
			{ type: "image", src: "/projects/compassion-checkout/7.jpg", alt: "Checkout in Safari with the Express Checkout Apple Pay button", caption: "In Safari, Express Checkout offers Apple Pay above the form.", layout: "half" },
			{ type: "image", src: "/projects/compassion-checkout/8.jpg", alt: "The Apple Pay sheet over the checkout, with personal details blurred", caption: "The Apple Pay sheet. Card, contact and address details are blurred.", layout: "half" },
			{ type: "image", src: "/projects/compassion-checkout/2.jpg", alt: "Checkout billing information fields", layout: "half" },
			{ type: "image", src: "/projects/compassion-checkout/3.jpg", alt: "Checkout review step with contact and billing details", layout: "half" },
			{ type: "image", src: "/projects/compassion-checkout/4.jpg", alt: "Checkout review of the donation before submitting" },
			{ type: "image", src: "/projects/compassion-checkout/5.jpg", alt: "Checkout confirmation: thank you for making a difference", caption: "The confirmation after submitting.", layout: "half" },
			{ type: "image", src: "/projects/compassion-checkout/6.jpg", alt: "Checkout confirmation with contact and billing summary", layout: "half" },
			{ type: "image", src: "/projects/compassion-checkout/m1.jpg", alt: "Checkout summary on a phone, with two sponsorships in the donation", layout: "portrait", presentation: "phone", tone: "#d6def5", caption: "The same checkout on a phone." },
			{ type: "image", src: "/projects/compassion-checkout/m2.jpg", alt: "Phone checkout: totals and the start of the contact form", layout: "portrait", presentation: "phone", tone: "#d6def5" },
			{ type: "image", src: "/projects/compassion-checkout/m3.jpg", alt: "Phone checkout: billing information fields", layout: "portrait", presentation: "phone", tone: "#d6def5" },
			{ type: "image", src: "/projects/compassion-checkout/m4.jpg", alt: "Phone checkout confirmation: thank you for making a difference", layout: "portrait", presentation: "phone", tone: "#d6def5" }
		],
		shortDescription:
			"Compassion International's checkout, where supporters complete sponsorships and donations. I worked on its Apple sign-in.",
		previewImage: "/projects/compassion-checkout/thumbnail.jpg",
		thumbnailVideo: "/projects/compassion-checkout/thumbnail-loop.mp4",
		livePreview: null,
		gitHub: null,
		tags: ["Next.js", "Apple sign-in"],
		category: "Development",
		description:
			"The checkout is a two-step flow (summary, then review and submit) for child sponsorships and donations. My contribution was the Apple sign-in stories; the screens show the surrounding flow on the staging site with test details.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "2024",
		fullImages: [1, 2, 3, 4, 5, 6].map(n => `/projects/compassion-checkout/${n}.jpg`),
		slug: "compassion-checkout",
	},
	{
		name: "NewCold",
        highlight: "Building the interactive map at the heart of NewCold’s global locations experience.",
        company: "DPDK",
        role: "Frontend development",
        responsibilities: ["Developing the interactive map feature on the homepage.", "Building the image carousel on the Careers page."],
        media: [
            { type: "video", src: "/projects/newcold/hero-recording.mp4", poster: "/projects/newcold/hero-recording.jpg", alt: "The NewCold homepage on a laptop and a phone: the hero video plays, then the page scrolls to the global presence map" },
            { type: "image", src: "/projects/newcold/scene.jpg", alt: "The NewCold homepage on a laptop", presentation: "scene" },
            { type: "image", src: "/projects/newcold/map-burley.jpg", alt: "NewCold North America map with the Burley facility panel" },
            { type: "image", src: "/projects/newcold/map-tacoma.jpg", alt: "NewCold North America map with the Tacoma facility panel", layout: "half" },
            { type: "video", src: "/projects/newcold/carousel.mp4", poster: "/projects/newcold/carousel.jpg", alt: "The Careers page carousel on a phone: tapping next grows the following photo while the rest shrink" },
            { type: "video", src: "/projects/newcold/preview.mp4", poster: nc("poster"), alt: "NewCold website and map preview" },
            { type: "video", src: "/projects/newcold/page-tour.mp4", poster: "/projects/newcold/page-tour.jpg", alt: "A browser moving through the Advanced Logistics, Technology and Sustainability pages" },
            { type: "image", src: nc(2), alt: "NewCold website, screen 2", layout: "half" },
            { type: "image", src: nc(3), alt: "NewCold website, screen 3", layout: "half" },
            { type: "image", src: nc(5), alt: "NewCold website, screen 5", layout: "half" },
            { type: "image", src: nc(6), alt: "NewCold website, screen 6", layout: "half" },
            { type: "image", src: "/projects/newcold/mobile-home.jpg", alt: "NewCold homepage on a narrow screen", layout: "portrait", presentation: "phone", tone: "#d8e0e7" },
            { type: "image", src: nc(7), alt: "NewCold mobile website, screen 7", layout: "portrait", presentation: "phone", tone: "#d8e0e7" },
            { type: "image", src: nc(8), alt: "NewCold mobile website, screen 8", layout: "portrait", presentation: "phone", tone: "#d8e0e7" },
            { type: "image", src: nc(9), alt: "NewCold mobile website, screen 9", layout: "portrait", presentation: "phone", tone: "#d8e0e7" }
        ],
		// Contribution details supplied by the portfolio owner.
		shortDescription:
			"NewCold's website, built as a front-end developer, with an interactive map of the company's facilities and offices worldwide.",
		previewImage: "/projects/newcold/thumbnail.jpg",
        thumbnailVideo: "/projects/newcold/thumbnail-loop.mp4",
		previewVideo: "/projects/newcold/preview.mp4",
		livePreview: null,
		gitHub: null,
		tags: ["Next.js", "React", "Mapbox", "Tailwind CSS"],
		category: "Development",
		description:
			"NewCold is a refrigerated food logistics provider. I worked on its website as a front-end developer, including the interactive facilities map (filter by facilities or offices, fly to a region, and click a pin to open a side panel with that site's photo and figures) and the image carousel on the Careers page.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "",
		fullImages: [1, 2, 3, 5, 6, 7, 8, 9].map(nc),
		slug: "newcold",
	},
	{
		name: "Karina Rodriguez",
		highlight: "A calm, editorial site for a Denver executive coach.",
		company: "Karina Rodriguez Coaching",
		role: "Design & development",
		responsibilities: ["Designing and building the site: a video hero, services, corporate programs, the process, testimonials, FAQ and a contact page with an inquiry form, with content managed in Prismic."],
		media: [
			{ type: "video", src: "/projects/karina-rodriguez/recording.mp4", poster: "/projects/karina-rodriguez/recording.jpg", alt: "The site on a laptop and a phone: the hero video plays, then the page scrolls", caption: "The homepage on desktop and phone, hero video and all." },
			{ type: "image", src: "/projects/karina-rodriguez/scene.jpg", alt: "Karina Rodriguez’s site on a laptop", presentation: "scene" },
			{ type: "image", src: "/projects/karina-rodriguez/scene-phone.jpg", alt: "Karina Rodriguez’s site on a phone", presentation: "scene", layout: "half" },
			{ type: "image", src: "/projects/karina-rodriguez/1.jpg", alt: "Karina Rodriguez homepage: Body wisdom for leadership, visibility, and growth" },
			{ type: "image", src: "/projects/karina-rodriguez/contact.jpg", alt: "Contact page: Let's partner up, with the inquiry form and other contact options", caption: "The contact page: an inquiry form beside a testimonial, with a discovery call and email as other ways in." },
			{ type: "image", src: "/projects/karina-rodriguez/m3.jpg", alt: "Contact form on a phone", layout: "portrait", presentation: "phone", tone: "#efe2dc" },
			{ type: "image", src: "/projects/karina-rodriguez/m1.jpg", alt: "Karina Rodriguez homepage on a phone", layout: "portrait", presentation: "phone", tone: "#efe2dc" },
			{ type: "image", src: "/projects/karina-rodriguez/2.jpg", alt: "Rethinking Performance and Pressure, with workshop and experience figures", layout: "half" },
			{ type: "image", src: "/projects/karina-rodriguez/3.jpg", alt: "Ways to work together: executive coaching, 1:1 coaching, leadership development, workshops", layout: "half" },
			{ type: "image", src: "/projects/karina-rodriguez/4.jpg", alt: "Why Karina: body wisdom, pattern awareness, practical integration" },
			{ type: "image", src: "/projects/karina-rodriguez/m2.jpg", alt: "Ways to work together on a phone", layout: "portrait", presentation: "phone", tone: "#efe2dc" }
		],
		shortDescription:
			"Karina Rodriguez helps leaders, professionals and teams work with pressure through executive coaching, 1:1 coaching and workshops rooted in body wisdom.",
		previewImage: "/projects/karina-rodriguez/thumbnail.jpg",
		thumbnailVideo: "/projects/karina-rodriguez/thumbnail-loop.mp4",
		livePreview: null,
		gitHub: null,
		tags: ["Next.js", "Prismic", "Netlify"],
		category: "Development",
		description:
			"A site for Karina Rodriguez, an executive coach in Denver, CO: a warm, editorial layout in Gambarino and Inter that introduces her approach, her ways of working with leaders and teams, and a free discovery call.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "2026",
		fullImages: [1, 2, 3, 4].map(n => `/projects/karina-rodriguez/${n}.jpg`),
		slug: "karina-rodriguez",
	},
	{
		name: "JonnyOnTheSpot",
		highlight: "A landing page for a Bay Area mobile bar.",
		company: "JonnyOnTheSpot Mobile Bar",
		role: "Design & development",
		responsibilities: ["Designing and building the landing page: services, the price sheet, testimonials and a quote form, with content managed in Prismic."],
		media: [
			{ type: "video", src: "/projects/jonnyonthespot/recording.mp4", poster: "/projects/jonnyonthespot/recording.jpg", alt: "The landing page scrolling on a laptop and a phone", caption: "The landing page on desktop and phone. Shown with refreshed photos and a tightened services section." },
			{ type: "image", src: "/projects/jonnyonthespot/scene.jpg", alt: "JonnyOnTheSpot services on a laptop", presentation: "scene" },
			{ type: "image", src: "/projects/jonnyonthespot/scene-phone.jpg", alt: "JonnyOnTheSpot on a phone", presentation: "scene", layout: "half" },
			{ type: "image", src: "/projects/jonnyonthespot/1.jpg", alt: "JonnyOnTheSpot homepage: on the spot bartending for weddings and private events" },
			{ type: "image", src: "/projects/jonnyonthespot/2.jpg", alt: "Bartending services: signature cocktails, fresh garnishes and mixers, mobile bar setup, curated shopping list", caption: "Four services, each with its own photo." },
			{ type: "image", src: "/projects/jonnyonthespot/m1.jpg", alt: "JonnyOnTheSpot homepage on a phone", layout: "portrait", presentation: "phone", tone: "#e9dfc9" },
			{ type: "image", src: "/projects/jonnyonthespot/m2.jpg", alt: "Services on a phone", layout: "portrait", presentation: "phone", tone: "#e9dfc9" },
			{ type: "image", src: "/projects/jonnyonthespot/3.jpg", alt: "Tailored price list" }
		],
		shortDescription:
			"JonnyOnTheSpot is a husband-and-wife mobile bartending business from Livermore, serving weddings and private events across the Bay Area.",
		previewImage: "/projects/jonnyonthespot/thumbnail.jpg",
		livePreview: null,
		gitHub: null,
		tags: ["Next.js", "Prismic", "Web design"],
		category: "Development",
		description:
			"A focused landing page for JonnyOnTheSpot, a mobile bar for weddings and private events in the Bay Area: what's included, a clear price sheet, testimonials and a way to get a quote.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "2023",
		fullImages: [1, 2, 3].map(n => `/projects/jonnyonthespot/${n}.jpg`),
		slug: "jonnyonthespot",
	},
	{
		name: "Strength Without Pain",
		highlight: "A research-led brand and website concept for a personal training business.",
		company: "Concept",
		role: "Research & design",
		responsibilities: [
			"Researching personal training businesses and competitors to shape the positioning.",
			"A fresh brand: palette, type (Inter and Source Sans Pro) and a UI language of story-driven sections, grids and large calls to action.",
			"A full website design in Figma, with persona stories, service cards and a discovery-call journey."
		],
		media: [
			{ type: "video", src: "/projects/strength-concept/scroll.mp4", poster: "/projects/strength-concept/scroll.jpg", alt: "A slow scroll through the full homepage design" },
			{ type: "video", src: "/projects/strength-concept/laptop-scroll.mp4", poster: "/projects/strength-concept/laptop-scroll.jpg", alt: "The homepage moving section by section on a laptop" },
			{ type: "image", src: "/projects/strength-concept/section1.jpg", alt: "Hero: Strength without pain. Fitness that lasts." },
			{ type: "image", src: "/projects/strength-concept/section2.jpg", alt: "Persona stories carousel" },
			{ type: "image", src: "/projects/strength-concept/section3.jpg", alt: "Most workouts treat symptoms. We fix the cause." },
			{ type: "video", src: "/projects/strength-concept/motion.mp4", poster: "/projects/strength-concept/motion.jpg", alt: "A motion piece built from the design's headline, service cards and persona stories" },
			{ type: "image", src: "/projects/strength-concept/section4.jpg", alt: "Meet your coach" },
			{ type: "image", src: "/projects/strength-concept/section5.jpg", alt: "Coaching that fits your life" },
			{ type: "video", src: "/projects/strength-concept/laptop-scroll2.mp4", poster: "/projects/strength-concept/laptop-scroll2.jpg", alt: "The homepage scrolling back up on a laptop" },
			{ type: "image", src: "/projects/strength-concept/section6.jpg", alt: "Your mountain journey to better movement" },
			{ type: "image", src: "/projects/strength-concept/section7.jpg", alt: "Real people. Real results." },
			{ type: "image", src: "/projects/strength-concept/section8.jpg", alt: "Start training without pain, and the footer" },
			{ type: "image", src: "/projects/strength-concept/system.jpg", alt: "Design language and visual system: palette, typography, UI language and design goals" }
		],
		shortDescription:
			"A concept for a Colorado Springs personal trainer: strength without pain, fitness that lasts. Designed in Figma and available for a business that wants to adopt it.",
		previewImage: "/projects/strength-concept/thumbnail.jpg",
		livePreview: null,
		gitHub: null,
		tags: ["Figma", "Competitor research", "Brand concept"],
		category: "Design",
		description:
			"A brand and website concept for a personal training business focused on pain-free strength. Persona stories (a veteran, a HYROX competitor, a busy professional, a hiker) lead into services, the coach, a step-by-step journey and testimonials, all guiding visitors to book a discovery call. It is a concept, not a launched site, and is up for grabs.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "2026",
		fullImages: [1, 3, 6, 8].map(n => `/projects/strength-concept/section${n}.jpg`),
		slug: "strength-without-pain",
	},
	{
		// Draft: listed so everything is in place; story, year, company, tech and media to be refined with the owner.
		name: "Compassion Authentication",
		highlight: "One Compassion login for Compassion.com, MyCompassion and the rest of the Compassion family.",
		company: "",
		role: "",
		responsibilities: [],
		media: [
			{ type: "video", src: "/projects/compassion-auth/thumbnail-loop.mp4", poster: "/projects/compassion-auth/thumbnail.jpg", alt: "A person icon opens into the Compassion login; the username and password are typed, Continue signs in and the MyCompassion dashboard loads in, and the icon turns into a green check" },
			{ type: "video", src: "/projects/compassion-auth/phone-recording.mp4", poster: "/projects/compassion-auth/phone-recording.jpg", alt: "On a phone: creating an account, the password rules ticking off as it is typed, then logging in and landing on the MyCompassion home" },
			{ type: "image", src: "/projects/compassion-auth/login.jpg", alt: "Log in with your Compassion account" },
			{ type: "image", src: "/projects/compassion-auth/m-rules.jpg", alt: "Create account on a phone: every password rule met and the Create my account button enabled", layout: "portrait", presentation: "phone", tone: "#e6ecf7" },
			{ type: "image", src: "/projects/compassion-auth/create.jpg", alt: "Create account: email or sponsor number, then a username and password" },
			{ type: "image", src: "/projects/compassion-auth/password.jpg", alt: "Reset your password", layout: "half" },
			{ type: "image", src: "/projects/compassion-auth/username.jpg", alt: "Recover your username", layout: "half" },
			{ type: "image", src: "/projects/compassion-auth/m-login-signedin.jpg", alt: "Log in on a phone, with the already-logged-in notice", layout: "portrait", presentation: "phone", tone: "#e6ecf7" },
			{ type: "image", src: "/projects/compassion-auth/m-create.jpg", alt: "Create account on a phone", layout: "portrait", presentation: "phone", tone: "#e6ecf7" },
			{ type: "image", src: "/projects/compassion-auth/login-filled.jpg", alt: "The login form filled in with a test account" },
			{ type: "image", src: "/projects/compassion-auth/signed-in.jpg", alt: "Signed in: the MyCompassion home, reached through the shared login (children’s photos blurred)" }
		],
		shortDescription: "One Compassion login for Compassion.com, MyCompassion and the rest of the Compassion family.",
		previewImage: "/projects/compassion-auth/thumbnail.jpg",
		thumbnailVideo: "/projects/compassion-auth/thumbnail-loop.mp4",
		livePreview: null,
		gitHub: null,
		tags: [],
		category: "Development",
		description: "The sign-in service behind the Compassion family of sites: log in, create an account with an email or sponsor number, and recover a password or username. Screens are from the staging site with a test account.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "",
		slug: "compassion-auth",
	},
	{
		// Draft: listed so everything is in place; story, year, company, tech and media to be refined with the owner.
		name: "Garcia",
		highlight: "Apple Pay and back-end work for Garcia, the Dutch jeanswear brand.",
		company: "",
		role: "Back-end development",
		responsibilities: [],
		media: [
			{ type: "video", src: "/projects/garcia/shop-flow.mp4", poster: "/projects/garcia/shop-flow.jpg", alt: "The Garcia webshop: a product chosen from the listing, size picked, added to the bag, the accepted payment marks including Apple Pay, then checkout" },
			{ type: "image", src: "/projects/garcia/1.jpg", alt: "Garcia homepage" },
			{ type: "image", src: "/projects/garcia/category.jpg", alt: "Women’s category page" },
			{ type: "image", src: "/projects/garcia/listing.jpg", alt: "Garcia women’s jeans listing" },
			{ type: "image", src: "/projects/garcia/pdp.jpg", alt: "Product page with size selection" },
			{ type: "image", src: "/projects/garcia/m-pdp.jpg", alt: "Product page on a phone", layout: "portrait", presentation: "phone", tone: "#e9e4dd" },
			{ type: "image", src: "/projects/garcia/added.jpg", alt: "Added to the bag: the mini bag drops down", layout: "half" },
			{ type: "image", src: "/projects/garcia/cart.jpg", alt: "The bag, with Apple Pay among the accepted payment methods", layout: "half" },
			{ type: "image", src: "/projects/garcia/checkout.jpg", alt: "Checkout, step one: email, then delivery and payment" },
			{ type: "image", src: "/projects/garcia/payment.jpg", alt: "Checkout, step three: payment methods, with Apple Pay selected" },
			{ type: "image", src: "/projects/garcia/m-payment.jpg", alt: "The payment step on a phone, with the Apple Pay button", layout: "portrait", presentation: "phone", tone: "#e9e4dd" },
			{ type: "image", src: "/projects/garcia/payment-applepay.jpg", alt: "Apple Pay selected: the Apple Pay checkout button appears under the option" }
		],
		shortDescription: "Apple Pay and back-end work for Garcia, the Dutch jeanswear brand.",
		previewImage: "/projects/garcia/shop-flow.jpg",
		thumbnailVideo: "/projects/garcia/shop-flow.mp4",
		livePreview: null,
		gitHub: null,
		tags: ["Apple Pay"],
		category: "Development",
		description: "Garcia is a Dutch jeanswear brand (\"jeanswear for real people\") with its own webshop for women, men, girls and boys. My work was mostly on the back end, including integrating Apple Pay into checkout, so shoppers can pay in one tap.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "",
		slug: "garcia",
	},
	{
		// Draft: listed so everything is in place; story, year, company, tech and media to be refined with the owner.
		name: "Jeans Centre",
		highlight: "Apple Pay and back-end work for Jeans Centre, the Dutch family jeans store.",
		company: "",
		role: "Back-end development",
		responsibilities: [],
		media: [
			{ type: "video", src: "/projects/jeans-centre/shop-flow.mp4", poster: "/projects/jeans-centre/shop-flow.jpg", alt: "The Jeans Centre webshop: a product chosen from the listing, size picked, added to the bag, the accepted payment marks including Apple Pay, then checkout" },
			{ type: "image", src: "/projects/jeans-centre/1.jpg", alt: "Jeans Centre homepage" },
			{ type: "image", src: "/projects/jeans-centre/listing.jpg", alt: "Jeans Centre women’s jeans listing" },
			{ type: "image", src: "/projects/jeans-centre/pdp.jpg", alt: "Product page with size selection" },
			{ type: "image", src: "/projects/jeans-centre/m-pdp.jpg", alt: "Product page on a phone", layout: "portrait", presentation: "phone", tone: "#e3e9de" },
			{ type: "image", src: "/projects/jeans-centre/added.jpg", alt: "Added to the bag: the mini bag drops down", layout: "half" },
			{ type: "image", src: "/projects/jeans-centre/cart.jpg", alt: "The bag, with Apple Pay among the accepted payment methods", layout: "half" },
			{ type: "image", src: "/projects/jeans-centre/checkout.jpg", alt: "Checkout, step one: email, then delivery and payment" },
			{ type: "image", src: "/projects/jeans-centre/payment-menu.jpg", alt: "Payment methods: Apple Pay sits under other methods, next to PayPal and Bancontact", layout: "half" },
			{ type: "image", src: "/projects/jeans-centre/payment-applepay.jpg", alt: "Apple Pay chosen: the Apple Pay checkout button replaces the order button", layout: "half" },
			{ type: "image", src: "/projects/jeans-centre/m-payment.jpg", alt: "The payment step on a phone, with the Apple Pay button", layout: "portrait", presentation: "phone", tone: "#e3e9de" }
		],
		shortDescription: "Apple Pay and back-end work for Jeans Centre, the Dutch family jeans store.",
		previewImage: "/projects/jeans-centre/shop-flow.jpg",
		thumbnailVideo: "/projects/jeans-centre/shop-flow.mp4",
		livePreview: null,
		gitHub: null,
		tags: ["Apple Pay"],
		category: "Development",
		description: "Jeans Centre sells jeans and clothing for the whole family, in stores across the Netherlands and online. My work was mostly on the back end of the webshop, including integrating Apple Pay into checkout.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "",
		slug: "jeans-centre",
	},
	{
		// Draft: listed so everything is in place; story, year, company, tech and media to be refined with the owner.
		name: "Sobolt cloud platform",
		highlight: "One place for Sobolt’s customers to see their AI apps, usage, requests and the app marketplace.",
		company: "Sobolt",
		role: "Full-stack development",
		responsibilities: [],
		media: [
			{ type: "video", src: "/projects/sobolt/thumbnail-loop.mp4", poster: "/projects/sobolt/thumbnail.jpg", alt: "The Sobolt cloud dashboard: hovering the quick actions, then opening Reports as the usage bars fill in" },
			{ type: "image", src: "/projects/sobolt/dashboard.jpg", alt: "Dashboard: last week’s CPU, GPU, RAM and storage usage, and the customer’s apps" },
			{ type: "video", src: "/projects/sobolt/walkthrough.mp4", poster: "/projects/sobolt/dashboard.jpg", alt: "Walkthrough of the platform: one-click sign-in, the dashboard, usage reports, requests, the app marketplace and requesting a quote (faces blurred)" },
			{ type: "image", src: "/projects/sobolt/reports.jpg", alt: "Reports: support hours this period and resource usage for a chosen date range", layout: "half" },
			{ type: "image", src: "/projects/sobolt/requests.jpg", alt: "Request overview: open requests with their status (faces blurred)", layout: "half" },
			{ type: "image", src: "/projects/sobolt/marketplace.jpg", alt: "The apps marketplace" },
			{ type: "image", src: "/projects/sobolt/submit-request.jpg", alt: "Submitting a request for a quote" }
		],
		shortDescription: "A cloud platform for Sobolt’s AI apps: usage, requests and an app marketplace.",
		previewImage: "/projects/sobolt/thumbnail.jpg",
		thumbnailVideo: "/projects/sobolt/thumbnail-loop.mp4",
		livePreview: null,
		gitHub: null,
		tags: ["FastAPI", "Python", "React", "Stencil web components"],
		category: "Development",
		description: "Sobolt is a Dutch company that uses AI to inspect infrastructure such as wind turbines from images. Its cloud platform gave customers one place for their AI apps: one-click sign-in with Google, Microsoft or GitHub, a dashboard of the computing they used, reports for any date range, support and feature requests, and a marketplace to add more apps. The back end ran on FastAPI and Python, the front end on React with custom components built in Stencil. The platform is no longer online, so this page uses Sobolt’s 2021 walkthrough recording.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "2021",
		slug: "sobolt",
	},
	{
		// Draft: listed so everything is in place; story, year, company, tech and media to be refined with the owner.
		name: "Trend Trade",
		highlight: "The Trend Trade mobile app.",
		company: "",
		role: "Mobile development",
		responsibilities: [],
		media: [],
		shortDescription: "The Trend Trade mobile app.",
		previewImage: "/projects/trend-trade/thumbnail.jpg",
		livePreview: null,
		gitHub: null,
		tags: [],
		category: "Development",
		description: "The Trend Trade mobile app. Videos and photos to come from the owner’s archive.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "",
		slug: "trend-trade",
	},
	{
		// Draft: listed so everything is in place; story, year, company, tech and media to be refined with the owner.
		name: "HKliving",
		highlight: "Search, cart, product pages and the Press Room for HKliving, the Amsterdam interior brand.",
		company: "",
		role: "",
		responsibilities: ["The search bar animation.", "The cart animation.", "The product detail pages.", "The Press Room."],
		media: [
			{ type: "video", src: "/projects/hkliving/thumbnail-loop.mp4", poster: "/projects/hkliving/thumbnail.jpg", alt: "The HKliving homepage scrolling sideways, section by section, then sweeping back to the start" },
			{ type: "image", src: "/projects/hkliving/home-1.jpg", alt: "Homepage: Festive season" },
			{ type: "video", src: "/projects/hkliving/search.mp4", poster: "/projects/hkliving/search.jpg", alt: "The search bar dropping down over a product page, popular searches, then a query being typed" },
			{ type: "image", src: "/projects/hkliving/product.jpg", alt: "Product page: 70s ceramics coffee mug" },
			{ type: "image", src: "/projects/hkliving/home-3.jpg", alt: "Homepage: Create space", layout: "half" },
			{ type: "image", src: "/projects/hkliving/home-2.jpg", alt: "Homepage: festive products", layout: "half" },
			{ type: "video", src: "/projects/hkliving/press-room.mp4", poster: "/projects/hkliving/press-room.jpg", alt: "The Press Room: HKliving’s product library with category, material and colour filters, packshots loading in as it scrolls" }
		],
		shortDescription: "Search, cart, product pages and the Press Room for HKliving, the Amsterdam interior brand.",
		previewImage: "/projects/hkliving/thumbnail.jpg",
		thumbnailVideo: "/projects/hkliving/thumbnail-loop.mp4",
		livePreview: null,
		gitHub: null,
		tags: [],
		category: "Development",
		description: "HKliving is an Amsterdam interior and homeware brand known for bold, eclectic collections. I built the search bar and cart animations, the product detail pages and the Press Room. The site has since been replaced, so these screens come from the Wayback Machine. The archive lost most images: the homepage and product photos are HKliving’s own, still on its image CDN, put back where they belonged, and the Press Room shows current HKliving packshots labelled with their own product codes.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "2021",
		slug: "hkliving",
	},
	{
		// Draft: listed so everything is in place; story, year, company, tech and media to be refined with the owner.
		name: "Count Group",
		highlight: "The website for COUNT Group, an energy and petrochemical solutions company.",
		company: "",
		role: "",
		responsibilities: [],
		media: [],
		shortDescription: "The website for COUNT Group, an energy and petrochemical solutions company.",
		previewImage: "/projects/count-group/thumbnail.jpg",
		livePreview: null,
		gitHub: null,
		tags: [],
		category: "Development",
		description: "COUNT Group works in energy and petrochemical solutions. I worked on its website in 2021 and early 2022; the site has changed since, so the screens come from the Wayback Machine.",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "2021–2022",
		slug: "count-group",
	},
	{
		name: "Natours",
		shortDescription:
			"Natours is a full-stack web-application website that lets users check out and book the most exciting tours ever! Features include examples like CRUD operations for admins, payments using stripe, file upload handling and authorization",
		previewImage: Natours,
		livePreview: null,
		gitHub: null,
		tags: [
			"React",
			"MVC",
			"ExpressJS",
			"Stripe",
			"Multer",
			"MongoDB",
			"AWS EC2 & S3",
			"AdobeXD",
		],
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
		earlyWork: true,
		slug: "natours",
	},
	{
		name: "Oracui's MVP",
		shortDescription:
			"Oracui is a global mentorship platform that connects senior students with enrolling students in order to provide mentorship and build relationship. I've been mainly responsible for bringing the product's REST API to MVP ready conditions by improving documentation and adding over 20+ new business features.",
		previewImage: Oracui,
		livePreview: null,
		gitHub: null,
		tags: ["REACTJS", "REDUX", "EXPRESSJS", "MONGODB", "NODEJS", "GOOGLE API"],
		category: "Development",
		description:
			"Oracui is a global mentorship platform that connects senior students with enrolling students in order to provide mentorship and build relationship. I've been mainly responsible for bringing the product's REST API to MVP ready conditions by improving documentation and adding over 20+ new business features. I've also connected 80% of all available endpoints to the front-end's redux store. I worked on Oracui together with Joao Lucas Nina Matos, who is the responsible CTO. Together with Joao, we ensured that this product was viable enough to be used by 30+ users.",
		process:
			"At first when I joined Oracui, the back-end was pretty messy and everyone was aware of this. However, I quickly rolled up my sleeves and started to refactor and export reusable functions to utility files. After cleaning up the back-end, I made a list of all necessary business features to have a bird's view over everything, so that I do not end up in a mess when eventually developing it. After thinking about best engineering approaches; I applied the MVC pattern in order to separate the application into three main logical components. As I developed the back-end, I made sure to document each endpoint in Postman. When finishing most endpoints, I decided to pick up the responsibility to connect 80% of these endpoints to the front-end using Reactjs and Redux.",
		challenges:
			"A big challenge was integrating Google's Calendar API, as it required a service account and a lot of additional programming. The reason behind using this API, was to ensure that users could schedule their meetings on our platform and not have to rely on redundant email exchanges in order to plan and schedule a meeting.",
		differently:
			"Next time, I would try and be more involved with the front-end architecture and development as well, so communication between the two ends can go smoothly.",
		takeaway:
			"My takeaway is that developing Oracui in its early stages was a big, but necessary challenge. Not only did it allow me to grow as a developer, but it also taught me how to work on a single codebase together with another developer. Something that definitely brought me a lot of joy was having this product actually being used by 35 students at Melbourne University.",
		additionalLinks: [],
		dateCreated: "MARCH, 2021",
		fullImages: [or, or1, or3, or5, or6],
		earlyWork: true,
		slug: "oracui",
	},
	{
		name: "Bay Vine Media",
		shortDescription:
			"[WIP] I've developed a landing page, dedicated to my freelance web and creative services under the name of a brand I'm working on (Bay Vine). Bay Vine Media seeks to allow minorities and small businesses to still have a presentable brand and online presence. ",
		previewImage: BayVineMedia,
		livePreview: null,
		gitHub: null,
		tags: [
			"REACTJS",
			"NETLIFY",
			"GSAP",
			"REACT HOOKS",
			"ADOBE XD",
			"GOOGLE ANALYTICS",
		],
		category: "Development",
		description:
			"[WIP] I've developed a landing page, dedicated to my freelance web and creative services under the name of a brand I'm working on (Bay Vine). Bay Vine Media seeks to allow minorities and small businesses to still have a presentable brand and online presence. I've designed and developed everything using AdobeXD, React, and GSAP. Bay Vine Media is just one of many creative ideas I have in store for Bay Vine, and I hope to grow this brand out to multiple side projects that I can reflect my identity in.",
		process:
			"Before I started developing this site, I had to think properly about the brand Bay Vine. I couldn't just go and freestyle how this site looked like. I had to make sure I could use the same system in my other projects under the name Bay Vine.  An example of reusing this same system is seen back in my portfolio as well. That is why I came up with a very vibrant color-scheme that allows for scaling. Once I designed the site, I went ahead and developed it in React and used GSAP for all animations.",
		challenges:
			"A big challenge with Bay Vine Media, was to have everything look crisp and consistent as possible.",
		differently:
			"Something I would do differently is try and design out every little scenario. For example the round cursor was not meant to be in the final project, but was added later on. This caused me to re-write most of my code in order to properly use ContextAPI. The reason behind re-writing most of my code, is that I wanted to take full advantage of ContextAPI so that meant moving most of the state to the store.",
		takeaway:
			"A big takeaway is that there is a sea of creative opportunities. There should be no limits to a developer. One year ago I would've never imagined developing this site with all the animations and details. There is constant opportunity to learn and growth.",
		additionalLinks: [],
		dateCreated: "JANUARY, 2021",
		fullImages: [bv1, bv2, bv3, bv4],
		earlyWork: true,
		slug: "bayvinemedia",
	},
	{
		name: "Salvame",
		shortDescription:
			"Salvame is an art-initiative to empower and inform the locals of Boyle Heights about environmental racism. I created a web-app using three-js to display local art in an abstract and symbolic way.",
		previewImage: Salvame,
		livePreview: null,
		gitHub: null,
		tags: ["REACTJS", "THREEJS", "GSAP", "UX/UI", "PITCHING", "USER RESEARCH"],
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
		additionalLinks: [],
		dateCreated: "JULY, 2020",
		fullImages: [s1, s2, s3, s4, s5, s6, s7, s8],
		earlyWork: true,
		slug: "salvame",
	},

	{
		name: "My Old Portfolio",
		shortDescription:
			"Over the past couple of months, my portfolio's gone through a lot of changes. Despite the changes, I'm still incredibly proud of my previous designed and developed portfolio.",
		previewImage: OldPortfolio,
		livePreview: null,
		gitHub: null,
		tags: ["REACTJS", "REACT HOOKS", "ADOBEXD", "GSAP"],
		category: "Development",
		description: "",
		process: "",
		challenges: "",
		differently: "",
		takeaway: "",
		additionalLinks: [],
		dateCreated: "JULY, 2020",
		fullImages: [],
		earlyWork: true,
		slug: "oldportfolio",
	},

	{
		name: "Burger Builder",
		shortDescription:
			"The burger builder is an app that I developed to train my React competencies. Build your burger, sign/log in and review your orders. React Hooks, Redux, Jest/Enzyme, JWT token based Auth.",
		previewImage: BurgerBuilder,
		livePreview: null,
		gitHub: null,
		tags: [
			"REACTJS",
			"FIREBASE",
			"REDUX",
			"UNIT TESTING",
			"REACT HOOKS",
			"REACT ROUTER",
		],
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
		earlyWork: true,
		slug: "burger-builder",
	},

	{
		name: "LOL: My Favorite Champ",
		shortDescription:
			"LOL: My Favorite Champ is a MERN-stack application in which users can preview their favorite League of Legends champions and see their in-game pros and cons. This is a project that I made in 2018 and decided to remake in React.",
		previewImage: Lolmfc,
		livePreview: null,
		gitHub: null,
		tags: ["REACTJS", "EXPRESS", "MONGODB", "AWS", "NODEJS"],
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
		additionalLinks: [],
		dateCreated: "AUGUST, 2020",
		fullImages: [lol1, lol2, lol3, lol4, lol5],
		earlyWork: true,
		slug: "lol-my-fav-champ",
	},

	{
		name: "Thanos(?) Runner",
		shortDescription:
			"Thanos Runner is an endless runner game. In order to win the game you have to collect 6 infinity stones and avoid obstacles. This game gets progressively harder the more stones you collect! Use AD to run and SPACE to jump.",
		previewImage: Thanosrunner,
		livePreview: null,
		gitHub: null,
		tags: ["TYPESCRIPT", "OOP", "GAME"],
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
		additionalLinks: [],
		dateCreated: "JULY, 2018",
		fullImages: [t1, t2, t3, t4],
		earlyWork: true,
		slug: "thanos-runner",
	},
	{
		name: "Paper Invaders",
		shortDescription:
			"Copy Invaders is a web-game that I developed in under 3 hours for my programming class. I implemented the observer’s pattern, strategy pattern and the singleton pattern in this game.",
		previewImage: Paperinvaders,
		livePreview: null,
		gitHub: null,
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
		earlyWork: true,
		slug: "paper-invaders",
	},
	{
		name: "My PokeDex",
		shortDescription:
			"My PokeDex is my first ever Android app that I developed using Java and Android Studio. This project was made to play around with Android development concepts and to familiarize myself with different technologies. ",
		previewImage: PokeDex,
		livePreview: null,
		gitHub: null,
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
		earlyWork: true,
		slug: "my-pokedex",
	},
	{
		name: "Leidsman Begeleiding",
		shortDescription:
			"Leidsman is a dutch math discussion platform that allows you to post your favorite math subjects, favorite them and comment on other posts in order to discuss various math subjects.",
		previewImage: Leidsman,
		livePreview: null,
		gitHub: null,
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
		earlyWork: true,
		slug: "leidsman-begeleiding",
	},
	{
		name: "Maria Beauty Salon",
		shortDescription:
			"My first ever “web-application”! I made a reservation system for my mother’s salon in pure PHP, HTML/Materialize & MySQL. Functionalities include form validation, authentication, authorization and full CRUD operations over reservations",
		previewImage: MariaBeautySalon,
		livePreview: null,
		gitHub: null,
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
		earlyWork: true,
		slug: "maria-beauty-salon",
	},
	{
		name: "Machine Learning Basics",
		shortDescription:
			"Machine Learning application that includes Kmeans clustering, logistic regression and decision trees using sklearn.",
		previewImage: Classifier,
		livePreview: null,
		gitHub: null,
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
		earlyWork: true,
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
		livePreview: null,
		gitHub: null,
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
