FirebaseIdToken.configure do |config|
  project_id = ENV.fetch('FIREBASE_PROJECT_ID')
  config.project_ids = [project_id]
  config.redis = nil
end
