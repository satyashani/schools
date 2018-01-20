/* * ************************************************************ 
 * Date: 20 Jan, 2018
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file subjects.js
 * *************************************************************** */



var errors = require("../Errors");
var Model = require("./base");
var conf = require("config").get("pg");
var tablename = conf.pgschema+".subjects";

class Subjects extends Model {
    constructor (){
        super(tablename, {
            id : null, name : null
        });
    }
    
    get (name,callback){
        this.findOne({eq : { name : name}}, callback);
    }
    
    getById (id,callback) {
        this.findOne({eq : {id : id}},callback);
    }
    
    create (name,callback){
        var self = this;
        this.get( name,function(err,res){
            if(res && res.name){
                return callback(new Error(errors.duplicate_value));
            }
            self.insert({ 
                name : name
            },callback);
        });
    }
    
    list (fields,callback){
        var cond = {};
        if(fields.name){
            cond.like = {name : "%"+fields.name+"%"};
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

module.exports = new Subjects();