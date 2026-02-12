
import React, { useState } from 'react';
import { Task, Subtask } from '../types';
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { breakdownTask } from '../services/geminiService';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onUpdateSubtasks }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  const priorityColors = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700'
  };

  const handleAIDecompose = async () => {
    setIsBreakingDown(true);
    const suggestions = await breakdownTask(task.text);
    const newSubtasks: Subtask[] = suggestions.map(text => ({
      id: crypto.randomUUID(),
      text,
      completed: false
    }));
    onUpdateSubtasks(task.id, [...task.subtasks, ...newSubtasks]);
    setIsBreakingDown(false);
    setIsExpanded(true);
  };

  const toggleSubtask = (subtaskId: string) => {
    const updated = task.subtasks.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onUpdateSubtasks(task.id, updated);
  };

  const deleteSubtask = (subtaskId: string) => {
    const updated = task.subtasks.filter(s => s.id !== subtaskId);
    onUpdateSubtasks(task.id, updated);
  };

  return (
    <div className="group bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-md mb-3">
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => onToggle(task.id)}
          className="text-slate-400 hover:text-indigo-600 transition-colors"
        >
          {task.completed ? (
            <CheckCircle2 className="w-6 h-6 text-indigo-600" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <span className="text-xs text-slate-400">{task.category}</span>
          </div>
          <p className={`text-slate-700 font-medium truncate ${task.completed ? 'line-through opacity-50' : ''}`}>
            {task.text}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleAIDecompose}
            disabled={isBreakingDown}
            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            title="AI Smart Breakdown"
          >
            {isBreakingDown ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        {(task.subtasks.length > 0 || isBreakingDown) && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        )}
      </div>

      {isExpanded && task.subtasks.length > 0 && (
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
          <div className="space-y-2 ml-8">
            {task.subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 text-sm group/sub">
                <button 
                  onClick={() => toggleSubtask(sub.id)}
                  className={`${sub.completed ? 'text-indigo-500' : 'text-slate-300'} hover:text-indigo-400`}
                >
                  {sub.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
                <span className={`flex-1 text-slate-600 ${sub.completed ? 'line-through opacity-50' : ''}`}>
                  {sub.text}
                </span>
                <button 
                  onClick={() => deleteSubtask(sub.id)}
                  className="opacity-0 group-hover/sub:opacity-100 text-slate-300 hover:text-rose-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
