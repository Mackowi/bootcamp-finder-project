const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const User = require('../models/User.js')

// desc: register user
// route: POST /api/v1/auth/register
// method: Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body

  // create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  })

  sendTokenResponse(user, 200, res)
})

// desc: login user
// route: POST /api/v1/auth/register
// method: Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  // validate email and password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400))
  }
  // check for user
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401))
  }

  // check if password matches
  const isMatch = await user.matchPassword(password)

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401))
  }

  sendTokenResponse(user, 200, res)
})

// get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // create token
  const token = user.getSignedJwtToken()

  const option = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === 'production') {
    option.secure = true
  }

  res.status(statusCode).cookie('token', token, option).json({
    success: true,
    token,
  })
}

// desc: get current logged in user
// route: GET /api/v1/auth/me
// method: Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
  res.status(200).json({
    success: true,
    data: user,
  })
})

module.exports = {
  register,
  login,
  getMe,
}