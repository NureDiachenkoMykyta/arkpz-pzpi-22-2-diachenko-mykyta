const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../../models/user'); // Імпорт моделі користувача

const router = express.Router();

// Токен секретний ключ (можна зберігати в .env)
const JWT_SECRET = process.env.JWT_SECRET;

// Реєстрація користувача
router.post(
  '/register',
  [
    // Валідація
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
    // Перевірка результатів валідації
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Перевірка, чи існує вже користувач
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Хешування пароля
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Створення нового користувача
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'User', // Можна встановити роль за замовчуванням
      });

      // Генерація JWT токена
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '1h' } // Термін дії токена 1 година
      );

      // Повернення токена
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
      // Валідація
      body('email').isEmail().withMessage('Please enter a valid email'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    ],
    async (req, res) => {
      // Перевірка результатів валідації
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { email, password } = req.body;
  
      try {
        // Знайти користувача за email
        const user = await User.findOne({ where: { email } });
        if (!user) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
  
        // Перевірка пароля
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
  
        // Генерація JWT токена
        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '10h' } // Термін дії токена 1 година
        );

        // Повернення токена
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

module.exports = router;
