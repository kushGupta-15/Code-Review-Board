const express = require('express')
const http = require('http')
const cors = require('cors')
const dotenv = require('dotenv')
const { Server } = require('socket.io')

dotenv.config()

const app = express()
const server = http.createServer(app)

const pool = require('./config/db')

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// routes
const authRoutes = require('./routes/authRoutes')
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'server is running' })
})

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id)
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})