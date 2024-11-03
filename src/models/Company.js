import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('Company', {
    ticker: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sector: DataTypes.STRING,
    industry: DataTypes.STRING,
    founded: DataTypes.STRING
  }, {
    indexes: [
      { fields: ['sector'] },
      { fields: ['industry'] }
    ]
  });
};