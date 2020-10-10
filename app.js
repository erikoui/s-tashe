const express = require('express')
const app = express()

app.use(express.static('./public'));

// app.get('/getest', (req, res) => {
//   res.send('Hello Wossssrld!')
// })

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})