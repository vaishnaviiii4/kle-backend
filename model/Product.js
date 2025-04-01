let mongoose=require('mongoose');

let productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
    },
    brand:{
        type:String,
    },
    image:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User'
    }
})
let Product=mongoose.model('Product',productSchema);
module.exports={Product};