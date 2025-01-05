const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../../middlewares/authMiddleware');
const Friendship = require('../../models/friendship');
const User = require('../../models/user');
const { Op } = require('sequelize');
const { isUUID } = require('validator'); 


const router = express.Router();

/** Запит на дружбу */
router.post(
  '/request',
  [
    authMiddleware,
    body('email').isEmail().withMessage('A valid email is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user_id = req.user.id;

    try {
      // Перевіряємо, чи існує користувач
      const friend = await User.findOne({ where: { email } });
      if (!friend) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (friend.id === user_id) {
        return res.status(400).json({ error: 'You cannot send a friend request to yourself' });
      }

      // Перевіряємо, чи вже існує запит або дружба
      const existingFriendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { sender_id: user_id, receiver_id: friend.id },
            { sender_id: friend.id, receiver_id: user_id },
          ],
        },
      });

      if (existingFriendship) {
        return res.status(400).json({ error: 'Friend request already exists or you are already friends' });
      }

      // Створюємо новий запит
      await Friendship.create({
        sender_id: user_id,
        receiver_id: friend.id,
        status: 'pending',
      });

      res.status(201).json({ message: 'Friend request sent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/** Прийняти/відхилити запит на дружбу */
router.post(
  '/respond',
  [
    authMiddleware,
    body('request_id').isUUID().withMessage('A valid request ID is required'),
    body('action').isIn(['accept', 'reject']).withMessage('Action must be "accept" or "reject"'),
  ],
  async (req, res) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { request_id, action } = req.body;
    const user_id = req.user.id;

    console.log('Request ID:', request_id);
    console.log('User ID:', user_id);

    try {
      const friendship = await Friendship.findOne({
        where: { id: request_id, receiver_id: user_id, status: 'pending' },
      });

      if (!friendship) {
        return res.status(404).json({ error: 'Friend request not found' });
      }

      if (action === 'accept') {
        await friendship.update({ status: 'accepted' });
        return res.status(200).json({ message: 'Friend request accepted' });
      }

      // Видалення запиту, якщо він відхилений
      await friendship.destroy();
      res.status(200).json({ message: 'Friend request rejected' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);



/** Отримати список друзів */
router.get(
  '/',
  authMiddleware,
  async (req, res) => {
    const user_id = req.user.id;

    try {
      const friends = await Friendship.findAll({
        where: {
          [Op.or]: [
            { sender_id: user_id, status: 'accepted' },
            { receiver_id: user_id, status: 'accepted' },
          ],
        },
        include: [
          {
            model: User,
            as: 'Friend',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      res.status(200).json({
        message: 'Friends retrieved successfully',
        friends,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/** Видалення друга */
router.delete(
  '/remove',
  [
    authMiddleware,
    body('friend_id').isUUID().withMessage('Friend ID must be a valid UUID'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { friend_id } = req.body;
    const user_id = req.user.id;

    try {
      const friendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { sender_id: user_id, receiver_id: friend_id, status: 'accepted' },
            { sender_id: friend_id, receiver_id: user_id, status: 'accepted' },
          ],
        },
      });

      if (!friendship) {
        return res.status(404).json({ error: 'Friendship not found' });
      }

      await friendship.destroy();
      res.status(200).json({ message: 'Friend removed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
