import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import repoRouter from './routes/repo.js';
import gitCloneRouter from './routes/git-clone.js';
import architectureRouter from './routes/architecture.js';
import websiteRouter from './routes/website.js';
import devAssistantRouter from './routes/devassistant.js';
import chatsRouter from './routes/chats.js';
import { requireAuth } from './server/auth.js';
import prisma from './server/db.js';
import { aiGenerate, aiStream } from './server/ai-gateway.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount routers
app.use('/api/repo', repoRouter);
app.use('/api/git-clone', gitCloneRouter);
app.use('/api/architecture', architectureRouter);
app.use('/api/website', websiteRouter);
app.use('/api/devassistant', devAssistantRouter);
app.use('/api/chats', chatsRouter);

console.log('✔ AI Gateway initialized');

/**
 * System prompt that defines Euler's personality and capabilities.
 */
const SYSTEM_PROMPT = `You are Euler, an advanced AI coding assistant. You help developers with:
- Writing, debugging, and reviewing code
- Architecture design and best practices
- Explaining complex programming concepts
- Generating project structures and boilerplate
- Optimizing code performance

You are concise, precise, and helpful. When showing code, use markdown code blocks with the appropriate language.
Keep responses focused and actionable. You have a calm, professional tone with a touch of warmth.`;

/**
 * POST /api/chat
 * Body: { messages: [{ role: 'user'|'assistant', content: string }] }
 * Response: Server-Sent Events stream formatted to match what the frontend expects
 */
app.post('/api/chat', requireAuth, async (req, res) => {
  const { messages = [], chatId } = req.body;

  if (!messages.length) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  // Find or create chat session
  let chat;
  try {
    if (chatId) {
      chat = await prisma.chat.findFirst({
        where: { id: chatId, userId: req.user.id }
      });
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
    } else {
      chat = await prisma.chat.create({
        data: {
          userId: req.user.id,
          title: 'New Chat',
        }
      });
    }
  } catch (err) {
    console.error('Failed to resolve/create chat:', err);
    return res.status(500).json({ error: 'Database error resolving chat session' });
  }

  // Save user's last message to database
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg && lastUserMsg.role === 'user') {
    try {
      await prisma.message.create({
        data: {
          chatId: chat.id,
          role: 'USER',
          content: lastUserMsg.content,
        }
      });
    } catch (err) {
      console.error('Failed to save user message:', err);
    }
  }

  try {
    let finalTitle = chat.title;

    await aiStream(SYSTEM_PROMPT, messages, res, {
      onComplete: async (assistantResponseContent) => {
        // Save assistant's response to database
        if (assistantResponseContent) {
          try {
            await prisma.message.create({
              data: {
                chatId: chat.id,
                role: 'ASSISTANT',
                content: assistantResponseContent,
              }
            });

            // Touch the chat updatedAt timestamp
            await prisma.chat.update({
              where: { id: chat.id },
              data: { updatedAt: new Date() }
            });
          } catch (err) {
            console.error('Failed to save assistant message:', err);
          }
        }

        // Auto-generate chat title from the first user message if this is the start of the chat
        try {
          const msgCount = await prisma.message.count({ where: { chatId: chat.id } });
          if (msgCount <= 2 && lastUserMsg && lastUserMsg.content) {
            const titlePrompt = `Generate a short, concise chat title (3-5 words max) representing this message. Return ONLY the title, no quotes, no extra text: "${lastUserMsg.content}"`;
            const generatedTitle = await aiGenerate(
              'You are a helpful assistant that summarizes messages into short, punchy titles.',
              titlePrompt,
              0.5
            );
            const cleanedTitle = generatedTitle.replace(/["']/g, '').trim();
            if (cleanedTitle && cleanedTitle !== '') {
              finalTitle = cleanedTitle.length > 50 ? cleanedTitle.slice(0, 47) + '...' : cleanedTitle;
              await prisma.chat.update({
                where: { id: chat.id },
                data: { title: finalTitle }
              });
            }
          }
        } catch (titleErr) {
          console.error('Title generation error:', titleErr);
        }

        // Send final metadata chunk with chatId and title to the client
        res.write(`data: ${JSON.stringify({ chatId: chat.id, title: finalTitle })}\n\n`);
      }
    });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'gemini-2.5-flash' });
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve Vite build files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve React app for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
const PORT = process.env.PORT || 3001;
createServer(app).listen(PORT, () => {
  console.log(`\n  🚀 Euler backend running at http://localhost:${PORT}`);
  console.log(`  📡 API endpoint: http://localhost:${PORT}/api/chat (Using Gemini)\n`);
});
