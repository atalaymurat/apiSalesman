const express = require('express')
const app = express()
const port = 4000

app.get('/', (req, res) => {
  res.send('Salesman Api index')
})

// logging
switch (app.get('env')) {
  case 'development':
    app.use(require('morgan')('dev'))
    break
  case 'production':
    app.use(require('express-logger')({ path: __dirname + '/log/requests.log' }))
    break
}

app.listen(port, () =>
  console.log(
    'App started env: ' + app.get('env') + ` App is listening at http://localhost:${port}`
  )
)
