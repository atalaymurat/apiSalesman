const User = require('../models/user.js')
const JWT = require('jsonwebtoken')
const { JWT_SECRET } = require('../.credentials.js')
const {
  confirmStr,
  confirmHtml,
  confirmText,
} = require('../misc/confirmationMail')
const mailer = require('../misc/mailer')
const conf = require('../.credentials')

signToken = (user) => {
  return JWT.sign(
    {
      iss: 'apiSalesman',
      sub: user._id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1),
    },
    JWT_SECRET
  )
}

module.exports = {
  changePass: async (req, res, next) => {
    console.log('change Pass CTRL -- req', req.body)
    var decode = JWT.verify(req.cookies.access_token, JWT_SECRET)
    console.log('decoded jwt : ', decode.sub)
    const user = await User.findById(decode.sub)
    console.log('User find by sub : ', user)
    const { currentPassword, newPassword } = req.body
    if (!user) {
      return res.status(403).json({
        status: 'error',
        error: 'Kullanıcı Bulunamadı',
        message: null,
      })
    }
    if (!user.local.email) {
      return res.status(403).json({
        status: 'error',
        error: 'Kullanıcı yerel hesap kaydı bulunamadı.',
        message: 'Lütfen yerel hesap kaydı yapmayı deneyiniz.',
      })
    }
    if (!user.local.email_verified) {
      return res.status(403).json({
        status: 'error',
        error: 'E-posta doğrulanmamış.',
        message: 'Lütfen önce E-posta adresini doğrulayınız.',
      })
    }
    const isMatch = await user.isValidPassword(currentPassword)
    console.log('Passwordler uyuyor mu? :', isMatch)
    if (!isMatch) {
      return res.status(406).json({
        status: 'error',
        error: 'Şifre hatalı.',
      })
    }
    user.local.password = newPassword
    user.save()
    console.log('Yeni şifre kaydedildi')
    return res.status(200).json({
      status: 'ok',
      message: 'Şifre değiştirildi.',
    })
  },
  // re sending verification code
  reVerify: async (req, res, next) => {
    console.log('REQUEST REVERİFY :', req.body)
    const usermail = req.body.user
    console.log('usermail ---- :', usermail)
    if (!usermail) {
      return res.status(406).json({
        status: 'error',
        error: 'Kimlik bilgisi tesbit edilemedi.',
      })
    }
    const findUser = await User.findOne({ 'local.email': usermail })
    console.log('FINDUSER ---- :', findUser)
    if (!findUser.local.confirmStr && findUser.local.email_verified) {
      console.error('E-posta tekrar doğrulanamaz')
      return res.status(406).json({
        status: 'error',
        error: 'E-posta doğrulanmış. tekar doğrulanamıyor',
      })
    }
    // Limiting Time to update Record
    let dateNow = new Date()
    let timeDiff = Math.abs(dateNow - findUser.updated_at) / 60000
    let timeTo = 60 - Math.floor(timeDiff)
    console.log('Timediff', timeDiff)
    console.log('Time now ', dateNow)
    // Bu email sıfırlamıssa zaman kıssıtlamasına girmsesine sebeb oluyor
    console.log('Updated at', findUser.updated_at)
    if (timeDiff < 10) {
      console.error('Email zaman kısıtlaması 60 dk')
      return res.status(406).json({
        status: 'error',
        error: `${timeTo} dk sonra tekrar göndermeyi deneyebilirsiniz.`,
      })
    }
    //ReGenerate Confirmation String
    const newStr = confirmStr()
    // Generate Email template with confirmation string
    const text = confirmText(newStr)
    const html = confirmHtml(newStr)
    console.log('Confirm E-mail temps : ', html, text)
    // Saving confirmation STR to db
    findUser.local.confirmStr = newStr
    await findUser.save()
    console.log('USER SAVED with Conf Str :', findUser)

    //Sending the ConfirmationMail
    await mailer.sendEmail(
      conf.host_email,
      usermail,
      `${conf.host_url} -- Doğrulama Kodu`,
      html,
      text
    )

    console.log(`Re verify Email sent to user ${usermail}`)
    return res.status(200).json({
      status: 'ok',
      message: `Tekrar doğrulama kodu ${usermail} adresine gönderildi`,
    })
  },

  verify: async (req, res, next) => {
    console.log('[CTRL] verify entered')
    const { code } = req.value.body
    //if(code){ code.trim() }
    console.log('req code : ', code)

    const verifyUser = await User.findOne({ 'local.confirmStr': code })
    console.log('Found User is :', verifyUser)

    if (!verifyUser) {
      console.log('[CTRL-vrfy] There is no user with code !!')
      return res.status(403).json({
        status: 'error',
        email_verified: false,
        message: 'Yeni bir kod almayı deneyin',
        error: 'Kod Geçerli Değil',
      })
    }

    if (verifyUser) {
      //Generate token
      const token = signToken(verifyUser)
      //Respond with cookie JWT
      res.cookie('access_token', token, { httpOnly: true })
      console.log('Access_Token Cookie assagned')

      // Saving Verified User to verified
      verifyUser.local.email_verified = true
      verifyUser.local.confirmStr = ''
      await verifyUser.save()
      console.log('[CTRL-vrfy] User email verified OK')

      return res.status(200).json({
        status: 'ok',
        email_verified: verifyUser.local.email_verified,
        message: 'Email adresiniz doğrulandı...',
        error: null,
      })
    }
  },

  

  forget: async (req, res, next) => {
    console.log('FORGET REQ body', req.body)
    const usermail = req.body.email
    const findUser = await User.findOne({ 'local.email': usermail })
    console.log('Found User : ', findUser)
    if (!findUser) {
      return res.status(404).json({
        status: 'error',
        error: 'Herhangi bir kullanıcı kaydı bulunamadı',
      })
    }
    /*  
    //--- Kullanıcı mevcut ----
    */
    if (!findUser.local.email_verified) {
      return res.status(404).json({
        succeess: false,
        error: 'Email doğrulanmamış.',
      })
    }

    // Token oluştur [x]
    const resetToken = JWT.sign(
      {
        iss: 'apiSalesman',
        sub: findUser._id,
        iat: new Date().getTime(),
        exp: Math.floor(Date.now() / 1000) + 30 * 60,
      },
      JWT_SECRET
    )
    console.log('ResetToken : ', resetToken)
    // Token db kaydet [x]
    findUser.local.resetPassToken = resetToken
    findUser.save()
    console.log('User Token Saved : ', findUser)
    html = `
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
    Siz veya (başka birisi) bu email adresine, şifre sıfırlama linki talebinde bulundu eğer sizin bilginiz dışında ise, herhangi bir şey yapmanıza gerek yoktur. eğer siz talepte bulunduysanız aşağıdaki linkten ulaşarak şifrenizi yenileyebilirsiniz. bu link 1 saat içinde geçerliliğini kaybedecektir.</p>
    <p>Eğer e-postamız gereksiz klasörünüze gelmiş ise lütfen mailimizi gereksiz değil olarak işaretleyiniz. <p/>
    <p>Görüş ve istekleriniz ile ilgili bize e-posta yazabilirsiniz. Sizlerden gelecek bildirimler bizim için büyük önem arzetmektedir.</p>
    <br />
    <hr />
    link : <a href="http://${conf.host_url}/reset/${resetToken}">Yeni şifre belirle</a><br />
    <hr />
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
    // Token email send [x]
    await mailer.sendEmail(
      conf.host_email,
      usermail,
      `${conf.host_url} -- Şifre Sıfırlama`,
      html
    )
    res.status(200).json({
      status: 'ok',
      message: `${usermail} adresine sıfırlama linki gönderildi`,
    })
  },

  reset: async (req, res, next) => {
    try {
      const token = req.body.token
      const newPassword = req.body.password
      console.log('token :', token, 'Pass :', newPassword)
      // Check token is verified [ ]
      let decode = JWT.verify(token, JWT_SECRET)
      console.log('DECODE :', decode)
      // Find the user from token [ ]
      const findUser = await User.findById(decode.sub)
      if (!findUser) {
        return res.status(404).json({
          status: 'error',
          error: 'Üzgünüz, geçersiz kimlik,',
        })
      }
      // İf user try to change again
      let match = token === findUser.local.resetPassToken
      if (!match) {
        return res.status(403).json({
          status: 'error',
          error: 'Anahtar kimlik geçersiz. son belirlenen şifre kullanılabilir.',
        })
      }
      // Password hash and salt [ ]
      findUser.local.password = newPassword
      findUser.local.resetPassToken = '1'
      findUser.save()
      res.status(200).json({
        success: true,
        message: 'Şifre atama başarılı',
      })
    } catch (error) {
      res.status(404).json({
        status: 'error',
        error: 'Üzgünüz, Hatalı veya eksik bir işlem yapılıyor.'
      })
    }

    // Save Password to user [ ]
  },
}
