import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineMergeModal } from '../../src/components/OfflineMergeModal';

test('choosing remote keeps remote content', () => {
  const onResolve = jest.fn();
  render(
    <OfflineMergeModal localText="local" remoteText="remote" onResolve={onResolve} />,
  );
  fireEvent.click(screen.getByText('Keep Remote'));
  expect(onResolve).toHaveBeenCalledWith('remote');
});

test('choosing local keeps local content', () => {
  const onResolve = jest.fn();
  render(
    <OfflineMergeModal localText="local" remoteText="remote" onResolve={onResolve} />,
  );
  fireEvent.click(screen.getByText('Keep Local'));
  expect(onResolve).toHaveBeenCalledWith('local');
});

test('merge allows editing content', () => {
  const onResolve = jest.fn();
  render(
    <OfflineMergeModal localText="local" remoteText="remote" onResolve={onResolve} />,
  );
  fireEvent.click(screen.getByText('Merge'));
  const textarea = screen.getByLabelText('Merged content');
  fireEvent.change(textarea, { target: { value: 'merged' } });
  fireEvent.click(screen.getByText('Publish'));
  expect(onResolve).toHaveBeenCalledWith('merged');
});
