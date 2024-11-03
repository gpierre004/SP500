-- Create the database (run this command separately if not already created)
-- CREATE DATABASE sp500_analysis;

-- Connect to the database
-- \c sp500_analysis

-- Create Companies table
CREATE TABLE "Companies" (
  "ticker" VARCHAR(10) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "sector" VARCHAR(100),
  "industry" VARCHAR(100),
  "founded" VARCHAR(10),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create StockPrices table
CREATE TABLE "StockPrices" (
  "id" SERIAL PRIMARY KEY,
  "date" DATE NOT NULL,
  "open" FLOAT,
  "high" FLOAT,
  "low" FLOAT,
  "close" FLOAT,
  "volume" BIGINT,
  "adjustedClose" FLOAT,
  "CompanyTicker" VARCHAR(10) REFERENCES "Companies"("ticker"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create Users table
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(50) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create WatchList table
CREATE TABLE "WatchLists" (
  "id" SERIAL PRIMARY KEY,
  "dateAdded" DATE NOT NULL,
  "reason" TEXT,
  "metrics" JSONB,
  "CompanyTicker" VARCHAR(10) REFERENCES "Companies"("ticker"),
  "UserId" INTEGER REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE INDEX "idx_companies_sector" ON "Companies" ("sector");
CREATE INDEX "idx_companies_industry" ON "Companies" ("industry");
CREATE INDEX "idx_stockprices_date" ON "StockPrices" ("date");
CREATE INDEX "idx_stockprices_companyticker_date" ON "StockPrices" ("CompanyTicker", "date");
CREATE INDEX "idx_watchlists_dateadded" ON "WatchLists" ("dateAdded");
CREATE INDEX "idx_watchlists_companyticker" ON "WatchLists" ("CompanyTicker");
CREATE INDEX "idx_watchlists_userid" ON "WatchLists" ("UserId");