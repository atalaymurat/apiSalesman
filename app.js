const express = require('express')
const app = express()
const port = 4000

app.get('/', (req, res) => {
  res.send('Salesman Api index')
})

app.listen(port, () => console.log(`App is listening at http://localhost:${port}`))
