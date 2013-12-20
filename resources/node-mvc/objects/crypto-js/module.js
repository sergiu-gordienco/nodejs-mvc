var fs = require('fs');
var cache	= __dirname+'/cached.js';
if( !fs.existsSync(cache) ) {
	fs.writeFileSync(cache,'');
	var path	= __dirname+'/build/rollups';
	fs.readdirSync(path).forEach(function(item) {
		var stat	= fs.statSync(path+"/"+item);
		if( stat.isFile() && item.match(/\.js$/) ) {
			fs.appendFileSync(cache,fs.readFileSync(path+"/"+item,"utf-8")+"\n\n");
		}
	});
	fs.appendFileSync(cache,"\nmodule.exports = CryptoJS;\n");
}
module.exports	= require(cache);