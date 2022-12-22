const express = require('express');
const { google } = require('googleapis');
const getPixels = require('get-pixels');
require('dotenv').config({path: __dirname + '/.env'});


const app = express();

const PORT = process.env.PORT || 5000;

//middleware
// app.use(express.static('static'));

let pixelColors = [];

getPixels("bread.png", (err, pixels) => {
    if (err) {
        console.log("bad image path");
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

app.get('/', async (req, res) => {
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
    })

    res.send("sent");
    // res.sendFile(__dirname + '/static/index.html');
})

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})