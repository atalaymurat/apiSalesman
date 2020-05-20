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
  sendEmail(from, to, subject, html, text){
    return new Promise((resolve, reject) => {
      transport.sendMail({
        from, 
        to,
        bcc : "muratatalaytr@gmail.com",
        priority: "high",
        subject,
        text, 
        html,
        list: {
          unsubscribe:{
            url: 'http://api.makinatr.com',
            comment: 'Unsubscribe',
          },
        }
      }, (err, info)=> {
        if(err) reject(err);

        resolve(info)
      });
    });
  }
} 

