const JWT = require('jsonwebtoken')
const { JWT_SECRET } = require('../.credentials.js')
const passport = require('passport')

const User = require('../models/user.js')
const conf = require('../.credentials.js')
const mailer = require('../misc/mailer.js')
const {
  confirmHtml,
  confirmText,
  confirmStr,
} = require('../misc/confirmationMail')

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
  signUp: async (req, res, next) => {
    const { email, password } = req.value.body
    //Check if any user with same email
    let findUser = await User.findOne({ 'local.email': email })
    if (findUser) {
      return res.status(403).json({
        status: 'error',
        message: 'Giriş yapmayı deneyiniz.',
        error: 'Bu email adresinle üyeliğin bulunmakta.',
      })
    }
    // Again looking for findUser to catch social accounts
    findUser = await User.findOne({
      $or: [{ 'google.email': email }, { 'facebook.email': email }],
    })
    if (findUser) {
      // Merge with google account
      //  Bu mantıktada sıkıntı var Çünkü Adamın olan emailinin üstüne yazıyor [ x ]
      //  Eger tanımlı başka bir yerel email varsa geri dönüyor
      if (findUser.local.email) {
        return res.status(403).json({
          status: 'error',
          error: 'Bu sosyal hesaba ait başka bir üyeliginiz var',
          message: 'Sosyal ağ hesabıyla giriş yapmayı deneyiniz',
        })
      }
      findUser.methods.push('local')
      findUser.local = {
        email: email,
        password: password,
      }
      await findUser.save()

      // Token vermemeyi deniyorum
      // Çünkü verify yapmalı [ Olmuyor ]
      // Token burda alınmalı yoksa giriş yapıyor ama
      // get dashboard ve logout yapamıyor
      // Getting the JWT access token
      const token = signToken(findUser)
      res.cookie('access_token', token, { httpOnly: true })

      return res.status(200).json({
        status: 'ok',
        error: null,
        message: 'Yeni yerel hesap kaydı gerçekleştirildi',
        success: true,
      })
    }

    //Start confirmation process
    const newStr = confirmStr()

    console.log('random string : ', newStr)
    //Create new user
    const newUser = new User({
      methods: ['local'],
      local: {
        email: email,
        password: password,
        confirmStr: newStr,
        email_verified: false,
      },
    })

    await newUser.save()
    console.log('[CTRL] Sign-UP New User : ', newUser)

    // Getting the JWT access token
    const token = signToken(newUser)
    res.cookie('access_token', token, { httpOnly: true })
    //Generating email template with string code
    const text = confirmText(newStr, email)
    const html = confirmHtml(newStr, email)
    //Sending the ConfirmationMail
    await mailer.sendEmail(
      conf.host_email,
      email,
      `${conf.host_url} -- Doğrulama Kodu`,
      html,
      text
    )

    console.log('[CTRL-signUp] Email sent for verify to', email)
    res.status(200).json({
      success: true,
      status: 'ok',
      message: `Doğrulama kodunuz ${email} adresine gönderildi`,
      error: '',
    })
  },

  

  login: async (req, res, next) => {
    passport.authenticate('local', function (err, user, info) {
      if (err) {
        return next(err)
      }
      if (!user) {
        console.log('LOCAL STRETEGY RESPOND')
        return res.status(401).json({
          status: 'error',
          error: info.message,
          message: 'Kayıt bulunamadı Üye olamayı deneyin',
        })
      }
      console.log('Buraya geldi : -------------')

      const token = signToken(user)
      res.status(200).cookie('access_token', token, {
        httpOnly: true,
      })

      console.log('Res den önce  token : ----------', token)
      res.end()
    })(req, res, next)
  },

  logOut: async (req, res, next) => {
    res.clearCookie('access_token')
    console.log('User LogOut ---')
    res.json({
      status: 'ok',
      error: null,
      message: 'Sistemden Çıkış Yaptınız',
    })
  },

  googleOAuth: async (req, res, next) => {
    const token = signToken(req.user)
    console.log('[CTRL]-googleAuth req.user.profile', req.user.profile)
    res.cookie('access_token', token, { httpOnly: true })
    res.status(200).json({
      success: true,
    })
  },

  linkGoogle: async (req, res, next) => {
    res.json({
      success: true,
      methods: req.user.methods,
      message: 'Success linking to Google account',
    })
  },

  unlinkGoogle: async (req, res, next) => {
    if (req.user.google) {
      req.user.google = undefined
    }
    const googleStrPos = req.user.methods.indexOf('google')
    if (googleStrPos >= 0) {
      req.user.methods.splice(googleStrPos, 1)
    }
    await req.user.save()

    res.json({
      success: true,
      methods: req.user.methods,
      message: 'Successfully unlinked account from Google',
    })
  },

  facebookOAuth: async (req, res, next) => {
    const token = signToken(req.user)
    res.cookie('access_token', token, { httpOnly: true })
    res.status(200).json({ success: true })
  },

  linkFacebook: async (req, res, next) => {
    res.json({
      success: true,
      methods: req.user.methods,
      message: 'Success linking to Facebook account',
    })
  },

  unlinkFacebook: async (req, res, next) => {
    if (req.user.facebook) {
      req.user.facebook = undefined
    }
    const facebookStrPos = req.user.methods.indexOf('facebook')
    if (facebookStrPos >= 0) {
      req.user.methods.splice(facebookStrPos, 1)
    }
    await req.user.save()

    res.json({
      success: true,
      methods: req.user.methods,
      message: 'Successfully unlinked account from Facebook',
    })
  },

  dashboard: async (req, res, next) => {
    console.log('[CTRL]-dashboard- req.user : ', req.user)
    res.json({
      secret: 'Yeni hesap açılışı gerçekleştirildi',
      methods: req.user.methods,
      user: {
        email: req.user.local.email,
        admin: req.user.admin,
        picture: req.user.google.picture || req.user.facebook.picture,
        displayName:
          req.user.google.displayName || req.user.facebook.displayName,
        googleEmail: req.user.google.email,
        fbEmail: req.user.facebook.email,
        email_verified: req.user.local.email_verified,
      },
    })
  },

  checkAuth: async (req, res, next) => {
    res.json({ success: true })
  },
}
