
const mongoose = require('mongoose')

const SalesOrderSchema = new mongoose.Schema({
    id:{
        type:Number,
        required:true 
    },
    salesOrderNumber:{
        type:String,
        required:true 
    },
    customerCode:{
        type:String,
        required:true 
    },
    customerName:{
        type:String,
        required:true 
    },
    orderDate:{
        type:Date,
        required:true 
    },
    totalAmount:{
        type:Number,
        required:true 
    }
})


SalesOrderSchema.pre('save',function(next){
    if(this.totalAmount){
        this.totalAmount= parseFloat(this.totalAmount.toFixed(3))
    }
    next();
})


const salesOrderModel = new mongoose.model("SalesOrder",schema)

module.exports=salesOrderModel