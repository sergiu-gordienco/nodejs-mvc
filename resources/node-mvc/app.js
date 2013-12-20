


var _classes	= {
	http	: require('http'),
	fs		: require('fs'),
	url		: require('url'),
	os		: require('os')
};

var _configObject	= {
	debug	: true,
	controllers	: {},
	httpStates	: {},
	cwd		: __dirname+'/',
	rootPath: __dirname+'/',
	modulePath	: __dirname+'/modules/',
	publicPath	: false,
	getLibPath	: function() {
		return _configObject.cwd+'objects/';
	},
	request	: {
		urlObject	: false,
		controller	: 'index',
		action		: 'index',
		params		: []
	},
	handdleStaticResponse	: function( request, response ) {
		_classes.fs.readFile( _configObject.publicPath + request.url, function (err,data) {
			if (err) {
				response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
				response.end(JSON.stringify(err));
			return;
			} else {
				_classes.fs.stat(_configObject.publicPath + request.url, function (err, stat) {
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
	handdleServerResponse	: function( request, response ) {
		var url = request.url;
		var urlObj	= _classes.url.parse(url);
		var parts	= urlObj.path.split(/\//);
		_configObject.request.urlObject	= urlObj;
		_configObject.request.controller	= parts[1] || "index";
		_configObject.request.action		= parts[2] || "index";
		_configObject.request.params		= parts.slice(3).map(function(v) {
			var e,r;
			try {
				r = decodeURIComponent(v);
			} catch(e) {
				r = unescape(v);
			}
			return r;
		});
		request.session	= new sessionInstance( request, response, appInstance );
		request.cookies	= new cookiesInstance( request, response );
		// find controller and run action
		var controller	= moduleObject.getController(_configObject.request.controller);
		if( controller !== false ) {
			var action	= controller.getAction( _configObject.request.action );
			if( action !== false && action.isPublic() ) {
				action.run( request, response );
				// console.log(action);
				response.end();
			} else {
				_configObject.handdleStaticResponse( request, response );
			}
		} else {
			_configObject.handdleStaticResponse( request, response );
		}
	},
	_staticServer	: false
};
var _appInstanceVars	= {};
var appInstance			= {
	_functions	: {},
	_events		: {},
	getVars		: function() {
		return _appInstanceVars;
	},
	_classes	: {
		fs		: _classes.fs,
		url		: _classes.url,
		os		: _classes.os
	},
	getRequest	: function() {
		var req = {},i;
		for( i in _configObject.request ) {
			req[i]	= _configObject.request[i];
		}
		return req;
	}
};

// var net = require('net');
// var server = net.createServer(function (socket) {
//   socket.write('Echo server\r\n');
//   socket.pipe(socket);
// });
// server.listen(1337, '127.0.0.1');
var cookiesInstance	= require(_configObject.getLibPath()+'cookies.js')( _classes.http );
var serverObject	= _classes.http.createServer(function( request, response ) {
	_configObject.handdleServerResponse( request, response );
});
var controllerInstance	= require(_configObject.getLibPath()+'controller.js');
var viewerInstance		= require(_configObject.getLibPath()+'viewer.js');
var bootstrapInstance	= require(_configObject.cwd+'bootstrap.js');
var sessionInstance		= require(_configObject.getLibPath()+'session.js');


_classes.crypto	= require(_configObject.getLibPath()+"crypto-js/module.js");
appInstance._classes.crypto	= _classes.crypto;

var moduleObject	= {
	cwd		: function() {
		return _configObject.cwd;
	},
	setModulePath	: function(dir) {
		_configObject.modulePath	= dir.replace(/\/+$/)+'/';
		return true;
	},
	getModulePath	: function(dir) {
		return _configObject.modulePath;
	},
	setPublicPath	: function(dir) {
		_configObject.publicPath	= dir.replace(/\/+$/)+'/';
		return true;
	},
	getPublicPath	: function(dir) {
		return _configObject.publicPath;
	},
	setRootPath	: function(dir) {
		_configObject.rootPath	= dir.replace(/\/+$/)+'/';
		return true;
	},
	getRootPath	: function(dir) {
		return _configObject.rootPath;
	},
	getLibPath	: function() {
		return _configObject.getLibPath();
	},
	controllerExists	: function() {
		return ( moduleObject._functions.isValidIdentifier(arguments[0]) && arguments[0] in _configObject.controllers );
	},
	getController	: function( controllerName ) {
		if( moduleObject.controllerExists( controllerName ) ) {
			return _configObject.controllers[controllerName];
		}
		return false;
	},
	addController	: function( controllerName, options ) {
		if( moduleObject._functions.isValidIdentifier(controllerName) )
		if( !moduleObject.controllerExists(controllerName) ) {
			_configObject.controllers[controllerName]	= new controllerInstance( controllerName, options, appInstance );
			_configObject.controllers[controllerName]._setViewer( viewerInstance );
			return _configObject.controllers[controllerName];
		}
		return false;
	},
	removeController	: function( controllerName ) {
		if( _functions.isValidIdentifier( controllerName ) && moduleObject.controllerExists( controllerName ) ) {
			delete _configObject.controllers[controllerName];
			return true;
		}
		return false;
	},
	getServer	: function() {
		return serverObject;
	},
	runBootstrap	: function() {
		bootstrapInstance( moduleObject, moduleObject.getModulePath() );
	}
	// onHttpState( code [function], [vars] )
};

moduleObject._functions	= {
	isValidIdentifier	: function( id ) {
		return ( typeof(id) == "string" && id.match(/^[a-z][a-z0-9\-]+[a-z0-9]$/i) );
	}
};

appInstance._functions.isValidIdentifier	= moduleObject._functions.isValidIdentifier;
appInstance.structure						= moduleObject;
appInstance.viewer							= viewerInstance;
moduleObject.getVars						= appInstance.getVars;

appInstance._events.onError	= function( error ) {
	console.error( error );
};

module.exports	= moduleObject;