const express = require('express');
const config = require('./config');
const serializer = require('./scoring_modules/serializer');
const debtors = require('./scoring_modules/debtors');

let server;
const app = express();

app.use(debtors);

serializer.setupDataSources(config.settings.data, function() {
  server = app.listen(config.settings.port, function() { 
    config.logger.info(`Scoring model API listening on port ${config.settings.port}!`); 
    app.emit("appStarted")
  })
});

app.on('shutdown', function() {
  if(server)
    server.close();
  process.exit(0)
});

process.on('SIGINT', function() {
  config.logger.debug("Caught interrupt signal");
  app.emit('shutdown')
});

process.env.NODE_ENV = config.settings.environment;
module.exports = { app };
