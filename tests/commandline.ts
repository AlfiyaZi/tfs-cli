/// <reference path="../definitions/mocha/mocha.d.ts"/>
/// <reference path="../definitions/q/Q.d.ts"/>
/// <reference path="../definitions/node/node.d.ts"/>
import Q = require('q');
import assert = require('assert');

describe('tfx-cli', function() {

	before((done) => {
		// init here
		done();
	});

	after(function() {

	});

	describe('Command Line Parsing', function() {
		it('It succeeds', (done) => {
			this.timeout(500);

			assert(true, 'true is not true?');
			done();
		})		
		it('It succeeds again', (done) => {
			this.timeout(500);

			assert(true, 'true is not true?');
			done();
		})
	});
});