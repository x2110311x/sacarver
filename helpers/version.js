const { execSync } = require('child_process');

function getVersion() {
	let commit = process.env.GIT_COMMIT;
	if (!commit || commit === 'unknown') {
		try {
			commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
		} catch {
			commit = 'unknown';
		}
	}
	return commit;
}

module.exports = {
	getVersion,
};
