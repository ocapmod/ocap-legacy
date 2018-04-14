module.exports = {
	entry: './js/app.js',
	mode: 'development',
	output: {
		path: __dirname + '/static/scripts',
		filename: 'ocap.js'
	},
	devtool: 'source-map'
};