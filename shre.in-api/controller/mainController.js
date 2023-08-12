const db = require('../auth/dbConnect')
const AdmZip = require('adm-zip')
const path = require('path')
const fs = require('fs')

// Static Folder
const uploadsDir = path.join(__dirname, "../static/uploads");
const zipDir = path.join(__dirname, "../static/zip-files");


// Load Content 
const home = (req, res) => {
    try {
        const room = req.headers.room
        const ip = req.headers.ip

        db.query('SELECT * FROM text WHERE room=?', [ room ], (e, r) => {
            if(e) {
                return res.json({
                    status: 502,
                    msg: 'Some database error...',
                    error: e.sqlMessage
                })
            }
            if(r.length === 0) {
                return res.json({ 
                    status: 200,
                    data : { ip, room, text: '', time: ''}
                })
            }
            return res.json({
                status: 200,
                data: r[0]
            })
        })
    } catch (error) {
        return res.json({
            status: 500,
            msg: 'Some internal error...',
            error: JSON.parse(JSON.stringify(error))
        })
    }
}


// Upload
const upload = (req, res) => {
    try {
        const files = req.files

        files.forEach((file) => {
            const sql = "INSERT INTO files (ip, room, filename, originalname, size, time) VALUES (?, ?, ?, ?, ?, ?)";
            const values = [
              req.headers.ip,
              req.headers.room,
              file.filename,
              file.originalname,
              file.size,
              getTime()
            ];
      
            db.query(sql, values, (e, r) => {
              if (e) {
                return res.json({
                    status: 502,
                    msg: 'Some database error...',
                    error: e.sqlMessage
                })
              }
            });
        });

        return res.json({
            status: 200,
            msg: 'Files uploaded successfully...',
            data: req.files
        })
    } catch (error) {
        console.log(files)
        console.log('Error in uploading : ', error)
        return res.json({
            status: 500,
            msg: 'Some internal error...',
            error: JSON.parse(JSON.stringify(error))
        })
    }
}


// File Manager
const fileManager = (req, res) => {
    try {
        const room = req.headers.room;
    
        db.query(`SELECT * FROM files WHERE room=?`, 
            [ room ], (e, r) => {
                if (e) {
                    return res.json({
                        status: 502,
                        msg: 'Some database error...',
                        error: e.sqlMessage
                    })
                }
        
                if (r.length == 0) {
                    return res.json({
                        status: 200,
                        msg: 'No files found...',
                        data: []
                    })
                }
        
                const tempArr = []
                for(let i = r.length - 1; i >= 0; i--) {
                    tempArr.push(r[i])
                }
                return res.json({
                    status: 200,
                    msg: 'Files are fetched successfully...',
                    data: tempArr
                })
            }
        );
    } catch (error) {
        return res.json({
            status: 500,
            msg: 'Some internal error...',
            error: JSON.parse(JSON.stringify(error))
        })
    }
}



// Download File
const downloadFile = (req, res) => {
    try {
        const filename = req.headers.filename;

        db.query(`SELECT * FROM files WHERE filename=?`, [ filename ], (e, r) => {
            if (e) {
                return res.json({
                    status: 502,
                    msg: 'Some database error...',
                    error: e.sqlMessage
                })
            }
    
            if (r.length == 0) {
                return res.json({
                    status: 200,
                    msg: 'No files found...',
                    data: []
                })
            }
    
            const filePath = path.join(__dirname, "../static/uploads", filename);

            return res.download(filePath, (e) => {
                if (e) {
                    return res.json({
                        status: 500,
                        msg: 'Some internal error...',
                        error: JSON.parse(JSON.stringify(e))
                    })
                }
            });
        });
    } catch (error) {
        return res.json({
            status: 500,
            msg: 'Some internal error...',
            error: JSON.parse(JSON.stringify(error))
        })
    }
}





