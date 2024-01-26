import { Model, DataTypes } from 'sequelize'

import { sequelize } from '../util/db.js'

class UserSubreddit extends Model {}

UserSubreddit.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  subredditId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'subreddits', key: 'id' },
  },
}, {
  sequelize,
  underscored: true,
  timestamps: false,
  modelName: 'user_subreddit'
})

export default UserSubreddit