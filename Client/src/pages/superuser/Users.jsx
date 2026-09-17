import { useEffect, useState } from 'react'
import * as usersApi from '../../api/users'
import { useAuth } from '../../context/AuthContext'
import Pagination from '../../components/Pagination'
import Spinner from '../../components/Spinner'

export default function SuperuserUsers() {
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = () => {
    setLoading(true)
    usersApi
      .listUsers({ page })
      .then(({ data }) => setResult(data))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  const handleToggle = async (u) => {
    setUpdatingId(u.id)
    setError('')
    try {
      await usersApi.updateUserRole(u.id, !u.is_staff)
      load()
    } catch (err) {
      setError(err.response?.data?.error || `Could not update ${u.email}'s role.`)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading && !result) return <Spinner />

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      {result && (
        <>
          <div className="panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Admin access</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`pill ${u.is_superuser ? 'pill-accent' : u.is_staff ? 'pill-accent' : 'pill-muted'}`}>
                          {u.is_superuser ? 'Superuser' : u.is_staff ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td>
                        {isSelf ? (
                          <span className="label">Can't change your own role</span>
                        ) : (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={u.is_staff}
                              disabled={updatingId === u.id}
                              onChange={() => handleToggle(u)}
                            />
                            {u.is_staff ? 'Admin' : 'Grant admin'}
                          </label>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            count={result.count}
            hasNext={!!result.next}
            hasPrevious={!!result.previous}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  )
}
