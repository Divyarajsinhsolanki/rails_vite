module PostsHelper
  def people_you_may_know_meta(current_user, person)
    return "" if current_user.blank? || person.blank?

    segments = []

    shared_teams = person.respond_to?(:shared_teams_count) ? person.shared_teams_count.to_i : (current_user.team_ids & person.team_ids).size
    shared_projects = person.respond_to?(:shared_projects_count) ? person.shared_projects_count.to_i : (current_user.project_ids & person.project_ids).size
    mutual_followers = person.respond_to?(:mutual_followers_count) ? person.mutual_followers_count.to_i : (current_user.follower_ids & person.follower_ids).size

    segments << pluralize(shared_teams, 'shared team') if shared_teams.positive?
    segments << pluralize(shared_projects, 'shared project') if shared_projects.positive?
    segments << pluralize(mutual_followers, 'mutual connection') if mutual_followers.positive?

    return 'Suggested for you' if segments.blank?

    segments.to_sentence
  end

  def initials_for(user)
    name = user.full_name.to_s
    return '?' if name.blank?

    initials = name.split.map { _1.first }.join.first(2)
    initials.present? ? initials.upcase : '?'
  end
end
