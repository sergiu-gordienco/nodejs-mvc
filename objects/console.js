var promptCallbacks = [];

process.stdin.on('readable', function () {
	var chunk = process.stdin.read();
	if (chunk !== null) {
		if (promptCallbacks.length) {
			promptCallbacks.forEach(function (cb) {
				var er;
				try {
					cb(chunk);
				} catch (er) {
					console.log(er);
				}
			});
			promptCallbacks = [];
		}
	}
});


var path = require("path");
var stackList	= function () {
	var stackReg	= /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i;
	var stackReg2	= /at\s+()(.*):(\d*):(\d*)/i;
	var stackIndex	= 1;
	var data = {
		method	: "anonymous",
		path	: "unknown",
		line	: "?",
		pos		: "?",
		file	: "unknown",
		stack	: ""
	};
	// get call stack, and analyze it
	// get all file,method and line number
	var stacklist = (new Error()).stack.split('\n').slice(3);
	var s = stacklist[stackIndex] || stacklist[0],
		sp = stackReg.exec(s) || stackReg2.exec(s);
	if (sp && sp.length === 5) {
		data.method = data.method || sp[1];
		data.path = path.relative(process.cwd(), sp[2]);
		data.line = sp[3];
		data.pos = sp[4];
		data.file = (data.path + '').replace(/^[\S\s]*\//, '');
		data.stack = stacklist.join('\n');
	}
	return data;
};

var consoleBuilder = function () {
	var console	= global.console_original || global.console;
	var _config		= {
		debug	: true
	};
	var pushHeader = function (args, type, stack) {
		var data = stackList();
		var format = "\033[7m {{timestamp}} [{{TYPE}}] <{{title}}> {{file}}:{{line}} ({{method}})\t" + (stack ? "\n{{stack}}\n" : "")+"\033[7m";
		format = format.replace('{{timestamp}}', new Date().toISOString());
		format = format.replace('{{TYPE}}', type.toUpperCase());
		format = format.replace('{{file}}', data.file);
		format = format.replace('{{line}}', data.line);
		format = format.replace('{{method}}', data.method);
		format = format.replace('{{title}}', data.path);
		format = format.replace('{{stack}}', data.stack);
		args.unshift(format);
	};
	var methods	= {
		isDebugMode	: function (b) {
			if (typeof(b) !== "undefined") {
				_config.debug	= !!b;
			}
			return _config.debug;
		},
		log	: function() {
			if (methods.isDebugMode()) {
				var args = Array.prototype.slice.call(arguments);
				args.unshift("\033[0m");
				pushHeader(args, "log");
				args.push('\033[0m');
				console_original.log.apply(console, args);
			}
		},
		info	: function() {
			if (methods.isDebugMode()) {
				var args = Array.prototype.slice.call(arguments);
				args.unshift("\033[0;36m ");
				pushHeader(args, "info");
				args.push("\033[0m");
				console_original.log.apply(console, args);
			}
		},
		warn	: function() {
			if (methods.isDebugMode()) {
				var args = Array.prototype.slice.call(arguments);
				args.unshift("\033[0;40;33m ");
				pushHeader(args, "warn");
				args.push("\033[0m");
				console_original.log.apply(console, args);
			}
		},
		error	: function() {
			var getStackTrace = function() {
				var obj = {};
				Error.captureStackTrace(obj, getStackTrace);
				return obj.stack;
			};
			var args = Array.prototype.slice.call(arguments);
			console_original.log("\033[0;40;31m");
			pushHeader(args, "error", true);
			console_original.error.apply(console, args);
			console_original.log(getStackTrace());
			console_original.log("\033[0m\n");
		},
		prompt	: function (cb, message) {
			if (typeof(message) !== "undefined")
				process.stdout.write(message);
			promptCallbacks.push(cb);
		}
	};
	if (!global.console_original) {
		global.console_original	= {
			log: console.log,
			info: console.info,
			warn: console.warn,
			error: console.error,
			dir: console.dir,
			time: console.time,
			timeEnd: console.timeEnd,
			trace: console.trace,
			assert: console.assert,
			Console: console.Console
		};
		global.console.log	= methods.log;
		global.console.info	= methods.info;
		global.console.warn	= methods.warn;
		global.console.error	= methods.error;
	}
	return methods;
};

module.exports	= consoleBuilder;
