import { Request, Response, Router } from 'express';
import User from '../models/User'; // Import the User model

const router = Router();

router.post('/waitlist', async (req: Request, res: Response) => {
  // Access the user from the middleware
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const existingUser = await User.findOne({ email: user.email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email is already on the waitlist' });
    }

    const position = await User.countDocuments() + 1;

    // Create a new user with the correct schema properties
    const newUser = new User({
      email: user.email,
      password: user.password, // Assuming the password is hashed at this point
      position,
      isApproved: false,
    });

    await newUser.save();

    res.status(200).json({ message: 'Email added to the waitlist', position });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

export default router;