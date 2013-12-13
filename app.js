


var app	= require('./app/node-mvc/app.js');

app.setRootPath( __dirname );
app.setModulePath( __dirname+'/app/modules');
app.runBootstrap();

app.getServer().listen(1234,'localhost');