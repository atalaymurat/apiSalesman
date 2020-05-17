const Joi = require('@hapi/joi')

module.exports = {
  validateBody: schema => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body)
      if (error) {
        console.log('[Joi-Route-Helper] Error :', error)

        return res.status(400).json({
          status: 'error',
          message: "",
          error: error.message,
        })
      }
      if (!req.value) {
        req.value = {}
      }
      req.value['body'] = value
      next()
    }
  },

  schemas: {
    authSchema: Joi.object().keys({
      email: Joi.string().email().required().error(new Error("Email geçerli değil")),
      password: Joi.string().required().min(6).error(new Error(" Şifre boş bırakılamaz veya en az 6 karakter içermeli")),
    }),
    verifySchema: Joi.object().keys({
      code: Joi.string().max(6).min(6).error(new Error("Kod doğru değil")),
    }),
  },
}
