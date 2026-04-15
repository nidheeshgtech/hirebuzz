export type Category = {
  id: string
  label: string
  emoji: string
  keywords: string[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'teaching',
    label: 'Teaching',
    emoji: '📚',
    keywords: ['teacher', 'educator', 'tutor', 'lecturer', 'instructor', 'teaching', 'professor', 'trainer', 'academic'],
  },
  {
    id: 'engineering',
    label: 'Engineering & Tech',
    emoji: '⚙️',
    keywords: ['engineer', 'developer', 'programmer', 'software', 'devops', 'network', 'systems analyst', 'it support', 'data engineer', 'backend', 'frontend', 'fullstack'],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    emoji: '🏥',
    keywords: ['doctor', 'nurse', 'medical', 'pharmacist', 'dentist', 'surgeon', 'physician', 'therapist', 'clinical', 'radiologist', 'paramedic', 'health'],
  },
  {
    id: 'finance',
    label: 'Finance',
    emoji: '💼',
    keywords: ['accountant', 'finance', 'auditor', 'banker', 'financial', 'accounting', 'tax', 'treasury', 'investment', 'analyst', 'controller', 'bookkeeper'],
  },
  {
    id: 'hospitality',
    label: 'Hospitality',
    emoji: '🏨',
    keywords: ['hotel', 'chef', 'waiter', 'hospitality', 'restaurant', 'cook', 'barista', 'concierge', 'housekeeping', 'front desk', 'sous chef', 'pastry'],
  },
  {
    id: 'marketing',
    label: 'Marketing & Sales',
    emoji: '📣',
    keywords: ['marketing', 'sales', 'brand', 'social media', 'content', 'seo', 'advertising', 'copywriter', 'growth', 'crm', 'business development', 'account manager'],
  },
  {
    id: 'construction',
    label: 'Construction',
    emoji: '🏗️',
    keywords: ['civil', 'architect', 'construction', 'structural', 'quantity surveyor', 'site engineer', 'contractor', 'building', 'mep', 'foreman', 'draughtsman'],
  },
  {
    id: 'admin',
    label: 'Admin & HR',
    emoji: '🗂️',
    keywords: ['admin', 'human resources', 'receptionist', 'secretary', 'office manager', 'coordinator', 'personal assistant', 'clerk', 'hr manager', 'hr officer', 'recruitment'],
  },
]

/** Infer a category id from a job title. Returns 'general' if no match. */
export function deriveCategory(title: string): string {
  const lower = title.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return cat.id
    }
  }
  return 'general'
}
