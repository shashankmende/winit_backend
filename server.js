
require('dotenv').config()

const express = require("express")

const cors = require("cors")

const router = require('./router/winitRouter')


const ConnectToDb = require("./utils/db")

const app = express()

const PORT = process.env.PORT

app.use(cors())
app.use(express.json())

app.use('/winit_services',router)

ConnectToDb().then(()=>{

    app.listen(PORT,()=>console.log(`Server is running at http://localhost:${PORT}`))
}).catch((error) => {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
});