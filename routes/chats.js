import { Router } from 'express';
import prisma from '../server/db.js';
import { requireAuth } from '../server/auth.js';

const router = Router();

// Apply authentication middleware to all chats routes
router.use(requireAuth);

/**
 * GET /api/chats
 * Returns all chatbot conversations for the authenticated user, ordered by most recently updated.
 */
router.get('/', async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format timestamps for display in frontend (e.g. standard ISO or simple calculation)
    const formattedChats = chats.map((c) => {
      const diffMs = Date.now() - new Date(c.updatedAt).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      let timestamp = 'Just now';
      if (diffDay > 1) {
        timestamp = `${diffDay} days ago`;
      } else if (diffDay === 1) {
        timestamp = 'Yesterday';
      } else if (diffHr > 0) {
        timestamp = `${diffHr}h ago`;
      } else if (diffMin > 0) {
        timestamp = `${diffMin}m ago`;
      }

      return {
        ...c,
        timestamp,
      };
    });

    res.json({ chats: formattedChats });
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

/**
 * GET /api/chats/:id/messages
 * Returns all messages associated with a specific chat, verifying ownership first.
 */
router.get('/:id/messages', async (req, res) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    res.json({ messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * PATCH /api/chats/:id
 * Renames a chat title.
 */
router.patch('/:id', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    // Verify ownership and update
    const chat = await prisma.chat.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const updatedChat = await prisma.chat.update({
      where: { id: req.params.id },
      data: { title: title.trim() },
    });

    res.json({ success: true, chat: updatedChat });
  } catch (err) {
    console.error('Error renaming chat:', err);
    res.status(500).json({ error: 'Failed to rename chat' });
  }
});

/**
 * DELETE /api/chats/:id
 * Deletes a chat. Messages will be cascade-deleted at the DB layer.
 */
router.delete('/:id', async (req, res) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await prisma.chat.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export default router;
