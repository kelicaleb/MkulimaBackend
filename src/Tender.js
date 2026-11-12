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
//get user tender
Tender.get("/:user_id", async(req, res) => { 
    try{ 
        const {user_id} = req.params; 
        const findUserTender = await tenders.findAll({ 
            where:{ 
                lender_id:user_id
            }
        })
        return res.status(200).json(findUserTender)
    }
    catch(err){ 
        console.error("Failed to fetch user tender", err)
        return res.status(500).json({message: "Internal server error"})
    }
})
//post tender 
Tender.post("/addTender/:user_id", async(req, res)=> { 
    try{ 
        const {user_id} = req.params; 
        const {title, description, budget, category }  = req.body
        const today = new Date();
        const dataIn30Days = new Date(today);
        const createTender = await tenders.create({ 
            lender_id:user_id, 
            title:title, 
            description:description, 
            budget:budget, 
            deadline:dataIn30Days.setDate(today.getDate() + 30), 
            created_at:today, 
            category:category
        })
        return res.status(200).json(createTender)
    }
    catch(err){ 
        console.error("Failed to create tender", err)
        return res.status(500).json({message:"Internal server error"})
    }
})