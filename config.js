const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
require('winston-daily-rotate-file');

var settings = {
  individualsScoreData: [],
  appName: "scoring",
  environment: "development", // valid options: "development" | "production"
  port: 3000,
  maxPageSize: 50,
  filePath: "resources/ResultadoScoringIndividuos.csv",
  log: {
    level: "debug",
    path: "./logs",
    maxSize: "20m",
    maxFiles: "2d",
    filename: "scoring-%DATE%.log",
    datePattern: "YYYY-MM-DD-HH",
    zippedArchive: false,
    printPrivateData: false
  },
  db: {
    production: "",
    development: "",
    test: ""
  }
};

const ignorePrivate = format((info, opts) => {
  if (info.private) { return settings.printPrivateData }
  return info;
});

var myTransports = [];

var fileTransport = new transports.DailyRotateFile({
  filename: settings.log.path.concat("/").concat(settings.log.filename),
  level: settings.log.level,
  zippedArchive: settings.log.zippedArchive,
  maxSize: settings.log.maxSize,
  maxFiles: settings.log.maxFiles
});

myTransports.push(fileTransport);

if (settings.environment != "production")
  myTransports.push(new transports.Console());

const logger = createLogger({
  level: settings.log.level,
  format: format.combine(
    ignorePrivate(),
    timestamp(),
    prettyPrint()
  ),
  defaultMeta: { service: 'user-service' },
  transports: myTransports
});

module.exports = { settings, logger };
