const QA_UNASSIGNED_KEY = "__unassigned__";

const normalizeGroupKey = (value) =>
  (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const sortTaskList = (tasks = []) =>
  [...tasks].sort((left, right) => (Number(left.order) || 0) - (Number(right.order) || 0));

export function getTaskAssignmentGroup(task, developerMap = {}) {
  const developerId = task?.assignedTo?.[0] ? String(task.assignedTo[0]) : "";
  if (developerId) {
    const developer = developerMap[developerId];
    return {
      key: `dev:${developerId}`,
      type: "dev",
      label: developer?.name || "Unknown",
      rawValue: developerId,
      draggable: true,
    };
  }

  const qaAssigned = (task?.qa_assigned || "").trim();
  return {
    key: `qa:${qaAssigned ? normalizeGroupKey(qaAssigned) : QA_UNASSIGNED_KEY}`,
    type: "qa",
    label: qaAssigned || "QA Unassigned",
    rawValue: qaAssigned,
    draggable: false,
  };
}

export function compareTaskAssignmentGroups(left, right) {
  if (left.type !== right.type) {
    return left.type === "dev" ? -1 : 1;
  }

  const leftLabel = (left.label || "").trim().toLowerCase();
  const rightLabel = (right.label || "").trim().toLowerCase();

  if (left.type === "dev") {
    if (leftLabel === "ankitsir") return -1;
    if (rightLabel === "ankitsir") return 1;
  }

  if (leftLabel === "qa unassigned") return 1;
  if (rightLabel === "qa unassigned") return -1;

  return leftLabel.localeCompare(rightLabel);
}

export function groupTasksByAssignment(tasks = [], developerMap = {}) {
  const grouped = tasks.reduce((accumulator, task) => {
    const group = getTaskAssignmentGroup(task, developerMap);
    if (!accumulator[group.key]) {
      accumulator[group.key] = {
        ...group,
        tasks: [],
        totalHours: 0,
      };
    }

    accumulator[group.key].tasks.push(task);
    accumulator[group.key].totalHours += Number(task?.estimatedHours) || 0;
    return accumulator;
  }, {});

  return Object.values(grouped)
    .map((group) => ({
      ...group,
      tasks: sortTaskList(group.tasks),
    }))
    .sort(compareTaskAssignmentGroups);
}

export function getVisibleMembersForView({
  members = [],
  projectMembers = [],
  viewMode = "combined",
  records = [],
} = {}) {
  if (viewMode === "combined") {
    return members;
  }

  const activityIds = new Set(
    records
      .map((record) => record?.developer_id ?? record?.developerId)
      .filter(Boolean)
      .map((id) => String(id))
  );

  const roleById = Object.fromEntries(
    (projectMembers || []).map((member) => [String(member.id), (member.role || "").toLowerCase()])
  );

  const hasQaRoles = (projectMembers || []).some(
    (member) => (member?.role || "").toLowerCase() === "qa"
  );

  if (!hasQaRoles) {
    return activityIds.size
      ? members.filter((member) => activityIds.has(String(member.id)))
      : members;
  }

  return members.filter((member) => {
    const memberId = String(member.id);
    const role = roleById[memberId];

    if (viewMode === "qa") {
      return role === "qa" || activityIds.has(memberId);
    }

    return role !== "qa" || activityIds.has(memberId);
  });
}
