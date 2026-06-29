DELETE FROM "Menu"
WHERE "routeName" IN (
  'basketballPlayer',
  'basketballTeam',
  'basketballMatchRound',
  'basketballAssetRecord'
);

DELETE FROM "Menu"
WHERE "routeName" = 'basketball';

DELETE FROM "Permission"
WHERE "code" LIKE 'basketball.%';

DROP TABLE IF EXISTS "BasketballMatchRoundResult";
DROP TABLE IF EXISTS "BasketballMatchRound";
DROP TABLE IF EXISTS "BasketballTeam";
DROP TABLE IF EXISTS "BasketballAssetRecord";
DROP TABLE IF EXISTS "BasketballTeamFund";
DROP TABLE IF EXISTS "BasketballPlayer";
