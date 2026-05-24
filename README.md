<<<<<<< HEAD
# Euler - AI Coding Workspace

A futuristic single-page AI development workspace with a cinematic cosmic aesthetic.

## 🎨 Design Philosophy

Euler is designed as a premium AI developer operating system - not a traditional multi-page website. The interface is inspired by ChatGPT, Cursor, and Perplexity, featuring:

- **Single-page workspace** - No navigation, no landing pages
- **Immersive fullscreen** - Distraction-free AI interaction
- **Cosmic aesthetic** - Floating orbs, star fields, glassmorphism
- **Minimal & clean** - Focus on the conversation, not the UI

## 🚀 Quick Start

```bash
# Start development server
npm run dev

# Or use the batch file
start.bat

# Open browser to
http://localhost:5173
```

## 📐 Architecture

### Single-Page Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar  │         Main Workspace                  │
│           │                                          │
│  Logo     │  Welcome Screen (no chat)                │
│  New Chat │  OR                                      │
│  History  │  Message List (active chat)              │
│  Tools    │                                          │
│  Files    │                                          │
│  Settings │  Message Input (bottom)                  │
└─────────────────────────────────────────────────────┘
```

### Component Structure

```
src/
├── components/
│   ├── orbs/
│   │   └── FloatingOrb.jsx       # Animated cosmic orbs
│   ├── ui/
│   │   ├── Button.jsx            # Reusable button
│   │   └── GlassCard.jsx         # Glass effect card
│   ├── Sidebar.jsx               # Left navigation panel
│   ├── ChatWorkspace.jsx         # Main content area
│   ├── WelcomeScreen.jsx         # Empty state screen
│   ├── MessageList.jsx           # Chat messages
│   ├── MessageInput.jsx          # Input with actions
│   └── StarField.jsx             # Animated background
├── App.jsx                       # Main workspace
├── main.jsx                      # Entry point
└── index.css                     # Global styles
```

## ✨ Features

### Left Sidebar
- ✅ Euler logo with glow effect
- ✅ New Chat button
- ✅ Recent chat history
- ✅ Semantic Search tool
- ✅ Recent files section
- ✅ Settings at bottom
- ✅ Smooth hover animations
- ✅ Glassmorphism design

### Main Workspace
- ✅ Welcome screen with animated icon
- ✅ Suggestion cards
- ✅ Message list with avatars
- ✅ Smooth message animations
- ✅ Auto-scroll to latest message

### Message Input
- ✅ Floating glassmorphism design
- ✅ Multi-line text input
- ✅ Action menu button (left)
- ✅ Voice input button
- ✅ Send button (right)
- ✅ Popup action menu with 4 options:
  - Upload Repository
  - Build Website
  - Analyze Code
  - Generate Architecture

### Background Effects
- ✅ Animated star field
- ✅ 3 floating orbs with different sizes
- ✅ Gentle jiggling physics
- ✅ Mouse interaction
- ✅ Smooth gradients

## 🎯 Design Features

### Cosmic Aesthetic
- Dark space background (#0a0a0f)
- Purple/blue/pink gradient orbs
- Glassmorphism panels
- Soft glows and shadows
- Animated star particles

### Animations
- Floating orb physics
- Message fade-in
- Hover scale effects
- Smooth transitions
- Rotating welcome icon

### Typography
- Clean sans-serif fonts
- Text glow effects on headings
- Proper hierarchy
- Readable line heights

## 🛠️ Tech Stack

- **React 18.3.1** - UI framework
- **Vite 8** - Build tool
- **Tailwind CSS 3** - Styling
- **Framer Motion 12** - Animations
- **Lucide React** - Icons

## 📱 Responsive Design

The interface adapts to different screen sizes:
- Desktop: Full sidebar + workspace
- Tablet: Collapsible sidebar
- Mobile: Overlay sidebar

## 🎨 Customization

### Change Orb Colors
Edit `App.jsx`:
```jsx
<FloatingOrb 
  size={500} 
  color="from-purple-500/30 to-pink-500/30" 
  delay={0} 
  duration={15} 
/>
```

### Adjust Star Field
Edit `StarField.jsx`:
```javascript
const stars = Array.from({ length: 150 }, () => ({
  // Adjust count and properties
}));
```

### Modify Glassmorphism
Edit `index.css`:
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## 🚀 Performance

- Bundle size: ~282KB (gzipped: 91KB)
- Fast HMR with Vite
- Smooth 60fps animations
- Optimized canvas rendering
- Lazy component loading ready

## 🔧 Development

### File Structure
- Keep components small and focused
- Use Framer Motion for animations
- Follow glassmorphism design pattern
- Maintain cosmic color palette

### Adding New Features
1. Create component in `src/components/`
2. Import in parent component
3. Add animations with Framer Motion
4. Test build: `npm run build`

## 📝 Notes

### What Changed from Previous Version
- ❌ Removed multi-page navigation
- ❌ Removed landing page
- ❌ Removed dashboard tabs
- ❌ Removed React Router
- ✅ Single-page workspace
- ✅ ChatGPT-like interface
- ✅ Floating action menu
- ✅ Enhanced cosmic effects

### Design Decisions
- **No landing page**: Direct to workspace
- **Minimal UI**: Focus on AI interaction
- **Glassmorphism**: Modern premium feel
- **Floating orbs**: Unique visual identity
- **Star field**: Cosmic atmosphere

## 🎉 Result

A production-ready, single-page AI workspace that feels like a futuristic developer operating system with:
- Immersive fullscreen experience
- Cinematic cosmic aesthetic
- Smooth animations
- Clean minimal interface
- Premium AI tool feel

Perfect for AI coding assistants, developer tools, and futuristic applications.

## 📄 License

MIT
=======
# EULER
>>>>>>> 2a07fc5dd86a800ca58617f1ef7ddf965af69566
