let mongoose = require('mongoose')
let userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    token:{
        type:String,
        required:true
    },
    role:{
        type:String,
        default:"user"
    },
    cart:{
        type:mongoose.Schema.ObjectId,
        ref:'Cart'
    }
})

let User=mongoose.model("User",userSchema);
module.exports={User};


