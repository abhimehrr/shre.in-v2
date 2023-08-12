const db = require('./dbConnect')
const bcrypt = require('bcryptjs')
const getIP = require('request-ip')

// Check Key
const isKeyValid = (req, res, next) => {
    const key = req.headers.key
    if(key === null || key === undefined) {
        return res.json({
            status: 403,
            msg: 'Access Denied!',
            error: '(AUTH NOT FOUND) : You drunk!!! go home...'
        })
    }

    const isKey = bcrypt.compareSync('NDK93kd#)@kdfj;()#@JFKJS8', key)

    if(!isKey) {
        return res.json({
            status: 403,
            msg: 'Access Denied!',
            error: '(AUTH FAILED) : You drunk!!! go home...'
        })
    }
    next()
}

 
// Check Room Joined
const isJoined = (req, res, next) => {
    const room = req.headers.room

    const ip = getIP.getClientIp(req)
    req.headers.ip = ip

    if(!room) {
        db.query('SELECT * FROM text WHERE ip=?', [ ip ], (e, r) => {
            if(e) {
                return res.json({
                    status: 502,
                    msg: 'Some database error...',
                    error: e.sqlMessage
                })
            }
            if(r.length == 0) {
                const rid = generateRoom()
                req.headers.room = rid

                db.query('INSERT INTO text (ip, room) VALUES (?, ?)', [ ip, rid ], (err, re) => {
                    if (err) {
                        return res.json({
                            status: 502,
                            msg: 'Some database error...',
                            error: err.sqlMessage
                        })
                    }
                })
            } else {
                req.headers.room = r[0].room;
            }
            next()
        })
    } else {
        next()
    }
}


// Generate a New Room
const generateRoom = () => {
    const n = "0123456789";
    let random = "";
    for (let i = 0; i < 6; i++) {
      random += n.charAt(Math.floor(Math.random() * n.length));
    }
    return random;
};


module.exports = {
    isKeyValid,
    isJoined
}