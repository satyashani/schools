/* * ************************************************************ 
 * Date: 20 Jan, 2018
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file streamsbj.js
 * *************************************************************** */


var errors = require("../Errors");
var Model = require("./base");
var conf = require("config").get("pg");
var tablename = conf.pgschema+".streamsbj";
var view = conf.pgschema+".strsbj";

class Streamsbj extends Model {
    constructor (){
        super(tablename, {
            streamid : null, subjectid : null
        });
    }
    
    get (streamid,subjectid,callback){
        this.findOne({eq : {streamid : streamid, subjectid : subjectid}},callback);
    }
    
    create (streamid,subjectid,callback){
        var self = this;
        this.get(streamid,subjectid,function(err,res){
            if(res && res.streamid){
                return callback(new Error(errors.duplicate_value));
            }
            self.insert({ 
                streamid : streamid, subjectid : subjectid
            },callback);
        });
    }
    
    list (fields,callback){
        this.find({ eq : fields},callback);
    }
    
    update (fields,cond,callback){
        var conditions = {eq : cond};
        super.update(fields,conditions,callback);
    }
    
    remove (cond,callback){
        super.remove({eq : cond},callback);
    }
}

module.exports = new Streamsbj();