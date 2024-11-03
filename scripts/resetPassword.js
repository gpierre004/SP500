import { User } from '../src/models/index.js';
import bcrypt from 'bcrypt';

async function resetPassword(username, newPassword) {
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log('User not found');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });
    console.log('Password updated successfully');
  } catch (error) {
    console.error('Error resetting password:', error);
  }
}

// Usage: node resetPassword.js <username> <newPassword>
const [,, username, newPassword] = process.argv;
if (username && newPassword) {
  resetPassword(username, newPassword);
} else {
  console.log('Usage: node resetPassword.js <username> <newPassword>');
}