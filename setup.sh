#!/bin/bash
# Brothers Automobiles — Billing System Setup Script

set -e

echo ""
echo "🔧 Brothers Automobiles — Garage Billing Setup"
echo "================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check for .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  Created .env file from .env.example"
    echo "   → Please edit .env and set your DATABASE_URL before continuing"
    echo ""
    echo "   Example:"
    echo '   DATABASE_URL="postgresql://postgres:password@localhost:5432/garage_billing"'
    echo ""
    read -p "Press Enter after setting DATABASE_URL in .env..."
fi

echo ""
echo "🗄️  Setting up database..."
npm run db:generate
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Add your logo: copy BA-logo.png to public/ folder"
echo "   2. Start the server: npm run dev"
echo "   3. Open: http://localhost:3000"
echo ""
