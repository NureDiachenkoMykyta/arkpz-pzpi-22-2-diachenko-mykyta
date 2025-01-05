const { DataTypes } = require('sequelize');
const sequelize = require('../config/DBconfig');

const TimeEntry = sequelize.define('TimeEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  task_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Tasks', // Назва таблиці
      key: 'id',
    },
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = TimeEntry;
