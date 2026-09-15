const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: `"ExpenseFlow" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });

        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error("Email failed to send:", err);
        throw err;
    }
}

module.exports = sendEmail;
