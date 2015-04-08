/*
	mode
		file
		text
*/

var _classes	= {
	fs		: require('fs'),
	facebox	: require(__dirname+'/facebox-templates.js')
};

var _configObject	= {
	envVars	: {}
};

var moduleObject	= {
	getEnvVars	: function() {
		return _configObject.envVars;
	},
	updateEnvVars	: function( data ) {
		var i;
		for( i in data )
			_configObject.envVars[i]	= data[i];
	},
	render	: function( response, view, options ) {
		// { name, path, code }
		if( view.path.match(/\.(tpl|fbx-tpl)$/) ) {
			_classes.facebox.updateEnvVars(_configObject.envVars);
			_classes.facebox.updateEnvVars({ response: response });
			_classes.facebox.renderFile( view.path, options, function( err, html ) {
				if (err) {
					if(isArray(err)) {
						err.forEach(function(v) {
							throw v;
						})
					} else {
						throw err;
					}
				}
				response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
				response.write(html);
			});
		} else if( view.path.match(/\.(jade)$/) ) {
			// html	= jade.renderFile('path/to/file.jade', options);
			// TODO
			// _classes.facebox.updateEnvVars(_configObject.envVars);
			// _classes.facebox.updateEnvVars({ response: response });
			// _classes.facebox.renderFile( view.path, options, function( err, html ) {
			// 	if (err) {
			// 		if(isArray(err)) {
			// 			err.forEach(function(v) {
			// 				throw v;
			// 			})
			// 		} else {
			// 			throw err;
			// 		}
			// 	}
			// 	response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
			// 	response.write(html);
			// });
		} else {
			response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
			response.write(_classes.fs.readFileSync( view.path ));
		}
	}
};

module.exports	= moduleObject;
