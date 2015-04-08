var _vars	= {
	i	: 0
};
module.exports	= {
	public	: true,
	capture	: function( request, response, app, controller, action ) {
		response.write('counter = '+(_vars.i++));
		response.end();
		// app.viewer.render( response, template );
		// controller.render( response, 'index');
	}
};