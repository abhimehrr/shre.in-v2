const Router = require('express').Router()

// Controllers
const Main = require('../controller/mainController')
const upload = require('../controller/multer').array('files', 50)

Router.post('/', Main.home)

// Upload Files
Router.post('/upload', (req, res, next) => {
    upload(req, res, err => {
        if (err) {
            const e = JSON.parse(JSON.stringify(err));
                    return res.json({
                status: 400,
                msg: 'Files not uploaded...',
                error: {
                    code: e.code,
                    reason: 'File size must be upto only 500MB and maximum file count 50'
                }
            })
        }
        next();
    });
  },
  Main.upload
);


// File Manager
Router.post('/download', Main.fileManager)
Router.post('/download-file', Main.downloadFile)
Router.post('/download-all', Main.downloadAllFiles)

// Delete Files
Router.post("/delete-file", Main.deleteOne);
Router.post("/delete-all", Main.deleteAll);

// Contact
const { contact } = require('../controller/contact')

Router.post('/contact', contact)

// IP
Router.post('/ip', (req, res) => {
    return res.json(
        {
            status: 200,
            ip: req.ip,
        }
    )
})

// Router.get('/room', (req, res, next) => {
//     let room = req.headers.room
//     console.log('Room After : ', room)

//     room = parseInt(room) + 100
//     console.log('Room After : ', room)

//     req.headers.room = room
//     next()
// }, (req, res) => {
//     return res.json({room : req.headers.room})
// })

module.exports = Router