const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../../middlewares/authMiddleware');
const Task = require('../../models/task');
const router = express.Router();
const { Op } = require('sequelize');

// Создание задачи
router.post(
  '/create',
  [
    authMiddleware,
    body('title').notEmpty().withMessage('Title is required').isLength({ min: 3 }).withMessage('Title must be at least 3 characters long'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('priority')
      .notEmpty().withMessage('Priority is required')
      .isIn(['Low', 'Medium', 'High'])
      .withMessage('Priority must be one of the following: Low, Medium, High'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['Pending', 'In Progress', 'Completed'])
      .withMessage('Status must be one of the following: Pending, In Progress, Completed'),
    body('due_date').notEmpty().withMessage('Due date is required').isISO8601().withMessage('Due date must be a valid ISO8601 date'),
    body('assignee_id').optional().isUUID().withMessage('Assignee ID must be a valid UUID'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, status, due_date, assignee_id } = req.body;

    try {
      const task = await Task.create({
        title,
        description,
        priority,
        status,
        due_date,
        user_id: req.user.id,
        assignee_id: assignee_id || req.user.id, // Если assignee_id не указан, он будет равен user_id
      });

      res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Получение всех задач пользователя
router.get(
  '/my-tasks',
  [authMiddleware], // Только авторизация
  async (req, res) => {
    try {
      const tasks = await Task.findAll({
        where: {
          [Op.or]: [{ user_id: req.user.id }, { assignee_id: req.user.id }],
        },
        order: [['due_date', 'ASC']], // Сортировка по дате выполнения
      });

      res.status(200).json({ tasks });
    } catch (error) {
      console.error('Error retrieving tasks:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Получение задачи по ID
router.get(
  '/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Task ID must be a valid UUID'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    try {
      const task = await Task.findByPk(id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (task.user_id !== req.user.id && task.assignee_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You are not authorized to view this task.' });
      }

      res.status(200).json({ task });
    } catch (error) {
      console.error('Error retrieving task:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);




// Обновление задачи
router.put(
  '/edit/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Task ID must be a valid UUID'),
    body('title').optional().isLength({ min: 3 }).withMessage('Title must be at least 3 characters long'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High'])
      .withMessage('Priority must be one of the following: Low, Medium, High'),
    body('status')
      .optional()
      .isIn(['Pending', 'In Progress', 'Completed'])
      .withMessage('Status must be one of the following: Pending, In Progress, Completed'),
    body('due_date').optional().isISO8601().withMessage('Due date must be a valid ISO8601 date'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    try {
      const task = await Task.findByPk(id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (task.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only update your own tasks.' });
      }

      await task.update(updates);

      res.status(200).json({ message: 'Task updated successfully', task });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Удаление задачи
router.delete(
  '/delete/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Task ID must be a valid UUID'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    try {
      const task = await Task.findByPk(id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (task.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only delete your own tasks.' });
      }

      await task.destroy();

      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
