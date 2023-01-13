const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// using module that I have created
const date = require(__dirname + "/date.js");

const app = express();
const port = process.env.PORT || 3000;
// const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// need to create a folder name "views" to contain the file you want to make as template.
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// try connect to database
mongoose.set('strictQuery', true);

// connect to local mongoDB
// mongoose.connect("mongodb://127.0.0.1:27017/todosDB",
// {serverSelectionTimeoutMS: 3000}); 

// connect to cloud mongoDB
mongoose.connect("mongodb+srv://admin-dicky:1201Tandra@cluster0.t5x1lwt.mongodb.net/todosDB",
{serverSelectionTimeoutMS: 3000}); 

// create a schema for todo list
const itemSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemSchema]
};

// create model based on itemSchema
// use singular name Item not Items
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

// create item document
const item1 = new Item ({
    name: "Buy Food"
});

const item2 = new Item ({
    name: "Cook Food"
});

const item3 = new Item ({
    name: "Eat Food"
});

const defaultItems = [item1, item2, item3];


// <<<<<<<<<<<<<<<<< code jadul >>>>>>>>>>>>>>>>>>>
// hanya di javascript const dapat ditambahkan value seperti push, tetapi tidak dapat diubah valuenya.
// const toDoItems = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function (req, res) {
    // calling the function getDate() from own module
    // day = date.getDate();
    
    Item.find( {}, (e, foundItems) => {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, err => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Insert Many Berhasil!!");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", items: foundItems, route: "/"});
        }    
    }); 
})


app.post("/", function (req, res) {
    
    const inputList = req.body.newList; // get the user input
    let listName = req.body.listName;
    
    
    const newItem = new Item ({ // create new document
        name: inputList
    });
    
    if (inputList !== "") {
        // check for default route
        if (listName === "Today") {            
            newItem.save(); // save list to DB
            res.redirect("/"); // redirect to the default location
        } else {
            List.findOne( {name: listName}, function (err, foundOne) {
                if (err) {
                    console.log(err);
                } else {
                    foundOne.items.push(newItem);
                    foundOne.save(function (err, doc, isDone) {
                        if (!err) {
                            res.redirect("/" + listName); // redirect to the right location
                        }
                    });
                }
            });
        }
        
    }

    
})

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get("/:customTitle", (req, res) => {
    const title = _.capitalize(req.params.customTitle); // store the title name in the parameters.

    const list = new List ({
        name: title,
        items: defaultItems
    });


    // find if the title already exist, if yes we do nothing
    List.findOne( {name: title}, function(err, listFound) {
        if(err) {
            console.log(err);
        } else {

            if (!listFound) { // listFound type is objects so we use null

                list.save(); // save list to DB
                console.log("Creating new list: " + title);
                res.redirect("/" + title);
            } else {
                res.render("list", {listTitle: listFound.name, items:listFound.items, route: "/"});
            }
        }      
    });
})

app.get("/about", function (req, res) {
    res.render("about");
})

app.listen(port, function () {
    console.log("Server started on port " + port);
})

// this route for deleting the item that has been checked by user!
app.post("/delete", function (req, res) {
    // get the value of the submitted id
    const deleteThisId = req.body.checkedId;
    let listName = req.body.listName;

    // check for default route
    if (listName === "Today") {
        // default route
        Item.findByIdAndDelete({_id: deleteThisId}, function (err) {
            if  (err) {
                console.log(err);
            } else {
                console.log("ID: " + deleteThisId + " has been deleted!");
            }
        });
        res.redirect("/");
    } else {
        
        // custom route
        List.findOneAndUpdate({name: listName}, { $pull: {items: {_id: deleteThisId}} }, function (e, foundId) {
            if (!e) {
                res.redirect("/" + listName);
            } else {
                console.log(e);
            }
        });
     
    }
    
    
})







// app.get("/work", function (req, res) {
//     res.render("list", {
//         listTitle: "Work List",
//         items: workItems,
//         route: "/work"});
// })

// app.post("/work", function (req, res) {
//     let item = req.body.newItem;
    
//     if (item !== "") {

//         workItems.push(item);
//     }
//     res.redirect("/work");
// })