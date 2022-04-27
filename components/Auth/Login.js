import Router from "next/router";

import { Button } from "react-bootstrap";

const Login = () => {
  return (
    <div className="overlay">
      <div className="overlay-content">
        <div className="overlay-heading">
          Welcome to the GraphQL tutorial app
        </div>
        <div className="overlay-message">Please login to continue</div>
        <div className="overlay-action">
          <Button
            id="qsLoginBtn"
            variant="primary"
            className="btn-margin loginBtn"
            onClick={() => {
              // router.push doesn't know how to handle the loading state while transitioning to an external route. This causes the script failed to load error 
              // Router.push('/api/login');
              window.location.assign("/api/login");
            }}
          >
            Log In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
