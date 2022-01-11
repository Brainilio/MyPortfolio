import React from "react"
import clsx from "clsx"
import "./SectionWrapper.scss"

const SectionWrapper = ({ className, children }) => {
	return (
		<section className={clsx([className, "section-wrapper"])}>
			{children}
		</section>
	)
}

export default SectionWrapper
