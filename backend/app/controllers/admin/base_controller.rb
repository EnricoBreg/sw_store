class Admin::BaseController < ApplicationController
  # Con questa chiamata, verranno chiamati in sequenza i before_action definiti in 
  # ApplicationController e poi, eventualmente, quelli definiti in questo controller.
  admin_access_only
end
