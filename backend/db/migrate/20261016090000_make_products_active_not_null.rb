class MakeProductsActiveNotNull < ActiveRecord::Migration[8.1]
  def change
    change_column_default :products, :active, from: nil, to: true
    # Il quarto argomento porta a TRUE i valori NULL prima di applicare il NOT NULL
    # (TRUE coincide con il nuovo default e con il comportamento precedente: quei prodotti erano già visibili).
    # Limite del rollback: annulla solo lo schema (NOT NULL e default); non può sapere quali righe
    # erano NULL, quindi quei valori restano TRUE.
    change_column_null :products, :active, false, true
  end
end
