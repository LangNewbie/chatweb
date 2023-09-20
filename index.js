const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const bodyParser = require("body-parser")
const fs = require("fs")
const sessionStorage = require("sessionstorage-for-nodejs")

const user = fs.readFileSync("./database/user.json")
const group = fs.readFileSync("./database/group.json")
const Group = JSON.parse(group)
const User = JSON.parse(user)

const app = express()
const server = http.createServer(app)
const io = new Server(server)

let dataArray = [
  {
    name: 'Main Chat',
    id: 'mainchat',
    chat: [
      {
        uName: "Lang",
        pesan: "Selamat Datang Di ChetG, kamu dapat mengirim pesan satu sama lain secara Real-Time. Website ini dikembangkan oleh © Lang."
      }]
  }
]

let dataChat = ['yRfjsR']

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.json())
app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req,res) => {
  let loginData = sessionStorage.getItem('loginData')
  if (!loginData) return res.send("<script>location.href='/signup';</script>")
  res.render('home', {
    dataArray
  })
})

app.get('/signup', (req,res) => {
  res.render('signup')
})

app.get('/login', (req,res) => {
  res.render('login', {
    sc: ''
  })
})

app.get('/mainchat', (req,res) => {
  let be = dataArray[0]
  res.render('chat', {
    be
  })
})

app.get('/chat', (req,res) => {
  if (!dataChat.some(el => el === req.query.id)) return res.send('<script>alert("Chat Tidak Ditemukan!"); location.href="/";</script>')
  
  res.render('chatp', {
    id: req.query.id
  })
})

app.post('/', (req,res) => {
  if (!User.some(el => el.username == req.body.username)) return res.send("<script>alert('Maaf, sepertinya akun belum terdaftar di database kami, silahkan sign up terlebih dahulu!'); location.href='/login';</script>")
  else if (!User.some(el => el.username == req.body.username && el.password === req.body.password)) return res.send("<script>alert('Maaf, username atau password salah!'); location.href='/login';</script>")
  sessionStorage.setItem('loginData', req.body.username)
  res.render('home', {
    dataArray
  })
})

app.post('/login', (req,res) => {
  if (User.some(el => el.username == req.body.username || el.email == req.body.email)) return res.send("<script>alert('Maaf username atau email telah digunakan!'); location.href='/signup';</script>")
  let array = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  }
  User.push(array)
  console.log(req.body)
  let arr = JSON.stringify(User, null, 2)
  fs.writeFileSync("./database/user.json", arr)
  res.render('login', {
    sc: 'Akun telah dibuat! Silahkan login dengan username dan password yang tepat'
  })
})

io.on('connection', (socket) => {
  socket.on('message', (msg) => {
    console.log(msg)
    let username = sessionStorage.getItem('loginData')
    if (!username){ username = 'Unknown'}
    dataArray[0].chat.push({
      uName: username,
      pesan: msg
    })
    socket.broadcast.emit('message', {name: username, pesan: msg})
  })
  socket.on('messages', (msg) => {
    console.log(msg)
    let username = sessionStorage.getItem('loginData')
    console.log(username)
    if (!username){ username = 'Unknown'}
    socket.broadcast.emit('messages', {name: username, pesan: msg})
  })
})

app.get("/createChat", (req,res)=> {
  if (!sessionStorage.getItem('loginData')) return res.send('<script>location.href="/signup"</script>')
  let id = req.query.id
  if (dataChat.includes(id)) return res.send('<script>alert("Id Telah Digunakan!"); location.href="/"</script>')
  dataChat.push(id)
  res.redirect('/chat?id='+id)
})

app.get('/logout', (req,res) => {
  sessionStorage.removeItem('loginData')
  res.send("<script>alert('LogOut berhasil!'); location.href='/login'</script>")
})

server.listen(3000, () => {
  console.log('Server Berjalan Di Port 3000')
})