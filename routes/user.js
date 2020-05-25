const router = require('express-promise-router')()
const passport = require('passport')
const { validateBody, schemas } = require('../helpers/routeHelpers.js')

const UsersController = require('../controllers/users')

router.route('/changepass')
  .post(validateBody(schemas.changeSchema), UsersController.changePass)

router.route('/reverify')
  .post(UsersController.reVerify)

router.route('/forget')
  .post(UsersController.forget)

router.route('/reset')
  .post(UsersController.reset)

router.route('/verify').post(validateBody(schemas.verifySchema), UsersController.verify)
module.exports = router

