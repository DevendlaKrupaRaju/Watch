import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Login - WatchHub',
  description: 'Sign in to your WatchHub account',
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  )
}
