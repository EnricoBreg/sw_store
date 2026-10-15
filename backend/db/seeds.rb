# Dati iniziali di SW Store: categorie, prodotti con immagine e utenti demo.
#
# Il seed è idempotente e NON distruttivo: crea solo i record mancanti (cercandoli per nome o email)
# e non modifica né cancella dati esistenti, quindi si può rieseguire in qualsiasi momento con
# `bin/rails db:seed` senza perdere ordini, carrelli o modifiche fatte dall'area admin.
# Le immagini dei prodotti sono in db/seeds/images e vengono allegate solo ai prodotti che non ne hanno una.

images_dir = Rails.root.join("db/seeds/images")

category_data = {
  "Elettronica" => "Dispositivi elettronici, audio e accessori.",
  "Videogiochi" => "Console, giochi e accessori per il gaming.",
  "Intrattenimento" => "Libri, film e musica.",
  "Casa" => "Piccoli elettrodomestici e accessori per la casa."
}.freeze

product_data = [
  { image: "cuffie-wireless", category: "Elettronica", name: "Cuffie wireless con cancellazione del rumore",
    description: "Cuffie over-ear Bluetooth con cancellazione attiva del rumore, 30 ore di autonomia e ricarica rapida USB-C.",
    price: 129.90, discount_percentage: 15, stock_quantity: 40 },
  { image: "smartwatch-gps", category: "Elettronica", name: "Smartwatch sportivo GPS",
    description: "Smartwatch con GPS integrato, cardiofrequenzimetro, oltre 100 modalità sport e resistenza all'acqua fino a 50 metri.",
    price: 199.00, discount_percentage: 10, stock_quantity: 25 },
  { image: "altoparlante-bluetooth", category: "Elettronica", name: "Altoparlante Bluetooth portatile",
    description: "Speaker compatto impermeabile IP67 con bassi potenziati e 12 ore di riproduzione continua.",
    price: 59.90, discount_percentage: 0, stock_quantity: 60 },
  { image: "power-bank", category: "Elettronica", name: "Power bank 20000 mAh",
    description: "Batteria esterna da 20000 mAh con due porte USB-A, una USB-C e ricarica rapida da 22,5 W.",
    price: 34.90, discount_percentage: 5, stock_quantity: 100 },
  { image: "console-portatile", category: "Videogiochi", name: "Console portatile OLED",
    description: "Console portatile con schermo OLED da 7 pollici, 64 GB di memoria e base per il collegamento alla TV.",
    price: 349.00, discount_percentage: 0, stock_quantity: 15 },
  { image: "controller-pro", category: "Videogiochi", name: "Controller wireless Pro",
    description: "Controller senza fili con grilletti adattivi, vibrazione HD e batteria ricaricabile da 40 ore.",
    price: 69.90, discount_percentage: 10, stock_quantity: 45 },
  { image: "avventura-fantasy", category: "Videogiochi", name: "Avventura fantasy - edizione standard",
    description: "Gioco di ruolo open world ambientato in un regno fantasy, con oltre 80 ore di storia principale.",
    price: 59.99, discount_percentage: 20, stock_quantity: 30 },
  { image: "romanzo-giallo", category: "Intrattenimento", name: "La notte di Milano - romanzo giallo",
    description: "Un commissario, una città avvolta dalla nebbia e un caso irrisolto da vent'anni. Edizione con copertina rigida.",
    price: 18.50, discount_percentage: 0, stock_quantity: 80 },
  { image: "trilogia-fantascienza", category: "Intrattenimento", name: "Trilogia di fantascienza - cofanetto Blu-ray",
    description: "Cofanetto con i tre film della saga restaurati in alta definizione e due ore di contenuti speciali.",
    price: 39.90, discount_percentage: 25, stock_quantity: 20 },
  { image: "vinile-jazz", category: "Intrattenimento", name: "Jazz italiano - raccolta in vinile",
    description: "Doppio LP da 180 grammi con i grandi classici del jazz italiano degli anni Cinquanta e Sessanta.",
    price: 29.90, discount_percentage: 0, stock_quantity: 35 },
  { image: "macchina-caffe", category: "Casa", name: "Macchina da caffè espresso",
    description: "Macchina per espresso con pompa da 15 bar, lancia vapore per il cappuccino e serbatoio da 1,2 litri.",
    price: 249.00, discount_percentage: 12, stock_quantity: 12 },
  { image: "lampada-led", category: "Casa", name: "Lampada da scrivania LED",
    description: "Lampada LED dimmerabile con tre temperature di colore, braccio orientabile e porta USB per la ricarica.",
    price: 44.90, discount_percentage: 0, stock_quantity: 50 }
].freeze

# Credenziali documentate in API.md (sezione "Dati demo").
user_data = [
  { email: "admin@swstore.com", password: "password123", first_name: "Admin", last_name: "Demo", admin: true },
  { email: "cliente@swstore.com", password: "password123", first_name: "Chiara", last_name: "Cliente",
    date_of_birth: Date.new(1992, 4, 18) },
  { email: "e2e.user@swstore.test", password: "E2eTest-2026!", first_name: "E2E", last_name: "Tester",
    date_of_birth: Date.new(1990, 5, 15) },
  { email: "e2e.logout@swstore.test", password: "E2eTest-2026!", first_name: "E2E", last_name: "Logout",
    date_of_birth: Date.new(1990, 5, 15) }
].freeze

categories = category_data.to_h do |name, description|
  [ name, Category.find_or_create_by!(name: name) { |category| category.description = description } ]
end
puts "Categorie: #{Category.count}"

product_data.each do |attributes|
  product = Product.find_or_create_by!(name: attributes[:name]) do |new_product|
    new_product.assign_attributes(attributes.except(:image, :category))
    new_product.category = categories.fetch(attributes[:category])
    new_product.active = true
  end

  next if product.image.attached?

  image_path = images_dir.join("#{attributes[:image]}.jpg")
  product.image.attach(io: File.open(image_path), filename: image_path.basename.to_s, content_type: "image/jpeg")
end
puts "Prodotti: #{Product.count}"

user_data.each do |attributes|
  User.find_or_create_by!(email: attributes[:email]) do |user|
    user.assign_attributes(attributes.except(:password))
    user.password = user.password_confirmation = attributes[:password]
  end
end
puts "Utenti: #{User.count}"
