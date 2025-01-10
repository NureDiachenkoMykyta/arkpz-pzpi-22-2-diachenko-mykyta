const { DataTypes } = require('sequelize');
const sequelize = require('../config/DBconfig'); // Підключення до бази даних

const User = require('./user'); // Імпорт моделі User

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  generated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
});

// Встановлюємо зв'язок з таблицею users
Report.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Report;