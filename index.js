const express=require('express');
const app =express();
const mysql= require('mysql');
const cors=require('cors');

const jwt_decode =require('jwt-decode');
const bodyParse=require('body-parser');
const cookiesParse=require('cookie-parser');
const session=require('express-session');
const bcrypt=require('bcrypt');
const saltRounds=10;
const jwt=require('jsonwebtoken');
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const diskstorage=multer.diskStorage({
    destination:path.join(__dirname,'./images'),
    filename:(req,file,cb)=>{
        cb(null,Date.now()+'-cheese-'+file.originalname)
    }
})
const fileUpload=multer({
    storage:diskstorage
}).single('image')
app.use(cors({
    origin:["http://localhost:3000/register","http://localhost:3000"],
    methods:["GET","POST"],
    credentials:true

}));

app.use(cookiesParse());
app.use(bodyParse.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
    key:"userId",
    secret:"cheese",
    resave:false,
    saveUninitialized:false,
    cookie:{
        expires:60*60*24,
    },
}));


const db=mysql.createPool({
    host:"localhost",
    user:"root",
    port:3300,
    password:"password",
    database:"web",
});

app.use(express.static(path.join(__dirname,'./dbimages/')))

app.post('/register',(req,res)=>{
  
    const email=req.body.email;
    const pass=req.body.pass;
    const direccion=req.body.direccion;
    bcrypt.hash(pass,saltRounds,(err,hash)=>{
        if(err){
            console.log(err);
        }
        let SQL="INSERT INTO usuario (cor_us, cont_us, dir_us) VALUES (?,?,?)";
        db.query(SQL,[email,hash,direccion],(err,result)=>{
        console.log(err);
           
        });
    })
   
 
});
app.post("/image/post",fileUpload,(req,res)=>{
    console.log(req.body)
    const nom=req.body.nom
    const des=req.body.des
    const pre=req.body.pre
    const type=req.file.mimetype
    const nameI=req.file.originalname
    const data=fs.readFileSync(path.join(__dirname,'./images/'+req.file.filename))

    let SQL="INSERT INTO producto (nom_prod, des_prod, cat,nom_img,img,pre_prod,type_prod) VALUES (?,?,'mueble',?,?,?,?)";
    db.query(SQL,[nom,des,nameI,data,pre,type],(err,result)=>{
    console.log(err);
       
    });
})
app.get("/image/get",(req,res)=>{

    let SQL="select * from producto;";
    db.query(SQL,(err,Row)=>{  
        Row.map(img=>{
            fs.writeFileSync(path.join(__dirname,'./dbimages/'+img.id_prod + '-cheese.png'),img.img)
       })
       const imagedir=fs.readdirSync(path.join(__dirname,'./dbimages/'))
  res.json(imagedir)
       console.log(imagedir)
    });
})


const verifyJWT =(req,res,next)=>{
    const token = req.headers["x-access-token"]
    if(!token){
        res.send("token");
       
    }else{
        jwt.verify(token,"jwtSecret",(err,decoded)=>{
            if(err){
                res.json({auth:false,message:"autentificacion fallida"});
            }else{
                req,userId=decoded.id;
                next();
            }
        })
    }
};

app.get('/verify',verifyJWT ,(req,res)=>{
    res.send("autenticado");
    
   
});  

app.get('/login',(req,res)=>{
   if(req.session.user){
       res.send({loggedIn:true,user:req.session.user});
   }else{
    res.send({loggedIn:false});
   }
});
app.post('/login',(req,res)=>{
    const email=req.body.email;
    const pass=req.body.pass;
    let SQL="SELECT * FROM usuario WHERE cor_us = ?;";
    db.query(SQL,[email],(err,result)=>{
        if(err){
            res.send({err:err});
        }if(result.length>0){
          bcrypt.compare(pass,result[0].cont_us,(error,response)=>{
              if(response){
                   const id =result[0].id_us;
                   const token=jwt.sign({id},"jwtSecret",{
                       expiresIn: 300,
                       
                   });
                    res.json({auth: true,token:token,result:result});
              }else{
                res.json({auth: false ,message:"El correo o la contraseña esta incorrecto"}) ;
              }
          })
        }else{
            res.json({auth: false ,message:"La cuenta no existe"});
        }
    });
})


app.listen(3001,()=>{
    console.log("corre en el puerto 3001")
})