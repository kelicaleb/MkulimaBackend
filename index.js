import express from 'express'; 
import dotenv from 'dotenv'; 
import cors from 'cors'; 
import './Associations/Associations.js'
import { User } from './src/User.js'
import {Tender } from './src/Tender.js'


dotenv.config()

const app = express() 
app.use(cors()); 
app.use(express.json())
app.use('/users', User)
app.use("/tender", Tender)
const port = process.env.PORT


app.listen(port, () => { 
    console.log(`Server is running on ${port}`)
})