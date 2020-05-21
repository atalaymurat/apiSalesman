const randomstring = require('randomstring')
const conf = require('../.credentials.js')

const confirmStr = randomstring.generate({
  length: 6,
  charset: 'hex',
})


const html = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Dogrulama Kodu</title>
    </head>
    <body>
    <p>Merhaba,</p>
    <p>
    Üye kaydınız için teşekkür ederiz.<br />
    Lütfen email adresinizin size ait olduğunu onaylamak için aşağıdaki kodu kullanınız.</p>
    <p>Eğer e-postamız gereksiz klasörünüze gelmiş ise lütfen mailimizi gereksiz değil olarak işaretleyiniz. <p/>
    <p>Görüş ve istekleriniz ile ilgili bize e-posta yazabilirsiniz. Sizlerden gelecek bildirimler bizim için büyük önem arzetmektedir.</p>
    <br />
    <hr />
    Kod : <b>${confirmStr}</b><br />
    <hr />
    <p>
    Emailinizi doğruladıktan sonra kontrol panelinize yönlendirileceksiniz. Kontrol panelinizde bilgilerinizi daha detaylı güncelleyebilirsiniz.</p> <br />
    <p>
    <a href="http://${conf.host_url}/verify">Eğer doğrulama ekranını kapattıysanız bu linkten ulaşabilirsiniz</a></p>
    <br />
    Saygılar.<br />
    <br />
    <address>
    Adress :<br>
    PK 34340, Sancaktepe, İstanbul<br>
    Turkey<br />
    ${conf.host_url}<br />
    </address>
    <br/>
    <br/>
    </body>
    </html>
    `

//Send the verification email
const text = `
    Merhaba,

    Üye kaydınız için teşekkür ederiz.
    Lütfen email adresinizin size ait olduğunu onaylamak için aşağıdaki kodu kullanınız.

    Eğer e-postamız gereksiz klasörünüze gelmiş ise lütfen mailimizi gereksiz değil olarak işaretleyiniz. 

    Görüş ve istekleriniz ile ilgili bize e-posta yazabilirsiniz. Sizlerden gelecek bildirimler bizim için büyük önem arzetmektedir.

    ------------------------------------------------------------
    Kod : ${confirmStr}
    ------------------------------------------------------------

    Emailinizi doğruladıktan sonra kontrol panelinize yönlendirileceksiniz. Kontrol panelinizde bilgilerinizi daha detaylı güncelleyebilirsiniz.

    Saygılar.

   web: ${conf.host_url} 
   mailto: ${conf.host_email} 
   Adres : 
   PK 34340, Sancaktepe, İstanbul
   Turkey`

module.exports = {confirmHtml : html, confirmText: text, confirmStr } 
