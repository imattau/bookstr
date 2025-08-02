import React from 'react';
import { StatsCards } from '../components/StatsCards';
import { StatusChart, RatingChart } from '../components/StatsCharts';
import { useStatsData } from '../hooks/useStatsData';

const StatsPage: React.FC = () => {
  const { total, finished, reading, want, ratings } = useStatsData();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Stats</h1>
      <StatsCards total={total} finished={finished} reading={reading} want={want} />
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Reading Status</h2>
        <StatusChart finished={finished} reading={reading} want={want} />
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Ratings</h2>
        <RatingChart ratings={ratings} total={total} />
      </div>
    </div>
  );
};

export default StatsPage;
