# IMA Alumni - Alumni Community Platform

IMA Alumni is a modern web platform designed to connect alumni from educational institutions. This application helps graduates stay connected, share updates, view events, and access job opportunities related to their alumni community.

## Features

- **User Authentication**: Secure login and registration system
- **Alumni Feed**: Share updates and connect with fellow alumni
- **Alumni Directory**: Find and connect with other graduates
- **Events**: View upcoming and past alumni events
- **Job Opportunities**: Access career opportunities shared by fellow alumni
- **Announcements**: Stay updated with important announcements
- **Profile Management**: Create and update your alumni profile

## Technologies Used

- React 19
- TypeScript
- React Router 7
- Lucide Icons
- Vite
- CSS (Custom styling)

## Project Structure

The project follows a modular component-based architecture:

```
alumni-com/
  ├─ public/            # Static assets
  ├─ src/
  │  ├─ components/     # Shared components
  │  ├─ pages/          # Application pages
  │  │  ├─ Auth/        # Authentication pages
  │  │  ├─ Home/        # Home page and feed
  │  │  └─ ...
  │  ├─ types/          # TypeScript type definitions
  │  ├─ App.tsx         # Main application component
  │  └─ main.tsx        # Application entry point
  ├─ .gitignore
  ├─ package.json
  ├─ tsconfig.json
  └─ vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/alumni-com.git
   cd alumni-com
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Development Status

This project is currently in development with the following implementation status:

- ✅ User Authentication (UI only)
- ✅ Home Feed (UI only)
- ⏳ Alumni Directory (Pending)
- ⏳ Events Page (Pending)
- ⏳ Job Opportunities (Pending)
- ⏳ Announcements (Pending)
- ⏳ Backend Integration (Pending)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspiration from modern social and community platforms
- Icons provided by [Lucide Icons](https://lucide.dev/)
