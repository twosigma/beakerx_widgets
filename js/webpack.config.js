const path = require('path');
const pkg = require('./package.json');

var rules = [
  {
    test: /\.css$/i,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
    exclude: [/katex\.css$/i],
  },
  {
    test: /katex\.css$/i,
    use: [{ loader: 'css-loader' }],
  },
  {
    test: /\.scss$/,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }],
  },
  {
    test: /\.(jpg|png|gif)$/,
    use: { loader: 'file-loader' },
  },
  {
    test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 10000,
        mimetype: 'application/font-woff',
        name: './css/fonts/[name].[ext]',
      },
    },
  },
  {
    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 10000,
        mimetype: 'application/octet-stream',
        name: './css/fonts/[name].[ext]',
      },
    },
  },
  {
    test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
    use: {
      loader: 'file-loader',
    },
  },
  {
    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 10000,
        mimetype: 'image/svg+xml',
        name: './css/fonts/[name].[ext]',
      },
    },
  },
];

const BEAKERX_STATIC_PATH = path.resolve(__dirname, '../beakerx_widgets/beakerx/static');
const BEAKERX_DIST_PATH = path.resolve(__dirname, './dist/');
const BEAKERX_MODE = 'production';

module.exports = [
  // Notebook extension
  {
    entry: './lib/extension.js',
    output: {
      filename: 'extension.js',
      path: BEAKERX_STATIC_PATH,
      libraryTarget: 'amd',
    },
    devtool: 'inline-source-map',
    externals: [
      '@jupyter-widgets/base',
      '@jupyter-widgets/controls',
      'jquery',
      'base/js/dialog',
      'base/js/events',
      'base/js/namespace',
      'base/js/utils',
      'services/kernels/comm',
      'services/config',
      'notebook/js/celltoolbar',
      'notebook/js/codecell',
    ],
    module: {
      rules: rules,
    },
    mode: BEAKERX_MODE,
  },
  {
    entry: './lib/tree-extension.js',
    output: {
      filename: 'tree-extension.js',
      path: BEAKERX_STATIC_PATH,
      libraryTarget: 'amd',
    },
    devtool: 'inline-source-map',
    module: {
      rules: rules,
    },
    externals: ['@jupyter-widgets/base', '@jupyter-widgets/controls', 'jquery'],
    mode: BEAKERX_MODE,
  },
  // beakerx_widgets bundle for the classic notebook
  {
    entry: './lib/index-classic.js',
    output: {
      filename: 'index.js',
      path: BEAKERX_STATIC_PATH,
      libraryTarget: 'amd',
    },
    devtool: 'inline-source-map',
    module: {
      rules: rules,
    },
    externals: ['@jupyter-widgets/base', '@jupyter-widgets/controls', 'jquery'],
    mode: BEAKERX_MODE,
  },
  // beakerx_widgets bundle for unpkg.
  {
    entry: './lib/index-embed.js',
    output: {
      filename: 'index.js',
      path: BEAKERX_DIST_PATH,
      libraryTarget: 'amd',
      // publicPath: 'https://unpkg.com/' + pkg.name + '@' + pkg.version + '/dist/'
    },
    devtool: 'inline-source-map',
    module: {
      rules: rules,
    },
    externals: ['@jupyter-widgets/base', '@jupyter-widgets/controls'],
    mode: BEAKERX_MODE,
  },
];
