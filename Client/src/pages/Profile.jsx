import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <h1>Your profile</h1>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        <div className="form">
          <div className="field">
            <label>Full name</label>
            <span>{user.full_name}</span>
          </div>
          <div className="field">
            <label>Email</label>
            <span>{user.email}</span>
          </div>
          <div className="field">
            <label>Role</label>
            <span>
              {user.is_superuser ? 'Superuser' : user.is_staff ? 'Admin' : 'Customer'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
