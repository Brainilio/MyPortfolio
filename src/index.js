import React from "react"
import ReactDOM from "react-dom"
import "./styles/index.scss"
import App from "./App"
import { BrowserRouter } from "react-router-dom"
import { library } from "@fortawesome/fontawesome-svg-core"
import {
	fab,
	faJs,
	faReact,
	faNodeJs,
	faPhp,
	faLinkedin,
	faTwitter,
	faGithub,
} from "@fortawesome/free-brands-svg-icons"
import {
	faPen,
	faObjectGroup,
	faDatabase,
	faFileCode,
	faBrain,
	faVial,
	faProjectDiagram,
	faRocket,
	faNetworkWired,
	faSuitcase,
	faCube,
	faShoePrints,
	faPaperclip,
	faEnvelope,
} from "@fortawesome/free-solid-svg-icons"

library.add(
	fab,
	faReact,
	faJs,
	faPen,
	faNodeJs,
	faDatabase,
	faObjectGroup,
	faPhp,
	faFileCode,
	faBrain,
	faVial,
	faProjectDiagram,
	faRocket,
	faNetworkWired,
	faSuitcase,
	faCube,
	faShoePrints,
	faLinkedin,
	faTwitter,
	faPaperclip,
	faGithub,
	faEnvelope
)

ReactDOM.render(
	<BrowserRouter>
		<React.StrictMode>
			<App />
		</React.StrictMode>
	</BrowserRouter>,
	document.getElementById("root")
)
