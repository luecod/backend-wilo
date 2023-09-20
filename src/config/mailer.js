import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ecuadorpro2000@gmail.com",
    pass: "vuqwdjevpanfakrm",
  },
});
export { transporter };
