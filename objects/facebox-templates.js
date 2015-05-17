/*
	On template Rendering we have
	following variables
	
	var vars	= {}; // variables that a sent from controllers
	var env		= {
		error	: [],
		vars	: envVars,
		path	: "", // filePath
		dirname	: "", // dirname
		render	: function( text, vars, env ) {}, // render function
		renderFile	: function( file, vars, callback ) {}, // render file function
			// callback( error {{ [] or false }}, htm)
	};
	env.vars = {
		// env varssent from app
		response : [object] // http reponse object 
	}
*/
var faceboxTemplate	= function() {
	var _fs		= require('fs');
	var root	= this;
	var includeLevel	= 10;
	var envVars			= {};
	var publicObject	= {
		setIncludeLevel	: function( level ) {
			if( typeof(level) === "number" )
				includeLevel	= level;
		},
		getIncludeLevel	: function() {
			return includeLevel;
		},
		getEnvVars	: function() {
			return envVars;
		},
		updateEnvVars	: function( data ) {
			var i;
			for( i in data )
			envVars[i]	= data[i];
		},
		render		: function( text, vars, env ) {
			vars	= vars || {};
			var tpl	= { text: text };
			var replacers	= [];
			var err			= false;
			var parseAddr	= function( addr ) {
				var err, path = false;
				if( addr.subs(1) == ":" ) {
					path = env.dirname.replace(/\/+$/,'')+'/'+addr.subs(1,0);
				} else {
					try {
						var f	= new Function("var env	= arguments[1];var vars = arguments[0];\n return "+addr);
						path = f(vars,env);
					} catch(err) {
						throw {
							message	: "Unable to eval path:\n"+addr,
							error	: err
						}
					}
				}
				// console.log('Include Template: ', addr, path);
				return path;
			}
			try {
				text = text.replace(/\{\{(read|read\-base64|read\-hex)\:(.*?)\}\}/g,function (match, p1, p2, offset, string) {
					var x	= '[[replacer-'+Math.floor(Math.random()*10000000)+'-'+Math.floor(Math.random()*10000000)+'-'+new Date().valueOf()+']]';
					replacers.push({ id : x, type : 'action-'+p1, param : p2 });
					return x;
				});
			} catch(err) {
				env.error.push(err);
			}
			try {
				text = text.replace(/\{\{(include)\:(.*?)\}\}/g,function (match, p1, p2, offset, string) {
					return _fs.readFileSync( parseAddr(p2), { encoding: "utf-8" } );
				});
			} catch(err) {
				env.error.push(err);
			}
			try {
				text = text.replace(/\{\{(render)\:(.*?)\}\}/g,function (match, p1, p2, offset, string) {
					var addr	= parseAddr(p2);
					return publicObject.render( _fs.readFileSync(addr, { encoding: "utf-8" }), vars, {
						error	: env.error,
						vars	: envVars,
						path	: addr,
						dirname	: ((addr).replace(/[^\/]+$/,'')+'/').replace(/^\/+$/,'/'),
						render	: env.render,
						renderFile	: env.renderFile
					});
				});
			} catch(err) {
				env.error.push(err);
			}
			try {
				text = text.replace(/\{(code|js\-return|eval|js\-script|css\-style)\}([\s\S]*?)\{\/\1\}/g,function (match, p1, p2, offset, string) {
					var x	= '[[replacer-'+Math.floor(Math.random()*10000000)+'-'+Math.floor(Math.random()*10000000)+'-'+new Date().valueOf()+']]';
					replacers.push({ id : x, type : p1, code : p2 });
					return x;
				});
			} catch(err) {
				env.error.push(err);
			}
			try {
				text = text.replace(/\{\{([\s\S]*?)\}\}/g,function (match, p1, offset, string) {
					var x	= '[[replacer-'+Math.floor(Math.random()*10000000)+'-'+Math.floor(Math.random()*10000000)+'-'+new Date().valueOf()+']]';
					replacers.push({ id : x, type : 'js-return', code : 'return '+p1 });
					return x;
				});
			} catch(err) {
				env.error.push(err);
			}
			var i;
			for(i=0;i<replacers.length;i++) try {
				switch(replacers[i].type) {
					case 'code':
						text = text.split(replacers[i].id).join(replacers[i].code);
				break;
					case 'js-return':
						try {
							text	= text.split(replacers[i].id).join((new Function("var vars = arguments[0];var env = arguments[1];\n"+replacers[i].code ))( vars, env ));
						} catch(err) {
							env.error.push(err);
						}
				break;
					case 'eval':
						try {
							(new Function("var vars = arguments[0];var env = arguments[1];\n"+replacers[i].code ))( vars, env );
						} catch(err) {
							env.error.push(err);
						}
						text = text.split(replacers[i].id).join('');
				break;
					case 'js-script':
						text = text.split(replacers[i].id).join('<script type="text/javascript" charset="utf-8">\n'+replacers[i].code+'\n</script>');
				break;
					case 'css-style':
						text = text.split(replacers[i].id).join('<style type="text/css">\n'+replacers[i].code+'\n</style>');
				break;
					case 'action-read':
						text = text.split(replacers[i].id).join(_fs.readFileSync( parseAddr(replacers[i].param), { encoding: "utf-8"}));
				break;
					case 'action-read-base64':
						text = text.split(replacers[i].id).join(_fs.readFileSync( parseAddr(replacers[i].param), { encoding: "utf-8"}).base64encode());
				break;
					case 'action-read-hex':
						text = text.split(replacers[i].id).join(_fs.readFileSync( parseAddr(replacers[i].param), { encoding: "utf-8"}).toHex());
				break;
				}
			} catch(err) {
				env.error.push(err);
			}
			return text;
		},
		renderFile	: function( filePath, options, callback ) {
			var code	= _fs.readFileSync( filePath, { encoding : "utf-8" });
			var env		= {
				error	: [],
				vars	: envVars,
				path	: filePath,
				dirname	: (filePath.replace(/[^\/]+$/,'')+'/').replace(/^\/+$/,'/'),
				render	: publicObject.render,
				renderFile	: publicObject.renderFile
			};
			var html	= publicObject.render( code, options, env );
			(callback)( env.error.length ? env.error : undefined, html );
		}
	};
	return publicObject;
};
module.exports	= new faceboxTemplate();
