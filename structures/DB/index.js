let instance = null;

const { Sequelize } = require('sequelize');
const fs = require('fs');
const initModels = require("./models/init-models");
const config = require('../../config.json');
const logging = require('../logging');

var log = logging.getInstance().logger;

class SacarverDB {
    constructor() {
        log.debug("Building DB connection");
        const sequelize = new Sequelize(config.db.DBName, config.db.user, config.db.pass, {
            host: config.db.host,
            port: config.db.port,
            dialect: 'mysql'
        });
        log.debug("Connected to DB");
        log.debug("Initializing DB Object Models");
        this.db = initModels(sequelize);
        log.debug("DB Object Models Initialized");

        /*log.debug("Loading DB helpers");
        this.helpers={};
        const helperFiles = fs.readdirSync('./helpers').filter(file => file.endsWith('.js'));
        for (const file of helperFiles) {
            try{
                log.debug(`Loading DB helper: ${file}`);
                const helper = require(`./helpers/${file}`);
                this.helpers.push({
                    key: helper.name,
                    value: helper.execute
                });
            } catch (e) {
                log.warn({message: `Could not load /${file}`, error:e});
            }
        */
    }
    
    static getInstance() {
        if(!instance) {
            instance = new SacarverDB();
        }
        return instance;
    }
}

module.exports = SacarverDB;