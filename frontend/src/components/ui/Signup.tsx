import { ChangeEvent, FormEvent, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, UserRound, Image as ImageIcon } from 'lucide-react'
import { UserRole } from '../../utils/auth'

interface SignupProps {
  onSignup: (payload: { username: string; password: string; role: UserRole; idImage: File }) => void
  onBackToLogin: () => void
}

export function Signup({ onSignup, onBackToLogin }: SignupProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('forensic-investigator')
  const [idImage, setIdImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setIdImage(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!idImage) {
      setError('Please upload an ID image')
      return
    }

    onSignup({
      username: username.trim(),
      password,
      role,
      idImage
    })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden rounded-3xl border border-cyan-400/20 bg-[linear-gradient(140deg,#030712_0%,#0b1220_55%,#111827_100%)] p-6 text-slate-100 shadow-[0_0_80px_rgba(8,145,178,0.12)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.18)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.14)_0%,transparent_38%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-400/25 bg-slate-950/90 p-6 shadow-[0_24px_60px_-35px_rgba(8,145,178,0.65)]"
      >
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Forensic OS</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Create Investigator Account</h1>
          <p className="mt-2 text-sm text-slate-300">Register with your forensic role and ID verification.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-xs uppercase tracking-[0.12em] text-cyan-200/80">
              User ID
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-slate-900/80 px-3 py-2">
              <UserRound className="h-4 w-4 text-cyan-300" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="investigator_01"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs uppercase tracking-[0.12em] text-cyan-200/80">
              Access Key
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-slate-900/80 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create secure key"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-xs uppercase tracking-[0.12em] text-cyan-200/80">
              Confirm Key
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-slate-900/80 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm secure key"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-xs uppercase tracking-[0.12em] text-cyan-200/80">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="w-full rounded-xl border border-cyan-400/20 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              <option value="forensic-investigator">Forensic Investigator</option>
              <option value="forensic-auditor">Forensic Auditor</option>
            </select>
          </div>

          <div>
            <label htmlFor="id-image" className="mb-1 block text-xs uppercase tracking-[0.12em] text-cyan-200/80">
              ID Image Verification
            </label>
            <div className="rounded-xl border-2 border-dashed border-cyan-400/30 bg-slate-900/40 p-4 transition hover:border-cyan-400/50">
              {previewUrl ? (
                <div className="flex flex-col items-center space-y-3">
                  <img
                    src={previewUrl}
                    alt="ID Preview"
                    className="h-32 w-32 rounded-lg border border-cyan-400/20 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-cyan-300 hover:text-cyan-200"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div
                  className="flex cursor-pointer flex-col items-center space-y-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-6 w-6 text-cyan-300" />
                  <p className="text-xs text-slate-300">Click to upload ID image</p>
                  <p className="text-[10px] text-slate-500">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                id="id-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Create Account
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full rounded-xl border border-cyan-400/30 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800/70"
          >
            Back to Login
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default Signup
