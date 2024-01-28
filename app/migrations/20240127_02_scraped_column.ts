import { DataTypes } from "sequelize";

const up = async ({ context: queryInterface }: { context: any }) => {
  await queryInterface.addColumn("subreddits", "scraped", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  });
};

const down = async ({ context: queryInterface }: { context: any }) => {
  await queryInterface.removeColumn("subreddits", "scraped");
};

export { up, down };
