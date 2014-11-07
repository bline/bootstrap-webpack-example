
module.exports = {
  entry: 'index.js',
  modules: {
    loaders: [
      // see https://github.com/webpack/style-loader#recommended-configuration
      { test: /\.css$/,    loader: "style!css", exclude: /\.useable\.css$/ },
      { test: /\.useable\.css$/, loader: "style/useable!css" },

      // this is needed so that each bootstrap js file required by
      // bootstrap-webpack has access to the jQuery object
      { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },

      // needed for css-loader
      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&minetype=application/font-woff" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=application/octet-stream" },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=image/svg+xml" }
    ]
  }
};

