CREATE TABLE "exchange_rate" (
	"date" date PRIMARY KEY NOT NULL,
	"usd" numeric(12, 4) NOT NULL,
	"eur" numeric(12, 4) NOT NULL,
	"bulletin_on" date NOT NULL
);
