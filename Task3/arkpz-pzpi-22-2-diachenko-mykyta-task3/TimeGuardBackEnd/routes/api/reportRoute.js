// src/routes/api/reportRoute.js

const express = require('express');
const { query, validationResult } = require('express-validator');
const authMiddleware = require('../../middlewares/authMiddleware');
const Task = require('../../models/task');
const TimeEntry = require('../../models/timeEntry');
const User = require('../../models/user');
const { Op } = require('sequelize');
const sequelize = require('../../config/DBconfig');

const router = express.Router();


const ALLOWED_REPORT_TYPES = [
  'time_summary',
  'task_status',
  'completed_tasks',
  'weekly_statistics',      
  'monthly_statistics',     
];


const validateReportType = [
  query('reportType')
    .exists().withMessage('reportType is required')
    .isIn(ALLOWED_REPORT_TYPES).withMessage(`Invalid report type. Allowed: ${ALLOWED_REPORT_TYPES.join(', ')}`),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date'),
];

router.get(
  '/generate',
  [
    authMiddleware,
    ...validateReportType,
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reportType, start_date, end_date } = req.query;
    const userId = req.user.id;

    try {
      let reportData = [];

      switch (reportType) {
        // 1. Time Summary
        case 'time_summary':
          reportData = await generateTimeSummaryReport(userId, start_date, end_date);
          break;

        // 2. Task Status
        case 'task_status':
          reportData = await generateTaskStatusReport(userId);
          break;

        // 3. Completed Tasks
        case 'completed_tasks':
          reportData = await generateCompletedTasksReport(userId, start_date, end_date);
          break;

        // 4. Weekly Statistics
        case 'weekly_statistics':
          reportData = await generateWeeklyStatisticsReport(userId);
          break;

        // 5. Monthly Statistics
        case 'monthly_statistics':
          reportData = await generateMonthlyStatisticsReport(userId);
          break;

        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }

      res.status(200).json({
        message: 'Report generated successfully',
        report: reportData,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// Функції генерації репортів

// 1. Time Summary
const generateTimeSummaryReport = async (userId, startDate, endDate) => {
  const dateFilter = {};
  if (startDate) dateFilter.start_time = { [Op.gte]: new Date(startDate) };
  if (endDate) dateFilter.end_time = { [Op.lte]: new Date(endDate) };

  const tasks = await Task.findAll({
    where: {
      [Op.or]: [
        { user_id: userId },
        { assignee_id: userId },
      ],
    },
    attributes: ['id', 'title'],
    include: [
      {
        model: TimeEntry,
        as: 'TimeEntries',
        attributes: ['start_time', 'end_time'],
        where: dateFilter,
        required: false,
      },
    ],
  });

  const timeSummary = tasks.map((task) => {
    const totalTime = task.TimeEntries.reduce((sum, entry) => {
      if (entry.start_time && entry.end_time) {
        const duration =
          (new Date(entry.end_time) - new Date(entry.start_time)) / 3600000;
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

  return timeSummary;
};

// 2. Task Status
const generateTaskStatusReport = async (userId) => {
  const report = await Task.findAll({
    where: {
      [Op.or]: [
        { user_id: userId },
        { assignee_id: userId },
      ],
    },
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['status'],
  });

  return report;
};

// 3. Completed Tasks
const generateCompletedTasksReport = async (userId, startDate, endDate) => {
  const dateFilter = {};
  if (startDate) dateFilter.start_time = { [Op.gte]: new Date(startDate) };
  if (endDate) dateFilter.end_time = { [Op.lte]: new Date(endDate) };

  const tasks = await Task.findAll({
    where: {
      status: 'Completed',
      [Op.or]: [
        { user_id: userId },
        { assignee_id: userId },
      ],
    },
    attributes: ['id', 'title'],
    include: [
      {
        model: TimeEntry,
        as: 'TimeEntries',
        attributes: ['start_time', 'end_time'],
        where: dateFilter,
        required: false,
      },
    ],
  });

  const completedTasks = tasks.map((task) => {
    const totalTime = task.TimeEntries.reduce((sum, entry) => {
      if (entry.start_time && entry.end_time) {
        const duration =
          (new Date(entry.end_time) - new Date(entry.start_time)) / 3600000;
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

  return completedTasks;
};

// 4. Weekly Statistics
const generateWeeklyStatisticsReport = async (userId) => {
  const report = await sequelize.query(
    `
      SELECT 
        DATE_TRUNC('week', t."createdAt") AS week,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
        COALESCE(SUM(EXTRACT(EPOCH FROM (te.end_time - te.start_time))/3600), 0) AS total_hours
      FROM "Tasks" t
      LEFT JOIN "TimeEntries" te ON te.task_id = t.id
      WHERE t.user_id = :userId OR t.assignee_id = :userId
      GROUP BY week
      ORDER BY week DESC
      LIMIT 4;
    `,
    {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT,
    }
  );


  const formattedReport = report.map(entry => ({
    week: entry.week, 
    total_hours: parseFloat(entry.total_hours).toFixed(2),
    tasks_completed: parseInt(entry.completed_tasks, 10),
  }));

  return formattedReport;
};

// 5. Monthly Statistics
const generateMonthlyStatisticsReport = async (userId) => {
  const report = await sequelize.query(
    `
      SELECT 
        DATE_TRUNC('month', t."createdAt") AS month,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
        COALESCE(SUM(EXTRACT(EPOCH FROM (te.end_time - te.start_time))/3600), 0) AS total_hours
      FROM "Tasks" t
      LEFT JOIN "TimeEntries" te ON te.task_id = t.id
      WHERE t.user_id = :userId OR t.assignee_id = :userId
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12;
    `,
    {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT,
    }
  );


  const formattedReport = report.map(entry => ({
    month: entry.month, 
    total_hours: parseFloat(entry.total_hours).toFixed(2),
    tasks_completed: parseInt(entry.completed_tasks, 10),
  }));

  return formattedReport;
};


router.get('/generate/task-progress', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  try {
    const tasks = await Task.findAll({
      where: {
        [Op.or]: [
          { user_id },
          { assignee_id: user_id },
        ],
      },
      attributes: ['id', 'title', 'status'],
    });

    const progressOverview = tasks.map(task => ({
      task_id: task.id,
      task_title: task.title,
      status: task.status,
      progress_percentage:
        task.status === 'Completed'
          ? 100
          : task.status === 'In Progress'
          ? 50
          : 0,
    }));

    res.status(200).json({
      message: 'Task progress overview generated successfully',
      report: progressOverview,
    });
  } catch (error) {
    console.error('Error fetching task progress:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 3) GET /api/reports/generate/time-entries-calendar
 */
router.get('/generate/time-entries-calendar', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  const { start_date, end_date } = req.query;

  try {

    const tasks = await Task.findAll({
      where: {
        [Op.or]: [
          { user_id },
          { assignee_id: user_id },
        ],
      },
      attributes: ['id', 'title'],
    });

    const taskIds = tasks.map(task => task.id);


    const whereClause = {
      task_id: { [Op.in]: taskIds },
    };
    if (start_date) {
      whereClause.start_time = { [Op.gte]: new Date(start_date) };
    }
    if (end_date) {
      whereClause.end_time = { [Op.lte]: new Date(end_date) };
    }

    const timeEntries = await TimeEntry.findAll({
      where: whereClause,
      include: [
        {
          model: Task,
          as: 'Task',
          attributes: ['id', 'title'],
        },
      ],
    });


    const calendarData = timeEntries.map(entry => ({
      title: entry.Task.title,
      start: entry.start_time,
      end: entry.end_time,
      task_id: entry.Task.id,
    }));

    res.status(200).json({
      message: 'Time entries for calendar fetched successfully',
      report: calendarData,
    });
  } catch (error) {
    console.error('Error fetching time entries for calendar:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 4) GET /api/reports/generate/achievements
 */
router.get('/generate/achievements', authMiddleware, async (req, res) => {
  const user_id = req.user.id;

  try {

    const completedTasksCount = await Task.count({
      where: {
        status: 'Completed',
        [Op.or]: [
          { user_id },
          { assignee_id: user_id },
        ],
      },
    });


    const timeEntries = await TimeEntry.findAll({
      where: {
        task_id: {
          [Op.in]: sequelize.literal(`(
            SELECT id FROM "Tasks" WHERE "Tasks"."user_id" = '${user_id}' OR "Tasks"."assignee_id" = '${user_id}'
          )`),
        },
      },
      attributes: ['start_time', 'end_time'],
    });

    const totalHours = timeEntries.reduce((sum, entry) => {
      if (entry.start_time && entry.end_time) {
        const duration =
          (new Date(entry.end_time) - new Date(entry.start_time)) / 3600000; // Часы
        return sum + duration;
      }
      return sum;
    }, 0);

    const achievements = [];

    if (completedTasksCount >= 10) {
      achievements.push({ id: 1, name: 'Task Master', description: 'Completed 10 tasks' });
    }
    if (completedTasksCount >= 20) {
      achievements.push({ id: 2, name: 'Task Guru', description: 'Completed 20 tasks' });
    }
    if (totalHours >= 100) {
      achievements.push({ id: 3, name: 'Time Tracker', description: 'Tracked 100 hours' });
    }
    if (totalHours >= 200) {
      achievements.push({ id: 4, name: 'Time Master', description: 'Tracked 200 hours' });
    }

    res.status(200).json({
      message: 'Achievements fetched successfully',
      achievements,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



router.get(
  '/generate/activity-feed',
  authMiddleware,
  async (req, res) => {
    const user_id = req.user.id;

    try {

      const activities = await sequelize.query(
        `
          SELECT 
            'Task Created' AS activity_type,
            t.title AS detail,
            t."createdAt" AS timestamp
          FROM "Tasks" t
          WHERE t.user_id = :userId OR t.assignee_id = :userId

          UNION ALL

          SELECT 
            'Time Entry Logged' AS activity_type,
            CONCAT(t.title, ' - ', EXTRACT(EPOCH FROM (te.end_time - te.start_time))/3600, ' hours') AS detail,
            te.start_time AS timestamp
          FROM "TimeEntries" te
          JOIN "Tasks" t ON te.task_id = t.id
          WHERE te.task_id IN (
            SELECT id FROM "Tasks" WHERE "Tasks"."user_id" = :userId OR "Tasks"."assignee_id" = :userId
          )

          UNION ALL

          SELECT 
            'Friend Request Sent' AS activity_type,
            CONCAT(u.name, ' (', u.email, ')') AS detail,
            f."createdAt" AS timestamp
          FROM "Friendships" f
          JOIN "Users" u ON f.receiver_id = u.id
          WHERE f.sender_id = :userId AND f.status = 'pending'

          UNION ALL

          SELECT 
            'Friend Request Accepted' AS activity_type,
            CONCAT(u.name, ' (', u.email, ')') AS detail,
            f."updatedAt" AS timestamp
          FROM "Friendships" f
          JOIN "Users" u ON f.sender_id = u.id
          WHERE f.receiver_id = :userId AND f.status = 'accepted'

          ORDER BY timestamp DESC
          LIMIT 20;
        `,
        {
          replacements: { userId: user_id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      res.status(200).json({
        message: 'Recent activities fetched successfully',
        activities,
      });
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * 6) GET /api/reports/generate/performance-metrics
 */
router.get('/generate/performance-metrics', authMiddleware, async (req, res) => {
  const user_id = req.user.id;

  try {

    const totalTasks = await Task.count({
      where: {
        [Op.or]: [
          { user_id },
          { assignee_id: user_id },
        ],
      },
    });


    const completedTasks = await Task.count({
      where: {
        status: 'Completed',
        [Op.or]: [
          { user_id },
          { assignee_id: user_id },
        ],
      },
    });


    const timeEntries = await TimeEntry.findAll({
      where: {
        task_id: {
          [Op.in]: sequelize.literal(`(
            SELECT id FROM "Tasks" WHERE "Tasks"."user_id" = '${user_id}' OR "Tasks"."assignee_id" = '${user_id}'
          )`),
        },

      },
      include: [
        {
          model: Task,
          as: 'Task',
          where: {
            status: 'Completed',
          },
          attributes: [],
        },
      ],
      attributes: ['start_time', 'end_time'],
    });

    const totalHours = timeEntries.reduce((sum, entry) => {
      if (entry.start_time && entry.end_time) {
        const duration =
          (new Date(entry.end_time) - new Date(entry.start_time)) / 3600000; // Часы
        return sum + duration;
      }
      return sum;
    }, 0);

    const averageTime = completedTasks > 0 ? (totalHours / completedTasks).toFixed(2) : 0;

    res.status(200).json({
      message: 'Performance metrics fetched successfully',
      metrics: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        average_time_hours: averageTime,
      },
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * 7) GET /api/reports/generate/upcoming-deadlines
 */
router.get('/generate/upcoming-deadlines', 
  [
    authMiddleware,
    query('days')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Days must be a positive integer'),
  ],
  async (req, res) => {
    const user_id = req.user.id;
    const days = req.query.days ? parseInt(req.query.days) : 7;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const upcomingTasks = await Task.findAll({
        where: {
          [Op.or]: [
            { user_id },
            { assignee_id: user_id },
          ],
          status: { [Op.ne]: 'Completed' },
          due_date: {
            [Op.lte]: sequelize.literal(`CURRENT_DATE + INTERVAL '${days} days'`),
            [Op.gte]: sequelize.literal(`CURRENT_DATE`),
          },
        },
        attributes: ['id', 'title', 'due_date', 'status'],
        order: [['due_date', 'ASC']],
      });

      res.status(200).json({
        message: 'Upcoming deadlines fetched successfully',
        tasks: upcomingTasks,
      });
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      res.status(500).json({ error: 'Server error' });
    }
});

/**
 * 8) GET /api/reports/generate/task-distribution
 */
router.get('/generate/task-distribution', authMiddleware, async (req, res) => {
  const user_id = req.user.id;

  try {
    const taskDistribution = await Task.findAll({
      where: {
        [Op.or]: [
          { user_id },
          { assignee_id: user_id },
        ],
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });

    res.status(200).json({
      message: 'Task distribution report generated successfully',
      report: taskDistribution,
    });
  } catch (error) {
    console.error('Error fetching task distribution:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
