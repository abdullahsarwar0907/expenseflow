const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, text, html) {
    try {
        await sgMail.send({
            to,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: "ExpenseFlow",
            },
            replyTo: process.env.SENDGRID_FROM_EMAIL,
            subject,
            text,
            html: html || `<p>${text}</p>`,
        });

        console.log(`Email sent to ${to}`);
        return true;
    } catch (err) {
        console.error("Email failed to send:", err.response ? err.response.body : err.message);
        return false;
    }
}

module.exports = sendEmail;