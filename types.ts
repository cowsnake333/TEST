
export type Priority = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate?: string;
  subtasks: Subtask[];
  createdAt: number;
}

export interface AIInsight {
  type: 'suggestion' | 'priority' | 'breakdown';
  content: string;
}
