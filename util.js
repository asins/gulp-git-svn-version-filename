
var Path = require('path');
var exec = require('child_process').exec;
var logger = require('fancy-log');
var chalk = require('chalk');

var versionMap = {};
var dotGitPath = Path.relative(process.cwd(), '.git'); //'./.git'; // .git目录路径

/**
 * 获取变量类型
 */
function type (obj) {
	if (obj == null) return obj + '';
	return typeof obj === 'object' || typeof obj === 'function' ?
		Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() || 'object' :
		typeof obj;
}

// 执行命令

// 获取SVN 版本号
function getSvnVersion (path, opt, callback) {
	if(type(opt) === 'function'){
		callback = opt;
		opt = {};
	}else if (!opt){
		opt = {};
	}
	if( type(versionMap[path]) !== 'undefined' ){
		return callback( versionMap[path] );
	}

	var cmdArgs = [
		'svn',
		'info',
		'"' + path + '"',
	];
	if (opt.usr) cmdArgs.push('--username ' + opt.usr);
	if (opt.pwd) cmdArgs.push('--password ' + opt.pwd);

	// logger('[SVN]', cmdArgs.join(' '));
	cmdArgs = cmdArgs.concat([
		'--xml',
		'--non-interactive',
		'--no-auth-cache',
		'--trust-server-cert',
	]);

	exec(cmdArgs.join(' '), opt, function (err, stdout, stderr) {
		var match = /<commit\s+revision="(\d+)">/i.exec(stdout) || [];
		var version = match[1] || null;
		if (!version) {
			logger.error(chalk.red('[SVN] 获取版本失败：' + path));
		}else{
			versionMap[path] = version;
		}
		callback(version);
  });
}

function getGitVersion (path, opt, callback) {
	if(type(opt) === 'function'){
		callback = opt;
		opt = {};
	}else if (!opt){
		opt = {};
	}

	if( type(versionMap[path]) !== 'undefined' ){
		return callback( versionMap[path] );
	}

	var cmdArgs = [
		'git',
		'--git-dir="' + dotGitPath +'"',
		'log',
		'-1',
		'--pretty="%h"', // 使用7位短hash方式, 完整hash请使用%H
		'"' + path + '"',
	];

	logger('[Git]', cmdArgs.join(' '));
	exec(cmdArgs.join(' '), opt, function (err, version, stderr) {
		version = String(version).trim();
		if (version.length !== 7) {
			logger.error(chalk.red('[Git] 获取版本失败：' + path));
			version = null;
		} else {
			versionMap[path] = version;
		}
		callback(version);
	});
}

function cloneGitBaseRemote(url, branche, callback){
	checkDotGit(function(err, isGitRepDir){
    	if(err){
			return callback(err);
		}

		if(isGitRepDir){
			logger(chalk.blue('[Git] .git仓库目录已经存在'));
			return callback(null);
		}

        var cmdStr = `git clone -s --bare -b ${branche||'master'} ${url} ${dotGitPath}`;
		logger(chalk.blue('[Git] clone远程分支到本地: ' + cmdStr));
		exec(cmdStr, {}, function(err, out, stderr){
			if (err) {
				return callback(err);
			}
			logger(chalk.blue(out));
			callback(null);
		});
	});
}

/**
 * 检查当前目录是否是git仓库目录
 * returns 是git仓库则返回true
 */
function checkDotGit(callback){
	exec('git log -1', {}, function(err, out){
		if(err){
			if(String(err).indexOf('fatal: Not a git repository') > -1){
				return callback(null, false);
			} else {
				return callback('[Git] checkDotGit: ' + err);
			}
		}else{
			return callback(null, true);
		}
	});
}

// 获取相对cwd的相对路径
function getRelativePath (filePath, cwd) {
	return Path.relative(cwd || process.cwd(), filePath);
}

// 返回缓存的文件版本记录
function getVersionMap (path){
	if(path){
		return versionMap[path];
	}else{
		return Object.assign({}, versionMap);
	}
}

// 清除缓存的版本记录
function cleanVersionMap(){
	versionMap = {};
}

exports.type = type;
exports.getGitVersion = getGitVersion;
exports.getSvnVersion = getSvnVersion;
exports.getRelativePath = getRelativePath;
exports.getVersionMap = getVersionMap;
exports.cleanVersionMap = cleanVersionMap;
exports.cloneGitBaseRemote = cloneGitBaseRemote;
