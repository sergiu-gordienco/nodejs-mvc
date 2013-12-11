var fs	= require('fs');
var appPath	= './app/modules/';
module.exports	= function( app ) {
	var actionName, stats, configFile, controller;
	fs.readdirSync(appPath).forEach(function(folder) {
		stats = fs.statSync(appPath+folder);
		if(stats.isDirectory()) {
			// scan for views

			// scan for js actions

			// check if exista other bootstrap file
			var configFile	= appPath+folder+"/config.js";
			if( fs.existsSync(configFile) ) {
				controller	= app.addController(folder, require(configFile));
				console.log('Controller: ', folder);
				fs.readdirSync(appPath+folder+"/controller/").forEach(function(item) {
					stats = fs.statSync(appPath+folder+"/controller/"+item);
					if(stats.isFile() && item.match(/\.js$/) ) {
						actionName	= item.replace(/\.js$/,'');
						console.log( '\t\taction » ', actionName );
					}
				});
			}
		}
	});
};