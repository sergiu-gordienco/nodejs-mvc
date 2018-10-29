/* jshint -W014 */
/* jshint -W002 */
/* jshint -W027 */
/* jshint -W083 */
/* jshint -W084 */

var http_statuses   = require(__dirname + "/objects/http_statuses.js");
var parseParams     = require("application-prototype/constructors/request/params-parser");
var Busboy = require("busboy");
var appBuilder	= function () {

	var _classes	= {
		zlib	: require("zlib"),
		fs		: require('fs'),
		http	: require('http'),
		url		: require('url'),
		os		: require('os'),
		httpStatuses : http_statuses,
		merge	: function(a, b) {
			if (a && b) {
				for (var key in b) {
					a[key] = b[key];
				}
			}
			return a;
		},
		cookies	: require('cookies'),
		expressSession	: require('express-session'),
		extensions		: require(__dirname+"/objects/extensions.js")
	};


var extendResponseRequest	= function (res, req) {
	var request	= req;

	req.app = res.app	= function () {
		return moduleObject;
	};
	request.originalUrl	= request.originalUrl || req.url;

	Object.defineProperty(request, 'isHttps', {
		get: function() { return ( request.connection ? ( request.connection.encrypted ? true : false ) : false ); },
		set: function(v) {},
		enumerable	: true,
		configurable: true
	});

	var u			= ( request.isHttps ? 'https' : 'http' ) + '://' + (request.headers.host || req.host || 'localhost') + ((request.url || "") + "");

	request.urlObject	= (u).parseUrl(true);

	Object.defineProperty(request, 'controller', {
		get: function() { return ((request.app().getMountUpdateUrl(request.urlObject.pathname) || "").split("/")[1] || "index"); },
		set: function(v) {
			appInstance.console.warn("[Request.controller] is not configurable");
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(request, 'controllerAction', {
		get: function() { return ((request.app().getMountUpdateUrl(request.urlObject.pathname) || "").split("/")[2] || "index"); },
		set: function(v) {
			appInstance.console.warn("[Request.controllerAction] is not configurable");
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(request, 'params', {
		get: function() {
			if (!request._cachedParams) {
				request._cachedParams = (request.app().getMountUpdateUrl(request.urlObject.pathname) || "").split("/").slice(3).map(function(v) {
					var e,r;
					try {
						r = decodeURIComponent(v);
					} catch(e) {
						r = unescape(v);
					}
					return r;
				});
			}
			let items = request._cachedParams.map(v => v);
			console.log(request.url, request._currentRoute);
			if (typeof(request._currentRoute) === "string") {
				let parsedParams = parseParams(request.url, request._currentRoute);
				if (parsedParams !== null && typeof(parsedParams) === "object") {
					let param;
					for (param in parsedParams) {
						items[param + ''] = parsedParams[param];
					}
				}
			};
			return items;
		},
		set: function(v) {
			appInstance.console.warn("[Request.params] is not configurable");
		},
		enumerable: true,
		configurable: true
	});

	request.getVars	= function() {
		return request.urlObject.get_vars;
	};
	request.postVars	= function() {
		var data;
		if( !( "post_vars" in request.urlObject ) ) {
			if( (request.headers['content-type'] || '').indexOf('multipart/form-data') === 0 && ( request.method == 'POST' || request.method == 'PUT' ) ) {
				request.urlObject.post_vars = {};
				request.urlObject.file_vars	= {};

				request._body.forEach(function (field) {
					var p = request.urlObject.post_vars;
					((field.fieldname || "") + "")
						.match(/\[*[^\[]+\]*/g)
						.map(v => v.replace(/^\[([^\]]+)\]$/, '$1'))
						.forEach((k, i, a) => {
							if (p && typeof (p) === "object") {
								if (i === a.length - 1) {
									p[k] = ((field.data.value || '') + "");
								} else {
									p[k] = p[k] || {};
									p = p[k];
								}
							} else {
								p = null;
							}
						});
				});
				request._files.forEach(function (file) {
					var p = request.urlObject.file_vars;
					((file.fieldname || "") + "")
						.match(/\[*[^\[]+\]*/g)
						.map(v => v.replace(/^\[([^\]]+)\]$/, '$1'))
						.forEach((k, i, a) => {
							if (p && typeof (p) === "object") {
								if (i === a.length - 1) {
									p[k] = file.data;
								} else {
									p[k] = p[k] || {};
									p = p[k];
								}
							} else {
								p = null;
							}
						});
				});
			} else if (
				(request.headers['content-type'] || '').indexOf('application/json') === 0
			) {
				var err;
				data = request.postData.toString('utf-8', 0, request.postData.length);
				try {
					request.urlObject.post_vars = JSON.parse(data);
					request.urlObject.file_vars	= {};
				} catch (err) {
					request.urlObject.post_vars	= data.parseUrlVars(true);
					request.urlObject.file_vars	= {};
				}
			} else {
				data = request.postData.toString('utf-8', 0, request.postData.length);
				request.urlObject.post_vars	= data.parseUrlVars(true);
				request.urlObject.file_vars	= {};
			}
		}
		return request.urlObject.post_vars;
	};
	request.fileVars	= function() {
		if( !( "file_vars" in request.urlObject ) ) {
			request.postVars();
		}
		return request.urlObject.file_vars;
	};

	res.redirect = function (url) {
		var address = url;
		var status = 302;

		// allow status / url
		if (arguments.length === 2) {
			if (typeof arguments[0] === 'number') {
				status = arguments[0];
				address = arguments[1];
			}
		}

		res.statusCode = status;
		// Set location header
		if (!res.headersSent) res.set('Location', address);

		res.end();
		return;
	};

	// TODO docs

	req.get =
	req.header = function(name){
		switch (name = name.toLowerCase()) {
			case 'referer':
			case 'referrer':
				return req.headers.referrer
					|| req.headers.referer;
			default:
				return req.headers[name];
		}
	};

	req.cookies	= req.cookieManager;

	req.cookie	= function (name, options) {
		return req.cookieManager.get(name, (options || {}));
	};

	res.get = res.getHeader;
	res.req = req;
	var err;
	try {
		Object.defineProperty(request, 'body', {
			get: function() { return request.postVars(); },
			set: function(v) {
				appInstance.console.warn("[Request.body] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'query', {
			get: function() { return request.getVars(); },
			set: function(v) {
				appInstance.console.warn("[Request.query] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'files', {
			get: function() { return request.fileVars(); },
			set: function(v) {
				appInstance.console.warn("[Request.files] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		// Object.defineProperty(request, 'app', {
		// 	get: function() { return moduleObject; },
		// 	set: function(v) {
		// 		appInstance.console.warn("[Request.app] is not configurable");
		// 	},
		// 	enumerable: true,
		// 	configurable: true
		// });
		// TODO request.fresh
		// TODO request.stale

		Object.defineProperty(request, 'baseUrl', {
			// TODO
			get: function() { return request.app().mountpath; },
			set: function(v) {
				appInstance.console.warn("[Request.app] should be not configurable");
				request.app().mountpath	= v;
			},
			enumerable: true,
			configurable: true
		});
		// TODO request.originalUrl
		// TODO request.ips
		// TODO request.subdomains
		// TODO request.accepts
		// TODO request.acceptsCharsets
		// TODO request.acceptsEncodings
		// TODO request.acceptsLanguages
		// TODO request.is
		Object.defineProperty(request, 'xhr', {
			get: function() {
				var val = this.get('X-Requested-With') || '';
				return 'xmlhttprequest' == val.toLowerCase();
			},
			set: function(v) {
				appInstance.console.warn("[Request.xhr] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'hostname', {
			get: function() { return request.headers.host ? (request.headers.host + '').replace(/:\d+$/,'') : undefined; },
			set: function(v) {
				appInstance.console.warn("[Request.hostname] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'path', {
			get: function() { return request.urlObject.pathname; },
			set: function(v) {
				appInstance.console.warn("[Request.path] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		// Object.defineProperty(request, 'originalPath', {
		// 	get: function() { return this.urlObject.pathname; },
		// 	set: function(v) {
		// 		appInstance.console.warn("[Request.originalPath] is not configurable");
		// 	},
		// 	enumerable: true,
		// 	configurable: true
		// });
		// Object.defineProperty(request, 'originalUrl', {
		// 	get: function() { return this.urlObject.url.replace(/^[^\/\?]+/, ''); },
		// 	set: function(v) {
		// 		appInstance.console.warn("[Request.originalUrl] is not configurable");
		// 	},
		// 	enumerable: true,
		// 	configurable: true
		// });
		Object.defineProperty(request, 'protocol', {
			get: function() { return request.urlObject.protocol; },
			set: function(v) {
				appInstance.console.warn("[Request.protocol] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'ip', {
			get: function() {
				return request.headers['x-forwarded-for'] ||
				(request.connection || {}).remoteAddress ||
				(request.socket || {}).remoteAddress ||
				((request.connection || {}).socket || {}).remoteAddress || undefined;
			},
			set: function(v) {
				appInstance.console.warn("[Request.hostname] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
	} catch (err) {
		appInstance.console.error(err);
	}

	res.set =
	res.header = function header(field, val) {
		if (arguments.length === 2) {
			if (Array.isArray(val))
				val = val.map(String);
			else
				val = String(val);
			if ('content-type' == field.toLowerCase() && !/;\s*charset\s*=/.test(val)) {
				var charset = 'utf-8';
				if (charset) val += '; charset=' + charset.toLowerCase();
			}
			res.setHeader(field, val);
		} else {
			for (var key in field) {
				res.set(key, field[key]);
			}
		}
		return res;
	};

	res.append = function (field, val) {
		var prev = this.get(field);
		var value = val;

		if (prev) {
			// concat the new and prev vals
			value = Array.isArray(prev) ? prev.concat(val)
				: Array.isArray(val) ? [prev].concat(val)
				: [prev, val];
		}

		return this.set(field, value);
	};

	res.location = function(url){
		var req = this.req;

		// "back" is an alias for the referrer
		if ('back' == url) url = req.get('Referrer') || '/';

		// Respond
		this.set('Location', url);
		return this;
	};

	res.clearCookie = function(name, options){
		var opts = { expires: new Date(1), path: '/' };
		return req.cookieManager.set(name, '', options ? _classes.merge(opts, options) : opts);
	};

	res.cookie = function(name, val, options) {
		req.cookieManager.set(name, val, (options || {}));
		return res;
	};

	res.pipe = function (filePath, cb, req) {
		if (!req)
			req	= request;
		var returned = false;
		var callback = function (err) { if (!returned && cb) cb(err); };
		_classes.fs.stat(filePath, function (err, stat) {
			if (err) {
				callback(err);
				return;
			}

			var readStream, start, end, total = stat.size, chunksize;

			if (req) {
				var range = req.headers.range || "";
				if (range && total) {
					var parts = range.replace(/bytes=/, "").split("-");
					var partialstart = parts[0];
					var partialend = parts[1];

					start = parseInt(partialstart, 10);
					end = partialend ? parseInt(partialend, 10) : total-1;
					chunksize = (end-start)+1;

					res.statusCode	= 206;
					res.setHeader("Content-Range", "bytes " + start + "-" + end + "/" + total);
					res.setHeader("Accept-Ranges", "bytes");
					res.setHeader("Content-Length", chunksize);
				}
			}

			if (typeof(start) === "number") {
				if (typeof(end) === "number") {
					readStream = _classes.fs.createReadStream(filePath, { start: start, end: end });
				} else {
					readStream = _classes.fs.createReadStream(filePath, { start: start });
				}
			} else {
				readStream = _classes.fs.createReadStream(filePath);
			}



			// This catches any errors that happen while creating the readable stream (usually invalid names)
			readStream.on('error', function(err) {
				callback(err);
			});

			// // This will wait until we know the readable stream is actually valid before piping
			readStream.on('open', function () {
				// This just pipes the read stream to the response object (which goes to the client)
				readStream.pipe(res);
			});

			res.on('close', function() {
				// Resume the read stream when the write stream gets hungry
				readStream.destroy();
			});

			res.on('end', function() {
				// Resume the read stream when the write stream gets hungry
				readStream.destroy();
			});

			readStream.on('end', function() {
				callback(undefined);
			});
		});
	};

	res.attachment = res.download	= function (filePath, fileName, callback, req) {
		var file	= (((function (path, file) {
				if (typeof(file) === "string") {
					return file;
				} else {
					return filePath.replace(/^[\s\S]*[\/\\]/, '');
				}
			})(filePath, fileName)) || "file");
		res.statusCode	= 200;
		res.setHeader('Content-Type', _classes.extensions.mime(file));
		res.setHeader('Content-Disposition', 'attachment; filename="'+file+'"');
		res.pipe(filePath, ( callback || function (err) {
				if (err) {
					appInstance._events.onError(err, { res: res, status : 404, end : true });
				} else {
					res.end();
				}
			}), req
		);
	};

	res.staticResource	= function (filePath, fileName, callback, req) {
		var er, err;
		try {
			_classes.fs.stat(filePath, function (err, stat) {
				if (err) {
					appInstance._events.onError(err, { res: res, status : 500, end : true });
				} else {
					var etag = stat.size + '-' + Date.parse(stat.mtime);
					res.setHeader('Last-Modified', stat.mtime);
					if (req && req.headers['if-none-match'] === etag) {
						res.statusCode = 304;
						res.end();
					} else {
						var acceptEncoding = request.headers['accept-encoding'];
						var raw = function () {
							var raw = _classes.fs.createReadStream(filePath);
							// raw.on('error', callback || function () {
							// 	var er; try { res.end(); } catch (er) {};
							// });
							// raw.on('close', callback || function () {
							// 	var er; try { res.end(); } catch (er) {};
							// });
							return raw;
						};
						if (!acceptEncoding) {
							acceptEncoding = '';
						}

						res.setHeader('Content-Type', _classes.extensions.mime(fileName || filePath || "file"));
						res.setHeader('ETag', etag);
						res.statusCode = 200;
						var resError;
						if (acceptEncoding.match(/\bdeflate\b/)) {
							res.setHeader('content-encoding', 'deflate');
							if (callback) { res.on('end', function () { callback(resError); }); res.on('error', function (err) { resError = err; }); }
							raw().pipe(_classes.zlib.createDeflate()).pipe(res);
						} else if (acceptEncoding.match(/\bgzip\b/)) {
							res.setHeader('content-encoding', 'gzip');
							if (callback) { res.on('end', function () { callback(resError); }); res.on('error', function (err) { resError = err; }); }
							raw().pipe(_classes.zlib.createGzip()).pipe(res);
						} else {
							res.setHeader('Content-Length', stat.size);
							res.pipe(filePath, ( callback || function (err) {
									if (err) {
										appInstance._events.onError(err, { res: res, status : 404, end : true });
									} else {
										res.end();
									}
								}), req
							);
						}
					}
				}
			});
		} catch (er) {
			err = er;
		}
		if (err) {
			try {
				appInstance._events.onError(err, { res: res, status : 500, end : true });
			} catch (err) {}
		}
	};
	res.status	= function (code) {
		res.statusCode	= code;
	};
	res.send	= function (data) {
		if (typeof(data) === "string") {
			if (data[0] === '<') {
				if (!res.headersSent)
					res.set('Content-Type', 'text/html');
			} else {
				if (!res.headersSent)
					res.set('Content-Type', 'text/plain');
			}
			res.write(data);
			res.end();
		} if (data instanceof Buffer) {
			if (!res.headersSent)
				res.set('Content-Type', 'application/octet-stream');
			res.write(data);
			res.end();
		} else if (Array.isArray(data) || typeof(data) === "object") {
			if (!res.headersSent)
				res.set('Content-Type', 'application/json');
			res.write(JSON.stringify(data));
			res.end();
		} else {
			if (!res.headersSent)
				res.set('Content-Type', 'application/octet-stream');
			res.write((data.toString ? data.toString() : (data + '')));
			res.end();
		}
	};
	res.sendStatus	= function (code) {
		res.statusCode = code;
		res.write(http_statuses[code] || (code + ''));
		res.end();
		return res;
	};
	res.sendFile	= function (path, options, callback) {
		// TODO right res.sendFile()
		if (res.finished) {
			callback(Error("Response is finished"));
		} else {
			res.staticResource(path, undefined, callback, undefined);
		}
		return res;
	};
	res.locals	= res.app.locals;
	// TODO res.format()
	// TODO res.json()
	// TODO res.jsonp()
	// TODO res.render()
	// TODO res.type()
	// TODO res.links()
	// TODO res.location()
	// TODO res.vary()
};



var _config	= {
	apps	: {
		parents	: [],
		childs	: []
	},
	httpListners	: {
		"use"	: [],
		"preuse"	: [],
		"prepost": [],
		"post"	: [],
		"get"	: [],
		"head"	: [],
		"put"	: [],
		"trace"	: [],
		"delete"	: [],
		"options"	: [],
		"connect"	: [],

		"checkout"		: [],
		"copy"			: [],
		"lock"			: [],
		"merge"			: [],
		"mkactivity"	: [],
		"mkcol"			: [],
		"move"			: [],
		"m-search"		: [],
		"notify"		: [],
		"patch"			: [],
		"propfind"		: [],
		"proppatch"		: [],
		"purge"			: [],
		"report"		: [],
		"search"		: [],
		"subscribe"		: [],
		"unlock"		: [],
		"unsubscribe"	: []
	},
	debug	: true,
	// dyn session
	'strict routing': true,
	sessionExpire	: 600,
	maxPostSize		: 4 * 1024 * 1024,
	sessionCookieName	: 'ssid',
	sessionCookieDomain	: false,
	sessionAutoUpdate	: true,
	// default session
	sessionHandler	: false,
	sessionStore	: new _classes.expressSession.MemoryStore(),
	sessionKey		: "ssid",
	sessionSecret	: "MY_SECRET",
	// cookie secret
	cookieSecret	: false, // default use session
	quiteHandler	: true,
	// other config
	controllers	: {},
	httpStates	: {},
	cwd		: __dirname+'/',
	rootPath: __dirname+'/',
	modulePath	: __dirname+'/modules/',
	publicPath	: false,
	getLibPath	: function() {
		return _config.cwd+'objects/';
	},
	getVendorPath	: function() {
		return _config.cwd+'vendors/';
	},
	onRequestCapture	: function( request, response, app ) {
		return 'ok';	// normal no action
		// return 'force-static';	// tread request as static request
		// return 'close';	// close connection // end response
	},
	onMaxPostSize		: function( request, response, app, maxPostSize ) {
		request.ERROR_MAX_POST_SIZE = true;
		appInstance.console.error("ERROR_MAX_POST_SIZE", "REACHED LIMIT OF " + maxPostSize);
		return true;	// if false force close request / do not send to other parsers
	},
	handleStaticResponse	: function( request, response, path, callback ) {
		if (typeof(path) === "function") {
			callback	= path;
			path		= undefined;
		}
		var url	= request.url.replace(/[\x23\?][\s\S]*$/, '');
		var app = request.app ? request.app() : moduleObject;
		var fpath = (path || app.getPublicPath()) + ( path ? url : app.getMountUpdateUrl(url) );
		_classes.fs.stat(fpath, function (err, stat) {
			if (err) {
				if (callback) {
					callback(err);
				} else {
					appInstance._events.onError(err, { res: response, status : 404, end : true });
				}
			} else {
				if (stat.isDirectory()) {
					response.staticResource(fpath + "/index.html", undefined, callback, request);
				} else {
					// response.setHeader('Content-Type', 'text/html');
					response.staticResource(fpath, undefined, callback, request);
				}
			}
		});
	},
	handleServerMidleware	: function (request, response, next) {
		var root	= _config;
		if (!root.sessionHandler) {
			root.sessionHandler	= _classes.expressSession({
				secret	: root.sessionSecret,
				key		: root.sessionKey,
				resave	: true,
				saveUninitialized: true,
				store	: root.sessionStore
			});
		}
		if (request) { // TODO
			request.secret	= request.isHttps;
			request.cookieSecret	= root.cookieSecret || root.sessionSecret;
		}
		request.cookieManager	= request.cookieManager || new _classes.cookies(request, response, (
			request.secret ? {
				// TODO encode cookie keys correctly
				"keys" : [( root.cookieSecret || root.sessionSecret )]
			} : {}
		));
		extendResponseRequest(response, request);
		root.sessionHandler(request, response, function (err) {
			if (err) {
				if (typeof(next) === "function") {
					return next(err, {
						request	: request,
						response	: response
					});
				} else {
					if (!root.quiteHandler) {
						throw err;
					} else {
						appInstance.console.error(err);
					}
				}
			} else {
				if (!request.sessionDyn && root.sessionCookieName) {
					request.sessionDyn	= new sessionInstance( request, response, appInstance, {
						expire			: root.sessionExpire,
						cookieName		: root.sessionCookieName,
						cookieDomain	: root.sessionCookieDomain
					} );
					if( root.sessionExpire && root.sessionAutoUpdate ) {
						request.sessionDyn.setExpire( root.sessionExpire );
					}
					request.sessionDyn.sessionId();
				}
				if (typeof(next) === "function") {
					return next();
				} else {
					appInstance.console.error(new Error("No request handler"));
				}
			}
			// console.log("Session", arguments);
			// console.log("Request", request);
			// console.log("Response", response);
		});
	},
	runHttpListners	: function (type, req, res, callback, onMatch) {
		var i = 0;
		if (!(type in _config.httpListners)) {
			appInstance.console.warn("httpListners without type");
			return;
		}
		var url		= ((req.url || '') + '');
		// console.log("PART ", type, i, _config.httpListners[type].length);
		var next	= function () {
			if (i < _config.httpListners[type].length) {
				i++;
				if (_config.routeMatch(_config.httpListners[type][i-1].route, url, false, _config.httpListners[type][i-1].mount)) {
					// console.log( "\033[1;34m oke-match mount: ", moduleObject.mountpath ,"; route: ", _config.httpListners[type][i-1].route, "; url: ", url, "\033[0m");
					req._currentRoute = _config.httpListners[type][i-1].route[0] || null;
					if (onMatch) {
						onMatch(function () {
							_config.httpListners[type][i-1].callback(req, res, next);
						});
					} else {
						_config.httpListners[type][i-1].callback(req, res, next);
					}
				} else {
					// console.log( "\033[1;35m not-match mount: ", moduleObject.mountpath ,"; route: ", _config.httpListners[type][i-1].route, "; url: ", url, "\033[0m");
					next();
				}
			} else {
				callback();
			}
		};
		next();
	},
	handleServerResponse		: function (request, response, next, isMount) {
		var root	= _config;

		request.maxPostSize = root.maxPostSize;
		request._body = [];
		request._files = [];
		request.postData = new Buffer([]);

		root.runHttpListners("preuse", request, response, function () {
			root.handleServerMidleware(request, response, function () {
				// console.log("CHECK STATE handleServerResponse", next);
				root.runHttpListners("use", request, response,
					isMount
					? function () { return root.handleServerResponseLogic(request, response, next); }
					: (
						next || function () { return root.handleServerResponseLogic(request, response); }
					)
				);
			});
		});
	},
	handleServerResponseLogic	: function( request, response, nextArg ) {
		let next    = (function () {
			var done = false;
			return function () {
				if (done) return;
				done = true;
				if (nextArg) {
					nextArg();
				} else {
					root.handleStaticResponse(request, response);
				}
			};
		})();
		var root	= this;
		var url		= request.app().getMountUpdateUrl(request.url);

		var postDataCallbacks = [];
		var postDataSize = 0;

		var postDataColectInitialized = false;
		var postDataColectDone = false;
		var postDataColect	= function (request, callback, maxPostSize) {
			var finish = function (err) {
				postDataColectDone = true;
				postDataCallbacks.forEach(function (cb) {
					cb(err);
				});
				postDataCallbacks = [];
			};

			if (postDataColectInitialized) {
				if (postDataColectDone) {
					callback();
				} else {
					postDataCallbacks.push(callback);
				}
				return;
			} else {
				postDataColectInitialized = true;
				postDataCallbacks.push(callback);
			}
			var requestAborted = false;

			request.on("data", function(chunk) {
				if (requestAborted) return;

				var dataLimit = request.maxPostSize;

				if (dataLimit < postDataSize) {
					requestAborted = true;
					if (_config.onMaxPostSize(request, response, appInstance, dataLimit) === false) {
						// finish();
						try { request.abort(); } catch (err) {};
						try { request.end(); } catch (err) {};
						try { response.end(); } catch (err) {};
						return;
					} else {
						finish();
					}
				}

				request.postData	= Buffer.concat([request.postData, chunk]);

				postDataSize += chunk.length;
			});

			request.on("error", function(err) {
				finish();
				appInstance.console.error(err);
				try { request.abort(); } catch (err) {};
				try { request.end(); } catch (err) {};
			});

			if ((request.headers['content-type'] || '').indexOf('multipart/form-data') === 0) {

				request.on("end", function() {
					let Readable = require('stream').Readable;
					let readable = new Readable()
					readable._read = () => {} // _read is required but you can noop it
					readable.push(request.postData);
					readable.push(null);

					var detectedBoundary = (
							request.postData
								.slice(0, 1024).toString()
								.match(/^\-\-(\-{4,}[A-Za-z0-9]{4,}\-*)(\r|)\n/) || []
						)[1] || null;

					if (detectedBoundary) {
						var calculatedHeader = 'multipart/form-data; boundary=' + detectedBoundary;
						if (
							calculatedHeader !== request.headers['content-type']
						) {
							console.warn(
								"MultipartFormdata: boundary replaced from ",
								request.headers['content-type'],
								calculatedHeader
							);
						}
						request.headers['content-type'] = calculatedHeader;
					}

					// console.warn("BusBoy Parse", request.headers, request.postData.toString());
					var busboy = new Busboy({
						headers: request.headers,
						limits : {
							fieldNameSize: 255,
							fieldSize: request.maxPostSize,
							fileSize: request.maxPostSize
						}
					});
					busboy.on('file', function(fieldname, fileStream, fileName, encoding, mimetype) {
						// console.warn("BusBoy File", arguments);
						var file = {
							fieldname : fieldname,
							data : {
								fileName : fileName,
								encoding : encoding,
								fileStream : () => fileStream,
								fileData : [],
								fileSize : 0,
								contentType : mimetype,
								loaded   : false
							}
						};
						request._files.push(file);
						fileStream.on('data', function(data) {
							file.data.fileData.push(data);
							file.data.fileSize += data.length;
						});
						fileStream.on('error', function (err) {
							file.data.error = err;
							appInstance.console.error(err);
						});
						fileStream.on('end', function() {
							file.data.fileData = Buffer.concat(file.data.fileData);
							if (!file.data.error)
								file.data.loaded = true;
						});
					});
					busboy.on('field', function(fieldname, value, fieldnameTruncated, valTruncated, encoding, mimetype) {
						// console.warn("BusBoy Field", arguments);
						request._body.push({
							fieldname: fieldname,
							data: {
								value : value,
								fieldnameTruncated : fieldnameTruncated,
								valTruncated : valTruncated,
								encoding : encoding,
								mimetype : mimetype
							}
						});
					});

					busboy.on('error', function (err) {
						// console.warn("BusBoy Error", arguments);
						if (!requestAborted) {
							requestAborted = true;
							finish();
						}
						appInstance.console.error(err);
						try {
							request.end();
						} catch (err) {}
					});

					busboy.on('finish', function() {
						// console.warn("BusBoy Finish", arguments);
						if (!requestAborted) {
							finish();
						}
					});

					readable.pipe(busboy) // consume the stream
				});
			} else {
				request.on("end", function() {
					if (!requestAborted) {
						finish();
					}
				});
			}
		};

		request.postDataColect = function (cb, maxPostSize) {
			postDataColect(
				request,
				cb,
				maxPostSize
			);
		};

		var mvcRun	= function () {
			var state = root.onRequestCapture( request, response, appInstance );
			if( state == 'close' ) {
				response.end();
				return false;
			}
			var controller	= false;
			if( state != 'force-static' ) {
				// find controller and run action
				controller	= request.app().getController(request.controller);
			}
			// appInstance.console.warn(request.method , request.app().getModulePath(), controller, request.controllerAction, request.url);
			if( controller !== false ) {
				var action	= controller.getAction( request.controllerAction );
				if( action !== false && action.isPublic() ) {
					if( !action.usePostData() ) {
						action.run( request, response );
					} else {
						request.maxPostSize = action.maxPostSize();

						postDataColect(request, function (err) {
							action.run( request, response );
						});
					}
				} else {
					root.handleStaticResponse( request, response, (next ? function (err) {
						if (err) {
							next();
						}
					} : undefined));
				}
			} else {
				root.handleStaticResponse( request, response, (next ? function (err) {
					if (err) {
						next();
					}
				} : undefined ));
			}
		};

		if (request.method === "GET") {
			root.runHttpListners("get", request, response, function () {
				mvcRun();
			});
		} else if (request.method === "POST") {
			root.runHttpListners("prepost", request, response, function () {
				root.runHttpListners("post", request, response, function () {
					mvcRun();
				}, function (cb) {
					// console.log("POST Data ::Start");
					postDataColect(request, function (err) {
						// console.log("POST Data ::callback");
						cb();
					});
				});
			});
		} else {
			root.runHttpListners(((request.method || "") + "").toLowerCase(), request, response, function () {
				mvcRun();
			});
		}
		// TODO define poperty files » fileVars
		// if (!("sessionDyn" in request)) {
		// 	request.sessionDyn	= new sessionInstance( request, response, appInstance, {
		// 			expire			: root.sessionExpire,
		// 			cookieName		: root.sessionCookieName,
		// 			cookieDomain	: root.sessionCookieDomain
		// 		} );
		// 	if( root.sessionExpire && root.sessionAutoUpdate ) {
		// 		request.sessionDyn.setExpire( root.sessionExpire );
		// 	}
		// }

	},
	routeNormalize	: function (route) {
		if (
			typeof(route) !== false
			&& typeof(route) !== "string"
			&& !(route instanceof RegExp)
			&& !Array.isArray(route)
			) {
			route	= false;
		}
		if (route !== false) {
			if (!Array.isArray(route)) {
				route	= [route];
			} else if (route === "*" ) {
				route	= false;
			} else {
				route	= route.filter(function (r) {
					return ( typeof(route) === "string" || (route instanceof RegExp));
				});
				if (route.length === 0) {
					route	= false;
				}
			}
		}
		return route;
	},
	getMountUpdateUrl	: function (url) {
		// console.info("routeMatch moduleObject.mountpath = ", moduleObject.mountpath);
		if (moduleObject.mountpath !== "/") {
			if (moduleObject.mountpath instanceof RegExp) {
				var m	= url.match(moduleObject.mountpath);
				url	= '/'+url.substring((m[0] || "").length).replace(/^\/+/);
			} else if (typeof(moduleObject.mountpath) === "string") {
				url	= '/'+url.substring(moduleObject.mountpath.length).replace(/^\/+/);
			}
		}
		return url;
	},
	routeMatch	: function (route, url, noMountCheck, mount) {
		if (!noMountCheck) {
			url	= moduleObject.getMountUpdateUrl(url);
		}

		if (route === false) {
			return true;
		} else {
			url	= (url || '');
			var i, c, rt;
			for (i=0;i<route.length;i++) {
				rt	= route[i];
				if (!_config['strict routing'] && typeof(rt) === "string") {
					rt	= rt.replace(/\/+$/, '');
				}
				if (typeof(rt) === "string") {
					if (parseParams(url, rt) !== null) {
						return true;
					} else {
						c	= url[rt.length];
						// appInstance.console.info("LAST Char", url.substring(0, route[i].length), " === ", route[i], ':', c, ':', route[i][route[i].length - 1]);
						if (
							( mount || ! url.substring(rt.length).match(/^((\/|)[^\?\/]+)/)) && // check same path
							( url.substring(0, rt.length).replace(/\?$/, '/') === rt ) &&
							( c === undefined || c === "?" || c === "/" || rt[rt.length - 1] === "/" )
						) {
							return true;
							break;
						}
					}
				} else {
					if (url.match(rt)) {
						return true;
						break;
					}
				}
			}
			return false;
		}
	},
	redirect	: function( response, url, status ) {
		if(!status)	status	= 302;
		response.redirect( url, status);
	}
};

var controllerInstance	= require(_config.getLibPath()+'controller.js');
var viewerInstance		= require(_config.getLibPath()+'viewer.js')();
viewerInstance.updateEnvVars({
	publicPath	: function () {
		return moduleObject.getPublicPath.apply(moduleObject, []);
	}
});

var bootstrapInstance	= require(_config.cwd+'bootstrap.js');
var sessionInstance		= require(_config.getLibPath()+'session.js');
var templateManagerInstance	= require(_config.getLibPath()+"template-manager.js");
var consoleInstance		= require(_config.getLibPath()+'console.js')();
consoleInstance.isDebugMode	= function () {
	return _config.debug;
};

var _appInstanceVars	= {};
var appInstance			= {
	console		: consoleInstance,
	debug		: function( state ) {
		if( typeof( state ) != "undefined" ) {
			_config.debug	= !!state;
			viewerInstance.debugMode(_config.debug);
		}
		return _config.debug;
	},
	_functions	: {},
	_events		: {},
	getVars		: function() {
		return _appInstanceVars;
	},
	_classes	: _classes,
	maxPostSize	: function (n) {
		if (typeof(n) === "number") {
			if (n > -1) {
				_config.maxPostSize	= n;
			}
		}
		return _config.maxPostSize;
	},
	onMaxPostSize	: function(f) {
		if( typeof(f) === "function" ) {
			_config.onMaxPostSize	= f;
			return true;
		}
		return false;
	},
	onRequestCapture	: function(f) {
		appInstance.console.warn("onRequestCapture is deprecated 2015.07.10 v1.2.0");
		if( typeof(f) === "function" ) {
			_config.onRequestCapture	= f;
			return true;
		}
		return false;
	},
	all		: function (route, callback) {
		if (typeof(route) === "function") {
			callback	= route;
			route		= false;
		}
		route	= _config.routeNormalize(route);
		if (typeof(callback) === "function") {
			var i;
			for( i in _config.httpListners ) {
				if (i !== "use" && i !== "preuse" && i !== "prepost") {
					_config.httpListners[i].push({
						route	: route,
						callback	: callback
					});
				}
			}
		}
	}
};



_classes.emailInstance	= require(_config.getLibPath()+"email/index.js");
_classes.faceboxPrototypeUpdate	= require(_config.getLibPath()+"facebox-prototype.js");
_classes.faceboxPrototypeUpdate( global );
appInstance._classes.emailInstance	= _classes.emailInstance;
appInstance._classes.email	= _classes.emailInstance.Email;

var moduleObject	= {
	cwd		: function() {
		return _config.cwd;
	},
	setModulePath	: function(dir) {
		_config.modulePath	= dir.replace(/\/+$/)+'/';
		return true;
	},
	getModulePath	: function(dir) {
		return _config.modulePath;
	},
	setPublicPath	: function(dir) {
		_config.publicPath	= dir.replace(/\/+$/)+'/';
		return true;
	},
	getPublicPath	: function(dir) {
		return _config.publicPath;
	},
	setRootPath	: function(dir) {
		_config.rootPath	= dir.replace(/\/+$/)+'/';
		return true;
	},
	getRootPath	: function(dir) {
		return _config.rootPath;
	},
	getLibPath	: function() {
		return _config.getLibPath();
	},
	getVendorPath	: function() {
		return _config.getVendorPath();
	},
	sessionDynExpire	: function( secconds ) {
		if( typeof( secconds ) === "number" ) {
			_config.sessionExpire	= secconds;
		}
		return _config.sessionExpire;
	},
	sessionDynCookieName	: function( name ) {
		if( typeof( name ) === "string" ) {
			_config.sessionCookieName	= name;
		}
		return _config.sessionCookieName;
	},
	sessionDynCookieDomain	: function( domain ) {
		if( typeof( domain ) === "string" || domain === false ) {
			_config.sessionCookieDomain	= domain;
		}
		return _config.sessionCookieDomain;
	},
	sessionDynAutoUpdate	: function( state ) {
		if( typeof( state ) !== "undefined" ) {
			_config.sessionAutoUpdate	= !!state;
		}
		return _config.sessionAutoUpdate;
	},
	sessionCookieName	: function( name ) {
		if( typeof( name ) === "string" ) {
			_config.sessionKey	= name;
		}
		return _config.sessionKey;
	},
	sessionSecretKey	: function( name ) {
		if( typeof( name ) === "string" ) {
			_config.sessionSecret	= name;
		}
		return _config.sessionSecret;
	},
	cookieSecretKey	: function( name ) {
		if( typeof( name ) === "string" ) {
			_config.cookieSecret	= name;
		}
		return _config.cookieSecret;
	},
	controllerExists	: function() {
		return ( moduleObject._functions.isValidIdentifier(arguments[0]) && arguments[0] in _config.controllers );
	},
	getController	: function( controllerName ) {
		if( moduleObject.controllerExists( controllerName ) ) {
			return _config.controllers[controllerName];
		}
		return false;
	},
	addController	: function( controllerName, options ) {
		if( moduleObject._functions.isValidIdentifier(controllerName) )
		if( !moduleObject.controllerExists(controllerName) ) {
			_config.controllers[controllerName]	= new controllerInstance( controllerName, options, appInstance );
			_config.controllers[controllerName]._setViewer( viewerInstance );
			return _config.controllers[controllerName];
		}
		return false;
	},
	removeController	: function( controllerName ) {
		if( _functions.isValidIdentifier( controllerName ) && moduleObject.controllerExists( controllerName ) ) {
			delete _config.controllers[controllerName];
			return true;
		}
		return false;
	},
	runBootstrap	: function() {
		bootstrapInstance( moduleObject, moduleObject.getModulePath() );
	},
	templateEnv	: function(o) {
		if( typeof(o) !== "undefined" ) {
			return viewerInstance.updateEnvVars( o );
		} else {
			return viewerInstance.getEnvVars();
		}
	},
	set	: function (p, value) {
		var params	= {
			'strict routing'	: function (v) {
				if (typeof(v) !== "boolean") {
					appInstance.console.warn("Setting param: '"+p+"' value should be typeof \"boolean\"");
				}
				_config[p]	= !!v;
			}
		};
		if (p in params) {
			params[p](value);
		} else {
			appInstance.console.warn("Unknown setting '"+p+"'");
		}
		return this;
	},
	getMountUpdateUrl	: function () {
		return _config.getMountUpdateUrl.apply(_config, arguments);
	}
};

/**
 * Start:
 * defining parent and child application handlers
 */
if ('defining') {
	Object.defineProperty(moduleObject, 'parent', {
		get: function() {
			return _config.apps.parents[0];
		},
		configurable: false
	});
	Object.defineProperty(moduleObject, 'parents', {
		get: function() {
			return _config.apps.parents;
		},
		configurable: false
	});
	Object.defineProperty(moduleObject, 'childs', {
		get: function() {
			return _config.apps.childs;
		},
		configurable: false
	});

	Object.defineProperty(appInstance, 'parent', {
		get: function() {
			return _config.apps.parents[0];
		},
		configurable: false
	});
	Object.defineProperty(appInstance, 'parents', {
		get: function() {
			return _config.apps.parents;
		},
		configurable: false
	});
	Object.defineProperty(appInstance, 'childs', {
		get: function() {
			return _config.apps.childs;
		},
		configurable: false
	});
	moduleObject.attachParent	= function (app) {
		_config.apps.parents.push(app);
	};
}
/**
 * End
 */


moduleObject._functions	= {
	isValidIdentifier	: function( id ) {
		return ( typeof(id) == "string" && id.match(/^[a-z][a-z0-9\-]+[a-z0-9]$/i) );
	}
};


appInstance.handleServerResponse			= _config.handleServerResponse;
appInstance.handleServerMidleware			= _config.handleServerMidleware;
appInstance.handleStaticResponse			= _config.handleStaticResponse;
appInstance.handleServerResponseLogic		= _config.handleServerResponseLogic;
appInstance._functions.isValidIdentifier	= moduleObject._functions.isValidIdentifier;
appInstance.structure						= moduleObject;
appInstance.sessionExpire					= moduleObject.sessionExpire;
appInstance.templateEnv						= moduleObject.templateEnv;
appInstance.sessionAutoUpdate				= moduleObject.sessionAutoUpdate;
appInstance.getPublicPath					= moduleObject.getPublicPath;
appInstance.getRootPath						= moduleObject.getRootPath;
appInstance.getLibPath						= moduleObject.getLibPath;
appInstance.getVendorPath					= moduleObject.getVendorPath;
appInstance.viewer							= viewerInstance;
moduleObject.viewer							= viewerInstance;
appInstance.templateManager					= new templateManagerInstance( appInstance.viewer );
moduleObject.handleServerResponse			= _config.handleServerResponse;
moduleObject.handleServerMidleware			= _config.handleServerMidleware;
moduleObject.handleStaticResponse			= _config.handleStaticResponse;
moduleObject.handleServerResponseLogic		= _config.handleServerResponseLogic;
moduleObject.debug							= appInstance.debug;
moduleObject.console						= appInstance.console;
moduleObject.templateManager					= appInstance.templateManager;
moduleObject.getVars						= appInstance.getVars;
moduleObject.onRequestCapture				= appInstance.onRequestCapture;
moduleObject.maxPostSize					= appInstance.maxPostSize;
moduleObject.onMaxPostSize					= appInstance.onMaxPostSize;
moduleObject.sessionManager					= new sessionInstance(true);
moduleObject._events						= appInstance._events;
moduleObject.httpStatuses				= http_statuses;
moduleObject.Email				= appInstance._classes.emailInstance.Email;

moduleObject.locals						= appInstance.getVars;
// TODO express app.mountpath
moduleObject.route						= "/";
moduleObject.mountpath					= "/";
// TODO moduleObject.on('mount')
// TODO moduleObject.disable()
// TODO moduleObject.disabled()
// TODO moduleObject.enable()
// TODO moduleObject.enabled()
// TODO moduleObject.engine()
// TODO moduleObject.get('title')
// TODO moduleObject.set('title','title page')
// TODO moduleObject.param()
// TODO moduleObject.path()
// TODO moduleObject.render()

moduleObject.handle	= moduleObject.handleServerResponse;

moduleObject.listen = function(){
	var server = http.createServer(moduleObject);
	return server.listen.apply(server, arguments);
};

;((function (httpListners, appInstance) {
	moduleObject.all	= appInstance.all;
	var method;
	for (method in httpListners) {
		;((function (m) {
			appInstance[m]	= function () {
				var i, start	= 1, route	= arguments[0];
				if (
					( (m === "use" || m === "preuse") && ( typeof(route) !== "string" && !(route instanceof RegExp) && route !== false && route !== undefined && route !== null) )
					||
					( typeof(route) === "function" )
				) {
					start		= 0;
					route		= false;
				}
				// console.log("Set Action [", m, "] ; route: ", route, " ; arguments: ", arguments)
				route	= _config.routeNormalize(route);
				for (i=start;i<arguments.length;i++) {
					;((function (route, type, callback) {
						if (type === "use" && typeof(callback.handle) === "function") {
							callback.route	= (route || "/");
							callback.mountpath	= (route[0] || "/");
							_config.apps.childs.push(callback);
							if (callback.attachParent && typeof(callback.attachParent) === "function") {
								callback.attachParent(moduleObject);
							}
							_config.httpListners[type].push({
								route	: route,
								mount	: true,
								callback	: function(req, res, next){
									// console.log("INFO \"use\" callback.handle detected", callback.route, callback.mountpath);
									req.app	= function () {
										return callback;
									};
									callback.handle(req, res, function () {
										req.app	= function () {
											return moduleObject;
										};
										next();
									}, true);
								}
							});
						} else if (type === "use" && (callback instanceof _classes.http.Server)) {
							_config.httpListners[type].push({
								route	: route,
								callback	: callback.listeners('request')[0]
							});
						} else if (typeof(callback) === "function") {
							_config.httpListners[type].push({
								route	: route,
								callback	: callback
							});
						}
					})(route, m, arguments[i]));
				}
				return moduleObject;
			};
			moduleObject[m]	= appInstance[m];
		})(method + '', appInstance));
	}
})(_config.httpListners, appInstance));


appInstance._events.onError	= function( error, config ) {
	if (config) {
		if (config.res) {
			if (config.status) {
				if (!config.res.headersSent) {
					config.res.statusCode	= config.status;
				}
			}
			if (config.end) {
				config.res.end("Status Code: " + ( config.status || "unknown" ) + "\nError Message: " + (error.message || err));
			}
		}
	}
};

	return moduleObject;
};

var moduleBuilder	= appBuilder;
	moduleBuilder.app	= appBuilder;
	// TODO moduleBuilder.static
	// TODO moduleBuilder.Router
var moduleDefault	= appBuilder();
;((function () {
	var i;
	for (i in moduleDefault) {
		moduleBuilder[i]	= moduleDefault[i];
	}
})());
module.debugOnStart	= true;
module.exports	= moduleBuilder;
