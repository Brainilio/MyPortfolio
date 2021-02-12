import React from "react"
import "./NavBar.scss"
import { Link } from "react-scroll"

const NavBar = () => {
	return (
		<nav>
			<div className="logo">
				<Link
					activeClass="link-active"
					to="landing"
					smooth={true}
					duration={600}
				>
					<span>Brainilio</span>
				</Link>
			</div>
			<div className="nav-items">
				<ul>
					<li>
						<Link
							activeClass="link-active"
							to="projects"
							smooth={true}
							offset={-150}
							duration={600}
						>
							<span>Work</span>
						</Link>
					</li>
					<li>
						<Link
							activeClass="link-active"
							to="about"
							smooth={true}
							offset={-220}
							duration={600}
						>
							<span>About</span>
						</Link>
					</li>
					<li>
						<Link
							activeClass="link-active"
							to="my-skills"
							smooth={true}
							offset={50}
							duration={600}
						>
							<span>Skills</span>
						</Link>
					</li>
					<li>
						<Link
							activeClass="link-active"
							to="contact"
							smooth={true}
							duration={600}
							offset={-500}
						>
							<span>Contact</span>
						</Link>
					</li>
				</ul>
			</div>
		</nav>
	)
}

export default NavBar
