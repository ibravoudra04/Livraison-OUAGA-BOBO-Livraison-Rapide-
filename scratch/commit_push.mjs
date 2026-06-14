import { execSync } from 'child_process';

try {
  console.log("Adding changes...");
  execSync('git add .', { stdio: 'inherit' });
  console.log("Committing...");
  execSync('git commit -m "fix: resolve MapComponent bounds bug and enforce strict admin RLS"', { stdio: 'inherit' });
  console.log("Pushing to GitHub...");
  execSync('git push', { stdio: 'inherit' });
  console.log("Done!");
} catch (error) {
  console.error("Error during git operations:", error);
}
