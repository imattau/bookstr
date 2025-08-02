require('ts-node/register');
const assert = require('assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const esbuild = require('esbuild');
const vm = require('vm');
const path = require('path');

(async () => {
  const build = await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/screens/ReaderScreen.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    external: [
      'react',
      'react-router-dom',
      './src/nostr.tsx',
      './src/nostr/events.ts',
      './src/components/ReaderToolbar.tsx',
      './src/components/ProgressBar.tsx',
      './src/components/ReaderView.tsx',
      './src/components/ui/index.ts',
      './src/ThemeProvider.tsx',
      './src/store.ts',
    ],
  });
  const code = build.outputFiles[0].text;
  const module = { exports: {} };
  const progressCalls = [];
  const navigateCalls = [];
  let triggerPercent;
  const sandbox = {
    require: (p) => {
      if (p === 'react-router-dom') {
        return {
          useParams: () => ({ bookId: '1' }),
          useNavigate: () => (arg) => navigateCalls.push(arg),
        };
      }
      if (p === './src/nostr.tsx') {
        return { useNostr: () => ({}) };
      }
      if (p === './src/nostr/events.ts') {
        return {
          listChapters: async () => ({
            chapters: [
              { tags: [['title', 'First']] },
              { tags: [['title', 'Second']] },
            ],
          }),
          fetchLongPostParts: async () => '<p>content</p>',
        };
      }
      if (p === './src/components/ReaderToolbar.tsx') {
        return {
          ReaderToolbar: ({ title, onPrev, onNext, hasPrev, hasNext }) =>
            React.createElement(
              'div',
              {},
              React.createElement(
                'button',
                { onClick: onPrev, disabled: !hasPrev },
                'Prev',
              ),
              React.createElement('span', { 'data-testid': 'title' }, title),
              React.createElement(
                'button',
                { onClick: onNext, disabled: !hasNext },
                'Next',
              ),
            ),
        };
      }
      if (p === './src/components/ProgressBar.tsx') {
        return { ProgressBar: () => React.createElement('div') };
      }
      if (p === './src/components/ReaderView.tsx') {
        return {
          ReaderView: (props) => {
            triggerPercent = props.onPercentChange;
            return React.createElement('div');
          },
        };
      }
      if (p === './src/components/ui/index.ts') {
        return {
          Button: ({ onClick, children }) =>
            React.createElement('button', { onClick }, children),
        };
      }
      if (p === './src/ThemeProvider.tsx') {
        return { useTheme: () => ({ theme: 'default', setTheme: () => {} }) };
      }
      if (p === './src/store.ts') {
        return {
          useReadingStore: (sel) =>
            sel({
              updateProgress: (id, pct) => progressCalls.push([id, pct]),
              finishBook: () => {},
            }),
        };
      }
      if (p === 'react') {
        return React;
      }
      return require(p);
    },
    module,
    exports: module.exports,
    TextEncoder,
    TextDecoder,
    React,
  };
  vm.runInNewContext(code, sandbox, { filename: 'ReaderScreen.js' });
  const { ReaderScreen } = module.exports;

  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(ReaderScreen));
    await Promise.resolve();
  });
  await TestRenderer.act(async () => {
    await Promise.resolve();
  });

  await TestRenderer.act(async () => {
    triggerPercent(42);
    await Promise.resolve();
  });

  assert.deepStrictEqual(progressCalls, [['1', 42]], 'progress should update');

  await TestRenderer.act(async () => {
    const nextBtn = renderer.root
      .findAllByType('button')
      .find((b) => b.children.includes('Next'));
    nextBtn.props.onClick();
    await Promise.resolve();
  });
  await TestRenderer.act(async () => {
    await Promise.resolve();
  });
  const titleEl = renderer.root.findByProps({ 'data-testid': 'title' });
  assert.strictEqual(titleEl.children[0], 'Second', 'should show second chapter');

  await TestRenderer.act(async () => {
    const prevBtn = renderer.root
      .findAllByType('button')
      .find((b) => b.children.includes('Prev'));
    prevBtn.props.onClick();
    await Promise.resolve();
  });
  await TestRenderer.act(async () => {
    await Promise.resolve();
  });
  assert.strictEqual(titleEl.children[0], 'First', 'should show first chapter');

  console.log('All tests passed.');
})();
