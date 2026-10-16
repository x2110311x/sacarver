let instance = null;

const { Sequelize } = require('sequelize');
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
        this.db.Honeypot.sync().catch(err => {
            log.error({message: "Failed to sync Honeypot table", error: err});
        });
        this.db.ScamImageHashes.sync().catch(err => {
            log.error({message: "Failed to sync ScamImageHashes table", error: err});
        });
        this.db.Notes.sequelize.query(`
            ALTER TABLE \`Notes\`
              ADD COLUMN IF NOT EXISTS \`EditedBy\` bigint NULL,
              ADD COLUMN IF NOT EXISTS \`EditedDate\` bigint NULL;
        `).catch(err => {
            log.warn({message: "Could not alter Notes table", error: err});
        });
        this.db.Notes.sync({ alter: true }).catch(err => {
            log.error({message: "Failed to sync Notes table", error: err});
        });
        this.db.Notes.sequelize.query(`
            CREATE TABLE IF NOT EXISTS \`NoteVersions\` (
              \`ID\` integer PRIMARY KEY AUTO_INCREMENT,
              \`NoteID\` integer NOT NULL,
              \`Version\` integer NOT NULL,
              \`Note\` text NOT NULL,
              \`Severity\` varchar(8) NOT NULL,
              \`Link\` text,
              \`Editor\` bigint NOT NULL,
              \`Date\` bigint NOT NULL,
              INDEX \`note_version_idx\` (\`NoteID\`, \`Version\`),
              FOREIGN KEY (\`NoteID\`) REFERENCES \`Notes\` (\`ID\`) ON DELETE CASCADE
            );
        `).catch(err => {
            log.warn({message: "Could not sync NoteVersions table", error: err});
        });
        this.db.NoteVersions.sync().catch(err => {
            log.error({message: "Failed to sync NoteVersions table", error: err});
        });
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