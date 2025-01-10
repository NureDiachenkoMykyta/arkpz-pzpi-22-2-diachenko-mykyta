const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../../models/user'); 

const router = express.Router();


const JWT_SECRET = process.env.JWT_SECRET;


router.post(
  '/register',
  [
    body('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .custom((value, { req }) => {
        if (value !== req.body.passwordConfirmation) {
          throw new Error('Passwords must match');
        }
        return true;
      }),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors)
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

  
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'User', 
      });


      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );


      res.status(201).json({
        message: 'User registered successfully',
        token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
    '/login',
    [
  
      body('email').isEmail().withMessage('Please enter a valid email'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    ],
    async (req, res) => {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { email, password } = req.body;
  
      try {
 
        const user = await User.findOne({ where: { email } });
        if (!user) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
  
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
  
        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '10h' } 
        );


        res.status(200).json({
          message: 'Login successful',
          token,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    }
  );

  router.get('/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }
  
      const token = authHeader.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired. Please log in again.' });
        } else {
          throw error;
        }
      }
  
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'name', 'email', 'role', 'created_at'],
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

module.exports = router;
