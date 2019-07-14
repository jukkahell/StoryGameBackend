exports.up = (pgm) => {
  pgm.sql(`UPDATE games SET settings = jsonb_set(settings::jsonb, '{privacy}', '"private"', true)`)
  pgm.sql("UPDATE games SET settings = settings::jsonb - 'public'");
};