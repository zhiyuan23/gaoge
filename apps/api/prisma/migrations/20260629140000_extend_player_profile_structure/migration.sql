-- Extend player profile structure while preserving legacy subTeam / position fields.
ALTER TABLE "Player"
  ADD COLUMN "primaryTeamId" INTEGER,
  ADD COLUMN "positions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "primaryPosition" TEXT,
  ADD COLUMN "signature" TEXT;

CREATE TABLE "PlayerTeam" (
  "playerId" INTEGER NOT NULL,
  "teamId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlayerTeam_pkey" PRIMARY KEY ("playerId", "teamId")
);

CREATE INDEX "Player_primaryTeamId_idx" ON "Player"("primaryTeamId");
CREATE INDEX "Player_primaryPosition_idx" ON "Player"("primaryPosition");
CREATE INDEX "PlayerTeam_teamId_idx" ON "PlayerTeam"("teamId");

ALTER TABLE "Player"
  ADD CONSTRAINT "Player_primaryTeamId_fkey"
  FOREIGN KEY ("primaryTeamId") REFERENCES "Team"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlayerTeam"
  ADD CONSTRAINT "PlayerTeam_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "Player"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlayerTeam"
  ADD CONSTRAINT "PlayerTeam_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Player"
  ADD CONSTRAINT "Player_signature_length_check"
  CHECK ("signature" IS NULL OR char_length("signature") <= 15);

WITH split_player_team AS (
  SELECT
    p."id" AS "playerId",
    trim(value) AS "teamName"
  FROM "Player" p
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(p."subTeam", ''), '[,，/、]+') AS value
  WHERE trim(value) <> ''
)
INSERT INTO "PlayerTeam" ("playerId", "teamId")
SELECT DISTINCT split_player_team."playerId", t."id"
FROM split_player_team
JOIN "Team" t ON t."name" = split_player_team."teamName"
ON CONFLICT DO NOTHING;

WITH matched_team_count AS (
  SELECT
    "playerId",
    COUNT(*) AS team_count,
    MIN("teamId") AS team_id
  FROM "PlayerTeam"
  GROUP BY "playerId"
)
UPDATE "Player" p
SET "primaryTeamId" = matched_team_count.team_id
FROM matched_team_count
WHERE p."id" = matched_team_count."playerId"
  AND matched_team_count.team_count = 1;

WITH position_map(label, code) AS (
  VALUES
    ('门将', 'goalkeeper'),
    ('守门员', 'goalkeeper'),
    ('goalkeeper', 'goalkeeper'),
    ('中后卫', 'center_back'),
    ('后卫', 'center_back'),
    ('center_back', 'center_back'),
    ('左后卫', 'left_back'),
    ('left_back', 'left_back'),
    ('右后卫', 'right_back'),
    ('right_back', 'right_back'),
    ('后腰', 'defensive_midfielder'),
    ('defensive_midfielder', 'defensive_midfielder'),
    ('中前卫', 'central_midfielder'),
    ('中场', 'central_midfielder'),
    ('midfielder', 'central_midfielder'),
    ('central_midfielder', 'central_midfielder'),
    ('前腰', 'attacking_midfielder'),
    ('attacking_midfielder', 'attacking_midfielder'),
    ('左边锋', 'left_winger'),
    ('left_winger', 'left_winger'),
    ('右边锋', 'right_winger'),
    ('right_winger', 'right_winger'),
    ('中锋', 'striker'),
    ('striker', 'striker'),
    ('前锋', 'forward'),
    ('forward', 'forward')
),
split_player_position AS (
  SELECT
    p."id" AS "playerId",
    trim(value) AS label
  FROM "Player" p
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(p."position", ''), '[,，/、]+') AS value
  WHERE trim(value) <> ''
),
matched_position AS (
  SELECT DISTINCT
    split_player_position."playerId",
    position_map.code
  FROM split_player_position
  JOIN position_map ON position_map.label = split_player_position.label
),
aggregated_position AS (
  SELECT
    "playerId",
    array_agg(code ORDER BY code) AS codes,
    COUNT(*) AS position_count,
    MIN(code) AS primary_code
  FROM matched_position
  GROUP BY "playerId"
)
UPDATE "Player" p
SET
  "positions" = aggregated_position.codes,
  "primaryPosition" = CASE
    WHEN aggregated_position.position_count = 1 THEN aggregated_position.primary_code
    ELSE NULL
  END
FROM aggregated_position
WHERE p."id" = aggregated_position."playerId";
