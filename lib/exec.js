
// 执行命令
var ChildProcess = require('child_process');

module.exports = function(args, callback) {
	var cp = ChildProcess.exec(args.join(' '));
	var out = '';
	var err = '';
	var done = false;
	cp.stdout.on('data', function(data) {
        out += data;
	});
	cp.stderr.on('data', function(data){
        err += data;
	});
	cp.on('close', function(code) {
		if (done) return;
		done = true;
		if(err) logger.error('[exec] Error: ' + err);

		callback(err, out, code);
	});
	cp.on('error', function(err){
		logger.error('[exec] Error: ' + err);
		if (done) return;
		done = true;
		callback(err);
	});
};