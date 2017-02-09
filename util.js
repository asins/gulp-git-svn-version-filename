
var Path = require('path');
var logger = require('fancy-log');
var chalk = require('chalk');
var exec = require('./lib/exec');

module.exports = {
	/**
	 * 获取变量类型
	 */
	type: function (obj) {
		if (obj == null) return obj + '';
		return typeof obj === 'object' || typeof obj === 'function' ?
			Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() || 'object' :
			typeof obj;
	},

	// 获取SVN 版本号
	getSvnVersioon: function (path, opt, callback) {
		if (!opt) opt = {};

		var svnCms = [
			'svn',
			'info',
			'"' + path + '"',
		];
		if (opt.usr) svnCms.push('--username ' + opt.usr);
		if (opt.pwd) svnCms.push('--password ' + opt.pwd);

		// logger('[SVN]', svnCms.join(' '));
		svnCms = svnCms.concat([
			'--xml',
			'--non-interactive',
			'--no-auth-cache',
			'--trust-server-cert',
		]);

		exec(svnCms, (err, out) => {
			var match = /<commit\s+revision="(\d+)">/i.exec(out) || [];
			var version = match[1] || 0;
			if (!version) {
				logger.error(chalk.red('[SVN] 获取版本失败：' + path));
			}
			callback(version);
		});
	},

	getGitVersion: function (path, opt, callback) {
		if (!opt) opt = {};

		var gitCms = [
			'git',
			'log',
			'-1',
			'--pretty="%h"', // 使用7位短hash方式, 完整hash请使用%H
			'"' + path + '"',
		];

		// logger('[Git]', gitCms.join(' '));
		exec(gitCms, function (err, version) {
			version = String(version).trim();
			if (version.length !== 7) {
				logger.error(chalk.red('[Git] 获取版本失败：'+ path));
				version = 0;
			}
			callback(version);
		});
	},

	// 获取相对cwd的相对路径
	getRelativePath: function (filePath, cwd) {
		return Path.relative(cwd || process.cwd(), filePath);
	}
}
