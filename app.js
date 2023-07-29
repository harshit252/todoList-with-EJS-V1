const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname+"/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();


const app = express();
// let items = ["Buy Food","Cook Food","Eat Food"];
// let workItems = [];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));  

const PORT = process.env.PORT || 3000

main().catch(err => console.log(err));
mongoose.set('strictQuery',false);
async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    app.listen(PORT,function(){
        console.log("Server started on port");
    });
    
    const itemsSchema = new mongoose.Schema({
        name: String
    });

    const Item = mongoose.model("Item",itemsSchema);

    const item1 = new Item({
        name: "Buy Food"
    });

    const item2 = new Item({
        name: "Cook Food"
    });
    const item3 = new Item({
        name: "Eat Food"
    });

    const defaultItems = [item1,item2,item3];

    const listSchema = new mongoose.Schema({
        name: String,
        items: [itemsSchema]
    });

    const List = mongoose.model("List",listSchema);
    
    app.post("/",async (req,res)=>{
        const itemName = req.body.newItem;
        const listTitle = req.body.list;
        const newItem = new Item({
            name: itemName
        });
        if(listTitle === "Today"){
            await newItem.save(); 
            res.redirect("/");
        } else {
            const listFound = await List.findOne({name: listTitle}).exec();
            listFound.items.push(newItem);
            listFound.save();
            res.redirect("/"+listTitle);
        }
    });

    app.post("/delete", async function(req,res){
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName;
        if(listName === "Today"){
            await Item.findByIdAndDelete(checkedItemId);
            res.redirect("/");
        } else {
            const listFound = await List.findOneAndUpdate({name: listName},{$pull: {items:{_id: checkedItemId}}});
            if(listFound){
                res.redirect("/"+listName);
            }
        }
    });

    app.get("/",async function (req,res){
        const itemArray = await Item.find({}).lean();
        // let day = date.getDate();
        if(itemArray.length === 0){
            Item.insertMany(defaultItems);
            res.redirect("/")
        } else {
            res.render("list",{listTitle: "Today",newListItem:itemArray});
        }
    });
    
    app.get("/:customListName",async function(req,res){
        const customListName = _.capitalize(req.params.customListName);
        const listFound = await List.findOne({name:customListName}).exec();
        if(listFound){
            res.render("list",{listTitle: listFound.name ,newListItem:listFound.items});
        } else{
            const list1 = new List({
                name: customListName,
                items: defaultItems
            });
            await list1.save();
            res.redirect("/"+customListName);
        }
    });
    
    app.get("/aboutus",function(req,res){
        res.render("aboutUs");
    });
    
    

}


