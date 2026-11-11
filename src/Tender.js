import express from 'express'
import {sequelize} from './Db.js'
import {DataTypes} from 'sequelize'
import {users } from './User.js'


export const Tender = express.Router() 


export const tenders = sequelize.define("tender", { 
    id:{ 
        primaryKey:true, 
        type:DataTypes.INTEGER, 
        allowNull:true, 
        autoIncrement:true
    }, 
    lender_id:{ 
        allowNull:false, 
        type:DataTypes.INTEGER, 
        refernces:{ 
            key:"id", 
            model:"users"
        }
    }, 
    title:{
        allowNull:false, 
        type:DataTypes.STRING
    }, 
    description:{
        allowNull:false, 
        type:DataTypes.STRING
    }, 
    budget:{
        allowNull:false, 
        type:DataTypes.DECIMAL
    },
    deadline:{
        allowNull:false, 
        type:DataTypes.DATE
    },
    created_at:{
        allowNull:false, 
        type:DataTypes.DATE
    }, 
    category:{ 
        allowNull:false, 
        type:DataTypes.STRING
    }
}, 
{ 
    tableName:"tender", 
    timestamps:false
})


Tender.get("/", async(req, res) => { 
    try{ 
        const findTenders = await tenders.findAll(); 
        return res.status(200).json(findTenders)
    }
    catch(err){ 
        console.error("Failed to fetch tenders", err)
        return res.status(500).json({message:"internal server error"})
    }
})