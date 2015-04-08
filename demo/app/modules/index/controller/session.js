var _vars	= {
	i	: 0
};
module.exports	= {
	public	: true,
	capture	: function( request, response, app, controller, action ) {
		// 
		// response.write('counter = '+(_vars.i++));
		// app.viewer.render( response, template );
		// console.dir( request );
		response.end( JSON.stringify({
			ip	: request.sessionDyn.ip(),
			session	: request.sessionDyn.sessionId()
		}) );
	}
};