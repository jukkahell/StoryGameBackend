exports.up = (pgm) => {
  pgm.dropColumns("users", "language")
  pgm.addColumns("users", { "locale": { type: "varchar(20)", notNull: false }})
};
