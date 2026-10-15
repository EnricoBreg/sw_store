require "tsort"

# Caricamento delle fixture senza privilegi di superuser su PostgreSQL.
#
# Rails carica le fixture in ordine alfabetico e, per evitare violazioni di chiave esterna,
# prova a disabilitare i trigger di integrità referenziale (ALTER TABLE ... DISABLE TRIGGER ALL).
# Quei trigger sono di sistema e solo un superuser può disabilitarli: con il ruolo del
# database di test l'operazione fallisce e, per esempio, "carts" viene inserita prima di "users".
#
# Qui le tabelle vengono ordinate in base alle chiavi esterne: gli INSERT partono dalle
# tabelle referenziate (genitori) e i DELETE dalle tabelle che le referenziano (figli).
# Con un ruolo superuser il comportamento resta identico.
module FixtureLoadOrder
  def insert_fixtures_set(fixture_set, tables_to_delete = [])
    parents_first = fixture_tables_in_dependency_order(fixture_set.keys | tables_to_delete)

    super(
      fixture_set.sort_by { |table, _rows| parents_first.index(table) }.to_h,
      parents_first.reverse & tables_to_delete
    )
  end

  private

  def fixture_tables_in_dependency_order(tables)
    parents = tables.index_with { |table| foreign_keys(table).map(&:to_table) & tables }
    TSort.tsort(parents.method(:each_key), ->(table, &block) { parents.fetch(table).each(&block) })
  end
end

ActiveSupport.on_load(:active_record_postgresqladapter) { prepend FixtureLoadOrder }

# Anche la verifica delle chiavi esterne dopo il caricamento (UPDATE su pg_constraint) richiede
# un superuser. Non serve: i trigger restano attivi, quindi ogni INSERT è già controllato da PostgreSQL.
ActiveRecord.verify_foreign_keys_for_fixtures = false
