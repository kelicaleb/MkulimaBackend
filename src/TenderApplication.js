import express from 'express'
import {DataTypes } from 'sequelize'; 
import {sequelize } from './Db.js'
import {tenders} from './Tender.js'; 
import {users }from './User.js'
import {upload } from '../Tools/Upload.js'




export const TenderApplication = express.Router() 


export const tenderapplications = sequelize.define("tender_applications", { 
    id:{ 
        primaryKey:true, 
        autoIncrement:true, 
        allowNull:true, 
        type:DataTypes.INTEGER
    }, 
    tender_id:{ 
        allowNull:false, 
        type:DataTypes.INTEGER, 
        references:{ 
            key:"tender_id", 
            model:"tender"
        }
    }, 
    user_id:{ 
        allowNull:false,  
        type:DataTypes.INTEGER, 
        refernces:{ 
            model:"user",
            key:"id"
        }
    }, 
    company_name:{ 
        allowNull:false, 
        type:DataTypes.STRING
    }, 
    bid_amount:{ 
        allowNull:false, 
        type:DataTypes.DECIMAL
    },
    proposal_file:{ 
        allowNull:false, 
        type:DataTypes.BLOB
    }, 
    status:{
        allowNull:false, 
        type:DataTypes.STRING
    }, 
    applied_at:{ 
        allowNull:true, 
        type:DataTypes.DATE
    }
}, { 
    tableName:"tender_applications", 
    timestamps:false
})

TenderApplication.get("/", async(req, res) => { 
    try{ 
        const findTenderApplication = await tenderapplications.findAll()
        return res.status(200).json(findTenderApplication)
    }
    catch(err){ 
        console.error("Failed to fetch tender applications", err)
        return res.status(500).json({message:"Internal server error"})
    }
})
//post tender applications

TenderApplication.post("/createTenderApplication/:user_id", upload.single('proposal_file'), async(req, res) => { 
    try{ 
        const { user_id } = req.params; 
        const {tender_id, company_name, bid_amount,} = req.body; 
        const createTenderApplications = await tenderapplications.create({ 
            tender_id:tender_id, 
            user_id:user_id, 
            company_name:company_name, 
            bid_amount:bid_amount, 
            proposal_file:req.file.buffer, 
            status:"Pending"

        })
        return res.status(200).json(createTenderApplications)
    }
    catch(err){ 
        console.error("Failed to apply tender", err)
        return res.status(500).json({message:"Internal server error"})
    }
})