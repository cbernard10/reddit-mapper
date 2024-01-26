import { DataTypes } from "sequelize";

const up = async ({ context: queryInterface }: { context: any }) => {
  await queryInterface.createTable("user_subreddits", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    subreddit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "subreddits", key: "id" },
    },
  });
};

const down = async ({ context: queryInterface }: { context: any }) => {
  await queryInterface.dropTable("user_subreddits");
};

export { up, down };
