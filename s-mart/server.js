const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/test', (req, res) => res.send('Server is working!'));

mongoose.connect('mongodb+srv://mohan:stumart123!@stumart.pamnb.mongodb.net/Stumart?retryWrites=true&w=majority&appName=Stumart')
    .then(() => console.log('MongoDB Atlas connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cart: [{ itemId: String }],
    isVerified: { type: Boolean, default: false }
});
const itemSchema = new mongoose.Schema({
    title: String,
    author: String,
    category: String,
    price: Number,
    condition: String,
    conditionDesc: String,
    image: String,
    seller: String,
    status: { type: String, default: 'available' },
    timestamp: { type: Date, default: Date.now }
});
const messageSchema = new mongoose.Schema({
    chatRoomId: String,
    sender: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Item = mongoose.model('Item', itemSchema);
const Message = mongoose.model('Message', messageSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'yourstumart@gmail.com',
        pass: 'nxsp ejtt amkf fjti'
    }
});

const otps = new Map();

(async () => {
    try {
        await fs.mkdir('uploads', { recursive: true });
        console.log('Uploads directory ready');
    } catch (error) {
        console.error('Error creating uploads directory:', error);
    }
})();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

io.on('connection', (socket) => {
    socket.on('joinRoom', (chatRoomId) => socket.join(chatRoomId));
    socket.on('sendMessage', async ({ chatRoomId, sender, text }) => {
        const message = new Message({ chatRoomId, sender, text });
        await message.save();
        io.to(chatRoomId).emit('message', { sender, text, timestamp: message.timestamp });
    });
});

app.post('/signup', async (req, res) => {
    const { username, email, password, resend } = req.body;
    if (!resend && (!username || !email || !password)) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        if (!resend) {
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) {
                return res.status(409).json({ 
                    error: existingUser.email === email ? 'Email already exists' : 'Username already taken' 
                });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({ username, email, password: hashedPassword });
            await user.save();
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otps.set(email, { code: otp, expires: Date.now() + 10 * 60 * 1000 });
        await transporter.sendMail({
            from: 'stumart.verify2025@gmail.com',
            to: email,
            subject: 'STUMART OTP Verification',
            text: `Your OTP for STUMART signup is ${otp}. It expires in 10 minutes.`
        });
        res.status(201).json({ userId: resend ? null : user._id, username, message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ error: 'Signup failed: ' + error.message });
    }
});

app.post('/login', async (req, res) => {
    const { email, password, resend } = req.body;
    if (!email || (!password && !resend)) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!resend) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otps.set(email, { code: otp, expires: Date.now() + 10 * 60 * 1000 });
        await transporter.sendMail({
            from: 'stumart.verify2025@gmail.com',
            to: email,
            subject: 'STUMART Login OTP',
            text: `Your OTP for STUMART login is ${otp}. It expires in 10 minutes.`
        });
        res.json({ message: 'OTP sent' });
    } catch (error) {
        res.status(500).json({ error: 'Login failed: ' + error.message });
    }
});

app.post('/verify-otp', async (req, res) => {
    const { email, otp, type } = req.body;
    if (!email || !otp || !type) return res.status(400).json({ error: 'Email, OTP, and type are required' });
    const otpData = otps.get(email);
    if (!otpData || otpData.code !== otp) return res.status(401).json({ error: 'Invalid OTP' });
    if (Date.now() > otpData.expires) {
        otps.delete(email);
        return res.status(410).json({ error: 'OTP expired' });
    }
    try {
        const user = await User.findOne({ email });
        if (type === 'signup') {
            await User.updateOne({ email }, { isVerified: true });
        }
        otps.delete(email);
        res.json({ userId: user._id, username: user.username, email: user.email, message: 'Verification successful' });
    } catch (error) {
        res.status(500).json({ error: 'Verification failed: ' + error.message });
    }
});

app.post('/items', upload.single('image'), async (req, res) => {
    const { title, author, category, price, condition, conditionDesc, seller } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '/assets/placeholder.jpg';
    try {
        const item = new Item({ title, author, category, price, condition, conditionDesc, image, seller });
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/items', async (req, res) => {
    try {
        const items = await Item.find({ status: 'available' }).sort({ timestamp: -1 }).limit(50);
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/search', async (req, res) => {
    const { query, filter } = req.query;
    try {
        let items = await Item.find({ status: 'available' });
        if (query) {
            const regex = new RegExp(query, 'i');
            items = items.filter(item => 
                regex.test(item.title) || 
                (item.author && regex.test(item.author)) || 
                regex.test(item.category)
            );
        }
        if (filter === 'price') items.sort((a, b) => a.price - b.price);
        else if (filter === 'condition') {
            const order = ['New', 'Used - Like New', 'Used - Good', 'Used - Acceptable'];
            items.sort((a, b) => order.indexOf(a.condition) - order.indexOf(b.condition));
        } else if (filter === 'category') items.sort((a, b) => a.category.localeCompare(b.category));
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/cart/add', async (req, res) => {
    const { userId, itemId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user.cart.includes(itemId)) user.cart.push(itemId);
        await user.save();
        res.status(200).json({ message: 'Added to cart' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/cart/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        const cartItems = await Item.find({ _id: { $in: user.cart }, status: 'available' });
        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/cart/remove', async (req, res) => {
    const { userId, itemId } = req.body;
    try {
        const user = await User.findById(userId);
        user.cart = user.cart.filter(id => id !== itemId);
        await user.save();
        res.status(200).json({ message: 'Removed from cart' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/payment', async (req, res) => {
    const { userId, amount } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Mock payment processing (replace with real gateway like Stripe in production)
        const paymentSuccess = Math.random() > 0.1; // 90% success rate for testing
        if (paymentSuccess) {
            res.status(200).json({ message: 'Payment processed successfully' });
        } else {
            res.status(400).json({ error: 'Payment declined' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Payment failed: ' + error.message });
    }
});

app.post('/checkout', async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);
        await Item.updateMany({ _id: { $in: user.cart } }, { status: 'sold' });
        user.cart = [];
        await user.save();
        res.status(200).json({ message: 'Checkout successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/messages/:chatRoomId', async (req, res) => {
    try {
        const messages = await Message.find({ chatRoomId: req.params.chatRoomId }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

server.listen(3000, () => console.log('Server running on port 3000'));