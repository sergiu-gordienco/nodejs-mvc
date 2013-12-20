/*
	mode
		file
		text
*/

var _classes	= {
	jade	: require('jade'),
	less	: require('less'),
	fs		: require('fs')
};

var _configObject	= {};

module.exports	= {
	render	: function( response, view, options ) {
		// { name, path, code }
		if( view.path.match(/\.jade$/) ) {
			_classes.jade.renderFile( view.path, options, function (err, html) {
				if (err) throw err;
				response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
				response.write(html);
			});
		} else {
			response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
			response.write(_classes.fs.readFileSync( view.path ));
		}
	}
};