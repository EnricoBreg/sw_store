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
  has_one :wishlist, dependent: :destroy
  has_many :addresses, dependent: :destroy
  has_many :orders, dependent: :destroy

  after_create_commit :create_cart
  after_create_commit :create_wishlist

  validates :email, presence: true, uniqueness: true
  # validates :date_of_birth, presence: true
  validate :user_must_be_adult, if: -> { date_of_birth.present? }

  # Restituisce l'utente associato all'account Google, nell'ordine:
  # 1. utente già collegato (provider + uid);
  # 2. utente registrato con la stessa email, che viene collegato all'account Google;
  # 3. nuovo utente.
  # auth.info.email è valorizzata solo se Google ha verificato l'email, quindi il collegamento
  # per email avviene solo per indirizzi di cui l'utente ha dimostrato il possesso.
  def self.from_omniauth(auth)
    # Senza uid la ricerca troverebbe gli utenti con uid nullo: si restituisce un utente non salvato.
    return new.tap { |user| user.errors.add(:uid, :blank) } if auth.uid.blank?

    user = find_by(provider: auth.provider, uid: auth.uid)
    user ||= find_by(email: auth.info.email.downcase) if auth.info.email.present?

    if user
      # update_columns: il collegamento non deve fallire per validazioni estranee (es. dati anagrafici incompleti).
      user.update_columns(provider: auth.provider, uid: auth.uid) unless user.provider == auth.provider && user.uid == auth.uid
      return user
    end

    create(
      provider: auth.provider,
      uid: auth.uid,
      email: auth.info.email,
      password: Devise.friendly_token[0, 20],
      first_name: auth.info.first_name,
      last_name: auth.info.last_name
    )
  end

  private

  def create_cart
    Cart.create(user: self)
  end

  def create_wishlist
    Wishlist.create(user: self)
  end

  def user_must_be_adult
    Rails.logger.debug "Validation user age: #{date_of_birth} #{date_of_birth > 18.years.ago.to_date}"

    if date_of_birth.present? && date_of_birth > 18.years.ago.to_date
      errors.add :date_of_birth, "Devi avere almeno 18 anni per registrarti."
    end
  end
end
