import {sequelize } from './Db.js'; 
import {DataTypes} from 'sequelize'; 
import express from 'express'; 
import bcrypt   from 'bcrypt'


export const User = express.Router() 



export const users = sequelize.define("users", { 
    id:{ 
        primaryKey:true, 
        autoIncrement:true, 
        type:DataTypes.INTEGER, 
        allowNull:true
    }, 
    first_name:{ 
        type:DataTypes.STRING, 
        allowNull:false
    }, 
    last_name:{ 
        allowNull:false, 
        type:DataTypes.STRING
    }, 
    password:{ 
        type:DataTypes.STRING, 
        allowNull:false
    }, 
    role:{ 
        type:DataTypes.STRING, 
        allowNull:false
    }, 
    create_at:{ 
        allowNull:true, 
        type:DataTypes.DATE
    }, 
     email:{ 
        type:DataTypes.STRING,
        allowNull:false
    }, 
}, { 
    tableName:"users", 
    timestamps:false
})



User.get("/", async(req, res)=> { 
    try{ 
        const findUsers = await users.findAll()
        return res.status(200).json(findUsers)
    }
    catch(err){ 
        console.error("Failed to fetch users", err)
        return res.status(500).json({message: "internal server error"})
    }
})
//register user
User.post("/register/user", async(req, res) => { 
    try{ 
        const {first_name, last_name, password, email} = req.body;
        const salt = await bcrypt.genSalt(10); 
        const hash = await bcrypt.hash(password, salt)
        const date = new Date() 
        const createUser = await users.create({ 
            first_name:first_name, 
            last_name:last_name, 
            password:hash,
            role:"User",
            create_at:date, 
            email:email, 

        })
        return res.status(200).json(createUser)

    }
    catch(err){ 
        console.error("Faield to create user", err)
        return res.status(500).json({message:"Internal server errorr"})
    }
})
//login 

User.post("/login/user", async(req, res) => { 
    try{ 
        const { email, password} = req.body; 
        const findUser = await users.findOne({ 
            where:{ 
                email:email
            }
        })
        if(email){ 
            const comparePassword = await bcrypt.compare(password, findUser.password)
            if(comparePassword){ 
                return res.status(200).json
            }
            else{ 
                return res.status(400).json({message: "Wrong password"})
            }

        }
        else{ 
            return res.status(400).json({message:"Could not find user"})
        }
    }
    catch(err){ 
        console.error("Failed to login ", err)
        return res.status(500).json({message:"Internal server error"})
    }
})