const { DataTypes } = require('sequelize');
const sequelize = require('../config/DBconfig');
const TimeEntry = require('./timeEntry'); // Імпорт моделі TimeEntry

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  priority: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(15),
    defaultValue: 'Pending',
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assignee_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
});

// Встановлення зв'язку з TimeEntry
Task.hasMany(TimeEntry, { foreignKey: 'task_id', as: 'TimeEntries' });
TimeEntry.belongsTo(Task, { foreignKey: 'task_id', as: 'Task' });

module.exports = Task;
