require "test_helper"

class UserTest < ActiveSupport::TestCase
  def google_auth(uid:, email:)
    OmniAuth::AuthHash.new(
      provider: "google_oauth2",
      uid: uid,
      info: { email: email, first_name: "Giulia", last_name: "Google" }
    )
  end

  test "from_omniauth creates a new user linked to the Google account" do
    user = nil
    assert_difference -> { User.count }, 1 do
      user = User.from_omniauth(google_auth(uid: "g-123", email: "new.google@test.swstore"))
    end

    assert user.persisted?
    assert_equal [ "google_oauth2", "g-123" ], [ user.provider, user.uid ]
    assert_equal "Giulia", user.first_name
  end

  test "from_omniauth returns the user already linked to the same uid" do
    linked = users(:other_customer)
    linked.update_columns(provider: "google_oauth2", uid: "g-other")

    assert_no_difference -> { User.count } do
      assert_equal linked, User.from_omniauth(google_auth(uid: "g-other", email: "changed@test.swstore"))
    end
  end

  test "from_omniauth links an existing user registered with the same email" do
    customer = users(:customer)

    assert_no_difference -> { User.count } do
      assert_equal customer, User.from_omniauth(google_auth(uid: "g-customer", email: "Customer@test.swstore"))
    end
    assert_equal [ "google_oauth2", "g-customer" ], [ customer.reload.provider, customer.uid ]
  end

  test "from_omniauth never reuses a Google user with a nil uid for a different account" do
    legacy = users(:other_customer)
    legacy.update_columns(provider: "google_oauth2", uid: nil)

    user = User.from_omniauth(google_auth(uid: "g-someone-else", email: "someone.else@test.swstore"))

    assert_not_equal legacy, user
    assert_equal "someone.else@test.swstore", user.email
  end

  test "from_omniauth refuses an authentication hash without uid" do
    user = User.from_omniauth(google_auth(uid: nil, email: "customer@test.swstore"))

    assert_not user.persisted?
    assert user.errors.of_kind?(:uid, :blank)
  end

  test "from_omniauth does not link by email when Google has not verified it" do
    assert_no_difference -> { User.count } do
      user = User.from_omniauth(google_auth(uid: "g-unverified", email: nil))
      assert_not user.persisted?
    end
    assert_nil users(:customer).reload.uid
  end
end
