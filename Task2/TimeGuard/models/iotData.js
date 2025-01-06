const { DataTypes } = require('sequelize');
const sequelize = require('../config/DBconfig'); // Підключення до бази даних

const User = require('./user'); // Імпорт моделі User

const IotData = sequelize.define('IotData', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  device_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  activity_type: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// Встановлюємо зв'язок з таблицею users
IotData.belongsTo(User, { foreignKey: 'user_id' });

module.exports = IotData;