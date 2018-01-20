/* * ************************************************************ 
 * Date: 20 Jan, 2018
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file Stream.js
 * *************************************************************** */


var errors = require("../Errors");
var Model = require("./base");
var conf = require("config").get("pg");
var tablename = conf.pgschema+".streams";

class Stream extends Model {
    constructor (){
        super(tablename, {
            id : null, name : null, standardid : null
        });
    }
    
    get (standard,name,callback){
        this.findOne({eq : {standardid : standard, name : name}}, callback);
    }
    
    getById (id,callback) {
        this.findOne({eq : {id : id}},callback);
    }
    
    create (stdid,name,callback){
        var self = this;
        this.get(stdid, name,function(err,res){
            if(res && res.name){
                return callback(new Error(errors.duplicate_value));
            }
            self.insert({ 
                name : name, standardid : stdid
            },callback);
        });
    }
    
    list (fields,callback){
        var cond = {};
        if(fields.name){
            cond.like = {name : "%"+fields.name+"%"};
        }
        if(fields.standardid){
            cond.eq = {standardid : fields.standardid};
        }
        this.find(cond,callback);
    }
    
    update (fields,cond,callback){
        var conditions = {eq : cond};
        super.update(fields,conditions,callback);
    }
    
    remove (cond,callback){
        super.remove({eq : cond},callback);
    }
}

module.exports = new Stream();