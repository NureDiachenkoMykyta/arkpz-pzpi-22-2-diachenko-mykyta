const express = require('express');
const app = express();
const sequelize = require('./config/DBconfig');
const cors = require('cors');


const bodyParser = require('body-parser');
const routes = require('./routes/api/index');

app.use(cors());
app.use(bodyParser.json());

routes(app);

// Синхронізація моделей
sequelize.sync({ alter: true })  // Можна використовувати alter: true для автоматичної синхронізації
  .then(() => {
    console.log('Database & tables synchronized!');
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });

// Запуск сервера
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
