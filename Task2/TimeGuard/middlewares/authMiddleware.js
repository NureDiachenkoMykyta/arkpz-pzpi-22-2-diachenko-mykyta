const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Імпорт моделі користувача

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided. Access denied.' });
  }

  // Перевіряємо, чи правильно передано заголовок

  const token = authHeader.split(' ')[1]; // Витягуємо токен із заголовка

  try {
    // Розшифровуємо токен
    //console.log(token)
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Отримуємо інформацію про користувача з бази даних
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role'], // Витягуємо лише необхідні поля
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Access denied.' });
    }

    // Додаємо дані користувача до req.user
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next(); // Передаємо управління наступному middleware
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token. Access denied.' });
  }
};

module.exports = authMiddleware;
