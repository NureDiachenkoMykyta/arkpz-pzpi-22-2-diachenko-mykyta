const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../../middlewares/authMiddleware');
const Task = require('../../models/task');
const TimeEntry = require('../../models/timeEntry'); 
const router = express.Router();

// Роут для створення Time Entry
router.post(
    '/create',
    [
      authMiddleware, // Перевірка авторизації
      body('task_id').isUUID().withMessage('Task ID must be a valid UUID'),
      body('start_time').isISO8601().withMessage('Start time must be a valid ISO8601 date'),
      body('end_time')
        .optional()
        .isISO8601()
        .withMessage('End time must be a valid ISO8601 date'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { task_id, start_time, end_time } = req.body;
  
      try {
        // Знаходимо завдання за ID
        const task = await Task.findByPk(task_id);
  
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }
  
        // Перевіряємо, чи користувач є автором або виконавцем завдання
        if (task.assignee_id !== req.user.id && task.user_id !== req.user.id) {
          return res.status(403).json({ error: 'You are not authorized for this task.' });
        }
  
        // Перевірка: якщо `end_time` передається, воно має бути після `start_time`
        if (end_time && new Date(end_time) <= new Date(start_time)) {
          return res
            .status(400)
            .json({ error: '`end_time` must be greater than `start_time`.' });
        }
  
        // Створюємо новий запис у Time Entries
        const timeEntry = await TimeEntry.create({
          task_id,
          start_time,
          end_time,
        });
  
        res.status(201).json({
          message: 'Time entry created successfully',
          timeEntry,
        });
      } catch (error) {
        console.error('Error creating time entry:', error);
        res.status(500).json({ error: 'Server error' });
      }
    }
  );
  
router.get(
  '/task/:task_id/total-time',
  [
    authMiddleware,
    param('task_id').isUUID().withMessage('Task ID must be a valid UUID'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { task_id } = req.params;

    try {
      const task = await Task.findByPk(task_id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (task.user_id !== req.user.id && task.assignee_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You are not authorized for this task.' });
      }

      const timeEntries = await TimeEntry.findAll({
        where: { task_id },
      });

      const totalTime = timeEntries.reduce((sum, entry) => {
        if (entry.start_time && entry.end_time) {
          const duration = (new Date(entry.end_time) - new Date(entry.start_time)) / 1000; // В секундах
          return sum + duration;
        }
        return sum;
      }, 0);

      res.status(200).json({
        message: 'Total time calculated successfully',
        total_time_seconds: totalTime,
      });
    } catch (error) {
      console.error('Error calculating total time:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);
  router.get(
    '/:id',
    [
      authMiddleware, 
      param('id').isUUID().withMessage('Time Entry ID must be a valid UUID'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { id } = req.params;
  
      try {
        // Знаходимо Time Entry за ID
        const timeEntry = await TimeEntry.findOne({
          where: { id },
          include: {
            model: Task,
            as: 'Task', // Підтягнути дані про завдання
            attributes: ['id', 'title', 'assignee_id', 'user_id'],
          },
        });
  
        if (!timeEntry) {
          return res.status(404).json({ error: 'Time Entry not found' });
        }
  
        // Перевіряємо, чи користувач є автором або виконавцем завдання
        if (timeEntry.Task.assignee_id !== req.user.id && timeEntry.Task.user_id !== req.user.id) {
          return res.status(403).json({ error: 'Access denied. You are not authorized for this task.' });
        }
  
        res.status(200).json({
          message: 'Time Entry retrieved successfully',
          timeEntry,
        });
      } catch (error) {
        console.error('Error retrieving Time Entry:', error);
        res.status(500).json({ error: 'Server error' });
      }
    }
  );
  
  
  router.put(
    '/edit/:id',
    [
      authMiddleware, 
      param('id').isUUID().withMessage('Time Entry ID must be a valid UUID'),
      body('start_time').optional().isISO8601().withMessage('Start time must be a valid ISO8601 date'),
      body('end_time').optional().isISO8601().withMessage('End time must be a valid ISO8601 date'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { id } = req.params;
      const { start_time, end_time } = req.body;
  
      try {
        const timeEntry = await TimeEntry.findOne({
          where: { id },
          include: {
            model: Task,
            as: 'Task',
            attributes: ['id', 'title', 'assignee_id', 'user_id'],
          },
        });
  
        if (!timeEntry) {
          return res.status(404).json({ error: 'Time Entry not found' });
        }
  
        if (timeEntry.Task.assignee_id !== req.user.id && timeEntry.Task.user_id !== req.user.id) {
          return res.status(403).json({ error: 'Access denied. You are not authorized for this task.' });
        }
  
        const currentStartTime = start_time || timeEntry.start_time;
        const currentEndTime = end_time || timeEntry.end_time;
  
        if (currentEndTime && new Date(currentEndTime) <= new Date(currentStartTime)) {
          return res.status(400).json({ error: '`end_time` must be greater than `start_time`.' });
        }
  
        await timeEntry.update({ start_time, end_time });
  
        res.status(200).json({
          message: 'Time Entry updated successfully',
          timeEntry,
        });
      } catch (error) {
        console.error('Error updating Time Entry:', error);
        res.status(500).json({ error: 'Server error' });
      }
    }
  );
  
  

  router.delete(
    '/delete/:id',
    [
      authMiddleware, 
      param('id').isUUID().withMessage('Time Entry ID must be a valid UUID'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { id } = req.params;
  
      try {
        const timeEntry = await TimeEntry.findOne({
          where: { id },
          include: {
            model: Task,
            as: 'Task',
            attributes: ['id', 'title', 'assignee_id', 'user_id'],
          },
        });
  
        if (!timeEntry) {
          return res.status(404).json({ error: 'Time Entry not found' });
        }
  
        if (timeEntry.Task.assignee_id !== req.user.id && timeEntry.Task.user_id !== req.user.id) {
          return res.status(403).json({ error: 'Access denied. You are not authorized for this task.' });
        }
  
        await timeEntry.destroy();
  
        res.status(200).json({ message: 'Time Entry deleted successfully' });
      } catch (error) {
        console.error('Error deleting Time Entry:', error);
        res.status(500).json({ error: 'Server error' });
      }
    }
  );

  router.get(
    '/task/:task_id',
    [
      authMiddleware, // Middleware для перевірки авторизації
      param('task_id').isUUID().withMessage('Task ID must be a valid UUID'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { task_id } = req.params;
  
      try {
        // Знаходимо завдання за task_id
        const task = await Task.findOne({
          where: { id: task_id },
          attributes: ['id', 'title', 'user_id', 'assignee_id'], // Витягуємо лише необхідні дані
        });
  
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }
  
        // Перевіряємо, чи користувач є автором або виконавцем завдання
        if (task.user_id !== req.user.id && task.assignee_id !== req.user.id) {
          return res
            .status(403)
            .json({ error: 'Access denied. You are not authorized for this task.' });
        }
  
        // Знаходимо всі TimeEntry, які належать до завдання
        const timeEntries = await TimeEntry.findAll({
          where: { task_id },
          attributes: ['id', 'start_time', 'end_time'], // Витягуємо лише необхідні поля
          order: [['start_time', 'ASC']], // Сортуємо за часом початку
        });
  
        res.status(200).json({
          message: 'Time entries retrieved successfully',
          task: {
            id: task.id,
            title: task.title,
          },
          timeEntries,
        });
      } catch (error) {
        console.error('Error retrieving time entries:', error);
        res.status(500).json({ error: 'Server error' });
      }
    }
  );

module.exports = router;
