


var _classes	= {
	fs		: require('fs'),
	url		: require('url'),
	os		: require('os'),
	merge	: require('utils-merge'),
	cookie	: require('cookie'),
	cookieParser	: require('cookie-parser'),
	cookieSignature	: require('cookie-signature'),
	expressSession	: require('express-session')
};


var responseCookie	= function (res, req) {
	res.get = function(field){
		return this.getHeader(field);
	};

	res.set =
	res.header = function header(field, val) {
		if (arguments.length === 2) {
			if (Array.isArray(val))
				val = val.map(String);
			else
				val = String(val);
			if ('content-type' == field.toLowerCase() && !/;\s*charset\s*=/.test(val)) {
				var charset = mime.charsets.lookup(val.split(';')[0]);
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

	res.append = function append(field, val) {
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
		var secret = this.req.secret;
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
};



var _config	= {
	debug	: true,
	// dyn session
	sessionExpire	: 600,
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
	handleStaticResponse	: function( request, response ) {
		var url	= request.url.replace(/\?[\s\S]*$/, '');
		_classes.fs.readFile( _config.publicPath + url, function (err,data) {
			if (err) {
				response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
				response.end(JSON.stringify(err));
			return;
			} else {
				_classes.fs.stat(_config.publicPath + url, function (err, stat) {
					if (err) {
						response.statusCode = 500;
						response.end();
					} else {
						var etag = stat.size + '-' + Date.parse(stat.mtime);
						response.setHeader('Last-Modified', stat.mtime);
						if (request.headers['if-none-match'] === etag) {
							response.statusCode = 304;
							response.end();
						} else {
							response.setHeader('Content-Length', data.length);
							response.setHeader('ETag', etag);
							response.statusCode = 200;
							response.end(data);
						}
					}
				});
			}
		});
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
				if (typeof(next) === "function") {
					return next(err, {
						request	: request,
						response	: response
					});
				} else {
					if (!root.quiteHandler) {
						throw err;
					} else {
						console.error(err);
					}
				}
			} else {
				if (typeof(next) === "function") {
					return next(request, response);
				} else {
					console.error(new Error("No request handler"));
				}
			};
			// console.log("Cookies", arguments);
			if (request)
				request.secret	= root.cookieSecret || root.sessionSecret;
			if (request && response)
				response.req	= request;
			responseCookie(response);
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
							console.error(err);
						}
					}
				} else {
					if (typeof(next) === "function") {
						return next(request, response);
					} else {
						console.error(new Error("No request handler"));
					}
				};
				// console.log("Session", arguments);
				// console.log("Request", request);
				// console.log("Response", response);
			});
		});
	},
	handleServerResponse		: function (request, response, next) {
		var root	= _config;
		root.handleServerMidleware(request, response, function () {
			_config.handleServerResponseLogic(request, response, next);
		});
	},
	handleServerResponseLogic	: function( request, response, next ) {
		var root	= this;
		var url		= request.url;
		var urlObj	= url.parseUrl(true);
		var parts	= urlObj.pathname.split(/\//);
		request.urlObject	= urlObj;
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
			return urlObj.get_vars;
		};
		request.postData	= new Buffer(0);
		request.postVars	= function() {
			if( !( "post_vars" in urlObj ) ) {
				if( (request.headers['content-type'] || '').indexOf('multipart/form-data') === 0 && ( request.method == 'POST' || request.method == 'PUT' ) ) {
					var hex		= request.postData.toString('hex', 0, request.postData.length);
					var data	= hex.fromHex().parseMultipartFormData(true,false,true,hex);
					urlObj.post_vars	= data._post;
					// urlObj.post_vars.data	= request.postData.toString('hex', 0, request.postData.length);
					urlObj.file_vars	= data._files;
				} else {
					urlObj.post_vars	= request.postData.toString('utf-8', 0, request.postData.length).parseUrlVars(true);
					urlObj.file_vars	= {};
				}
			}
			return urlObj.post_vars;
		};
		request.fileVars	= function() {
			if( !( "file_vars" in urlObj ) ) {
				request.postVars();
			}
			return urlObj.file_vars;
		};
		request.sessionDyn	= new sessionInstance( request, response, appInstance, {
				expire			: root.sessionExpire,
				cookieName		: root.sessionCookieName,
				cookieDomain	: root.sessionCookieDomain
			} );
		if( root.sessionExpire && root.sessionAutoUpdate ) {
			request.sessionDyn.setExpire( root.sessionExpire );
		}
		response.redirect	= function(url, status) {
			return root.redirect( response, url, ( status || 302 ) );
		}
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
					request.postDataState	= true;
					// console.log('MaxPostSize: ',action.maxPostSize());
					request.on("data", function(chunk) {
						// request.postData += chunk;
						// console.dir(chunk);
						if(request.postDataState) {
							if( request.postData.length + chunk.length <= action.maxPostSize() ) {
								request.postData	= Buffer.concat([request.postData, chunk])
							} else {
								request.postDataState	= false;
								if(!root.onMaxPostSize( request, response, appInstance, action )) {
									var e;
									try {
										request.abort();
									} catch(e) {};
									return false;
								}
							}
						}
					});
					request.on("end", function() {
						if( request.postDataState ) {
							action.run( request, response );
						}
						if( !action.autoClose() )
							response.end();
					});
				}
			} else {
				root.handleStaticResponse( request, response );
			}
		} else {
			root.handleStaticResponse( request, response );
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
			if (_config.debug)
				console.log(arguments);
		},
		info	: function() {
			if (_config.debug)
				console.info(arguments);
		},
		warn	: function() {
			if (_config.debug)
				console.warn(arguments);
		},
		error	: function() {
			console.error(arguments);
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
	onMaxPostSize	: function(f) {
		if( typeof(f) === "function" ) {
			_config.onMaxPostSize	= f;
			return true;
		}
		return false;
	},
	onRequestCapture	: function(f) {
		if( typeof(f) === "function" ) {
			_config.onRequestCapture	= f;
			return true;
		}
		return false;
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
	},
	handleServerResponse	: _config.handleServerResponse,
	handleServerMidleware	: _config.handleServerMidleware
};

moduleObject._functions	= {
	isValidIdentifier	: function( id ) {
		return ( typeof(id) == "string" && id.match(/^[a-z][a-z0-9\-]+[a-z0-9]$/i) );
	}
};


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
moduleObject.debug							= appInstance.debug;
moduleObject.console						= appInstance.console;
moduleObject.templateManger					= appInstance.templateManger;
moduleObject.getVars						= appInstance.getVars;
moduleObject.onRequestCapture				= appInstance.onRequestCapture;
moduleObject.onMaxPostSize					= appInstance.onMaxPostSize;
moduleObject.sessionManager					= new sessionInstance(true);


appInstance._events.onError	= function( error ) {
	console.error( error );
};

module.exports	= moduleObject;
