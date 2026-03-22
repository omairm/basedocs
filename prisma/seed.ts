import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@basedocs.local' },
    update: {},
    create: {
      email: 'admin@basedocs.local',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Created admin user:', admin.email)

  // Create sample spaces
  const engineeringSpace = await prisma.space.upsert({
    where: { id: 'space-engineering' },
    update: {},
    create: {
      id: 'space-engineering',
      name: 'Engineering',
      description: 'Technical documentation, architecture decisions, and dev guides',
      emoji: '⚙️',
      color: '#2d6a4f',
    },
  })

  const productSpace = await prisma.space.upsert({
    where: { id: 'space-product' },
    update: {},
    create: {
      id: 'space-product',
      name: 'Product',
      description: 'Product specs, roadmaps, and feature documentation',
      emoji: '🚀',
      color: '#bc5a3c',
    },
  })

  console.log('Created spaces:', engineeringSpace.name, productSpace.name)

  // Create sample pages
  const gettingStartedPage = await prisma.page.upsert({
    where: { spaceId_slug: { spaceId: engineeringSpace.id, slug: 'getting-started' } },
    update: {},
    create: {
      title: 'Getting Started',
      slug: 'getting-started',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Getting Started' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Welcome to BaseDocs! This is your engineering documentation hub.',
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Setup' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Follow these steps to set up your development environment.',
              },
            ],
          },
        ],
      },
      spaceId: engineeringSpace.id,
      authorId: admin.id,
    },
  })

  await prisma.page.upsert({
    where: { spaceId_slug: { spaceId: engineeringSpace.id, slug: 'architecture' } },
    update: {},
    create: {
      title: 'Architecture Overview',
      slug: 'architecture',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Architecture Overview' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This document describes the high-level architecture of our system.',
              },
            ],
          },
        ],
      },
      spaceId: engineeringSpace.id,
      parentId: gettingStartedPage.id,
      authorId: admin.id,
    },
  })

  await prisma.page.upsert({
    where: { spaceId_slug: { spaceId: productSpace.id, slug: 'product-roadmap' } },
    update: {},
    create: {
      title: 'Product Roadmap',
      slug: 'product-roadmap',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Product Roadmap' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Our product roadmap for the upcoming quarters.',
              },
            ],
          },
        ],
      },
      spaceId: productSpace.id,
      authorId: admin.id,
    },
  })

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
