require('dotenv').config();


const { Sequelize } = require('sequelize');

// Підключення до бази даних через Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,    // Ім'я вашої бази даних
  process.env.DB_USER,    // Користувач бази даних
  process.env.DB_PASSWORD, // Пароль користувача
  {
    host: process.env.DB_HOST,    // Хост (наприклад, 'localhost')
    dialect: 'postgres',          // Використовуємо PostgreSQL
    logging: false,               // Вимкнути логування запитів (можна увімкнути для відладки)
  }
);

// Тестуємо підключення
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

module.exports = sequelize;
