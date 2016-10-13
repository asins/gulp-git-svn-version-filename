/**
 * 通过Git/Svn为文件名加入版本号
 */

'use strict';

var Stream = require('stream');
var Path = require('path');
var objectAssign = require('object-assign');
var logger = require('fancy-log');
var chalk = require('chalk');
var util = require('./util');

module.exports = (options) => {
	var stream = new Stream.Transform({
		objectMode: true
	});

	options = objectAssign({}, {
		type: 'git', // 默认使用git方式
		user: '', // SVN中使用
		pwd: '', // SVN中使用
		formater: '{name}_{version}{ext}'
	}, options);

	stream._transform = (file, filetype, callback) => {
		var pathObj = Path.parse(file.path);

		// logger(pathObj.dir, JSON.stringify(pathObj));
		(options.type == 'svn' ? util.getSvnVersioon : util.getGitVersion)(file.path, {}, (version) => {
			if(!version) callback(null, file);

			pathObj.version = version;

			var fileName;
			if(util.type(version) === 'function'){
				fileName = options.formater(pathObj, options);
			}else{
				fileName = options.formater.replace(/\{(\w+)\}/ig, function($0, name){
					var val = pathObj[name];
					return util.type(val) === 'undefined' ? $0 : val;
				});
			}

			var versionFilePath = Path.resolve(pathObj.dir, fileName);
			logger(chalk.yellow(util.getRelativePath(file.path)), '->', chalk.green(util.getRelativePath(versionFilePath)));

			file.path = versionFilePath;
			callback(null, file);
		});
	};

	return stream;
}
