var fs	= require('fs');
var _appPath	= __dirname+'/modules/';
module.exports	= function( app, appPath ) {
	if(!appPath) {
		appPath	= _appPath;
	}
	var actionName, stats, configFile, controller, action, view;
	fs.readdirSync(appPath).forEach(function(folder) {
		stats = fs.statSync(appPath+folder);
		if(stats.isDirectory()) {
			var configFile	= appPath+folder+"/config.js";
			if( fs.existsSync(configFile) ) {
				controller	= new app.addController(folder, require(configFile));
				console.log('Controller: ', folder);
				fs.readdirSync(appPath+folder+"/controller/").forEach(function(item) {
					stats = fs.statSync(appPath+folder+"/controller/"+item);
					if(stats.isFile() && item.match(/\.js$/) ) {
						actionName	= item.replace(/\.js$/,'');
						action = controller.addAction( actionName, require(appPath+folder+"/controller/"+item) );
						console.log( '\t\taction » ', actionName );
					}
				});
				fs.readdirSync(appPath+folder+"/views/").forEach(function(item) {
					stats = fs.statSync(appPath+folder+"/views/"+item);
					if(stats.isFile() && item.match(/\.(fbx\-tpl|tpl|html|htm|jade|mustache|handlebars|txt)$/) ) {
						view = controller.addView(
							item.replace(/\.[^\.]+$/,''),
							appPath+folder+"/views/"+item,
							fs.readFileSync(appPath+folder+"/views/"+item,"utf-8")
						);
						console.log( '\t\tview » ', view.name );
					}
				});
			}
		}
	});
};