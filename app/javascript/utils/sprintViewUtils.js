const QA_UNASSIGNED_KEY = "__unassigned__";

const normalizeGroupKey = (value) =>
  (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const sortTaskList = (tasks = []) =>
  [...tasks].sort((left, right) => (Number(left.order) || 0) - (Number(right.order) || 0));

const compact = (values = []) =>
  values.filter((value) => value !== null && value !== undefined && value !== "");

const memberTokens = (member) => {
  const fullName = [member?.first_name, member?.last_name].filter(Boolean).join(" ");
  return compact([
    member?.id,
    member?.name,
    member?.email,
    member?.first_name,
    member?.last_name,
    fullName,
  ]);
};

const buildMemberLookup = (members = []) =>
  members.reduce((accumulator, member) => {
    memberTokens(member).forEach((token) => {
      const normalized = normalizeGroupKey(String(token));
      if (normalized) accumulator[normalized] = String(member.id);
    });
    return accumulator;
  }, {});

const resolveMemberIdByLabel = (labels = [], memberLookup = {}) =>
  compact(labels)
    .map((label) => memberLookup[normalizeGroupKey(String(label))])
    .find(Boolean);

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
  const safeMembers = Array.isArray(members) ? members : [];
  const safeRecords = Array.isArray(records) ? records : [];
  const memberLookup = buildMemberLookup(safeMembers);
  const availableIds = new Set(safeMembers.map((member) => String(member.id)));
  const addId = (ids, value) => {
    if (value !== null && value !== undefined && value !== "" && availableIds.has(String(value))) {
      ids.add(String(value));
    }
  };

  const assignedIds = safeRecords.reduce((ids, record) => {
    const recordType = String(record?.type || "").toLowerCase();
    const developerId = record?.developer_id ?? record?.developerId ?? record?.developer?.id;
    const reviewerId = record?.assigned_to_user ?? record?.assignedUser ?? record?.assigned_user?.id;
    const qaId = resolveMemberIdByLabel(
      [record?.qa_assigned, record?.internal_qa, record?.assigned_user?.name, record?.assigned_user?.email],
      memberLookup
    );

    if (viewMode === "qa" || recordType === "qa") {
      addId(ids, reviewerId);
      addId(ids, qaId);
      if (!reviewerId && !qaId) addId(ids, developerId);
      return ids;
    }

    if (viewMode === "dev") {
      addId(ids, developerId);
      addId(ids, reviewerId);
      return ids;
    }

    addId(ids, developerId);
    addId(ids, reviewerId);
    addId(ids, qaId);
    return ids;
  }, new Set());

  return safeMembers.filter((member) => assignedIds.has(String(member.id)));
}
