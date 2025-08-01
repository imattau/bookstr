/**
 * Root settings page listing links to individual settings sections.
 *
 * Utilises `Link` from `react-router-dom` for client-side navigation.
 */
import React from 'react';
import { Link } from 'react-router-dom';

const SettingsHome: React.FC = () => (
  <div className="space-y-2">
    <ul className="list-disc pl-4 space-y-1">
      <li>
        <Link to="/settings/profile" className="text-primary-600 underline">
          Profile
        </Link>
      </li>
      <li>
        <Link to="/settings/ui" className="text-primary-600 underline">
          Appearance
        </Link>
      </li>
      <li>
        <Link to="/settings/offline" className="text-primary-600 underline">
          Offline
        </Link>
      </li>
    </ul>
  </div>
);

export default SettingsHome;
