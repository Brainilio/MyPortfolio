import React, { useEffect, useState } from "react"
import MarkD from "markdown-to-jsx"

const Markdown = ({ source }) => {
	const [state, setState] = useState(null)

	useEffect(() => {
		fetch("../../test.md")
			.then((res) => res.text())
			.then((md) => {
				console.log(md)
			})
	}, [])

	return <MarkD>{state}</MarkD>
}

export default Markdown
