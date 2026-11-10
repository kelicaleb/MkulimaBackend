import express from 'express'; 
import dotenv from 'dotenv'; 
import cors from 'cors'; 
import { User } from './src/User.js'



dotenv.config()

const app = express() 
app.use(cors()); 
app.use(express.json())
app.use('/users', User)
const port = process.env.PORT


app.listen(port, () => { 
    console.log(`Server is running on ${port}`)
})