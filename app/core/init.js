/* * ************************************************************ 
 * Date: 2 Jan, 2018
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file init.js
 * *************************************************************** */


var models = require("./models/");
var config = require("config");

var modulename = 'INIT';

var initiator = {
    modules : ['db','dbupgrade'],
    states : {
        db : {state :"" , message : ''},
        dbupgrade : {state :"" , message : ''}
    },
    setState : function(comp,state,message){
        if(state === 'fail')
            console.error(modulename,'Failed to init',comp,message);
        else if(state === 'incomplete')
            console.error(modulename,'init incomplete',comp,message);
        else
            console.log(modulename,'Setup state of',comp,"-",state,":",message);
        initiator.states[comp].state = state;
        initiator.states[comp].message = message || '';
    },
    getState : function(comp){
        return initiator.states[comp].state;
    },
    getMessage : function(comp){
        return initiator.states[comp].message;
    },
    tests : {
        db : function(cb){
            if(!conf.pg || !conf.pg.pgschema){
                initiator.setState('db','fail','Database configuration missing');
                return cb(new Error(initiator.getMessage('db')));
            }
            models.schema.create(config.pg.pgschema,function(err){
                if(err){
                    initiator.setState('db','fail','Database initialization failed, '+err.message);
                    cb(new Error(initiator.getMessage('db')));
                }else{
                    initiator.setState('db','complete','Database configuration complete');
                    cb(null,true);
                }
            });
        },
        dbupgrade : function(cb){
            models.schema.upgrade(config.pg.pgschema,function(err,ver){
                if(err){
                    initiator.setState('dbupgrade','fail','Failed to upgrade database', "Error:"+err.message);
                    cb(new Error(initiator.getMessage('dbupgrade')));
                }else{
                    initiator.setState('dbupgrade','complete','Upgrade database');
                    cb();
                }
            });
        }
    }
};

module.exports = initiator;