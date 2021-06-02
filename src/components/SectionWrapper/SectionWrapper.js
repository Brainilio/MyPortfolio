import React from "react"
import "./SectionWrapper.scss"

const SectionWrapper = (props) => {
	return <section className="section-wrapper">{props.children}</section>
}

export default SectionWrapper
