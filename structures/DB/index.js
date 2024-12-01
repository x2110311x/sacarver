let instance = null;
const { Sequelize } = require('sequelize');
const initModels = require("./models/init-models");
const config = require('../../config.json');
class SacarverDB {
    constructor() {
        const sequelize = new Sequelize(config.db.DBName, config.db.user, config.db.pass, {
            host: config.db.host,
            port: config.db.port,
            dialect: 'mysql'
        });
        initModels(sequelize);
        this.db =initModels(sequelize);
    }
    
    static getInstance() {
        if(!instance) {
            instance = new SacarverDB();
        }
        return instance;
    }
}

module.exports = SacarverDB;