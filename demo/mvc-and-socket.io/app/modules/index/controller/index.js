var _vars	= {
	i	: 0
};
module.exports	= {
	public	: true,
	capture	: function( request, response, app, controller, action ) {
		// app.viewer.render( response, template );
		controller.render( response, 'index');
	}
};