'use strict';

const WatcherNonInterruptibleError = require('shark-watcher').NonInterruptibleError;
const Transformer   = require('shark-transformer');
const UglifyJS      = require("uglify-js");
const co            = require('co');
const VError        = require('verror');

module.exports = Transformer.extend({
	renderUglifyJs: function(content) {
		try {
			var result = UglifyJS.minify(content, {
				fromString: true,
				compress: this.options.useCompress || false,
				//outSourceMap: '/' + dest + '.map'
			}).code;
			return result;
		}
		catch (error) {
			throw new VError(error, 'UglifyJS error');
		}
	},

	transformTree: function() {
		try {
			var _tree = this.tree.getTree();
			for (var destPath in _tree) {
				if (_tree.hasOwnProperty(destPath)) {
					this.transformTreeConcreteDest(destPath, this.tree.getSrcCollectionByDest(destPath));
				}
			}
		}
		catch (error) {
			throw new VError(error, 'TransformerMinifyJs#transformTree');
		}
	},

	transformTreeConcreteDest: function (destPath, srcCollection) {
		srcCollection.forEach(function(srcFile) {
			var minifed = this.renderUglifyJs(
				srcFile.getContent(),
				srcCollection.getOptions().browsers
			);
			srcFile.setContent(minifed);
		}.bind(this));
	},

	treeToTree: function *() {
		try {
			 yield this.tree.fillContent();
			 this.transformTree();

			return this.tree;
		}
		catch (error) {
			throw new VError(error, 'TransformerMinifyJs#treeToTree');
		}
	}
});