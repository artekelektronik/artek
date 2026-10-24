-- Confirmed movements and their documents are never edited or deleted; a mistake is reversed
-- with a new movement. The database refuses UPDATE and DELETE so no code path can bypass this.
CREATE FUNCTION refuse_ledger_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Stok hareketleri değiştirilemez veya silinemez; ters kayıt kullanın.'
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER stock_movement_immutable BEFORE UPDATE OR DELETE ON stock_movement
  FOR EACH ROW EXECUTE FUNCTION refuse_ledger_change();
--> statement-breakpoint
CREATE TRIGGER stock_document_immutable BEFORE UPDATE OR DELETE ON stock_document
  FOR EACH ROW EXECUTE FUNCTION refuse_ledger_change();
--> statement-breakpoint
ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_reverses_id_fk
  FOREIGN KEY (reverses_id) REFERENCES stock_movement(id);
