// import express from 'express';
// import { connectToWingmanDB } from '../utils/databaseConnections';

// const router = express.Router();

// // Test route for WingmanDB connection
// router.get('/test-wingman-db', async (req, res) => {
//     try {
//       const wingmanDB = await connectToWingmanDB();
  
//       // Log the connection readyState for debugging
//       console.log(`Wingman DB ReadyState: ${wingmanDB.readyState}`);
  
//       if (wingmanDB.readyState === 1) { // 1 means connected
//         res.status(200).json({ message: 'Successfully connected to Video Game Wingman database!' });
//       } else {
//         res.status(500).json({ message: 'Video Game Wingman database connection is not ready.' });
//       }
//     } catch (error) {
//       console.error('Error connecting to Video Game Wingman DB:', error);
  
//       res.status(500).json({
//         message: 'Failed to connect to Video Game Wingman database.',
//         error: (error as Error).message,
//       });
//     }
// });  

// export default router;