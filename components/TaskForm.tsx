
import React, { useState } from 'react';
import { Priority } from '../types';
import { Plus, Tag, Flag } from 'lucide-react';

interface TaskFormProps {
  onAdd: (text: string, priority: Priority, category: string) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onAdd }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('General');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text, priority, category);
    setText('');
    setPriority('medium');
    setCategory('General');
    setIsFocused(false);
  };

  const categories = ['General', 'Work', 'Personal', 'Shopping', 'Health'];

  return (
    <form 
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm ${
        isFocused ? 'ring-2 ring-indigo-100 border-indigo-400 shadow-lg' : 'border-slate-200'
      }`}
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
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded-md border-none focus:ring-1 focus:ring-indigo-400 outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded-md border-none focus:ring-1 focus:ring-indigo-400 outline-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex-1 text-right">
            <button
              type="submit"
              disabled={!text.trim()}
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100 flex items-center gap-2 ml-auto"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default TaskForm;
