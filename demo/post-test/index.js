


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


app.use('/test', function (req, res, next) {
	res.write("IP "+(req.connection.remoteAddress)+"\n");
	next();
});
app.use('/test', function (req, res, next) {
	res.write('use-test :: ' + req.url + "\n");
	next();
});

app.get("/test/", function (req, res, next) {
	res.write("test GET\n");
	next();
});

app.post("/test/", function (req, res, next) {
	res.write("test POST\n"+JSON.stringify(req.postVars()));
	res.write("\n\ntest Files\n"+JSON.stringify(req.fileVars()));
	next();
});

app.all("/test/", function (req, res, next) {
	res.end("\n\nMethod: "+req.method);
});

server.listen(8080);

console.log("Lunching server on port 8080");
console.log("test on: http://localhost:8080");
