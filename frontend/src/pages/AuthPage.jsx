import AuthForm from '../components/AuthForm';
import AuthHero from '../components/AuthHero';

function AuthPage(props) {
  return (
    <div className="auth-shell">
      <AuthHero />
      <AuthForm {...props} />
    </div>
  );
}

export default AuthPage;
