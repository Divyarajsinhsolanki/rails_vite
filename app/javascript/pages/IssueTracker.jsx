import React, { useEffect, useMemo, useState } from "react";
import { SchedulerAPI, getIssues, createIssue, updateIssue, deleteIssue } from "../components/api";
import { Toaster, toast } from "react-hot-toast";
import { SparklesIcon, ClipboardDocumentListIcon, LinkIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";

const DEFAULT_STATUSES = ["New", "In Progress", "Blocked", "Resolved"];
const DEFAULT_SEVERITIES = ["Low", "Medium", "High", "Critical"];

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-10 text-center">
    <SparklesIcon className="h-10 w-10 text-[var(--theme-color)]" />
    <h3 className="mt-3 text-xl font-semibold text-slate-900">No issues logged yet</h3>
    <p className="mt-2 max-w-md text-sm text-slate-500">
      Capture issues with repro steps, expected vs actual, and optionally link them to a task.
    </p>
    <button
      onClick={onAdd}
      className="mt-6 rounded-xl bg-[var(--theme-color)] px-5 py-2 text-white font-semibold shadow hover:brightness-110"
    >
      Add first issue
    </button>
  </div>
);

const pickFirstAttachment = (issue) => {
  const media = Array.isArray(issue.media_files) ? issue.media_files : Array.isArray(issue.media_urls) ? issue.media_urls : [];
  const attachments = Array.isArray(issue.attachment_urls) ? issue.attachment_urls : [];
  if (media.length) return { url: media[0], type: "media" };
  if (attachments.length) return { url: attachments[0], type: "link" };
  if (issue.attachment) return { url: issue.attachment, type: "link" };
  return null;
};

const IssueCard = ({ issue, onEdit, onDelete }) => {
  const badgeClass = {
    New: "bg-blue-50 text-blue-700",
    "In Progress": "bg-amber-50 text-amber-700",
    Blocked: "bg-rose-50 text-rose-700",
    Resolved: "bg-emerald-50 text-emerald-700",
  }[issue.status] || "bg-slate-100 text-slate-700";

  const sevClass = {
    Low: "bg-slate-100 text-slate-700",
    Medium: "bg-amber-100 text-amber-700",
    High: "bg-orange-100 text-orange-700",
    Critical: "bg-rose-100 text-rose-700",
  }[issue.severity] || "bg-slate-100 text-slate-700";

  const cardTone = {
    New: "bg-blue-50/60 border-blue-100",
    "In Progress": "bg-amber-50/60 border-amber-100",
    Blocked: "bg-rose-50/60 border-rose-100",
    Resolved: "bg-emerald-50/60 border-emerald-100",
  }[issue.status] || "bg-white border-slate-200";

  const isVideo = (url) => /\.(mp4|webm|ogg)$/i.test(url || "");
  const isImage = (url) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url || "");
  const primaryAttachment = pickFirstAttachment(issue);

  return (
    <div className={`rounded-2xl border ${cardTone} p-5 shadow-sm hover:shadow-md transition`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Issue ID</p>
          <p className="text-lg font-semibold text-slate-900">
            #{issue.id || issue.issueKey || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>{issue.status}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sevClass}`}>{issue.severity}</span>
        </div>
      </div>
      <p className="mt-2 text-base font-semibold text-slate-900">{issue.title}</p>
      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{issue.issue_description || "No description provided."}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="text-xs text-slate-500">
          Found by <span className="font-semibold text-slate-800">{issue.found_by || "—"}</span>{" "}
          on <span className="font-semibold text-slate-800">{issue.found_on || "—"}</span>
        </div>
        <div className="text-xs text-slate-500">
          Related task:{" "}
          {issue.task_id ? (
            <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
              <LinkIcon className="h-4 w-4" /> {issue.task_id}
            </span>
          ) : (
            "None"
          )}
        </div>
      </div>
      {primaryAttachment && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {isVideo(primaryAttachment.url) ? (
            <video src={primaryAttachment.url} controls className="h-48 w-full object-cover bg-black" />
          ) : isImage(primaryAttachment.url) ? (
            <img src={primaryAttachment.url} alt="Issue attachment" className="h-48 w-full object-cover" />
          ) : (
            <a
              href={primaryAttachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-sm font-medium text-[var(--theme-color)]"
            >
              View attachment
            </a>
          )}
        </div>
      )}
      <button
        onClick={() => onEdit(issue)}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-white"
      >
        <ClipboardDocumentListIcon className="h-4 w-4" /> Edit / update
      </button>
      {onDelete && (
        <button
          onClick={() => onDelete(issue)}
          className="ml-2 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:border-rose-300 hover:bg-white"
        >
          Delete
        </button>
      )}
    </div>
  );
};

