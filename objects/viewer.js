/*
	mode
		file
		text
*/

var _classes	= {
	fs		: require('fs'),
	facebox	: require(__dirname+'/facebox-templates.js')()
};

var buildViewer	= function () {

	var _configObject	= {
		envVars	: {}
	};

	var moduleObject	= {
		debugMode	: function (status) {
			return _classes.facebox.debugMode(status);
		},
		getEnvVars	: function() {
			return _configObject.envVars;
		},
		updateEnvVars	: function( data ) {
			var i;
			for( i in data )
				_configObject.envVars[i]	= data[i];
			_classes.facebox.updateEnvVars(_configObject.envVars);
		},
		renderCode	: function (code, vars, virtualFilePath, cb) {
			return _classes.facebox.renderCode(code, vars, virtualFilePath, cb);
		},
		render	: function( response, view, options ) {
			// { name, path, code }
			var getStackTrace = function() {
				var obj = {};
				Error.captureStackTrace(obj, getStackTrace);
				return obj.stack;
			};
			var err;
			if( view.path.match(/\.(tpl|fbx-tpl)$/) ) {
				// _classes.facebox.updateEnvVars(_configObject.envVars);
				// _classes.facebox.updateEnvVars({ response: response });
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
					if (!response.headersSent) {
						response.set('Content-Type', 'text/html; charset=utf-8');
					}
					if (!response.finished) {
						response.write(html, function (err) {
							if (err) console.error(err);
							response.end();
						});
					} else {
						console.log("Write Response but it is Finished", getStackTrace());
					}
				});
			} else {
				if (!response.headersSent) {
					response.set('Content-Type', 'text/html; charset=utf-8');
				}
				if (!response.finished) {
					response.write(_classes.fs.readFileSync( view.path ), function (err) {
						if (err) console.error(err);
						response.end();
					});
				} else {
					console.log("Write Response but it is Finished", getStackTrace());
				}
			}
		}
	};
	return moduleObject;
};

module.exports	= buildViewer;
