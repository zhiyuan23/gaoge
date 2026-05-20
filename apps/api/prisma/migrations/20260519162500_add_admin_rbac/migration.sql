CREATE TABLE IF NOT EXISTS "Role" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "sort" INTEGER NOT NULL DEFAULT 0,
  "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Permission" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Menu" (
  "id" SERIAL NOT NULL,
  "parentId" INTEGER,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "icon" TEXT,
  "path" TEXT NOT NULL,
  "routeName" TEXT NOT NULL,
  "menuType" TEXT NOT NULL,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserRole" (
  "userId" INTEGER NOT NULL,
  "roleId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId")
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "roleId" INTEGER NOT NULL,
  "permissionId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE TABLE IF NOT EXISTS "MenuPermission" (
  "menuId" INTEGER NOT NULL,
  "permissionId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuPermission_pkey" PRIMARY KEY ("menuId", "permissionId")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Role_code_key" ON "Role"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Menu_routeName_key" ON "Menu"("routeName");
CREATE UNIQUE INDEX IF NOT EXISTS "Menu_parentId_name_key" ON "Menu"("parentId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Menu_parentId_path_key" ON "Menu"("parentId", "path");

CREATE INDEX IF NOT EXISTS "Role_status_idx" ON "Role"("status");
CREATE INDEX IF NOT EXISTS "Role_sort_idx" ON "Role"("sort");
CREATE INDEX IF NOT EXISTS "Permission_module_idx" ON "Permission"("module");
CREATE INDEX IF NOT EXISTS "Permission_status_idx" ON "Permission"("status");
CREATE INDEX IF NOT EXISTS "Menu_parentId_idx" ON "Menu"("parentId");
CREATE INDEX IF NOT EXISTS "Menu_sort_idx" ON "Menu"("sort");
CREATE INDEX IF NOT EXISTS "UserRole_roleId_idx" ON "UserRole"("roleId");
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE INDEX IF NOT EXISTS "MenuPermission_permissionId_idx" ON "MenuPermission"("permissionId");

ALTER TABLE "Menu"
  ADD CONSTRAINT "Menu_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Menu"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RolePermission"
  ADD CONSTRAINT "RolePermission_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RolePermission"
  ADD CONSTRAINT "RolePermission_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuPermission"
  ADD CONSTRAINT "MenuPermission_menuId_fkey"
  FOREIGN KEY ("menuId") REFERENCES "Menu"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuPermission"
  ADD CONSTRAINT "MenuPermission_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
