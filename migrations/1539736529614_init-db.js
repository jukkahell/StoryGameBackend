exports.up = (pgm) => {
  pgm.createTable(
    "users", {
      id: { type: "UUID", notNull: true, primaryKey: true },
      username: { type: "varchar(255)", notNull: true, unique: true },
      password: { type: "varchar(255)", notNull: true },
      language: { type: "varchar(2)", notNull: false }
    }
  );

  pgm.createTable(
    "games", {
      id: { type: "UUID", notNull: true, primaryKey: true },
      title: { type: "varchar(255)", notNull: true },
      owner: { type: "UUID", notNull: true },
      settings: { type: "json", notNull: true },
      started: { type: "boolean", notNull: true, default: false },
      created: {
        type: "timestamp",
        notNull: true,
        default: pgm.func("current_timestamp")
      }
    }
  );

  pgm.createTable(
    "user_games", {
      game_id: { type: "UUID", notNull: true, references: "games", onDelete: "cascade", primaryKey: true },
      user_id: { type: "UUID", notNull: true, references: "users", onDelete: "cascade", primaryKey: true },
      position: { type: "serial", notNull: false },
    }
  );

  pgm.createTable(
    "stories", {
      id: { type: "serial", notNull: true, primaryKey: true },
      game: { type: "UUID", notNull: true, references: "games", onDelete: "cascade", primaryKey: true },
      author: { type: "UUID", notNull: true, references: "users", onDelete: "cascade", primaryKey: true },
      text: { type: "text", notNull: true },
      created: {
        type: "timestamp",
        notNull: true,
        default: pgm.func("current_timestamp")
      }
    }
  );
};