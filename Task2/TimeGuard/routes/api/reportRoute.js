const express = require('express');
const { body, query, validationResult } = require('express-validator');
const authMiddleware = require('../../middlewares/authMiddleware');
const Task = require('../../models/task');
const TimeEntry = require('../../models/timeEntry');
const User = require('../../models/user');
const { Op } = require('sequelize');
const sequelize = require('../../config/DBconfig'); // Імпортуйте Sequelize instance

const router = express.Router();

// Роут для створення репорту
router.get(
  '/generate',
  [
    authMiddleware, // Перевірка авторизації
    query('reportType')
      .isIn(['time_summary', 'task_status', 'completed_tasks'])
      .withMessage('Invalid report type. Allowed: time_summary, task_status, completed_tasks'),
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO8601 date'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO8601 date'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reportType, start_date, end_date } = req.query;

    try {
      // Загальні фільтри для дат
      const dateFilter = {};
      if (start_date) dateFilter.start_time = { [Op.gte]: new Date(start_date) };
      if (end_date) dateFilter.end_time = { [Op.lte]: new Date(end_date) };

      let reportData;

      switch (reportType) {
        /**
         * Report 1: Time Summary
         */
        case 'time_summary':
          reportData = await Task.findAll({
            where: {
              [Op.or]: [{ user_id: req.user.id }, { assignee_id: req.user.id }],
            },
            attributes: ['id', 'title'],
            include: [
              {
                model: TimeEntry,
                as: 'TimeEntries',
                attributes: ['start_time', 'end_time'],
                where: dateFilter,
              },
            ],
          });

          const timeSummary = reportData.map((task) => {
            const totalTime = task.TimeEntries.reduce((sum, entry) => {
              if (entry.start_time && entry.end_time) {
                const duration =
                  (new Date(entry.end_time) - new Date(entry.start_time)) / 3600000; // Години
                return sum + duration;
              }
              return sum;
            }, 0);

            return {
              task_id: task.id,
              task_title: task.title,
              total_time_hours: totalTime.toFixed(2),
            };
          });

          return res.status(200).json({
            message: 'Time summary report generated successfully',
            report: timeSummary,
          });

        /**
         * Report 2: Task Status Report
         */
        case 'task_status':
          reportData = await Task.findAll({
            where: {
              [Op.or]: [{ user_id: req.user.id }, { assignee_id: req.user.id }],
            },
            attributes: [
              'status',
              [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: ['status'],
          });

          return res.status(200).json({
            message: 'Task status report generated successfully',
            report: reportData,
          });

        /**
         * Report 3: Completed Tasks
         */
        case 'completed_tasks':
          reportData = await Task.findAll({
            where: {
              status: 'Completed',
              [Op.or]: [{ user_id: req.user.id }, { assignee_id: req.user.id }],
            },
            attributes: ['id', 'title'],
            include: [
              {
                model: TimeEntry,
                as: 'TimeEntries',
                attributes: ['start_time', 'end_time'],
              },
            ],
          });

          const completedTasks = reportData.map((task) => {
            const totalTime = task.TimeEntries.reduce((sum, entry) => {
              if (entry.start_time && entry.end_time) {
                const duration =
                  (new Date(entry.end_time) - new Date(entry.start_time)) / 3600000; // Години
                return sum + duration;
              }
              return sum;
            }, 0);

            return {
              task_id: task.id,
              task_title: task.title,
              total_time_hours: totalTime.toFixed(2),
            };
          });

          return res.status(200).json({
            message: 'Completed tasks report generated successfully',
            report: completedTasks,
          });

        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
