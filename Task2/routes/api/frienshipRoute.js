const express = require('express');
const authMiddleware = require('../../middlewares/authMiddleware'); // Middleware авторизації
const User = require('../../models/user');
const Friendship = require('../../models/friendship.js');

const router = express.Router();

// Відправлення запиту на дружбу
router.post('/friends/request', authMiddleware, async (req, res) => {
  const { email } = req.body; // email користувача, якому надсилається запит
  const sender_id = req.user.id;

  try {
    // Знаходимо отримувача по email
    const receiver = await User.findOne({ where: { email } });

    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Перевірка, чи не існує вже запит
    const existingRequest = await Friendship.findOne({
      where: { sender_id, receiver_id: receiver.id },
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Request already sent' });
    }

    // Створюємо новий запит
    await Friendship.create({
      sender_id,
      receiver_id: receiver.id,
      status: 'pending',
    });

    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/friends/requests', authMiddleware, async (req, res) => {
    const receiver_id = req.user.id;
  
    try {
      const requests = await Friendship.findAll({
        where: { receiver_id, status: 'pending' },
        include: [{ model: User, as: 'Sender', attributes: ['id', 'name', 'email'] }],
      });
  
      res.status(200).json(requests);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.post('/friends/respond', authMiddleware, async (req, res) => {
    const { request_id, action } = req.body; // `action`: accept або reject
    const receiver_id = req.user.id;
  
    try {
      const friendship = await Friendship.findOne({
        where: { id: request_id, receiver_id, status: 'pending' },
      });
  
      if (!friendship) {
        return res.status(404).json({ error: 'Request not found' });
      }
  
      if (action === 'accept') {
        // Оновлення статусу на "accepted"
        friendship.status = 'accepted';
        await friendship.save();
  
        // Додаємо зустрічний запис дружби (двосторонній зв'язок)
        await Friendship.create({
          sender_id: receiver_id,
          receiver_id: friendship.sender_id,
          status: 'accepted',
        });
  
        res.status(200).json({ message: 'Friend request accepted' });
      } else if (action === 'reject') {
        // Відхиляємо запит
        friendship.status = 'rejected';
        await friendship.save();
  
        res.status(200).json({ message: 'Friend request rejected' });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  router.get('/friends', authMiddleware, async (req, res) => {
    const user_id = req.user.id;
  
    try {
      const friends = await Friendship.findAll({
        where: { sender_id: user_id, status: 'accepted' },
        include: [{ model: User, as: 'Receiver', attributes: ['id', 'name', 'email'] }],
      });
  
      res.status(200).json(friends);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.delete('/friends/remove', authMiddleware, async (req, res) => {
    const { friend_id } = req.body; // ID друга, якого видаляємо
    const user_id = req.user.id;
  
    try {
      // Знаходимо запис дружби
      const friendship = await Friendship.findOne({
        where: { sender_id: user_id, receiver_id: friend_id, status: 'accepted' },
      });
  
      if (!friendship) {
        return res.status(404).json({ error: 'Friendship not found' });
      }
  
      // Видаляємо обидва зв’язки
      await Friendship.destroy({
        where: { sender_id: user_id, receiver_id: friend_id, status: 'accepted' },
      });
  
      await Friendship.destroy({
        where: { sender_id: friend_id, receiver_id: user_id, status: 'accepted' },
      });
  
      res.status(200).json({ message: 'Friend removed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });


  module.exports = router;
