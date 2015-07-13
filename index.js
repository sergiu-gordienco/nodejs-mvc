
var appBuilder	= function () {

var _classes	= {
	fs		: require('fs'),
	url		: require('url'),
	os		: require('os'),
	merge	: function(a, b) {
		if (a && b) {
			for (var key in b) {
				a[key] = b[key];
			}
		}
		return a;
	},
	cookie	: require('cookie'),
	cookieParser	: require('cookie-parser'),
	cookieSignature	: require('cookie-signature'),
	expressSession	: require('express-session'),
	extensions		: require(__dirname+"/objects/extensions.js")
};


var extendResponseRequest	= function (res, req) {
	var request	= req;

	res.app	= function () {
		return moduleObject;
	};

	// TODO docs

	req.get =
	req.header = function(name){
		switch (name = name.toLowerCase()) {
			case 'referer':
			case 'referrer':
				return this.headers.referrer
					|| this.headers.referer;
			default:
				return this.headers[name];
		}
	};

	var err;
	try {
		Object.defineProperty(request, 'body', {
			get: function() { return this.postVars(); },
			set: function(v) {
				appInstance.console.warn("[Request.body] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		var urlObj = false;
		Object.defineProperty(request, 'urlObject', {
			get: function() {
				if (urlObj === false) {
					urlObj	= this.url.parseUrl(true);
				}
				return urlObj;
			},
			set: function(v) {
				appInstance.console.warn("[Request.urlObject] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'query', {
			get: function() { return this.getVars(); },
			set: function(v) {
				appInstance.console.warn("[Request.query] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'files', {
			get: function() { return this.fileVars(); },
			set: function(v) {
				appInstance.console.warn("[Request.files] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'app', {
			get: function() { return moduleObject; },
			set: function(v) {
				appInstance.console.warn("[Request.app] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		// TODO request.fresh
		// TODO request.stale
		// TODO request.baseUrl
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
			get: function() { return this.headers.host ? (this.headers.host + '').replace(/:\d+$/,'') : undefined; },
			set: function(v) {
				appInstance.console.warn("[Request.hostname] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'path', {
			get: function() { return this.urlObject.pathname; },
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
			get: function() { return this.urlObject.protocol; },
			set: function(v) {
				appInstance.console.warn("[Request.protocol] is not configurable");
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(request, 'ip', {
			get: function() {
				return this.headers['x-forwarded-for'] || 
				this.connection.remoteAddress || 
				this.socket.remoteAddress ||
				this.connection.socket.remoteAddress || undefined;
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
			this.setHeader(field, val);
		} else {
			for (var key in field) {
				this.set(key, field[key]);
			}
		}
		return this;
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
		return _classes.cookie(name, '', options
		? _classes.merge(opts, options)
		: opts);
	};

	res.cookie = function(name, val, options){
		var sign	= _classes.cookieSignature.sign;
		options = _classes.merge({}, options);
		var secret = this.req.cookieSecret;
		var signed = options.signed;
		if (signed && !secret) throw new Error('cookieParser("secret") required for signed cookies');
		if ('number' == typeof val) val = val.toString();
		if ('object' == typeof val) val = 'j:' + JSON.stringify(val);
		if (signed) val = 's:' + sign(val, secret);
		if ('maxAge' in options) {
			options.expires = new Date(Date.now() + options.maxAge);
			options.maxAge /= 1000;
		}
		if (null == options.path) options.path = '/';
		var headerVal = _classes.cookie.serialize(name, String(val), options);

		// supports multiple 'res.cookie' calls by getting previous value
		var prev = this.get('Set-Cookie');
		if (prev) {
			if (Array.isArray(prev)) {
				headerVal = prev.concat(headerVal);
			} else {
				headerVal = [prev, headerVal];
			}
		}
		this.set('Set-Cookie', headerVal);
		return this;
	};

	res.pipe = function (filePath, callback, req) {
		_classes.fs.stat(filePath, function (err, stat) {
			if (err) {
				if (callback) {
					callback(err);
				}
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


			readStream.on('data', function(data) {
				var flushed = res.write(data);
				// Pause the read stream when the write stream gets saturated
				if(!flushed)
					readStream.pause();
			});

			// This catches any errors that happen while creating the readable stream (usually invalid names)
			readStream.on('error', function(err) {
				if (callback) {
					callback(err);
				}
			});

			// // This will wait until we know the readable stream is actually valid before piping
			// readStream.on('open', function () {
			// 	// This just pipes the read stream to the response object (which goes to the client)
			// 	readStream.pipe(res);
			// });

			res.on('drain', function() {
				// Resume the read stream when the write stream gets hungry 
				readStream.resume();
			});

			readStream.on('end', function() {
				if (callback) {
					callback(undefined);
				}
			});
		});
	};

	res.download	= function (filePath, fileName, callback, req) {
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
		var err;
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
						res.setHeader('Content-Type', _classes.extensions.mime(fileName || filePath || "file"));
						res.setHeader('Content-Length', stat.size);
						res.setHeader('ETag', etag);
						res.statusCode = 200;
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
			});
		} catch (err) {};
		if (err) {
			try {
				appInstance._events.onError(err, { res: res, status : 500, end : true });
			} catch (err) {};
		}
	};
};



var _config	= {
	httpListners	: {
		"use"	: [],
		"post"	: [],
		"get"	: [],
		"head"	: [],
		"put"	: [],
		"trace"	: [],
		"delete"	: [],
		"options"	: [],
		"connect"	: []
	},
	debug	: true,
	// dyn session
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
	cookieHandler	: false,
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
	onMaxPostSize		: function( request, response, app, action ) {
		response.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
		response.end('Max Post File Size');
		return false;	// if false action processing is broken
	},
	handleStaticResponse	: function( request, response, path ) {
		var url	= request.url.replace(/[\x23\?][\s\S]*$/, '');
		_classes.fs.stat((path || _config.publicPath) + url, function (err, stat) {
			if (err) {
				appInstance._events.onError(err, { res: response, status : 404, end : true });
			} else {
				if (stat.isDirectory()) {
					response.staticResource((path || _config.publicPath) + url + "/index.html", undefined, undefined, request);
				} else {
					response.setHeader('Content-Type', 'text/html');
					response.staticResource((path || _config.publicPath) + url, undefined, undefined, request);
				}
			}
		});
		// _classes.fs.readFile( _config.publicPath + url, function (err,data) {
		// 	if (err) {
		// 		appInstance._events.onError(err, { res: response, status : 404, end : true });
		// 	return;
		// 	} else {
		// 		_classes.fs.stat(_config.publicPath + url, function (err, stat) {
		// 			if (err) {
		// 				appInstance._events.onError(err, { res: response, status : 500, end : true });
		// 			} else {
		// 				var etag = stat.size + '-' + Date.parse(stat.mtime);
		// 				response.setHeader('Last-Modified', stat.mtime);
		// 				if (request.headers['if-none-match'] === etag) {
		// 					response.statusCode = 304;
		// 					response.end();
		// 				} else {
		// 					response.setHeader('Content-Length', data.length);
		// 					response.setHeader('ETag', etag);
		// 					response.statusCode = 200;
		// 					response.end(data);
		// 				}
		// 			}
		// 		});
		// 	}
		// });
	},
	handleServerMidleware	: function (request, response, next) {
		var root	= _config;
		if (!root.cookieHandler) {
			root.cookieHandler	= _classes.cookieParser(root.cookieSecret || root.sessionSecret);
		};
		if (!root.sessionHandler) {
			root.sessionHandler	= _classes.expressSession({
				secret	: root.sessionSecret,
				key		: root.sessionKey,
				resave	: true,
				saveUninitialized: true,
				store	: root.sessionStore
			});
		};
		root.cookieHandler(request, response, function (err) {
			if (err) {
				if (!root.quiteHandler) {
					throw err;
				} else {
					appInstance.console.error(err);
				}
			};
			// console.log("response object", response, err);
			// console.log("Cookies", arguments);
			if (request) {
				request.secret	= (request.protocol === 'https');
				request.cookieSecret	= root.cookieSecret || root.sessionSecret;
			}
			if (request && response)
				response.req	= request;
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
					if (typeof(next) === "function") {
						request.sessionDyn	= new sessionInstance( request, response, appInstance, {
								expire			: root.sessionExpire,
								cookieName		: root.sessionCookieName,
								cookieDomain	: root.sessionCookieDomain
							} );
						if( root.sessionExpire && root.sessionAutoUpdate ) {
							request.sessionDyn.setExpire( root.sessionExpire );
						}
						return next();
					} else {
						appInstance.console.error(new Error("No request handler"));
					}
				};
				// console.log("Session", arguments);
				// console.log("Request", request);
				// console.log("Response", response);
			});
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
				if (_config.routeMatch(_config.httpListners[type][i-1].route, url)) {
					if (onMatch) {
						onMatch(function () {
							_config.httpListners[type][i-1].callback(req, res, next);
						});
					} else {
						_config.httpListners[type][i-1].callback(req, res, next);
					}
				} else {
					next();
				}
			} else {
				callback();
			}
		};
		next();
	},
	handleServerResponse		: function (request, response, next) {
		_config.runHttpListners("use", request, response, function () {
			var root	= _config;
			root.handleServerMidleware(request, response, function () {
				_config.handleServerResponseLogic(request, response, next);
			});
		});
	},
	handleServerResponseLogic	: function( request, response, next ) {
		var root	= this;
		var url		= request.url;
		var parts	= request.urlObject.pathname.split(/\//);
		request.controller			= parts[1] || "index";
		request.controllerAction		= parts[2] || "index";
		request.params		= parts.slice(3).map(function(v) {
			var e,r;
			try {
				r = decodeURIComponent(v);
			} catch(e) {
				r = unescape(v);
			}
			return r;
		});
		request.getVars	= function() {
			return request.urlObject.get_vars;
		};
		request.postData	= new Buffer(0);
		request.postVars	= function() {
			if( !( "post_vars" in request.urlObject ) ) {
				if( (request.headers['content-type'] || '').indexOf('multipart/form-data') === 0 && ( request.method == 'POST' || request.method == 'PUT' ) ) {
					var hex		= request.postData.toString('hex', 0, request.postData.length);
					var data	= hex.fromHex().parseMultipartFormData(true,false,true,hex);
					request.urlObject.post_vars	= data._post;
					// urlObj.post_vars.data	= request.postData.toString('hex', 0, request.postData.length);
					request.urlObject.file_vars	= data._files;
				} else {
					request.urlObject.post_vars	= request.postData.toString('utf-8', 0, request.postData.length).parseUrlVars(true);
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

		response.redirect	= function(url, status) {
			return root.redirect( response, url, ( status || 302 ) );
		};

		var postDataCallbacks	= [];
		var postDataStatus	= 'pending';
		var postDataColect	= function (request, callback, maxPostSize) {
			if (postDataStatus == 'progress') {
				postDataCallbacks.push(callback);
				return;
			} else if (postDataStatus == 'pending') {
				postDataStatus	= 'progress';
				postDataCallbacks.push(callback);
			} else if (postDataStatus == 'done') {
				callback();
				return;
			} else if (postDataStatus == 'error') {
				callback();
				return;
			};
			if (typeof(maxPostSize) !== "number") {
				maxPostSize	= root.maxPostSize;
			}
			request.on("data", function(chunk) {
				// request.postData += chunk;
				// console.log(maxPostSize, " :: ", chunk);
				// if(request.postDataState) {
					if( request.postData.length + chunk.length <= maxPostSize ) {
						request.postData	= Buffer.concat([request.postData, chunk]);
					} else {
						// request.postDataState	= false;
						if(!root.onMaxPostSize( request, response, appInstance, action )) {
							var e;
							try {
								request.abort();
							} catch(e) {};
							return false;
						}
					}
				// }
			});
			request.on("error", function(err) {
				postDataStatus	= 'error';
				postDataCallbacks.forEach(function (cb) {
					cb();
				});
				appInstance.console.error(err);
				var er;
				try {
					request.end();
				} catch (er) {
					// appInstance.console.error(er);
				};
			});
			request.on("end", function() {
				postDataStatus	= 'done';
				postDataCallbacks.forEach(function (cb) {
					cb();
				});
			});
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
				controller	= moduleObject.getController(request.controller);
			}
			if( controller !== false ) {
				var action	= controller.getAction( request.controllerAction );
				if( action !== false && action.isPublic() ) {
					if( !action.usePostData() ) {
						action.run( request, response );
						// console.log(action);
						if( !action.autoClose() )
							response.end();
					} else {
						postDataColect(request, function () {
							// if( request.postDataState ) {
								action.run( request, response );
							// }
							if( !action.autoClose() )
								response.end();
						}, action.maxPostSize());
					}
				} else {
					root.handleStaticResponse( request, response );
				}
			} else {
				root.handleStaticResponse( request, response );
			}
		};

		if (request.method === "GET") {
			root.runHttpListners("get", request, response, function () {
				mvcRun();
			});
		} else if (request.method === "POST") {
			root.runHttpListners("post", request, response, function () {
				mvcRun();
			}, function (cb) {
				// console.log("POST Data ::Start");
				postDataColect(request, function () {
					// console.log("POST Data ::callback");
					cb();
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
		};
		return route;
	},
	routeMatch	: function (route, url) {
		if (route === false) {
			return true;
		} else {
			url	= (url || '');
			var i, c;
			for (i=0;i<route.length;i++) {
				if (typeof(route[i]) === "string") {
					c	= url[route[i].length];
					// appInstance.console.info("LAST Char", url.substring(0, route[i].length), " === ", route[i], ':', c, ':', route[i][route[i].length - 1]);
					if (
						( url.substring(0, route[i].length).replace(/\?$/, '/') === route[i] ) &&
						( c === undefined || c === "?" || c === "/" || route[i][route[i].length - 1] === "/" )
					) {
						return true;
						break;
					}
				} else {
					if (url.match(route)) {
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
		response.writeHead( status, {
			'Location': url
		});
		response.end();
	}
};
var _appInstanceVars	= {};
var appInstance			= {
	console		: {
		log	: function() {
			if (_config.debug) {
				var args = Array.prototype.slice.call(arguments);
				console.log.apply(console, args);
			}
		},
		info	: function() {
			if (_config.debug) {
				var args = Array.prototype.slice.call(arguments);
				args.unshift("\033[0;47;30m");
				args.push("\033[0m");
				console.log.apply(console, args);
			}
		},
		warn	: function() {
			if (_config.debug) {
				var args = Array.prototype.slice.call(arguments);
				args.unshift("\033[0;40;33m");
				args.push("\033[0m");
				console.log.apply(console, args);
			}
		},
		error	: function() {
			var args = Array.prototype.slice.call(arguments);
			console.log("\033[0;40;31m");
			console.error.apply(console, args);
			console.log("\033[0m");
		}
	},
	debug		: function( state ) {
		if( typeof( state ) != "undefined" )
			_config.debug	= !!state;
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
	use	: function (route, callback) {
		if (typeof(route) === "function") {
			callback	= route;
			route		= false;
		}
		route	= _config.routeNormalize(route);
		if (typeof(callback) === "function") {
			_config.httpListners["use"].push({
				route	: route,
				callback	: callback
			});
		}
	},
	get	: function (route, callback) {
		if (typeof(route) === "function") {
			callback	= route;
			route		= false;
		}
		route	= _config.routeNormalize(route);
		if (typeof(callback) === "function") {
			_config.httpListners["get"].push({
				route	: route,
				callback	: callback
			});
		}
	},
	post	: function (route, callback) {
		if (typeof(route) === "function") {
			callback	= route;
			route		= false;
		}
		route	= _config.routeNormalize(route);
		if (typeof(callback) === "function") {
			_config.httpListners["post"].push({
				route	: route,
				callback	: callback
			});
		}
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
				if (i !== "use") {
					_config.httpListners[i].push({
						route	: route,
						callback	: callback
					});
				}
			}
		}
	}
};


var controllerInstance	= require(_config.getLibPath()+'controller.js');
var viewerInstance		= require(_config.getLibPath()+'viewer.js');
var bootstrapInstance	= require(_config.cwd+'bootstrap.js');
var sessionInstance		= require(_config.getLibPath()+'session.js');
var templateMangerInstance	= require(_config.getLibPath()+"template-manager.js");


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
		};
		return _config.sessionExpire;
	},
	sessionDynCookieName	: function( name ) {
		if( typeof( name ) === "string" ) {
			_config.sessionCookieName	= name;
		};
		return _config.sessionCookieName;
	},
	sessionDynCookieDomain	: function( domain ) {
		if( typeof( domain ) === "string" || domain === false ) {
			_config.sessionCookieDomain	= domain;
		};
		return _config.sessionCookieDomain;
	},
	sessionDynAutoUpdate	: function( state ) {
		if( typeof( state ) !== "undefined" ) {
			_config.sessionAutoUpdate	= !!state;
		};
		return _config.sessionAutoUpdate;
	},
	sessionCookieName	: function( name ) {
		if( typeof( name ) === "string" ) {
			_config.sessionKey	= name;
		};
		return _config.sessionKey;
	},
	sessionSecretKey	: function( name ) {
		if( typeof( name ) === "string" ) {
			_config.sessionSecret	= name;
		};
		return _config.sessionSecret;
	},
	cookieSecretKey	: function( name ) {
		if( typeof( name ) === "string" ) {
			_config.cookieSecret	= name;
		};
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
	}
};

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
appInstance.templateManger					= new templateMangerInstance( appInstance.viewer );
moduleObject.handleServerResponse			= _config.handleServerResponse;
moduleObject.handleServerMidleware			= _config.handleServerMidleware;
moduleObject.handleStaticResponse			= _config.handleStaticResponse;
moduleObject.handleServerResponseLogic		= _config.handleServerResponseLogic;
moduleObject.debug							= appInstance.debug;
moduleObject.console						= appInstance.console;
moduleObject.templateManger					= appInstance.templateManger;
moduleObject.getVars						= appInstance.getVars;
moduleObject.onRequestCapture				= appInstance.onRequestCapture;
moduleObject.maxPostSize					= appInstance.maxPostSize;
moduleObject.onMaxPostSize					= appInstance.onMaxPostSize;
moduleObject.sessionManager					= new sessionInstance(true);
moduleObject._events						= appInstance._events;

moduleObject.use	= appInstance.use;
moduleObject.get	= appInstance.get;
moduleObject.post	= appInstance.post;
moduleObject.all	= appInstance.all;

appInstance._events.onError	= function( error, config ) {
	appInstance.console.error( error );
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

var moduleBuilder	= appBuilder();
moduleBuilder.app	= appBuilder;

module.exports	= moduleBuilder;
