import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('WatchList', {
    dateAdded: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reason: DataTypes.STRING,
    sector: DataTypes.STRING(100),
    currentPrice: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    weekHigh52: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    percentBelow52WeekHigh: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    priceWhenAdded: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    avgClose: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    metrics: DataTypes.JSONB
    priceChange: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    indexes: [
      { fields: ['dateAdded'] },
      { fields: ['CompanyTicker'] },
      { fields: ['UserId'] }
    ]
  });
};