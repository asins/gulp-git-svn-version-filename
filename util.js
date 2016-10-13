
var Path = require('path');
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
			var version = match[1];
			if (!version) {
				logger.error('[SVN] 获取Svn版本失败：' + path, out);
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
		exec(gitCms, function (out) {

			if (out.length > 7) {
				logger.error('[Git] 获取Git版本失败：' + out);
			}
			callback(out);
		});
	},

	// 获取相对cwd的相对路径
	getRelativePath: function (filePath) {
		return Path.relative(process.cwd(), filePath);
	}
}