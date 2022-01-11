import React, { useState } from "react"
import NavBar from "../components/NavBar/NavBar"
import SideDrawer from "../components/SideDrawer/SideDrawer"
import { useLocation } from "react-router-dom"
import "./Main.scss"

const Main = (props) => {
	const location = useLocation()
	console.log(location.pathname)
	const [drawer, setsidedrawer] = useState(false)

	const handlesidedrawer = () => {
		setsidedrawer((prevstate) => !prevstate)
	}
	return (
		<>
			{location.pathname === "/" && (
				<>
					<SideDrawer clicked={handlesidedrawer} show={drawer} />
					<NavBar clicked={handlesidedrawer} show={drawer} />
				</>
			)}
			<div className="layout">{props.children}</div>
		</>
	)
}

export default Main
