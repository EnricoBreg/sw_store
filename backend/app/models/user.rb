class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :validatable, :jwt_authenticatable, jwt_revocation_strategy: self

  has_one :cart, dependent: :destroy
  has_many :addresses, dependent: :destroy
  has_many :orders, dependent: :destroy

  after_create_commit :create_cart

  validates :email, presence: true, uniqueness: true
  validates :date_of_birth, presence: true
  validate :user_must_be_adult, if: -> { date_of_birth.present? }

  private

  def create_cart
    Cart.create(user: self)
  end

  def user_must_be_adult
    Rails.logger.debug "Validation user age: #{date_of_birth} #{date_of_birth > 18.years.ago.to_date}"

    if date_of_birth.present? && date_of_birth > 18.years.ago.to_date
      errors.add :date_of_birth, "Devi avere almeno 18 anni per registrarti."
    end
  end
end
