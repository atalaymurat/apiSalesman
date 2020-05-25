const randomstring = require('randomstring')
const conf = require('../.credentials.js')

const confirmStr = () => {
  let str = randomstring.generate({
    length: 6,
    charset: 'hex',
  })
  return str
}

const confirmHtml = (newStr, email) => {
  console.log("Gelen email", email )
  let user = email.split("@")[0]
  let mail = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <title>Doğrulama Kodu</title>
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style type="text/css">
      html {
        background-color: #ffffff !important;
        color: #2a2d25;
      }
      hr {
        border-top: 1px solid #ffffff;
        margin: 10px 0;
      }
      table {
        font-size: 22px;
        background-color: #ffffff;
      }
      a {
        color: #2a2d25;
      }
      address {
        font-size: 16px;
        font-style: normal;
      }
    </style>
    <style type="text/css">
      @media only screen and (max-width: 600px) {
        table {
          width: 100%;
        }
      }
    </style>
  </head>
  <body
    style="
      overflow: auto;
      padding: 0;
      margin: 0;
      font-size: 14px;
      font-family: arial, helvetica, sans-serif;
      cursor: auto;
      background-color: #ffffff;
    "
  >
    <hr style="border-top: 1px solid #000303;" />
    <table
      cellspacing="0"
      cellpadding="0"
      border="0"
      width="90%"
      bgcolor="#ececec"
      style="
        margin-right: auto;
        margin-left: auto;
        font-family: Arial, Helvetica, sans-serif;
      "
    >
      <tr>
        <td style="padding: 10px;">
          <strong
            class="brand"
            style="
              color: #000303;
              text-align: left;
              letter-spacing: -1.7px;
              font-family: Futura, Arial, Helvetica, sans-serif;
              font-size-adjust: 0.6px;
              font-size: 35px;
              margin-top: 10px;
            "
          >
            makinaTr
          </strong>
        </td>
      </tr>
      <tr>
        <td
          style="
            width: 70%;
            color: #ebebe1;
            padding: 15px;
            background-color: #333535;
            border: solid 1px #ebebe1;
            border-radius: 12px;
          "
        >
          <h1 style="text-align: center;">
            <b>Hoşgeldiniz,</b>
          </h1>
          <div style="text-align: center;">
            Merhaba <b style="font-size: 24px;">${user.toUpperCase()}</b>,
            lütfen hesabınızı onaylamak için e-postanızı doğrulayınız.
          </div>
          <hr />
          <p style="text-align: left;">Bu kodu kullanarak doğrulayın.</p>
          <div
            style="
              margin-right: auto;
              margin-left: auto;
              width: 65%;
              border: 1px solid #e2e2d8;
              background-color: #000303;
              color: #e2e2d8;
              border-radius: 6px;
              font-size: 26px;
            "
          >
            <p style="text-align: center;">${newStr}</p>
          </div>
          <br />
          <p style="text-align: left;">
            Diğer bir seçenek link'ten doğrulayabilirsiniz, veya link sizin için
            çalışmıyor ise, kopyalayıp, internet tarayıcınızın adress satırına
            yapıştırabilirsiniz.
          </p>
          <p style="text-align: left;">
            <a
              style="color: #e2e2d8; text-decoration: none;"
              href="http://makinatr.com/verify?token=${newStr}"
              >http://makinatr.com/verify?token=${newStr}</a
            >
          </p>
          <hr />
          <p style="text-align: center;">
            makinaTr ekibi sizi aramızda görmekten mutluluk duyar.
          </p>
          <hr />
        </td>
      </tr>
    </table>

    <table
      style="
        margin-right: auto;
        margin-left: auto;
        font-family: Arial, Helvetica, sans-serif;
        letter-spacing: 1.1px;
        font-weight: 100;
        color: #333535;
      "
    >
      <tr>
        <td style="background-color: #ffffff; padding: 15px;">
          <address>
            <p style="text-align: center;">
              &copy 2020 makinaTr - Samandıra, Sancaktepe, 34885
            </p>
            <p style="text-align: center;">İstanbul, Türkiye</p>
          </address>
          <p style="text-align: center; font-size: 16px; white-space: nowrap;">
            Servis Kullanım Koşulları | Gizlilik Politikası | İletişim
          </p>
          <p style="text-align: center; font-size: 16px;">
            İnstagram | Facebook | LinkedIn
          </p>
        </td>
      </tr>
    </table>
    <hr style="border-top: 1px solid #000303;" />
  </body>
</html>

  
    `
  return mail
}

//Send the verification email
const confirmText = (newStr) => {
  let text = `
  Hoşgeldiniz, 
  Merhaba ${user.toUpperCase()},
  lütfen hesabınızı onaylamak için e-postanızı doğrulayınız.

  Bu kodu kullanarak doğrulayın.
  ---------------------------------------------
  Kod : ${newStr}
  ---------------------------------------------
  Diğer bir seçenek link'ten doğrulayabilirsiniz, veya link sizin için çalışmıyor ise, kopyalayıp, internet tarayıcınızın adress satırına yapıştırabilirsiniz.
  
  link : http://makinatr.com/verify?token=${newStr}
  
  makinaTr ekibi sizi aramızda görmekten mutluluk duyar.

  &copy 2020 makinaTr - Samandıra, Sancaktepe, 34885
  Servis Kullanım Koşulları | Gizlilik Politikası | İletişim
  İnstagram | Facebook | LinkedIn
  `
  return text
}

module.exports = { confirmHtml, confirmText, confirmStr }
