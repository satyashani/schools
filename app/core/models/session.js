/* * ************************************************************ 
 * 
 * Date: 8 May, 2015
 * version: 0.0.1
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Description:   
 * Javascript file session.js
 * *************************************************************** */

var errors = require("../Errors");
var Model = require("./base");
var conf = require("config").get("pg");
var tablename = conf.pgschema+".session";

var dayms = 86400000;

class Session extends Model {
    constructor (){
        super(tablename, {
            s : null,
            sess : null,
            validtill : null
        });
    }
    
    create (s,sess,validdays,callback){
        var self = this;
        this.findOne(s,function(err,ses){
            if(ses && ses.s){
                callback(err,ses);
            }else{
                var v = new Date(new Date().getTime()+validdays*dayms);
                self.insert({s : s, sess : sess, validtill : v},callback);
            }
        });
    }
    
    update (s,sess,cb){
        super.update({sess : sess},{ eq : {s : s} }, cb);
    }
    
    remove (s,cb){
        super.remove({eq : {s : s}},cb);
    }
    
    get (s,cb){
        super.findOne({eq : {s : s}},cb);
    }
    
    touch (s,days,cb){
        var v = new Date(new Date().getTime()+days*dayms);
        super.update({validtill : v}, { eq : {s : s}}, cb);
    }
    
    removeExpired (cb){
        super.remove({ lt : {validtill : new Date()}},cb);
    }
};
