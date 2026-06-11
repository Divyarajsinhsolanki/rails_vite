project_id = ENV["FIREBASE_PROJECT_ID"].presence

if project_id
  FirebaseIdToken.configure do |config|
    config.project_ids = [project_id]
    config.redis = nil
  end
end
