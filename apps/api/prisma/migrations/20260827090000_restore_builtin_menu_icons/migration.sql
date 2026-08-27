UPDATE "Menu"
SET
  "icon" = CASE "routeName"
    WHEN 'sports' THEN 'solar:cup-star-outline'
    WHEN 'systemManagement' THEN 'ri:settings-3-line'
    WHEN 'sportsContent' THEN 'ri:article-line'
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "isBuiltIn" = true
  AND "icon" IS NULL
  AND "routeName" IN ('sports', 'systemManagement', 'sportsContent');
