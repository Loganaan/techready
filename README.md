# TechReady - AI Interview Coach 🎯

Practice behavioral and technical interviews with AI-powered feedback. Master your interview skills and land your dream job.

![TechReady Logo](public/images/TechReady_letters.png)

## 🌟 Features

### 🗣️ Behavioral Interview Practice
- AI-powered conversational interview practice
- Real-time voice interaction with ElevenLabs text-to-speech
- STAR method feedback and analysis
- Live transcription with Deepgram
- Filler word detection and coaching
- Session recording and review

### 💻 Technical Interview Preparation
- LeetCode-style coding challenges
- Multiple-choice technical questions
- System design discussions
- Real-time code execution
- Python code evaluation
- Personalized difficulty levels

### 🎤 Full Interview Sessions
- Complete interview simulation
- Behavioral + Technical rounds
- Company-specific preparation
- Role-based question generation
- Comprehensive feedback reports

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Firebase account
- API keys for:
  - Google Gemini AI
  - ElevenLabs (text-to-speech)
  - Deepgram (speech-to-text)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Loganaan/kstate-hackathon-2025.git
cd kstate-hackathon-2025
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:
```env
GEMINI_API_KEY=your-gemini-key
XI_API_KEY=your-elevenlabs-key
DEEPGRAM_API_KEY=your-deepgram-key
FIREBASE_API_KEY=your-firebase-key
# ... other Firebase config
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini AI
- **Voice**: ElevenLabs, Deepgram
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
kstate-hackathon-2025/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   ├── interview/         # Interview pages
│   │   │   ├── behavioral/   # Behavioral interview
│   │   │   ├── technical/    # Technical interview
│   │   │   └── full-session/ # Full interview flow
│   │   ├── layout.tsx        # Root layout with SEO
│   │   └── page.tsx          # Home page
│   ├── components/            # Reusable React components
│   ├── contexts/              # React contexts (Auth, etc.)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
│   ├── images/               # Images and icons
│   ├── manifest.json         # PWA manifest
│   └── robots.txt           # SEO robots file
└── SEO_IMPLEMENTATION.md     # SEO documentation
```

## 🎨 Key Features Detail

### AI-Powered Feedback
- Real-time analysis using Google Gemini
- Contextual follow-up questions
- STAR method evaluation
- Communication style assessment

### Voice Interaction
- Natural voice responses with ElevenLabs
- Live speech-to-text with Deepgram
- Text highlighting synchronized with audio
- Filler word detection ("um", "uh", "like")

### Code Execution
- Secure Python code execution
- Real-time console output
- Test case validation
- Syntax error handling

### Session Management
- Save and review past sessions
- Track progress over time
- Export feedback reports
- Resume incomplete sessions

## 🔒 Environment Variables

See `.env.example` for all required environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `XI_API_KEY` | ElevenLabs API key | Yes |
| `DEEPGRAM_API_KEY` | Deepgram API key | Yes |
| `FIREBASE_API_KEY` | Firebase configuration | Yes |
| `NEXT_PUBLIC_BASE_URL` | App base URL for SEO | Yes |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console | No |

## 📈 SEO Optimization

This project includes comprehensive SEO implementation:

- ✅ Meta tags and Open Graph
- ✅ Structured data (JSON-LD)
- ✅ Dynamic sitemap
- ✅ Robots.txt configuration
- ✅ Web app manifest (PWA)
- ✅ Image optimization
- ✅ Performance optimization

See [SEO_IMPLEMENTATION.md](SEO_IMPLEMENTATION.md) for details.

## 🧪 Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
Build the production bundle:
```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

Created for K-State Hackathon 2025

## 🙏 Acknowledgments

- Google Gemini AI for intelligent responses
- ElevenLabs for natural voice synthesis
- Deepgram for accurate speech recognition
- Next.js team for the amazing framework
- Firebase for backend services

## 📞 Support

For support, email support@techready.tech or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Video interview practice
- [ ] Resume analysis integration
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Group interview practice
- [ ] Interview scheduler
- [ ] Career coaching AI

---

Made with ❤️ for job seekers everywhere
