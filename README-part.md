
### String Prototype

#### Subs Method:

```javascript
	String.prototype.subs	= function(string, offset, length) {}
```
> `"abcdefghi".subs(2)` is equal to `"ab"`
> `"abcdefghi".subs(2,3)` is equal to `"cde"`
> `"abcdefghi".subs(-2)` is equal to `"hi"`
> `"abcdefghi".subs(1,-2)` is equal to `"bcdefg"`
> `"abcdefghi".subs(-4,3)` is equal to `"fgh"`

#### Subs Method:

```javascript
	String.prototype.toHex = function(utf8String) { /*...*/ return hex_str; }
	String.prototype.fromHex = function(){ /*...*/ retrun utf8_str; },
```
> `"TEST".toHex()` is equal to `"54455354"`
> `"54455354".fromHex()` is equal to `"TEST"`
> `"54455354".fromHex()` is equal to `"TEST"`

> **UTF-8** vs Unicode
> Function `.toHex()` and `.fromHex` is working with **UTF-8** Strings
but javascript is working with **Unicode**
> `"€".toHex()` _(Unicode)_ 1 char in HEX is 2 chars `"20ac"`
> `"20ac".fromHex()` is " ¬"

> So correctly to encode UnicodeText to Hex is
> "€".utf8encode().toHex() and the result is `"e282ac"`
> and `"e282ac".fromHex().utf8decode()` is `"€"`

#### Escape HTML
```javascript
	String.prototype.toHtmlSimple	= function() { /*...*/ retrun str; },
	String.prototype.toHtml = function(){ /*...*/ return str;},
	String.prototype.cleanTags	= function() { /*...*/ return str; }
```

#### Check if word exists in a list of words separated by `" "`
```javascript
	// add class
	String.prototype.add_Class = function(x){},
	// remove class
	String.prototype.del_Class = function(x){},
	// check is calss exists
	String.prototype.fnd_Class = function(x){},
```

#### String letterCase change
```javascript
	String.prototype.swp_case = function(){ return str; }
	String.prototype.ucfirst = function(k){ return str; }
	String.prototype.lcfirst = function(k){ return str; }
```

#### Encoding Conversions
```javascript
	String.prototype.utf8need = function() { return bool_utf8 }
	String.prototype.utf8encode = function() { return utf8_str; }
	String.prototype.utf8decode = function(strUtf) { return unicode_str; }
	String.prototype.utf8	= String.prototype.utf8encode;
	String.prototype.unicode = String.prototype.utf8decode;
```

	String.prototype.escapeHex	= function() { return str; },
	String.prototype.escape		= function() { return escape(this); },
	String.prototype.encodeURI	= function() { return encodeURIComponent(this); },
	String.prototype.unescape	= function() { return unescape(this); },
	String.prototype.decodeURI	= function() { return decodeURIComponent(this); },

	String.prototype.toRegexp = function(flags){ return reg_exp_object; }
#### Parse URL links
```javascript
	String.prototype.parseUrlVars	= function(json,params) { retrun data_object; },
	String.prototype.parseMultipartFormData	= function(json,params,postToUtf8, hexData) { return data_object; },
	String.prototype.parseUrl	= function(url) { return object; }
```

**Examples**

##### Parse URL
```javascript
	"http://www.example.com/test?nr=1&module=mvc#link-1".parseUrl()
```javascript
**Returns**
```javascript
	{
		original	: "http://www.example.com/test?nr=1&module=mvc#link-1",
		origin	: "http://www.example.com",
		domain	: "www.example.com",
		domain_short	: "example.com",
		pathname: "/test",
		reqQuery	: "nr=1&module=mvc",
		protocol: "http",
		protocoll: "http://"
	};
```

##### Parse URL with GET vars
```javascript
	"http://www.example.com/test?nr=1&module=mvc&val[x]=5#link-1".parseUrl(true)
```javascript
**Returns**
```javascript
	{
		get_vars	: {
			nr	: 1,
			module	: mvc,
			val : {
				x	: 5
			}
		},
		original	: "http://www.example.com/test?nr=1&module=mvc#link-1",
		origin	: "http://www.example.com",
		domain	: "www.example.com",
		domain_short	: "example.com",
		pathname: "/test",
		reqQuery	: "nr=1&module=mvc",
		protocol: "http",
		protocoll: "http://"
	};
```

##### Parse URL retrieve only GET vars
```javascript
	"http://www.example.com/test?nr=1&module=mvc&val[x]=5#link-1".parseUrl("get_vars")
```javascript
**Returns**
```javascript
	{
		nr	: 1,
		module	: mvc,
		val : {
			x	: 5
		}
	}
```

##### Parse URL and retrieve only a property from parsed Object
```javascript
	"http://www.example.com/test?nr=1&module=mvc&val[x]=5#link-1".parseUrl("origin")
```
**Returns**
```javascript
	"http://www.example.com"
```
----
```javascript
	"http://www.example.com/test?nr=1&module=mvc&val[x]=5#link-1".parseUrl("reqQuery")
```
**Returns**
```javascript
	"nr=1&module=mvc"
```

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
	buildSearchArray	: function() { /*...*/ return arr; }



	/*
		comparator example:
		function(a,array_item) {
			return a === array_item
		}
	*/
	Array.prototype.inArray	= function(a,comparator) { /*...*/ },
	Array.prototype.split	= function (elem, num, cmp) { /*...*/ },
	Array.prototype.splitSect	= function(elem, num) {
		return this.split(elem, (num || 0), "indexOfSect");
	},
	Array.prototype.toParamObj	= function() { /*...*/ },
	Array.prototype.resetArray	= function() {return this.filter(function(v) { return ( typeof(v) != "undefined" ); })},
	Array.prototype.indexOfSect	= function (searchElement, fromIndex) { /*...*/ }

	Number.prototype.round	= function(k) {	if(k) return parseFloat(this.toFixed(k)); return Math.round(this);	},

	Number.prototype.ceil	= function() {	return Math.ceil(this);	},

	Number.prototype.floor	= function() {	return Math.floor(this);	}



	Buffer.prototype.split	= function (elem, num, cmp) {
				/* ... */
				return lines;
			}

	Buffer.prototype.splitSect	= function(elem, num) {
		return this.split(elem, (num || 0), "indexOfSect");
	}

	Buffer.prototype.toParamObj	= function() { /*...*/ },

	Buffer.prototype.indexOf	= function(searchSequence, fromIndex) { /*...*/ },

	Buffer.prototype.indexOfSect	= function(searchSequence, fromIndex) { /*...*/ },

	Buffer.prototype.resetArray	= function() {return this.filter(function(v) { return ( typeof(v) != "undefined" ); })},

```