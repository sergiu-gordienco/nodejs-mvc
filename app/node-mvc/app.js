


var _classes	= {
	http	: require('http'),
	fs		: require('fs'),
	url		: require('url')
};

var configObject	= {
	debug	: true,
	controllers	: {},
	httpStates	: {
		// code : function() {}
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
		configObject.request.urlObject	= urlObj;
		configObject.request.controller	= parts[1] || "index";
		configObject.request.action		= parts[2] || "index";
		configObject.request.params		= parts.slice(3).map(function(v) {
			var e,r;
			try {
				r = decodeURIComponent(v);
			} catch(e) {
				r = unescape(v);
			}
			return r;
		});
		// find controller and run action
		response.write(JSON.stringify(configObject.request));
		response.end('Hello World\n');
	}
};

// .listen(1337, '127.0.0.1')
var serverObject	= _classes.http.createServer(function( request, response ) {
	configObject.handdleServerResponse( request, response );
});

// var net = require('net');
// var server = net.createServer(function (socket) {
//   socket.write('Echo server\r\n');
//   socket.pipe(socket);
// });
// server.listen(1337, '127.0.0.1');

var controllerInstance	= require('./objects/controller');
var appInstance			= {
	_functions	: {},
	_events		: {}
};

var moduleObject	= {
	controllerExists	: function() {
		return ( moduleObject._functions.isValidIdentifier(arguments[0]) && arguments[0] in configObject.controllers );
	},
	addController	: function( controllerName, options ) {
		if( moduleObject._functions.isValidIdentifier(controllerName) )
		if( !moduleObject.controllerExists(controllerName) ) {
			configObject.controllers[controllerName]	= new controllerInstance( controllerName, options, appInstance );
			return configObject.controllers[controllerName];
		}
		return false;
	},
	removeController	: function( controllerName ) {
		if( _functions.isValidIdentifier( controllerName ) && moduleObject.controllerExists( controllerName ) ) {
			delete configObject.controllers[controllerName];
			return true;
		}
		return false;
	},
	getServer	: function() {
		return serverObject;
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