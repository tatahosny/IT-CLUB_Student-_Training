const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');

const login = async (email, password, ip, userAgent) => {
  const lowerEmail = email?.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: lowerEmail },
    include: { role: true, group: true, level: true },
  });

  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  if (user.is_blocked) {
    const now = new Date();
    if (user.blocked_until && user.blocked_until > now) {
      throw { 
        status: 403, 
        message: `You are blocked for 24 hours due to attendance fraud attempt.`,
        blockedUntil: user.blocked_until
      };
    }
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'login',
      description: `User ${user.email} logged in`,
    },
  });

  // Log security
  await prisma.securityLog.create({
    data: {
      user_id: user.id,
      ip_address: ip,
      action_type: 'login',
      description: `Login from ${userAgent?.substring(0, 100)}`,
    },
  });

  const payload = { userId: user.id, role: user.role.role_name };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
    firstLogin: user.first_login,
  };
};

const refresh = async (token) => {
  if (!token) throw { status: 401, message: 'No refresh token' };

  const decoded = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { role: true },
  });

  if (!user) throw { status: 401, message: 'User not found' };

  const payload = { userId: user.id, role: user.role.role_name };
  const accessToken = generateAccessToken(payload);

  return { accessToken };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw { status: 400, message: 'Current password is incorrect' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, first_login: false },
  });

  await prisma.activityLog.create({
    data: { user_id: userId, action: 'password_change', description: 'Password changed' },
  });

  return { success: true };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, group: true, level: true },
  });
  if (user) delete user.password;
  return user;
};

const logout = async (userId) => {
  await prisma.activityLog.create({
    data: { user_id: userId, action: 'logout', description: 'User logged out' },
  });
  return { success: true };
};

const updateProfile = async (userId, updateData) => {
  const { full_name, email, phone, password } = updateData;

  const data = {
    full_name,
    email: email?.toLowerCase(),
    phone,
  };

  if (password) {
    data.password = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      include: { role: true, group: true, level: true },
    });

    delete updatedUser.password;

    await prisma.activityLog.create({
      data: { user_id: userId, action: 'profile_update', description: 'Updated own profile' },
    });

    return updatedUser;
  } catch (error) {
    if (error.code === 'P2002') {
      throw { status: 400, message: 'Email already exists' };
    }
    throw error;
  }
};

module.exports = {
  login,
  refresh,
  changePassword,
  getProfile,
  logout,
  updateProfile,
};