const IssueForm = ({ tasks, sprints, initial, onSave, onCancel }) => {
  const [payload, setPayload] = useState(
    initial || {
      issueKey: `ISS-${Math.floor(Math.random() * 90000 + 10000)}`,
      title: "",
      status: "New",
      severity: "Medium",
      category: "",
      module_name: "",
      sub_module: "",
      sprint_name: "",
      task_id: "",
      found_by: "",
      found_on: "",
      issue_description: "",
      pre_conditions: "",
      repro_steps: "",
      actual_result: "",
      expected_result: "",
      comment: "",
      attachment: "",
      media_urls: [],
      attachment_urls: [],
      mediaFiles: null,
      attachment_urls_text: "",
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (e) => {
    setPayload((prev) => ({ ...prev, mediaFiles: e.target.files }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!payload.title) return toast.error("Title is required");
    const media_urls = Array.isArray(payload.media_urls) ? payload.media_urls : [];
    const attachment_urls = Array.isArray(payload.attachment_urls) ? payload.attachment_urls : [];
    onSave({ ...payload, media_urls, attachment_urls });
  };

  useEffect(() => {
    if (initial) {
      setPayload((prev) => ({
        ...prev,
        attachment_urls_text: Array.isArray(initial.attachment_urls) ? initial.attachment_urls.join(', ') : '',
      }));
    }
  }, [initial]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700 required-label">Title *</label>
          <input
            name="title"
            value={payload.title}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
            placeholder="Summarize the issue"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
          <label className="text-sm font-medium text-slate-700 required-label">Status</label>
            <select
              name="status"
              value={payload.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
            >
              {DEFAULT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
          <label className="text-sm font-medium text-slate-700 required-label">Severity</label>
            <select
              name="severity"
              value={payload.severity}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
            >
              {DEFAULT_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Category</label>
          <input
            name="category"
            value={payload.category}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Module</label>
          <input
            name="module_name"
            value={payload.module_name}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Sub Module</label>
          <input
            name="sub_module"
            value={payload.sub_module}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Sprint</label>
          <select
            name="sprint_name"
            value={payload.sprint_name}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30 bg-white"
          >
            <option value="">Unassigned</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Related Task</label>
          <select
            name="task_id"
            value={payload.task_id}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          >
            <option value="">Unlinked issue</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.task_id || t.id}>
                {t.task_id || t.id} — {t.title || "Task"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Found By</label>
          <input
            name="found_by"
            value={payload.found_by}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Found On</label>
          <input
            type="date"
            name="found_on"
            value={payload.found_on}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Upload media (images/videos, multiple)</label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFilesChange}
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
          <p className="mt-1 text-xs text-slate-500">You can attach multiple images or videos.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Attachment links (optional, comma separated)</label>
          <textarea
            name="attachment_urls"
            value={payload.attachment_urls_text || (Array.isArray(payload.attachment_urls) ? payload.attachment_urls.join(', ') : '')}
            onChange={(e) => {
              const arr = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
              setPayload(prev => ({ ...prev, attachment_urls: arr, attachment_urls_text: e.target.value }));
            }}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Issue Description</label>
          <textarea
            name="issue_description"
            value={payload.issue_description}
            onChange={handleChange}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Pre-conditions</label>
          <textarea
            name="pre_conditions"
            value={payload.pre_conditions}
            onChange={handleChange}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Repro Steps</label>
          <textarea
            name="repro_steps"
            value={payload.repro_steps}
            onChange={handleChange}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Actual Result</label>
          <textarea
            name="actual_result"
            value={payload.actual_result}
            onChange={handleChange}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Expected Result</label>
          <textarea
            name="expected_result"
            value={payload.expected_result}
            onChange={handleChange}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Comment</label>
          <textarea
            name="comment"
            value={payload.comment}
            onChange={handleChange}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
          />
        </div>
        <div className="flex items-end justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
          >
            Save issue
          </button>
        </div>
      </div>
    </form>
  );
};

const IssueTracker = ({ projectId, sprint, standalone = false }) => {
  const [issues, setIssues] = useState([]);
  const [editing, setEditing] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sprintFilter, setSprintFilter] = useState("all");
  const [foundByFilter, setFoundByFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const uniqueValues = useMemo(() => {
    const foundBy = new Set();
    const modules = new Set();
    issues.forEach((i) => {
      if (i.found_by) foundBy.add(i.found_by);
      if (i.module_name) modules.add(i.module_name);
    });
    return {
      foundBy: Array.from(foundBy),
      modules: Array.from(modules),
    };
  }, [issues]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getIssues(projectId)
      .then((res) => setIssues(Array.isArray(res.data) ? res.data : []))
      .catch(() => setIssues([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const params = { project_id: projectId };
    SchedulerAPI.getTasks(params)
      .then((res) => setTasks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTasks([]));

    SchedulerAPI.getSprints(projectId)
      .then((res) => setSprints(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSprints([]));
  }, [projectId]);

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      const statusOk = filter === "all" || i.status === filter;
      const sprintOk = sprintFilter === "all" || (i.sprint_name || "").toLowerCase() === sprintFilter.toLowerCase();
      const foundOk = foundByFilter === "all" || (i.found_by || "").toLowerCase() === foundByFilter.toLowerCase();
      const moduleOk = moduleFilter === "all" || (i.module_name || "").toLowerCase() === moduleFilter.toLowerCase();
      const idTerm = searchId.trim().toLowerCase();
      const idOk = idTerm === "" || `${i.id || ""}`.toLowerCase().includes(idTerm) || (i.issueKey || "").toLowerCase().includes(idTerm);
      return statusOk && sprintOk && foundOk && moduleOk && idOk;
    });
  }, [issues, filter, sprintFilter, foundByFilter, moduleFilter, searchId]);

  useEffect(() => {
    setPage(1);
  }, [filter, sprintFilter, foundByFilter, moduleFilter, searchId]);

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageSliceStart = (page - 1) * pageSize;
  const paginatedIssues = filteredIssues.slice(pageSliceStart, pageSliceStart + pageSize);

  const handleSave = async (payload) => {
    if (!projectId) {
      toast.error("Project not selected.");
      return;
    }
    try {
      if (payload.id) {
        const { data } = await updateIssue(payload.id, payload);
        setIssues((prev) => prev.map((i) => (i.id === data.id ? data : i)));
      } else {
        const { data } = await createIssue({ ...payload, project_id: projectId, sprint_name: payload.sprint_name || sprint?.name });
        setIssues((prev) => [data, ...prev]);
      }
      setEditing(null);
      toast.success("Issue saved");
    } catch (error) {
      toast.error(error?.response?.data?.errors?.join(", ") || "Failed to save issue");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldExclamationIcon className="h-7 w-7 text-[var(--theme-color)]" />
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Issue Tracker</p>
                <h1 className="text-2xl font-bold text-slate-900">
                  {sprint?.name ? `Issues for ${sprint.name}` : "Project Issues"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Search #ID or key..."
                  className="rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30"
                />
                <span className="pointer-events-none absolute right-3 top-2.5 text-slate-400 text-xs">#</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-600">Status</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30 bg-white"
                >
                  <option value="all">All</option>
                  {DEFAULT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-600">Sprint</span>
                <select
                  value={sprintFilter}
                  onChange={(e) => setSprintFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30 bg-white"
                >
                  <option value="all">All</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-600">Found By</span>
                <select
                  value={foundByFilter}
                  onChange={(e) => setFoundByFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30 bg-white"
                >
                  <option value="all">All</option>
                  {uniqueValues.foundBy.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-600">Module</span>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/30 bg-white"
                >
                  <option value="all">All</option>
                  {uniqueValues.modules.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setEditing({})}
                className="rounded-lg bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
              >
                Add issue
              </button>
            </div>
          </div>
          {!projectId && (
            <p className="text-sm text-rose-600">Select a project to track issues.</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--theme-color)]" /> Loading issues...</div>
        ) : filteredIssues.length === 0 && !editing ? (
          <EmptyState onAdd={() => setEditing({})} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} onEdit={setEditing} onDelete={handleDelete} />
              ))}
            </div>
            {filteredIssues.length > pageSize && (
              <div className="flex items-center justify-between pt-4 text-sm text-slate-600">
                <span>
                  Showing {pageSliceStart + 1}-{Math.min(pageSliceStart + pageSize, filteredIssues.length)} of {filteredIssues.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={`rounded-lg px-3 py-2 border ${page === 1 ? 'border-slate-200 text-slate-300' : 'border-slate-300 hover:bg-slate-100'}`}
                  >
                    Prev
                  </button>
                  <span className="px-2">Page {page} / {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={`rounded-lg px-3 py-2 border ${page === totalPages ? 'border-slate-200 text-slate-300' : 'border-slate-300 hover:bg-slate-100'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              onClick={() => setEditing(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-200"
            >
              Close
            </button>
            <IssueForm
              tasks={tasks}
              sprints={sprints}
              initial={editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueTracker;
  const handleDelete = async (issue) => {
    if (!window.confirm(`Delete issue #${issue.id}?`)) return;
    try {
      await deleteIssue(issue.id);
      setIssues((prev) => prev.filter((i) => i.id !== issue.id));
      toast.success("Issue deleted");
    } catch (error) {
      toast.error("Failed to delete issue");
    }
  };
