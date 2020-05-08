const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConf = require('../passport.js')

const { validateBody, schemas } = require('../helpers/routeHelpers.js')
const UsersController = require('../controllers/users')
const passportlogin = passport.authenticate('local', { session: false })
const passportJWT = passport.authenticate('jwt', { session: false })
const passportGoogle = passport.authenticate('googletoken', { session: false })

router.route('/signUp').post(validateBody(schemas.authSchema), UsersController.signUp)

router.route('/login').post(validateBody(schemas.authSchema), passportlogin, UsersController.login)

router.route('/oauth/google').post(passportGoogle, UsersController.googleOAuth)

router.route('/oauth/facebook')
  .post(passport.authenticate('facebookToken', {session:false}), UsersController.facebookOAuth)

router.route('/secret').get(passportJWT, UsersController.secret)

module.exports = router
