
const mongoose = require('mongoose')
const schema = require("mongoose")

const SalesOrderLineSchema = new mongoose.Schema({
    customerId:{
        type:Number,
        required:true
    },
    salesOrderId:{
        type:Number,
        required:true 
    },
    itemCode:{
        type:String,
        required:true
    },
    itemName:{
        type:String,
        required:true
    },
    unitPrice:{
        type:Number,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    totalPrice:{
        type:Number,
        required:true 
    }
})

// SalesOrderLineSchema.pre('save',function(next){
//     if (this.unitPrice){
//         this.unitPrice=parseFloat(this.unitPrice.toFixed(2))
//     }
//     if (this.quanity){
//         this.quanity=parseFloat(this.quanity.toFixed(2))
//     }
//     if (this.totalPrice){
//         this.totalPrice=parseFloat(this.totalPrice.toFixed(2))
//     }
// })

const salesOrderLineModel = new mongoose.model("SalesOrderLine",SalesOrderLineSchema)

module.exports = salesOrderLineModel