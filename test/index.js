'use strict';

const chai      = require('chai');
const coMocha   = require('co-mocha');
const expect    = chai.expect;

const TransformerUglifyJs = require('../');
const Tree      = require('shark-tree');
const Logger    = require('shark-logger');
const cofse     = require('co-fs-extra');
const path      = require('path');

describe('Initialization', function() {
	before(function *() {
		this.logger = Logger({
			name: 'TransformerUglifyJsLogger'
		});

		this.files = {};
		this.src = path.join(__dirname, './fixtures/test.js');

		this.dest = path.join(__dirname, './fixtures/test.dest.js');

		this.expectDest = path.join(__dirname, './fixtures/test.dest.expect.js');
		this.expectDestContent = yield cofse.readFile(this.expectDest, { encoding: 'utf8' });

		yield cofse.writeFile(this.dest, '');

		this.files[this.dest] = {
			files: [this.src],
			options: {

			}
		};

		this.tree = yield Tree(this.files, this.logger);
	});

	it('should uglify js and output valid result', function *() {
		var tree = yield TransformerUglifyJs.treeToTree(this.tree, this.logger);

		expect(tree.getSrcCollectionByDest(this.dest).getFileByIndex(0).getContent())
			.equal(this.expectDestContent);
	})
});
