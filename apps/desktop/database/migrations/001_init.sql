create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at text not null default current_timestamp
);
