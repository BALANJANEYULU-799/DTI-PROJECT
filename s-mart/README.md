# STUMART - Educational Marketplace

A dynamic platform for students to buy and sell educational materials, inspired by Amazon and Ola.

## Features
- **User Authentication**: Signup/login with username display.
- **Item Listings**: Sell/buy books and stationery with image uploads.
- **Cart & Checkout**: Persistent cart with real-time updates (Amazon-like).
- **Real-Time Chat**: Chat with sellers using Socket.IO (Ola-like).
- **Search**: Efficient, filterable search with debounce.

## Setup
1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/).
2. **Install MongoDB**: Install locally or use MongoDB Atlas.
3. **Clone the Project**:
   - Create the folder structure as above.
   - Copy all files into `stumart/`.
4. **Install Dependencies**:
   - Run `npm install` in the `stumart` directory.
5. **Run MongoDB**:
   - Start MongoDB locally with `mongod` (if local).
6. **Start Server**:
   - Run `npm start` to start the server on `http://localhost:3000`.

## Running the Application
- Open `http://localhost:3000` in a browser.
- Use signup to create an account (e.g., username: `testuser`, email: `test@example.com`, password: `password123`).
- Ensure `assets/` contains `logo.png` and `placeholder.jpg`.

## Notes
- The server uses port 3000; ensure it’s free.
- Images are stored in `uploads/`; create this folder if it doesn’t exist.
- All functions are optimized and error-handled.