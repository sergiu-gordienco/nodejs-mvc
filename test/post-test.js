// jshint esnext:true

var server	= require('../demo/post-test/index.js');
var config	= {
	server	: {
		protocol	: 'http',
		host	: 'localhost',
		port	: 8080
	}
};
config.url	= config.server.protocol + '://' +
			config.server.host +
			( config.server.port !== 80 ? ':' + config.server.port : '' );
describe('Demo Post Test', function() {
	describe('Start server', function() {
		// this.retries(2);

		describe(`access site ${config.url}`, function () {
			this.timeout(1000);
			this.slow(500);
			it('sould recive statusCode 200', (done) => {
				require("http").get(config.url, (res) => {
					if (res.statusCode !== 200)
						throw new Error(`Got response: ${res.statusCode}`);
					done();
					res.resume();
				}).on('error', (e) => {
					throw e;
				});
			});
		});
		var postedData;
		var recivedData;
		it('POST data to site', function (done) {
			this.timeout(1000);
			this.slow(500);
			// this.retries();
			var message	= 'Hello World POST TEST!';
			postedData	= require("querystring").stringify({
				'msg' : message
			});
			require("http").request(
				{
					hostname: config.server.host,
					port: config.server.port,
					path: '/test/',
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': postedData.length
					}
				},
				function (res, err) {
					var ended = false;
					res.setEncoding('utf8');
					res.on('data', (chunk) => {
						if (chunk !== undefined) {
							if (recivedData	=== undefined) {
								recivedData	= chunk;
							} else {
								recivedData	+= chunk;
							}
						}
					});
					res.on('end', () => {
						if (!ended) {
							ended	= true;
							done();
							describe("postedData check", () => {
								it("typeof is string", () => {
									if (typeof(postedData) !== "string")
									throw new Error("postedData not a String");
								});
							});
							describe("recivedData check", () => {
								it("typeof is string", () => {
									if (typeof(recivedData) !== "string")
									throw new Error("recivedData not a String");
								});
								it("should contain posted message", (done) => {
									if (recivedData.indexOf(message) !== -1) {
										done();
									} else {
										throw new Error("postedData was not recived");
									}
								});
							});
						}
					});
					res.on('error', (error) => {
						throw error;
					});
				}
			).write(postedData);
		});
	});
});
