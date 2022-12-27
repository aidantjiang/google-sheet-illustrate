const express = require('express');
const sharp = require('sharp');
const ffmpeg = require('ffmpeg');
const { google } = require('googleapis');
const getPixels = require('get-pixels');
require('dotenv').config({path: __dirname + '/.env'});
const fs = require('fs');
const { count } = require('console');



const app = express();

const PORT = process.env.PORT || 5000;

//middleware
// app.use(express.static('static'));
const ffmpegPath = process.env.FFMPEG_PATH;
let pixelColors = [];
let i = 1;

try {
  var vid = new ffmpeg("assets/family.mp4");
  vid.then((video) => {
      video.fnExtractFrameToJPG('frames', {
        frame_rate: 1,
        file_name : 'frame'
      }, (err, files) => {
        err ? console.log(err) : console.log('Frames loaded');

        const frameDirLength = fs.readdirSync('frames').length

        if (frameDirLength == 33) {
          for (let i = 1; i <= frameDirLength; i++) {
            sharp(`frames/frame_${i}.jpg`)
            .resize({
              height: 128,
              width: 128,
              fit: 'fill',
            })
            .flatten()
            .toFile(`frames/mod_frame_${i}.jpg`, (err)=> {
              if(err){
                  console.log("sharp error: " + err);
                  return;
              }
            });
          }
        }
      });
  }, (err) => {
      console.log(err);
  });  
} catch (e) {
  console.log(e.code);
  console.log(e.msg);
}

let pixelate = (url = "assets/bread.png") => {
  getPixels(`${ffmpegPath}/${url}`, (err, pixels) => {
      if (err) {
          console.log("bad image path:" + err);
          return;
      }
      for (let x = 0; x < pixels.shape[0]; x++) {
        pixelColors[x] = [];
        for (let y = 0; y < pixels.shape[1]; y++) {
            let rgba = [];

            const r = pixels.get(y, x, 0);
            const g = pixels.get(y, x, 1);
            const b = pixels.get(y, x, 2);
            const a = pixels.get(y, x, 3);

            //format for google api
            rgba = [r/255,g/255,b/255,a/255];
            pixelColors[x][y] = rgba;
        }
      }
  })
}

let draw = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json", 
    scopes: "https://www.googleapis.com/auth/spreadsheets"
  })

  //create client instance for auth
  const client = async () => {
      await auth.getClient()
      .then(() => {
          console.log("success getting client")
      })
  }

  //instace of google sheets api
  const googleSheets = google.sheets({
      version: "v4",
      auth: client,
  })

  const spreadsheetId = process.env.SPREADSHEET_ID;

  let rows = pixelColors.map(rowColors => {
      return {
        values: rowColors.map(cellColor => {
          return {
            userEnteredFormat: {
              backgroundColor: {
                  red: cellColor[0],
                  green: cellColor[1],
                  blue: cellColor[2],
                  alpha: cellColor[3],
              }        
            }       
          }             
        })
      }
    })

    await googleSheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId,
      requestBody: {
      requests: [{
        updateCells: {
          rows: rows,
          fields: 'userEnteredFormat',
          range: {
            sheetId: 0,
            startRowIndex: 0,
            startColumnIndex: 0,
          }
        }//update cell
      }]//requests
      }
  }).then( (err, res) => {
    console.log("updated spreadsheet");
  })
}

let playVideo = async () => {
    pixelate(`frames/mod_frame_${i}.jpg`);
    await draw();

    i++;
    if (i <= 34) {
      playVideo();
    } else {
      i = 1;
      console.log("video played"); 
    }
}

app.get('/', (req, res) => {
  playVideo();
  res.send("hi");
    // res.sendFile(__dirname + '/static/index.html');
})

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})