ALTER TABLE "Menu" ALTER COLUMN "path" DROP NOT NULL;

INSERT INTO "Menu" (
  "name",
  "title",
  "path",
  "routeName",
  "menuType",
  "sort",
  "status",
  "visible",
  "isBuiltIn",
  "updatedAt"
)
VALUES
  (
    'sports',
    '高歌体育',
    NULL,
    'sports',
    'group',
    0,
    'active',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
  ),
  (
    'systemManagement',
    '系统管理',
    NULL,
    'systemManagement',
    'group',
    10,
    'active',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("routeName") DO NOTHING;

UPDATE "Menu" AS catalog
SET "parentId" = parent.id
FROM "Menu" AS parent
WHERE parent."routeName" = 'sports'
  AND catalog."routeName" IN ('sportsFootball', 'sportsContent')
  AND catalog."parentId" IS DISTINCT FROM parent.id;

UPDATE "Menu" AS catalog
SET "parentId" = parent.id
FROM "Menu" AS parent
WHERE parent."routeName" = 'systemManagement'
  AND catalog."routeName" IN ('system', 'wechat')
  AND catalog."parentId" IS DISTINCT FROM parent.id;
