/* * ************************************************************ 
 * Date: 2 Jan, 2018
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file schema.js
 * *************************************************************** */


var async = require('async');
var fs = require("fs");
var path = require("path");
var pg = require("../postgres")();
var conf = require("config").get("pg");

var schemas = {
    current : path.resolve(__dirname+"/sql/init.sql"),
    updates : path.resolve(__dirname+"/sql/updates.sql")
};

var presql = {
    create :  function(schemaname){
        return [
            "CREATE SCHEMA IF NOT EXISTS "+schemaname+" AUTHORIZATION "+conf.pgrole,
            "SET search_path TO "+schemaname
        ];
    },
    udpate :  function(schemaname){
        return [
            "SET search_path TO "+schemaname
        ];
    }
};

var postsql = {
    create : function(schemaname){
        [
            "GRANT USAGE ON SCHEMA "+schemaname+" to "+conf.pgrole,
            "GRANT ALL ON ALL TABLES IN SCHEMA "+schemaname+" TO  "+conf.pgrole,
            "GRANT ALL ON ALL SEQUENCES IN SCHEMA "+schemaname+" TO "+conf.pgrole
        ];
    },
    update : function (schemaname){
        return [
            "GRANT USAGE ON SCHEMA "+schemaname+" to "+conf.pgrole,
            "GRANT ALL ON ALL TABLES IN SCHEMA "+schemaname+" TO  "+conf.pgrole,
            "GRANT ALL ON ALL SEQUENCES IN SCHEMA "+schemaname+" TO "+conf.pgrole
        ];
    }
};

function exists(schemaname,callback){
    var table = 'information_schema.schemata';
    var sql = "SELECT schema_name FROM "+table+" WHERE schema_name = $1;";
    pg.select(sql,[schemaname],function(err,res){
        callback(err && err.message === 'not_found' ? null : err,(!err) && res.schema_name===schemaname);
    });
};

function runSchemaScript(schemaname,presql,postsql,script,callback){
    exists(schemaname,function(err,res){
        if(!err && res) return callback(new Error("schema_exists"),null);
        pg.getTransaction(function(err,t){
            if(err) callback(err);
            else{
                async.series([
                    t.begin,
                    function(cb){
                        async.mapSeries(presql,function(pre,cbmap){
                            t.exec(pre,[],cbmap);
                        },cb);
                    },
                    function(cb){
                        fs.readFile(script,"utf8",function(errfs,sql){
                            if(errfs){
                                t.rollback();
                                cb(new Error("schema_missing"));
                            }
                            else
                                t.exec(sql,[],cb);
                        });
                    },
                    function(cb){
                        async.mapSeries(postsql,function(post,cbmap){
                            t.exec(post,[],cbmap);
                        },cb);
                    },
                    t.commit
                ],callback);
            }
        });
    });
}

function create(schemaname,callback){
    runSchemaScript(
        schemaname,
        presql.create(schemaname),
        postsql.create(schemaname),
        schemas.create,
        callback
    );
};

function upgrade(schemaname,callback){
    runSchemaScript(
        schemaname,
        presql.update(schemaname),
        postsql.update(schemaname),
        schemas.updates,
        callback
    );
};

function drop(schemaname,callback){
    exists(schemaname,function(err,exists){
        if(err) return callback(err,null);
        if(!exists) return callback(null,true);
        var sql = "DROP SCHEMA "+schemaname+" CASCADE";
        pg.exec(sql,[],callback);
    });
};

var dropRole = function(role,cb){
    pg.exec("DROP ROLE IF EXISTS "+role,[],cb);
};

var getVersion = function(schemaname,cb){
    var sql = "SELECT value FROM "+schemaname+".schemaversion LIMIT 1;";
    pg.value(sql,[],'value',cb);
};

exports.exists = exists;
exports.create = create;
exports.drop = drop;
exports.dropRole = dropRole;
exports.upgrade = upgrade;
exports.getVersion = getVersion;
