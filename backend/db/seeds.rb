# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

require "faker"

puts "Pulizia del database in corso..."
User.destroy_all
Category.destroy_all
Product.destroy_all


puts "Creazione utenti base..."

User.create(
  first_name: "Admin",
  last_name: "User",
  email: "admin@swstore.com",
  password: "password123",
  password_confirmation: "password123",
  admin: true
)
25.times do
  User.create!(
    first_name: Faker::Name.first_name,
    last_name: Faker::Name.last_name,
    email: Faker::Internet.unique.email,
    password: "password123",
    password_confirmation: "password123",
    date_of_birth: Faker::Date.birthday(min_age: 18, max_age: 55),
    number: Faker::PhoneNumber.cell_phone_in_e164,
    admin: false
  )
end

puts "Creazione di #{User.count} utenti completata!"

puts "Creazione categorie di esempio..."
categories = []
categories.push(Category.create(name: "Elettronica"))
categories.push(Category.create(name: "Videogiochi"))
categories.push(Category.create(name: "Intrattenimento"))

puts "Creazione di #{Category.count} categorie completata!"

puts "Creazione prodotti di esempio..."

50.times do
  Product.create!(
    name: Faker::Commerce.product_name,
    description: Faker::Lorem.paragraph(sentence_count: 5),
    price: Faker::Commerce.price(range: 10..1000),
    discount_percentage: rand(0..50),
    category: categories.sample,
    stock_quantity: rand(0..100),
    active: [ true, false ].sample
  )
end

puts "Creazione di #{Product.count} prodotti completata!"

puts "Database pulito e popolato con dati di esempio."
