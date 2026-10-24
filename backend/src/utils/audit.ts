import { Request } from 'express';
import { prisma } from '../prisma';

export const logAudit = async (
  actorId: string | undefined,
  action: string,
  details: string,
  req?: Request
) => {
  try {
    const ipAddress = req ? req.ip || req.socket.remoteAddress : undefined;
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        ipAddress,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
