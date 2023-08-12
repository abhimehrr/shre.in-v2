const http = require('http')

const express = require('express')
const app = express()

// Database Connection
const db = require('./auth/dbConnect')
db.connect((e) => !e ? console.log('dbConnected...') : console.log('error in dbConnection...'))

// Middleware
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/static', express.static('static'))

 
// Cors
const cors = require('cors')

const whiteList = ['https://shre.in', 'https://www.shre.in', 'http://shre.in', '', undefined]
// const whiteList = ['https://api.shre.in/']

const corsOption = {
    origin: (origin, cb) => {
        if(whiteList.indexOf(origin) !== -1) {
            cb(null, true)
        } else {
            cb('not allowed' + origin)
        }
    }
}

app.use(cors(corsOption))

const { isKeyValid, isJoined } = require('./auth/auth')

// Routes
app.use(isKeyValid, isJoined, require('./routes/mainRoutes'))

// Auto Delete Files 
const path = require('path')
const fs = require('fs')

// Static Folder
const uploadsDir = path.join(__dirname, "./static/uploads");

const autoDelete = () => {
    // Deleting from text table
    db.query("DELETE FROM text", (e, r) => {
        if (e) {
            return console.log('Some error in ( text ) : ', e)
        }
    });


    // Deleting from files table
    db.query("DELETE FROM files", (e, r) => {
        if (e) {
            return console.log('Some error in ( files ) : ', e)
        }
    });


    // Deleting files from directory
    fs.readdir(uploadsDir, (e, d) => {
        if(!e && d.length > 0) {
            d.forEach((file) => {
                fs.unlinkSync(path.join(uploadsDir, file), (err) => {
                    if (err) {
                        return console.log('Some error in deleting : ', err)
                    }
                });
            });
        }
    })
}

// Set Cron Jobs
const CronJob = require('cron').CronJob;
const job = new CronJob('0 0 * * *', autoDelete);
// job.start()


// Creating Server for Socket.IO
const server = http.createServer(app)
const { Server } = require('socket.io')
const { callbackPromise } = require('nodemailer/lib/shared')

const io = new Server(server, {
    cors: {
        origin: 'https://shre.in/', 
        // origin: 'http://localhost:3000', 
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
})


// Listing on Socket.IO
io.on('connection', socket => {
    // console.log('Connected : ', socket.id)

    // Joining Room
    socket.on('joinRoom', room => {
        socket.join(room)
    })

    // Send Text
    socket.on('sendText', ({ text, room }) => {
        socket.broadcast.to(room)
        .emit('receiveText', text)
    })


    // Update Text
    socket.on('updateText', ({ text, room, ip }) => {
        const time = getTime()

        db.query("SELECT * FROM text WHERE room=?", [ room ], (e, r) => {
            if (e) {}
            if (!e && r.length == 0) {
                const sql = "INSERT INTO text (ip, room, text, time) VALUES (?, ?, ?, ?)";
                const values = [ ip, room, text, time ];
        
                db.query(sql, values, (e, r) => {
                    if (e) {}
                    socket.broadcast.to(room).emit("updated", time);
                });
            } else {
                const sql = "UPDATE text SET text=?, time=? WHERE room=?";
                const values = [ text, time, room ];
                db.query(sql, values, (e, r) => {
                    if (e) {}
                    socket.broadcast.to(room).emit("updated", time);
                });
            }
        })
    })
    
    // Disconnection Alert
    // socket.on('disconnect', () => console.log('disConnected : ', socket.id))
})

// Get Time
const getTime = () => {
    const t = Date().substring(16, 24).split(":");
    let h = t[0];
    let amPM = "AM";
  
    if (h > 12) {
      h = h - 12;
      if(h == 11 || h === 10) {
          h = `${h}`;
      } else {
          h = `0${h}`;
      }
      
      amPM = "PM";
    }
    if(h == 0) {
        h = `12`;
    }
    return `${h} : ${t[1]} : ${t[2]} ${amPM}`;
};



// Not Found Error
app.get('*', (req, res) => {
    return res.json({
        status: 404,
        msg: 'You are drunk, please go home!',
        error: 'The page or url you are requesting for, is not available...'
    })
})
app.post('*', (req, res) => {
    return res.json({
        status: 404,
        msg: 'You are drunk, please go home!',
        error: 'The page or url you are requesting for, is not available...'
    })
})

server.listen(5000, () => console.log('Listening...'))