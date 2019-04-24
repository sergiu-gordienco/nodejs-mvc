


// var app	= require("nodejs-mvc");
var app	= require(__dirname + "/../../index.js");
var appVars	= app.getVars();

var server	= require("http").createServer(function( request, response, next ) {
	app.handleServerResponse( request, response, next );
});

app.sessionDynCookieName("ssiddyn");
app.sessionDynCookieDomain(false);
app.sessionDynAutoUpdate(true);
app.sessionDynExpire(60*60*2);

app.setRootPath( __dirname );
app.setPublicPath( __dirname+'/public');
app.setModulePath( __dirname+'/app/modules');
app.runBootstrap();


server.listen(8080);

console.log("Lunching server on port 8080");
console.log("test on: http://localhost:8080");
