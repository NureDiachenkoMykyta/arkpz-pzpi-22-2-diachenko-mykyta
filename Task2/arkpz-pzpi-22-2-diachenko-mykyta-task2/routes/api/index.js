const authRoute = require('./AuthRoute.js'); 
const taskRoute = require('./taskRoute.js');
const timeEntryRoute = require('./TimeEntryRoute.js');
const reportRoute = require('./reportRoute.js');
const friendshipRoute = require('./frienshipRoute.js');




module.exports = (app) => {
  // Підключення роутів до основного додатка
  app.use('/api/auth', authRoute); // Роут для авторизації
  app.use('/api/tasks', taskRoute);
  app.use('/api/time-entries', timeEntryRoute);
  app.use('/api/reports', reportRoute);
  app.use('/api/', friendshipRoute);

};
