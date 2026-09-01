/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import '@testing-library/jest-dom';
import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from '@superset-ui/core/spec';
import TimeComparisonVisibility from '../src/AgGridTable/components/TimeComparisonVisibility';

const comparisonColumns = [
  { key: 'all', label: 'Display all' },
  { key: '#', label: '#' },
  { key: '△', label: '△' },
  { key: '%', label: '%' },
];

const renderVisibility = (selectedComparisonColumns: string[] = ['all']) => {
  const onSelectionChange = jest.fn();
  const { container } = render(
    <TimeComparisonVisibility
      comparisonColumns={comparisonColumns}
      selectedComparisonColumns={selectedComparisonColumns}
      onSelectionChange={onSelectionChange}
    />,
  );
  return { onSelectionChange, container };
};

const getMenuItem = (label: string) =>
  screen.getByText(label).closest('li') as HTMLElement;

const openDropdown = async (container: HTMLElement) => {
  const trigger = container.querySelector('span') as HTMLElement;
  await userEvent.click(trigger);
  await waitFor(() => expect(getMenuItem('Display all')).toBeVisible());
};

test('renders the trigger and opens the dropdown with all comparison columns', async () => {
  const { container } = renderVisibility();
  await openDropdown(container);

  expect(
    screen.getByText(
      'Select columns that will be displayed in the table. You can multiselect columns.',
    ),
  ).toBeInTheDocument();
  comparisonColumns.forEach(({ label }) => {
    expect(getMenuItem(label)).toBeInTheDocument();
  });
});

test('selecting "Display all" resets the selection to the all key', async () => {
  const { container, onSelectionChange } = renderVisibility(['#', '△']);
  await openDropdown(container);

  await userEvent.click(getMenuItem('Display all'));

  expect(onSelectionChange).toHaveBeenCalledWith(['all']);
});

test('selecting a single comparison column replaces the all key', async () => {
  const { container, onSelectionChange } = renderVisibility();
  await openDropdown(container);

  await userEvent.click(getMenuItem('#'));

  expect(onSelectionChange).toHaveBeenCalledWith(['#']);
});

test('selecting an additional comparison column appends to the selection', async () => {
  const { container, onSelectionChange } = renderVisibility(['#']);
  await openDropdown(container);

  await userEvent.click(getMenuItem('△'));

  expect(onSelectionChange).toHaveBeenCalledWith(['#', '△']);
});

test('clicking a selected comparison column deselects it', async () => {
  const { container, onSelectionChange } = renderVisibility(['#', '△']);
  await openDropdown(container);

  await userEvent.click(getMenuItem('#'));

  expect(onSelectionChange).toHaveBeenCalledWith(['△']);
});

test('returns to "Display all" on blur when every comparison column is selected', async () => {
  const { container, onSelectionChange } = renderVisibility(['#', '△', '%']);
  await openDropdown(container);

  fireEvent.focusOut(screen.getByRole('menu'));

  await waitFor(() => expect(onSelectionChange).toHaveBeenCalledWith(['all']));
});

test('shows a checkmark only for the active selections', async () => {
  const { container } = renderVisibility(['#', '%']);
  await openDropdown(container);

  const checkedLabels = comparisonColumns
    .filter(({ label }) => !!getMenuItem(label).querySelector('.anticon-check'))
    .map(({ label }) => label);

  expect(checkedLabels).toEqual(['#', '%']);
});
