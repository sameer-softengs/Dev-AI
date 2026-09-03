function AuthForm({
  mode,
  authForm,
  authError,
  isAuthLoading,
  resetMode,
  resetForm,
  resetMessage,
  onModeChange,
  onInputChange,
  onSubmit,
  onResetModeChange,
  onResetInputChange,
  onForgotPassword,
  onResetPassword
}) {
  if (resetMode === 'request') {
    return (
      <section className="auth-panel form-panel">
        <button
          className="ghost-button"
          type="button"
          onClick={() => onResetModeChange('')}
          style={{ marginBottom: 16, alignSelf: 'flex-start' }}
        >
          Back to login
        </button>

        <form className="auth-form" onSubmit={onForgotPassword}>
          <h2>Reset your password</h2>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
            Enter your email address and we&apos;ll generate a reset token.
          </p>

          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={resetForm.email}
              onChange={onResetInputChange}
              placeholder="you@example.com"
              required
            />
          </label>

          {resetMessage ? <p className="message error">{resetMessage}</p> : null}

          <button className="primary-button" type="submit" disabled={isAuthLoading}>
            {isAuthLoading ? 'Please wait...' : 'Send reset token'}
          </button>
        </form>
      </section>
    );
  }

  if (resetMode === 'confirm') {
    return (
      <section className="auth-panel form-panel">
        <button
          className="ghost-button"
          type="button"
          onClick={() => {
            onResetModeChange('');
          }}
          style={{ marginBottom: 16, alignSelf: 'flex-start' }}
        >
          Back to login
        </button>

        <form className="auth-form" onSubmit={onResetPassword}>
          <h2>Set new password</h2>

          <label>
            <span>Reset token</span>
            <input
              name="token"
              value={resetForm.token}
              onChange={onResetInputChange}
              placeholder="Paste your reset token"
              required
            />
          </label>

          <label>
            <span>New password</span>
            <input
              name="newPassword"
              type="password"
              value={resetForm.newPassword}
              onChange={onResetInputChange}
              placeholder="Minimum 8 characters"
              required
            />
          </label>

          <label>
            <span>Confirm password</span>
            <input
              name="confirmPassword"
              type="password"
              value={resetForm.confirmPassword}
              onChange={onResetInputChange}
              placeholder="Repeat your new password"
              required
            />
          </label>

          {resetMessage ? <p className="message error">{resetMessage}</p> : null}

          <button className="primary-button" type="submit" disabled={isAuthLoading}>
            {isAuthLoading ? 'Please wait...' : 'Reset password'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="auth-panel form-panel">
      <div className="auth-toggle">
        <button
          className={mode === 'login' ? 'active' : ''}
          type="button"
          onClick={() => onModeChange('login')}
        >
          Login
        </button>
        <button
          className={mode === 'register' ? 'active' : ''}
          type="button"
          onClick={() => onModeChange('register')}
        >
          Create account
        </button>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        <h2>{mode === 'register' ? 'Create your workspace access' : 'Sign in to continue'}</h2>

        {mode === 'register' ? (
          <label>
            <span>Full name</span>
            <input
              name="name"
              value={authForm.name}
              onChange={onInputChange}
              placeholder="Sameer Ahmed"
              required
            />
          </label>
        ) : null}

        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={authForm.email}
            onChange={onInputChange}
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            value={authForm.password}
            onChange={onInputChange}
            placeholder="Minimum 8 characters"
            required
          />
        </label>

        {mode === 'login' ? (
          <button
            className="ghost-button"
            type="button"
            onClick={() => onResetModeChange('request')}
            style={{ alignSelf: 'flex-start', padding: '4px 8px', fontSize: '0.85rem' }}
          >
            Forgot password?
          </button>
        ) : null}

        {authError ? <p className="message error">{authError}</p> : null}

        <button className="primary-button" type="submit" disabled={isAuthLoading}>
          {isAuthLoading
            ? 'Please wait...'
            : mode === 'register'
              ? 'Create account'
              : 'Login'}
        </button>
      </form>
    </section>
  );
}

export default AuthForm;
