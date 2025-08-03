# Koast Automation MVP

A minimal web platform for monitoring Meta Ads campaign performance, setting automation rules, and managing campaign data with an AI assistant.

## 🚀 Features

- **Campaign Monitoring**: Real-time Meta Ads campaign metrics
- **Automation Rules**: Complex AND/OR logic for campaign automation
- **AI Assistant**: Intelligent chat widget with tool integration
- **Data Sync**: Automatic and manual campaign data synchronization
- **Action Logging**: Track automation rule executions
- **Modern UI**: Built with Shadcn/ui components

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **API**: [tRPC](https://trpc.io/) for type-safe APIs
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn/ui](https://ui.shadcn.com/)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) with OpenAI
- **Cron Jobs**: [node-cron](https://github.com/node-cron/node-cron)

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) (for local PostgreSQL)
- [Git](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd koast-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your environment variables:

```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:54320/koast"

# Meta Ads API
META_API_TOKEN="your-meta-api-token"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Optional: Enable cron jobs
ENABLE_CRON="true"
```

### 4. Start the Database

Run the database setup script:

```bash
./start-database.sh
```

This will:
- Start a PostgreSQL container on port 54320
- Generate a random password
- Update your `.env` file with the database URL

### 5. Set Up the Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Meta Ads API

1. Get your Meta Ads API token from the provided proxy endpoint
2. Add it to `META_API_TOKEN` in your `.env` file

### OpenAI API

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Add it to `OPENAI_API_KEY` in your `.env` file

## 📁 Project Structure

```
koast-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Protected routes
│   │   │   ├── dashboard/     # Campaign dashboard
│   │   │   └── automation/    # Automation rules
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   ├── server/               # Server-side code
│   │   ├── api/              # tRPC routers
│   │   └── db/               # Database setup
│   └── lib/                  # Utility functions
├── prisma/                   # Database schema
└── public/                   # Static assets
```

## 🎯 Key Features

### Campaign Dashboard
- Real-time campaign metrics display
- Manual data sync functionality
- Auto-sync on page load

### Automation Rules
- Complex AND/OR logic support
- Rule builder with Revealbot-style interface
- Action logging and testing
- Rule execution monitoring

### AI Assistant
- Intelligent chat widget
- Tool integration for data access
- Automatic UI updates on sync
- Markdown response formatting

### Data Management
- PostgreSQL database with Prisma ORM
- Automated cron jobs for data sync
- Action logging and audit trails

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Docker

```bash
# Build the image
docker build -t koast-app .

# Run the container
docker run -p 3000:3000 koast-app
```

## 🔍 Troubleshooting

### Database Connection Issues
- Ensure Docker is running
- Check if PostgreSQL container is started: `docker ps`
- Verify database URL in `.env` file

### API Issues
- Verify Meta Ads API token
- Check OpenAI API key configuration
- Ensure all environment variables are set

### Build Issues
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Regenerate Prisma client: `npx prisma generate`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.
