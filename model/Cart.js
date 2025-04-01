const mongoose=require('mongoose');
let cartSchema=new mongoose.Schema({
  products:[
    {
        type:mongoose.Schema.ObjectId,
        ref:'Product'
    }
 ],
 total:{
    type:Number
 }
})
let Cart=mongoose.model('Cart',cartSchema);
module.exports={Cart};