import React, { useEffect, useRef } from "react"
import gsap from "gsap"
import "./LoadingScreen.scss"

// OPEN MENU
const staggerReveal = (node1, node2) => {
	gsap.from([node1, node2], {
		duration: 1,
		height: 0,
		transformOrigin: "right top",
		skewY: 2,
		opacity: 0,
		ease: "power3.inOut",
		stagger: {
			amount: 0.1,
		},
	})
}

const staggerOut = (node1, node2) => {
	gsap.to([node1, node2], {
		duration: 0.8,
		height: 0,
		transformOrigin: "right top",
		skewY: 2,
		opacity: 0,

		ease: "power3.inOut",
		stagger: {
			amount: 0.1,
		},
	})
}

export const simpleReveal = (node1) => {
	gsap.from([node1], {
		duration: 0.8,
		delay: 0.8,
		opacity: 0,
		skewY: 2,
		ease: "power3.inOut",
	})
}

export const simpleOut = (node1) => {
	gsap.from([node1], {
		duration: 0.8,
		opacity: 0,

		skewY: 2,
		ease: "power3.inOut",
		y: -100,
	})
}

export const staggerText = (node1) => {
	gsap.from([node1], {
		duration: 0.8,
		opacity: 0,
		y: 100,
		skewY: 2,
		delay: 0.3,
		ease: "power3.inOut",
		stagger: {
			amount: 0.3,
		},
	})
}

const LoadingScreen = () => {
	let menu = useRef(null)
	let menu2 = useRef(null)
	let loadingTitle = useRef(null)
	let spanText = useRef(null)
	let spinner = useRef(null)

	useEffect(() => {
		// staggerReveal(menu, menu2)
		// staggerText(loadingTitle)
		// staggerText(spanText)
		// simpleReveal(spinner)
		// setTimeout(() => {
		// 	staggerOut(menu, menu2)
		// 	simpleOut(loadingTitle)
		// 	simpleOut(spanText)
		// 	simpleOut(spinner)
		// }, 3500)
	}, [])

	return (
		<>
			<section className="loading">
				<div className="loading-screen">
					<span>
						<strong>Iron sharpens iron, and one man sharpens another.</strong>
					</span>
					{/* <div className="spinner"></div> */}
					<h1>LOADING</h1>
				</div>
			</section>
		</>
	)
}

export default LoadingScreen
