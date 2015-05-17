module.exports	= function( viewer ) {
	var _templates	= {};
	var _configObject	= {
		viewer	: viewer
	};
	var publicObject	= {
		templateExists	: function(t) {
			return ( t in _templates );
		},
		remove	: function(t) {
			if( t in _templates )
				delete _templates[t];
		},
		add	: function(t,path) {
			_templates[t]	= {
				name	: t,
				path	: path
			};
		},
		addList	: function(o) {
			var i;
			for( i in o )
			publicObject.add(i,o[i]);
		},
		get	: function(t) {
			if( t in _templates )
				return _templates[t];
			return false;
		},
		render	: function( response, templateName, options ) {
			if( templateName in _templates ) {
				_configObject.viewer.render( response, _templates[templateName], ( options || {} ) );
				response.end();
			} else {
				if (!response.headersSent) {
					response.writeHead('404','Content-type: text/plain; charset=utf-8');
				}
				response.end('Page not found');
			}
		}
	};
	return publicObject;
};
