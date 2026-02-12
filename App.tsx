
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, Subtask } from './types';
import TaskItem from './components/TaskItem';
import TaskForm from './components/TaskForm';
import { getDailyInsights } from './services/geminiService';
import { Sparkles, Layout, CheckCircle, ListTodo, BrainCircuit, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [insight, setInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('zentask-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved tasks");
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('zentask-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const fetchInsight = async () => {
    setIsLoadingInsight(true);
    const result = await getDailyInsights(tasks);
    setInsight(result);
    setIsLoadingInsight(false);
  };

  // Initial insight fetch
  useEffect(() => {
    if (tasks.length > 0 && !insight) {
      fetchInsight();
    }
  }, [tasks.length]);

  const addTask = (text: string, priority: Priority, category: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      priority,
      category,
      subtasks: [],
      createdAt: Date.now(),
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateSubtasks = (taskId: string, subtasks: Subtask[]) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks } : t));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, filter]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <CheckCircle className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">ZenTask AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchInsight}
              disabled={isLoadingInsight}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center gap-2 text-sm font-medium"
            >
              {isLoadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
              <span className="hidden sm:inline">Refresh Insights</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
        {/* Insight Box */}
        {(insight || isLoadingInsight) && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white p-2 rounded-xl shadow-sm h-fit">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                AI Coach Suggestion
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed italic">
                {isLoadingInsight ? 'Thinking of ways to boost your productivity...' : insight}
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-indigo-600">{stats.pending}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Pending</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-emerald-500">{stats.completed}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Done</span>
          </div>
        </div>

        {/* Task Form */}
        <TaskForm onAdd={addTask} />

        {/* Task List Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <ListTodo className="w-5 h-5" />
            <h2>Tasks</h2>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {(['all', 'active', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md transition-all capitalize ${
                  filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-1">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={toggleTask} 
                onDelete={deleteTask}
                onUpdateSubtasks={updateSubtasks}
              />
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Layout className="w-12 h-12 mx-auto opacity-20" />
              <p>No tasks found. Time to relax or add something new!</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Hint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-full shadow-2xl flex items-center gap-2 opacity-90 backdrop-blur-sm pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        PRO TIP: Use the <Sparkles className="w-3.5 h-3.5 inline" /> icon on tasks for AI subtask generation
      </div>
    </div>
  );
};

export default App;
