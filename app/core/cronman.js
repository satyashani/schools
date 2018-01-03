/* * ************************************************************ 
 * Date: 30 May, 2016
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file cronman.js
 * 
 * Cron Job Manager
 * *************************************************************** */


var async = require("async");
var models = require("../models");
var events = require('events');
var util = require('util');
var xlog = require("./xlog");

var period = 15, modulename = 'CronMan';
var CronMan = function() {
    this.interval = null;
    /**
     * Read interval in seconds
     */
    this.period = period;
    events.EventEmitter.call(this);
};

util.inherits(CronMan, events.EventEmitter);

var nextRun = function(starttime,syncperiod){
    if(!syncperiod || !parseInt(syncperiod)) return starttime;
    var frequency = ( parseInt(syncperiod) || 1440) * 60 * 1000;
    var nextrun = new Date(starttime).getTime();
    var now = new Date().getTime()+period * 1000;
    while(now > nextrun){
        nextrun += frequency;
    }
    return new Date(nextrun).toGMTString();
};

/**
 * 
 * @param {strring} name
 * @param {date} starttime String or date object with time zone
 * @param {integer} period
 * @param {object} params
 * @param {function} callback
 */
CronMan.prototype.create = function(name,starttime,period,params,callback){
    models.cronjobs.get(name,function(err,cron){
        if(err || !cron){
            xlog.console.action(modulename,'Creating cron',name,starttime,period);
            models.cronjobs.create(name,starttime,period,params,callback);
        }else{
            xlog.console.action(modulename,'Updating cron',name,starttime,period);
            models.cronjobs.update(name,nextRun(cron.starttime,cron.timeperiod), period,params,callback);
        }
    });
    return this;
};

CronMan.prototype.update = function(name,starttime,period,params,callback){
    xlog.console.action(modulename,"Updating cron job",name,starttime,period,params);
    if(!Date.parse(starttime))
        callback(new Error("Could not parse date string "+ starttime));
    else
        models.cronjobs.update(name,new Date(starttime), period,params,callback);
    return this;
};

CronMan.prototype.updateStartTime = function(name,time,callback){
    if(!Date.parse(time))
        callback(new Error("Could not parse date string "+ time));
    else
        models.cronjobs.updateStartTime(name,new Date(time),callback);
    return this;
};
CronMan.prototype.updatePeriod = function(name,period,callback){
    xlog.console.action(modulename,'Updating period for cron',name,', new period:',period);
    models.cronjobs.updatePeriod(name,period,callback);
    return this;
};
CronMan.prototype.updateParams = function(name,params,callback){
    xlog.console.action(modulename,'Updating params for cron',name,', new period:',params);
    models.cronjobs.updateParams(name,params,callback);
    return this;
};
CronMan.prototype.markEventHandled = function(id,callback){
    xlog.console.action(modulename,'Event handled - id ',id);
    models.cronjobs.updateEventHandled(id,callback);
    return this;
};

CronMan.prototype.remove = function(name,callback){
    xlog.console.action(modulename,'Removing cron',name);
    this.removeAllListeners(name);
    models.cronjobs.remove(name,callback);
    return this;
};

CronMan.prototype.get = function(name,callback){
    models.cronjobs.get(name,callback);
    return this;
};

CronMan.prototype.reader = function(callback){
    var me = this;
    var eventRaiser = function(c){
        if(!c.params) c.params = {};
        c.params.id = c.id;
        me.emit(c.cronname,c.params);
    };
    var randTimeGap = 1000+Math.ceil(Math.random()*5)*1000;
    setTimeout(function(){
        models.cronjobs.createEvents(period,function(){
            models.cronjobs.processEvents(period,eventRaiser,callback);
        });
    },randTimeGap);
};

CronMan.prototype.startReader = function(){
    xlog.console.info(modulename,"Start");
    var me = this;
    this.interval = setInterval(function(){
        me.reader(function(err){
            if(err) xlog.console.error(modulename,err);
        });
    },this.period*1000);
};

CronMan.prototype.stop = function(){
    if(this.interval) clearInterval(this.interval);
    return this;
};

var cronman = new CronMan();

cronman.startReader();

module.exports = cronman;