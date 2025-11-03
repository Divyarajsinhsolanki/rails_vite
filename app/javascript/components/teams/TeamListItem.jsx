import React, { useEffect, useMemo } from "react";
import { FiAward, FiChevronRight, FiFlag, FiLoader, FiTrendingUp, FiUsers } from "react-icons/fi";
import Avatar from "../ui/Avatar";

const KPIBadge = ({ icon: Icon, label, value, isLoading }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
    {isLoading ? (
      <FiLoader className="h-3.5 w-3.5 animate-spin text-slate-500" />
    ) : (
      Icon && <Icon className="h-3.5 w-3.5 text-slate-500" />
    )}
    <span className="uppercase tracking-wide">{label}</span>
    <span className="font-semibold text-slate-800">{isLoading ? "…" : value ?? "—"}</span>
  </span>
);

const TeamListItem = ({ team, isSelected, onSelect, metrics, onEnsureMetrics }) => {
  const memberPreview = useMemo(() => (Array.isArray(team.users) ? team.users.slice(0, 3) : []), [team.users]);
  const totalMembers = Array.isArray(team.users) ? team.users.length : 0;
  const remainingMembers = Math.max(totalMembers - memberPreview.length, 0);

  useEffect(() => {
    if (!onEnsureMetrics || isSelected) return;
    const needsMetrics =
      !metrics ||
      metrics.skillCount == null ||
      metrics.endorsementCount == null ||
      metrics.learningGoalsCount == null;
    if (needsMetrics && !metrics?.isFetching && !metrics?.error) {
      onEnsureMetrics(team.id);
    }
  }, [isSelected, metrics, onEnsureMetrics, team.id]);

  const handleClick = () => {
    if (onSelect) {
      onSelect(team.id);
    }
  };

  const badgeValue = (value) => (typeof value === "number" ? value : value ?? "—");

  return (
    <li className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={handleClick}
        className={`w-full text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] ${
          isSelected
            ? "bg-[rgb(var(--theme-color-rgb)/0.12)] text-[var(--theme-color)] border-l-4 border-[var(--theme-color)]"
            : "hover:bg-slate-50"
        }`}
        aria-current={isSelected ? "true" : undefined}
      >
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="flex flex-1 items-start gap-3">
            <div className="flex -space-x-2">
              {memberPreview.length > 0 ? (
                memberPreview.map((member) => (
                  <Avatar
                    key={member.id}
                    name={member.name}
                    src={member.profile_picture}
                    className="h-8 w-8 border-2 border-white text-xs shadow-sm first:ml-0"
                  />
                ))
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                  <FiUsers aria-hidden="true" />
                </div>
              )}
              {remainingMembers > 0 && (
                <span className="ml-2 rounded-full bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600">
                  +{remainingMembers}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-gray-900">{team.name}</p>
              {team.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{team.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <KPIBadge
                  icon={FiUsers}
                  label="Members"
                  value={badgeValue(metrics?.memberCount ?? totalMembers)}
                  isLoading={Boolean(metrics?.isFetching && metrics?.memberCount == null)}
                />
                <KPIBadge
                  icon={FiAward}
                  label="Skills"
                  value={badgeValue(metrics?.skillCount)}
                  isLoading={Boolean(metrics?.isFetching && metrics?.skillCount == null)}
                />
                <KPIBadge
                  icon={FiFlag}
                  label="Goals"
                  value={badgeValue(metrics?.learningGoalsCount)}
                  isLoading={Boolean(metrics?.isFetching && metrics?.learningGoalsCount == null)}
                />
                <KPIBadge
                  icon={FiTrendingUp}
                  label="Endorsements"
                  value={badgeValue(metrics?.endorsementCount)}
                  isLoading={Boolean(metrics?.isFetching && metrics?.endorsementCount == null)}
                />
              </div>
            </div>
          </div>
          <FiChevronRight
            className={`mt-1 h-4 w-4 transition-transform duration-200 ${
              isSelected ? "translate-x-1 text-[var(--theme-color)]" : "text-gray-400"
            }`}
            aria-hidden="true"
          />
        </div>
      </button>
    </li>
  );
};

export default TeamListItem;
