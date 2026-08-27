UPDATE "Menu"
SET
  "icon" = CASE "routeName"
    WHEN 'player' THEN 'ri:user-star-line'
    WHEN 'team' THEN 'ri:team-line'
    WHEN 'matchRound' THEN 'ri:calendar-event-line'
    WHEN 'assetRecord' THEN 'ri:wallet-3-line'
    WHEN 'contentBanner' THEN 'ri:slideshow-3-line'
    WHEN 'contentRumorPost' THEN 'ri:message-3-line'
    WHEN 'systemUser' THEN 'ri:user-line'
    WHEN 'systemRole' THEN 'ri:shield-user-line'
    WHEN 'systemMenu' THEN 'ri:menu-line'
    WHEN 'systemAudit' THEN 'ri:file-search-line'
    WHEN 'wechatShare' THEN 'ri:share-line'
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "isBuiltIn" = true
  AND "icon" IS NULL
  AND "routeName" IN (
    'player',
    'team',
    'matchRound',
    'assetRecord',
    'contentBanner',
    'contentRumorPost',
    'systemUser',
    'systemRole',
    'systemMenu',
    'systemAudit',
    'wechatShare'
  );
