


var app	= require(__dirname + '/../index.js');
var appVars	= app.getVars();

var server	= require("http").createServer(function( request, response, next ) {
	app.handleServerResponse( request, response, next );
});

app.sessionCookieName("ssid");
app.sessionDynCookieName("ssid");
app.sessionDynCookieDomain(false);
app.sessionDynAutoUpdate(true);
app.sessionDynExpire(60*60*2);

app.setRootPath( __dirname );
app.setPublicPath( __dirname+'/public');
app.setModulePath( __dirname+'/app/modules');
app.runBootstrap();

server.listen(8080);
