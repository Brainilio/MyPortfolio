import React from "react"
import Nav from "./components/nav"
import Button from "./components/button"
import Withclass from "./hoc/container"
import Particles from "react-particles-js"
import Title from "./components/title"

function App() {
	return (
		<>
			<Nav />

			<div className='landing-section'>
				<Title />
			</div>

			{/* <Particles /> */}
			{/* <Button /> */}
		</>
	)
}

export default App
