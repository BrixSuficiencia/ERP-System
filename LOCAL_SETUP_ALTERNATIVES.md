# Local PostgreSQL Setup Instructions

## Option 1: Install PostgreSQL Locally

### Windows (using Chocolatey)
```bash
# Install Chocolatey if you don't have it
# Then install PostgreSQL
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

### Manual Installation
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the 'postgres' user
4. Update your `.env` file with the correct password

## Option 2: Use SQLite for Testing (Simplest)

Let me create a SQLite configuration for easy testing:

```typescript
// In src/app.module.ts, replace TypeORM config with:
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: 'erp_backend.sqlite',
  autoLoadEntities: true,
  synchronize: true, // Only for development
}),
```

## Option 3: Use Online Database (Quick Test)

You can use a free online PostgreSQL service like:
- Supabase (https://supabase.com)
- Railway (https://railway.app)
- Neon (https://neon.tech)

## Recommended: SQLite for Quick Testing

Would you like me to modify the configuration to use SQLite instead? It's much simpler for testing and doesn't require Docker or PostgreSQL installation.
