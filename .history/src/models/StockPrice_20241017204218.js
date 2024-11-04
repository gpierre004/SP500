import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('StockPrice', {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    open: DataTypes.FLOAT,
    high: DataTypes.FLOAT,
    low: DataTypes.FLOAT,
    close: DataTypes.FLOAT,
    volume: DataTypes.BIGINT,
    adjustedClose: DataTypes.FLOAT
  }, {
    indexes: [
      { fields: ['date'] },
      { fields: ['CompanyTicker', 'date'] }
    ]
  });
};