/* * ************************************************************ 
 * Date: 20 Jan, 2018
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file student.js
 * *************************************************************** */


var errors = require("../Errors");
var Model = require("./base");
var conf = require("config").get("pg");
var tablename = conf.pgschema+".student";
var viewname = conf.pgschema+".studentview";

class Student extends Model {
    constructor (){
        super(tablename, {
            userid              : null,
            registrationdate    : null,
            standard            : null,
            stream              : null,
            section             : null
        });
    }
    
    getById (id,callback) {
        this.findOne({eq : {id : id}},viewname,callback);
    }
    
    create (userid,regdate,std,stream,sec,callback){
        var self = this;
        this.get(userid,function(err,res){
            if(res && res.username){
                return callback(new Error(errors.user_exists));
            }
            self.insert({ 
                userid : userid, registrationdate : regdate, standard : std,
                stream : stream, section : sec
            },callback);
        });
    }
    
    list (fields,callback){
        var cond = {};
        if(fields.name){
            cond.like = {name : "%"+fields.username+"%"};
        }
        if(fields.username || fields.email || fields.phone || fields.standard || fields.section){
            cond.eq = {};
            if(fields.username)
                cond.eq.username = fields.username;
            if(fields.email)
                cond.eq.email = fields.email;
            if(fields.phone)
                cond.eq.phone = fields.phone;
            if(fields.standard)
                cond.eq.standard = fields.standard;
            if(fields.section)
                cond.eq.section = fields.section;
        }
        this.find(cond,viewname,callback);
    }
    
    update (fields,cond,callback){
        var conditions = {eq : cond};
        super.update(fields,conditions,callback);
    }
    
    remove (cond,callback){
        super.remove({eq : cond},callback);
    }
}

module.exports = new Student();