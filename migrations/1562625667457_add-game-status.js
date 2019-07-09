exports.up = (pgm) => {
  pgm.dropColumns("games", "started")
  pgm.addColumns("games", { "status": { type: "varchar(50)", notNull: true, default: "created" }})
};
