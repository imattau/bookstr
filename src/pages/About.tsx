import React from 'react';

const AboutPage: React.FC = () => {
  const version = (import.meta as any).env?.VITE_APP_VERSION || '';
  const sha = (import.meta as any).env?.VITE_COMMIT_SHA || '';
  const buildDate = (import.meta as any).env?.VITE_BUILD_DATE || '';

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-sm text-text-muted">
        <p>Version: {version}</p>
        <p>Commit: {sha}</p>
        <p>Built: {buildDate}</p>
      </div>
      <p>
        Bookstr is open source.{' '}
        <a
          href="https://github.com/example/bookstr"
          className="text-blue-600 underline"
        >
          View on GitHub
        </a>
        .
      </p>
      <p>
        Licensed under the{' '}
        <a
          href="https://www.gnu.org/licenses/gpl-3.0.en.html"
          className="text-blue-600 underline"
        >
          GNU General Public License v3.0
        </a>
        .
      </p>
      <ul className="list-disc pl-4 space-y-1">
        <li>
          <a href="/privacy" className="text-blue-600 underline">
            Privacy Policy
          </a>
        </li>
        <li>
          <a href="/terms" className="text-blue-600 underline">
            Terms of Service
          </a>
        </li>
        <li>
          <a href="/contact" className="text-blue-600 underline">
            Contact &amp; Support
          </a>
        </li>
      </ul>
    </div>
  );
};

export default AboutPage;
