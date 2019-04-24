var _vars	= {
	pageviews	: 0
};
module.exports	= {
	public	: true,
	capture	: function( request, response, app, controller, action ) {
		// increasing pageviews
		controller.render(
			response,
			'index',
			{
				sessionDynId : request.sessionDyn.sessionId(),
				pageviews: (++_vars.pageviews)
			});
	}
};