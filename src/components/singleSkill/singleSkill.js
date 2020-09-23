import React from "react"
import "./singleSkill.scss"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const SingleSkill = (props) => {
	return (
		<div>
                <FontAwesomeIcon icon={props.iconName} size="3x"/>
			<span>{props.name}</span>
		</div>
	)
}

export default SingleSkill
