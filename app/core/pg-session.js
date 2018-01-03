/* * ************************************************************ 
 * 
 * Date: 8 May, 2015
 * version: 0.0.1
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Description:   
 * Javascript file pg-session.js
 * *************************************************************** */

var models = require("../models/");
var conf = require("config").get("server");
var cookiedays = conf.cookieDays || 2;

module.exports = function (session) {

    var Store = session.Store;

    function PgStore (options) {
      var opts = options || {};
      Store.call(this, opts);
    }

    PgStore.prototype.__proto__ = Store.prototype;

    PgStore.prototype.get = function (sid, fn) {
        models.session.get(sid,function(err,data){
            if(err && err.message === 'not_found')
                fn(null,null);
            else 
                fn(err,data && data.hasOwnProperty("sess") ? data.sess : null);
        });
    };
  
    PgStore.prototype.set = function (sid, sess, fn) {
        models.session.update(sid,sess, function(err,rowsUpdated){
            if(err || !rowsUpdated)
                models.session.create(sid,sess, cookiedays,fn);
            else fn(null,rowsUpdated);
        });
    };

    PgStore.prototype.destroy = function (sid, fn) {
        models.session.remove(sid,function(err){
            if(fn) fn(err);
        });
    };

    PgStore.prototype.touch = function (sid, sess, fn) {
        models.session.touch(sid, cookiedays,fn);
    };
    return PgStore;
};