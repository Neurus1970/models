module.exports = {
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