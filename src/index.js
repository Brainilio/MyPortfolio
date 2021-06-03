import React from "react"
import ReactDOM from "react-dom"
import "./styles/index.scss"
import App from "./App"
import { BrowserRouter } from "react-router-dom"

console.log(window.innerWidth)
ReactDOM.render(
	<BrowserRouter>
		<React.StrictMode>
			<App />
		</React.StrictMode>
	</BrowserRouter>,
	document.getElementById("root")
)
