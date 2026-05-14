import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchProjects, updateProject } from '../components/api';
import { CalendarDaysIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import SprintOverview from './SprintOverview';
import Scheduler from '../components/Scheduler/Scheduler';
import TodoBoard from '../components/TodoBoard/TodoBoard';
import SprintManager from '../components/Scheduler/SprintManager';
import Sheet from './Sheet';
import ProjectStatistics from './ProjectStatistics';
import IssueTracker from './IssueTracker';
import ProjectVault from './ProjectVault';
import PageLoader from '../components/ui/PageLoader';

const VIEW_MODES = ['dev', 'qa', 'combined'];

const calculateWorkingDays = (start, end, workingDaysMask = 62) => {
  let count = 0;
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    const day = current.getDay();
    if ((Number(workingDaysMask) & (1 << day)) !== 0) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const formatDateRange = (start, end) => {
  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
};

export default function SprintDashboard() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const dateParam = searchParams.get('date');
  const selectedDate = React.useMemo(() =>
    dateParam ? new Date(dateParam) : new Date(),
    [dateParam]);
  const [activeTab, setActiveTabState] = useState(initialTab);

  // Custom setter that also updates URL
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    }, { replace: true });
  };
  const [sprintId, setSprintId] = useState(null);
  const [sprint, setSprint] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [project, setProject] = useState(null);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('combined');
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [projectSettings, setProjectSettings] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    qa_mode_enabled: false,
    sheet_integration_enabled: false,
    sheet_id: '',
    issue_sheet_id: '',
    issue_sheet_name: 'Issue Tracker',
  });
  const sheetEnabled = !!(project?.sheet_integration_enabled && project?.sheet_id);

  useEffect(() => {
    if (!projectId) { setProject(null); return; }
    fetchProjects().then(({ data }) => {
      const list = Array.isArray(data) ? data : [];
      const found = list.find(p => p.id === Number(projectId));
      setProject(found || null);
    });
  }, [projectId]);

  useEffect(() => {
    if (!project) return;
    setProjectSettings({
      name: project.name || '',
      description: project.description || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      qa_mode_enabled: !!project.qa_mode_enabled,
      sheet_integration_enabled: !!project.sheet_integration_enabled,
      sheet_id: project.sheet_id || '',
      issue_sheet_id: project.issue_sheet_id || '',
      issue_sheet_name: project.issue_sheet_name || 'Issue Tracker',
    });
  }, [project]);

  // If sheet tab is active but integration is off, bounce back to overview.
  useEffect(() => {
    if (activeTab === 'sheet' && !sheetEnabled) {
      setActiveTab('overview');
    }
  }, [activeTab, sheetEnabled]);

  // Fall back to dev-only when the project does not support QA mode.
  useEffect(() => {
    if (!project?.qa_mode_enabled && viewMode !== 'dev') {
      setViewMode('dev');
    }
  }, [project?.qa_mode_enabled, viewMode]);

  // Load sprints when project changes and select the active one
  useEffect(() => {
    setSprint(null);
    setSprints([]);
    setIsLoadingDashboard(true);

    const query = projectId ? `?project_id=${projectId}` : '';
    fetch(`/api/sprints.json${query}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const sorted = [...list].sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

        setSprints(sorted);

        if (sorted.length) {
          const reference = selectedDate;
          const current = sorted.find(s => {
            const start = new Date(s.start_date);
            const end = new Date(s.end_date);
            return reference >= start && reference <= end;
          });

          const mostRecentPast = sorted
            .filter(s => new Date(s.end_date) < reference)
            .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];

          const sprintToSelect = current || mostRecentPast || sorted[0];

          setSprint(sprintToSelect || null);
          setSprintId(sprintToSelect ? sprintToSelect.id : null);
        } else {
          setSprintId(null);
        }
      })
      .catch(() => {
        setSprint(null);
        setSprintId(null);
        setSprints([]);
      })
      .finally(() => setIsLoadingDashboard(false));
  }, [projectId, selectedDate]);

  useEffect(() => {
    if (sprintId !== null && sprints.length) {
      const found = sprints.find(sp => sp.id === sprintId);
      if (found) setSprint(found);
    }
  }, [sprintId, sprints]);

  if (isLoadingDashboard) {
    return <PageLoader title="Project dashboard" message="Loading sprint board, tasks, and project data…" />;
  }

  const isCurrentSprint = (s) => {
    if (!s) return false;
    const today = new Date();
    const start = new Date(s.start_date);
    const end = new Date(s.end_date);
    return today >= start && today <= end;
  };

  const handleSprintChange = (s) => {
    if (typeof s === 'number' || typeof s === 'string') {
      const found = sprints.find(sp => sp.id === Number(s));
      if (found) setSprint(found);
      setSprintId(Number(s));
    } else {
      setSprint(s);
      setSprintId(s?.id || null);
    }
    setIsHeaderExpanded(false);
  };

  const handleProjectSettingsChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProjectSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProjectSettingsSubmit = async (event) => {
    event.preventDefault();
    if (!project?.id) return;

    setIsSavingSettings(true);
    setSettingsMessage('');
    try {
      const payload = {
        ...projectSettings,
        issue_sheet_name: projectSettings.issue_sheet_name || 'Issue Tracker',
      };
      const { data } = await updateProject(project.id, payload);
      setProject(data);
      setSettingsMessage('Project settings updated successfully.');
    } catch (error) {
      setSettingsMessage(error?.response?.data?.errors?.join(', ') || 'Failed to update project settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const viewModeLabel = viewMode === 'qa' ? 'QA' : viewMode === 'combined' ? 'Combined' : 'Dev';
  const sprintRangeLabel = sprint ? formatDateRange(sprint.start_date, sprint.end_date) : 'No sprint selected';
  const workingDaysCount = sprint
    ? calculateWorkingDays(
      sprint.start_date,
      sprint.end_date,
      typeof sprint.working_days_mask === 'number' ? sprint.working_days_mask : 62
    )
    : 0;
  const dashboardTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'scheduler', label: 'Scheduler' },
    { key: 'todo', label: 'Todo' },
    { key: 'statistics', label: 'Statistics' },
    { key: 'issues', label: 'Issue Tracker' },
    sheetEnabled ? { key: 'sheet', label: 'Sheet' } : null,
    { key: 'vault', label: 'Vault' },
    { key: 'settings', label: 'Settings' },
  ].filter(Boolean);
  const emptyState = (
    <div className="shell-panel shell-panel-strong mt-6 rounded-[30px] px-6 py-12 text-center">
      <p className="text-lg font-semibold text-slate-900">No sprint selected</p>
      <p className="mt-2 text-sm text-slate-500">Pick a sprint from the command deck to load this workspace.</p>
    </div>
  );


  return (
    <div className="space-y-6 pb-8">
      <header className="shell-panel shell-panel-strong landing-hero-3d overflow-hidden rounded-[36px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,0.16),transparent_24%),radial-gradient(circle_at_left,rgba(52,109,255,0.12),transparent_26%)]" />
        <div className="relative space-y-6 p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <span className="shell-eyebrow">Project Command Deck</span>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                {project?.name || 'Project Dashboard'}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                {project?.description || 'Plan sprint delivery, review project health, and move between execution surfaces from one shared control room.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <span className="shell-chip">
                <span className="shell-chip-dot" />
                {activeTab}
              </span>
              <span className="shell-chip">
                <span className="shell-chip-dot" />
                {viewModeLabel} mode
              </span>
              {sheetEnabled ? (
                <span className="shell-chip">
                  <span className="shell-chip-dot" />
                  Sheet linked
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="shell-kpi-card">
                <span className="shell-kpi-label">Sprint Window</span>
                <span className="shell-kpi-value">{sprint ? sprint.name : 'Awaiting sprint'}</span>
                <span className="shell-kpi-meta">{sprintRangeLabel}</span>
              </div>

              <div className="shell-kpi-card">
                <span className="shell-kpi-label">Working Days</span>
                <span className="shell-kpi-value">{workingDaysCount}</span>
                <span className="shell-kpi-meta">Configured against this sprint schedule.</span>
              </div>

              <div className="shell-kpi-card">
                <span className="shell-kpi-label">Project Crew</span>
                <span className="shell-kpi-value">{project?.users?.length || 0}</span>
                <span className="shell-kpi-meta">{project?.qa_mode_enabled ? 'Dev and QA lanes enabled.' : 'Dev-only workflow active.'}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(135deg,rgba(7,17,32,0.96),rgba(30,41,59,0.92))] p-5 text-white shadow-[0_28px_54px_rgb(15_23_42_/_0.22)]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-white/45">
                {sprint && isCurrentSprint(sprint) ? 'Current Sprint' : 'Sprint Status'}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em]">
                    {sprint ? sprint.name : 'No sprint selected'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/66">
                    Use the sprint manager to swap windows, review dates, and shift this dashboard into the correct execution lane.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHeaderExpanded((value) => !value)}
                  className="shell-button-secondary shrink-0 bg-white/10 px-4 py-3 text-white shadow-none hover:bg-white/16"
                >
                  {isHeaderExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                  {isHeaderExpanded ? 'Hide' : 'Manage'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="shell-segmented scrollbar-hide overflow-x-auto">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`shell-segmented-button whitespace-nowrap ${activeTab === tab.key ? 'shell-segmented-button-active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              {project?.qa_mode_enabled ? (
                <div className="shell-segmented">
                  {VIEW_MODES.map((mode) => {
                    const active = viewMode === mode;
                    const label = mode === 'qa' ? 'QA' : mode === 'combined' ? 'Combined' : 'Dev';

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className={`shell-segmented-button min-w-[5rem] ${active ? 'shell-segmented-button-active' : ''}`}
                        aria-pressed={active}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <span className="sr-only">Current view mode: {viewModeLabel}</span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setIsHeaderExpanded((value) => !value)}
                className="shell-button-secondary px-5 py-3"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                {isHeaderExpanded ? 'Hide Sprint Manager' : 'Open Sprint Manager'}
              </button>
            </div>
          </div>

          {isHeaderExpanded ? (
            <div className="shell-panel shell-panel-strong rounded-[30px] px-4 py-5 sm:px-5">
              <SprintManager
                onSprintChange={handleSprintChange}
                projectId={projectId}
                projectName={project?.name}
                selectedDate={selectedDate}
                sprintId={sprintId}
                isVisible={isHeaderExpanded}
              />
            </div>
          ) : null}
        </div>
      </header>
      {activeTab === 'overview' && (
        <SprintOverview
          projectId={projectId}
          sprintId={sprintId}
          onSprintChange={handleSprintChange}
          sheetIntegrationEnabled={project?.sheet_integration_enabled}
          projectMembers={project?.users}
          viewMode={viewMode}
        />
      )}
      {activeTab === 'scheduler' && (
        sprintId ? (
          <Scheduler
            sprintId={sprintId}
            projectId={projectId}
            sheetIntegrationEnabled={project?.sheet_integration_enabled}
            projectMembers={project?.users}
            viewMode={viewMode}
          />
        ) : (
          emptyState
        )
      )}
      {activeTab === 'todo' && (
        sprintId
          ? <TodoBoard sprintId={sprintId} projectId={projectId} viewMode={viewMode} onSprintChange={handleSprintChange} />
          : emptyState
      )}
      {activeTab === 'sheet' && sheetEnabled && (
        <Sheet sheetName={sprint?.name} projectId={projectId} sheetId={project?.sheet_id} />
      )}
      {activeTab === 'statistics' && (
        <ProjectStatistics projectId={projectId} />
      )}
      {activeTab === 'issues' && (
        <IssueTracker projectId={projectId} sprint={sprint} />
      )}
      {activeTab === 'vault' && (
        <ProjectVault projectId={projectId} />
      )}
      {activeTab === 'settings' && (
        <div className="shell-panel shell-panel-strong mx-auto mt-2 w-full max-w-5xl rounded-[32px] p-6 shadow-[0_24px_54px_rgb(15_23_42_/_0.08)] sm:p-7">
          <h2 className="text-2xl font-bold text-slate-900">Project Settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Update the same project settings available in the Projects edit page.
          </p>

          <form onSubmit={handleProjectSettingsSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input id="name" name="name" value={projectSettings.name} onChange={handleProjectSettingsChange} required className="shell-input p-3" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="description" name="description" value={projectSettings.description} onChange={handleProjectSettingsChange} className="shell-input h-28 resize-y p-3" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" id="start_date" name="start_date" value={projectSettings.start_date} onChange={handleProjectSettingsChange} className="shell-input p-3" />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" id="end_date" name="end_date" value={projectSettings.end_date} onChange={handleProjectSettingsChange} className="shell-input p-3" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" name="qa_mode_enabled" checked={projectSettings.qa_mode_enabled} onChange={handleProjectSettingsChange} className="h-4 w-4" />
              Enable QA Mode
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" name="sheet_integration_enabled" checked={projectSettings.sheet_integration_enabled} onChange={handleProjectSettingsChange} className="h-4 w-4" />
              Enable Sheet Integration
            </label>

            {projectSettings.sheet_integration_enabled && (
              <div className="space-y-4 rounded-[24px] border border-white/70 bg-white/64 p-4">
                <div>
                  <label htmlFor="sheet_id" className="block text-sm font-medium text-gray-700 mb-1">Task Sheet ID</label>
                  <input id="sheet_id" name="sheet_id" value={projectSettings.sheet_id} onChange={handleProjectSettingsChange} className="shell-input p-3" />
                </div>
                <div>
                  <label htmlFor="issue_sheet_id" className="block text-sm font-medium text-gray-700 mb-1">Issue Tracker Sheet ID</label>
                  <input id="issue_sheet_id" name="issue_sheet_id" value={projectSettings.issue_sheet_id} onChange={handleProjectSettingsChange} className="shell-input p-3" />
                </div>
                <div>
                  <label htmlFor="issue_sheet_name" className="block text-sm font-medium text-gray-700 mb-1">Issue Tracker Sheet Name</label>
                  <input id="issue_sheet_name" name="issue_sheet_name" value={projectSettings.issue_sheet_name} onChange={handleProjectSettingsChange} className="shell-input p-3" />
                </div>
              </div>
            )}

            {settingsMessage && (
              <p className={`text-sm font-medium ${settingsMessage.includes('successfully') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {settingsMessage}
              </p>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={isSavingSettings} className="shell-button-primary disabled:opacity-60">
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
