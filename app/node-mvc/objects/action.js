module.exports	= function( actionName, options, appInstance ) {
	var _config	= {
		"public"	: false
	};
	var actionObject	= {
		isPublic	: function() {
			return !!(_config.public);
		}
	};
};