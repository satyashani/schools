/* * ************************************************************ 
 * Date: 2 Jan, 2018
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file users.js
 * *************************************************************** */



var async = require('async');
var pg = require("../postgres")();
var errors = require("../Errors");
var crypto = require('crypto');

var table = 'users';

var makepass = function(pass){
    return crypto.createHash('md5').update("xTrEm35A1t"+pass).digest('hex');
};

var users = {
    findOne : function(testObj,callback){
        var t = testObj || {}, cond = [], params = [];
        if(t.username){
            params.push(t.username);
            cond.push("username = $"+params.length);
        }
        if(t.name){
            params.push(t.name);
            cond.push("name = $"+params.length);
        }
        if(t.email){
            params.push(t.email);
            cond.push("email = $"+params.length);
        }
        if(t.phone){
            params.push(t.phone);
            cond.push("phone = $"+params.length);
        }
        if(!cond.length){
            return callback(new Error(errors.no_search_condition));
        }
        pg.select("SELECT * FROM "+table+" WHERE "+cond.join(" AND "),params,callback);
    },
    find : function(testObj,callback){
        var t = testObj || {}, cond = [], params = [];
        if(t.username){
            params.push(`%{t.username}%`);
            cond.push("username like $"+params.length);
        }
        if(t.name){
            params.push(t.name);
            cond.push("name = $"+params.length);
        }
        if(t.email){
            params.push(t.email);
            cond.push("email = $"+params.length);
        }
        if(t.phone){
            params.push(t.phone);
            cond.push("phone = $"+params.length);
        }
        if(!cond.length){
            return callback(new Error(errors.no_search_condition));
        }
        pg.selectAll("SELECT * FROM "+table+" WHERE "+cond.join(" OR "),params,callback);
    },
    create : function(username,name,email,phone,password,picture,roleid,callback){
        var fields = ['username','name','email','phone','password','picture','roleid'].join(",");
        var params = [username,name,email,phone,makepass(password),picture,roleid];
        var holders = ["$1","$2",'$3',"$4","$5","$6","$7"];
        pg.insert("INSERT INTO "+table+"("+fields+") VALUES ("+holders+")",params,callback);
    },
    update : function(updateObj,callback){
        if(!updateObj.userid || !parseInt(updateObj.userid))
            return callback(new Error(errors.invalid_userid));
        
        var fields = ['username','name','email','phone','password','picture','roleid'];
        var fieldsSelected = [], params = [];
        fields.forEach(function(f){
            if(updateObj.hasOwnProperty(f)){
                params.push(updateObj[f]);
                fieldsSelected.push(f+" = $"+params.length);
            }
        });
        
        params.push(updateObj.userid);
        if(!fieldsSelected.length){
            return callback(null,0);
        }
        pg.update("UPDATE "+table+" SET "+fieldsSelected.join(",") + " WHERE userid = $"+params.length,params,callback);
    },
    remove : function (userid,callback){
        pg.delete("DELET FROM "+table+" WHERE userid = $1",[userid],callback);
    }
};
