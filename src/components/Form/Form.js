import React, { useEffect, useState } from "react"
import "./Form.scss"
import { useForm } from "react-hook-form"
import Success from "../../resources/success.gif"
import Fail from "../../resources/fail.gif"
import FormLoader from "../FormLoader/FormLoader"
import { yupResolver } from "@hookform/resolvers/yup"
import { contactSchema } from "./FormValidation/contactValidation"

function encode(data) {
	return Object.keys(data)
		.map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
		.join("&")
}

const Form = () => {
	const { register, handleSubmit, errors } = useForm({
		resolver: yupResolver(contactSchema),
		criteriaMode: "all",
	})

	const [loader, setLoader] = useState(false)
	const [success, setSuccess] = useState(false)
	const [fail, setFail] = useState(false)
	const [showForm, setShowFarm] = useState(true)
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		organization: "",
		phone: "",
		message: "",
	})

	const formHandler = async (e) => {
		setSuccess(false)
		setFail(false)
		setLoader(true)
		setShowFarm(false)

		fetch("/", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: encode({ "form-name": "contact", ...formData }),
		})
			.then(() => {
				setFail(false)
				setLoader(false)
				setSuccess(true)
				setShowFarm(false)
			})
			.catch(() => {
				setLoader(false)
				setSuccess(false)
				setFail(true)
				setShowFarm(false)
			})

		e.preventDefault()
	}

	const setForm = (e, message) => {
		let name = e.target.name
		let value = e.target.value

		if (message) {
			setFormData({
				...formData,
				message: value,
			})
		} else {
			setFormData({
				...formData,
				[name]: value,
			})
		}
	}

	let form = (
		<form
			name="contact"
			method="POST"
			onSubmit={(e) => handleSubmit(formHandler(e))}
		>
			<input type="hidden" name="form-name" value="contact" />
			<div>
				<label id="lbl-name" htmlFor="name">
					Name*
				</label>
				<input
					placeholder="John Doe"
					onChange={setForm}
					value={formData.name}
					name="name"
					type="text"
					ref={register}
					aria-labelledby="lbl-name"
				/>
				<span
					style={{ color: "lightred", marginTop: "10px", marginBottom: "0em" }}
				>
					{errors.name?.message}
				</span>
			</div>

			<div>
				<label id="lbl-email" htmlFor="email">
					Email*
				</label>
				<input
					ref={register}
					placeholder="John@doe.com"
					value={formData.email}
					onChange={setForm}
					name="email"
					type="email"
					aria-labelledby="lbl-email"
				/>
				<span
					style={{ color: "lightred", marginTop: "10px", marginBottom: "0em" }}
				>
					{errors.email?.message}
				</span>
			</div>

			<div>
				<label id="lbl-org" htmlFor="organization">
					Organization
				</label>
				<input
					aria-labelledby="lbl-org"
					ref={register}
					placeholder="Doe LLC"
					value={formData.organization}
					onChange={setForm}
					name="organization"
					type="text"
				/>
			</div>

			<div>
				<label id="lbl-phone" htmlFor="phone">
					Phone*
				</label>
				<input
					ref={register}
					placeholder="+31(0)6-123-456-78"
					value={formData.phone}
					onChange={setForm}
					name="phone"
					type="tel"
					aria-labelledby="lbl-phone"
				/>
				<span
					style={{ color: "lightred", marginTop: "10px", marginBottom: "0em" }}
				>
					{errors.phone?.message}
				</span>
			</div>

			<div>
				<label id="lbl-message" htmlFor="message">
					Message
				</label>
				<textarea
					aria-labelledby="lbl-message"
					ref={register}
					placeholder="Tell me something about yourself or your business!"
					name="message"
					onChange={(event) => setForm(event, true)}
				/>
			</div>

			<input ref={register} name="bot-field" type="hidden" onChange={setForm} />

			<input
				value="S U B M I T"
				className="button-submit"
				type="submit"
			></input>
		</form>
	)

	return (
		<div className="form">
			<h1>Contact</h1>
			<span>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit.{" "}
				<span>* = Required</span>{" "}
			</span>

			{fail ? (
				<div className="fail-form">
					<h2>Huh! Something went wrong.</h2>
					<span
						onClick={() => {
							setFail(false)
							setShowFarm(true)
						}}
					>
						Try again maybe?
					</span>

					<img
						height="500"
						width="500"
						src={Fail}
						className="form-fail-image"
						alt="fail"
					/>
				</div>
			) : null}
			{success ? (
				<div className="success-form">
					<h2>Yay! Your submission has been sent.</h2>
					<span>
						I hope to respond in less than 24 hours, you can also contact me
						through social media!
					</span>
					<img src={Success} className="form-success-image" alt="success" />
				</div>
			) : null}
			{loader ? <FormLoader /> : null}
			{showForm ? form : null}
		</div>
	)
}

export default Form
