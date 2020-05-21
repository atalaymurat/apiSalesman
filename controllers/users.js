const User = require('../models/user.js')
const JWT = require('jsonwebtoken')
const { JWT_SECRET } = require('../.credentials.js')

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
        return res.status(403).json({
          status: 'error',
          error: 'Şifre hatalı.',
        })
      }
      user.local.password = newPassword
      user.save()
      console.log('Yeni şifre kaydedildi')
      res.status(200).json({
        status: 'ok',
        error: null,
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

}