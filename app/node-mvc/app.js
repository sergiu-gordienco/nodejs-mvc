


var _classes	= {
	http	: require('http'),
	fs		: require('fs'),
	url		: require('url')
};

var _configObject	= {
	debug	: true,
	controllers	: {},
	httpStates	: {
		// code : function() {}
	},
	cwd		: __dirname+'/',
	rootPath: __dirname+'/',
	modulePath	: __dirname+'/modules/',
	getLibPath	: function() {
		return _configObject.cwd+'objects/';
	},
	request	: {
		urlObject	: false,
		controller	: 'index',
		action		: 'index',
		params		: []
	},
	handdleServerResponse	: function( request, response ) {
		response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
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
		// find controller and run action
		response.write(JSON.stringify(_configObject.request));
		response.end('Hello World\n');
	}
};

// .listen(1337, '127.0.0.1')
var serverObject	= _classes.http.createServer(function( request, response ) {
	_configObject.handdleServerResponse( request, response );
});

var appInstance			= {
	_functions	: {},
	_events		: {}
};

// var net = require('net');
// var server = net.createServer(function (socket) {
//   socket.write('Echo server\r\n');
//   socket.pipe(socket);
// });
// server.listen(1337, '127.0.0.1');

var controllerInstance	= require(_configObject.getLibPath()+'controller.js');
var viewerInstance		= require(_configObject.getLibPath()+'viewer.js');
var bootstrapInstance	= require(_configObject.cwd+'bootstrap.js');

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

appInstance._events.onError	= function( error ) {
	console.error( error );
};

module.exports	= moduleObject;