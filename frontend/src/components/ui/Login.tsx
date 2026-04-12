import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, UserRound } from 'lucide-react'
import { setAuthToken, UserRole } from '../../utils/auth'

export function Login() {
	const navigate = useNavigate()
	const [username, setUsername] = useState('login')
	const [password, setPassword] = useState('password')
	const [role, setRole] = useState<UserRole>('forensic-investigator')
	const [error, setError] = useState('')

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError('')

		if (!username.trim() || !password.trim()) {
			setError('Username and password are required')
			return
		}

		// Set auth payload and route to role-specific module.
		setAuthToken({
			username: username.trim(),
			role,
			timestamp: Date.now()
		})

		navigate(role === 'forensic-auditor' ? '/verification' : '/dashboard', { replace: true })
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
					<h1 className="mt-2 text-2xl font-semibold text-white">Secure Access Gateway</h1>
					<p className="mt-2 text-sm text-slate-300">Authenticate to access evidence workflows and audit controls.</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="username" className="mb-1 block text-xs uppercase tracking-[0.12em] text-cyan-200/80">User ID</label>
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
						<label htmlFor="password" className="mb-1 block text-xs uppercase tracking-[0.12em] text-cyan-200/80">Access Key</label>
						<div className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-slate-900/80 px-3 py-2">
							<ShieldCheck className="h-4 w-4 text-cyan-300" />
							<input
								id="password"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								placeholder="Enter secure key"
								className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
								autoComplete="current-password"
							/>
						</div>
					</div>

					<div>
						<label htmlFor="role" className="mb-1 block text-xs uppercase tracking-[0.12em] text-cyan-200/80">Role</label>
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

					{error && (
						<div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
							{error}
						</div>
					)}

					<button
						type="submit"
						className="w-full rounded-xl bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
					>
						Enter Vigil Console
					</button>
				</form>
			</motion.div>
		</div>
	)
}

export default Login
