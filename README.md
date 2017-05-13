# Gulp Git/Svn Version Filename

此 gulp 插件用于在文件名中添加对应 Git/Svn 的版本号。

注意：`gulpfile.js` 文件所在目录需要是 Git/Svn 有效的版本仓库目录，并确保命令行中能正常运行 Git/Svn 命令。

## 如何使用


安装模块

```bash
npm i gulp-git-svn-version-filename
```
## 创建实例

```js
var FileVer = require('gulp-git-svn-version-filename');
var fileVer = new FileVer({
	type: 'svn', // 仓库类型 支持svn、git
	cwd: process.cwd(), // 项目根目录
	user: '', // 仓库账号名
	pwd: '', // 仓库账号密码
	cache: true, // 是否缓存已查询版本信息
	formater: '{name}_{version}{ext}', // 文件名加版本号的规则（不提供目录结构修改）
});
```

- type {String} 仓库类型 支持svn、git，默认为svn
- cwd {String} 项目根目录，默认为process.cwd()
- user {String} 仓库账号名，只支持SVN
- pwd {String} 仓库账号密码 只支持SVN
- cache {Boolean/Object} 是否缓存已查询版本信息
  - Boolean时：允许与否。注意：为true时使用的是全局缓存，所有引用共用一个缓存空间。
  - Object时：值为缓存对象，必须为普通对象(isPlainObject)。
- formater {String/Function}
  - 值String时：文件名加版本号的规则（不提供目录结构修改） 默认值：'{name}_{version}{ext}'；
  - 值为Function(pathObj, this)时：pathObj为`pathObj. = Path.parse(path)`，并加入`version`信息，this指向fileVer。

### FileVer.cloneGitBaseRemot(remoteUrl, branche, callback)  静态方法 同步仓库的.git文件夹到本地当前目录
- remoteUrl {String} 远程仓库地址
- branche {String} 待clone的分支名
- callback(err) clone完成后的回调方法，如果出错返回的第一个参数为error信息，如果成功则返回null

### fileVer.getCache([path]) 获取已查询过的文件版本列表，数据为所有引用共用
- path: 待查文件路径
- 返回结果：当传入path参数时只返回path的对应版本信息, 否则返回所有缓存信息Map 如：`{'/home/user/git/project/js/a.js': '34ae3'}`

### fileVer.delCache([path]) 删除缓存信息
- path: 删除指定Key的缓存信息，如不传则删除所有缓存

### fileVer.get(fullPath, callback) 获取指定URL的版本信息

- fullPath {String} 绝对路径地址
- callback(version) {Function} 获取到信息后的回调方法
  - version {String} 为fullPath对应的版本号，当仓库中无版本号或获取失败时值为0

### fileVer.formaterPath(fullPath, version) 按照`this.formater`规则给fullPath加上version信息
- fullPath {String} 要加版本号的文件路径
- version {String} 待加入的版本号值
- 返回结果：加入版本号信息后的文件路径

### fileVer.getForTransform(callback) 获取gulp(Transform方式)传入file的版本号信息

- callback(version) {Function} 获取到信息后的回调方法
  - version {String} 为fullPath对应的版本号，当仓库中无版本号或获取失败时值为null

### fileVer.setForTransform(callback) 按formater给的规则设置gulp(TransForm方式)传入file的版本号
- callback(oldFullFilePath, versionFullFilePath) 给`file.path`加完版本后的回调方法


配置中user、pwd参数目前只有SVN支持，Git仓库请走ssh方式

gulpfile.js 中

```js
var FileVer = require('gulp-git-svn-version-filename');
var cacheObj = {};
var fileVer = new FileVer({
	type: 'svn', // 仓库类型 支持svn、git
	cwd: process.cwd(), // 项目根目录
	user: '', // 仓库账号名
	cache: cacheObj, // 指定缓存对象
	pwd: '', // 仓库账号密码
});
gulp.task('addSvnVersion', function(){
	return gulp.src(['./js/**/*.js', './css/**/*.css'])
		.pipe(fileVer.addVersion({type: 'svn', callback: function(oldPath, versionPath){
			console.log(versionPath, fileVer.getVersionMap());
		}}))
		.pipe(gulp.dest('./build'))
});
```

