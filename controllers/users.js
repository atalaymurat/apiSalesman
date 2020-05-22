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

module.exports = {
  changePass: async (req, res, next) => {
    try {
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
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: 'Serverda bir hata oluştu',
        message: 'changePass controller cath error',
      })
      next(error)
    }
  },
  // re sending verification code
  reVerify: async (req, res, next) => {
    try {
      console.log('REQUEST REVERİFY :', req.body)
      const usermail = req.body.user
      console.log("usermail ---- :", usermail)
      if (!usermail) {
        return res.status(406).json({
          status: 'error',
          error: 'Kimlik bilgisi tesbit edilemedi.',
        })
      }
      const findUser = await User.findOne({ 'local.email': usermail })
      console.log('FINDUSER ---- :', findUser)
      if (!findUser.local.confirmStr && findUser.local.email_verified){
        console.error("E-posta tekrar doğrulanamaz")
        return res.status(406).json({
          status: 'error',
          error: 'E-posta doğrulanmış. tekar doğrulanamıyor'
        })
      }
      // Limiting Time to update Record 
      let dateNow = new Date()
      let timeDiff = Math.abs(dateNow - findUser.updated_at ) / 60000
      let timeTo = 60 - Math.floor(timeDiff)
      console.log("Timediff" , timeDiff)
      console.log("Time now ", dateNow)
      console.log("Updated at",findUser.updated_at)
      if (timeDiff < 60){
        console.error("Email zaman kısıtlaması 60 dk")
        return res.status(406).json({
          status: "error",
          error: `${timeTo} dk sonra tekrar göndermeyi deneyebilirsiniz.`
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
    } catch (error) {}
  },
}
