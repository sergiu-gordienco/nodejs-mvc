


var app	= require('./resources/node-mvc/app.js');
var appVars	= app.getVars();

app.setRootPath( __dirname );
app.setPublicPath( __dirname+'/public');
app.setModulePath( __dirname+'/app/modules');
app.runBootstrap();

// app.getServer().listen(80,'localhost');
app.getServer().listen(8080);
