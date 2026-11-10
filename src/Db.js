import {Sequelize } from 'sequelize'; 
import dotenv from 'dotenv'; 





dotenv.config() 
const username = process.env.DB_USERNAME; 
const database = process.env.DB_DATABASE; 
const password = process.env.DB_PASSWORD; 
const host = process.env.DB_HOST;

export const sequelize = new Sequelize(database, username, password, { 
    host:host, 
    dialect:"postgres", 
    logging:false, 

})


sequelize.sync()
.then((res) => console.log("connected to the database successfully"))