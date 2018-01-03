/* * ************************************************************ 
 * Date: 30 May, 2016
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file cronjobs.js
 * *************************************************************** */



var async = require("async");
var conf = require("congif").pg;
var pg = require("../postgres")();
var table = conf.pgschema+'.cronjobs';
var evttable = conf.pgschema+".cronevents";

var eventStatus = {none : 0, raised : 1, handled : 2, failed : 3};

var nextRun = function(starttime,timeperiod){
    var period = 15;
    if(!timeperiod || !parseInt(timeperiod)) return starttime;
    var frequency = ( parseInt(timeperiod) || 1440) * 60 * 1000;
    var nextrun = new Date(starttime).getTime();
    var now = new Date().getTime()+period * 1000;
    while(now > nextrun){
        nextrun += frequency;
    }
    return new Date(nextrun).toGMTString();
};

var get = function(name,callback){
    pg.select("SELECT * FROM "+table+" WHERE cronname = $1",[name],callback);
};
exports.get = get;

exports.create = function(name,start,period,params,callback){
    get(name,function(err){
        if(err && err.message === 'not_found'){
            if(!Date.parse(start)) return callback(new Error("Start time is not valid"));
            if(!parseInt(period)) return callback(new Error("Invalid repeat time period for cron job, expected number (minutes)"));
            var dbparams = [ name, new Date(start), period, params ];
            pg.insert("INSERT INTO "+table+" (cronname,starttime,timeperiod,params) VALUES($1, $2, $3, $4)",dbparams,callback);
        }else callback(err ? err : new Error("cron job already "+name+" exists"));
    });
};

exports.update = function(name,start,period,params,callback){
    pg.update("UPDATE "+table+" SET starttime = $1, timeperiod = $2, params = $3 WHERE cronname = $4",[start,period,params,name],callback);
};

exports.updateStartTime = function(name,starttime,callback){
    pg.update("UPDATE "+table+" SET starttime = $1 WHERE cronname = $2",[starttime,name],callback);
};

exports.updatePeriod = function(name,period,callback){
    pg.update("UPDATE "+table+" SET timeperiod = $1 WHERE cronname = $2",[period,name],callback);
};

exports.updateParams = function(name,params,callback){
    pg.update("UPDATE "+table+" SET params = $1 WHERE cronname = $2",[params,name],callback);
};

exports.remove = function(name, callback){
    pg.delete("DELETE FROM "+table+" WHERE cronname = $1",[name],callback);
};

exports.getPending = function(withinSeconds,callback){
    var d = new Date(new Date().getTime()+withinSeconds*1000);
    pg.selectAll("SELECT * FROM "+table+" WHERE starttime < $1",[d],callback);
};

exports.getCronsLike = function(namelike,callback){
    pg.selectAll("SELECT * FROM "+table+" WHERE cronname like $1",[namelike],callback);
};

exports.createEvents = function(withinSeconds,callback){
    var d = new Date(new Date().getTime()+withinSeconds*1000);
    var updater = function(cronname,starttime,cb){
        pg.update("UPDATE "+table+" SET starttime = $1 WHERE cronname = $2",[starttime,cronname],cb);
    };
    pg.selectAll("SELECT * FROM "+table+" WHERE starttime < $1",[d],function(err,data){
        if(err || !data || !data.length){
            return callback(err);
        }
        async.each(data,function(d,cbs){
            createEvent(d.cronname,d.starttime,d.params,function(){
                updater(d.cronname,nextRun(d.starttime,d.timeperiod),cbs);
            });
        },callback);
    });
};


var createEvent = function(cronname,starttime,params, callback){
    pg.insert("INSERT INTO "+evttable+" (cronname,starttime,params,status)"+
            " VALUES($1,$2,$3,$4) RETURNING id",[cronname,starttime,params,eventStatus.none],function(err,id){
        callback(err,id);
    });
};

var updateEventRaised = function(id,callback){
    pg.update("UPDATE "+evttable+" SET lastraised = NOW(), raised = raised+1  WHERE id = $1",[id],callback);
};
exports.updateEventRaised = updateEventRaised;

exports.updateEventHandled = function(id,callback){
    pg.update("UPDATE "+evttable+" SET status = $1 WHERE id = $2",[eventStatus.handled,id],callback);
};


var deleteHandledEvents = function(callback){
    pg.delete("DELETE FROM "+evttable+" WHERE status = $1",[eventStatus.handled],function(err,rows){
        callback(err,rows);
    });
};

exports.processEvents = function(withinSeconds,eventRaiser,callback){
    deleteHandledEvents(function(){
        pg.getTransaction(function(err,t){
            if(err) return callback(err);
            var update = function(id,cb){
                t.exec("UPDATE "+evttable+" SET lastraised = NOW(), raised = raised+1, status = $1 WHERE id = $2",
                    [eventStatus.raised,id],cb
                );
            };
            var markEventFailed = function(id,callback){
                t.exec("UPDATE "+evttable+" SET status = $1 WHERE id = $2",[eventStatus.failed,id],callback);
            };
            async.series([
                function(cb){
                    t.begin(cb);
                },
                function(cb){
                    t.exec("LOCK TABLE "+evttable+" IN ACCESS EXCLUSIVE MODE",[],cb);
                },
                function(cb){
                    var sql = "SELECT * FROM "+evttable+" WHERE status = $1 OR status = $2";
                    t.exec(sql,[eventStatus.none,eventStatus.raised],function(err,data){
                        if(err || !data  || !data.rows || !data.rows.length) return cb(err);
                        async.each(data.rows,function(d,cbs){
                            if(d.raised === 0){
                                eventRaiser(d);
                                update(d.id,cbs);
                            }else if(d.raised < 4){
                                if(new Date().getTime() - new Date(d.lastraised).getTime() > withinSeconds * 1000){
                                    eventRaiser(d);
                                    update(d.id,cbs);
                                }else cbs();
                            }else{
                                markEventFailed(d.id,cbs);
                            }
                        },cb);
                    });
                }
            ],function(err){
                if(!err){
                    t.commit(callback);
                }
                else {
                    t.rollback();
                    callback(err);
                }
            });
        });
    });
};