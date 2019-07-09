exports.up = (pgm) => {
  pgm.addColumns("users", { "fcm_token": { type: "varchar(255)", notNull: false }})
};