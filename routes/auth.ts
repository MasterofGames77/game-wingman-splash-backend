import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { sendEmail } from '../utils/sendEmail';

const router = Router();

const isProduction = process.env.NODE_ENV === 'production';

// Base URL for password reset emails
const BASE_URL = isProduction
  ? 'https://vgw-splash-page-frontend-71431835113b.herokuapp.com/'  // Update this with your production URL
  : 'http://localhost:3000';

router.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body);
  
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    const newUser = new User({ email, password: hashedPassword, position: await User.countDocuments() + 1 });
    console.log('New user object created:', newUser);

    await newUser.save();
    console.log('New user saved to database');

    const accessToken = generateAccessToken(newUser._id.toString());
    const refreshToken = generateRefreshToken(newUser._id.toString());
    console.log('Tokens generated:', { accessToken, refreshToken });

    // Updated cookie settings for development and production environments
    res.cookie('token', accessToken, {
      httpOnly: true, 
      secure: isProduction, // only set secure flag in production
      sameSite: isProduction ? 'strict' : 'lax', // 'Lax' for development, 'Strict' for production
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // only set secure flag in production
      sameSite: isProduction ? 'strict' : 'lax', // 'Lax' for development, 'Strict' for production
    });

    console.log('Cookies set successfully');

    res.status(201).json({ message: 'User created', accessToken, refreshToken });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ message: 'Error creating user' });
  }
});

router.post('/login', async (req, res) => {
  console.log('Login request received:', req.body);

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log('User found in database:', user);

    if (!user || !await bcrypt.compare(password, user.password)) {
      console.log('Invalid credentials');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    console.log('Tokens generated:', { accessToken, refreshToken });

    // Updated cookie settings for development and production environments
    res.cookie('token', accessToken, {
      httpOnly: true, 
      secure: isProduction, // only set secure flag in production
      sameSite: isProduction ? 'strict' : 'lax', // 'Lax' for development, 'Strict' for production
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // only set secure flag in production
      sameSite: isProduction ? 'strict' : 'lax', // 'Lax' for development, 'Strict' for production
    });

    console.log('Cookies set successfully');

    res.json({ message: 'Login successful', accessToken, refreshToken });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

router.post('/logout', (req, res) => {
  console.log('Logout request received');

  // Updated cookie settings for clearing cookies
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction, // only set secure flag in production
    sameSite: isProduction ? 'strict' : 'lax', // 'Lax' for development, 'Strict' for production
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction, // only set secure flag in production
    sameSite: isProduction ? 'strict' : 'lax', // 'Lax' for development, 'Strict' for production
  });

  console.log('Cookies cleared successfully');

  res.status(200).json({ message: 'Logout successful' });
});

router.post('/forgot-password', async (req, res) => {
  console.log('Forgot password request received:', req.body);

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log('User found for password reset:', user);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    console.log('Reset token generated and set:', { token });

    await user.save();
    console.log('User updated with reset token');

    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;  // Updated URL generation
    const message = `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                     Please click on the following link, or paste this into your browser to complete the process:\n\n
                     ${resetUrl}\n\n
                     If you did not request this, please ignore this email and your password will remain unchanged.\n`;

    await sendEmail(user.email, 'Password Reset', message);
    console.log('Password reset email sent');

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Error during forgot password:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  console.log('Reset password request received:', req.body);

  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    console.log('User found for password reset:', user);

    if (!user) {
      console.log('Invalid or expired password reset token');
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    console.log('Password reset successfully');

    await user.save();
    console.log('User updated with new password');

    res.status(200).json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('Error during password reset:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;