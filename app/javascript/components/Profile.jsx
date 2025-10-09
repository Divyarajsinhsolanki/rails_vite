import React, { useEffect, useState, useRef } from "react";
import ProfileStats from "./ProfileStats";
import SkillChips from "./SkillChips";

/**
 * Enhanced Profile component
 * - Uses the existing /api/view_profile endpoint shape (user, teams, projects)
 * - Adds improved visuals, edit mode, upload previews and responsive layout
 */
const Profile = () => {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/view_profile");
        const data = await res.json();
        setUser(data.user || {});
        setTeams(data.teams || []);
        setProjects(data.projects || []);
        setForm({
          first_name: data.user?.first_name || "",
          last_name: data.user?.last_name || "",
          job_title: data.user?.job_title || "",
          profile_picture: data.user?.profile_picture || null,
          cover_photo: data.user?.cover_photo || null,
          skills: data.user?.skills || []
        });
      } catch (e) {
        console.error("Failed to load profile", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFile = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, [field]: ev.target.result, [`_file_${field}`]: file }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    // Construct FormData similar to other pages
    const payload = new FormData();
    payload.append("auth[first_name]", form.first_name);
    payload.append("auth[last_name]", form.last_name);
    payload.append("auth[job_title]", form.job_title || "");
    if (form._file_profile_picture) payload.append("auth[profile_picture]", form._file_profile_picture);
    if (form._file_cover_photo) payload.append("auth[cover_photo]", form._file_cover_photo);

    try {
      const res = await fetch("/api/update_profile", { method: "POST", body: payload });
      if (!res.ok) throw new Error("Update failed");
      const json = await res.json();
      // after save, refresh the profile view; backend returns success message in the repo pattern
      // we just reload profile for simplicity:
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Unable to save profile. See console for details.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading your profile...</div>
      </div>
    );
  }

  // Fallbacks for images
  const coverSrc = form.cover_photo || user.cover_photo || "";
  const avatarSrc = form.profile_picture || user.profile_picture || `https://placehold.co/160x160/EEF2FF/1E3A8A?text=${(user.first_name || "U").charAt(0).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--theme-color-light)] to-white p-4 md:p-8">
      {/* Particles / subtle background (if you keep existing particle layers) */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-60">
        {/* keep your existing particle layer here if desired */}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header / Cover */}
        <div className="rounded-2xl shadow-lg overflow-hidden bg-white/70 backdrop-blur-md border border-white/40">
          <div className="relative h-52 md:h-64 bg-gradient-to-r from-[var(--theme-color)]/40 to-transparent">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover transform-gpu transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {/* Cover actions */}
            <div className="absolute right-4 bottom-4 flex items-center gap-2">
              {editMode ? (
                <>
                  <label className="bg-white/90 p-2 rounded-full shadow hover:scale-105 transition-transform cursor-pointer">
                    <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e)=>handleFile(e, "cover_photo")} />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--theme-color)]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 13V7a1 1 0 011-1h3V4H7a3 3 0 00-3 3v6a1 1 0 001 1h3v-2H5z" />
                      <path d="M9 7h2v3h3v2h-5V7z" />
                    </svg>
                  </label>
                  <button onClick={() => { setForm((p)=>({ ...p, cover_photo: null, _file_cover_photo: null })); }} className="bg-white/90 p-2 rounded-full shadow hover:bg-red-50 transition-colors" title="Remove cover">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H3v2h14V4h-2V3a1 1 0 00-1-1H6zM5 8v8a2 2 0 002 2h6a2 2 0 002-2V8H5z"/></svg>
                  </button>
                </>
              ) : null}
            </div>
            {/* Decorative overlay bottom-left for name/avatar */}
            <div className="absolute left-6 bottom-0 transform translate-y-1/2">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="relative -mt-12">
                  <div className="rounded-full p-1 bg-gradient-to-br from-[var(--theme-color)] to-indigo-400 shadow-lg">
                    <div className="rounded-full overflow-hidden bg-white">
                      <img src={avatarSrc} alt="avatar" className="w-32 h-32 object-cover rounded-full border-4 border-white" />
                    </div>
                  </div>

                  {editMode && (
                    <label className="absolute right-0 bottom-0 -translate-y-1/4 translate-x-1/4 bg-white p-1 rounded-full shadow cursor-pointer">
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e)=>handleFile(e, "profile_picture")} />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--theme-color)]" viewBox="0 0 20 20" fill="currentColor"><path d="M4 13V7a1 1 0 011-1h3V4H7a3 3 0 00-3 3v6a1 1 0 001 1h3v-2H5z" /></svg>
                    </label>
                  )}
                </div>

                {/* Name and meta */}
                <div className="text-white ml-2 flex flex-col justify-end drop-shadow-lg">
                  {!editMode ? (
                    <>
                      <h1 className="text-2xl md:text-3xl font-bold">{user.first_name} {user.last_name}</h1>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{user.job_title || "—"}</span>
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{user.availability_label}</span>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/90 p-3 rounded-lg text-gray-800">
                      <input name="first_name" value={form.first_name} onChange={handleChange} className="w-full mb-2 px-3 py-2 rounded-md border" />
                      <input name="last_name" value={form.last_name} onChange={handleChange} className="w-full mb-2 px-3 py-2 rounded-md border" />
                      <input name="job_title" value={form.job_title || ""} onChange={handleChange} className="w-full px-3 py-2 rounded-md border" placeholder="Job title" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Body: left column profile + skills, right column activity/projects */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">About</div>
                    <div className="mt-2 text-gray-700">{user.bio || "No bio yet — add a short description about yourself."}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!editMode ? (
                      <button onClick={() => setEditMode(true)} className="px-3 py-1 rounded-full bg-[var(--theme-color)] text-white shadow-sm hover:opacity-95">Edit</button>
                    ) : (
                      <>
                        <button onClick={handleSave} className="px-3 py-1 rounded-full bg-green-500 text-white shadow-sm">Save</button>
                        <button onClick={() => setEditMode(false)} className="px-3 py-1 rounded-full bg-gray-200">Cancel</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <ProfileStats
                    stats={{
                      projects: projects.length,
                      teams: teams.length,
                      posts: user.posts_count || 0
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Skills</h3>
                  <div className="text-xs text-gray-500">{(user.user_skills || []).length} skills</div>
                </div>

                <div>
                  <SkillChips skills={user.user_skills || []} editable={editMode} onChange={(s)=>setForm((p)=>({ ...p, skills: s }))} />
                </div>
              </div>

              {/* Contact/Quick actions */}
              <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">Quick actions</h4>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow">Message</button>
                  <button className="w-full px-3 py-2 rounded-lg border hover:bg-gray-50">Connect</button>
                </div>
              </div>
            </div>

            {/* Right column: projects, teams and activity */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800">Projects</h3>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projects.slice(0,6).map((p) => (
                    <div key={p.id} className="p-3 rounded-lg border hover:shadow transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-sm text-gray-500">{p.description || "No description"}</div>
                        </div>
                        <div className="text-xs text-gray-400">{p.role}</div>
                      </div>
                    </div>
                  ))}

                  {projects.length === 0 && <div className="text-gray-500">No projects yet.</div>}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800">Teams</h3>
                <div className="mt-3 space-y-3">
                  {teams.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-md border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--theme-color)]/20 flex items-center justify-center text-[var(--theme-color)] font-bold">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.role}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">{t.status}</div>
                    </div>
                  ))}
                  {teams.length === 0 && <div className="text-gray-500">No teams yet.</div>}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent activity</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  {/* Keep it simple for now — you can plug the post feed component if you have one */}
                  <div className="p-3 border rounded-md">No recent activity to show.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> {/* max-w container */}
    </div>
  );
};

export default Profile;