const nodemailer = require('nodemailer');
const config = require('../.credentials.js')

const transport = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: config.sendGrid.USER,
    pass: config.sendGrid.PASS,
  },
  tls: {
    rejectUnauthorized: false,
  }
});

module.exports = {
  sendEmail(from, to, subject,  html){
    return new Promise((resolve, reject) => {
      transport.sendMail({from, subject, to, html, text}, (err, info)=> {
        if(err) reject(err);

        resolve(info)
      });
    });
  }
} 

