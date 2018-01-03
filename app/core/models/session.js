/* * ************************************************************ 
 * 
 * Date: 8 May, 2015
 * version: 0.0.1
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Description:   
 * Javascript file session.js
 * *************************************************************** */


var conf = require("../../conf");
var table = conf.pg.pgschema+'.session';
var pg = require("../postgres")();
var async = require("async");
var server = conf.servername || 'xadmin';

var dayms = 86400000;
exports.create = function(s,sess,validdays,callback){
    var v = new Date(new Date().getTime()+validdays*dayms);
    pg.insert("INSERT INTO "+table+" (s,sess,validtill,servername) VALUES($1,$2,$3,$4)",[s,sess,v,server],callback);
};

exports.update = function(s,sess,cb){
    pg.update("UPDATE "+table+" SET sess = $1 WHERE s = $2",[sess,s],cb);
};

exports.remove = function(s,callback){
    pg.delete("DELETE FROM "+table+" WHERE s = $1",[s],callback);
};

exports.get = function(s,cb){
    pg.select("SELECT s,sess,validtill FROM "+table+" WHERE s = $1",[s],cb);
};

exports.touch = function(s,days,cb){
    pg.update("UPDATE "+table+" SET validtill = $1 WHERE s = $2",[new Date(new Date().getTime()+days*dayms),s],cb);
};

exports.removeExpired = function(callback){
    var sql = "DELETE FROM "+table+" WHERE validtill < $1";
    pg.delete(sql,[new Date()],callback);
};
