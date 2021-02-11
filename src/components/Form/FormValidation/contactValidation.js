import * as yup from "yup"

export const contactSchema = yup.object().shape({
	name: yup.string().required("Please fill in your name!"),
	email: yup.string().email().required("Please fill in your email!"),
	organization: yup.string().notRequired(),
	phone: yup
		.number("Please provide a legitimate phone number")
		.min(8)
		.required("Please fill in your phone number!"),
	message: yup.string().notRequired(),
})
