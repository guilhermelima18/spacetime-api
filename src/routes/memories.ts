import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../libs/prisma'
import { z } from 'zod'

export async function memoriesRoutes(app: FastifyInstance) {
  app.addHook(
    'preHandler',
    async (request: FastifyRequest) => await request.jwtVerify(),
  )

  app.get('/memories', async (request: FastifyRequest) => {
    const { sub: userId } = request?.user as any

    const memories = await prisma.memory.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return memories.map((memory) => ({
      ...memory,
      content: memory.content.slice(0, 120).concat('...'),
    }))
  })

  app.get(
    '/memories/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = paramsSchema.parse(request.params)

      const memory = await prisma.memory.findUniqueOrThrow({
        where: {
          id,
        },
      })

      const { sub: userId } = request.user as any

      if (!memory.isPublic && memory.userId !== userId) {
        return reply.status(401).send()
      }

      return memory
    },
  )

  app.post('/memories', async (request: FastifyRequest) => {
    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
      isPublic: z.coerce.boolean().default(false),
    })

    const { sub: userId } = request.user as any

    const { content, coverUrl, isPublic } = bodySchema.parse(request.body)

    const memory = await prisma.memory.create({
      data: {
        content,
        coverUrl,
        isPublic,
        userId,
      },
    })

    return memory
  })

  app.put(
    '/memories/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = paramsSchema.parse(request.params)

      const bodySchema = z.object({
        content: z.string(),
        coverUrl: z.string(),
        isPublic: z.coerce.boolean().default(false),
      })

      const { content, coverUrl, isPublic } = bodySchema.parse(request.body)

      let memory = await prisma.memory.findFirstOrThrow({
        where: {
          id,
        },
      })

      const { sub: userId } = request.user as any

      if (memory.userId !== userId) {
        return reply.status(401).send()
      }

      memory = await prisma.memory.update({
        where: {
          id,
        },
        data: {
          content,
          coverUrl,
          isPublic,
        },
      })

      return memory
    },
  )

  app.delete(
    '/memories/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = paramsSchema.parse(request.params)

      const memory = await prisma.memory.findFirstOrThrow({
        where: {
          id,
        },
      })

      const { sub: userId } = request.user as any

      if (memory.userId !== userId) {
        return reply.status(401).send()
      }

      await prisma.memory.delete({
        where: {
          id,
        },
      })
    },
  )
}
