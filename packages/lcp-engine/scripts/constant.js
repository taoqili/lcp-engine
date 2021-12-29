const path = require('path')

const HOME_DIR = path.resolve(__dirname, '../')
const OUTPUT_DIR = path.resolve(HOME_DIR, './dist')
const SERVER_HOST = '127.0.0.1'
const SERVER_PORT = 8080

module.exports =  {
  HOME_DIR,
  OUTPUT_DIR,
  SERVER_HOST,
  SERVER_PORT,
}