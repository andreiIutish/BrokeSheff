import { Redirect } from 'expo-router';

// This is the first screen the app loads.
// It immediately sends the user to the login screen.
// The login screen will handle checking if they're already logged in.
export default function Index() {
  return <Redirect href="/login" />;
}
