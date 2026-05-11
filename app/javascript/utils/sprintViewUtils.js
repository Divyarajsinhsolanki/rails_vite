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
  viewMode = "combined",
  records = [],
} = {}) {
  const assignedIds = new Set(
    records
      .map((record) => {
        const recordType = String(record?.type || "").toLowerCase();
        const preferredQaAssignee = record?.assigned_to_user ?? record?.assignedUser ?? record?.assigned_user?.id;
        const preferredDevAssignee = record?.developer_id ?? record?.developerId ?? record?.developer?.id;

        if (viewMode === "qa" || recordType === "qa") {
          return preferredQaAssignee ?? preferredDevAssignee;
        }

        return preferredDevAssignee ?? preferredQaAssignee;
      })
      .filter(Boolean)
      .map((id) => String(id))
  );

  return members.filter((member) => assignedIds.has(String(member.id)));
}
