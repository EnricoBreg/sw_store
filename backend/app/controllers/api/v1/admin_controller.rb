class Api::V1::AdminController < Api::V1::AuthenticatedController
  admin_access_only
end
