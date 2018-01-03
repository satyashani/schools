/* * ************************************************************ 
 * Date: 28 Dec, 2017
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file webpack.config.js
 * *************************************************************** */

var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname+'/public/js');
var APP_DIR = path.resolve(__dirname+'/public/react');

var config = {
    entry: APP_DIR + '/index.jsx',
    output: {
        path: BUILD_DIR,
        filename: 'reactBundle.js'
    },
    module : {
        loaders : [
            {
                test : /\.jsx?/,
                include : APP_DIR,
                loader : 'babel-loader'
            }
        ]
    }
};

module.exports = config;