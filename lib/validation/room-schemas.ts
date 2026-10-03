import { z } from 'zod'

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(2, 'Room name must be at least 2 characters')
    .max(50, 'Room name must be at most 50 characters'),
  description: z
    .string()
    .max(200, 'Description must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  isPrivate: z.boolean().default(false),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .optional()
    .or(z.literal('')),
  maxParticipants: z
    .number()
    .int()
    .min(2, 'Minimum 2 participants')
    .max(50, 'Maximum 50 participants')
    .default(10),
  theme: z
    .string()
    .optional()
    .or(z.literal('')),
})

export const joinRoomSchema = z.object({
  roomCode: z
    .string()
    .min(1, 'Room code is required')
    .max(10, 'Invalid room code'),
  password: z
    .string()
    .optional()
    .or(z.literal('')),
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type JoinRoomInput = z.infer<typeof joinRoomSchema>
