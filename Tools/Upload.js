import multer from 'multer'



export const upload = multer({Storage:multer.memoryStorage()})