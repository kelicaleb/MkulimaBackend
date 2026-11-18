import {tenders} from '../src/Tender.js'
import {users }from '../src/User.js'; 
import {tenderapplications} from '../src/TenderApplication.js'


//tender user connection 
users.hasOne(tenders, {foreignKey:"lender_id"})
tenders.belongsTo(users,{foreignKey:"lender_id"})

//tender application to tenders 
tenders.hasOne(tenderapplications, {foreignKey:"tender_id"})
tenderapplications.belongsTo(tenders, {foreignKey:"tender_id"})

//tender application with user
users.hasOne(tenderapplications, {foreignKey:"user_id"})
tenderapplications.belongsTo(users, {foreignKey:"user_id"})