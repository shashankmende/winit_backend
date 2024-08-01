
const mongoose = require('mongoose')

const StoreSchema = new mongoose.Schema({
   pending:[{
    type:Object,
    required:true
   }],
   approved:[{
    type:Object,
    required:true 
   }],
   rejected:[{
    type:Object,
    required:true
   }]
})


const StoreModel = new mongoose.model("Store",StoreSchema)

module.exports=StoreModel