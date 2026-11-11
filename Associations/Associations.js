import {tenders} from '../src/Tender.js'
import {users }from '../src/User.js'; 



//tender user connection 
users.hasOne(tenders, {foreignKey:"lender_id"})
tenders.belongsTo(users,{foreignKey:"lender_id"})