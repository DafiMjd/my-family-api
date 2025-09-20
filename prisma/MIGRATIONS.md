# 🗄️ Database Migrations with Prisma

This guide explains how to work with database migrations in your Express.js project using Prisma.

## 📚 What are Database Migrations?

Database migrations are **version-controlled scripts** that manage your database schema changes over time. They allow you to:

- ✅ **Create, modify, or delete tables**
- ✅ **Add/remove columns**
- ✅ **Create indexes and constraints**
- ✅ **Seed initial data**
- ✅ **Rollback changes if needed**
- ✅ **Keep team databases in sync**

## 🚀 Prisma Migration Commands

### **Available Scripts**

```bash
# Generate Prisma client (run after schema changes)
npm run db:generate

# Create and apply a new migration
npm run db:migrate

# Reset database and apply all migrations
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

### **Migration Workflow**

1. **Modify Schema** → Edit `prisma/schema.prisma`
2. **Generate Migration** → `npm run db:migrate`
3. **Review Migration** → Check generated SQL
4. **Apply Migration** → Automatically applied
5. **Generate Client** → `npm run db:generate`

## 📝 Example: Adding New Fields

### **Step 1: Update Schema**

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  age       Int
  role      Role
  bio       String?  // New field
  phone     String?  // New field
  isActive  Boolean  @default(true) // New field
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### **Step 2: Generate Migration**

```bash
npm run db:migrate
# Enter migration name: add_user_profile_fields
```

### **Step 3: Review Generated SQL**

```sql
-- Migration: add_user_profile_fields
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
```

### **Step 4: Update Types**

```typescript
// src/shared/types/user.types.ts
export interface CreateUserRequest {
  name: string;
  email: string;
  age: number;
  role: Role;
  bio?: string;        // New optional field
  phone?: string;      // New optional field
  isActive?: boolean;  // New optional field
}
```

## 🏗️ Example: Creating New Tables

### **Step 1: Add Model to Schema**

```prisma
// prisma/schema.prisma
model FamilyRelationship {
  id               String   @id @default(cuid())
  parentId         String
  childId          String
  relationshipType String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  parent User @relation("ParentRelations", fields: [parentId], references: [id], onDelete: Cascade)
  child  User @relation("ChildRelations", fields: [childId], references: [id], onDelete: Cascade)

  @@unique([parentId, childId])
  @@map("family_relationships")
}

model User {
  // ... existing fields
  
  // Add relationships
  parentRelations FamilyRelationship[] @relation("ParentRelations")
  childRelations  FamilyRelationship[] @relation("ChildRelations")
}
```

### **Step 2: Generate Migration**

```bash
npm run db:migrate
# Enter migration name: create_family_relationships
```

### **Step 3: Generated SQL**

```sql
-- CreateTable
CREATE TABLE "family_relationships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("childId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "family_relationships_parent_child_key" ON "family_relationships"("parentId", "childId");
```

## 🔄 Migration Examples

### **1. Adding Columns**

```prisma
model User {
  // ... existing fields
  lastLoginAt DateTime? // New optional field
  loginCount  Int       @default(0) // New field with default
}
```

### **2. Modifying Columns**

```prisma
model User {
  // ... existing fields
  email String @unique // Add unique constraint
  age   Int    @default(0) // Add default value
}
```

### **3. Creating Indexes**

```prisma
model User {
  // ... existing fields
  
  @@index([email]) // Create index on email
  @@index([role, isActive]) // Create composite index
}
```

### **4. Adding Relationships**

```prisma
model Post {
  id       String @id @default(cuid())
  title    String
  content  String
  authorId String
  
  author User @relation(fields: [authorId], references: [id])
}

model User {
  // ... existing fields
  posts Post[] // One-to-many relationship
}
```

## 🎯 Best Practices

### **1. Always Review Generated SQL**
```bash
# Check the migration file before applying
cat prisma/migrations/[timestamp]_migration_name/migration.sql
```

### **2. Use Descriptive Migration Names**
```bash
# Good
npm run db:migrate # Enter: add_user_profile_fields
npm run db:migrate # Enter: create_family_relationships_table

# Bad
npm run db:migrate # Enter: update
npm run db:migrate # Enter: changes
```

### **3. Test Migrations on Development First**
```bash
# Reset and test all migrations
npm run db:reset
npm run db:seed
```

### **4. Keep Migrations Small and Focused**
- One logical change per migration
- Easier to debug and rollback
- Better for team collaboration

### **5. Use Transactions for Complex Changes**
```sql
-- Example: Rename column safely
BEGIN;
ALTER TABLE "users" ADD COLUMN "fullName" TEXT;
UPDATE "users" SET "fullName" = "name";
ALTER TABLE "users" DROP COLUMN "name";
COMMIT;
```

## 🚨 Common Migration Scenarios

### **Adding Required Fields to Existing Table**

```prisma
model User {
  // ... existing fields
  phone String // New required field
}
```

**Generated SQL:**
```sql
ALTER TABLE "users" ADD COLUMN "phone" TEXT NOT NULL;
```

**⚠️ Problem:** This will fail if existing records exist!

**✅ Solution:** Add default value first
```prisma
model User {
  // ... existing fields
  phone String @default("") // Add default value
}
```

### **Renaming Columns**

```prisma
model User {
  // ... existing fields
  fullName String // Renamed from 'name'
}
```

**✅ Better approach:** Add new column, migrate data, drop old column
```sql
-- Migration 1: Add new column
ALTER TABLE "users" ADD COLUMN "fullName" TEXT;

-- Migration 2: Copy data
UPDATE "users" SET "fullName" = "name";

-- Migration 3: Drop old column
ALTER TABLE "users" DROP COLUMN "name";
```

## 🔧 Troubleshooting

### **Migration Failed**
```bash
# Check migration status
npx prisma migrate status

# Reset and retry
npm run db:reset
npm run db:migrate
```

### **Schema Drift**
```bash
# Check if database matches schema
npx prisma db pull

# Generate migration to sync
npm run db:migrate
```

### **Rollback Migration**
```bash
# Reset to previous state
npm run db:reset

# Or manually edit migration files
# (Advanced - not recommended)
```

## 📊 Database Studio

Use Prisma Studio to visually manage your database:

```bash
npm run db:studio
```

This opens a web interface where you can:
- ✅ View all tables and data
- ✅ Add, edit, delete records
- ✅ Run queries
- ✅ Explore relationships

## 🎉 Summary

Database migrations with Prisma provide:

- **🔄 Version Control** - Track all database changes
- **👥 Team Sync** - Everyone has the same schema
- **🛡️ Safety** - Rollback capabilities
- **📝 Documentation** - Self-documenting schema
- **🚀 Automation** - Generate SQL automatically
- **🔍 Type Safety** - TypeScript integration

Your database is now properly set up with migrations! 🎯
