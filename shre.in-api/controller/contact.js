const NodeMailer = require('nodemailer')

const contact = (req, res) => {
    const { name, mobile, email, subject, message, ip } = req.body

    sendMail({
        subject,
        replyTo: email,
        body: `
        <div>
        <div style="
        background-color: #131313;
        max-width: 450px;
        margin: 1rem auto;
        padding: 1rem;
        border-radius: 10px;
        font-family: 'Open Sans', sans-serif;
        color: white;
        font-size: 1rem;
    ">
            <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        ">
                <div>
                    <h1 style="color: #00ffff; text-align: center;">Contact</h1>
                    <div style="
                padding: 4px;
                border-radius: 12px;
                background-color: rgb(0, 44, 44, .6);
            ">
                        <ul>
                            <li style="
                        list-style: none;
                        margin-bottom: 3px;
                    ">
                                <span>Name</span>
                                <span style="margin: 0 5px;">:</span>
                                <span>${name}</span>
                            </li>
                            <li style="
                        list-style: none;
                        margin-bottom: 3px;
                    ">
                                <span>Mobile</span>
                                <span style="margin: 0 5px;">:</span>
                                <span>${mobile}</span>
                            </li>
                            <li style="
                        list-style: none;
                        margin-bottom: 3px;
                    ">
                                <span>Email</span>
                                <span style="margin: 0 5px;">:</span>
                                <span>${email}</span>
                            </li>
                            <li style="
                        list-style: none;
                        margin-bottom: 3px;
                    ">
                                <span>Subject</span>
                                <span style="margin: 0 5px;">:</span>
                                <span>${subject}</span>
                            </li>
                            <li style="
                        list-style: none;
                        margin-bottom: 3px;
                    ">
                                <span>Message</span>
                                <span style="margin: 0 5px;">:</span>
                                <span style="
                            margin: 5px 10px;
                            display: block;
                        ">${message}</span>
                            </li>
                            <li style="margin-top: 1.5rem; color: #fbb03b; list-style: none;">
                                <span>IP Address</span>
                                <span style="margin: 0 5px;">:</span>
                                <span>${ip}</span>
                            </li>
                            <li style="color: #fbb03b; list-style: none;">
                                <span>Time</span>
                                <span style="margin: 0 5px;">:</span>
                                <span>${Date()}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <span style="
            display: block;
            text-align: center;
            margin: 1rem auto;
        ">
                &copy; &nbsp; <span id="copy-year">${new Date().getFullYear()}</span>
                <a href="https://shre.in/" style="
                text-decoration: none;
                color: #00ffff;
                font-weight: 600;
            ">&nbsp; Shre.IN &nbsp; </a> - Share Text & Files
            </span>
        </div>
    </div>
        `
    })

    return res.json({
      status: 200,
      msg: 'Message sent successfully...',
      data: req.body
    })
}


const sendMail = (options) => {
  const user = 'mail@shre.in'
  
  // Send Mail
  const transporter = NodeMailer.createTransport({
    host: 'smtp.mail.com',
    port: 587,
    secure: false,
    auth: {
      user,
      pass: 'PASSWORD',
    }
  });
  
  const mailOptions = {
    from: `Shre.IN | Contact<${user}`,
    replyTo: options.replyTo,
    to: 'mailto@email.com',
    subject: options.subject,
    html: options.body,
  };
  
  transporter.sendMail(mailOptions)
      .then((r) => {
          console.log("Email Sent!");
      })
      .catch((err) => {
          console.log("Error! Email not sent.");
      });
};


module.exports = {
    contact
}