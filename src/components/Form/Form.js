import React, { useState } from "react"
import "./Form.scss"

import Success from "../../resources/success.gif"
import Fail from "../../resources/fail.gif"
import FormLoader from "../FormLoader/FormLoader"

const initialState = {
	name: "",
	email: "",
	organization: "",
	phone: "",
	message: "",
	nameError: "",
	emailError: "",
	phoneError: "",
}

function encode(data) {
	return Object.keys(data)
		.map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
		.join("&")
}

const Form = () => {
	const [loader, setLoader] = useState(false)
	const [success, setSuccess] = useState(false)
	const [fail, setFail] = useState(false)
	const [showForm, setShowFarm] = useState(true)

	const [formData, setFormData] = useState(initialState)

	const handleChange = (e, message) => {
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

		console.log(formData)
	}

	const validate = () => {
		let nameError = ""
		let emailError = ""
		let phoneError = ""
		// const regex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g

		if (!formData.email) {
			emailError = "Please type in your email!"
		} else {
			emailError = " "
		}

		if (formData.email) {
			if (!formData.email.includes("@")) {
				emailError = "Invalid email!"
			}
			emailError = ""
		}

		if (!formData.name) {
			nameError = "Please type in your name!"
		} else {
			nameError = ""
		}

		if (!formData.phone) {
			phoneError = "Please type in your phone number!"
		} else {
			phoneError = ""
		}

		if (formData.phone) {
			if (formData.phone.length < 9 || formData.phone.length > 12) {
				phoneError = "Invalid phone number!"
			}
			phoneError = ""
		}

		if (emailError || nameError || phoneError) {
			setFormData({ ...formData, emailError, nameError, phoneError })
			return false
		}

		return true
	}

	const submitForm = async (e) => {
		e.preventDefault()
		const isValid = validate()

		if (isValid) {
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
					setFormData(initialState)
				})
				.catch(() => {
					setLoader(false)
					setSuccess(false)
					setFail(true)
					setShowFarm(false)
				})
		}
	}

	let form = (
		<form name="contact" method="POST" onSubmit={(e) => submitForm(e)}>
			<input type="hidden" name="form-name" value="contact" />
			<div>
				<label id="lbl-name" htmlFor="name">
					Name*
				</label>
				<input
					placeholder="John Doe"
					onChange={handleChange}
					value={formData.name}
					name="name"
					type="text"
					aria-labelledby="lbl-name"
				/>
				<span style={{ marginTop: "10px", marginBottom: "0em" }}>
					{formData.nameError}
				</span>
			</div>

			<div>
				<label id="lbl-email" htmlFor="email">
					Email*
				</label>
				<input
					placeholder="John@doe.com"
					value={formData.email}
					onChange={handleChange}
					name="email"
					type="email"
					aria-labelledby="lbl-email"
				/>
				<span
					style={{ color: "lightred", marginTop: "10px", marginBottom: "0em" }}
				>
					{formData.emailError}
				</span>
			</div>

			<div>
				<label id="lbl-org" htmlFor="organization">
					Organization
				</label>
				<input
					aria-labelledby="lbl-org"
					placeholder="Doe LLC"
					value={formData.organization}
					onChange={handleChange}
					name="organization"
					type="text"
				/>
			</div>

			<div>
				<label id="lbl-phone" htmlFor="phone">
					Phone*
				</label>
				<input
					placeholder="+1(408)-123-4565 or +31612345678"
					value={formData.phone}
					onChange={handleChange}
					name="phone"
					type="tel"
					aria-labelledby="lbl-phone"
				/>
				<span style={{ marginTop: "10px", marginBottom: "0em" }}>
					{formData.phoneError}
				</span>
			</div>

			<div>
				<label id="lbl-message" htmlFor="message">
					Message
				</label>
				<textarea
					aria-labelledby="lbl-message"
					placeholder="Tell me something about yourself or your business!"
					name="message"
					onChange={(event) => handleChange(event, true)}
				/>
			</div>

			<input name="bot-field" type="hidden" onChange={handleChange} />

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
