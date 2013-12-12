
var http	= require('http');
var fs		= require('fs');

var configObject	= {
	debug	: true,
	controllers	: {},
	httpStates	: {
		// code : function() {}
	}
};

// .listen(1337, '127.0.0.1')
var serverObject	= http.createServer(function( request, response ) {
	// request.url
	// response.writeHead(200, {'Content-Type': 'text/plain'});
	// response.write('');
	response.end('Hello World\n');
});

// var net = require('net');
// var server = net.createServer(function (socket) {
//   socket.write('Echo server\r\n');
//   socket.pipe(socket);
// });
// server.listen(1337, '127.0.0.1');

var _functions	= {
	isValidIdentifier	: function( id ) {
		return ( typeof(id) == "string" && id.match(/^[a-z][a-z0-9\-]+[a-z0-9]$/i) );
	}
};

var actionInstance		= require('./objects/action');

var controllerInstance	= require('./objects/controller');


module.exports	= {
	controllerExists	: function() {
		return ( _functions.isValidIdentifier(arguments[0]) && arguments[0] in configObject.controllers );
	},
	addController	: function( controllerName, options ) {
		if( _functions.isValidIdentifier(controllerName) )
		if( !this.controllerExists(controllerName) ) {
			configObject.controllers[controllerName]	= new controllerInstance( controllerName, options );
			return true;
		}
		return false;
	},
	removeController	: function( controllerName ) {
		if( _functions.isValidIdentifier( controllerName ) && this.controllerExists( controllerName ) ) {
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