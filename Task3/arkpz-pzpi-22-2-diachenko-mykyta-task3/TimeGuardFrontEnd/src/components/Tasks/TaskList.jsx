import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({
  tasks,
  friends,
  totalTime,
  onRefresh,
  onTaskDeleted,
  onEditTask,
  fetchTotalTime
}) => {
  if (!tasks || tasks.length === 0) {
    return <p>No tasks found.</p>;
  }

  return (
    <div>
      <h4>Existing Tasks</h4>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          friends={friends}
          totalTime={totalTime[task.id] || 0}
          onRefresh={() => onRefresh(task.id)}
          onTaskDeleted={onTaskDeleted}
          onEditTask={onEditTask}
          fetchTotalTime={fetchTotalTime}
        />
      ))}
    </div>
  );
};

export default TaskList;
