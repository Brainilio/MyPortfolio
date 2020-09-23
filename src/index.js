import React from "react"
import ReactDOM from "react-dom"
import "./styles/index.scss"
import App from "./App"
import { library } from "@fortawesome/fontawesome-svg-core"
import {
	fab,
	faJs,
	faReact,
	faNodeJs,
	faPhp,
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
	faShoePrints
)

ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById("root")
)
