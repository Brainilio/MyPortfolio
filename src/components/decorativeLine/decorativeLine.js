import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/all"
import React, { useEffect, useRef } from "react"
import "./decorativeLine.scss"

const DecorativeLine = () => {
	const leftRef = useRef(null)
	const rightRef = useRef(null)
	gsap.registerPlugin(ScrollTrigger)

	useEffect(() => {
		gsap.to(leftRef.current, {
			scrollTrigger: {
				trigger: leftRef.current,
				start: "center center",
				toggleActions: "restart",
			},
			y: 150,
			opacity: 1,
			height: 950,
			duration: 1.8,
		})
		gsap.to(rightRef.current, {
			scrollTrigger: {
				trigger: rightRef.current,
				start: "top top",
				toggleActions: "restart none reverse",
			},
			y: 150,
			opacity: 1,
			height: 950,
			duration: 1.8,
		})
	}, [])
	return (
		<>
			<span ref={leftRef} className="deco-line-left"></span>
			<span ref={rightRef} className="deco-line-right"></span>
		</>
	)
}

export default DecorativeLine
