/* * ************************************************************ 
 * Date: 2 Jan, 2018
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file users.js
 * *************************************************************** */


var crypto = require('crypto');
var errors = require("../Errors");
var Model = require("./base");
var conf = require("config").get("pg");
var tablename = conf.pgschema+".users";

var makepass = function(pass){
    return crypto.createHash('md5').update("xTrEm35A1t"+pass).digest('hex');
};

class Users extends Model {
    constructor (){
        super(tablename, {
            id : null,
            name : null,
            username : null,
            email : null,
            phone : null,
            password : null,
            picture : null,
            roleid : null,
            address : null,
            city : null,
            dob : null,
            fathername : null
        });
    }
    
    getByUsername (username,callback) {
        this.findOne({eq : {username : username}},callback);
    }
    
    getById (id,callback) {
        this.findOne({eq : {id : id}},callback);
    }
    
    create (name,username,email,phone,password,pic,role,add,city,dob,father,callback){
        var self = this;
        this.get(username,function(err,res){
            if(res && res.username){
                return callback(new Error(errors.user_exists));
            }
            self.insert({ 
                name : name, username : username, email : email,
                phone : phone, password : makepass(password), picture : pic,
                roleid : role,address : add, city : city, dob : dob, father : father
            },callback);
        });
    }
    
    list (fields,callback){
        var cond = {};
        if(fields.name){
            cond.like = {name : "%"+fields.username+"%"};
        }
        if(fields.username || fields.email || fields.phone){
            cond.eq = {};
            if(fields.username)
                cond.eq.username = fields.username;
            if(fields.email)
                cond.eq.email = fields.email;
            if(fields.phone)
                cond.eq.phone = fields.phone;
        }
        this.find(cond,callback);
    }
    
    update (fields,cond,callback){
        if(fields.password){
            fields.password = makepass(fields.password);
        }
        var conditions = {eq : cond};
        super.update(fields,conditions,callback);
    }
    
    remove (cond,callback){
        super.remove({eq : cond},callback);
    }
}

module.exports = new Users();