export const DEFAULT_TASK_LOG_TYPE = 'Code';
export const DEFAULT_TASK_LOG_HOURS = 1;

const isoToday = () => new Date().toISOString().slice(0, 10);

export const resolveDefaultLogMetadata = ({ estimatedHours, startDate } = {}) => {
  const hoursEmpty = estimatedHours === null || estimatedHours === undefined || estimatedHours === '';
  const parsedHours = Number(estimatedHours);
  const hoursLogged = hoursEmpty || Number.isNaN(parsedHours) ? DEFAULT_TASK_LOG_HOURS : parsedHours;

  return {
    logDate: startDate || isoToday(),
    hoursLogged,
  };
};

export const buildDefaultTaskLogPayload = ({ taskId, developerId, estimatedHours, startDate, type = DEFAULT_TASK_LOG_TYPE }) => {
  const { logDate, hoursLogged } = resolveDefaultLogMetadata({ estimatedHours, startDate });

  return {
    task_id: taskId,
    developer_id: developerId,
    type,
    log_date: logDate,
    hours_logged: hoursLogged,
  };
};
