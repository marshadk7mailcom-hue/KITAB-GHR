require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const session = require('express-session');
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);
app.use(session({
  secret: process.env.SESSION_SECRET || 'kitab-ghr-secret',
  resave: false,
  saveUninitialized: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const csrfProtection = csrf({ cookie: true });
let orders = [];

let books = [
{id:1,title:"Bacha Khan: My Life & Struggle",author:"Khan Abdul Ghaffar Khan",price:1200,image:"https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500"},
{id:2,title:"Da Pukhto Deewan",author:"Ghani Khan",price:950,image:"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500"},
{id:3,title:"Bang-e-Dara",author:"Allama Iqbal",price:800,image:"https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500"},
{id:4,title:"Zindagi - Faiz",author:"Faiz Ahmed Faiz",price:1100,image:"https://images.unsplash.com/photo-1511108690759-009324a90311?w=500"},
{id:5,title:"Rehman Baba Deewan",author:"Rehman Baba",price:800,image:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500"},
{id:6,title:"Khushal Khan Khattak",author:"Khushal Khan",price:1100,image:"https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500"},
{id:7,title:"Pashto Tappa",author:"Folk Collection",price:750,image:"https://images.unsplash.com/photo-1476275466078-40035611d34e?w=500"},
{id:8,title:"Khudai Khidmatgar",author:"Mukulika Banerjee",price:1350,image:"https://images.unsplash.com/photo-1526243741027-d5585c4e4af4?w=500"}
];  

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Bohat zyada koshish"
});

const ADMIN_EMAIL_1 = 'marshadk7mail.com@gmail.com';
const ADMIN_PASS_1 = 'adkhan123';

const ADMIN_EMAIL_2 = 'arshad2@gmail.com';
const ADMIN_PASS_2 = 'arshad123';

// Main pages
app.get('/', csrfProtection, (req, res) => {
  res.render('index', { books, title: "Azeem Kitabein", description: "Pashtun books", csrfToken: req.csrfToken() });
});
app.get('/product/:id', csrfProtection, (req, res) => {
  const book = books.find(b => b.id == req.params.id);
  if (!book) return res.status(404).render('404', { title: "Not Found", description: "Not found" });
  res.render('product', { book, title: book.title, description: book.author, csrfToken: req.csrfToken() });
});
app.get('/about', csrfProtection, (req, res) => { res.render('about', { title: "About", description: "About", csrfToken: req.csrfToken() }); });
app.get('/contact', csrfProtection, (req, res) => { res.render('contact', { title: "Contact", description: "Contact", csrfToken: req.csrfToken() }); });
app.get('/cart', csrfProtection, (req, res) => { res.render('cart', { title: "Cart", description: "Cart", csrfToken: req.csrfToken() }); });
app.get('/login', csrfProtection, (req, res) => { res.render('login', { title: "Login", description: "Login", csrfToken: req.csrfToken(), error: null }); });
app.get('/thankyou', csrfProtection, (req, res) => { res.render('thankyou', { title: "Thank You", description: "Thanks", csrfToken: req.csrfToken() }); });

app.post('/login', loginLimiter, csrfProtection, (req, res) => {
  const { email, password } = req.body;
  const isUser1 = email === ADMIN_EMAIL_1 && password === ADMIN_PASS_1;
  const isUser2 = email === ADMIN_EMAIL_2 && password === ADMIN_PASS_2;

  if (isUser1 || isUser2) {
   req.session.isAdmin = true;
return res.redirect('/admin');
  } else {
    res.render('login', { title: "Login", description: "Login", csrfToken: req.csrfToken(), error: "Galat Email ya Password!" });
  }
});
// API Order
app.post('/api/order', (req,res)=>{
  orders.push({...req.body, date: new Date().toLocaleString()});
  res.json({ok:true});
});

// ADMIN - Dashboard
// ADMIN - Dashboard
app.get('/admin', (req,res)=>{
  if (req.query.pass === ADMIN_PASS_1 || req.query.pass === ADMIN_PASS_2) {
    res.render('admin', {orders, books});
  } else {
    res.send('Unauthorized - Aap ?pass= apna_password lagayen');
  }
});

// ADMIN - Add Book
app.post('/admin/add-book', (req,res)=>{
  if(req.query.pass !== ADMIN_PASS_1 && req.query.pass !== ADMIN_PASS_2) return res.send('Unauthorized');
  const newId = books.length > 0 ? Math.max(...books.map(b=>b.id)) + 1 : 1;
  books.push({
    id: newId,
    title: req.body.title,
    author: req.body.author,
    price: parseInt(req.body.price) || 0,
    image: req.body.image
  });
 res.redirect('/admin?pass='+req.query.pass);
});

// ADMIN - Delete Book
app.post('/admin/delete-book/:id', (req,res)=>{
  if(req.query.pass !== ADMIN_PASS) return res.send('Unauthorized');
  books = books.filter(b => b.id != req.params.id);
  res.redirect('/admin?pass='+ADMIN_PASS);
});
app.get('/thank-you', (req, res) => {
  res.render('thankyou');
});
app.use((req, res) => { res.status(404).render('404', { title: "404", description: "Not found" }); });
const ADMIN_PASS="adkhan123";
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Server running on port "+PORT));
module.exports = app;