
const mongoose = require("mongoose")

const uri = process.env.MONGO_URI 

const ConnectToDb =async()=>{
    try {
        mongoose.connect(uri)
        console.log("Connection to database is successful")
    } catch (error) {
        console.log("database connection failed",error)
    }
}


module.exports = ConnectToDb