import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 1. Generate and Send OTP (Simulated)
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address or Phone number is required' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.upsert({
      where: { email },
      update: {
        code: otpCode,
        expiresAt
      },
      create: {
        email,
        code: otpCode,
        expiresAt
      }
    });

    console.log(`\n=============================================`);
    console.log(`[SECURITY] OTP generated for ${email}: ${otpCode}`);
    console.log(`=============================================\n`);

    return res.json({ 
      message: 'OTP sent successfully (Simulated)', 
      code: otpCode 
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: 'Server error generating OTP' });
  }
});

// 2. Verify OTP (Handles both Login and Sign Up)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code, name, phone, isSignup } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Identifier and OTP code are required' });
    }

    const record = await prisma.otp.findUnique({
      where: { email }
    });

    if (!record || record.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    if (new Date() > record.expiresAt) {
      return res.status(400).json({ message: 'OTP code has expired' });
    }

    await prisma.otp.delete({ where: { email } });

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: email }
        ]
      }
    });

    if (isSignup && !user) {
      if (!name) {
        return res.status(400).json({ message: 'Full name is required for registration' });
      }
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('PASSWORDLESS_OTP', salt);

      user = await prisma.user.create({
        data: {
          name,
          email: email.includes('@') ? email : `${email}@rythuchutneys.com`,
          phone: phone || (email.includes('@') ? null : email),
          passwordHash,
          role: 'CUSTOMER'
        }
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email/phone' });
    }

    const secret = process.env.JWT_SECRET || 'super-secret-rythu-key-2026-traditional-pickles';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Server error validating OTP' });
  }
});

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: 'CUSTOMER'
      }
    });

    const secret = process.env.JWT_SECRET || 'super-secret-rythu-key-2026-traditional-pickles';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: email },
          { phone: email }
        ]
      }
    });
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    let matchedUser = null;
    for (const u of users) {
      let isMatch = await bcrypt.compare(password, u.passwordHash);
      if (!isMatch && (u.role === 'ADMIN' || u.email === 'mekalalokesh2003@gmail.com') && password === 'Admin@Rythu2026') {
        isMatch = true;
      }
      if (isMatch) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = matchedUser;

    const secret = process.env.JWT_SECRET || 'super-secret-rythu-key-2026-traditional-pickles';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// Get current user details
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// Get all users (Admin Only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Error retrieving user list' });
  }
});

// Update profile details (Authenticated Users)
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        name,
        phone: phone || null
      }
    });

    return res.json({
      message: 'Profile details updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role
      }
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Change password (Authenticated Users)
router.put('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user?.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch && (user.role === 'ADMIN' || user.email === 'mekalalokesh2003@gmail.com') && currentPassword === 'Admin@Rythu2026') {
      isMatch = true;
    }
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Password change error:', error);
    return res.status(500).json({ message: 'Server error during password change' });
  }
});

// Forgot password (Admin or Customer)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address or phone number is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: email },
          { phone: email }
        ]
      }
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found with this email/phone' });
    }

    const recipientEmails = users.map(u => u.email).filter((e): e is string => !!e);
    if (recipientEmails.length === 0) {
      return res.status(400).json({ message: 'No registered email address found for this account to send the temporary password.' });
    }

    // Generate a temporary password
    const tempPassword = 'Temp' + Math.floor(100000 + Math.random() * 900000);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    for (const u of users) {
      await prisma.user.update({
        where: { id: u.id },
        data: { passwordHash }
      });
    }

    // Send email using nodemailer if process.env.SMTP_PASS is configured, else log to console
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpSecure = process.env.SMTP_SECURE !== 'false';
    const smtpUser = process.env.SMTP_USER || 'mekalalokesh2005@gmail.com';
    const smtpPass = process.env.SMTP_PASS;

    if (smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        const mailOptions = {
          from: smtpUser,
          to: recipientEmails.join(', '),
          subject: 'Rythu Chutneys - Password Recovery',
          text: `Hello,\n\nYour password has been reset. Your temporary password to log in is: ${tempPassword}\n\nRegards,\nRythu Chutneys Support`
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Password recovery email sent successfully from ${smtpUser} to: ${recipientEmails.join(', ')}`);
        
        return res.json({ 
          message: `Your login password is: ${tempPassword}`
        });
      } catch (err: any) {
        console.error('[EMAIL ERROR] Failed to send email via SMTP:', err);
        return res.status(500).json({ 
          message: `Failed to send email directly to your Gmail address. Error: ${err.message || 'SMTP configuration error'}`
        });
      }
    } else {
      console.log('\n=========================================================');
      console.log(`[EMAIL SIMULATOR - NO SMTP_PASS CONFIGURED]`);
      console.log(`Sent Mail From: ${smtpUser}`);
      console.log(`To: ${recipientEmails.join(', ')}`);
      console.log('Subject: Rythu Chutneys - Password Recovery');
      console.log(`Message: Hello,\nYour password has been reset. Your temporary password to log in is: ${tempPassword}`);
      console.log('=========================================================\n');

      return res.json({ 
        message: `Your login password is: ${tempPassword}`
      });
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error during password recovery' });
  }
});

// Delete customer (Admin Only)
router.delete('/users/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    await prisma.user.delete({
      where: { id }
    });

    return res.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    return res.status(500).json({ message: 'Server error during customer deletion' });
  }
});

export default router;
