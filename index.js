/**
 * 通过Git/Svn为文件名加入版本号
 */

'use strict';

var Stream = require('stream');
var Path = require('path');
var logger = require('fancy-log');
var chalk = require('chalk');
var debug = require('debug')('gulp-git-svn-version-filename');
var exec = require('child_process').exec;

var versionMap = {};
var dotGitPath = Path.relative(process.cwd(), '.git'); //'./.git'; // .git目录路径


function Versions(options){
	Object.assign(this, {
		type: 'git', // 默认使用git方式
		user: '', // SVN中使用
		pwd: '', // SVN中使用
		cwd: '', // 文件的相对目录
		cache: true,  // 是否开启缓存，或指定缓存对象
		formater: '{name}_{version}{ext}',
	}, options);
}

Versions.prototype.get = function(path, cb){
    if(type(cb) !== 'function') cb = noop;

	var getVersion = this.type === 'svn' ? getSvnVersion : getGitVersion;
    if(path.indexOf('/') == 0){ // 相对.git文件夹路径
        path = relativePath(path, this.cwd);
    }

    getVersion(path, {
        user: this.user,
        pwd: this.pwd,
        cache: this.cache,
    }, cb);
};

Versions.prototype.formaterPath = function(path, version){
    var pathObj = Path.parse(path);
    pathObj.version = version;

    var fileName = type(this.formater) === 'function' ?
        this.formater(pathObj, this) :
        String(this.formater).replace(/\{(\w+)\}/ig, function ($0, name) {
            var val = pathObj[name];
            return type(val) === 'undefined' ? $0 : val;
        });

	return Path.resolve(pathObj.dir, fileName);
};

/**
 * 影响tranform，获取文件的版本信息
 */
Versions.prototype.getForTransform = function(cb){
	var stream = new Stream.Transform({
		objectMode: true,
	});

	stream._transform = (file, filetype, callback) => {
        this.get(file.path, function(version){
            if(type(cb) === 'function'){
                cb(version, file);
            }

            return callback(null, file);
        });
    };
	return stream;
};

Versions.prototype.setForTransform = function(cb){
    return this.getForTransform( (version, file) => {
        if (!version) return ;

        var path = file.path;
        var versionFilePath = this.formaterPath(path, version);

        logger(chalk.yellow(relativePath(path, this.cwd)), '->', chalk.green(relativePath(versionFilePath, this.cwd)));
        file.path = versionFilePath;

        if(type(cb) === 'function'){
            cb(path, versionFilePath);
        }
    });
};

// 返回缓存的文件版本记录
Versions.prototype.getCache = function (path){
	var cacheObj = cacheWare(this.cache);
	if(path){
		return cacheObj[path];
	}else{
		return Object.assign({}, cacheObj);
	}
}

// 清除缓存的版本记录
Versions.prototype.delCache = function (path){
	var cacheObj = cacheWare(this.cache);
	if(path){
		if(cacheObj[path]) delete cacheObj[path];
	}else{
		for(var i in cacheObj){
			delete cacheObj[i];
		}
	}
}

Versions.cloneGitBaseRemote = function(remoteUrl, branche, callback){
	checkDotGit(function(err, isGitRepDir){
    	if(err){
			return callback(err);
		}

		if(isGitRepDir){
			logger(chalk.blue('[Git] .git仓库目录已经存在'));
			return callback(null);
		}

        var cmdStr = `git clone -s --bare -b ${branche||'master'} ${remoteUrl} ${dotGitPath}`;
		logger(chalk.blue('[Git] clone远程分支到本地: ' + cmdStr));
		exec(cmdStr, function(err, out, stderr){
			if (err) {
				return callback(err);
			}
			logger(chalk.blue(out));
			callback(null);
		});
	});
};


/****** util *****/

function noop() {}

// 获取相对cwd的相对路径
function relativePath(filePath, cwd) {
	return Path.relative(cwd || process.cwd(), filePath);
}

/**
 * 获取变量类型
 */
function type (obj) {
	if (obj == null) return obj + '';
	return typeof obj === 'object' || typeof obj === 'function' ?
		Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() || 'object' :
		typeof obj;
}
function isPlainObject(o) {
  if (type(o) !== 'object') return false;

  // If has modified constructor
  var ctor = o.constructor;
  if (type(ctor) !== 'function') return false;

  // If has modified prototype
  var prot = ctor.prototype;
  if (type(prot) !== 'object') return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
};


function cacheWare(cache){
	return isPlainObject(cache) ? cache : versionMap;
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

	var cacheObj = cacheWare(opt.cache);
	if( opt.cache !== false && type(cacheObj[path]) !== 'undefined' ){
		return callback( cacheObj[path] );
	}

	var cmdArgs = [
		'svn',
		'info',
		'"' + path + '"',
	];
	if (opt.usr) cmdArgs.push('--username ' + opt.usr);
	if (opt.pwd) cmdArgs.push('--password ' + opt.pwd);

	debug('[SVN]', cmdArgs.join(' '));
	cmdArgs = cmdArgs.concat([
		'--xml',
		'--non-interactive',
		'--no-auth-cache',
		'--trust-server-cert',
	]);

	exec(cmdArgs.join(' '), function (err, stdout, stderr) {
		var match = /<commit\s+revision="(\d+)">/i.exec(stdout) || [];
		var version = match[1] || null;
		if (!version) {
			logger.error(chalk.red('[SVN] 获取版本失败：' + path));
		}else if(opt.cache !== false){
			cacheObj[path] = version;
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

	var cacheObj = cacheWare(opt.cache);
	if( opt.cache !== false && type(cacheObj[path]) !== 'undefined' ){
		return callback( cacheObj[path] );
	}

	var cmdArgs = [
		'git',
		'--git-dir="' + dotGitPath +'"',
		'log',
		'-1',
		'--pretty="%h"', // 使用7位短hash方式, 完整hash请使用%H
		'"' + path + '"',
	];

	debug('[Git]', cmdArgs.join(' '));
	exec(cmdArgs.join(' '), function (err, version, stderr) {
		version = String(version).trim().slice(0, 8); // 只取前8位
    if (!version.length) {
			logger.error(chalk.red('[Git] 获取版本失败：' + path));
			version = null;
		}else if(opt.cache !== false){
			cacheObj[path] = version;
		}
		callback(version);
	});
}

/**
 * 检查当前目录是否是git仓库目录
 * returns 是git仓库则返回true
 */
function checkDotGit(callback){
	exec('git log -1', function(err, out){
		if(err){
      if(String(err).indexOf('fatal:') > -1 || String(err).indexOf('错误:') > -1){
				return callback(null, false);
			} else {
				return callback('[Git] checkDotGit: ' + err);
			}
		}else{
			return callback(null, true);
		}
	});
}






module.exports = Versions;
