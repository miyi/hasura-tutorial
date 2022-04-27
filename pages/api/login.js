import auth0 from "../../lib/auth0";

export default async function login(req, res) {
  try {
    await auth0.handleLogin(req, res);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).end(error.message);
  }
}

//the failed to load script error is caused by loading time while using router.push('/api/login')
//router.push doesn't know how to handle api loading state while transitioning to an external route, so the solution is to trigger the api route with window.location.assign('/api/auth/login')

// const delay = ms => new Promise(res => setTimeout(res, ms));

// export default async function login(req, res) {
//   await delay(5000)
//   res.status(200).json({ name: 'John Doe' })
// }
