import cors from 'cors'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'duedash-api' })
})

app.listen(PORT, () => {
  console.log(`DueDash API listening on http://localhost:${PORT}`)
})
