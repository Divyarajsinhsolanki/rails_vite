import { describe, expect, it } from "vitest";
import {
  compareTaskAssignmentGroups,
  getTaskAssignmentGroup,
  getVisibleMembersForView,
  groupTasksByAssignment,
} from "./sprintViewUtils";

describe("sprintViewUtils", () => {
  it("groups developer and QA tasks by their visible assignment labels", () => {
    const developerMap = {
      "1": { id: 1, name: "Asha" },
    };

    const groups = groupTasksByAssignment(
      [
        { id: "DEV-1", assignedTo: ["1"], estimatedHours: 3, order: 2 },
        { id: "QA-1", assignedTo: [], qa_assigned: "Riya", estimatedHours: 2, order: 1 },
        { id: "QA-2", assignedTo: [], qa_assigned: "", estimatedHours: 1, order: 3 },
        { id: "DEV-2", assignedTo: ["1"], estimatedHours: 4, order: 1 },
      ],
      developerMap
    );

    expect(groups.map((group) => group.label)).toEqual(["Asha", "Riya", "QA Unassigned"]);
    expect(groups[0].totalHours).toBe(7);
    expect(groups[0].tasks.map((task) => task.id)).toEqual(["DEV-2", "DEV-1"]);
  });

  it("builds QA assignment groups from qa_assigned when no developer exists", () => {
    const group = getTaskAssignmentGroup({ assignedTo: [], qa_assigned: "QA Team" }, {});

    expect(group).toMatchObject({
      key: "qa:qa team",
      type: "qa",
      label: "QA Team",
      draggable: false,
    });
  });

  it("keeps developer groups ahead of QA groups and prioritizes ankitsir", () => {
    const ordered = [
      { type: "qa", label: "Riya" },
      { type: "dev", label: "Zed" },
      { type: "dev", label: "ankitsir" },
    ].sort(compareTaskAssignmentGroups);

    expect(ordered).toEqual([
      { type: "dev", label: "ankitsir" },
      { type: "dev", label: "Zed" },
      { type: "qa", label: "Riya" },
    ]);
  });

  it("filters visible members by view mode and project roles", () => {
    const members = [
      { id: 1, name: "Dev One" },
      { id: 2, name: "QA One" },
      { id: 3, name: "Dev Two" },
    ];

    expect(
      getVisibleMembersForView({
        members,
        viewMode: "dev",
        records: [{ type: "Code", developer_id: 1 }],
      }).map((member) => member.id)
    ).toEqual([1]);

    expect(
      getVisibleMembersForView({
        members,
        viewMode: "qa",
        records: [{ type: "qa", assigned_to_user: 2 }],
      }).map((member) => member.id)
    ).toEqual([2]);
  });

  it("uses assigned sprint members only in combined mode", () => {
    const members = [
      { id: 1, name: "Dev One" },
      { id: 2, name: "QA One" },
      { id: 3, name: "Dev Two" },
    ];

    expect(
      getVisibleMembersForView({
        members,
        viewMode: "combined",
        records: [
          { type: "Code", developer_id: 1 },
          { type: "qa", assigned_to_user: 2 },
        ],
      }).map((member) => member.id)
    ).toEqual([1, 2]);
  });
});