// Download All Files
const downloadAllFiles = (req, res) => {
    try {
        const room = req.headers.room;
    
        db.query(`SELECT * FROM files WHERE room=?`, [ room ], (e, r) => {
            if (e) {
                return res.json({
                    status: 502,
                    msg: 'Some database error...',
                    error: e.sqlMessage
                })
            }
    
            if (r.length == 0) {
                return res.json({
                    status: 200,
                    msg: 'No files found...',
                    data: []
                })
            }
    
            const zip = new AdmZip();
    
            const zipFilePath = path.join(__dirname, "../static/zip-files");
            const tempFolder = `${zipFilePath}/${Date.now()}`;
            fs.mkdirSync(tempFolder, (e) => {});
    
            let fileInfo = '';
    
            r.forEach((file, index) => {
                fileInfo += `
                    ${index + 1}.   ${file.originalname}`;
    
                fs.copyFileSync(
                `${uploadsDir}/${file.filename}`,
                `${tempFolder}/${file.filename}`,
                fs.constants.COPYFILE_EXCL, (e) => {
                    if (e) {
                        return res.json({
                            status: 500,
                            msg: 'Some technical error (copying file failed)...',
                            error: JSON.parse(JSON.stringify(e))
                        })
                    }
                });
    
                fs.renameSync(
                `${tempFolder}/${file.filename}`,
                `${tempFolder}/${file.originalname}`, (e) => {
                    if (e) {
                        return res.json({
                            status: 500,
                            msg: 'Some technical error (renaming file failed)...',
                            error: JSON.parse(JSON.stringify(e))
                        })
                    }
                });
    
                zip.addLocalFile(`${tempFolder}/${file.originalname}`);
            });
    
            const content = `
                Thanks for using "Shre.IN"
    
                Total File : ${r.length}
    
            File Info : 
                ${fileInfo}
    
    
            Author : Team Shre.IN
            Copyright ${new Date().getFullYear()} { https://shre.in/ }

            Created At : ${Date()}
            
                I'm Abhishek, developer of this website.
                Contact : hloo.abhi@gmail.com
            `;
    
            zip.addFile("Shre.IN.txt", Buffer.from(content, "utf8"));
    
            const zipPath = `${zipDir}/Shre.IN ${Date.now()}.zip`;
            zip.writeZip(zipPath, (e) => {
                if (e) {
                    return res.json({
                        status: 500,
                        msg: 'Some technical error (writing zip failed)...',
                        error: JSON.parse(JSON.stringify(e))
                    })
                }
            });
    
            fs.readdir(tempFolder, (e, f) => {
                f.forEach((file) => {
                fs.unlinkSync(`${tempFolder}/${file}`);
                });
            });

            return res.download(zipPath, (e) => {
                if (!e) {
                    fs.rmdir(tempFolder, (e) => {
                        if (e) {
                            return res.json({
                                status: 500,
                                msg: 'Some technical error (error in deleting folder)...',
                                error: JSON.parse(JSON.stringify(e))
                            })
                        }
                    });
                    fs.unlinkSync(zipPath);
                }
            });
        });
    } catch (error) {
        return res.json({
            status: 500,
            msg: 'Some internal error...',
            error: JSON.parse(JSON.stringify(error))
        })
    }
};


// Delete One
const deleteOne = (req, res) => {
    try {
      const filename = req.headers.filename;

      if(!filename) {
        return res.json({
            status: 502,
            msg: 'Bad Request!',
            error: 'Please provide file id...'
        })
      }

      db.query(`SELECT * FROM files WHERE filename=?`, [filename], (e, r) => {
        if (e) {
            return res.json({
                status: 502,
                msg: 'Some database error...',
                error: e.sqlMessage
            })
        }

        if(r.length == 0) {
            return res.json({
                status: 200,
                msg: 'File not found...',
                data: null
            })
        }

        db.query(`DELETE FROM files WHERE filename=?`, [ filename ], (err, re) => {
            if (e) {
                return res.json({
                    status: 502,
                    msg: 'Some database error...',
                    error: err.sqlMessage
                })
            }
      
            fs.unlinkSync(path.join(uploadsDir, filename), (error) => {
              if (error) {
                return res.json({
                    status: 502,
                    msg: 'Some internal error in deleting files...',
                    error: JSON.parse(JSON.stringify(error))
                })
              }
            });

            return res.json({
                status: 200,
                msg: 'File deleted successfully...',
                data: true
            })
        });
        });
    } catch (error) {
        return res.json({
            status: 502,
            msg: 'Some database error...',
            error: JSON.parse(JSON.stringify(error))
        })
    }
};


// Delete All
const deleteAll = (req, res) => {
    try {
        const room = req.headers.room;

        db.query(`SELECT * FROM files WHERE room=?`, [ room ], (e, r) => {
            if (e) {
                return res.json({
                    status: 502,
                    msg: 'Some database error...',
                    error: e.sqlMessage
                })
            }

            if (r.length == 0) {
                return res.json({
                    status: 200,
                    msg: 'No files found...',
                    data: []
                })
            }

            db.query("DELETE FROM files WHERE room=?", [ room ], (err, re) => {
                if (err) {
                    return res.json({
                        status: 502,
                        msg: 'Some database error...',
                        error: err.sqlMessage
                    })
                }
            }
            );

            r.forEach((file) => {
                fs.unlinkSync(path.join(uploadsDir, file.filename), (e) => {
                    if (e) {
                        return res.json({
                            status: 502,
                            msg: 'Some error in deleting file...',
                            error: JSON.parse(JSON.stringify(e))
                        })
                    }
                });
            });
            return res.json({
                status: 200,
                msg: 'Files deleted successfully...',
                data: true
            })
        }
        );
    } catch (error) {
        return res.json({
            status: 500,
            msg: 'Some internal error...',
            error: JSON.parse(JSON.stringify(error))
        })
    }
};

















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


module.exports = { 
    home,
    upload,
    fileManager, 
    downloadFile,
    downloadAllFiles,
    deleteOne,
    deleteAll
}