const { DataTypes } = require('sequelize');
const sequelize = require('../config/DBconfig'); // Конфігурація бази даних
const User = require('./user'); // Імпорт моделі User

const Friendship = sequelize.define('Friendship', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  receiver_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}); 

Friendship.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
Friendship.belongsTo(User, { foreignKey: 'receiver_id', as: 'Receiver' });

module.exports = Friendship;
