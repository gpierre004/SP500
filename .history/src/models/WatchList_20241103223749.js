import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('WatchList', {
      dateAdded: {
          type: DataTypes.DATEONLY,
          allowNull: false
      },
      reason: DataTypes.TEXT,
      sector: DataTypes.STRING(100),
      industry: DataTypes.STRING(100),
      currentPrice: DataTypes.FLOAT,
      weekHigh52: DataTypes.FLOAT,
      percentBelow52WeekHigh: DataTypes.FLOAT,
      priceWhenAdded: DataTypes.FLOAT,
      avgClose: DataTypes.FLOAT,
      priceChange: DataTypes.FLOAT,
      metrics: DataTypes.JSONB
  });
};