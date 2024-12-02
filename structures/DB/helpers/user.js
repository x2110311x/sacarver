const logging = require('../../logging');

var log = logging.getInstance().logger;


module.exports = {
	name: "user",
	async execute(db, id, username) {

    log.debug("Checking if user exists in DB");

    // eslint-disable-next-line no-unused-vars
    const [user, created] = await db.Users.findOrCreate({
      where: { ID: id },
      defaults: {
          username: username
      }
    });

    if (created) {
      log.info(`User ${username} added to DB`);
    }
	}
};