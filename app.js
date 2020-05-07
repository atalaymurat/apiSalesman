const express = require('express')
const app = express()
const port = 4000

app.get('/', (req, res) => {
  res.status(200)
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

// 404 catch-all handler (middleware)
app.use(function (req, res, next) {
  res.status(404)
  res.send('404')
})

// 500 error handler (middleware)
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500)
  res.send('500')
})

app.listen(port, () =>
  console.log('App started in mode ' + app.get('env') + ` listening at http://localhost:${port}`)
)
