var faceboxUpdateProto	= function( root ) {
	if( !root ) return false;


	root.isArray = function() {
		var b = true,r = false;
		var e;try{
			r	= (arguments[0].constructor == Array);
			b	= false;
		} catch(e) { b	= true; };
		if(b)try{
			if(typeof(arguments[0]) == 'object'){
				r	= (arguments[0].constructor.toString().toLowerCase().indexOf('array') != -1);
			}
			b	= false;
		} catch(e) { b	= true; };
		if(b)try {
			r	= Array.isArray(arguments[0]);
			b	= false;
		} catch(e) { b	= true; };
		if(b) return false;
		return r;
	};

	root.isString	= function(){if(arguments[0] === null) return false;if(typeof(arguments[0]) == 'string') return true;if(typeof(arguments[0])== 'object'){var criterion=arguments[0].constructor.toString().match(/string/i);return (criterion != null);}return false;};

	root.m_store	= {
		empty	: function(v,objectCheck){
			return (
				(!v)
				|| (typeof(v) == "string" && v.length == 0)
				|| (isArray(v) && v.length == 0)
				|| (v == false)
				|| (v == "0")
				|| ( objectCheck && m_store.json(v) == "{}" )
			);
		},
		is_numeric	: function(v) { return ( m_store.type(v) == "number" || ( m_store.type(v) == "string" && v.match(/^\d+$/) ) ); },
		type	: function(o){
			if(o === null) return 'null';
			switch(typeof(o)){
				case 'string'	:
				case 'boolean'	:
				case 'null'	:
				case 'undefined':
				case 'function'	:
				case 'number'	:
					return typeof(o);
				break;
				case 'object'	:
					if(o === null)	return 'null';
					if(isArray(o)) {
						return 'array';
					};
					if(isString(o)) {
						return 'string';
					};
					if( o instanceof RegExp )
						return 'regexp';
					return 'object';
				break;
			}
		},
		json_string_r	: "<>;,.|}{()[]?#^~$:=&*+_-@",
		json_string_m	: false,
		json	: function(o,z){
			if(!parseInt(z)){
				z = 5;
			} else {
				z = parseInt(z);
			};
			if(z > 0) {
				z--;
			} else {
				return 'null';
			};
			switch(typeof(o)){
				case 'string'	: return '"'+escape(o).replace(m_store.json_string_m,function(m,p1,o,s) {	return m_store.json_string_r[p1.toLowerCase()]; }).replace(/\%5c/gi,'\\\\').replace(/\%09/g,'\\t').replace(/\%0a/gi,'\\n').replace(/\%20/g,' ').replace(/\%22/g,'\\"').replace(/\x25u/g,'\\u').replace(/\x25/g,'\\u00')/* \x *//*.replace(/\x40/g,'\\u0040').replace(/\x2a/g,'\\u002a').replace(/\x2d/g,'\\u002d').replace(/\x5f/g,'\\u005f').replace(/\x2b/g,'\\u002b').replace(/\x2e/g,'\\u002e').replace(/\x2f/g,'\\u002f')*/+'"';	break;
				case 'number'	:
					if(parseInt(o))
					return ''+Math.floor((0+o)*1000000)/1000000;
					if(Infinity === o)	return 'Infinity';
					if(-Infinity === o)	return '-Infinity';
					if(parseFloat(o))	return ''+(Math.floor(parseFloat(o)*1000000)/1000000);
					if(o === 0)	return '0';
					return 'NaN';
				break;
				case 'boolean'	: return (o ? 'true' : 'false');	break;
				case 'null'	: return 'null';	break;
				case 'undefined'	: return 'null';	break;
				case 'object'	:
					if(o === null)	return 'null';
					if(isArray(o)) {
						var i,r = [];
						for(i=0;i<o.length;i++)	r.push(m_store.json(o[i],z));
						return '['+r.join(',')+']';
					};
					if(isString(o)) {
						return '"'+escape(o).replace(/\x25u/g,'\\u').replace(/\x25/g,'\\x')+'"';
					};
					if(1){
						var i,r = [];
						for(i in o)	r.push('"'+(''+i).split('"').join('\\"')+'":'+m_store.json(o[i],z));
						return '{'+r.join(',')+'}';
					}
				break;
				case 'function'	: var e;try{return o.toString();}catch(e){};return 'function(){}';	break;
			}
		},
		getv	: function(s,b) { var r=false,e,error=false; if( b ) { try { return JSON.parse(s); } catch(e) { error = true; }; return ( error ? null : r ); };try{eval('r = '+s);}catch(e){error=true};return (error ? null : r); }
	};


	root.objMerge	= function() {
		if(typeof(arguments[0]) == "object") {
			var i,j,k;for(i=1;i<arguments.length;i++)
				if(typeof(arguments[i]) == "object")
				for(j in arguments[i])
					if( arguments[i][j] === null ) {
						if(j in arguments[0]) try {
							delete arguments[0][j];
						} catch(k) {};
					} else {
						arguments[0][j]	= arguments[i][j];
					}
			return arguments[0];
		};
		return arguments[0];
	};


	root.objEncodeURL	= function(o,k) {
		var r = [],i;
			if(!k) k = "";
			if(isArray(o) && k) {
				for( i=0; i<o.length; i++ )
					r.push(root.objEncodeURL(o[i],""+k+"["+i+"]"));
			} else if( typeof(o) == "object" ) {
				for( i in o )
					r.push(root.objEncodeURL(o[i], ""+k+( k ? "[" : "" )+i+( k ? "]" : "" ) ));
			} else if( k ) {
				return ""+k+"="+encodeURIComponent(o);
			}
		return r.join('&');
	}



	((function(){
		var e,o={
			subs	: function(p,i){
			if(p < 0) return this.substring(this.length+p,( typeof(i) == "number" ? this.length+p+i : this.length ));
			if((i === 0 || i < 0) && p >=0) return this.substring(p,this.length+i);
			if(!i)	return this.substring(0,p);
			return this.substring(p,p+i);
			},
			toHex : function(utf8) {
				var s=this;var r="",e=s.length,c=0,h;
				while(c<e) {
					h=s.charCodeAt(c++).toString(16);
					if(h.length % 2 !== 0) {
						if( utf8 || typeof(utf8) == "undefined" ) {
							h=encodeURIComponent(s.charAt(c-1)).split('%').join('');
						} else {
							h = escape(s.charAt(c-1)).replace(/\%u/g,'').replace(/\%/g,'');
						}
						if( h.length % 2 ) {
							h = "0"+h;
						}
					}
					r+=h;
				}
				return r;
			},
			fromHex : function(){var s=this;if(s.length % 2)s='0'+s;var e;try{return unescape(s.replace(/([0-9A-Fa-f]{2})/gi,'%$1'));}catch(e){return '';}},
			toHtmlSimple	: function() { return this.replace(/\&/g, "&amp;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\"/g, "&quot;").replace(/\'/g, "&#039;"); },
			toHtml : function(){return escape(this).replace(/\%u([0-9a-f]{4})/gi,'&#x$1;').replace(/\%([0-9a-f]{2})/gi,'&#x$1;').replace(/\&\#x20\;/gi,' ');},
			fromHtml : function(){var e = document.createElement('div');e.innerHTML = '<textarea>'+this.replace(/\</g,'&lt;').replace(/\>/g,'&gt;')+'</textarea>';return e.getElementsByTagName('textarea')[0].value;},
			cleanTags	: function() {
				return this.replace(/\<\!\-\-[\s\S]*?\-\-\>/g,' ').replace(/\<(script|iframe|style|object|noscript|frame|frameset)[^\>]*?\>[\s\S]*?\<\/\1.*?\>/gi,'').replace(/\<[^\>]*\>/g,' ').replace(/\s{2,}/g,' ').fromHtml()
							},
			add_Class : function(x){x = new String(x);var s = ' '+this+' ';return (s.split(' '+x+' ').join(' ')+' '+x+' ').replace(/\s+/g,' ');},
			del_Class : function(x){x = new String(x);var s = ' '+this+' ';return s.split(' '+x+' ').join(' ').replace(/\s+/g,' ');},
			fnd_Class : function(x){x = new String(x);return ((' '+this+' ').indexOf(' '+x+' ') > -1);},
			swp_case : function(){return this.replace(/([a-z]+)|([A-Z]+)/g,function($0,$1,$2){return ($1) ? $0.toUpperCase() : $0.toLowerCase();});},
			ucfirst : function(k){ if(!k) k=1; return this.subs(0,k).toUpperCase()+this.subs(k,0);},
			lcfirst : function(k){ if(!k) k=1; return this.subs(0,k).toLowerCase()+this.subs(k,0);},
			utf8need : function() {
				if( escape(this).match(/\%u[a-zA-Z0-9]{4}/) ) return this.utf8encode();
				return this;
			},
			utf8encode : function() {
				var e;try {
					return unescape( encodeURIComponent( this ) );
				} catch(e) {}
				return this.replace(/[\u0080-\u07ff]/g,function(c){var cc = c.charCodeAt(0);return String.fromCharCode(0xc0 | cc>>6, 0x80 | cc&0x3f);}).replace(/[\u0800-\uffff]/g,function(c){var cc = c.charCodeAt(0);return String.fromCharCode(0xe0 | cc>>12, 0x80 | cc>>6&0x3F, 0x80 | cc&0x3f);});},
			utf8decode : function(strUtf) {
				var e;try {
					return decodeURIComponent( escape( this ) );
				} catch(e) {}
				return this.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,function(c){var cc = ((c.charCodeAt(0)&0x0f)<<12) | ((c.charCodeAt(1)&0x3f)<<6) | ( c.charCodeAt(2)&0x3f);return String.fromCharCode(cc);}).replace(/[\u00c0-\u00df][\u0080-\u00bf]/g,function(c){return String.fromCharCode((c.charCodeAt(0)&0x1f)<<6 | c.charCodeAt(1)&0x3f);});},
			toRegexp : function(flags){
				if(!flags) flags	= '';
				var e,r = false;try {
					eval("r = "+(this.match(/^\//) ? this : '/'+this+'/')+""+flags+" ;");
				} catch(e) { r = false; }
				return r;
			},
			escapeHex	: function() { return escape(this).replace(/\%u/g,'\\u').replace(/\%/g,'\\x'); },
			escape		: function() { return escape(this); },
			encodeURI	: function() { return encodeURIComponent(this); },
			unescape	: function() { return unescape(this); },
			decodeURI	: function() { return decodeURIComponent(this); },
			parseUrlVars	: function(json,params) {
				if(!params) params = {
					keepOBJ	: false,
					isURL	: false
				};
				var s = this;
				json	= !!json;
				if(params.isURL) s.replace(/^[\s\S]*?\?/,'');
				var r = {},p = s.split('&');
				p.forEach(function(v){
					var m;
					if(m = v.match(/^([^\=]+)\=([\s\S]*)$/)) {
						k = m[1];
						v = m[2];
						if(!json) {
							r[k]	= (v).decodeURI();
						} else {
							var a = [];
							var p = /^(\[([^\]]*)\]|([^\[]+))/,y;
							while( y = k.match(p) ) {
								if(!y[0]) break;
								k = k.replace(p,'');
								if(typeof(y[2]) != "undefined") {
									a.push(y[2]);
								} else {
									a.push( y[2] || y[3] );
								};
							};
							a = a.map(function(v) { if((""+v).match(/[^0-9]/))return '"'+(""+v).escapeHex()+'"'; return ""+v; });
							a.forEach(function(k,i,ar){
								var l;
								if(i > 0) {
									eval('l = r['+a.slice(0,i).join('][')+']');
								} else {
									l = r;
								};
								if(k == '') {
									if(isArray(l)) {
										k	= l.length;
									} else if( typeof(l) == "object" ) {
										k = 0;
										var i,n;for(i in l)
										if((""+i).match(/^\d+$/)) {
											n	= parseInt(i);
											if(k <= n)
												k = n+1;
										}
									};
									a[i] = k;
								};
								// transform array to obj
								if(isArray(l) && (""+k).match(/[^0-9]/)) {
									var t = {},n;
									for(n=0;n<l.length;n++)
										t[n]	= l[n];
									eval('r['+a.slice(0,i).join('][')+'] = t;');
								};
								if( i == a.length-1 ) {
									eval('r['+a.slice(0,i+1).join('][')+'] = v.decodeURI();');
								} else {
									eval('if(typeof(r['+a.slice(0,i+1).join('][')+']) == "undefined" || typeof(r['+a.slice(0,i+1).join('][')+']) == "string") r['+a.slice(0,i+1).join('][')+'] = '+( params.keepOBJ ? '{}' : '[]' )+';');
								};
							});
						};
					}
				});
				return r;
			},
			parseMultipartFormData	: function(json,params,postToUtf8, hexData) {
				if(!params) params = {
					keepOBJ	: false,
					isURL	: false
				};
				postToUtf8	= !!postToUtf8;
				var s = this;
				var boudsplit	= s.subs(s.indexOf('\r\n'));
				var s = '\r\n'+this;
				json	= !!json;
				if(params.isURL) s.replace(/^[\s\S]*?\?/,'');
				var _fileK	= 0;
				var rVars	= { _post: {}, _files : {} };
				var r,p = (s).split('\r\n'+boudsplit),m2;
				var vtype	= 'bin';
				p.forEach(function(v){
					var m;
					if(m = v.match(/^([\s\S]*?)\r\n\r\n([\s\S]*)$/)) {
						k = m[1];
						v = m[2];
						k = (function(header) {
							var m = header.match(/(\r\n|)Content\-Disposition\:\s+form\-data\;[^\n]*\sname\=\"(.*?)\"/);
							if( m )	return m[2];
							return ''+(_fileK++);
						})(m[1]);
						if( m2 = m[1].match(/(\r\n|)Content\-Disposition\:\s+form\-data\;[^\n]*\sfilename\=\"(.*?)\"/) ) {
							r = rVars._files;
							// is file;
							v = {
								fileName	: m2[2],
								contentType	: (function( header ) {
									var m = header.match(/(\r\n|)Content\-Type:\s+([^\r\n\;]+)/);
									if(m)	return m[2];
									return 'unknown/application';
								})(m[1]),
								fileSize	: v.length,
								fileData	: ( hexData ? new Buffer((function(hex,header,boudsplit) {
									var k	= (boudsplit+header).toHex().toLowerCase();
									hex		= '0d0a'+hex.toLowerCase();
									// console.log(hex.length, hex.indexOf(boudsplit.toHex().toLowerCase()));
									var p	= hex.subs( hex.indexOf(k)+k.length+8, 0);
									// console.log(p);
									var p	= p.subs( 0, p.indexOf('0d0a'+boudsplit.toHex().toLowerCase()) );
									// console.log(p.indexOf(boudsplit.toHex().toLowerCase()),p.length, boudsplit.toHex().toLowerCase());
									return new Buffer(p,'hex');
								})(hexData,m[1],boudsplit)) : new Buffer(v) )
							};
							vtype	= 'bin';
						} else {
							r = rVars._post;
							vtype	= 'utf8';
							if(postToUtf8)
								v = v.utf8encode();
						}
						if(!json) {
							r[k]	= v;
						} else {
							var a = [];
							var p = /^(\[([^\]]*)\]|([^\[]+))/,y;
							while( y = k.match(p) ) {
								if(!y[0]) break;
								k = k.replace(p,'');
								if(typeof(y[2]) != "undefined") {
									a.push(y[2]);
								} else {
									a.push( y[2] || y[3] );
								};
							};
							a = a.map(function(v) { if((""+v).match(/[^0-9]/))return '"'+(""+v).escapeHex()+'"'; return ""+v; });
							a.forEach(function(k,i,ar){
								var l;
								if(i > 0) {
									eval('l = r['+a.slice(0,i).join('][')+']');
								} else {
									l = r;
								};
								if(k == '') {
									if(isArray(l)) {
										k	= l.length;
									} else if( typeof(l) == "object" ) {
										k = 0;
										var i,n;for(i in l)
										if((""+i).match(/^\d+$/)) {
											n	= parseInt(i);
											if(k <= n)
												k = n+1;
										}
									};
									a[i] = k;
								};
								// transform array to obj
								if(isArray(l) && (""+k).match(/[^0-9]/)) {
									var t = {},n;
									for(n=0;n<l.length;n++)
										t[n]	= l[n];
									eval('r['+a.slice(0,i).join('][')+'] = t;');
								};
								if( i == a.length-1 ) {
									eval('r['+a.slice(0,i+1).join('][')+'] = v;');
								} else {
									eval('if(typeof(r['+a.slice(0,i+1).join('][')+']) == "undefined" || typeof(r['+a.slice(0,i+1).join('][')+']) == "string") r['+a.slice(0,i+1).join('][')+'] = '+( params.keepOBJ ? '{}' : '[]' )+';');
								};
							});
						};
					}
				});
				return rVars;
			},
			parseUrl	: function(k) {
				var url	= this;
				var domain	= url.split('//');
				domain	= (''+domain[1]).split('/');
				domain	= domain[0];
				var o	= {
					original	: url,
					origin	: url.replace(/^(.*?\/\/[^\/]+)[\s\S]*?$/,'$1'),
					domain	: domain,
					domain_short	: domain.replace(/^www\./,''),
					pathname: url.replace(/(\?|\x23)[\s\S]*$/,'').replace(/^.*?\/\/[^\/]+/,''),
					reqQuery	: url.replace(/^[^\?]*(\?|)/,'').replace(/\#[\s\S]*$/,''),
					protocol: url.split('://')[0],
					protocoll: url.split('://')[0]+'://',
					url		: url.replace(/\/+$/gi,'').replace(/^.*?\/\//gi,''),
					url_p		: url.replace(/\/+$/gi,''),
					isIp	: domain
				};
				if(k == 'get_vars' || k === true)
					o['get_vars']	= o.reqQuery.parseUrlVars(true);
				if( k && k !== true ) {
					if(k in o)
						return o[k];
					return false;
				};
				return o;
			},
			match_str	: function(str,flags){
				return this.match((""+str).toRegexp(flags ? flags : ""));
			},
			sha1 : function(utf8){return Sha1.hash(this,( utf8 || typeof(utf8) == "undefined" ) ? true : false)},
			sha256 : function(utf8){return Sha256.hash(this,( utf8 || typeof(utf8) == "undefined" ) ? true : false)},
			md5	: function() { return MD5(this);},
			base64encode	: function() { return btoa(this.utf8need()); },
			base64decode	: function() { return atob(this).unicode(); },
			base64encodeClean	: function() { return btoa(this); },
			base64decodeClean	: function() { return atob(this); },
			encryptTea	: function(p) { return Tea.encrypt(this,p); },
			decryptTea	: function(p) { return Tea.decrypt(this,p); },
			encryptAes	: function(p,b) { return Aes.Ctr.encrypt(this,p,b ? b : 128); },
			decryptAes	: function(p,b) { return Aes.Ctr.decrypt(this,p,b ? b : 128); },
			buildQuery	: function() {
				var r	= /^\s*([a-z]+)\:\s*(\S[^\:]*?|)\s*(\s[a-z]+\:.*|)$/i
				var s = this, o = { "_keys" : [] }, m, k, f = s.split(/([a-z]+)\:/i);
				if( m = f[0].match(/^\s*(\S[\s\S]*?)\s*$/) ) {
					o["_keys"].push("_");
					o['_']	= m[1];
				};
				f = s.substring(f[0].length,s.length);
				while( m = f.match(r) ) {
					o[k = m[1].toLowerCase()]	= m[2];
					o["_keys"].push(k);
					f = f.split(m[0]).join(m[3]);
				};
				return o;
			},
			buildSearchArray	: function() {
				var s = this,m,a = [];
				while( m = s.match(/(\"[^\"]+\"|\'[^\']+\'|\S+)/) ) {
					a.push(m[1].replace(/^(\"|\')([\s\S]+)?\1/,'$2'));
					s = s.split(m[0]).join('');
				};
				return a;
			}
		};
		o.utf8	= o.utf8encode;
		o.unicode = o.utf8decode;
		var i;for(i in o)String.prototype[i]=o[i];
	})());

	((function() {
		var o = {
			/*
				comparator example:
				function(a,array_item) {
					return a === array_item
				}
			*/
			"inArray"	: function(a,comparator) {
				if(!comparator) comparator	= '===';
				if( typeof(comparator) === "string" )
				switch(comparator) {
					case '===': comparator	= function(a,b) { return a === b ; }; break;
					case '==': comparator	= function(a,b) { return a == b ; }; break;
				};
				var i;for(i=0;i<this.length;i++) if(comparator(a,this[i])) return true;
			},
			"split"	: function (elem, num, cmp) {
				var k, j = 0, n, lines = [], data = this, len = (cmp ? (elem.length ? elem.length : 1) : 1);
				while ((k = data[cmp ? cmp : "indexOf"](elem, j)) !== -1) {
					if (num && lines.length >= num - 1) { break; }
					lines.push(data.slice(j, k));
					j	= k + len;
				}
				lines.push(data.slice(j, data.length));
				return lines;
			},
			"splitSect"		: function(elem, num) {
				return this.split(elem, (num || 0), "indexOfSect");
			},
			"toParamObj"	: function() { var o = {};this.forEach(function(e,i,a) { if( i % 2 == 0 ) o[e] = ( i == a.length-1 ? null : a[i+1] ); });return o; },
			"resetArray"	: function() {return this.filter(function(v) { return ( typeof(v) != "undefined" ); })},
			"indexOfSect" : function (searchElement, fromIndex) {
				if ( this === undefined || this === null ) {
					throw new TypeError( '"this" is null or not defined' );
				}
				var length = this.length >>> 0; // Hack to convert object.length to a UInt32
				fromIndex = +fromIndex || 0;
				if (Math.abs(fromIndex) === Infinity) {
					fromIndex = 0;
				}
				if (fromIndex < 0) {
					fromIndex += length;
					if (fromIndex < 0) {
						fromIndex = 0;
					}
				}
				var cmp	= function(data, i, node) {
					var b = false;
					if (node && node.length) {
						var j, b = true;
						for (j = 0;j<node.length;j++) {
							if (typeof(data[i+j]) === "undefined" || data[i+j] !== node[j])
								b = false;
						}
					} else {
						b	= (data[i] === node);
					}
					return b;
				}
				for (;fromIndex < length; fromIndex++) {
					if (cmp(this, fromIndex, searchElement)) {
						return fromIndex;
					}
				}
				return -1;
			}
		};
		// o.indexOfSect	= o.indexOf;
		var i;for(i in o)Array.prototype[i]=o[i];
	})());

	((function(){
		var o = {
			/* toFixed */
			"round"	: function(k) {	if(k) return parseFloat(this.toFixed(k)); return Math.round(this);	},
			"ceil"	: function() {	return Math.ceil(this);	},
			"floor"	: function() {	return Math.floor(this);	}
		};
		var i;for(i in o)Number.prototype[i]=o[i];
	})());

	root.Sha1 = {hash : function(msg, utf8encode) {utf8encode = (typeof utf8encode == 'undefined') ? true : utf8encode;if (utf8encode) msg = (''+msg).utf8encode();var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];msg += String.fromCharCode(0x80);var l = msg.length/4 + 2;var N = Math.ceil(l/16);var M = new Array(N);for (var i=0; i<N; i++) {M[i] = new Array(16);for (var j=0; j<16; j++) M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) | (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));};M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]);M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;var H0 = 0x67452301;var H1 = 0xefcdab89;var H2 = 0x98badcfe;var H3 = 0x10325476;var H4 = 0xc3d2e1f0;var W = new Array(80); var a, b, c, d, e;for (var i=0; i<N; i++) {for (var t=0;	t<16; t++) W[t] = M[i][t];for (var t=16; t<80; t++) W[t] = Sha1.ROTL(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);a = H0; b = H1; c = H2; d = H3; e = H4;for (var t=0; t<80; t++){var s = Math.floor(t/20);var T = (Sha1.ROTL(a,5) + Sha1.f(s,b,c,d) + e + K[s] + W[t]) & 0xffffffff;e = d;d = c;c = Sha1.ROTL(b, 30);b = a;a = T;};H0 = (H0+a) & 0xffffffff;H1 = (H1+b) & 0xffffffff;H2 = (H2+c) & 0xffffffff;H3 = (H3+d) & 0xffffffff;H4 = (H4+e) & 0xffffffff;};return Sha1.toHexStr(H0) + Sha1.toHexStr(H1) + Sha1.toHexStr(H2) + Sha1.toHexStr(H3) + Sha1.toHexStr(H4);},f:function(s, x, y, z){switch (s) {case 0: return (x & y) ^ (~x & z);case 1: return x ^ y ^ z;case 2: return (x & y) ^ (x & z) ^ (y & z);case 3: return x ^ y ^ z;}},ROTL:function(x, n){return (x<<n) | (x>>>(32-n));},toHexStr:function(n){var s="", v;for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); };return s;}};

	root.MD5 = function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};

	root.Sha256 = { hash : function(msg, utf8encode) { utf8encode = (typeof utf8encode == 'undefined') ? true : utf8encode; if (utf8encode) msg = (''+msg).utf8encode(); var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]; var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]; msg += String.fromCharCode(0x80); var l = msg.length/4 + 2; var N = Math.ceil(l/16); var M = new Array(N); for (var i=0; i<N; i++) { M[i] = new Array(16); for (var j=0; j<16; j++) { M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) | (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3)); } }; M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]); M[N-1][15] = ((msg.length-1)*8) & 0xffffffff; var W = new Array(64); var a, b, c, d, e, f, g, h; for (var i=0; i<N; i++) { for (var t=0;  t<16; t++) W[t] = M[i][t]; for (var t=16; t<64; t++) W[t] = (Sha256.sigma1(W[t-2]) + W[t-7] + Sha256.sigma0(W[t-15]) + W[t-16]) & 0xffffffff; a = H[0]; b = H[1]; c = H[2]; d = H[3]; e = H[4]; f = H[5]; g = H[6]; h = H[7]; for (var t=0; t<64; t++) { var T1 = h + Sha256.Sigma1(e) + Sha256.Ch(e, f, g) + K[t] + W[t]; var T2 = Sha256.Sigma0(a) + Sha256.Maj(a, b, c); h = g; g = f; f = e; e = (d + T1) & 0xffffffff; d = c; c = b; b = a; a = (T1 + T2) & 0xffffffff; }; H[0] = (H[0]+a) & 0xffffffff; H[1] = (H[1]+b) & 0xffffffff; H[2] = (H[2]+c) & 0xffffffff; H[3] = (H[3]+d) & 0xffffffff; H[4] = (H[4]+e) & 0xffffffff; H[5] = (H[5]+f) & 0xffffffff; H[6] = (H[6]+g) & 0xffffffff; H[7] = (H[7]+h) & 0xffffffff; }; return Sha256.toHexStr(H[0]) + Sha256.toHexStr(H[1]) + Sha256.toHexStr(H[2]) + Sha256.toHexStr(H[3]) + Sha256.toHexStr(H[4]) + Sha256.toHexStr(H[5]) + Sha256.toHexStr(H[6]) + Sha256.toHexStr(H[7]); }, ROTR : function(n, x) { return (x >>> n) | (x << (32-n)); }, Sigma0 : function(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); }, Sigma1 : function(x) { return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); }, sigma0 : function(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  }, sigma1 : function(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); }, Ch : function(x, y, z)  { return (x & y) ^ (~x & z); }, Maj : function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }, toHexStr : function(n) { var s="", v; for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }; return s; }};

	root.Tea = { encrypt : function(plaintext, password) { if (plaintext.length == 0) return(''); var v = Tea.strToLongs(plaintext.utf8encode()); if (v.length <= 1) v[1] = 0; var k = Tea.strToLongs((''+password).utf8encode().slice(0,16)); var n = v.length; var z = v[n-1], y = v[0], delta = 0x9E3779B9; var mx, e, q = Math.floor(6 + 52/n), sum = 0; while (q-- > 0) { sum += delta; e = sum>>>2 & 3; for (var p = 0; p < n; p++) { y = v[(p+1)%n]; mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z); z = v[p] += mx; }}; var ciphertext = Tea.longsToStr(v); return ciphertext.base64encodeClean();}, decrypt : function(ciphertext, password) { if (ciphertext.length == 0) return('');var v = Tea.strToLongs(ciphertext.base64decodeClean());var k = Tea.strToLongs((''+password).utf8encode().slice(0,16));var n = v.length;var z = v[n-1], y = v[0], delta = 0x9E3779B9;var mx, e, q = Math.floor(6 + 52/n), sum = q*delta; while (sum != 0) { e = sum>>>2 & 3;for (var p = n-1; p >= 0; p--) {z = v[p>0 ? p-1 : n-1];mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z); y = v[p] -= mx; }; sum -= delta; }; var plaintext = Tea.longsToStr(v); plaintext = plaintext.replace(/\0+$/,''); return plaintext.utf8decode();}, strToLongs : function(s) { var l = new Array(Math.ceil(s.length/4)); for (var i=0; i<l.length; i++) { l[i] = s.charCodeAt(i*4) + (s.charCodeAt(i*4+1)<<8) + (s.charCodeAt(i*4+2)<<16) + (s.charCodeAt(i*4+3)<<24); }; return l;}, longsToStr : function(l) { var a = new Array(l.length); for (var i=0; i<l.length; i++) { a[i] = String.fromCharCode(l[i] & 0xFF, l[i]>>>8 & 0xFF, l[i]>>>16 & 0xFF, l[i]>>>24 & 0xFF); }; return a.join('');}};

	root.Aes={ cipher:function(input,w){var Nb=4;var Nr=w.length/Nb-1;var state=[[],[],[],[]];for(var i=0;i<4*Nb;i++)state[i%4][Math.floor(i/4)]=input[i];state=Aes.addRoundKey(state,w,0,Nb);for(var round=1;round<Nr;round++){state=Aes.subBytes(state,Nb);state=Aes.shiftRows(state,Nb);state=Aes.mixColumns(state,Nb);state=Aes.addRoundKey(state,w,round,Nb)}state=Aes.subBytes(state,Nb);state=Aes.shiftRows(state,Nb);state=Aes.addRoundKey(state,w,Nr,Nb);var output=new Array(4*Nb);for(var i=0;i<4*Nb;i++)output[i]=state[i% 4][Math.floor(i/4)];return output},keyExpansion:function(key){var Nb=4;var Nk=key.length/4;var Nr=Nk+6;var w=new Array(Nb*(Nr+1));var temp=new Array(4);for(var i=0;i<Nk;i++){var r=[key[4*i],key[4*i+1],key[4*i+2],key[4*i+3]];w[i]=r}for(var i=Nk;i<Nb*(Nr+1);i++){w[i]=new Array(4);for(var t=0;t<4;t++)temp[t]=w[i-1][t];if(i%Nk==0){temp=Aes.subWord(Aes.rotWord(temp));for(var t=0;t<4;t++)temp[t]^=Aes.rCon[i/Nk][t]}else if(Nk>6&&i%Nk==4)temp=Aes.subWord(temp);for(var t=0;t<4;t++)w[i][t]=w[i-Nk][t]^temp[t]}return w},subBytes:function(s,Nb){for(var r=0;r<4;r++)for(var c=0;c<Nb;c++)s[r][c]=Aes.sBox[s[r][c]];return s},shiftRows:function(s,Nb){var t=new Array(4);for(var r=1;r<4;r++){for(var c=0;c<4;c++)t[c]=s[r][(c+r)%Nb];for(var c=0;c<4;c++)s[r][c]=t[c]}return s},mixColumns:function(s,Nb){for(var c=0;c<4;c++){var a=new Array(4);var b=new Array(4);for(var i=0;i<4;i++){a[i]=s[i][c];b[i]=s[i][c]&128?s[i][c]<<1^283:s[i][c]<<1}s[0][c]=b[0]^a[1]^b[1]^a[2]^a[3];s[1][c]=a[0]^b[1]^a[2]^b[2]^a[3];s[2][c]=a[0]^a[1]^b[2]^a[3]^b[3];s[3][c]=a[0]^b[0]^a[1]^a[2]^b[3]}return s},addRoundKey:function(state,w,rnd,Nb){for(var r=0;r<4;r++)for(var c=0;c<Nb;c++)state[r][c]^=w[rnd*4+c][r];return state},subWord:function(w){for(var i=0;i<4;i++)w[i]=Aes.sBox[w[i]];return w},rotWord:function(w){var tmp=w[0];for(var i=0;i<3;i++)w[i]=w[i+1];w[3]=tmp;return w},sBox:[99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22],rCon:[[0,0,0,0],[1,0,0,0],[2,0,0,0],[4,0,0,0],[8,0,0,0],[16,0,0,0],[32,0,0,0],[64,0,0,0],[128,0,0,0],[27,0,0,0],[54,0,0,0]],Ctr:{encrypt:function(plaintext,password,nBits){var blockSize=16;if(!(nBits==128||(nBits==192||nBits==256)))return"";plaintext=(''+plaintext).utf8encode();password=(''+password).utf8encode();var nBytes=nBits/8;var pwBytes=new Array(nBytes);for(var i=0;i<nBytes;i++)pwBytes[i]=isNaN(password.charCodeAt(i))?0:password.charCodeAt(i);var key=Aes.cipher(pwBytes,Aes.keyExpansion(pwBytes));key=key.concat(key.slice(0,nBytes-16));var counterBlock=new Array(blockSize);var nonce=(new Date).getTime();var nonceMs=nonce% 1E3;var nonceSec=Math.floor(nonce/1E3);var nonceRnd=Math.floor(Math.random()*65535);for(var i=0;i<2;i++)counterBlock[i]=nonceMs>>>i*8&255;for(var i=0;i<2;i++)counterBlock[i+2]=nonceRnd>>>i*8&255;for(var i=0;i<4;i++)counterBlock[i+4]=nonceSec>>>i*8&255;var ctrTxt="";for(var i=0;i<8;i++)ctrTxt+=String.fromCharCode(counterBlock[i]);var keySchedule=Aes.keyExpansion(key);var blockCount=Math.ceil(plaintext.length/blockSize);var ciphertxt=new Array(blockCount);for(var b=0;b<blockCount;b++){for(var c=0;c< 4;c++)counterBlock[15-c]=b>>>c*8&255;for(var c=0;c<4;c++)counterBlock[15-c-4]=b/4294967296>>>c*8;var cipherCntr=Aes.cipher(counterBlock,keySchedule);var blockLength=b<blockCount-1?blockSize:(plaintext.length-1)%blockSize+1;var cipherChar=new Array(blockLength);for(var i=0;i<blockLength;i++){cipherChar[i]=cipherCntr[i]^plaintext.charCodeAt(b*blockSize+i);cipherChar[i]=String.fromCharCode(cipherChar[i])}ciphertxt[b]=cipherChar.join("")}var ciphertext=ctrTxt+ciphertxt.join("");ciphertext=(''+ciphertext).base64encodeClean(); return ciphertext},decrypt:function(ciphertext,password,nBits){var blockSize=16;if(!(nBits==128||(nBits==192||nBits==256)))return"";ciphertext=(''+ciphertext).base64decodeClean();password=(''+password).utf8encode();var nBytes=nBits/8;var pwBytes=new Array(nBytes);for(var i=0;i<nBytes;i++)pwBytes[i]=isNaN(password.charCodeAt(i))?0:password.charCodeAt(i);var key=Aes.cipher(pwBytes,Aes.keyExpansion(pwBytes));key=key.concat(key.slice(0,nBytes-16));var counterBlock=new Array(8);ctrTxt=ciphertext.slice(0,8);for(var i=0;i<8;i++)counterBlock[i]=ctrTxt.charCodeAt(i);var keySchedule=Aes.keyExpansion(key);var nBlocks=Math.ceil((ciphertext.length-8)/blockSize);var ct=new Array(nBlocks);for(var b=0;b<nBlocks;b++)ct[b]=ciphertext.slice(8+b*blockSize,8+b*blockSize+blockSize);ciphertext=ct;var plaintxt=new Array(ciphertext.length);for(var b=0;b<nBlocks;b++){for(var c=0;c<4;c++)counterBlock[15-c]=b>>>c*8&255;for(var c=0;c<4;c++)counterBlock[15-c-4]=(b+1)/4294967296-1>>>c*8&255;var cipherCntr=Aes.cipher(counterBlock,keySchedule);var plaintxtByte=new Array(ciphertext[b].length);for(var i=0;i<ciphertext[b].length;i++){plaintxtByte[i]=cipherCntr[i]^ciphertext[b].charCodeAt(i);plaintxtByte[i]=String.fromCharCode(plaintxtByte[i])}plaintxt[b]=plaintxtByte.join("")}var plaintext=plaintxt.join("");plaintext=(''+plaintext).utf8decode();return plaintext}}};
	root.base64 = {
		PADCHAR : '=',
		ALPHA : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
		makeDOMException : function() {var e, tmp;try {return new DOMException(DOMException.INVALID_CHARACTER_ERR);} catch (tmp) { var ex = new Error("DOM Exception 5");ex.code = ex.number = 5;ex.name = ex.description = "INVALID_CHARACTER_ERR";ex.toString = function() { return 'Error: ' + ex.name + ': ' + ex.message; };return ex;};},
		getbyte64 : function(s,i) {var idx = base64.ALPHA.indexOf(s.charAt(i));if (idx === -1) {throw base64.makeDOMException();};return idx;},
		decode : function(s) {s = '' + s;var getbyte64 = base64.getbyte64;var pads, i, b10;var imax = s.length;if (imax === 0) {return s;};if (imax % 4 !== 0) {throw base64.makeDOMException();};pads = 0;if (s.charAt(imax - 1) === base64.PADCHAR) {pads = 1;if (s.charAt(imax - 2) === base64.PADCHAR) {pads = 2;};imax -= 4;};var x = [];for (i = 0; i < imax; i += 4) {b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) | (getbyte64(s,i+2) << 6) | getbyte64(s,i+3);x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));};switch (pads) {case 1:b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) | (getbyte64(s,i+2) << 6);x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));break;case 2:b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12);x.push(String.fromCharCode(b10 >> 16));break;};return x.join('');},
		getbyte : function(s,i) {var x = s.charCodeAt(i);if (x > 255) {throw base64.makeDOMException();};return x;},
		encode : function(s) {if (arguments.length !== 1) {throw new SyntaxError("Not enough arguments");};var padchar = base64.PADCHAR;var alpha   = base64.ALPHA;var getbyte = base64.getbyte;var i, b10;var x = [];s = '' + s;var imax = s.length - s.length % 3;if (s.length === 0) return s;for (i = 0; i < imax; i += 3) {b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8) | getbyte(s,i+2);x.push(alpha.charAt(b10 >> 18));x.push(alpha.charAt((b10 >> 12) & 0x3F));x.push(alpha.charAt((b10 >> 6) & 0x3f));x.push(alpha.charAt(b10 & 0x3f));};switch (s.length - imax) {case 1:b10 = getbyte(s,i) << 16;x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) + padchar + padchar);break;case 2:b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8);x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) + alpha.charAt((b10 >> 6) & 0x3f) + padchar);break;};return x.join('');}
	};
	root.btoa = base64.encode;
	root.atob = base64.decode;

	((function(){
		var i,p = [],s;
		var a = m_store.json_string_r.split('');
		m_store.json_string_r	= {};
		for( i=0; i<a.length; i++ )
			m_store.json_string_r[a[i].toHex()]	= a[i];
		for( i in m_store.json_string_r ) p.push(i);
			// console.log("/\\%("+p.join('|')+")/");
		m_store.json_string_m	= ("/\\%("+p.join('|')+")/").toRegexp("gi");
	})());
	
	( function () {
		var i;
		var methods	= {
			forEach : function (callback, thisArg) {
				var T, k;
				if (this == null) {
					throw new TypeError(" this is null or not defined");
				}
				var O = Object(this);
				var len = O.length >>> 0;
				if (typeof callback !== "function") {
					throw new TypeError(callback + " is not a function");
				}
				if (arguments.length > 1) {
					T = thisArg;
				}
				k = 0;
				while (k < len) {
					var kValue;
					if (k in O) {
						kValue = O[k];
						callback.call(T, kValue, k, O);
					}
					k++;
				}
			},
			"split"	: function (elem, num, cmp) {
				var k, j = 0, n, lines = [], data = this, len = (cmp ? (elem.length ? elem.length : 1) : 1);
				while ((k = data[cmp ? cmp : "indexOf"](elem, j)) !== -1) {
					if (num && lines.length >= num - 1) { break; }
					lines.push(data.slice(j, k));
					j	= k + len;
				}
				lines.push(data.slice(j, data.length));
				return lines;
			},
			"splitSect"		: function(elem, num) {
				return this.split(elem, (num || 0), "indexOfSect");
			},
			"toParamObj"	: function() { var o = {};this.forEach(function(e,i,a) { if( i % 2 == 0 ) o[e] = ( i == a.length-1 ? null : a[i+1] ); });return o; },
			"resetArray"	: function() {return this.filter(function(v) { return ( typeof(v) != "undefined" ); })},
			"indexOf" : function (searchElement, fromIndex) {
				if ( this === undefined || this === null ) {
					throw new TypeError( '"this" is null or not defined' );
				}
				var length = this.length >>> 0; // Hack to convert object.length to a UInt32
				fromIndex = +fromIndex || 0;
				if (Math.abs(fromIndex) === Infinity) {
					fromIndex = 0;
				}
				if (fromIndex < 0) {
					fromIndex += length;
					if (fromIndex < 0) {
						fromIndex = 0;
					}
				}
				var cmp	= function(data, i, node) {
					var b = false;
					if (node.length) {
						var j, b = true;
						for (j = 0;j<node.length;j++) {
							if (typeof(data[i+j]) === "undefined" || data[i+j] !== node[j])
								b = false;
						}
					} else {
						b	= (data[i] === node);
					}
					return b;
				}
				for (;fromIndex < length; fromIndex++) {
					if (cmp(this, fromIndex, searchElement)) {
						return fromIndex;
					}
				}
				return -1;
			},
			lastIndexOf : function(searchElement /*, fromIndex*/) {
				if (this === void 0 || this === null) {
					throw new TypeError();
				}
				var n, k,
						t = Object(this),
						len = t.length >>> 0;
				if (len === 0) {
					return -1;
				}
				n = len - 1;
				if (arguments.length > 1) {
					n = Number(arguments[1]);
					if (n != n) {
						n = 0;
					}
					else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
						n = (n > 0 || -1) * Math.floor(Math.abs(n));
					}
				}
				for (k = n >= 0
							? Math.min(n, len - 1)
							: len - Math.abs(n); k >= 0; k--) {
					if (k in t && t[k] === searchElement) {
						return k;
					}
				}
				return -1;
			}
		};
		methods.indexOfSect	= methods.indexOf;
		for (i in methods) if (!(i in Buffer.prototype)) Buffer.prototype[i]	= methods[i];
	})();
}
module.exports	= faceboxUpdateProto;
