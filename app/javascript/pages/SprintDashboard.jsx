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


  return (
    <div className="">
      <header className="bg-white shadow-sm p-2">
        {/* {project && (
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-gray-800">{project.name}</h2>
            {project.description && (
              <p className="text-gray-500 text-sm">{project.description}</p>
            )}
          </div>
        )} */}
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800 flex items-center">
            <CalendarDaysIcon className="h-6 w-6 mr-2 text-[var(--theme-color)]" />
            {sprint ? (
              <span className="flex flex-col sm:flex-row sm:items-center">
                <span className="truncate">Sprint: {sprint.name}</span>
                <span className="sm:ml-3 text-base font-medium text-gray-600">
                  ({formatDateRange(sprint.start_date, sprint.end_date)})
                </span>
                <span className="sm:ml-3 text-base font-medium text-gray-600">
                  Working Days: {calculateWorkingDays(
                    sprint.start_date,
                    sprint.end_date,
                    typeof sprint.working_days_mask === 'number' ? sprint.working_days_mask : 62
                  )}
                </span>
              </span>
            ) : (
              'Sprint Manager'
            )}
          </h1>
          {/* Tab Navigation */}
          <div className="flex justify-between items-center">
            <div className="flex bg-white rounded-full p-1 shadow-md border border-gray-100">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out
                  ${activeTab === 'overview'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ml-1.5
                  ${activeTab === 'scheduler'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('scheduler')}
              >
                Scheduler
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ml-1.5
                  ${activeTab === 'todo'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('todo')}
              >
                Todo
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ml-1.5
                  ${activeTab === 'statistics'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('statistics')}
              >
                Statistics
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ml-1.5
                  ${activeTab === 'issues'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('issues')}
              >
                Issue Tracker
              </button>
              {sheetEnabled && (
                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ml-1.5
                    ${activeTab === 'sheet'
                      ? 'bg-[var(--theme-color)] text-white shadow-lg'
                      : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                    }`}
                  onClick={() => setActiveTab('sheet')}
                >
                  Sheet
                </button>
              )}
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ml-1.5
                  ${activeTab === 'vault'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('vault')}
              >
                Vault
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ml-1.5
                  ${activeTab === 'settings'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>
            {project?.qa_mode_enabled && (
              <div className="ml-3 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                {VIEW_MODES.map((mode) => {
                  const active = viewMode === mode;
                  const label = mode === 'qa' ? 'QA' : mode === 'combined' ? 'Combined' : 'Dev';
                  const activeClasses = mode === 'qa'
                    ? 'bg-purple-600 text-white shadow'
                    : mode === 'combined'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-700 text-white shadow';

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${active ? activeClasses : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  );
                })}
                <span className="sr-only">Current view mode: {viewModeLabel}</span>
              </div>
            )}
          </div>
          <div
            className="flex items-center space-x-3 cursor-pointer select-none p-2 rounded-lg hover:bg-[rgb(var(--theme-color-rgb)/0.1)] transition-colors duration-200"
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
          >
            {sprint && (
              <p className="text-m text-gray-600">
                {isCurrentSprint(sprint) ? 'Current Sprint:' : 'Selected Sprint:'}{' '}
                <span className="font-semibold text-[var(--theme-color)]">{sprint.name}</span>
              </p>
            )}
            {isHeaderExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
        <div className={`mt-4 border-t border-gray-200 pt-4 ${isHeaderExpanded ? '' : 'hidden'}`}>
          <SprintManager
            onSprintChange={handleSprintChange}
            projectId={projectId}
            projectName={project?.name}
            selectedDate={selectedDate}
            sprintId={sprintId}
            isVisible={isHeaderExpanded}
          />
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
          <p className="p-4">No sprint selected</p>
        )
      )}
      {activeTab === 'todo' && (
        sprintId ? <TodoBoard sprintId={sprintId} projectId={projectId} viewMode={viewMode} onSprintChange={handleSprintChange} /> : <p className="p-4">No sprint selected</p>
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
        <div className="mx-auto mt-6 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Project Settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Update the same project settings available in the Projects edit page.
          </p>

          <form onSubmit={handleProjectSettingsSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input id="name" name="name" value={projectSettings.name} onChange={handleProjectSettingsChange} required className="w-full rounded-lg border border-gray-300 p-3" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="description" name="description" value={projectSettings.description} onChange={handleProjectSettingsChange} className="w-full rounded-lg border border-gray-300 p-3 h-28 resize-y" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" id="start_date" name="start_date" value={projectSettings.start_date} onChange={handleProjectSettingsChange} className="w-full rounded-lg border border-gray-300 p-3" />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" id="end_date" name="end_date" value={projectSettings.end_date} onChange={handleProjectSettingsChange} className="w-full rounded-lg border border-gray-300 p-3" />
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
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label htmlFor="sheet_id" className="block text-sm font-medium text-gray-700 mb-1">Task Sheet ID</label>
                  <input id="sheet_id" name="sheet_id" value={projectSettings.sheet_id} onChange={handleProjectSettingsChange} className="w-full rounded-lg border border-gray-300 p-3" />
                </div>
                <div>
                  <label htmlFor="issue_sheet_id" className="block text-sm font-medium text-gray-700 mb-1">Issue Tracker Sheet ID</label>
                  <input id="issue_sheet_id" name="issue_sheet_id" value={projectSettings.issue_sheet_id} onChange={handleProjectSettingsChange} className="w-full rounded-lg border border-gray-300 p-3" />
                </div>
                <div>
                  <label htmlFor="issue_sheet_name" className="block text-sm font-medium text-gray-700 mb-1">Issue Tracker Sheet Name</label>
                  <input id="issue_sheet_name" name="issue_sheet_name" value={projectSettings.issue_sheet_name} onChange={handleProjectSettingsChange} className="w-full rounded-lg border border-gray-300 p-3" />
                </div>
              </div>
            )}

            {settingsMessage && (
              <p className={`text-sm font-medium ${settingsMessage.includes('successfully') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {settingsMessage}
              </p>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={isSavingSettings} className="rounded-lg bg-[var(--theme-color)] px-5 py-2 text-white font-semibold disabled:opacity-60">
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
