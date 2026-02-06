import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchProjects } from '../components/api';
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

const calculateWorkingDays = (start, end) => {
  let count = 0;
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
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
  const [qaMode, setQaMode] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const sheetEnabled = !!(project?.sheet_integration_enabled && project?.sheet_id);

  useEffect(() => {
    if (!projectId) { setProject(null); return; }
    fetchProjects().then(({ data }) => {
      const list = Array.isArray(data) ? data : [];
      const found = list.find(p => p.id === Number(projectId));
      setProject(found || null);
    });
  }, [projectId]);

  // If sheet tab is active but integration is off, bounce back to overview.
  useEffect(() => {
    if (activeTab === 'sheet' && !sheetEnabled) {
      setActiveTab('overview');
    }
  }, [activeTab, sheetEnabled]);

  // Turn off QA mode if project changes or project does not support it.
  useEffect(() => {
    if (!project?.qa_mode_enabled && qaMode) {
      setQaMode(false);
    }
  }, [project?.qa_mode_enabled, qaMode]);

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
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 flex items-center">
            <CalendarDaysIcon className="h-7 w-7 mr-2 text-[var(--theme-color)]" />
            {sprint ? (
              <span className="flex flex-col sm:flex-row sm:items-center">
                <span className="truncate">Sprint: {sprint.name}</span>
                <span className="sm:ml-4 text-xl font-medium text-gray-600">
                  ({formatDateRange(sprint.start_date, sprint.end_date)})
                </span>
                <span className="sm:ml-4 text-xl font-medium text-gray-600">
                  Working Days: {calculateWorkingDays(sprint.start_date, sprint.end_date)}
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
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out
                  ${activeTab === 'overview'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out ml-2
                  ${activeTab === 'scheduler'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('scheduler')}
              >
                Scheduler
              </button>
              <button
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out ml-2
                  ${activeTab === 'todo'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('todo')}
              >
                Todo
              </button>
              <button
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out ml-2
                  ${activeTab === 'statistics'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('statistics')}
              >
                Statistics
              </button>
              <button
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out ml-2
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
                  className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out ml-2
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
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out ml-2
                  ${activeTab === 'vault'
                    ? 'bg-[var(--theme-color)] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-[rgb(var(--theme-color-rgb)/0.1)] hover:text-[var(--theme-color)]'
                  }`}
                onClick={() => setActiveTab('vault')}
              >
                Vault
              </button>
            </div>
            {project?.qa_mode_enabled && (
              <div className="ml-3 flex items-center gap-3 rounded-full border border-purple-200 bg-purple-50 px-3 py-1">
                <span className="text-sm font-semibold text-purple-700">QA mode</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={qaMode}
                  onClick={() => setQaMode((prev) => !prev)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 shadow-sm ${qaMode ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${qaMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
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
          qaMode={qaMode}
        />
      )}
      {activeTab === 'scheduler' && (
        sprintId ? (
          <Scheduler
            sprintId={sprintId}
            projectId={projectId}
            sheetIntegrationEnabled={project?.sheet_integration_enabled}
            qaMode={qaMode}
          />
        ) : (
          <p className="p-4">No sprint selected</p>
        )
      )}
      {activeTab === 'todo' && (
        sprintId ? <TodoBoard sprintId={sprintId} projectId={projectId} qaMode={qaMode} onSprintChange={handleSprintChange} /> : <p className="p-4">No sprint selected</p>
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
    </div>
  );
}
