class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :validatable,
         :jwt_authenticatable,
         :omniauthable,
         jwt_revocation_strategy: self,
         omniauth_providers: [ :google_oauth2 ]

  has_one :cart, dependent: :destroy
  has_many :addresses, dependent: :destroy
  has_many :orders, dependent: :destroy

  after_create_commit :create_cart

  validates :email, presence: true, uniqueness: true
  validates :date_of_birth, presence: true
  validate :user_must_be_adult, if: -> { date_of_birth.present? }

  def self.from_ominauth(auth)
    where(provider: auth.provider, uid: auth.id).first_or_create do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0, 20]

      Rails.logger.info "Creating user from omniauth: #{auth.info.inspect}"

      user.first_name = auth.info.first_name
      user.last_name = auth.info.last_name
      user.date_of_birth = auth.info.birthdate
    end
  end

  # Generazione di un token compatibile con devise-jwt + JTIMatcher
  def generate_twt
    self.jti = SecureRandom.uuid
    save!

    JWT.encode(
      {
        sub: id,
        jti: jti,
        scp: "user",
        exp: (Time.now + 1.days).to_i,
        iat: Time.now.to_i
      },
      Rails.application.credentials.devise_jwt_secret_key,
      "HS256"
    )
  end

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
