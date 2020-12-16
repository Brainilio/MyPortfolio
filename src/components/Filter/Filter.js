import React from "react"
import "./Filter.scss"

const Filter = (props) => {
	React.useEffect(() => {}, [props.currentProject])
	let currentProject = ""
	let buttons = []

	for (const item in props.currentProject) {
		if (props.currentProject[item]) currentProject = item
		buttons.push(
			props.currentProject[item] ? (
				<button key={item} disabled className="single-button-filter">
					{item}
				</button>
			) : (
				<button
					onClick={() => props.clicked(item)}
					key={item}
					className="single-button-filter"
				>
					{item}
				</button>
			)
		)
	}

	return (
		<div className="filter-all-projects">
			<span>
				Currently displaying: <i>{currentProject}</i> projects.
			</span>
			<div className="filter-button-row">{buttons.map((button) => button)}</div>
		</div>
	)
}

export default Filter
