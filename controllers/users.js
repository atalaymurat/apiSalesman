const JWT = require('jsonwebtoken')
const User = require('../models/user.js')
const { JWT_SECRET } = require('../.credentials.js')
const randomstring = require('randomstring')
const mailer = require('../misc/mailer.js')
const conf = require('../.credentials.js')

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
    let confirmStr = randomstring.generate({
      length: 6,
      charset: 'hex',
    })

    console.log('random string : ', confirmStr)
    //Create new user
    const newUser = new User({
      methods: ['local'],
      local: {
        email: email,
        password: password,
        confirmStr: confirmStr,
        email_verified: false,
      },
    })

    await newUser.save()
    console.log('[CTRL] Sign-UP New User : ', newUser)

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

    // Getting the JWT access token
    const token = signToken(newUser)
    res.cookie('access_token', token, { httpOnly: true })

    //Sending the Email
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

  verify: async (req, res, next) => {
    try {
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
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: 'Serverda bir hata oluştu',
        message: 'verify controller cath error',
      })
      next(error)
    }
  },

  //login: async (req, res, next) => {
  //console.log('[CTRL] login called req : ', next)
  //const token = signToken(req.user)
  //res.cookie('access_token', token, {
  //httpOnly: true,
  //})
  //res.status(200).json({
  //status: 'ok',
  //error: null,
  //message: 'Giriş yaptınız',
  //})
  //console.log('[CTRL] Successfull Login')
  //},

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
