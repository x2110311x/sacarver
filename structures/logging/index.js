let instance = null;

const winston = require('winston');
require('winston-daily-rotate-file');
//const LokiTransport = require("winston-loki");
const { combine, timestamp, json, errors, cli } = winston.format;

//const config = require("../../config.json");

const combinedFileRotate = new winston.transports.DailyRotateFile({
  filename: './logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  format: combine(errors({ stack: true }), timestamp(), json())
});

const errorFileRotate = new winston.transports.DailyRotateFile({
  filename: './logs/error-%DATE%.log',
  level: 'error',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  format: combine(errors({ stack: true }), timestamp(), json())
});

const consoleLogs = new winston.transports.Console({
    format: combine(timestamp(), cli()),
    level: "debug"
});

/*const lokiTransport = new LokiTransport({
    host: config.logging.host,
    basicAuth: config.logging.basicAuth,
    useWinstonMetaAsLabels: true,
    json: true,
    level: "debug",
    format: json(),
    replaceTimestamp: true,
    onConnectionError: (err) => console.error(err)
});*/

const standardTransports = [
  combinedFileRotate,
  errorFileRotate,
//  lokiTransport,
  consoleLogs
];


class SacarverLogger {
    constructor() {
        const logger = winston.createLogger({
          exitOnError: false,
          defaultMeta: { service_name: 'Sacarver-bot' },
          transports: standardTransports,
          exceptionHandlers: standardTransports,
          rejectionHandlers: standardTransports
        });

        this.logger = logger;
    }
    
    static getInstance() {
      if(!instance) {
          instance = new SacarverLogger();
      }
      return instance;
    }
}
module.exports = SacarverLogger;