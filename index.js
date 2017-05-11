/**
 * 通过Git/Svn为文件名加入版本号
 */

'use strict';

var Stream = require('stream');
var Path = require('path');
var logger = require('fancy-log');
var chalk = require('chalk');
var debug = require('debug')('gulp-git-svn-version-filename');
var util = require('./util');

function addVersion(options) {
	var stream = new Stream.Transform({
		objectMode: true,
	});

	options = Object.assign({}, {
		type: 'git', // 默认使用git方式
		url: '', // 远程仓库地址
		user: '', // SVN中使用
		pwd: '', // SVN中使用
		cwd: '', // 文件的相对目录
		formater: '{name}_{version}{ext}',
		callback: function(){}, // 操作完成后执行
	}, options);

	stream._transform = (file, filetype, callback) => {
		var pathObj = Path.parse(file.path);

		(options.type == 'svn' ? util.getSvnVersioon : util.getGitVersion)(util.getRelativePath(file.path, options.cwd), options, (version) => {
			if(!version)  return callback(null, file);

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
			logger(chalk.yellow(util.getRelativePath(file.path, options.cwd)), '->', chalk.green(util.getRelativePath(versionFilePath, options.cwd)));

			if(util.type(options.callback) === 'function'){
				options.callback(file.path, versionFilePath, file);
			}
			file.path = versionFilePath;
			return callback(null, file);
		});
	};

	return stream;
};

exports.addVersion = addVersion;
exports.getVersionMap = util.getVersionMap;
exports.getSvnVersion = util.getSvnVersion;
exports.getGitVersion = util.getGitVersion
exports.cloneGitBaseRemote = util.cloneGitBaseRemote;