const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConf = require('../passport.js')

const { validateBody, schemas } = require('../helpers/routeHelpers.js')
const UsersController = require('../controllers/users')
const passportlogin = passport.authenticate('local', { session: false })
const passportJWT = passport.authenticate('jwt', { session: false })

router.route('/register').post(validateBody(schemas.authSchema), UsersController.register)

router.route('/login').post(validateBody(schemas.authSchema), passportlogin, UsersController.login)

router
  .route('/secret')
  .get(passportJWT, UsersController.secret)

module.exports = router
