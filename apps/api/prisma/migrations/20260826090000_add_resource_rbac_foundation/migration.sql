-- Expand the existing integer-ID RBAC model with explicit resources and audit events.
-- Legacy Permission.module/resource and MenuPermission remain in place for compatibility.

CREATE TABLE "Resource" (
  "id" SERIAL NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Resource_key_format_check" CHECK (
    "key" ~ '^[a-z][A-Za-z0-9-]*\.[a-z][A-Za-z0-9-]*$'
  ),
  CONSTRAINT "Resource_status_check" CHECK ("status" IN ('active', 'inactive'))
);

ALTER TABLE "Permission" ADD COLUMN "resourceId" INTEGER;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Permission"
    WHERE "code" !~ '^[a-z][A-Za-z0-9-]*\.[a-z][A-Za-z0-9-]*\.[a-z][A-Za-z0-9-]*$'
  ) THEN
    RAISE EXCEPTION 'RBAC_RESOURCE_INVALID_CODE';
  END IF;

  IF EXISTS (
    SELECT "module", "resource"
    FROM "Permission"
    GROUP BY "module", "resource"
    HAVING count(*) FILTER (WHERE "action" = 'view') <> 1
  ) THEN
    RAISE EXCEPTION 'RBAC_RESOURCE_VIEW_REQUIRED';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Permission"
    WHERE "code" <> "module" || '.' || "resource" || '.' || "action"
  ) THEN
    RAISE EXCEPTION 'RBAC_RESOURCE_LEGACY_COLUMNS_MISMATCH';
  END IF;

  IF EXISTS (
    SELECT "module" || '.' || "resource"
    FROM "Permission"
    GROUP BY "module" || '.' || "resource"
    HAVING count(DISTINCT "module") <> 1
  ) THEN
    RAISE EXCEPTION 'RBAC_RESOURCE_MODULE_CONFLICT';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "MenuPermission" relation
    JOIN "Permission" permission ON permission."id" = relation."permissionId"
    WHERE permission."action" <> 'view'
  ) THEN
    RAISE EXCEPTION 'RBAC_MENU_NON_VIEW_PERMISSION';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "MenuPermission" relation
    JOIN "Menu" menu ON menu."id" = relation."menuId"
    WHERE menu."menuType" = 'catalog'
  ) THEN
    RAISE EXCEPTION 'RBAC_DIRECTORY_RESOURCE_FORBIDDEN';
  END IF;
END
$preflight$;

INSERT INTO "Resource" (
  "key", "name", "module", "description", "status", "isBuiltIn", "sort", "updatedAt"
)
SELECT
  view_permission."module" || '.' || view_permission."resource",
  COALESCE(
    NULLIF(regexp_replace(view_permission."name", '([ -]?查看)$', ''), ''),
    view_permission."resource"
  ),
  view_permission."module",
  view_permission."description",
  CASE WHEN view_permission."status" = 'active' THEN 'active' ELSE 'inactive' END,
  bool_and(group_permission."isBuiltIn"),
  ((row_number() OVER (
    PARTITION BY view_permission."module"
    ORDER BY view_permission."resource"
  ) - 1) * 10)::integer,
  CURRENT_TIMESTAMP
FROM "Permission" view_permission
JOIN "Permission" group_permission
  ON group_permission."module" = view_permission."module"
 AND group_permission."resource" = view_permission."resource"
WHERE view_permission."action" = 'view'
GROUP BY
  view_permission."id",
  view_permission."module",
  view_permission."resource",
  view_permission."name",
  view_permission."description",
  view_permission."status";

UPDATE "Permission" permission
SET "resourceId" = resource."id"
FROM "Resource" resource
WHERE resource."key" = permission."module" || '.' || permission."resource";

ALTER TABLE "Permission"
  ALTER COLUMN "resourceId" SET NOT NULL,
  ADD CONSTRAINT "Permission_action_format_check"
  CHECK ("action" ~ '^[a-z][A-Za-z0-9-]*$');

CREATE UNIQUE INDEX "Resource_key_key" ON "Resource"("key");
CREATE INDEX "Resource_module_status_sort_idx" ON "Resource"("module", "status", "sort");
CREATE INDEX "Resource_isBuiltIn_idx" ON "Resource"("isBuiltIn");
CREATE UNIQUE INDEX "Permission_resourceId_action_key" ON "Permission"("resourceId", "action");
CREATE INDEX "Permission_resourceId_status_idx" ON "Permission"("resourceId", "status");

ALTER TABLE "Permission"
  ADD CONSTRAINT "Permission_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MenuResource" (
  "menuId" INTEGER NOT NULL,
  "resourceId" INTEGER NOT NULL,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuResource_pkey" PRIMARY KEY ("menuId", "resourceId")
);

CREATE INDEX "MenuResource_resourceId_menuId_idx" ON "MenuResource"("resourceId", "menuId");

ALTER TABLE "MenuResource"
  ADD CONSTRAINT "MenuResource_menuId_fkey"
  FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MenuResource_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "MenuResource" ("menuId", "resourceId", "sort")
SELECT
  relation."menuId",
  permission."resourceId",
  (row_number() OVER (
    PARTITION BY relation."menuId"
    ORDER BY permission."code"
  ) - 1)::integer
FROM "MenuPermission" relation
JOIN "Permission" permission ON permission."id" = relation."permissionId"
ON CONFLICT ("menuId", "resourceId") DO NOTHING;

CREATE TABLE "AuditEvent" (
  "id" BIGSERIAL NOT NULL,
  "action" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "actorUserId" INTEGER,
  "entityType" TEXT,
  "entityId" TEXT,
  "requestId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");
CREATE INDEX "AuditEvent_requestId_idx" ON "AuditEvent"("requestId");

ALTER TABLE "AuditEvent"
  ADD CONSTRAINT "AuditEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
