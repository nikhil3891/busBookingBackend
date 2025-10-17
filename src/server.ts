import app from "./app";
import dotenv from "dotenv";

// import connectDB from "./config/db";

dotenv.config();  

const PORT = process.env.PORT || 4001 ;

const start = async () => {
  // ensure DB ready before listening
  // await connectDB();
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// top-level start + catch
start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});