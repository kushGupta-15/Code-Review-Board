const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'all fields are required' })
  }

  try {
    // check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'email already in use' })
    }

    // hash password
    const salt = await bcrypt.genSalt(10)
    const password_hash = await bcrypt.hash(password, salt)

    // save user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, password_hash]
    )

    const user = result.rows[0]

    // generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ user, token })

  } catch (err) {
    console.error('register error:', err.message)
    res.status(500).json({ message: 'server error' })
  }
}

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'all fields are required' })
  }

  try {
    // find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'invalid email or password' })
    }

    const user = result.rows[0]

    // check password
    const isMatch = await bcrypt.compare(password, user.password_hash)

    if (!isMatch) {
      return res.status(400).json({ message: 'invalid email or password' })
    }

    // generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(200).json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    })

  } catch (err) {
    console.error('login error:', err.message)
    res.status(500).json({ message: 'server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    res.status(200).json(result.rows[0])
  } catch (err) {
    console.error('getme error:', err.message)
    res.status(500).json({ message: 'server error' })
  }
}

module.exports = { register, login, getMe }