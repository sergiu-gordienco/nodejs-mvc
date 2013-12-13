var _vars	= {
	i	: 0
};
module.exports	= {
	public	: true,
	capture	: function( request, response, app, controller, action ) {
		// 
		// app.getRequest()
		response.write('counter = '+(_vars.i++));
		// app.viewer.render( response, template );
	}
};