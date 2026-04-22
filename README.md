# MedQuire - Medication Information Simplifier

MedQuire is a mobile application that translates complex medication information into clear, plain, everyday language. It helps users understand prescriptions, dosage instructions, warnings, and side effects without medical jargon.

## Features

- **ChatGPT-style interface**: Single input flow with inline results
- **Plain-language summaries**: AI-powered simplification of medical information
- **Guest mode**: Search and view summaries without account
- **Cabinet**: Save medications for quick access (requires account)
- **Interaction checker**: Check potential drug interactions
- **ELI12 mode**: Extra-simple explanations for low health literacy
- **Safety-first design**: Always shows disclaimer, never provides medical advice

## Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- @react-navigation for navigation
- Supabase for authentication
- Design token system for consistent styling

### Backend
- Node.js + Express
- TypeScript
- OpenFDA API for drug data
- DeepSeek API for AI summarization
- Supabase for database

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier)
- DeepSeek API key (free tier available)
- OpenFDA API key (optional, public API available)

### 2. Backend Setup

```bash
cd api
npm install
```

Create `.env` file in `api/` directory:
```env
PORT=3001
OPENFDA_API_KEY=your_openfda_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

Start the backend:
```bash
npm run dev  # development
npm start    # production
```

### 3. Frontend Setup

```bash
cd app
npm install
```

Install additional dependencies:
```bash
npm install @supabase/supabase-js @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

Create `.env` file in `app/` directory:
```env
API_BASE_URL=http://localhost:3001
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migration file located at `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor
3. Enable email authentication in Supabase Auth settings

### 5. Running the Application

Start the backend:
```bash
cd api
npm run dev
```

Start the frontend:
```bash
cd app
npm start
```

Scan the QR code with Expo Go app (iOS/Android) or run on emulator:
```bash
npm run android  # Android emulator
npm run ios      # iOS simulator (macOS only)
npm run web      # Web browser
```

## Architecture Overview

### Data Flow
1. User enters medication name
2. Backend queries OpenFDA API
3. Data is normalized and validated
4. DeepSeek AI generates plain-language summary
5. Response is validated and returned
6. Frontend displays summary inline

### Safety Features
- **No medical advice**: System only rewrites existing information
- **Source transparency**: All data labeled with "Source: OpenFDA"
- **Uncertainty handling**: Missing data explicitly stated
- **Mandatory disclaimer**: Always visible in results
- **No data fabrication**: AI only rewrites, never invents

### Guest Mode
- Default experience for all users
- Can search and view summaries
- Cannot save medications or check interactions
- Auth modal triggers when restricted action attempted
- Returns to previous action after authentication

## Project Structure

```
MedQuire/
├── api/                    # Backend server
│   ├── src/
│   │   ├── controllers/   # API endpoints
│   │   ├── services/      # External API integrations
│   │   └── middleware/    # Auth middleware
│   └── package.json
├── app/                   # React Native frontend
│   ├── components/        # Reusable UI components
│   ├── screens/          # App screens
│   ├── services/         # API clients
│   ├── context/          # React context providers
│   ├── navigation/       # Navigation configuration
│   └── theme/           # Design tokens
├── supabase/             # Database migrations
└── skills/              # Design system documentation
```

## API Endpoints

### Backend (`http://localhost:3001`)
- `POST /api/search` - Search medication and get summary
- `GET /api/autocomplete` - Get drug name suggestions
- `POST /api/eli12` - Generate ELI12 (simplified) summary
- `POST /api/interactions` - Check drug interactions
- `POST /api/cabinet/save` - Save medication to cabinet (auth)
- `GET /api/cabinet/items` - Get cabinet items (auth)
- `DELETE /api/cabinet/items/:drugKey` - Remove from cabinet (auth)

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 3001)
- `OPENFDA_API_KEY`: OpenFDA API key (optional)
- `DEEPSEEK_API_KEY`: DeepSeek API key (required)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

### Frontend (.env)
- `API_BASE_URL`: Backend URL (default: http://localhost:3001)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

## Development

### Code Style
- TypeScript for type safety
- Design token system for styling
- Component-based architecture
- Consistent error handling

### Testing
- Manual testing of all user flows
- API integration testing
- Mobile platform testing (iOS/Android)

### Security Notes
- No sensitive health data stored
- API keys kept server-side
- HTTPS enforced for all external calls
- Row-level security in database

## Compliance

MedQuire is designed as a health literacy tool, not a medical device:
- Never provides medical advice
- Only rewrites existing FDA-approved information
- Always shows disclaimer
- Encourages consultation with healthcare professionals

## Troubleshooting

### Common Issues

1. **Backend won't start**: Check `.env` file and API keys
2. **Frontend connection errors**: Verify `API_BASE_URL` matches backend
3. **Authentication failures**: Confirm Supabase credentials
4. **AI summary failures**: Check DeepSeek API key and quota

### Getting Help
- Check the implementation_plan.md for detailed architecture
- Review the skills/ directory for design system
- Open an issue for bugs or questions

## License

Proprietary - All rights reserved.

## Disclaimer

MedQuire simplifies medical information for understanding. It does not replace professional medical advice. Always consult a healthcare professional for medical decisions.