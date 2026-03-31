export default function AccountPanel({
  currentUser,
  currentServerLabel = '',
  currentServerUrl = '',
  manageServers = null,
  openAccountDialog,
  logoutUser,
}) {
  return (
    <div className="account-panel">
      <div className="inspector__section">
        <div className="inspector__title">User</div>
        <div className="inspector__name">{currentUser?.username || 'Unknown user'}</div>
      </div>

      <div className="inspector__section field-stack">
        <div className="inspector__title">Session</div>
        <button className="ghost-button" onClick={logoutUser} type="button">
          Logout
        </button>
      </div>

      {manageServers ? (
        <div className="inspector__section field-stack">
          <div className="inspector__title">Server</div>
          <div className="inspector__name">{currentServerLabel || 'No server selected'}</div>
          {currentServerUrl ? <div className="settings-panel__meta-row">{currentServerUrl}</div> : null}
          <button className="ghost-button" onClick={manageServers} type="button">
            Manage Servers
          </button>
        </div>
      ) : null}

      <div className="inspector__section field-stack">
        <div className="inspector__title">Manage</div>
        <button className="ghost-button" onClick={() => openAccountDialog('username')} type="button">
          Change Username
        </button>
        <button className="ghost-button" onClick={() => openAccountDialog('password')} type="button">
          Change Password
        </button>
        <button className="danger-button" onClick={() => openAccountDialog('delete-account')} type="button">
          Delete Account
        </button>
      </div>

      <div className="inspector__section inspector__footer">
        <div className="settings-panel__meta-row">
          <span>User ID</span>
          <strong>{currentUser?.id || 'n/a'}</strong>
        </div>
      </div>
    </div>
  )
}
