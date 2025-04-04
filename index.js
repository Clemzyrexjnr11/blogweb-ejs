import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";
import env from "dotenv";
import multer from "multer";



 
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
const upload = multer({ dest: 'public/images/' })

env.config();


const db = new pg.Client({
    user:process.env.DB_USER,
    host:process.env.DB_HOST,
    database:process.env.DB_DATABASE,
    password:process.env.DB_PASSWORD,
    port:process.env.DB_PORT
})

db.connect((err)=>{
    if(err){
        console.log(err.message)
    }else{
        console.log({message:"Database connected successfully"});
    }
})

async function checkPostTable(){
    try{
        const result =  await db.query("SELECT * FROM post");
        // allPost = result.rows;
        return result.rows;
    }catch(error){
        console.log("Error occured while reading through the table",error.message)
    }
}

app.get("/",async function(req,res){
   const posts = await checkPostTable();
   res.render("index",{posts:posts});
})

app.get("/create_post",function(req,res){
    res.render("createpost.ejs");
})
app.post("/create",upload.single('imageUploaded'),function(req,res,next){
    let name = req.body["username"];
    let blogtitle = req.body["blogtitle"];
    let blogcontent = req.body["blogcontent"];
    let userBlogImage = req.file.destination + req.file.originalname;

    db.query("INSERT INTO post(name,blogtitle,blogcontent,posttime,blogimage) VALUES($1,$2,$3,$4,$5)",[name,blogtitle,blogcontent,new Date(),userBlogImage],(err,res)=>{
        if(err){
            console.log(err.message);
        }else{
            console.log("inserted successfully");

        }
    })
    res.redirect("/");
})

app.get("/userpost/:id",async function(req,res){
    const id = req.params.id;
     const posts = await checkPostTable();

     let user_post = posts.find((post)=> post.id == id);

     res.render("indvpost.ejs",{mypost:user_post})

})

app.get("/delete/:id",async function(req,res){
    const id = req.params.id;
    let posts = await checkPostTable();

   let user_post =  posts.find((post)=> post.id == id);
   
   await db.query("DELETE FROM post WHERE id = $1",[user_post.id],(err,res)=>{
    if(err){
        console.log(err.message)
    }else{
        console.log("deleted successfully");
    }
   })

   res.redirect("/")
})
app.get("/edit/:id",async function(req,res){
    const id = req.params.id;
    let posts = await checkPostTable();

    let user_post =  posts.find((post)=> post.id == id);
    // console.log(user_post);

    res.render("edit",{userPost:user_post})
})
app.post("/edit",async function(req,res){
    let id = req.body.id;
    let posts = await checkPostTable();

    let user_post =  posts.find((post)=> post.id == id);
    let blogtitle = req.body.blogtitle || user_post.blogtitle;
    let blogcontent = req.body.blogcontent || user_post.blogcontent;
    let username = req.body.username || user_post.name;

    await db.query("UPDATE post SET  name = $1, blogtitle = $2, blogcontent = $3,posttime = $4 WHERE id = $5",[username,blogtitle,blogcontent, new Date(),id],(err,res)=>{
       if(err){
        console.log(err.message)
       }else{
        console.log("updated successfully");
       }
    })
    res.redirect("/");
})

app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`);
})
