
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  CheckCircle2, Circle, Trash2, ChevronDown, ChevronRight, 
  Sparkles, Loader2, Plus, Tag, Flag, Layout, ListTodo, 
  BrainCircuit, CheckCircle 
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
type Priority = 'low' | 'medium' | 'high';

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: string;
  subtasks: Subtask[];
  createdAt: number;
}

// --- SERVICES ---
const getAIClient = () => {
  // Use a fallback to prevent crashes if process is undefined
  const apiKey = (window as any).process?.env?.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

const breakdownTask = async (taskText: string): Promise<string[]> => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down this task into 3 to 5 actionable subtasks: "${taskText}". Return only the list of subtasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
};

const getDailyInsights = async (tasks: Task[]): Promise<string> => {
  if (tasks.length === 0) return "Add some tasks to get personalized AI productivity insights!";
  const ai = getAIClient();
  const summary = tasks.map(t => `- [${t.priority}] ${t.text} (${t.completed ? 'Done' : 'Pending'})`).join('\n');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a productivity coach. Analyze these tasks and give one concise piece of advice (max 2 sentences) on efficiency:\n${summary}`,
    });
    return response.text || "Keep crushing your goals!";
  } catch (error) {
    return "Stay focused and keep moving forward.";
  }
};

// --- COMPONENTS ---
const TaskForm: React.FC<{ onAdd: (t: string, p: Priority, c: string) => void }> = ({ onAdd }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('General');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text, priority, category);
    setText('');
    setIsFocused(false);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm ${isFocused ? 'ring-2 ring-indigo-100 border-indigo-400 shadow-lg' : 'border-slate-200'}`}
    >
      <div className="p-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="What needs to be done?"
          className="w-full text-lg font-medium text-slate-700 placeholder-slate-300 focus:outline-none bg-transparent"
        />
      </div>
      {isFocused && (
        <div className="px-4 pb-4 flex flex-wrap items-center gap-4 border-t border-slate-50 pt-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-slate-400" />
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded-md outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded-md outline-none">
              {['General', 'Work', 'Personal', 'Shopping', 'Health'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 ml-auto">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      )}
    </form>
  );
};

const TaskItem: React.FC<{ task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void; onUpdateSubtasks: (id: string, s: Subtask[]) => void }> = ({ task, onToggle, onDelete, onUpdateSubtasks }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  const handleAIDecompose = async () => {
    setIsBreakingDown(true);
    const suggestions = await breakdownTask(task.text);
    const newSubtasks: Subtask[] = suggestions.map(text => ({ id: crypto.randomUUID(), text, completed: false }));
    onUpdateSubtasks(task.id, [...task.subtasks, ...newSubtasks]);
    setIsBreakingDown(false);
    setIsExpanded(true);
  };

  return (
    <div className="group bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-md mb-3">
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => onToggle(task.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
          {task.completed ? <CheckCircle2 className="w-6 h-6 text-indigo-600" /> : <Circle className="w-6 h-6" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-rose-100 text-rose-700' : task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {task.priority}
            </span>
            <span className="text-xs text-slate-400">{task.category}</span>
          </div>
          <p className={`text-slate-700 font-medium truncate ${task.completed ? 'line-through opacity-50' : ''}`}>{task.text}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleAIDecompose} disabled={isBreakingDown} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg disabled:opacity-50">
            {isBreakingDown ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(task.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {(task.subtasks.length > 0 || isBreakingDown) && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        )}
      </div>
      {isExpanded && task.subtasks.length > 0 && (
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
          <div className="space-y-2 ml-8">
            {task.subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 text-sm">
                <button onClick={() => onUpdateSubtasks(task.id, task.subtasks.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s))} className={`${sub.completed ? 'text-indigo-500' : 'text-slate-300'}`}>
                  {sub.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
                <span className={`flex-1 text-slate-600 ${sub.completed ? 'line-through opacity-50' : ''}`}>{sub.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP ---
const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [insight, setInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    const saved = localStorage.getItem('zentask-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zentask-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const fetchInsight = async () => {
    setIsLoadingInsight(true);
    const result = await getDailyInsights(tasks);
    setInsight(result);
    setIsLoadingInsight(false);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => filter === 'active' ? !t.completed : filter === 'completed' ? t.completed : true)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, filter]);

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><CheckCircle className="text-white w-6 h-6" /></div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">ZenTask AI</h1>
          </div>
          <button onClick={fetchInsight} disabled={isLoadingInsight} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full flex items-center gap-2 text-sm font-medium">
            {isLoadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            <span className="hidden sm:inline">Refresh Insights</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
        {(insight || isLoadingInsight) && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 flex gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm h-fit"><Sparkles className="w-5 h-5 text-indigo-500" /></div>
            <div>
              <h3 className="text-xs font-bold text-indigo-400 uppercase mb-1">AI Coach Suggestion</h3>
              <p className="text-slate-700 text-sm leading-relaxed italic">{isLoadingInsight ? 'Analyzing your day...' : insight}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[{l: 'Total', v: tasks.length, c: 'slate'}, {l: 'Pending', v: tasks.filter(t => !t.completed).length, c: 'indigo'}, {l: 'Done', v: tasks.filter(t => t.completed).length, c: 'emerald'}].map(s => (
            <div key={s.l} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
              <span className={`text-2xl font-bold text-${s.c}-600`}>{s.v}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">{s.l}</span>
            </div>
          ))}
        </div>

        <TaskForm onAdd={(text, priority, category) => setTasks([{ id: crypto.randomUUID(), text, completed: false, priority, category, subtasks: [], createdAt: Date.now() }, ...tasks])} />

        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold"><ListTodo className="w-5 h-5" /><h2>Tasks</h2></div>
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {['all', 'active', 'completed'].map(f => (
              <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1.5 rounded-md capitalize ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          {filteredTasks.length > 0 ? filteredTasks.map(t => (
            <TaskItem key={t.id} task={t} onToggle={id => setTasks(tasks.map(x => x.id === id ? { ...x, completed: !x.completed } : x))} onDelete={id => setTasks(tasks.filter(x => x.id !== id))} onUpdateSubtasks={(id, s) => setTasks(tasks.map(x => x.id === id ? { ...x, subtasks: s } : x))} />
          )) : (
            <div className="py-12 text-center text-slate-400"><Layout className="w-12 h-12 mx-auto opacity-20 mb-2" /><p>No tasks found.</p></div>
          )}
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
