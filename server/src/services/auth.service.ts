import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/environment.js';

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, role: true },
  });

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
  return { user, token };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) throw new Error('User not found');
  return user;
}
