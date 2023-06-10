import fastify from 'fastify'
import { prisma } from './libs/prisma'

const app = fastify()

app.get('/', async () => {
  const users = await prisma.user.findMany()

  return users
})

app
  .listen({
    port: 3333,
  })
  .then(() => console.log('Server is running!'))
