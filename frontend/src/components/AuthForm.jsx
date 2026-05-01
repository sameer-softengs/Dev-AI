function AuthForm({
  mode,
  authForm,
  authError,
  isAuthLoading,
  onModeChange,
  onInputChange,
  onSubmit
}) {
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
