const express = require('express')
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/movieApp')
const app = express()
const multer  = require('multer')
const fs = require('fs');
const { error } = require('console');
const { movieModel } = require('./schema');

app.set('view engine', 'ejs');
app.use(express.static('upload'));
app.use(express.static('public'));

//-----------------multer
const storage = multer.diskStorage({
    destination : function(req,file,cb){
        return cb(null, './upload')
    },
    filename :function(req,file,cb){
        return cb(null, file.originalname)
        console.log(file)
    }
})

const upload = multer({ storage: storage }).single('file')

app.get('/', function(req,res){
    res.render('./Pages/home')
})

app.get('/upload', function(req,res){
    res.render('./Pages/index')
})

app.post('/upload', function (req, res) {
    console.log(req.body)
    upload(req, res, async function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send('Error uploading file.');
        }

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const details = {
            name: req.body.name,
            description: req.body.description,
            year: req.body.year,
            genre: req.body.genre,
            rating: req.body.rating,
            file: req.file.originalname
        };

        try {
            const profile = await movieModel(details);
            const result = await profile.save();
            res.redirect('/');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error saving movie details.');
        }
    });
});
app.get('/list', async function(req,res){
    const movies = await movieModel.find({})
    res.render('./Pages/watchlist', {movies : movies})
})

//-----------DeleteData

app.get('/deleteData/:id', async function(req, res){
    var id = req.params.id
    const image = await movieModel.findOne({_id : id})
    const result = await movieModel.findByIdAndDelete({_id : id})
    if(result){
        fs.unlink(`upload/${image.file}`, (err)=>{
            if(err){
                console.log(err)
            }
            console.log('successs..')
        })
        res.redirect('/list')
    }
})

//-------------------editData

app.get('/editData/:id', async function(req, res){
    var id = req.params.id
    const movies = await movieModel.findOne({_id : id})
    res.render('./Pages/edit', {movies : movies})
})

app.post('/editData/:id', async function(req, res){
    var id = req.params.id
    upload(req, res, async () => {
        try {
            var oldMovie = await movieModel.findOne({ _id: id });

            const details = {
                name: req.body.name,
                description: req.body.description,
                year: req.body.year,
                genre: req.body.genre,
                rating: req.body.rating,
            };

            if (req.file) {
                if (oldMovie.file) {
                    fs.unlink(`upload/${oldMovie.file}`, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Old image deleted successfully");
                        }
                    });
                }
                details.file = req.file.filename;
            } else {
                details.file = oldMovie.file;
            }
            await movieModel.updateOne({ _id: id }, details);
            res.redirect('/list');
        } catch (error) {
            console.error(error);
        }
    });
})



app.listen((3000), () =>{
    console.log('Server Started : 3000')
})