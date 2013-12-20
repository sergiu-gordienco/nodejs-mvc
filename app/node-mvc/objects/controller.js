var actionInstance		= require('./action');

module.exports	= function( controllerName, options, appInstance ) {
	var _config	= {};
	var _views	= {};
	var _actions	= {};
	_config.controllerName	= controllerName;
	var _viewer	= false;
	var _vars	= false;
	if( 'vars' in options ) {
		_vars	= options.vars;
	} else {
		_vars	= {};
	}

	// options._onAction( actionName, controllerObject );
	// options._noAction( actionName, controllerObject );
	// console.log(configObject);
	var controllerObject	= {
		_setViewer	: function( o ) {
			if( _viewer === false ) {
				_viewer	= o;
			}
		},
		getViewer	: function() {
			return _viewer;
		},
		getName	: function() {
			return controllerName;
		},
		getView	: function( viewName ) {
			if( appInstance._functions.isValidIdentifier( viewName ) && viewName in _views ) {
				return _views[viewName];
			}
			return false;
		},
		viewExists	: function( viewName ) {
			return ( appInstance._functions.isValidIdentifier( viewName ) && viewName in _views );
		},
		addView		: function( viewName, viewPath, viewCode ) {
			if( appInstance._functions.isValidIdentifier( viewName ) && !controllerObject.viewExists( viewName ) ) {
				_views[viewName]	= {
					name	: viewName,
					path	: viewPath,
					code	: viewCode
				};
				return _views[viewName];
			}
			console.log( _views );
		},
		render	: function( response, viewName, options ) {
			if( _viewer && appInstance._functions.isValidIdentifier( viewName ) && controllerObject.viewExists( viewName ) ) {
				_viewer.render( response, controllerObject.getView( viewName ), options );
			}
		},
		removeView	: function( viewName ) {
			if( controllerObject.actionExists( viewName ) ) {
				delete	_views[viewName];
				return true;
			}
			return false;
		},
		getAction	: function( actionName ) {
			if( appInstance._functions.isValidIdentifier( actionName ) && actionName in _actions ) {
				return _actions[actionName];
			}
			return false;
		},
		actionExists	: function( actionName ) {
			return ( appInstance._functions.isValidIdentifier( actionName ) && actionName in _actions );
		},
		addAction	: function( actionName, options ) {
			if( appInstance._functions.isValidIdentifier( actionName ) && !controllerObject.actionExists( actionName ) ) {
				_actions[actionName]	= new actionInstance( actionName, controllerObject, options, appInstance );
				return _actions[actionName];
			}
			return false;
		},
		removeAction	: function( actionName ) {
			if( controllerObject.actionExists( actionName ) ) {
				delete	_actions[actionName];
				return true;
			}
			return false;
		},
		getVars	: function() {
			return _vars;
		}
	};
	return controllerObject;
};