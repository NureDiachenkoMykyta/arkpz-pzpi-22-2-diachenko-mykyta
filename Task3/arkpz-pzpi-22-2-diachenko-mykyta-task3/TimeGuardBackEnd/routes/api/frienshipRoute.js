const express = require('express');
const authMiddleware = require('../../middlewares/authMiddleware'); // Мідлвар авторизації
const User = require('../../models/user');
const Friendship = require('../../models/friendship.js');
const { Op } = require('sequelize');

const router = express.Router();

// Відправка запиту на дружбу
router.post('/friends/request', authMiddleware, async (req, res) => {
  const { email } = req.body;
  const sender_id = req.user.id;

  try {
    // Знаходимо отримувача
    const receiver = await User.findOne({ where: { email } });
    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Не можна відправити запит самому собі
    if (receiver.id === sender_id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Шукаємо існуючий запис - запит або дружбу - в будь-якому напрямку
    const existingRequest = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id, receiver_id: receiver.id },
          { sender_id: receiver.id, receiver_id: sender_id },
        ],
        // Якщо потрібно блокувати, коли статус — будь-який з ["pending","accepted"]
        status: ['pending', 'accepted', 'rejected']
      },
    });

    if (existingRequest) {
  
      if(existingRequest.status !== 'rejected'){
        return res.status(400).json({
          error: 'Request already exists or you are already friends',
        });
      }
      return res.status(400).json({
        error: 'Request was rejected',
      });
    }

    // Якщо нічого не знайдено — можна відправити запит
    await Friendship.create({
      sender_id,
      receiver_id: receiver.id,
      status: 'pending',
    });

    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Помилка під час відправлення запиту на дружбу:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Отримання запитів на дружбу
router.get('/friends/requests', authMiddleware, async (req, res) => {
  const receiver_id = req.user.id;
  try {
    // Шукаємо всі "pending" запити, де поточний користувач — отримувач
    const requests = await Friendship.findAll({
      where: { receiver_id, status: 'pending' },
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Помилка під час отримання запитів на дружбу:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Відповідь на запит дружби
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
      // Оновлення статусу на accepted
      friendship.status = 'accepted';
      await friendship.save();
      return res.status(200).json({ message: 'Friend request accepted' });
    } else if (action === 'reject') {
      // Відхиляємо
      friendship.status = 'rejected';
      await friendship.save();
      return res.status(200).json({ message: 'Friend request rejected' });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Отримання списку друзів
router.get('/friends', authMiddleware, async (req, res) => {
  const user_id = req.user.id;

  try {
    // Шукаємо всі accepted дружби, де користувач є sender або receiver
    const friendshipRecords = await Friendship.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { sender_id: user_id },
          { receiver_id: user_id },
        ],
      },
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'Receiver', attributes: ['id', 'name', 'email'] },
      ],
    });

    // Перетворюємо записи у список друзів
    const friendsList = friendshipRecords.map((record) => {
      if (record.sender_id === user_id) {
        return record.Receiver; // Друг — це Receiver
      } else {
        return record.Sender; // Друг — це Sender
      }
    });

    res.status(200).json(friendsList);
  } catch (error) {
    console.error('Помилка під час отримання списку друзів:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Видалення друга
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
    console.error('Помилка під час видалення друга:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Отримання списку надісланих запитів на дружбу
router.get('/friends/sent-requests', authMiddleware, async (req, res) => {
  const sender_id = req.user.id;
  try {
    const sentRequests = await Friendship.findAll({
      where: { sender_id, status: { [Op.in]: ['pending', 'rejected'] } },
      include: [
        {
          model: User,
          as: 'Receiver',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.status(200).json(sentRequests);
  } catch (error) {
    console.error('Помилка під час отримання списку надісланих запитів на дружбу:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Скасування надісланого запиту на дружбу
router.delete('/friends/cancel-request/:id', authMiddleware, async (req, res) => {
  const request_id = req.params.id;
  const sender_id = req.user.id;

  try {
    const friendship = await Friendship.findOne({
      where: { id: request_id, sender_id, status: 'pending' },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found or already responded to' });
    }

    friendship.status = 'rejected';
    await friendship.save();

    res.status(200).json({ message: 'Friend request canceled successfully' });
  } catch (error) {
    console.error('Помилка під час скасування запиту на дружбу:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
