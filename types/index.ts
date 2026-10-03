export interface UserProfile {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface NavItem {
  label: string
  href: string
  icon?: string
}
