


var app	= require('./app/node-mvc/app.js');

(require('./bootstrap'))(app);

app.getServer().listen(1234,'localhost');