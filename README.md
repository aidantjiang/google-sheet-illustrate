# google-sheet-illustrate

This program takes in an image and draws the image in google sheets. 
At the current moment, the largest size of photo it takes is 256x256, as the memory runs out when used on any further size.

 - A service account is needed and the entire Google Cloud process must be gone through (it's excrutiating)
    - After that ordeal, share a google sheet with the google service account (editing priveleges)
    - Also, move your own credentials.json file into your repo
    - This guide is great: **https://hackernoon.com/how-to-use-google-sheets-api-with-nodejs-cz3v316f**

Lastly, replace what `spreadsheetId` is equal to (inside of server.js).
Set it to your spreadsheet's code
 - in the Google Sheet's URL, it should be `https://docs.google.com/spreadsheets/d/**XxxXx-xxxxxxXXxxX-xXxxXxXXXXXxxxxxXxXxxXxxxX**/`
 
## Dependencies: 

 - express
 - googlapis
 - get-pixels
 - dotenv *(optional)*
