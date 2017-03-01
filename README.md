Gulp Git/Svn Version Filename
=====================


此 gulp 插件用于在文件名中添加对应 Git/Svn 的版本号。

注意：`gulpfile.js` 文件所在目录需要是 Git/Svn 有效的版本仓库目录，并确保命令行中能正常运行 Git/Svn 命令。

如何使用
----------

安装模块

```bash
npm i gulp-git-svn-version-filename
```

gulpfile.js 中

```js
var fileVer = require('gulp-git-svn-version-filename');
gulp.task('addSvnVersion', function(){
	return gulp.src(['./js/**/*.js', './css/**/*.css'])
		.pipe(fileVer.addVersion({type: 'svn', callback: function(oldPath, versionPath){
			console.log(versionPath, fileVer.getVersionMap());
		}}))
		.pipe(gulp.dest('./build'))
});
```

