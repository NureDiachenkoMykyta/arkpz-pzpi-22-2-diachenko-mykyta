const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../../middlewares/authMiddleware');
const Task = require('../../models/task');
const router = express.Router();
const { Op } = require('sequelize');
const TimeEntry = require('../../models/timeEntry');


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
    body('assignee_id').optional().custom((value, { req }) => {
      if (value === null) {
        req.body.assignee_id = req.user.id; 
        return true;
      }
      if (value && !/^[0-9a-fA-F-]{36}$/.test(value)) {
        throw new Error('Assignee ID must be a valid UUID');
      }
      return true;
    }),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
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
        assignee_id: assignee_id || req.user.id, 
      });

      res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);
router.get(
  '/:task_id/total-time',
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
  '/my-tasks',
  [authMiddleware], 
  async (req, res) => {
    try {
      const tasks = await Task.findAll({
        where: {
          [Op.or]: [{ user_id: req.user.id }, { assignee_id: req.user.id }],
        },
        order: [['due_date', 'ASC']], 
      });

      res.status(200).json({ tasks });
    } catch (error) {
      console.error('Error retrieving tasks:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

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

router.post(
  '/start',
  [
    authMiddleware,
    body('task_id').isUUID().withMessage('Task ID must be a valid UUID'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { task_id } = req.body;


      const task = await Task.findByPk(task_id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }


      if (task.assignee_id !== req.user.id && task.user_id !== req.user.id) {
        return res
          .status(403)
          .json({ error: 'You are not authorized for this task.' });
      }


      const activeEntry = await TimeEntry.findOne({
        where: {
          task_id,
          end_time: null,
        },
      });
      if (activeEntry) {
        return res
          .status(400)
          .json({ error: 'There is already an active time entry for this task.' });
      }


      const timeEntry = await TimeEntry.create({
        task_id,
        start_time: new Date(),
        end_time: null,
      });

      return res.status(201).json({
        message: 'Timer started successfully',
        timeEntry,
      });
    } catch (error) {
      console.error('Error starting time entry:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/stop',
  [
    authMiddleware,
    body('task_id').isUUID().withMessage('Task ID must be a valid UUID'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { task_id } = req.body;


      const task = await Task.findByPk(task_id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (task.assignee_id !== req.user.id && task.user_id !== req.user.id) {
        return res
          .status(403)
          .json({ error: 'You are not authorized for this task.' });
      }

   
      const activeEntry = await TimeEntry.findOne({
        where: {
          task_id,
          end_time: null,
        },
        order: [['start_time', 'DESC']],
      });

      if (!activeEntry) {
        return res
          .status(400)
          .json({ error: 'There is no active time entry for this task.' });
      }

      await activeEntry.update({
        end_time: new Date(),
      });

      return res.status(200).json({
        message: 'Timer stopped successfully',
        timeEntry: activeEntry,
      });
    } catch (error) {
      console.error('Error stopping time entry:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
