'use strict';

const Transformer   = require('shark-transformer');
const UglifyJS      = require("uglify-js");
const extend        = require('node.extend');
const co            = require('co');
const VError        = require('verror');
const path          = require('path');

const loggerOpName = 'uglify-js';

module.exports = Transformer.extend({
	optionsDefault: {
		compress: false
	},

	init: function() {
		this.options = extend({}, this.optionsDefault, this.options);
	},

	minify: function(content, destPath, options) {
		options.fromString = true;

		var time = this.logger.time();
		var sizeBefore = content.length;

		try {
			if (!this.logger.inPipe()) {
				this.logger.info({
					opName: loggerOpName,
					opType: this.logger.OP_TYPE.STARTED
				}, path.basename(destPath));
			}

			var result = UglifyJS.minify(content, options).code;

			this.logger.info({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.FINISHED_SUCCESS,
				duration: time.delta(),
				size: {before: sizeBefore, after: result.length}
			}, this.logger.inPipe() ? '' : path.basename(destPath));
			return result;
		}
		catch (error) {
			throw new VError(error, 'UglifyJS error');
		}
	},

	transformTree: function *() {
		return this.tree.forEachDestSeries(co.wrap(function *(destPath, srcCollection, done) {
			try {
				yield this.transformTreeConcreteDest(destPath, srcCollection);
				done();
			}
			catch (error) {
				done(new VError(error, 'UglifyJs#transformTree'));
			}
		}.bind(this)));
	},

	transformTreeConcreteDest: function *(destPath, srcCollection) {
		var options = extend({}, this.options, srcCollection.getOptions().uglifyJs);

		if (options.enabled === false) {
			this.logger.info('%s disabled, passing...', loggerOpName);
			return;
		}

		srcCollection.forEach(function(srcFile) {
			var minifed = this.minify(
				srcFile.getContent(),
				destPath,
				options
			);
			srcFile.setContent(minifed);
		}.bind(this));
	},

	treeToTree: function *() {
		yield this.tree.fillContent();
		yield this.transformTree();

		return this.tree;
	}
});